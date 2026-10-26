export interface SentEmail {
    timestamp: string;
    to: string;
    subject: string;
    uid: string;
    hasLinks?: boolean;
    senderEmail?: string;
    source?: 'outlook' | 'compose' | 'generator' | 'signature';
    senderIp?: string;
    followUpDueAt?: string;
}

export interface FollowUpRule {
    uid: string;
    recipient: string;
    subject: string;
    senderEmail: string;
    createdAt: string;
    dueAt: string;
    hoursDelay: number;
    status: 'pending' | 'triggered' | 'cancelled_opened';
}

export interface OpenEvent {
    timestamp: string;
    recipient: string;
    recipientName?: string;
    subject: string;
    ip_address: string;
    user_agent: string;
    uid: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    city?: string;
}

export interface ShortLink {
    slug: string;
    url: string;
    name: string;
    created_at: string;
}

export interface ClickEvent {
    timestamp: string;
    slug: string;
    name: string;
    ip_address: string;
    user_agent: string;
    referrer: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    city?: string;
}

export interface EmailLinkClick {
    timestamp: string;
    url: string;
    ip_address: string;
    user_agent: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    city?: string;
    recipient?: string;
    recipientName?: string;
    subject?: string;
}

export interface FeedEvent {
    id: string;
    type: 'sent' | 'open' | 'click';
    timestamp: string;
    uid: string;
    recipient: string;
    recipientName?: string;
    subject: string;
    openType?: 'first_open' | 'reopen';
    url?: string;
    source?: string;
    device?: string;
    browser?: string;
    os?: string;
    location?: string;
    isSpike?: boolean;
    isRevival?: boolean;
    senderEmail?: string;
}

export interface RegisterOpenResult {
    isFirstOpen: boolean;
    isOpenSpike: boolean;
    isRevival: boolean;
    isSelfOpen?: boolean;
    openCount: number;
}

export interface UserAccount {
    email: string;
    password: string;
    createdAt: string;
    connectedEmails: string[];
}
