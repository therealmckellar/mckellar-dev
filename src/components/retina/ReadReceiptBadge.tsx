import type React from 'react';

// High-definition Retina Eye icon with glowing emerald iris (never renders as brown emoji blob)
export function RetinaEye({ className = "w-5 h-5 text-emerald-500", glow = false }: { className?: string; glow?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {glow && <circle cx="12" cy="12" r="10" fill="#10B981" fillOpacity="0.18" />}
            <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3.8" fill="#10B981" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="13.2" cy="10.8" r="1.3" fill="#FFFFFF" />
        </svg>
    );
}

interface ReadReceiptBadgeProps {
    openCount: number;
    clickCount?: number;
    isSpike?: boolean;
    isRevival?: boolean;
    hasFollowUp?: boolean;
    compact?: boolean;
    timeToFirstOpen?: string;
}

export const ReadReceiptBadge: React.FC<ReadReceiptBadgeProps> = ({
    openCount,
    clickCount = 0,
    isSpike = false,
    isRevival = false,
    hasFollowUp = false,
    compact = false,
    timeToFirstOpen,
}) => {
    // 1. Open Spike (Hot Prospect)
    if (isSpike) {
        return (
            <div className="inline-flex items-center gap-1.5">
                <span
                    className="inline-flex items-center gap-1 font-black text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-lg text-xs animate-pulse"
                    title={`🔥 Hot Prospect Spike: Opened ${openCount} times in rapid succession`}
                >
                    <span>🔥</span>
                    <span className="tracking-tighter font-extrabold text-blue-600 dark:text-blue-400">✓✓</span>
                    {!compact && <span>Hot Spike ({openCount})</span>}
                </span>
                {hasFollowUp && (
                    <span className="text-xs" title="Follow-up reminder set">
                        ⏰
                    </span>
                )}
            </div>
        );
    }

    // 2. Email Revival (Reopened after 3+ days)
    if (isRevival) {
        return (
            <div className="inline-flex items-center gap-1.5">
                <span
                    className="inline-flex items-center gap-1 font-black text-purple-700 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 px-2.5 py-1 rounded-lg text-xs"
                    title={`⚡ Email Revived: Reopened after 3+ days of silence`}
                >
                    <span>⚡</span>
                    <span className="tracking-tighter font-extrabold text-blue-600 dark:text-blue-400">✓✓</span>
                    {!compact && <span>Revived ({openCount})</span>}
                </span>
                {hasFollowUp && (
                    <span className="text-xs" title="Follow-up reminder set">
                        ⏰
                    </span>
                )}
            </div>
        );
    }

    // 3. Link Clicked
    if (clickCount > 0) {
        return (
            <div className="inline-flex items-center gap-1.5">
                <span
                    className="inline-flex items-center gap-1 font-black text-indigo-700 bg-indigo-50 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg text-xs"
                    title={`Clicked ${clickCount} link(s), opened ${openCount} time(s)`}
                >
                    <span className="tracking-tighter font-extrabold text-blue-600 dark:text-blue-400">✓✓</span>
                    <span>🔗</span>
                    {!compact && <span>Clicked ({clickCount})</span>}
                </span>
                {hasFollowUp && (
                    <span className="text-xs" title="Follow-up reminder set">
                        ⏰
                    </span>
                )}
            </div>
        );
    }

    // 4. Opened / Read
    if (openCount > 0) {
        return (
            <div className="inline-flex items-center gap-1.5">
                <span
                    className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg text-xs"
                    title={`Opened ${openCount} time(s)${timeToFirstOpen ? ` · First open in ${timeToFirstOpen}` : ''}`}
                >
                    <span className="tracking-tighter font-extrabold text-blue-600 dark:text-blue-400 text-sm leading-none">✓✓</span>
                    {!compact && <span>Read ({openCount})</span>}
                </span>
                {hasFollowUp && (
                    <span className="text-xs" title="Follow-up reminder set">
                        ⏰
                    </span>
                )}
            </div>
        );
    }

    // 5. Unread / Waiting
    return (
        <div className="inline-flex items-center gap-1.5">
            <span
                className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                title="Delivered to recipient, waiting to be opened"
            >
                <span className="tracking-tighter font-bold text-slate-400 dark:text-slate-500 text-sm leading-none">✓✓</span>
                {!compact && <span>Unread</span>}
            </span>
            {hasFollowUp && (
                <span className="text-xs text-amber-500" title="Follow-up reminder pending">
                    ⏰
                </span>
            )}
        </div>
    );
};
