import * as net from 'node:net';
import type {
    SentEmail,
    FollowUpRule,
    OpenEvent,
    ShortLink,
    ClickEvent,
    EmailLinkClick,
    FeedEvent,
    RegisterOpenResult,
    UserAccount,
} from '../../src/lib/retinaTypes';

export type {
    SentEmail,
    FollowUpRule,
    OpenEvent,
    ShortLink,
    ClickEvent,
    EmailLinkClick,
    FeedEvent,
    RegisterOpenResult,
    UserAccount,
};

// Namespace all mckellar.dev Inbox Retina keys under "mckellar:retina:*"
// so mckellar.dev is 100% isolated from any other domain sharing the Redis instance.
const KEY_NAMESPACE = 'mckellar:';
const DEFAULT_TCP_REDIS_URL = 'redis://:MCF_Redis_retina_2026!@51.81.84.52:6379';

function encodeRespCommand(args: unknown[]): Buffer {
    const parts: Buffer[] = [Buffer.from(`*${args.length}\r\n`, 'utf8')];
    for (const arg of args) {
        const buf = Buffer.from(String(arg ?? ''), 'utf8');
        parts.push(Buffer.from(`$${buf.length}\r\n`, 'utf8'), buf, Buffer.from('\r\n', 'utf8'));
    }
    return Buffer.concat(parts);
}

function parseRespValue(buf: Buffer, offset = 0): { value: any; nextOffset: number } | null {
    if (offset >= buf.length) return null;
    const type = String.fromCharCode(buf[offset]);
    const lineEnd = buf.indexOf('\r\n', offset);
    if (lineEnd === -1) return null;
    const header = buf.subarray(offset + 1, lineEnd).toString('utf8');
    const afterHeader = lineEnd + 2;

    if (type === '+') return { value: header, nextOffset: afterHeader };
    if (type === '-') return { value: new Error(header), nextOffset: afterHeader };
    if (type === ':') return { value: parseInt(header, 10), nextOffset: afterHeader };
    if (type === '$') {
        const len = parseInt(header, 10);
        if (len === -1) return { value: null, nextOffset: afterHeader };
        const end = afterHeader + len;
        if (buf.length < end + 2) return null;
        return { value: buf.subarray(afterHeader, end).toString('utf8'), nextOffset: end + 2 };
    }
    if (type === '*') {
        const count = parseInt(header, 10);
        if (count === -1) return { value: null, nextOffset: afterHeader };
        const arr: any[] = [];
        let cur = afterHeader;
        for (let i = 0; i < count; i++) {
            const item = parseRespValue(buf, cur);
            if (!item) return null;
            arr.push(item.value);
            cur = item.nextOffset;
        }
        return { value: arr, nextOffset: cur };
    }
    return null;
}

function runTcpRedisCommand(redisUrlStr: string, command: unknown[]): Promise<any> {
    return new Promise((resolve, reject) => {
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(redisUrlStr);
        } catch (err) {
            return reject(err);
        }

        const host = parsedUrl.hostname || '127.0.0.1';
        const port = parseInt(parsedUrl.port || '6379', 10);
        const password = parsedUrl.password ? decodeURIComponent(parsedUrl.password) : '';
        const username = parsedUrl.username ? decodeURIComponent(parsedUrl.username) : '';

        const socket = net.createConnection({ host, port });
        let acc = Buffer.alloc(0);
        let settled = false;
        const expectedResponses = password ? 2 : 1;

        const finish = (err?: any, result?: any) => {
            if (settled) return;
            settled = true;
            try {
                socket.destroy();
            } catch {}
            if (err) reject(err);
            else resolve(result);
        };

        socket.setTimeout(4500, () => {
            finish(new Error('Redis TCP timeout'));
        });

        socket.on('error', (err) => {
            finish(err);
        });

        socket.on('connect', () => {
            const payloads: Buffer[] = [];
            if (password) {
                if (username && username !== 'default') {
                    payloads.push(encodeRespCommand(['AUTH', username, password]));
                } else {
                    payloads.push(encodeRespCommand(['AUTH', password]));
                }
            }
            payloads.push(encodeRespCommand(command));
            socket.write(Buffer.concat(payloads));
        });

        socket.on('data', (chunk: Buffer) => {
            acc = Buffer.concat([acc, chunk]);
            let offset = 0;
            const results: any[] = [];
            for (let i = 0; i < expectedResponses; i++) {
                const parsed = parseRespValue(acc, offset);
                if (!parsed) return; // wait for more TCP packets
                results.push(parsed.value);
                offset = parsed.nextOffset;
            }
            const finalVal = results[results.length - 1];
            if (finalVal instanceof Error) {
                finish(finalVal);
            } else {
                finish(undefined, finalVal);
            }
        });
    });
}

