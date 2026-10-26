import { useState } from 'react';
import type { FeedEvent } from '../../lib/retinaTypes';
import { RetinaEye } from './ReadReceiptBadge';
import { MousePointerClick, Send, Flame, Zap, X, MapPin, Globe, Monitor, Copy, Check } from './icons';

interface EventDetailsModalProps {
    event: FeedEvent | null;
    onClose: () => void;
    darkMode?: boolean;
}

export function EventDetailsModal({ event, onClose, darkMode: _darkMode = false }: EventDetailsModalProps) {
    const [copied, setCopied] = useState(false);

    if (!event) return null;

    const copyUid = () => {
        if (event.uid) {
            navigator.clipboard.writeText(event.uid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className={`p-6 flex items-center justify-between border-b ${
                    event.isSpike ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' :
                    event.isRevival ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900' :
                    event.type === 'open' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900' :
                    event.type === 'click' ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900' :
                    'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
                            event.isSpike ? 'bg-amber-500 text-white' :
                            event.isRevival ? 'bg-purple-600 text-white' :
                            event.type === 'open' ? 'bg-emerald-500 text-white' :
                            event.type === 'click' ? 'bg-purple-600 text-white' :
                            'bg-blue-600 text-white'
                        }`}>
                            {event.isSpike ? <Flame className="w-6 h-6 animate-bounce" /> :
                             event.isRevival ? <Zap className="w-6 h-6" /> :
                             event.type === 'open' ? <RetinaEye className="w-6 h-6 text-white" glow={true} /> :
                             event.type === 'click' ? <MousePointerClick className="w-6 h-6" /> :
                             <Send className="w-6 h-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-full shadow-xs">
                                    {event.isSpike ? '🔥 Hot Open Spike' : event.isRevival ? '⚡ Email Revived' : event.type === 'open' ? 'Email Opened' : event.type === 'click' ? 'Link Clicked' : 'Email Sent'}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">
                                {event.recipientName || event.recipient}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Subject & Recipient */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Subject Line</span>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{event.subject}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recipient Email</span>
                                <p className="font-bold text-xs text-blue-600 dark:text-blue-400 truncate">{event.recipient}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Timestamp</span>
                                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    {new Date(event.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Click Details */}
                    {event.type === 'click' && event.url && (
                        <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-900">
                            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block mb-1">
                                🎯 Clicked Target Link
                            </span>
                            <a
                                href={event.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-black text-xs text-purple-700 dark:text-purple-300 hover:underline break-all"
                            >
                                {event.url}
                            </a>
                        </div>
                    )}

                    {/* Visitor Location & IP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                                <MapPin className="w-4 h-4" />
                                <span>Geolocation</span>
                            </div>
                            <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                                📍 {event.location || 'Location Pending'}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-wider">
                                <Globe className="w-4 h-4" />
                                <span>Network Info</span>
                            </div>
                            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                IP: {event.uid ? `Logged (${event.location || 'Resolved'})` : 'Registered'}
                            </p>
                        </div>
                    </div>

                    {/* Device & Technology Stack */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                            <Monitor className="w-4 h-4" />
                            <span>Client Environment</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Device</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                                    {event.device || 'Desktop'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Browser</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate" title={event.browser}>
                                    {event.browser || 'Email Client'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">OS</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate" title={event.os}>
                                    {event.os || 'Unknown OS'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Metadata */}
                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate max-w-[280px]">
                            UID: {event.uid}
                        </span>
                        <button
                            onClick={copyUid}
                            className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline text-xs"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied' : 'Copy UID'}</span>
                        </button>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
