import { RetinaEye } from './ReadReceiptBadge';
import { MousePointerClick, Flame, Zap, X } from './icons';

export interface ToastItem {
    id: string;
    type: 'sent' | 'open' | 'click';
    recipient: string;
    subject: string;
    location?: string;
    url?: string;
    isSpike?: boolean;
    isRevival?: boolean;
    timestamp: number;
}

interface RetinaToastProps {
    toasts: ToastItem[];
    onDismiss: (id: string) => void;
    darkMode?: boolean;
}

export function RetinaToastStack({ toasts, onDismiss, darkMode: _darkMode = false }: RetinaToastProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-right-5"
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        toast.isSpike ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' :
                        toast.isRevival ? 'bg-purple-100 dark:bg-purple-950 text-purple-600' :
                        toast.type === 'open' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' :
                        toast.type === 'click' ? 'bg-purple-50 dark:bg-purple-950 text-purple-600' :
                        'bg-blue-50 dark:bg-blue-950 text-blue-600'
                    }`}>
                        {toast.isSpike ? (
                            <Flame className="w-5 h-5 text-amber-600 animate-bounce" />
                        ) : toast.isRevival ? (
                            <Zap className="w-5 h-5 text-purple-600" />
                        ) : toast.type === 'open' ? (
                            <RetinaEye className="w-5 h-5 text-emerald-500" glow={true} />
                        ) : (
                            <MousePointerClick className="w-5 h-5 text-purple-600" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                toast.isSpike ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                toast.isRevival ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                                toast.type === 'open' ? 'bg-green-100 text-green-700 dark:bg-emerald-950 dark:text-emerald-300' :
                                'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            }`}>
                                {toast.isSpike ? '🔥 Open Spike' : toast.isRevival ? '⚡ Email Revived' : toast.type === 'open' ? 'Email Opened' : 'Link Clicked'}
                            </span>
                            <button
                                onClick={() => onDismiss(toast.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="font-black text-xs text-slate-800 dark:text-slate-100 mt-1 truncate">
                            {toast.recipient}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {toast.subject}
                        </p>
                        {toast.location && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                                📍 {toast.location}
                            </p>
                        )}
                        {toast.url && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5 truncate">
                                🔗 {toast.url}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
