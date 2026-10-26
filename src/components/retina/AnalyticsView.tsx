import { useMemo } from 'react';
import type { SentEmail, OpenEvent, EmailLinkClick } from '../../lib/retinaTypes';
import { Smartphone, Monitor, Tablet, Globe, Clock, TrendingUp, Layers } from './icons';

interface AnalyticsViewProps {
    sentEmails: SentEmail[];
    opensMap: Record<string, OpenEvent[]>;
    clicksMap: Record<string, EmailLinkClick[]>;
    darkMode?: boolean;
}

export function AnalyticsView({ sentEmails, opensMap, clicksMap, darkMode: _darkMode = false }: AnalyticsViewProps) {
    // Aggregate opens
    const allOpens = useMemo(() => {
        return Object.values(opensMap).flat();
    }, [opensMap]);

    // Aggregate link clicks
    const allClicks = useMemo(() => {
        return Object.values(clicksMap).flat();
    }, [clicksMap]);

    // Device breakdown
    const deviceStats = useMemo(() => {
        let desktop = 0;
        let mobile = 0;
        let tablet = 0;
        const unknown = 0;

        allOpens.forEach(op => {
            const dev = (op.device || '').toLowerCase();
            if (dev.includes('mobile') || dev.includes('phone') || dev.includes('ios') || dev.includes('android')) {
                mobile++;
            } else if (dev.includes('tablet') || dev.includes('ipad')) {
                tablet++;
            } else if (dev.includes('desktop') || dev.includes('mac') || dev.includes('windows')) {
                desktop++;
            } else {
                desktop++;
            }
        });

        const total = desktop + mobile + tablet + unknown || 1;
        return {
            desktop,
            mobile,
            tablet,
            desktopPct: Math.round((desktop / total) * 100),
            mobilePct: Math.round((mobile / total) * 100),
            tabletPct: Math.round((tablet / total) * 100),
            totalOpens: allOpens.length,
        };
    }, [allOpens]);

    // OS breakdown
    const osStats = useMemo(() => {
        const counts: Record<string, number> = {};
        allOpens.forEach(op => {
            const os = op.os || 'Unknown OS';
            counts[os] = (counts[os] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const total = allOpens.length || 1;
        return sorted.map(([name, count]) => ({
            name,
            count,
            pct: Math.round((count / total) * 100)
        }));
    }, [allOpens]);

    // Browser / Client breakdown
    const clientStats = useMemo(() => {
        const counts: Record<string, number> = {};
        allOpens.forEach(op => {
            const browser = op.browser || 'Unknown';
            counts[browser] = (counts[browser] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const total = allOpens.length || 1;
        return sorted.map(([name, count]) => ({
            name,
            count,
            pct: Math.round((count / total) * 100)
        }));
    }, [allOpens]);

    // Hourly Heatmap (0 - 23 hours)
    const hourlyStats = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
        allOpens.forEach(op => {
            const d = new Date(op.timestamp);
            const h = d.getHours();
            if (hours[h]) hours[h].count++;
        });
        const maxCount = Math.max(...hours.map(h => h.count), 1);
        return hours.map(h => ({
            ...h,
            pct: Math.round((h.count / maxCount) * 100),
            label: h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`
        }));
    }, [allOpens]);

    // Speed to Open Breakdown
    const speedStats = useMemo(() => {
        let under5m = 0;
        let under1h = 0;
        let under24h = 0;
        let over24h = 0;

        sentEmails.forEach(email => {
            const opens = opensMap[email.uid];
            if (opens && opens.length > 0 && email.timestamp) {
                const diffMins = (new Date(opens[0].timestamp).getTime() - new Date(email.timestamp).getTime()) / 60000;
                if (diffMins <= 5) under5m++;
                else if (diffMins <= 60) under1h++;
                else if (diffMins <= 1440) under24h++;
                else over24h++;
            }
        });

        const totalOpened = under5m + under1h + under24h + over24h || 1;
        return [
            { label: '⚡ Within 5 mins (Immediate)', count: under5m, pct: Math.round((under5m / totalOpened) * 100), color: 'bg-emerald-500' },
            { label: '🕒 5 - 60 mins (Same Hour)', count: under1h, pct: Math.round((under1h / totalOpened) * 100), color: 'bg-blue-500' },
            { label: '📅 1 - 24 hours (Same Day)', count: under24h, pct: Math.round((under24h / totalOpened) * 100), color: 'bg-indigo-500' },
            { label: '⏳ 24+ hours later', count: over24h, pct: Math.round((over24h / totalOpened) * 100), color: 'bg-amber-500' },
        ];
    }, [sentEmails, opensMap]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                Deep Sales Intelligence
                            </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">Engagement & Behavior Analytics</h2>
                        <p className="text-blue-100 text-sm mt-1 max-w-xl">
                            Analyze client devices, peak reading hours, and time-to-open distributions to optimize your sales outreach.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[110px]">
                            <span className="text-xs font-bold text-blue-200 block uppercase">Total Opens</span>
                            <span className="text-3xl font-black">{allOpens.length}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[110px]">
                            <span className="text-xs font-bold text-blue-200 block uppercase">Link Clicks</span>
                            <span className="text-3xl font-black">{allClicks.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 1: Device Breakdown & Speed to Open */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Device Breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-blue-600" />
                            <span>Client Device Split</span>
                        </h3>
                        <span className="text-xs font-bold text-slate-400 uppercase">
                            {deviceStats.totalOpens} Total Opens
                        </span>
                    </div>

                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${deviceStats.desktopPct}%` }} className="bg-blue-600 h-full transition-all" title={`Desktop: ${deviceStats.desktopPct}%`} />
                            <div style={{ width: `${deviceStats.mobilePct}%` }} className="bg-emerald-500 h-full transition-all" title={`Mobile: ${deviceStats.mobilePct}%`} />
                            <div style={{ width: `${deviceStats.tabletPct}%` }} className="bg-purple-500 h-full transition-all" title={`Tablet: ${deviceStats.tabletPct}%`} />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-blue-50 dark:bg-slate-800/60 rounded-2xl border border-blue-100 dark:border-slate-700">
                                <div className="flex justify-center mb-1"><Monitor className="w-5 h-5 text-blue-600" /></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Desktop</span>
                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{deviceStats.desktopPct}%</p>
                                <span className="text-xs text-slate-500">{deviceStats.desktop} opens</span>
                            </div>
                            <div className="p-4 bg-emerald-50 dark:bg-slate-800/60 rounded-2xl border border-emerald-100 dark:border-slate-700">
                                <div className="flex justify-center mb-1"><Smartphone className="w-5 h-5 text-emerald-500" /></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Mobile</span>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{deviceStats.mobilePct}%</p>
                                <span className="text-xs text-slate-500">{deviceStats.mobile} opens</span>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-slate-800/60 rounded-2xl border border-purple-100 dark:border-slate-700">
                                <div className="flex justify-center mb-1"><Tablet className="w-5 h-5 text-purple-600" /></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Tablet</span>
                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{deviceStats.tabletPct}%</p>
                                <span className="text-xs text-slate-500">{deviceStats.tablet} opens</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Speed to First Open */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-500" />
                            <span>Response Velocity</span>
                        </h3>
                        <span className="text-xs font-bold text-slate-400 uppercase">Time-to-Open</span>
                    </div>

                    <div className="space-y-4">
                        {speedStats.map((item, idx) => (
                            <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                                    <span className="text-slate-900 dark:text-white font-black">{item.count} ({item.pct}%)</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div style={{ width: `${item.pct}%` }} className={`h-full ${item.color} rounded-full transition-all`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Best Time to Send Heatmap */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            <span>Best Time to Send (Hourly Opens Heatmap)</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Identifies when recipients are actively opening your proposals</p>
                    </div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-xl">
                        🔥 Peak hours: 9 AM - 11 AM & 1 PM - 4 PM
                    </span>
                </div>

                {/* 24h Bar Chart */}
                <div className="grid gap-1.5 items-end h-40 pt-6" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                    {hourlyStats.map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 group relative">
                            {/* Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-all shadow-lg whitespace-nowrap z-10">
                                {h.label}: {h.count} opens
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md flex items-end h-28 overflow-hidden">
                                <div
                                    style={{ height: `${Math.max(h.pct, h.count > 0 ? 15 : 4)}%` }}
                                    className={`w-full rounded-t-md transition-all ${
                                        h.count > 0 ? 'bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400' : 'bg-slate-200 dark:bg-slate-800'
                                    }`}
                                />
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase truncate w-full text-center">
                                {i % 3 === 0 ? h.label.replace(' ', '') : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Row 3: Operating Systems & Top Browsers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Operating Systems */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        <span>Operating Systems</span>
                    </h3>
                    <div className="space-y-3">
                        {osStats.slice(0, 5).map((os, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{os.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 font-bold">{os.count} opens</span>
                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                                        {os.pct}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Browsers / Clients */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-cyan-600" />
                        <span>Email Clients & Browsers</span>
                    </h3>
                    <div className="space-y-3">
                        {clientStats.slice(0, 5).map((b, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{b.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 font-bold">{b.count} opens</span>
                                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded-md">
                                        {b.pct}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