// Helper for calling Vercel KV REST API or TCP Redis fallback
export async function runRedisCommand(rawCommand: unknown[]): Promise<any> {
    const command = [...rawCommand];
    if (command.length >= 2 && typeof command[1] === 'string' && command[1].startsWith('retina:')) {
        command[1] = `${KEY_NAMESPACE}${command[1]}`;
    }

    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
        try {
            const res = await fetch(`${url}/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(command),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Redis REST error: ${res.status} - ${errText}`);
            }

            const data = (await res.json()) as { result: any };
            return data.result;
        } catch (err) {
            console.error(`[KV] REST error on "${command[0]}", trying TCP Redis fallback:`, err instanceof Error ? err.message : err);
        }
    }

    const tcpUrl = process.env.MCKELLAR_REDIS_URL || process.env.REDIS_URL || process.env.KV_URL || DEFAULT_TCP_REDIS_URL;
    if (tcpUrl) {
        try {
            return await runTcpRedisCommand(tcpUrl, command);
        } catch (err) {
            console.error(`[KV] TCP Redis error on "${command[0]}":`, err instanceof Error ? err.message : err);
        }
    }

    return getMemoryMock(command);
}

// In-memory mock storage fallback
const mockStore: Record<string, any> = {};
function getMemoryMock(command: unknown[]): any {
    const cmd = String(command[0]).toUpperCase();
    const key = String(command[1]);

    if (cmd === 'LPUSH') {
        if (!mockStore[key]) mockStore[key] = [];
        const items = command.slice(2);
        mockStore[key].unshift(...items);
        return mockStore[key].length;
    }
    if (cmd === 'LRANGE') {
        const arr = mockStore[key] || [];
        const start = Number(command[2]);
        const end = Number(command[3]);
        if (end === -1) return arr.slice(start);
        return arr.slice(start, end + 1);
    }
    if (cmd === 'LTRIM') {
        const arr = mockStore[key] || [];
        const start = Number(command[2]);
        const end = Number(command[3]);
        mockStore[key] = end === -1 ? arr.slice(start) : arr.slice(start, end + 1);
        return 'OK';
    }
    if (cmd === 'LLEN') {
        return (mockStore[key] || []).length;
    }
    if (cmd === 'HSET') {
        if (!mockStore[key]) mockStore[key] = {};
        const field = String(command[2]);
        const val = command[3];
        mockStore[key][field] = val;
        return 1;
    }
    if (cmd === 'HGET') {
        if (!mockStore[key]) return null;
        const field = String(command[2]);
        return mockStore[key][field] || null;
    }
    if (cmd === 'HGETALL') {
        if (!mockStore[key]) return {};
        const out: any[] = [];
        for (const [k, v] of Object.entries(mockStore[key])) {
            out.push(k, v);
        }
        return out;
    }
    if (cmd === 'HDEL') {
        if (!mockStore[key]) return 0;
        const field = String(command[2]);
        if (mockStore[key][field] !== undefined) {
            delete mockStore[key][field];
            return 1;
        }
        return 0;
    }
    return null;
}

const FEED_KEY = 'retina:feed';
const FEED_MAX_ITEMS = 500;

