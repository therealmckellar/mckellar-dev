import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getShortLink, registerLinkClick, registerEmailLinkClick, getSentEmailByUid } from './_lib/kv';
import { sendNtfyNotification } from './_lib/ntfy';
import { sendRetinaEmail } from './_lib/retinaEmail';

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

async function notifyFirstClick(
    uid: string,
    click: {
        url: string;
        recipient?: string;
        recipientName?: string;
        subject?: string;
        device?: string;
        browser?: string;
        os?: string;
        city?: string;
        country?: string;
    },
    ipAddress: string
) {
    let alertRecipient = process.env.RETINA_ALERT_EMAIL || process.env.INQUIRY_EMAIL_TO || 'richard@mckellar.dev';
    try {
        const sent = await getSentEmailByUid(uid);
        if (sent?.senderEmail) {
            alertRecipient = sent.senderEmail;
        }
    } catch {}

    const locationLabel = [click.city, click.country].filter(Boolean).join(', ') || 'unknown location';
    const when = new Date().toLocaleString();
    const dashboardUrl = 'https://mckellar.dev/email-logs/';

    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                <h2 style="margin-top: 0; color: #7c3aed; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                    🔗 LINK CLICKED
                </h2>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Recipient:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${click.recipient || 'Unknown'}</span></p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Subject:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${click.subject || '(no subject)'}</span></p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Clicked URL:</strong> <a href="${click.url}" style="color:#2563eb; font-weight: 600;">${click.url}</a></p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">IP Address:</strong> <code>${ipAddress}</code></p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Location:</strong> ${locationLabel}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Device:</strong> ${click.device || 'Desktop'} — ${click.browser || 'Unknown Browser'} / ${click.os || 'Unknown OS'}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">Time:</strong> ${when}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <div style="text-align: center;">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #7c3aed; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                        View Tracking Sheet
                    </a>
                </div>
            </div>
        </div>
    `;

    await Promise.allSettled([
        sendNtfyNotification({
            title: `🔗 LINK CLICKED`,
            message: `"${click.subject || 'an email'}" — ${click.recipient || 'someone'} clicked: ${click.url}`,
            priority: 'high',
            tags: ['link', 'arrow_right_hook'],
            click: dashboardUrl,
        }),
        sendRetinaEmail({
            to: [alertRecipient],
            subject: `🔗 LINK CLICKED: ${click.subject || '(no subject)'}`,
            html,
        }),
    ]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const id = getQueryParam(req, 'id');
    const uid = getQueryParam(req, 'uid');
    const urlParam = getQueryParam(req, 'url');

    const timestamp = new Date().toISOString();
    const ipAddress =
        getHeader(req, 'x-forwarded-for')?.split(',')[0].trim() ||
        getHeader(req, 'x-real-ip') ||
        '127.0.0.1';
    const userAgent = getHeader(req, 'user-agent') || 'Unknown';
    const referrer = getHeader(req, 'referer') || 'Direct';

    const country = getHeader(req, 'x-vercel-ip-country') || undefined;
    const region = getHeader(req, 'x-vercel-ip-country-region') || undefined;
    const cityRaw = getHeader(req, 'x-vercel-ip-city');
    const city = cityRaw ? decodeURIComponent(cityRaw) : undefined;

    // Scenario 1: Inside-Email Link Click (uid & url both present)
    if (uid && urlParam) {
        try {
            const { click: enrichedClick, isFirstClick } = await registerEmailLinkClick(uid, {
                timestamp,
                url: urlParam,
                ip_address: ipAddress,
                user_agent: userAgent,
                country,
                region,
                city,
            });

            if (isFirstClick) {
                await notifyFirstClick(uid, enrichedClick, ipAddress);
            }
        } catch (err) {
            console.error('[Link Redirector API] Error logging email click:', err);
        }

        return res.redirect(302, urlParam);
    }

    // Scenario 2: Standard Short Link (id/slug present)
    if (id) {
        try {
            const cleanId = id.replace(/^\/+|\/+$/g, '');
            const link = await getShortLink(cleanId);
            if (link) {
                await registerLinkClick({
                    timestamp,
                    slug: cleanId,
                    name: link.name,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    referrer,
                    country,
                    region,
                    city,
                });

                return res.redirect(302, link.url);
            }
        } catch (err) {
            console.error('[Link Redirector API] Error resolving short link:', err);
        }
    }

    return res.redirect(302, 'https://mckellar.dev/');
}
