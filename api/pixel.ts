import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerOpenEvent, registerSentEmail, getSentEmailByUid } from './_lib/kv';
import type { SentEmail } from './_lib/kv';
import { sendNtfyNotification } from './_lib/ntfy';
import { sendRetinaEmail } from './_lib/retinaEmail';

const GIF_BASE64 = 'R0lGODlhAQABAJAAAP8AAAAAACH5BAUQAAAALAAAAAABAAEAAAICBAEAOw==';
const GIF_BUFFER = Buffer.from(GIF_BASE64, 'base64');

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
    const n = getQueryParam(req, 'n') || undefined;
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

    // Suppress self-opens & compose/draft previews
    try {
        const sentEmail = await getSentEmailByUid(uid);
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
        const { isFirstOpen, isOpenSpike, isRevival, isSelfOpen, openCount } = await registerOpenEvent({
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

        if (isSelfOpen) {
            return servePixelResponse(res);
        }

        const sentEmail = await getSentEmailByUid(uid);

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

        const alertRecipient =
            sentEmail?.senderEmail ||
            process.env.RETINA_ALERT_EMAIL ||
            process.env.INQUIRY_EMAIL_TO ||
            'richard@mckellar.dev';
        const locationLabel = [city, country].filter(Boolean).join(', ') || 'unknown location';
        const dashboardUrl = 'https://mckellar.dev/email-logs/';

        const alerts: Promise<any>[] = [];

        // 1. Alert on FIRST OPEN
        if (isFirstOpen) {
            const htmlFirstOpen = `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                        <h2 style="margin-top: 0; color: #15803d; font-size: 20px; font-weight: 800;">
                            🔔 EMAIL OPENED
                        </h2>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Recipient:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${r}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Subject:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${s}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">IP Address:</strong> <code>${ipAddress}</code></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Location:</strong> ${locationLabel}</p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                        <div style="text-align: center;">
                            <a href="${dashboardUrl}" style="display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                                View Tracking Sheet
                            </a>
                        </div>
                    </div>
                </div>
            `;

            alerts.push(
                sendNtfyNotification({
                    title: `👁 Email Opened`,
                    message: `"${s}" opened by ${r} from ${locationLabel}`,
                    priority: 'high',
                    tags: ['email', 'eyes'],
                    click: dashboardUrl,
                }),
                sendRetinaEmail({
                    to: [alertRecipient],
                    subject: `🔔 FIRST OPEN: ${s} (to ${r})`,
                    html: htmlFirstOpen,
                })
            );
        }

        // 2. Alert on OPEN SPIKE (3+ opens in 10 minutes)
        if (isOpenSpike) {
            const htmlSpike = `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                    <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                        <h2 style="margin-top: 0; color: #c2410c; font-size: 20px; font-weight: 800;">
                            🔥 HOT PROSPECT SPIKE DETECTED!
                        </h2>
                        <hr style="border: 0; border-top: 1px solid #fed7aa; margin: 16px 0;" />
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a3412;">Activity:</strong> <span style="font-weight: bold; color: #7c2d12;">Opened 3+ times rapidly (Total: ${openCount} opens)</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a3412;">Recipient:</strong> <span style="font-weight: bold; color: #0f172a;">${r}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a3412;">Subject:</strong> <span style="font-weight: bold; color: #0f172a;">${s}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a3412;">Location:</strong> ${locationLabel}</p>
                        <hr style="border: 0; border-top: 1px solid #fed7aa; margin: 16px 0;" />
                        <div style="text-align: center;">
                            <a href="${dashboardUrl}" style="display: inline-block; background-color: #ea580c; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                                View Live Prospect Activity
                            </a>
                        </div>
                    </div>
                </div>
            `;

            alerts.push(
                sendNtfyNotification({
                    title: `🔥 HOT PROSPECT SPIKE!`,
                    message: `"${s}" opened 3+ times rapidly by ${r} (${locationLabel})`,
                    priority: 'urgent',
                    tags: ['fire', 'chart_with_upwards_trend'],
                    click: dashboardUrl,
                }),
                sendRetinaEmail({
                    to: [alertRecipient],
                    subject: `🔥 HOT PROSPECT SPIKE: ${s} (opened 3+ times by ${r})`,
                    html: htmlSpike,
                })
            );
        }

        // 3. Alert on EMAIL REVIVAL (reopened after 72+ hours of silence)
        if (isRevival) {
            const htmlRevival = `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                    <div style="background-color: #f5f3ff; border: 1px solid #ede9fe; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                        <h2 style="margin-top: 0; color: #6d28d9; font-size: 20px; font-weight: 800;">
                            ⚡ EMAIL REVIVED!
                        </h2>
                        <hr style="border: 0; border-top: 1px solid #ddd6fe; margin: 16px 0;" />
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #5b21b6;">Activity:</strong> <span style="font-weight: bold; color: #4c1d95;">Reopened after 3+ days of inactivity!</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #5b21b6;">Recipient:</strong> <span style="font-weight: bold; color: #0f172a;">${r}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #5b21b6;">Subject:</strong> <span style="font-weight: bold; color: #0f172a;">${s}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #5b21b6;">Location:</strong> ${locationLabel}</p>
                        <hr style="border: 0; border-top: 1px solid #ddd6fe; margin: 16px 0;" />
                        <div style="text-align: center;">
                            <a href="${dashboardUrl}" style="display: inline-block; background-color: #7c3aed; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                                View Reopened Thread
                            </a>
                        </div>
                    </div>
                </div>
            `;

            alerts.push(
                sendNtfyNotification({
                    title: `⚡ EMAIL REVIVED!`,
                    message: `"${s}" reopened by ${r} after 3+ days of silence`,
                    priority: 'high',
                    tags: ['zap', 'recycle'],
                    click: dashboardUrl,
                }),
                sendRetinaEmail({
                    to: [alertRecipient],
                    subject: `⚡ EMAIL REVIVED: ${s} (reopened by ${r})`,
                    html: htmlRevival,
                })
            );
        }

        // 4. Alert on EVERY REOPEN of a real email
        if (!isFirstOpen && !isOpenSpike && !isRevival) {
            const htmlReopen = `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                        <h2 style="margin-top: 0; color: #15803d; font-size: 20px; font-weight: 800;">
                            👀 EMAIL REOPENED
                        </h2>
                        <hr style="border: 0; border-top: 1px solid #bbf7d0; margin: 16px 0;" />
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Recipient:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${r}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Subject:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${s}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Total Opens:</strong> <span style="font-weight: bold; color: #0f172a;">${openCount} time${openCount !== 1 ? 's' : ''}</span></p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Location:</strong> ${locationLabel}</p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
                        <hr style="border: 0; border-top: 1px solid #bbf7d0; margin: 16px 0;" />
                        <div style="text-align: center;">
                            <a href="${dashboardUrl}" style="display: inline-block; background-color: #15803d; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                                View Tracking Sheet
                            </a>
                        </div>
                    </div>
                </div>
            `;

            alerts.push(
                sendNtfyNotification({
                    title: `👀 Email Reopened`,
                    message: `"${s}" reopened by ${r} (${openCount}x total) from ${locationLabel}`,
                    priority: 'default',
                    tags: ['eyes'],
                    click: dashboardUrl,
                }),
                sendRetinaEmail({
                    to: [alertRecipient],
                    subject: `👀 REOPENED (${openCount}x): ${s} (by ${r})`,
                    html: htmlReopen,
                })
            );
        }

        if (alerts.length > 0) {
            await Promise.allSettled(alerts);
        }
    } catch (err) {
        console.error('[Pixel API] Tracking open error:', err);
    }

    return servePixelResponse(res);
}