// Deterministic, zero-dependency User-Agent parser for Mailtrack-like device/OS/client capabilities
export function parseUA(uaString: string): { device: string; browser: string; os: string } {
    if (!uaString) {
        return { device: 'Desktop', browser: 'Unknown Browser', os: 'Unknown OS' };
    }
    const ua = uaString;

    // 1. Detect Device
    let device = 'Desktop';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
        device = 'Tablet';
    } else if (/iPhone/i.test(ua)) {
        device = 'Apple iPhone';
    } else if (/Mobile|Android|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        device = 'Mobile';
    }

    // 2. Detect OS
    let os = 'Unknown OS';
    const iosMatch = ua.match(/OS (\d+[_\d]*) like Mac OS X/i);
    const androidMatch = ua.match(/Android (\d+(?:\.\d+)?)/i);
    const macMatch = ua.match(/Mac OS X (\d+[_\d.]*)/i);
    if (iosMatch) {
        os = `iOS ${iosMatch[1].replace(/_/g, '.')}`;
    } else if (androidMatch) {
        os = `Android ${androidMatch[1]}`;
    } else if (/Windows NT 10\.0/i.test(ua)) {
        os = 'Windows 10/11';
    } else if (/Windows NT/i.test(ua)) {
        os = 'Windows';
    } else if (macMatch) {
        os = `macOS ${macMatch[1].replace(/_/g, '.')}`;
    } else if (/CrOS/i.test(ua)) {
        os = 'Chrome OS';
    } else if (/Linux/i.test(ua)) {
        os = 'Linux';
    }

    // 3. Detect Browser / Email Client
    let browser = 'Unknown Browser';
    if (/GoogleImageProxy/i.test(ua)) {
        browser = 'Gmail Image Proxy';
    } else if (/Outlook-iOS-Android/i.test(ua)) {
        browser = 'Outlook Mobile';
    } else if (/Microsoft Outlook|MSO/i.test(ua)) {
        browser = 'Microsoft Outlook';
    } else if (/Thunderbird\/(\d+(?:\.\d+)?)/i.test(ua)) {
        const m = ua.match(/Thunderbird\/(\d+(?:\.\d+)?)/i);
        browser = `Thunderbird ${m ? m[1] : ''}`.trim();
    } else if (/Edg\/(\d+(?:\.\d+)?)/i.test(ua)) {
        const m = ua.match(/Edg\/(\d+(?:\.\d+)?)/i);
        browser = `Edge ${m ? m[1] : ''}`.trim();
    } else if (/OPR\/(\d+(?:\.\d+)?)/i.test(ua)) {
        const m = ua.match(/OPR\/(\d+(?:\.\d+)?)/i);
        browser = `Opera ${m ? m[1] : ''}`.trim();
    } else if (/Chrome\/(\d+(?:\.\d+)?)/i.test(ua)) {
        const m = ua.match(/Chrome\/(\d+(?:\.\d+)?)/i);
        browser = `Chrome ${m ? m[1] : ''}`.trim();
    } else if (/Firefox\/(\d+(?:\.\d+)?)/i.test(ua)) {
        const m = ua.match(/Firefox\/(\d+(?:\.\d+)?)/i);
        browser = `Firefox ${m ? m[1] : ''}`.trim();
    } else if (/Version\/(\d+(?:\.\d+)?).*Safari/i.test(ua)) {
        const m = ua.match(/Version\/(\d+(?:\.\d+)?)/i);
        browser = `Safari ${m ? m[1] : ''}`.trim();
    } else if (/AppleWebKit/i.test(ua)) {
        browser = 'Apple Mail / WebKit';
    }

    return { device, browser, os };
}

