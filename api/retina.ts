import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getUserAccount,
    createUserAccount,
    addConnectedEmailToUser,
    getSentEmails,
    getSentEmailByUid,
    getOpenEventsMap,
    getOpenEventsForUid,
    getEmailLinkClicksMap,
    getFeedEvents,
    registerSentEmail,
    getShortLinks,
    getShortLink,
    getLinkClicksMap,
    createShortLink,
    deleteShortLink,
    createFollowUpRule,
    getFollowUpRules,
    deleteFollowUpRule,
    runRedisCommand,
} from './_lib/kv.js';
import type { FollowUpRule } from './_lib/kv.js';
import { sendNtfyNotification } from './_lib/ntfy.js';
import { sendRetinaEmail } from './_lib/retinaEmail.js';

const ICON_BASE64: Record<string, string> = {
    '16': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEzSURBVDhPtVItT8RAEG3C7nHyZCUSiTyJRCJxd4rO1BwSyT9oQnansvIk8iQSefIkPwGJhLxZOmm3cCQkvGRF33z0vZkpiv/ALPK1j9x44ef0qHWRKc+botksnHDnhJ6c0N1JW13ioRhNfOSXItRlXpagxbT3oVrnoR5OaOmED7PH2/M8VrjIWy90k/M50ESVDIFCNBiRR4D5wKIR8P2TdMyg6FbzERfqKy+0MyJ5ry+GSSiCXy/84YXeRsNrNgvlerjIr6dtdWYEZIZqnYrTc4HuLdit5j7yu31jbdi9EUCoSyRZA6FlH4JaqLZcDASDMeILWJeP/ADPQ36ar35p/+1+c4S61L/nB2Wy8sAQaXi7id0eerbCBz3dwVbUCm5Ft/LbsaW/tLpaG6A23R5V91d8Albwkl4BkMQZAAAAAElFTkSuQmCC',
    '32': 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKGSURBVFhHtVcrcOMwEPVM7V5gYeHBg4UHDx48GJaiZtekgQfDCj1zY8nQ8GBhYWBgYeHBwMLC3uzKkqWN7Mit82Z2JpHX2tV+3spZ9kFcNOsfvmTtaiF1ZsVFXf4sFFa5wn+Fxve4wCHX2BYalrM5RIZzDc+BIYVvhcZdKHA4ckYhyP3SUd1fdZvzhnzyBh9yDd+lqsXln7tvuYZNoXDv3tP4QutSdxRFXd70oaawwkbqnIKJHL50e7zSf6kTBRmnF4z38PylWX+VOsmo7q9yDY9eWpZSJURdXnsnf5qrkKh4be2MpZAUOXd08rmMW+QK/9p00EHl8+xS4S+b80+FfQjtauGKWmElH2e21T7XOuMw9WVSEUTBnp5Df2a4olS49RaJvcTimcCMamzt3aJjsbq8CbRP4ENzgGrBMOk7p4EKzhaf1B0CE5UjGVPZlEapNwTbEfwOnaDbaCcVo2hXi+hAUviW2j2WF5hhi3p9a/5gKxVj6Nv1WFIpO6/hd+d0ReGAKQ5Yh2NCG0v9GKzNQkPTVyVRbwrq8toWkRQuyATQVHUO06g0EUjngP4EnsTYbQCu7Xk4ybZIBA0V4g2S5FHbwRWxbXsKv1lY30rluWHpmJxwi30hwmOgfQa40UwF6OAX1kQ2nIQxO5xPU0z7SdQ6AXTq4UjzvLY3Wz888yDgD3l6C6blLkSprJaC7pvC7HuKrIIeb/BBPp8KPrkjrsTI8t2+c4LylTpkAvB3hcm52SeN6h146HiUy+w1lDsPPN65oM3VPinsQ6DNetq0AgfuZYVbky5YskH+avLvCCy71PkwCnNpgSZ6DzgSeCWnZzEcAw8vU1hbMsS3G/4Nm9GPjgH8B2PAJButxBlmAAAAAElFTkSuQmCC',
    '80': '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',
};

function getMasterPassword(): string {
    return process.env.RETINA_PASSWORD || 'Funding2026!';
}

function getHeader(req: VercelRequest, name: string): string | undefined {
    const val = req.headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
    const val = req.query?.[key];
    if (Array.isArray(val)) return val.join('/');
    return val;
}

function parseBody(req: VercelRequest): any {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return {};
        }
    }
    return req.body;
}

