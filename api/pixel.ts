import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerOpenEvent, registerSentEmail, getSentEmailByUid, parseUA } from './_lib/kv.js';
import type { SentEmail } from './_lib/kv.js';
import { sendNtfyNotification } from './_lib/ntfy.js';
import { sendRetinaEmail } from './_lib/retinaEmail.js';
import { buildOpenAlert } from './_lib/openAlert.js';

const GIF_BASE64 = 'R0lGODlhAQABAJAAAP8AAAAAACH5BAUQAAAALAAAAAABAAEAAAICBAEAOw==';
const GIF_BUFFER = Buffer.from(GIF_BASE64, 'base64');
const DASHBOARD_URL = 'https://mckellar.dev/email-logs/';

function getHeader(req: VercelRequest, name: string): string | undefined {
    const val = req.headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
    const val = req.query?.[key];
    if (Array.isArray(val)) return val[0];
    return val;
}

function servePixelResponse(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return res.status(200).send(GIF_BUFFER);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-retina-password, x-retina-sender, x-retina-email');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const r = getQueryParam(req, 'r') || 'Unknown';
    const n = getQueryParam(req, 'n') || undefined; // optional display name(s), `|`-separated, same order as r
    const s = getQueryParam(req, 's') || 'No Subject';
    const uid = getQueryParam(req, 'uid') || 'None';
    const registerSent = getQueryParam(req, 'register_sent');
    const src = (getQueryParam(req, 'src') || undefined) as SentEmail['source'];

    // 1. Check if this is a sent-email registration (from Outlook Add-in, Bookmarklet, or Generator)
    if (registerSent !== undefined) {
        try {
            const senderIp =
                getHeader(req, 'x-forwarded-for')?.split(',')[0].trim() ||
                getHeader(req, 'x-real-ip') ||
                '127.0.0.1';
            const senderEmail =
                getHeader(req, 'x-retina-sender') ||
                getQueryParam(req, 'sender') ||
                undefined;

            await registerSentEmail({
                timestamp: new Date().toISOString(),
                to: r,
                subject: s,
                uid,
                hasLinks: false,
                senderEmail,
                source: src,
                senderIp,
            });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(200).send('Registered-v2');
        } catch (err) {
            console.error('[Pixel API] Registration error:', err);
            return res.status(500).send('Error registering sent email');
        }
    }

    // 2. Otherwise, this is a tracking pixel load (Email Open)
    const timestamp = new Date().toISOString();
    const ipAddress =
        getHeader(req, 'x-forwarded-for')?.split(',')[0].trim() ||
        getHeader(req, 'x-real-ip') ||
        '127.0.0.1';
    const userAgent = getHeader(req, 'user-agent') || 'Unknown';

    const country = getHeader(req, 'x-vercel-ip-country') || undefined;
    const region = getHeader(req, 'x-vercel-ip-country-region') || undefined;
    const cityRaw = getHeader(req, 'x-vercel-ip-city');
    const city = cityRaw ? decodeURIComponent(cityRaw) : undefined;

    // Suppress self-opens (sender IP, e.g. viewing Sent Items) & compose/draft previews
    let sentEmail: SentEmail | null = null;
    try {
        sentEmail = await getSentEmailByUid(uid);
        if (sentEmail) {
            if (sentEmail.senderIp && sentEmail.senderIp === ipAddress) {
                return servePixelResponse(res);
            }
            const timeDiffSec = (new Date(timestamp).getTime() - new Date(sentEmail.timestamp).getTime()) / 1000;
            if (timeDiffSec >= 0 && timeDiffSec < 60) {
                return servePixelResponse(res);
            }
        }
    } catch (sentCheckErr) {
        console.error('[Pixel API] Error checking sent email record:', sentCheckErr);
    }

    try {
        const { recorded, isFirstOpen, isOpenSpike, isRevival, isSelfOpen, openCount } = await registerOpenEvent({
            timestamp,
            recipient: r,
            recipientName: n,
            subject: s,
            uid,
            ip_address: ipAddress,
            user_agent: userAgent,
            country,
            region,
            city,
        });

        // ─── Alert rules — Mailtrack-style: exactly ONE alert per real open ─────────
        //   ✅ Every recorded open → one push + one email naming who opened it and which open (#N)
        //      (first open / reopen / hot spike / revival are labels on that same alert)
        //   ❌ Repeat fetches of the same open (<60s, same IP or Gmail proxy) → not recorded, no alert
        //   ❌ Self-opens (sender IP) and draft previews → suppressed above
        //   ❌ Signature pixels → recorded for the dashboard, never alerted
        // ────────────────────────────────────────────────────────────────────────────
        if (!recorded || isSelfOpen) {
            return servePixelResponse(res);
        }

        // SIGNATURE PIXELS: NEVER send email/push alerts
        const isSignature =
            sentEmail?.source === 'signature' ||
            src === 'signature' ||
            uid.toUpperCase().startsWith('SIG-') ||
            r.toLowerCase().startsWith('signature') ||
            r.toLowerCase().includes('signature:') ||
            s.toLowerCase().includes('signature view') ||
            s.toLowerCase().startsWith('signature');

        if (isSignature) {
            return servePixelResponse(res);
        }

        const ua = parseUA(userAgent);
        const alert = buildOpenAlert({
            recipient: r,
            recipientName: n,
            subject: s,
            openCount,
            isFirstOpen,
            isOpenSpike,
            isRevival,
            device: ua.device,
            os: ua.os,
            browser: ua.browser,
            city,
            country,
            ipAddress,
            userAgent,
            timestamp,
            dashboardUrl: DASHBOARD_URL,
        });

        const alertRecipient =
            sentEmail?.senderEmail ||
            process.env.RETINA_ALERT_EMAIL ||
            process.env.INQUIRY_EMAIL_TO ||
            'richard@mckellar.dev';

        const results = await Promise.allSettled([
            sendNtfyNotification(alert.push),
            sendRetinaEmail({ to: [alertRecipient], subject: alert.email.subject, html: alert.email.html }),
        ]);
        for (const result of results) {
            if (result.status === 'rejected') console.error('[Pixel API] Alert delivery error:', result.reason);
            const value = result.status === 'fulfilled' ? (result.value as { ok?: boolean; error?: string } | undefined) : undefined;
            if (value && value.ok === false) console.error('[Pixel API] Alert email failed:', value.error);
        }
    } catch (err) {
        console.error('[Pixel API] Tracking open error:', err);
    }

    return servePixelResponse(res);
}