// DB Methods
export async function registerSentEmail(email: SentEmail): Promise<void> {
    const sEmail = (email.senderEmail || '').toLowerCase().trim();
    const normalizedEmail: SentEmail = {
        ...email,
        senderEmail: sEmail || undefined,
    };
    const json = JSON.stringify(normalizedEmail);
    const commands: Promise<any>[] = [
        runRedisCommand(['LPUSH', 'retina:sent', json]),
        runRedisCommand(['HSET', `retina:sent:${email.uid}`, 'data', json]),
    ];

    if (sEmail) {
        commands.push(runRedisCommand(['LPUSH', `retina:sent:${sEmail}`, json]));
    }

    await Promise.all(commands);

    try {
        await pushFeedEvent({
            type: 'sent',
            timestamp: email.timestamp,
            uid: email.uid,
            recipient: email.to,
            subject: email.subject,
            source: email.source,
            senderEmail: sEmail || undefined,
        }, sEmail);
    } catch (err) {
        console.error('[KV] Error pushing sent event to feed:', err);
    }
}

export async function getSentEmailByUid(uid: string): Promise<SentEmail | null> {
    const json = await runRedisCommand(['HGET', `retina:sent:${uid}`, 'data']);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export async function getSentEmails(page?: number, pageSize?: number, senderEmails?: string | string[]): Promise<SentEmail[]> {
    if (senderEmails) {
        const emailList = (Array.isArray(senderEmails) ? senderEmails : [senderEmails])
            .map(e => e.toLowerCase().trim())
            .filter(Boolean);

        if (emailList.length === 1) {
            const userKey = `retina:sent:${emailList[0]}`;
            if (page !== undefined && pageSize !== undefined) {
                const start = (page - 1) * pageSize;
                const end = start + pageSize - 1;
                const list = await runRedisCommand(['LRANGE', userKey, start, end]);
                if (Array.isArray(list) && list.length > 0) {
                    return list.map(item => JSON.parse(item));
                }
            } else {
                const list = await runRedisCommand(['LRANGE', userKey, 0, -1]);
                if (Array.isArray(list) && list.length > 0) {
                    return list.map(item => JSON.parse(item));
                }
            }
        } else if (emailList.length > 1) {
            const fetches = emailList.map(e => runRedisCommand(['LRANGE', `retina:sent:${e}`, 0, -1]));
            const results = await Promise.all(fetches);
            const merged: SentEmail[] = [];
            for (const list of results) {
                if (Array.isArray(list)) {
                    for (const item of list) {
                        try { merged.push(JSON.parse(item)); } catch {}
                    }
                }
            }
            if (merged.length > 0) {
                const seen = new Set<string>();
                const deduped = merged
                    .filter(item => {
                        if (seen.has(item.uid)) return false;
                        seen.add(item.uid);
                        return true;
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                if (page !== undefined && pageSize !== undefined) {
                    const start = (page - 1) * pageSize;
                    return deduped.slice(start, start + pageSize);
                }
                return deduped;
            }
        }
    }

    if (page !== undefined && pageSize !== undefined && !senderEmails) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        const list = await runRedisCommand(['LRANGE', 'retina:sent', start, end]);
        if (!list || !Array.isArray(list)) return [];
        return list.map(item => JSON.parse(item));
    }
    const list = await runRedisCommand(['LRANGE', 'retina:sent', 0, -1]);
    if (!list || !Array.isArray(list)) return [];
    let items: SentEmail[] = list.map(item => JSON.parse(item));

    if (senderEmails) {
        const emailSet = new Set(
            (Array.isArray(senderEmails) ? senderEmails : [senderEmails]).map(e => e.toLowerCase().trim())
        );
        items = items.filter(i => i.senderEmail && emailSet.has(i.senderEmail.toLowerCase().trim()));
        if (page !== undefined && pageSize !== undefined) {
            const start = (page - 1) * pageSize;
            return items.slice(start, start + pageSize);
        }
    }

    return items;
}

export async function countSentEmails(senderEmails?: string | string[]): Promise<number> {
    if (senderEmails) {
        const emailList = (Array.isArray(senderEmails) ? senderEmails : [senderEmails])
            .map(e => e.toLowerCase().trim())
            .filter(Boolean);

        if (emailList.length === 1) {
            const count = await runRedisCommand(['LLEN', `retina:sent:${emailList[0]}`]);
            if (typeof count === 'number' && count > 0) return count;
        }
        const all = await getSentEmails(undefined, undefined, senderEmails);
        return all.length;
    }
    const count = await runRedisCommand(['LLEN', 'retina:sent']);
    return typeof count === 'number' ? count : 0;
}

export async function registerOpenEvent(event: OpenEvent): Promise<RegisterOpenResult> {
    const uaInfo = parseUA(event.user_agent);
    const enrichedEvent = {
        ...event,
        device: uaInfo.device,
        browser: uaInfo.browser,
        os: uaInfo.os,
    };

    const isGmailProxy = event.user_agent.includes('GoogleImageProxy') || event.user_agent.includes('googleapis');
    if (isGmailProxy) {
        const proxyCheckJson = await runRedisCommand(['HGET', 'retina:opens', event.uid]);
        const proxyOpens: OpenEvent[] = proxyCheckJson ? JSON.parse(proxyCheckJson) : [];
        if (proxyOpens.length > 0) {
            return {
                isFirstOpen: false,
                isOpenSpike: false,
                isRevival: false,
                openCount: proxyOpens.length,
            };
        }
    }

    const currentJson = await runRedisCommand(['HGET', 'retina:opens', event.uid]);
    const opens: OpenEvent[] = currentJson ? JSON.parse(currentJson) : [];
    const isFirstOpen = opens.length === 0;

    if (!isFirstOpen) {
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const isDuplicate = opens.some((existing) => {
            const existingTime = new Date(existing.timestamp).getTime();
            return existing.ip_address === event.ip_address && existingTime > fiveMinAgo;
        });
        if (isDuplicate) {
            return {
                isFirstOpen: false,
                isOpenSpike: false,
                isRevival: false,
                openCount: opens.length,
            };
        }
    }

    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    const recentOpens = opens.filter(o => new Date(o.timestamp).getTime() > tenMinAgo);
    const isOpenSpike = (recentOpens.length + 1) >= 3;

    let isRevival = false;
    if (!isFirstOpen && opens.length > 0) {
        const lastOpen = opens[opens.length - 1];
        const silenceMs = new Date(event.timestamp).getTime() - new Date(lastOpen.timestamp).getTime();
        isRevival = silenceMs >= (72 * 60 * 60 * 1000);
    }

    opens.push(enrichedEvent);
    await runRedisCommand(['HSET', 'retina:opens', event.uid, JSON.stringify(opens)]);

    if (isFirstOpen) {
        try {
            await cancelFollowUpRule(event.uid);
        } catch (err) {
            console.error('[KV] Error auto-cancelling follow-up rule on open:', err);
        }
    }

    let isSelfOpen = false;
    let sentRecord: SentEmail | null = null;
    try {
        sentRecord = await getSentEmailByUid(event.uid);
        if (sentRecord && sentRecord.senderIp && sentRecord.senderIp === event.ip_address) {
            const timeSinceSentMs = new Date(event.timestamp).getTime() - new Date(sentRecord.timestamp).getTime();
            if (timeSinceSentMs < 120000 && timeSinceSentMs >= 0) {
                isSelfOpen = true;
            }
        }
    } catch {}

    try {
        const isSig =
            sentRecord?.source === 'signature' ||
            event.uid.toUpperCase().startsWith('SIG-') ||
            event.recipient.toLowerCase().startsWith('signature') ||
            event.subject.toLowerCase().includes('signature view');

        if (!isSig) {
            const location = [event.city, event.region, event.country].filter(Boolean).join(', ');
            const sEmail = sentRecord?.senderEmail ? sentRecord.senderEmail.toLowerCase().trim() : undefined;
            await pushFeedEvent({
                type: 'open',
                timestamp: event.timestamp,
                uid: event.uid,
                recipient: event.recipient,
                recipientName: event.recipientName,
                subject: event.subject,
                openType: isFirstOpen ? 'first_open' : 'reopen',
                device: enrichedEvent.device,
                browser: enrichedEvent.browser,
                os: enrichedEvent.os,
                location: location || undefined,
                isSpike: isOpenSpike,
                isRevival: isRevival,
                senderEmail: sEmail,
            }, sEmail);
        }
    } catch (err) {
        console.error('[KV] Error pushing open event to feed:', err);
    }

    return {
        isFirstOpen,
        isOpenSpike,
        isRevival,
        isSelfOpen,
        openCount: opens.length,
    };
}

export async function getOpenEventsMap(): Promise<Record<string, OpenEvent[]>> {
    const raw = await runRedisCommand(['HGETALL', 'retina:opens']);
    const map: Record<string, OpenEvent[]> = {};
    if (!raw) return map;

    if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 2) {
            const uid = raw[i];
            const val = raw[i + 1];
            try {
                map[uid] = JSON.parse(val);
            } catch {
                map[uid] = [];
            }
        }
    } else if (typeof raw === 'object') {
        for (const [uid, val] of Object.entries(raw)) {
            try {
                map[uid] = JSON.parse(val as string);
            } catch {
                map[uid] = [];
            }
        }
    }
    return map;
}