async function checkAuthorized(req: VercelRequest): Promise<boolean> {
    const password = getHeader(req, 'x-retina-password');
    const email = (getHeader(req, 'x-retina-sender') || getHeader(req, 'x-retina-email') || '').toLowerCase().trim();

    if (password && password === getMasterPassword()) {
        return true;
    }
    if (email && password) {
        const user = await getUserAccount(email);
        if (user && user.password === password) {
            return true;
        }
    }
    return false;
}

function resolveSubRoute(req: VercelRequest): string {
    const fromQuery = getQueryParam(req, '__route');
    if (fromQuery) {
        return fromQuery.replace(/^\/+|\/+$/g, '');
    }
    const urlPath = (req.url || '').split('?')[0];
    const match = urlPath.match(/\/api\/retina\/?(.*)$/);
    return (match ? match[1] : '').replace(/^\/+|\/+$/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-retina-password, x-retina-sender, x-retina-email, x-retina-connected-emails');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const subRoute = resolveSubRoute(req);

    // 0. Static PNG icons for Outlook Add-in (/outlook/icon-16.png, icon-32.png, icon-80.png)
    if (subRoute === 'icon') {
        const size = getQueryParam(req, 'size') || '32';
        const b64 = ICON_BASE64[size] || ICON_BASE64['32'];
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.status(200).send(Buffer.from(b64, 'base64'));
    }

    // 1. /api/retina/auth
    if (subRoute === 'auth') {
        if (req.method === 'GET') {
            const isAuth = await checkAuthorized(req);
            if (!isAuth) {
                return res.status(401).json({ authenticated: false, error: 'Unauthorized' });
            }
            const email = (getHeader(req, 'x-retina-email') || getHeader(req, 'x-retina-sender') || '').toLowerCase().trim();
            if (email) {
                const user = await getUserAccount(email);
                if (user) {
                    return res.status(200).json({
                        authenticated: true,
                        user: { email: user.email, connectedEmails: user.connectedEmails },
                    });
                }
            }
            return res.status(200).json({ authenticated: true, isMaster: true });
        }

        if (req.method === 'POST') {
            try {
                const body = parseBody(req);
                const headerPassword = getHeader(req, 'x-retina-password');
                const headerEmail = getHeader(req, 'x-retina-email');

                const email = (body.email || headerEmail || '').toLowerCase().trim();
                const password = body.password || headerPassword || '';
                const action = body.action || (email ? 'login' : 'master_check');

                if (!email && password === getMasterPassword()) {
                    return res.status(200).json({ authenticated: true, isMaster: true });
                }

                if (action === 'signup') {
                    if (!email || !password) {
                        return res.status(400).json({ authenticated: false, error: 'Email and password are required for sign up.' });
                    }
                    if (password.length < 6) {
                        return res.status(400).json({ authenticated: false, error: 'Password must be at least 6 characters long.' });
                    }
                    try {
                        const newUser = await createUserAccount(email, password);
                        return res.status(200).json({
                            authenticated: true,
                            user: { email: newUser.email, connectedEmails: newUser.connectedEmails },
                        });
                    } catch (err: any) {
                        return res.status(400).json({ authenticated: false, error: err?.message || 'Error creating user account.' });
                    }
                }

                if (action === 'connect_email') {
                    const newEmail = (body.newEmail || '').toLowerCase().trim();
                    if (!email || !newEmail) {
                        return res.status(400).json({ authenticated: false, error: 'User email and new email to connect are required.' });
                    }
                    let updatedUser = await addConnectedEmailToUser(email, newEmail);
                    if (!updatedUser) {
                        await createUserAccount(email, password || getMasterPassword());
                        updatedUser = await addConnectedEmailToUser(email, newEmail);
                    }
                    if (!updatedUser) {
                        return res.status(404).json({ authenticated: false, error: 'Account not found.' });
                    }
                    return res.status(200).json({
                        authenticated: true,
                        user: { email: updatedUser.email, connectedEmails: updatedUser.connectedEmails },
                    });
                }

                if (email && password) {
                    const user = await getUserAccount(email);
                    if (user) {
                        if (user.password === password || password === getMasterPassword()) {
                            return res.status(200).json({
                                authenticated: true,
                                user: { email: user.email, connectedEmails: user.connectedEmails },
                            });
                        }
                        return res.status(401).json({ authenticated: false, error: 'Incorrect password.' });
                    } else if (password === getMasterPassword()) {
                        const newUser = await createUserAccount(email, password);
                        return res.status(200).json({
                            authenticated: true,
                            user: { email: newUser.email, connectedEmails: newUser.connectedEmails },
                        });
                    }
                    return res.status(404).json({ authenticated: false, error: 'Account not found. Please click "Sign Up" to create your account.' });
                }

                if (headerPassword === getMasterPassword()) {
                    return res.status(200).json({ authenticated: true, isMaster: true });
                }

                return res.status(401).json({ authenticated: false, error: 'Invalid credentials.' });
            } catch (err) {
                console.error('[Retina Auth API] Error:', err);
                return res.status(500).json({ authenticated: false, error: 'Internal server error' });
            }
        }
    }

    // 2. /api/retina/logs
    if (subRoute === 'logs' && req.method === 'GET') {
        if (!(await checkAuthorized(req))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const page = parseInt(getQueryParam(req, 'page') || '1', 10);
            const pageSize = parseInt(getQueryParam(req, 'pageSize') || '50', 10);
            const senderEmail = (getHeader(req, 'x-retina-sender') || getHeader(req, 'x-retina-email') || '').toLowerCase().trim();
            const connectedHeader = getHeader(req, 'x-retina-connected-emails');

            const emails: string[] = [];
            if (senderEmail) emails.push(senderEmail);
            if (connectedHeader) {
                try {
                    if (connectedHeader.startsWith('[')) {
                        const parsed = JSON.parse(connectedHeader);
                        if (Array.isArray(parsed)) {
                            emails.push(...parsed.map((e: any) => String(e).toLowerCase().trim()));
                        }
                    } else {
                        emails.push(...connectedHeader.split(',').map(e => e.toLowerCase().trim()));
                    }
                } catch {
                    emails.push(...connectedHeader.split(',').map(e => e.toLowerCase().trim()));
                }
            }

            const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));
            const allSent = uniqueEmails.length > 0
                ? await getSentEmails(undefined, undefined, uniqueEmails)
                : await getSentEmails();

            const totalSent = allSent.length;
            const start = (page - 1) * pageSize;
            const paginatedSent = allSent.slice(start, start + pageSize);

            const [allOpens, allClicks] = await Promise.all([
                getOpenEventsMap(),
                getEmailLinkClicksMap(),
            ]);

            const userUids = new Set(allSent.map(e => e.uid));
            const filteredOpens: Record<string, any> = {};
            for (const [uid, val] of Object.entries(allOpens)) {
                if (userUids.has(uid)) filteredOpens[uid] = val;
            }

            const filteredClicks: Record<string, any> = {};
            for (const [uid, val] of Object.entries(allClicks)) {
                if (userUids.has(uid)) filteredClicks[uid] = val;
            }

            return res.status(200).json({
                sent: paginatedSent,
                totalSent,
                page,
                pageSize,
                totalPages: Math.max(Math.ceil(totalSent / pageSize), 1),
                opens: filteredOpens,
                emailClicks: filteredClicks,
            });
        } catch (err) {
            console.error('[Retina Logs API] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 3. /api/retina/feed
    if (subRoute === 'feed' && req.method === 'GET') {
        if (!(await checkAuthorized(req))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const limit = Math.min(Math.max(parseInt(getQueryParam(req, 'limit') || '50', 10), 1), 200);
            const emailHeader = (getHeader(req, 'x-retina-email') || getHeader(req, 'x-retina-sender') || '').toLowerCase().trim();
            const connectedHeader = getHeader(req, 'x-retina-connected-emails');

            const emails: string[] = [];
            if (emailHeader) emails.push(emailHeader);
            if (connectedHeader) {
                try {
                    if (connectedHeader.startsWith('[')) {
                        const parsed = JSON.parse(connectedHeader);
                        if (Array.isArray(parsed)) {
                            emails.push(...parsed.map((e: any) => String(e).toLowerCase().trim()));
                        }
                    } else {
                        emails.push(...connectedHeader.split(',').map(e => e.toLowerCase().trim()));
                    }
                } catch {
                    emails.push(...connectedHeader.split(',').map(e => e.toLowerCase().trim()));
                }
            }

            const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));
            const events = uniqueEmails.length > 0
                ? await getFeedEvents(limit, uniqueEmails)
                : await getFeedEvents(limit);

            return res.status(200).json({ events, count: events.length });
        } catch (err) {
            console.error('[Retina Feed API] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 4. /api/retina/status (Outlook Add-in Sent item open/click lookup)
    if (subRoute === 'status' && req.method === 'GET') {
        const uidParam = getQueryParam(req, 'uid')?.trim();
        const subject = getQueryParam(req, 'subject')?.trim();
        const to = getQueryParam(req, 'to')?.trim();

        try {
            let uid = uidParam || '';
            if (!uid && subject) {
                const all = await getSentEmails();
                const subjectLc = subject.toLowerCase();
                const toLc = (to || '').toLowerCase();
                const match = all.find((e) => {
                    const subjOk = (e.subject || '').toLowerCase() === subjectLc;
                    if (!subjOk) return false;
                    if (!toLc) return true;
                    return (e.to || '').toLowerCase().includes(toLc);
                });
                uid = match?.uid || '';
            }

            if (!uid) {
                return res.status(200).json({ found: false, openCount: 0, clickCount: 0 });
            }

            const sent = await getSentEmailByUid(uid);
            if (!sent && !uidParam) {
                return res.status(200).json({ found: false, openCount: 0, clickCount: 0 });
            }

            const opens = await getOpenEventsForUid(uid);
            const clickMap = await getEmailLinkClicksMap();
            const clicks = clickMap[uid] || [];

            return res.status(200).json({\n                found: true,
                uid,
                subject: sent?.subject,
                to: sent?.to,
                senderEmail: sent?.senderEmail,
                timestamp: sent?.timestamp,
                source: sent?.source,
                openCount: opens.length,
                clickCount: clicks.length,
                firstOpen: opens[0]?.timestamp,
                lastOpen: opens[opens.length - 1]?.timestamp,
                opens: opens.slice(-5),
                clicks: clicks.slice(-5),
            });
        } catch (err) {
            console.error('[Retina Status API] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 5. /api/retina/send (Quick Send & Auto-Track)
    if (subRoute === 'send' && req.method === 'POST') {
        if (!(await checkAuthorized(req))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const { to, subject, message } = parseBody(req);
            if (!to || !subject || !message) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const senderEmail = getHeader(req, 'x-retina-sender') || getHeader(req, 'x-retina-email') || 'richard@mckellar.dev';
            const uid = `m-${Date.now()}`;
            const timestamp = new Date().toISOString();
            const proto = getHeader(req, 'x-forwarded-proto') || 'https';
            const host = getHeader(req, 'host') || 'mckellar.dev';
            const origin = `${proto}://${host}`;

            const urlRegex = /(https?:\/\/[^\s<"'\\(\)]+)/g;
            let hasLinks = false;
            let htmlBody = String(message).replace(/\n/g, '<br />');

            const rawUrls: string[] = String(message).match(urlRegex) || [];
            const urlSet = new Set<string>();
            rawUrls.forEach((u) => urlSet.add(u.replace(/[.,!?;:)]+$/, '')));
            const urls = Array.from(urlSet);

            if (urls.length > 0) {
                hasLinks = true;
                urls.forEach((url) => {
                    const encodedUrl = encodeURIComponent(url);
                    const trackingUrl = `${origin}/l.php?uid=${uid}&url=${encodedUrl}`;
                    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const replaceRegex = new RegExp(escapeRegExp(url), 'g');
                    htmlBody = htmlBody.replace(
                        replaceRegex,
                        `<a href="${trackingUrl}" style="color: #2563eb; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${url}</a>`
                    );
                });
            }

            const pixelUrl = `${origin}/pixel.php?r=${encodeURIComponent(to)}&s=${encodeURIComponent(subject)}&uid=${uid}&src=compose&sender=${encodeURIComponent(senderEmail)}`;
            const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none !important;" />`;

            const fullHtml = `
                <html>
                    <body style="margin:0; padding:0; font-family:Arial, sans-serif; color:#334155;">
                        <div style="font-size:16px; line-height:1.6; max-width:600px;">
                            ${htmlBody}
                        </div>
                        ${pixelHtml}
                    </body>
                </html>
            `;

            const sendResult = await sendRetinaEmail({
                to: [to],
                subject,
                html: fullHtml,
                replyTo: senderEmail,
            });

            if (!sendResult.ok) {
                return res.status(400).json({ error: sendResult.error || 'Failed to send email' });
            }

            const senderIp =
                getHeader(req, 'x-forwarded-for')?.split(',')[0].trim() ||
                getHeader(req, 'x-real-ip') ||
                '127.0.0.1';

            await registerSentEmail({
                timestamp,
                to,
                subject,
                uid,
                hasLinks,
                senderEmail,
                source: 'compose',
                senderIp,
            });

            return res.status(200).json({
                success: true,
                uid,
                messageId: sendResult.id,
            });
        } catch (err) {
            console.error('[Retina Send API] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 6. /api/retina/links (Branded Short Links & QR Manager)
    if (subRoute === 'links') {
        if (!(await checkAuthorized(req))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            if (req.method === 'GET') {
                const [links, clicks] = await Promise.all([
                    getShortLinks(),
                    getLinkClicksMap(),
                ]);
                return res.status(200).json({ links, clicks });
            }

            if (req.method === 'POST') {
                const { slug, url, name } = parseBody(req);
                if (!slug || !url) {
                    return res.status(400).json({ error: 'Slug and URL are required' });
                }
                const cleanSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9\-_/]/g, '');
                if (!cleanSlug) {
                    return res.status(400).json({ error: 'Invalid slug' });
                }
                await createShortLink({
                    slug: cleanSlug,
                    url: String(url).trim(),
                    name: String(name || cleanSlug).trim(),
                    created_at: new Date().toISOString(),
                });
                return res.status(200).json({ success: true, slug: cleanSlug });
            }

            if (req.method === 'PUT') {
                const { slug, url, name } = parseBody(req);
                if (!slug || !url) {
                    return res.status(400).json({ error: 'Slug and URL are required' });
                }
                const existing = await getShortLink(slug);
                if (!existing) {
                    return res.status(404).json({ error: 'Link not found' });
                }
                await createShortLink({
                    slug,
                    url: String(url).trim(),
                    name: String(name || existing.name || slug).trim(),
                    created_at: existing.created_at || new Date().toISOString(),
                });
                return res.status(200).json({ success: true });
            }

            if (req.method === 'DELETE') {
                const { slug } = parseBody(req);
                if (!slug) {
                    return res.status(400).json({ error: 'Slug is required' });
                }
                await deleteShortLink(slug);
                return res.status(200).json({ success: true });
            }
        } catch (err) {
            console.error('[Retina Links API] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 7. /api/retina/follow-ups
    if (subRoute === 'follow-ups') {
        if (!(await checkAuthorized(req))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            if (req.method === 'GET') {
                const rules = await getFollowUpRules();
                return res.status(200).json({ rules, count: rules.length });
            }

            if (req.method === 'POST') {
                const { uid, recipient, subject, senderEmail, hoursDelay } = parseBody(req);
                if (!uid || !recipient || !hoursDelay) {
                    return res.status(400).json({ error: 'Missing required fields: uid, recipient, hoursDelay' });
                }
                const createdAt = new Date().toISOString();
                const dueAt = new Date(Date.now() + Number(hoursDelay) * 60 * 60 * 1000).toISOString();
                const rule: FollowUpRule = {
                    uid,
                    recipient,
                    subject: subject || 'No Subject',
                    senderEmail: senderEmail || 'richard@mckellar.dev',
                    createdAt,
                    dueAt,
                    hoursDelay: Number(hoursDelay),
                    status: 'pending',
                };
                await createFollowUpRule(rule);
                return res.status(200).json({ success: true, rule });
            }

            if (req.method === 'DELETE') {
                const uid = getQueryParam(req, 'uid');
                if (!uid) {
                    return res.status(400).json({ error: 'Missing uid parameter' });
                }
                await deleteFollowUpRule(uid);
                return res.status(200).json({ success: true, uid });
            }
        } catch (err) {
            console.error('[Retina Follow-ups API] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 8. /api/retina/cron/follow-ups
    if (subRoute === 'cron/follow-ups' && req.method === 'GET') {
        const authHeader = getHeader(req, 'authorization');
        const cronSecret = process.env.CRON_SECRET;
        const isCronAuth = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

        if (!(await checkAuthorized(req)) && !isCronAuth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const rules = await getFollowUpRules();
            const now = Date.now();
            const pendingDue = rules.filter(r => r.status === 'pending' && new Date(r.dueAt).getTime() <= now);

            let triggeredCount = 0;
            let cancelledCount = 0;
            const dashboardUrl = 'https://mckellar.dev/email-logs/';

            for (const rule of pendingDue) {
                const opens = await getOpenEventsForUid(rule.uid);
                if (opens && opens.length > 0) {
                    const updated: FollowUpRule = { ...rule, status: 'cancelled_opened' };
                    await createFollowUpRule(updated);
                    cancelledCount++;
                } else {
                    const updated: FollowUpRule = { ...rule, status: 'triggered' };
                    await createFollowUpRule(updated);
                    triggeredCount++;

                    const html = `
                        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                            <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                                <h2 style="margin-top: 0; color: #a16207; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                    ⏰ FOLLOW-UP REMINDER
                                </h2>
                                <hr style="border: 0; border-top: 1px solid #fef08a; margin: 16px 0;" />
                                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #854d0e;">Status:</strong> <span style="font-size: 15px; font-weight: bold; color: #b45309;">Email Unopened after ${rule.hoursDelay} hours</span></p>
                                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #854d0e;">Recipient:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${rule.recipient}</span></p>
                                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #854d0e;">Subject:</strong> <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${rule.subject}</span></p>
                                <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #854d0e;">Sent At:</strong> ${new Date(rule.createdAt).toLocaleString()}</p>
                                <hr style="border: 0; border-top: 1px solid #fef08a; margin: 16px 0;" />
                                <div style="text-align: center;">
                                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #ca8a04; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                                        View Tracking Sheet & Follow Up
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;

                    await Promise.allSettled([
                        sendNtfyNotification({
                            title: `⏰ Follow-up Reminder: ${rule.subject}`,
                            message: `Unopened for ${rule.hoursDelay}h — Follow up with ${rule.recipient}`,
                            priority: 'high',
                            tags: ['alarm_clock', 'envelope'],
                            click: dashboardUrl,
                        }),
                        sendRetinaEmail({
                            to: [rule.senderEmail || 'richard@mckellar.dev'],
                            subject: `⏰ FOLLOW-UP REMINDER: ${rule.subject} (unopened by ${rule.recipient})`,
                            html,
                        }),
                    ]);
                }
            }

            return res.status(200).json({
                success: true,
                evaluated: pendingDue.length,
                triggered: triggeredCount,
                cancelled: cancelledCount,
            });
        } catch (err) {
            console.error('[Retina Follow-up Cron] Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 9. /api/retina/diagnostics
    if (subRoute === 'diagnostics') {
        if (req.method === 'GET') {
            return res.status(200).json({ ok: true, service: 'retina-diagnostics', domain: 'mckellar.dev' });
        }
        if (req.method === 'POST') {
            const body = parseBody(req);
            console.error('[Client Diagnostic]', JSON.stringify({
                source: body.source || 'unknown-client',
                message: body.message || 'No message',
                stack: body.stack || '',
                context: body.context || {},
                userAgent: getHeader(req, 'user-agent') || 'Unknown',
                ip: getHeader(req, 'x-forwarded-for')?.split(',')[0].trim() || 'unknown',
                time: new Date().toISOString(),
            }));
            return res.status(200).json({ ok: true });
        }
    }

    // 10. /api/retina/migrate
    if (subRoute === 'migrate' && req.method === 'POST') {
        if (!(await checkAuthorized(req))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const allSent = await getSentEmails();
            let migratedSentCount = 0;

            for (const email of allSent) {
                const sender = (email.senderEmail || '').toLowerCase().trim();
                if (sender) {
                    await runRedisCommand(['LPUSH', `retina:sent:${sender}`, JSON.stringify(email)]);
                    migratedSentCount++;
                }
            }

            const allFeed = await getFeedEvents(500);
            let migratedFeedCount = 0;

            for (const event of allFeed) {
                let sender = (event.senderEmail || '').toLowerCase().trim();
                if (!sender && event.uid) {
                    const sentRecord = await getSentEmailByUid(event.uid);
                    sender = (sentRecord?.senderEmail || '').toLowerCase().trim();
                }
                if (sender) {
                    const enrichedEvent = { ...event, senderEmail: sender };
                    await runRedisCommand(['LPUSH', `retina:feed:${sender}`, JSON.stringify(enrichedEvent)]);
                    migratedFeedCount++;
                }
            }

            return res.status(200).json({
                success: true,
                totalSentScanned: allSent.length,
                migratedSentCount,
                totalFeedScanned: allFeed.length,
                migratedFeedCount,
            });
        } catch (err: any) {
            console.error('[Retina Migrate API] Error:', err);
            return res.status(500).json({ error: err?.message || 'Internal Server Error' });
        }
    }

    return res.status(404).json({ error: `Unknown Retina endpoint: ${subRoute}` });
}
