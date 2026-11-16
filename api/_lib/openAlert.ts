/**
 * Inbox Retina — the one alert sent for each recorded email open.
 *
 * Mailtrack-style: every real open produces exactly one push + one email that says
 * WHO opened it, WHICH open it was (#1, #2, ...), and from what device/location.
 * Spike (3+ opens in 10 min) and revival (reopen after 72h) are labels on that same
 * alert rather than extra alerts, so one open never fans out into several notifications.
 *
 * Pure (no I/O). A copy lives at mycommercialfunding/lib/retina-open-alert.ts — keep them in sync.
 */

export interface OpenAlertInput {
    /** `r` pixel param: recipient address(es), comma-separated */
    recipient: string;
    /** `n` pixel param: display name(s), `|`-separated, same order as `recipient` */
    recipientName?: string;
    subject: string;
    openCount: number;
    isFirstOpen: boolean;
    isOpenSpike: boolean;
    isRevival: boolean;
    device?: string;
    os?: string;
    browser?: string;
    city?: string;
    country?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    dashboardUrl: string;
}

export interface OpenAlert {
    push: {
        title: string;
        message: string;
        priority: 'default' | 'high' | 'urgent';
        tags: string[];
        click: string;
    };
    email: { subject: string; html: string };
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Gmail and Yahoo fetch images through their own servers, so IP/location belong to Google/Yahoo, not the reader. */
export function isImageProxy(userAgent: string): boolean {
    return /GoogleImageProxy|googleapis|YahooMailProxy/i.test(userAgent);
}

/**
 * Turns the pixel's recipient params into a readable "who".
 * One pixel goes to every recipient of a message, so with several recipients we can
 * only say it was one of them — the same limit Mailtrack has.
 */
export function describeOpener(recipient: string, recipientName?: string): { full: string; short: string; count: number } {
    const emails = recipient.split(',').map((e) => e.trim()).filter(Boolean);
    const names = (recipientName || '').split('|').map((x) => x.trim());
    const people = emails.map((email, i) => {
        const name = names[i];
        return name && name.toLowerCase() !== email.toLowerCase() ? `${name} <${email}>` : email;
    });
    const shortOf = (i: number) => {
        const name = names[i];
        return name && name.toLowerCase() !== (emails[i] || '').toLowerCase() ? name : emails[i];
    };

    if (people.length === 0) return { full: 'Unknown recipient', short: 'Unknown recipient', count: 0 };
    if (people.length === 1) return { full: people[0], short: shortOf(0), count: 1 };
    return {
        full: `one of ${people.length} recipients: ${people.join(', ')}`,
        short: `${shortOf(0)} +${people.length - 1}`,
        count: people.length,
    };
}

export function buildOpenAlert(input: OpenAlertInput): OpenAlert {
    const who = describeOpener(input.recipient, input.recipientName);
    const viaProxy = isImageProxy(input.userAgent);
    const location = viaProxy
        ? 'Hidden (opened through Gmail/Yahoo image proxy)'
        : [input.city, input.country].filter(Boolean).join(', ') || 'Unknown location';
    const deviceLine = viaProxy
        ? 'Webmail'
        : [input.device, input.os].filter((x) => x && !/^Unknown/.test(x)).join(' · ') || 'Unknown device';
    const when = new Date(input.timestamp).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'medium',
        timeStyle: 'short',
    }) + ' ET';

    const kind = input.isFirstOpen
        ? { emoji: '🔔', label: 'First open', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', priority: 'high' as const, tags: ['email', 'eyes'] }
        : input.isOpenSpike
            ? { emoji: '🔥', label: 'Hot prospect: 3+ opens in 10 minutes', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', priority: 'urgent' as const, tags: ['fire'] }
            : input.isRevival
                ? { emoji: '⚡', label: 'Reopened after 3+ days of silence', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', priority: 'high' as const, tags: ['zap'] }
                : { emoji: '👀', label: 'Reopened', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', priority: 'default' as const, tags: ['eyes'] };

    const openLabel = `Open #${input.openCount}`;

    const push = {
        title: `${kind.emoji} Opened by ${who.short}`,
        message: `"${input.subject}"\n${openLabel} · ${kind.label}\n${deviceLine} · ${location}`,
        priority: kind.priority,
        tags: kind.tags,
        click: input.dashboardUrl,
    };

    const row = (label: string, value: string) =>
        `<p style="margin: 8px 0; font-size: 14px;"><strong style="color: #64748b;">${label}:</strong> <span style="color: #0f172a;">${value}</span></p>`;

    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <div style="background-color: ${kind.bg}; border: 1px solid ${kind.border}; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto;">
                <h2 style="margin: 0 0 4px; color: ${kind.color}; font-size: 20px; font-weight: 800;">${kind.emoji} ${escapeHtml(who.short)} opened your email</h2>
                <p style="margin: 0; font-size: 13px; color: ${kind.color}; font-weight: 600;">${openLabel} · ${escapeHtml(kind.label)}</p>
                <hr style="border: 0; border-top: 1px solid ${kind.border}; margin: 16px 0;" />
                ${row('Opened by', `<strong>${escapeHtml(who.full)}</strong>`)}
                ${row('Subject', `<strong>${escapeHtml(input.subject)}</strong>`)}
                ${row('Time', escapeHtml(when))}
                ${row('Device', escapeHtml(deviceLine))}
                ${row('Location', escapeHtml(location))}
                ${row('IP address', `<code>${escapeHtml(input.ipAddress)}</code>`)}
                <hr style="border: 0; border-top: 1px solid ${kind.border}; margin: 16px 0;" />
                <div style="text-align: center;">
                    <a href="${input.dashboardUrl}" style="display: inline-block; background-color: ${kind.color}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">View Tracking Sheet</a>
                </div>
            </div>
        </div>
    `;

    return {
        push,
        email: {
            subject: `${kind.emoji} ${who.short} opened "${input.subject}" (${openLabel})`,
            html,
        },
    };
}