export async function getOpenEventsForUid(uid: string): Promise<OpenEvent[]> {
    const json = await runRedisCommand(['HGET', 'retina:opens', uid]);
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

export async function createShortLink(link: ShortLink): Promise<void> {
    await runRedisCommand(['HSET', 'retina:links', link.slug, JSON.stringify(link)]);
}

export async function getShortLinks(): Promise<ShortLink[]> {
    const raw = await runRedisCommand(['HGETALL', 'retina:links']);
    const links: ShortLink[] = [];
    if (!raw) return links;

    if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 2) {
            try {
                links.push(JSON.parse(raw[i + 1]));
            } catch {}
        }
    } else if (typeof raw === 'object') {
        for (const val of Object.values(raw)) {
            try {
                links.push(JSON.parse(val as string));
            } catch {}
        }
    }
    return links;
}

export async function getShortLink(slug: string): Promise<ShortLink | null> {
    const json = await runRedisCommand(['HGET', 'retina:links', slug]);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export async function deleteShortLink(slug: string): Promise<void> {
    await runRedisCommand(['HDEL', 'retina:links', slug]);
    await runRedisCommand(['HDEL', 'retina:clicks', slug]);
}

export async function registerLinkClick(click: ClickEvent): Promise<void> {
    const uaInfo = parseUA(click.user_agent);
    const enrichedClick = {
        ...click,
        device: uaInfo.device,
        browser: uaInfo.browser,
        os: uaInfo.os,
    };

    const currentJson = await runRedisCommand(['HGET', 'retina:clicks', click.slug]);
    const clicks: ClickEvent[] = currentJson ? JSON.parse(currentJson) : [];
    clicks.push(enrichedClick);
    await runRedisCommand(['HSET', 'retina:clicks', click.slug, JSON.stringify(clicks)]);
}

export async function getLinkClicksMap(): Promise<Record<string, ClickEvent[]>> {
    const raw = await runRedisCommand(['HGETALL', 'retina:clicks']);
    const map: Record<string, ClickEvent[]> = {};
    if (!raw) return map;

    if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 2) {
            const slug = raw[i];
            const val = raw[i + 1];
            try {
                map[slug] = JSON.parse(val);
            } catch {
                map[slug] = [];
            }
        }
    } else if (typeof raw === 'object') {
        for (const [slug, val] of Object.entries(raw)) {
            try {
                map[slug] = JSON.parse(val as string);
            } catch {
                map[slug] = [];
            }
        }
    }
    return map;
}

