/**
 * Server-side helper to send push notifications via ntfy.sh (or custom ntfy server).
 */
export async function sendNtfyNotification({
    title,
    message,
    priority = 'default',
    tags = [],
    click = 'https://mckellar.dev/email-logs/',
}: {
    title: string;
    message: string;
    priority?: 'min' | 'low' | 'default' | 'high' | 'urgent' | number;
    tags?: string[];
    click?: string;
}) {
    const topic = process.env.NTFY_TOPIC;
    if (!topic) {
        return;
    }

    const serverUrl = (process.env.NTFY_URL || process.env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/+$/, '');
    const url = `${serverUrl}/${encodeURIComponent(topic)}`;

    const headers: Record<string, string> = {
        'Content-Type': 'text/plain; charset=utf-8',
    };

    if (title) headers['Title'] = title;
    if (priority) headers['Priority'] = String(priority);
    if (tags.length > 0) headers['Tags'] = tags.join(',');
    if (click) headers['Click'] = click;

    if (process.env.NTFY_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.NTFY_TOKEN}`;
    } else if (process.env.NTFY_USER && process.env.NTFY_PASS) {
        const token = Buffer.from(`${process.env.NTFY_USER}:${process.env.NTFY_PASS}`).toString('base64');
        headers['Authorization'] = `Basic ${token}`;
    }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: message,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('[ntfy] Request failed:', res.status, text);
        }
    } catch (err) {
        console.error('[ntfy] Error sending push notification:', err);
    }
}