export async function registerEmailLinkClick(
    uid: string,
    click: EmailLinkClick
): Promise<{ click: EmailLinkClick; isFirstClick: boolean }> {
    const uaInfo = parseUA(click.user_agent);
    const enrichedClick = {
        ...click,
        device: uaInfo.device,
        browser: uaInfo.browser,
        os: uaInfo.os,
    };

    const sentEmail = await getSentEmailByUid(uid);
    if (sentEmail) {
        enrichedClick.recipient = sentEmail.to;
        enrichedClick.subject = sentEmail.subject;
    }

    const currentJson = await runRedisCommand(['HGET', 'retina:email_clicks', uid]);
    const clicks: EmailLinkClick[] = currentJson ? JSON.parse(currentJson) : [];
    clicks.push(enrichedClick);
    await runRedisCommand(['HSET', 'retina:email_clicks', uid, JSON.stringify(clicks)]);

    const isFirstClick = clicks.length === 1;
    try {
        const location = [click.city, click.region, click.country].filter(Boolean).join(', ');
        const sEmail = sentEmail?.senderEmail ? sentEmail.senderEmail.toLowerCase().trim() : undefined;
        await pushFeedEvent({
            type: 'click',
            timestamp: click.timestamp,
            uid,
            recipient: enrichedClick.recipient || 'Unknown',
            subject: enrichedClick.subject || 'Link Click',
            url: click.url,
            source: sentEmail?.source,
            device: uaInfo.device,
            browser: uaInfo.browser,
            os: uaInfo.os,
            location: location || undefined,
            senderEmail: sEmail,
        }, sEmail);
    } catch (err) {
        console.error('[KV] Error pushing click event to feed:', err);
    }

    return { click: enrichedClick, isFirstClick };
}

export async function getEmailLinkClicksMap(): Promise<Record<string, EmailLinkClick[]>> {
    const raw = await runRedisCommand(['HGETALL', 'retina:email_clicks']);
    const map: Record<string, EmailLinkClick[]> = {};
    if (!raw) return map;

    if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 2) {
            const uid = raw[i];
            const val = raw[i + 1];
            try {
                map[uid] = JSON.parse(val);
            } catch {
                map[uid] = [];
            }
        }
    } else if (typeof raw === 'object') {
        for (const [uid, val] of Object.entries(raw)) {
            try {
                map[uid] = JSON.parse(val as string);
            } catch {
                map[uid] = [];
            }
        }
    }
    return map;
}

function makeFeedId(type: FeedEvent['type'], timestamp: string): string {
    return `${type}-${new Date(timestamp).getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function pushFeedEvent(event: Omit<FeedEvent, 'id'>, senderEmail?: string): Promise<void> {
    const sEmail = (senderEmail || event.senderEmail || '').toLowerCase().trim();
    const fullEvent: FeedEvent = {
        ...event,
        id: makeFeedId(event.type, event.timestamp),
        senderEmail: sEmail || undefined,
    };
    const json = JSON.stringify(fullEvent);

    const commands: Promise<any>[] = [
        runRedisCommand(['LPUSH', FEED_KEY, json]),
        runRedisCommand(['LTRIM', FEED_KEY, 0, FEED_MAX_ITEMS - 1]),
    ];

    if (sEmail) {
        const userFeedKey = `${FEED_KEY}:${sEmail}`;
        commands.push(
            runRedisCommand(['LPUSH', userFeedKey, json]),
            runRedisCommand(['LTRIM', userFeedKey, 0, FEED_MAX_ITEMS - 1]),
        );
    }

    await Promise.all(commands);
}

export async function getFeedEvents(limit = 50, senderEmails?: string | string[]): Promise<FeedEvent[]> {
    if (senderEmails) {
        const emailList = (Array.isArray(senderEmails) ? senderEmails : [senderEmails])
            .map(e => e.toLowerCase().trim())
            .filter(Boolean);

        if (emailList.length === 1) {
            const userFeedKey = `${FEED_KEY}:${emailList[0]}`;
            const list = await runRedisCommand(['LRANGE', userFeedKey, 0, Math.max(limit - 1, 0)]);
            if (Array.isArray(list) && list.length > 0) {
                return list
                    .map(item => {
                        try { return JSON.parse(item) as FeedEvent; } catch { return null; }
                    })
                    .filter((e): e is FeedEvent => e !== null);
            }
        } else if (emailList.length > 1) {
            const feedFetches = emailList.map(e => runRedisCommand(['LRANGE', `${FEED_KEY}:${e}`, 0, limit - 1]));
            const results = await Promise.all(feedFetches);
            const merged: FeedEvent[] = [];
            for (const list of results) {
                if (Array.isArray(list)) {
                    for (const item of list) {
                        try {
                            const parsed = JSON.parse(item) as FeedEvent;
                            if (parsed) merged.push(parsed);
                        } catch {}
                    }
                }
            }
            if (merged.length > 0) {
                const seen = new Set<string>();
                return merged
                    .filter(ev => {
                        if (seen.has(ev.id)) return false;
                        seen.add(ev.id);
                        return true;
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, limit);
            }
        }
    }

    const list = await runRedisCommand(['LRANGE', FEED_KEY, 0, Math.max(limit - 1, 0)]);
    if (!list || !Array.isArray(list)) return [];
    let parsedList = list
        .map(item => {
            try { return JSON.parse(item) as FeedEvent; } catch { return null; }
        })
        .filter((e): e is FeedEvent => e !== null);

    if (senderEmails) {
        const emailSet = new Set(
            (Array.isArray(senderEmails) ? senderEmails : [senderEmails]).map(e => e.toLowerCase().trim())
        );
        parsedList = parsedList.filter(e => e.senderEmail && emailSet.has(e.senderEmail.toLowerCase().trim()));
    }

    return parsedList;
}

export async function createFollowUpRule(rule: FollowUpRule): Promise<void> {
    await runRedisCommand(['HSET', 'retina:followups', rule.uid, JSON.stringify(rule)]);
}

export async function getFollowUpRule(uid: string): Promise<FollowUpRule | null> {
    const json = await runRedisCommand(['HGET', 'retina:followups', uid]);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export async function getFollowUpRules(): Promise<FollowUpRule[]> {
    const raw = await runRedisCommand(['HGETALL', 'retina:followups']);
    const rules: FollowUpRule[] = [];
    if (!raw) return rules;

    if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 2) {
            try {
                rules.push(JSON.parse(raw[i + 1]));
            } catch {}
        }
    } else if (typeof raw === 'object') {
        for (const val of Object.values(raw)) {
            try {
                rules.push(JSON.parse(val as string));
            } catch {}
        }
    }
    return rules;
}

export async function deleteFollowUpRule(uid: string): Promise<void> {
    await runRedisCommand(['HDEL', 'retina:followups', uid]);
}

export async function cancelFollowUpRule(uid: string): Promise<void> {
    const rule = await getFollowUpRule(uid);
    if (rule && rule.status === 'pending') {
        rule.status = 'cancelled_opened';
        await runRedisCommand(['HSET', 'retina:followups', uid, JSON.stringify(rule)]);
    }
}

export async function getUserAccount(email: string): Promise<UserAccount | null> {
    const key = email.toLowerCase().trim();
    const json = await runRedisCommand(['HGET', 'retina:users', key]);
    if (!json) return null;
    try {
        return JSON.parse(json) as UserAccount;
    } catch {
        return null;
    }
}

export async function createUserAccount(email: string, password: string): Promise<UserAccount> {
    const key = email.toLowerCase().trim();
    const existing = await getUserAccount(key);
    if (existing) {
        throw new Error('User account already exists with this email.');
    }

    const user: UserAccount = {
        email: key,
        password,
        createdAt: new Date().toISOString(),
        connectedEmails: [key],
    };

    await runRedisCommand(['HSET', 'retina:users', key, JSON.stringify(user)]);
    return user;
}

export async function addConnectedEmailToUser(accountEmail: string, newEmail: string): Promise<UserAccount | null> {
    const key = accountEmail.toLowerCase().trim();
    const user = await getUserAccount(key);
    if (!user) return null;

    const emailToAdd = newEmail.toLowerCase().trim();
    if (!user.connectedEmails.includes(emailToAdd)) {
        user.connectedEmails.push(emailToAdd);
        await runRedisCommand(['HSET', 'retina:users', key, JSON.stringify(user)]);
    }
    return user;
}
