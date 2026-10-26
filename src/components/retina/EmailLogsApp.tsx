import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MousePointerClick, TrendingUp, BarChart3, Sparkles, RefreshCw, Download, Moon, Sun, Flame, Zap, Clock, Volume2, VolumeX, User, Plus, Mail, Info, X } from './icons';

import type { SentEmail, OpenEvent, EmailLinkClick, FeedEvent, FollowUpRule } from '../../lib/retinaTypes';
import { ReadReceiptBadge, RetinaEye } from './ReadReceiptBadge';
import { AnalyticsView } from './AnalyticsView';
import { RetinaToastStack } from './RetinaToast';
import type { ToastItem } from './RetinaToast';
import { EventDetailsModal } from './EventDetailsModal';
import { retinaAudio } from '../../lib/retinaAudio';

// Crisp modern paper plane icon for Sent emails
function SentPlaneIcon({ className = "w-5 h-5 text-blue-600" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

interface LogsData {
    sent: SentEmail[];
    opens: Record<string, OpenEvent[]>;
    emailClicks: Record<string, EmailLinkClick[]>;
}

interface ClickReportRow {
    url: string;
    total: number;
    uids: Set<string>;
    first: string;
    last: string;
    emails: Array<{ uid: string; recipient: string; subject: string }>;
}

export default function EmailLogsApp() {
    const [password, setPassword] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [userEmails, setUserEmails] = useState<string[]>([]);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('feed');
    const [darkMode, setDarkMode] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Selected event for detail modal
    const [selectedFeedEvent, setSelectedFeedEvent] = useState<FeedEvent | null>(null);

    // Connect new email account state
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [newEmailToConnect, setNewEmailToConnect] = useState('');

    // In-App Toasts Stack
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const lastSeenFeedId = useRef<string>('');

    // Follow-up reminders
    const [followUpRules, setFollowUpRules] = useState<Record<string, FollowUpRule>>({});
    const [composeFollowUp, setComposeFollowUp] = useState<'none' | '24' | '48' | '72' | '168'>('none');
    const [genFollowUp, setGenFollowUp] = useState<'none' | '24' | '48' | '72' | '168'>('none');

    // Logs Data & Filters
    const [logs, setLogs] = useState<LogsData | null>(null);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logsFilter, setLogsFilter] = useState<'all' | 'opened' | 'unopened' | 'clicked' | 'spikes' | 'reminders'>('all');
    const [logsSearch, setLogsSearch] = useState('');
    const [expandedUids, setExpandedUids] = useState<Record<string, boolean>>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSent, setTotalSent] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // Stats (computed on render)
    const opensLists = Object.values(logs?.opens || {});
    const uniqueOpenedEmails = opensLists.filter(list => list.length > 0).length;
    const openRatePct = totalSent > 0 ? Math.round((uniqueOpenedEmails / totalSent) * 100) : 0;

    const clickLists = Object.values(logs?.emailClicks || {});
    const uniqueClickedEmails = clickLists.filter(list => list.length > 0).length;
    const clickRatePct = totalSent > 0 ? Math.round((uniqueClickedEmails / totalSent) * 100) : 0;
    const clickToOpenRatePct = uniqueOpenedEmails > 0 ? Math.round((uniqueClickedEmails / uniqueOpenedEmails) * 100) : 0;

    // Aggregate per-URL click report across all emails
    const linkClicksReport = useMemo<ClickReportRow[]>(() => {
        const agg: Record<string, ClickReportRow> = {};
        for (const uid of Object.keys(logs?.emailClicks || {})) {
            const sent = logs?.sent.find((e) => e.uid === uid);
            const clicks = logs?.emailClicks?.[uid] || [];
            for (const c of clicks) {
                const key = c.url || '';
                if (!key) continue;
                if (!agg[key]) {
                    agg[key] = { url: key, total: 0, uids: new Set<string>(), first: '', last: '', emails: [] };
                }
                const u = agg[key];
                u.total += 1;
                u.uids.add(uid);
                if (!u.first || new Date(c.timestamp).getTime() < new Date(u.first).getTime()) u.first = c.timestamp;
                if (!u.last || new Date(c.timestamp).getTime() > new Date(u.last).getTime()) u.last = c.timestamp;
                if (sent && !u.emails.some((e) => e.uid === uid)) {
                    u.emails.push({ uid, recipient: c.recipient, subject: c.subject || sent.subject });
                }
            }
        }
        return Object.values(agg).sort((a, b) => b.total - a.total);
    }, [logs?.emailClicks, logs?.sent]);

    // Activity Feed
    const [feed, setFeed] = useState<FeedEvent[]>([]);
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [feedSearch, setFeedSearch] = useState('');
    const [feedFilter, setFeedFilter] = useState<'all' | 'sent' | 'open' | 'click'>('all');

    // Forms
    const [composeForm, setComposeForm] = useState({ to: '', subject: '', message: '' });
    const [sendingEmail, setSendingEmail] = useState(false);

    const [genTo, setGenTo] = useState('');
    const [genSubject, setGenSubject] = useState('');
    const [sigLabel, setSigLabel] = useState('');

    const [resultArea, setResultArea] = useState<{ url: string; code: string } | null>(null);
    const [sigArea, setSigArea] = useState<{ url: string } | null>(null);

    // Alert Notification status
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Refs for alerts
    const previousOpensCount = useRef<number>(0);
    const baseUrlRef = useRef<string>('');

    useEffect(() => {
        baseUrlRef.current = window.location.origin;

        // Theme initialization
        const savedTheme = localStorage.getItem('retina_theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
        }

        // Get saved password and email
        const savedPassword = sessionStorage.getItem('retina_password');
        const savedSenderEmail = sessionStorage.getItem('retina_sender_email');
        const savedUserEmails = sessionStorage.getItem('retina_user_emails');

        if (savedPassword && savedSenderEmail) {
            fetch('/api/retina/auth/', {
                headers: { 'x-retina-password': savedPassword },
            }).then(res => {
                if (res.ok) {
                    setIsAuthenticated(true);
                    if (savedUserEmails) {
                        try {
                            setUserEmails(JSON.parse(savedUserEmails));
                        } catch {
                            setUserEmails([savedSenderEmail]);
                        }
                    } else {
                        setUserEmails([savedSenderEmail]);
                    }
                    setSenderEmail(savedSenderEmail);
                }
            }).catch(() => {});
        }

        if (savedSenderEmail && !senderEmail) {
            setSenderEmail(savedSenderEmail);
        }

        // Check if browser notifications are enabled
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(
                Notification.permission === 'granted' &&
                localStorage.getItem('retina_notifications') === 'true'
            );
        }
    }, []);

    const toggleDarkMode = () => {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('retina_theme', next ? 'dark' : 'light');
    };

    // Handle initial logs fetching or tab changes
    useEffect(() => {
        if (!isAuthenticated) return;

        fetchLogs();
        fetchFeed();

        const refresh = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            if (activeTab === 'logs') fetchLogs(true);
            if (activeTab === 'feed') fetchFeed(true);
        };

        const interval = setInterval(refresh, 60000);

        const onVisibilityChange = () => {
            if (!document.hidden) refresh();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [isAuthenticated, activeTab]);

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await fetch('/api/retina/auth/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: authMode,
                    email: senderEmail,
                    password: password,
                }),
            });
            const data = await res.json();
            if (res.ok && data.authenticated) {
                const userPrimaryEmail = data.user?.email || senderEmail;
                const userConnEmails = data.user?.connectedEmails || [userPrimaryEmail];
                sessionStorage.setItem('retina_password', password);
                sessionStorage.setItem('retina_sender_email', userPrimaryEmail);
                sessionStorage.setItem('retina_user_emails', JSON.stringify(userConnEmails));

                setSenderEmail(userPrimaryEmail);
                setUserEmails(userConnEmails);
                setIsAuthenticated(true);
                setLoginError('');
            } else {
                setLoginError(data.error || 'Authentication failed.');
            }
        } catch {
            setLoginError('Network error. Please try again.');
        }
    };

    const handleConnectNewEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmailToConnect.trim()) return;
        try {
            const res = await fetch('/api/retina/auth/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'connect_email',
                    email: senderEmail,
                    newEmail: newEmailToConnect,
                }),
            });
            const data = await res.json();
            if (res.ok && data.user) {
                const updatedList = data.user.connectedEmails;
                setUserEmails(updatedList);
                sessionStorage.setItem('retina_user_emails', JSON.stringify(updatedList));
                setNewEmailToConnect('');
                setShowConnectModal(false);
                setAlertMessage({ type: 'success', text: `Successfully connected ${newEmailToConnect} to your account!` });
            } else {
                alert(data.error || 'Error connecting email');
            }
        } catch {
            alert('Failed to connect email');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('retina_password');
        sessionStorage.removeItem('retina_sender_email');
        sessionStorage.removeItem('retina_user_emails');
        setIsAuthenticated(false);
        setLogs(null);
        setFeed([]);
        setFollowUpRules({});
        setSenderEmail('');
        setUserEmails([]);
    };

    const fetchLogs = async (isBackground = false, loadMore = false) => {
        if (!isBackground && !loadMore) setLoadingLogs(true);
        const savedPassword = sessionStorage.getItem('retina_password') || password;
        const savedSenderEmail = sessionStorage.getItem('retina_sender_email') || senderEmail;
        const savedUserEmails = sessionStorage.getItem('retina_user_emails') || JSON.stringify(userEmails);
        const targetPage = loadMore ? page + 1 : 1;

        try {
            const [logsRes, followUpsRes] = await Promise.all([
                fetch(`/api/retina/logs/?page=${targetPage}&pageSize=50`, {
                    headers: {
                        'x-retina-password': savedPassword,
                        'x-retina-sender': savedSenderEmail,
                        'x-retina-connected-emails': savedUserEmails,
                    },
                }),
                fetch('/api/retina/follow-ups/', {
                    headers: {
                        'x-retina-password': savedPassword,
                    },
                }).catch(() => null),
            ]);

            if (logsRes.ok) {
                const data = await logsRes.json();

                data.sent = (data.sent || []).sort((a: SentEmail, b: SentEmail) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                if (loadMore && logs) {
                    setLogs({
                        sent: [...logs.sent, ...data.sent],
                        opens: { ...logs.opens, ...data.opens },
                        emailClicks: { ...logs.emailClicks, ...data.emailClicks },
                    });
                } else {
                    setLogs({
                        sent: data.sent,
                        opens: data.opens || {},
                        emailClicks: data.emailClicks || {},
                    });
                }
                setTotalPages(data.totalPages || 1);
                setPage(data.page || 1);
                setTotalSent(data.totalSent || 0);

                let totalOpens = 0;
                Object.values(data.opens || {}).forEach((oList) => {
                    totalOpens += (oList as OpenEvent[]).length;
                });

                if (
                    isBackground &&
                    totalOpens > previousOpensCount.current &&
                    previousOpensCount.current > 0 &&
                    notificationsEnabled
                ) {
                    let latestOpenName = '';
                    const sortedOpens = (Object.values(data.opens || {}).flat() as OpenEvent[])
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    if (sortedOpens.length > 0) {
                        latestOpenName = ` by ${sortedOpens[0].recipient}`;
                    }

                    new Notification('📧 Email Opened!', {
                        body: `An email was just opened${latestOpenName}.`,
                        icon: '/favicon.svg',
                    });
                }
                previousOpensCount.current = totalOpens;
            } else if (logsRes.status === 401) {
                handleLogout();
            }

            if (followUpsRes && followUpsRes.ok) {
                const fData = await followUpsRes.json();
                const ruleMap: Record<string, FollowUpRule> = {};
                (fData.rules || []).forEach((r: FollowUpRule) => {
                    ruleMap[r.uid] = r;
                });
                setFollowUpRules(ruleMap);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoadingLogs(false);
            setLoadingMore(false);
        }
    };

    const fetchFeed = async (isBackground = false) => {
        if (!isBackground) setLoadingFeed(true);
        const savedPassword = sessionStorage.getItem('retina_password') || password;
        const savedSenderEmail = sessionStorage.getItem('retina_sender_email') || senderEmail;
        const savedUserEmails = sessionStorage.getItem('retina_user_emails') || JSON.stringify(userEmails);

        try {
            const res = await fetch('/api/retina/feed/?limit=100', {
                headers: {
                    'x-retina-password': savedPassword,
                    'x-retina-email': savedSenderEmail,
                    'x-retina-connected-emails': savedUserEmails,
                },
            });

            if (res.ok) {
                const data = await res.json();
                const newEvents = (data.events || []) as FeedEvent[];

                if (isBackground && newEvents.length > 0 && lastSeenFeedId.current) {
                    const freshEvents: FeedEvent[] = [];
                    for (const ev of newEvents) {
                        if (ev.id === lastSeenFeedId.current) break;
                        freshEvents.push(ev);
                    }

                    if (freshEvents.length > 0) {
                        const topEvent = freshEvents[0];
                        if (topEvent.isSpike || topEvent.type === 'click') {
                            retinaAudio.playSpikeChime();
                        } else if (topEvent.type === 'open') {
                            retinaAudio.playOpenChime();
                        }

                        const newToastItems: ToastItem[] = freshEvents.slice(0, 3).map(ev => ({
                            id: `toast-${ev.id}-${Date.now()}`,
                            type: ev.type,
                            recipient: ev.recipientName || ev.recipient,
                            subject: ev.subject,
                            location: ev.location,
                            url: ev.url,
                            isSpike: ev.isSpike,
                            isRevival: ev.isRevival,
                            timestamp: Date.now(),
                        }));
                        setToasts(prev => [...newToastItems, ...prev].slice(0, 4));

                        setTimeout(() => {
                            setToasts(prev => prev.filter(t => !newToastItems.some(nt => nt.id === t.id)));
                        }, 6000);
                    }
                }

                if (newEvents.length > 0) {
                    lastSeenFeedId.current = newEvents[0].id;
                }
                setFeed(newEvents);
            } else if (res.status === 401) {
                handleLogout();
            }
        } catch (err) {
            console.error('Error fetching feed:', err);
        } finally {
            setLoadingFeed(false);
        }
    };

    // Filtered Sent Emails for Track Sheet
    const filteredSentEmails = useMemo(() => {
        if (!logs?.sent) return [];
        return logs.sent.filter((email) => {
            const emailOpens = logs.opens[email.uid] || [];
            const emailLinkClicks = logs.emailClicks[email.uid] || [];
            const isOpened = emailOpens.length > 0;
            const isClicked = emailLinkClicks.length > 0;
            const hasRule = !!followUpRules[email.uid];
            const isSpike = emailOpens.length >= 3;

            if (logsFilter === 'opened' && !isOpened) return false;
            if (logsFilter === 'unopened' && isOpened) return false;
            if (logsFilter === 'clicked' && !isClicked) return false;
            if (logsFilter === 'spikes' && !isSpike) return false;
            if (logsFilter === 'reminders' && !hasRule) return false;

            if (logsSearch.trim()) {
                const q = logsSearch.toLowerCase();
                const matchesTo = email.to.toLowerCase().includes(q);
                const matchesSub = (email.subject || '').toLowerCase().includes(q);
                return matchesTo || matchesSub;
            }

            return true;
        });
    }, [logs, logsFilter, logsSearch, followUpRules]);

    const totalOpenedCount = useMemo(() => logs?.sent.filter(e => (logs.opens[e.uid] || []).length > 0).length || 0, [logs]);
    const totalUnopenedCount = useMemo(() => logs?.sent.filter(e => !(logs.opens[e.uid] || []).length).length || 0, [logs]);
    const totalClickedCount = useMemo(() => logs?.sent.filter(e => (logs.emailClicks[e.uid] || []).length > 0).length || 0, [logs]);
    const totalSpikesCount = useMemo(() => logs?.sent.filter(e => (logs.opens[e.uid] || []).length >= 3).length || 0, [logs]);
    const totalRemindersCount = useMemo(() => Object.values(followUpRules).filter(r => r.status === 'pending').length, [followUpRules]);

    const LINK_PRESETS = [
        { label: '📅 Book a Call', url: 'https://calendar.mckellar.dev/richard/30min' },
        { label: '🤖 Fractional FDE', url: 'https://mckellar.dev/fractional-fde' },
        { label: '🏛️ AI Adoption Institute', url: 'https://mckellar.dev/institute-for-ai-adoption' },
        { label: '🌐 mckellar.dev', url: 'https://mckellar.dev/' },
    ];

    const insertPresetUrl = (url: string) => {
        setComposeForm(prev => ({
            ...prev,
            message: prev.message ? `${prev.message}\n${url}` : url
        }));
    };

    const exportLogsToCSV = () => {
        if (!logs || logs.sent.length === 0) {
            alert('No sent email logs available to export.');
            return;
        }

        const headers = [
            'UID',
            'Date Sent',
            'Recipient',
            'Subject',
            'Source',
            'Status',
            'Total Opens',
            'First Open Date',
            'Last Open Date',
            'First Open Location',
            'First Open Device',
            'Total Clicks',
            'Clicked URLs'
        ];

        const rows = logs.sent.map(email => {
            const emailOpens = logs.opens[email.uid] || [];
            const emailClicks = logs.emailClicks[email.uid] || [];
            const firstOpen = emailOpens[0];
            const lastOpen = emailOpens[emailOpens.length - 1];
            const clickedUrls = Array.from(new Set(emailClicks.map(c => c.url))).join('; ');
            const status = emailClicks.length > 0 ? 'CLICKED' : (emailOpens.length > 0 ? 'OPENED' : 'UNOPENED');

            return [
                `"${email.uid}"`,
                `"${new Date(email.timestamp).toLocaleString()}"`,
                `"${(email.to || '').replace(/"/g, '""')}"`,
                `"${(email.subject || '').replace(/"/g, '""')}"`,
                `"${email.source || 'direct'}"`,
                `"${status}"`,
                emailOpens.length,
                firstOpen ? `"${new Date(firstOpen.timestamp).toLocaleString()}"` : '""',
                lastOpen ? `"${new Date(lastOpen.timestamp).toLocaleString()}"` : '""',
                firstOpen ? `"${[firstOpen.city, firstOpen.region, firstOpen.country].filter(Boolean).join(', ')}"` : '""',
                firstOpen ? `"${firstOpen.device || 'Desktop'} - ${firstOpen.browser || ''}"` : '""',
                emailClicks.length,
                `"${clickedUrls.replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `mckellar_retina_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportClicksToCSV = () => {
        if (linkClicksReport.length === 0) {
            alert('No click events to export.');
            return;
        }

        const headers = ['URL', 'Total Clicks', 'Unique Emails', 'Last Clicked', 'Clicked By'];
        const rows = linkClicksReport.map((row) => [
            `"${row.url.replace(/"/g, '""')}"`,
            row.total,
            row.uids.size,
            `"${new Date(row.last).toLocaleString()}"`,
            `"${row.emails.map((e) => e.recipient || e.subject).join('; ').replace(/"/g, '""')}"`
        ].join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `mckellar_retina_clicks_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingEmail(true);
        setAlertMessage(null);

        const savedPassword = sessionStorage.getItem('retina_password') || password;
        const savedSenderEmail = sessionStorage.getItem('retina_sender_email') || senderEmail;

        try {
            const res = await fetch('/api/retina/send/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-retina-password': savedPassword,
                    'x-retina-sender': savedSenderEmail,
                },
                body: JSON.stringify(composeForm),
            });

            if (res.ok) {
                const resData = await res.json().catch(() => ({}));

                if (composeFollowUp !== 'none' && resData.uid) {
                    fetch('/api/retina/follow-ups/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-retina-password': savedPassword,
                        },
                        body: JSON.stringify({
                            uid: resData.uid,
                            recipient: composeForm.to,
                            subject: composeForm.subject,
                            senderEmail: savedSenderEmail,
                            hoursDelay: Number(composeFollowUp),
                        }),
                    }).catch(err => console.error('Error creating follow-up rule:', err));
                }

                setAlertMessage({
                    type: 'success',
                    text: `✅ Success! Email sent to ${composeForm.to}. Tracking active.${composeFollowUp !== 'none' ? ` Follow-up reminder set (${composeFollowUp}h).` : ''}`,
                });
                setComposeForm({ to: '', subject: '', message: '' });
                setComposeFollowUp('none');
                setActiveTab('logs');
            } else {
                const errData = await res.json().catch(() => ({}));
                setAlertMessage({
                    type: 'error',
                    text: `❌ Error: ${errData.error || 'Failed to send email.'}`,
                });
            }
        } catch {
            setAlertMessage({
                type: 'error',
                text: '❌ Network error sending email.',
            });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleGenerateTrack = () => {
        if (!genTo) {
            alert('Please enter a recipient name or email');
            return;
        }

        const uid = `m-${Date.now()}`;
        const params = `?r=${encodeURIComponent(genTo)}&s=${encodeURIComponent(genSubject || 'No Subject')}&uid=${uid}&src=generator`;
        const pixelUrl = `${baseUrlRef.current}/pixel.php${params}`;
        const savedPassword = sessionStorage.getItem('retina_password') || password;
        const savedSenderEmail = sessionStorage.getItem('retina_sender_email') || senderEmail;
        const regUrl = `${baseUrlRef.current}/email-logs.php?register_sent=1&r=${encodeURIComponent(genTo)}&s=${encodeURIComponent(genSubject || 'No Subject')}&uid=${uid}&sender=${encodeURIComponent(savedSenderEmail)}&src=generator`;

        fetch(regUrl, {
            headers: {
                'x-retina-password': savedPassword,
                'x-retina-sender': savedSenderEmail,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Registration failed (status ' + res.status + ')');
                return fetchLogs(true);
            })
            .catch((err) => {
                setAlertMessage({ type: 'error', text: '❌ Registration failed: ' + err.message });
            });

        if (genFollowUp !== 'none') {
            fetch('/api/retina/follow-ups/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-retina-password': savedPassword,
                },
                body: JSON.stringify({
                    uid,
                    recipient: genTo,
                    subject: genSubject || 'No Subject',
                    senderEmail: savedSenderEmail,
                    hoursDelay: Number(genFollowUp),
                }),
            }).catch(err => console.error('Error creating follow-up rule:', err));
        }

        setResultArea({
            url: pixelUrl,
            code: `<img src="${pixelUrl}" width="1" height="1" style="display:none;" />`,
        });
    };

    const handleGenerateSignature = () => {
        const label = sigLabel || 'General Signature';
        const uid = `SIG-${Date.now()}`;
        const params = `?r=${encodeURIComponent('Signature: ' + label)}&s=${encodeURIComponent('Signature View')}&uid=${uid}&src=signature`;
        const pixelUrl = `${baseUrlRef.current}/pixel.php${params}`;
        const savedPassword = sessionStorage.getItem('retina_password') || password;
        const savedSenderEmail = sessionStorage.getItem('retina_sender_email') || senderEmail;
        const regUrl = `${baseUrlRef.current}/email-logs.php?register_sent=1&r=${encodeURIComponent('Signature: ' + label)}&s=${encodeURIComponent('Signature View')}&uid=${uid}&sender=${encodeURIComponent(savedSenderEmail)}&src=signature`;

        fetch(regUrl, {
            headers: {
                'x-retina-password': savedPassword,
                'x-retina-sender': savedSenderEmail,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Registration failed (status ' + res.status + ')');
                return fetchLogs(true);
            })
            .catch((err) => {
                setAlertMessage({ type: 'error', text: '❌ Signature registration failed: ' + err.message });
            });

        setSigArea({
            url: pixelUrl,
        });
    };

    const toggleNotifications = () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications.');
            return;
        }

        if (Notification.permission === 'granted') {
            const current = !notificationsEnabled;
            setNotificationsEnabled(current);
            localStorage.setItem('retina_notifications', String(current));
        } else {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    localStorage.setItem('retina_notifications', 'true');
                    new Notification('Notifications Enabled!', {
                        body: 'You will now see alerts for new email opens.',
                    });
                }
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const copyHtmlToClipboard = async (htmlText: string) => {
        try {
            const blob = new Blob([htmlText], { type: 'text/html' });
            const textBlob = new Blob([htmlText], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': blob,
                    'text/plain': textBlob
                })
            ]);
            alert('Copied tracking pixel! Go to Outlook Settings > Signatures, click in the box, and press Ctrl+V to paste it.');
        } catch {
            navigator.clipboard.writeText(htmlText);
            alert('Copied HTML code to clipboard!');
        }
    };

    const toggleRowDetails = (uid: string) => {
        setExpandedUids((prev) => ({
            ...prev,
            [uid]: !prev[uid],
        }));
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-slate-900 min-h-screen flex items-center justify-center font-sans p-4">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto">
                            <RetinaEye className="w-8 h-8 text-white" glow={true} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-3">Inbox Retina</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">mckellar.dev · Email Read Receipts & Analytics</p>
                    </div>

                    {/* Auth Mode Toggle Tabs */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                        <button
                            type="button"
                            onClick={() => { setAuthMode('login'); setLoginError(''); }}
                            className={`py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                                authMode === 'login'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            🔑 Log In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('signup'); setLoginError(''); }}
                            className={`py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                                authMode === 'signup'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            ✨ Sign Up (Free)
                        </button>
                    </div>

                    {loginError && (
                        <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-2xl mb-4 text-center">
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                                Your Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={senderEmail}
                                    onChange={(e) => setSenderEmail(e.target.value)}
                                    placeholder="richard@mckellar.dev"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-slate-100 font-bold text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={authMode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-slate-100 font-bold text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-4 rounded-2xl shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all text-sm mt-2"
                        >
                            {authMode === 'signup' ? 'Create Account & Start Tracking →' : 'Log In to Dashboard →'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const bookmarkletHref = typeof window !== 'undefined' ?
        `javascript:(function(){try{const s=document.querySelector('input[name=\\'subjectbox\\']')?.value||'No Subject';const r=prompt('Recipient Name?','Client');if(!r)return;const uid='m-'+Date.now();const siteUrl='${baseUrlRef.current}';const sender='${encodeURIComponent(senderEmail)}';const regUrl=siteUrl+'/email-logs.php?register_sent=1&r='+encodeURIComponent(r)+'&s='+encodeURIComponent(s)+'&uid='+uid+'&sender='+sender;const pixelUrl=siteUrl+'/pixel.php?r='+encodeURIComponent(r)+'&s='+encodeURIComponent(s)+'&uid='+uid+'&sender='+sender;fetch(regUrl).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status)}).catch(function(e){alert('Registration failed:'+e.message)});const img='<img src="'+pixelUrl+'" width="1" height="1" style="display:none;" />';const el=document.createElement('textarea');el.value=img;document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el);alert('Tracking Ready!\\n\\nRegistered: '+s+'\\n\\nCode copied! Hit Ctrl+V at the bottom of your email.');}catch(e){alert('Error:'+e.message)}})();`
        : '#';

    return (
        <div className={darkMode ? 'dark bg-slate-950 text-slate-100 min-h-screen font-sans pb-16 transition-colors' : 'bg-slate-50 text-slate-800 min-h-screen font-sans pb-16 transition-colors'}>
            {/* Navbar */}
            <div className="max-w-6xl mx-auto px-4 pt-10">
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                            <RetinaEye className="w-6 h-6 text-white" glow={true} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                Inbox Retina
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-md inline-block uppercase">
                                    mckellar.dev v3.2
                                </span>
                                {Object.keys(followUpRules).length > 0 && (
                                    <span className="text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                        ⏰ {Object.values(followUpRules).filter(r => r.status === 'pending').length} active reminders
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {senderEmail && (
                            <button
                                onClick={() => setShowConnectModal(true)}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                title="Click to manage connected email accounts"
                            >
                                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="truncate max-w-[140px] md:max-w-[180px]">{senderEmail}</span>
                                {userEmails.length > 1 && (
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                                        +{userEmails.length - 1}
                                    </span>
                                )}
                                <Plus className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const next = !soundEnabled;
                                setSoundEnabled(next);
                                retinaAudio.setSoundEnabled(next);
                            }}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                            title={soundEnabled ? 'In-App Audio Chimes: Enabled (Click to Mute)' : 'In-App Audio Chimes: Muted (Click to Enable)'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                        </button>
                        <a href="/links/" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Link Manager
                        </a>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {alertMessage && (
                    <div
                        className={`p-4 rounded-2xl mb-6 font-bold text-sm ${
                            alertMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border dark:border-green-800' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border dark:border-red-800'
                        }`}
                    >
                        {alertMessage.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-3 mb-8 pb-2 md:pb-0 md:flex-wrap">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'feed'
                                ? 'bg-blue-600 text-white shadow-blue-500/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        📡 Activity Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'compose'
                                ? 'bg-blue-600 text-white shadow-blue-500/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        ✏️ Compose
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'generator'
                                ? 'bg-blue-600 text-white shadow-blue-500/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        🔨 Create Track
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'logs'
                                ? 'bg-blue-600 text-white shadow-blue-500/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        📊 Track Sheet
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'analytics'
                                ? 'bg-indigo-600 text-white shadow-indigo-500/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        📈 Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('signature')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 border border-orange-200 dark:border-orange-900 italic ${
                            activeTab === 'signature'
                                ? 'bg-orange-600 text-white shadow-orange-500/10 border-orange-600'
                                : 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        ✨ Signature
                    </button>
                    <button
                        onClick={() => setActiveTab('outlook')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'outlook'
                                ? 'bg-slate-800 text-white shadow-slate-800/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        🔌 Outlook Setup
                    </button>
                    <button
                        onClick={() => setActiveTab('clicks')}
                        className={`px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all text-xs md:text-sm flex items-center gap-2 flex-shrink-0 ${
                            activeTab === 'clicks'
                                ? 'bg-purple-600 text-white shadow-purple-500/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                        }`}
                    >
                        🎯 Clicks Report
                    </button>
                </div>

                {/* ACTIVITY FEED TAB */}
                {activeTab === 'feed' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Emails Sent', value: totalSent, icon: <SentPlaneIcon className="w-5 h-5 text-blue-600" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-slate-900 border-blue-100 dark:border-slate-800' },
                                { label: 'Opens', value: uniqueOpenedEmails, icon: <RetinaEye className="w-5 h-5 text-emerald-500" glow={true} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-slate-900 border-emerald-100 dark:border-slate-800' },
                                { label: 'Link Clicks', value: uniqueClickedEmails, icon: <MousePointerClick className="w-5 h-5 text-purple-600" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-slate-900 border-purple-100 dark:border-slate-800' },
                                { label: 'Open Rate', value: `${openRatePct}%`, icon: <TrendingUp className="w-5 h-5 text-amber-500" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-slate-900 border-amber-100 dark:border-slate-800' },
                                { label: 'Click Rate', value: `${clickRatePct}%`, icon: <BarChart3 className="w-5 h-5 text-indigo-500" />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-slate-900 border-indigo-100 dark:border-slate-800' },
                                { label: 'Click-to-Open', value: `${clickToOpenRatePct}%`, icon: <Sparkles className="w-5 h-5 text-cyan-500" />, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-slate-900 border-cyan-100 dark:border-slate-800' },
                            ].map((stat) => (
                                <div key={stat.label} className={`rounded-2xl border p-5 ${stat.bg}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-xs">{stat.icon}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Search / Filter */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex flex-wrap gap-3 items-center justify-between">
                                <div className="relative flex-1 min-w-[240px]">
                                    <input
                                        type="text"
                                        value={feedSearch}
                                        onChange={(e) => setFeedSearch(e.target.value)}
                                        placeholder="🔍 Search recipient, subject, or URL..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {([
                                        { key: 'all', label: 'All', icon: null },
                                        { key: 'sent', label: 'Sent', icon: <SentPlaneIcon className="w-3.5 h-3.5 text-blue-600" /> },
                                        { key: 'open', label: 'Opens', icon: <RetinaEye className="w-3.5 h-3.5 text-emerald-500" /> },
                                        { key: 'click', label: 'Clicks', icon: <MousePointerClick className="w-3.5 h-3.5 text-purple-600" /> },
                                    ] as const).map((f) => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFeedFilter(f.key)}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-1.5 ${
                                                feedFilter === f.key
                                                    ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {f.icon}
                                            <span>{f.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => fetchFeed()}
                                    disabled={loadingFeed}
                                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-blue-600 dark:text-blue-400 font-black px-5 py-2.5 rounded-xl text-xs hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? 'animate-spin' : ''}`} />
                                    <span>{loadingFeed ? 'REFRESHING...' : 'REFRESH'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Feed List */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Live Activity</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Every send, open, spike, and click — newest first</p>
                                </div>
                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {typeof document !== 'undefined' && document.visibilityState === 'hidden' ? 'PAUSED' : 'LIVE'}
                                </span>
                            </div>

                            {loadingFeed && feed.length === 0 ? (
                                <div className="p-20 text-center text-slate-400 font-black uppercase text-sm italic tracking-widest">
                                    Loading activity...
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                                    {feed.length === 0 && (
                                        <div className="p-20 text-center text-slate-300 dark:text-slate-600 font-black uppercase text-sm italic tracking-widest">
                                            NO ACTIVITY YET — SEND YOUR FIRST TRACKED EMAIL
                                        </div>
                                    )}

                                    {feed
                                        .filter((ev) => feedFilter === 'all' || ev.type === feedFilter)
                                        .filter((ev) => {
                                            if (!feedSearch.trim()) return true;
                                            const q = feedSearch.toLowerCase();
                                            return (
                                                ev.recipient.toLowerCase().includes(q) ||
                                                (ev.recipientName || '').toLowerCase().includes(q) ||
                                                ev.subject.toLowerCase().includes(q) ||
                                                (ev.url || '').toLowerCase().includes(q)
                                            );
                                        })
                                        .map((ev) => {
                                            const time = new Date(ev.timestamp);
                                            const diffMs = Date.now() - time.getTime();
                                            const diffMins = Math.round(diffMs / 60000);
                                            let timeLabel: string;
                                            if (diffMins < 1) timeLabel = 'just now';
                                            else if (diffMins < 60) timeLabel = `${diffMins}m ago`;
                                            else if (diffMins < 1440) timeLabel = `${Math.round(diffMins / 60)}h ago`;
                                            else timeLabel = time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                                            return (
                                                <div
                                                    key={ev.id}
                                                    onClick={() => setSelectedFeedEvent(ev)}
                                                    className="flex gap-4 p-5 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-all cursor-pointer group relative border-l-4 border-transparent hover:border-blue-500"
                                                    title="Click to view full event details & intelligence"
                                                >
                                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                                                        ev.isSpike ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' :
                                                        ev.isRevival ? 'bg-purple-100 dark:bg-purple-950 text-purple-600' :
                                                        ev.type === 'sent' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                                                        ev.type === 'open' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                                                        'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                                                    }`}>
                                                        {ev.isSpike ? (
                                                            <Flame className="w-5 h-5 text-amber-600 animate-bounce" />
                                                        ) : ev.isRevival ? (
                                                            <Zap className="w-5 h-5 text-purple-600" />
                                                        ) : ev.type === 'sent' ? (
                                                            <SentPlaneIcon className="w-5 h-5 text-blue-600" />
                                                        ) : ev.type === 'open' ? (
                                                            <RetinaEye className="w-5 h-5 text-emerald-500" glow={true} />
                                                        ) : (
                                                            <MousePointerClick className="w-5 h-5 text-purple-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                                    ev.type === 'sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                                                                    ev.type === 'open' ? 'bg-green-100 text-green-700 dark:bg-emerald-950 dark:text-emerald-300' :
                                                                    'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                                }`}>
                                                                    {ev.type === 'sent' ? 'Sent' : ev.type === 'open' ? (ev.openType === 'first_open' ? 'First Open' : 'Reopened') : 'Clicked'}
                                                                </span>
                                                                {ev.isSpike && (
                                                                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse inline-flex items-center gap-1">
                                                                        🔥 Hot Spike (3x)
                                                                    </span>
                                                                )}
                                                                {ev.isRevival && (
                                                                    <span className="text-[9px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                                                        ⚡ Revived
                                                                    </span>
                                                                )}
                                                                {ev.source && (
                                                                    <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                        {ev.source}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-400 font-bold">{timeLabel}</span>
                                                                <span className="opacity-0 group-hover:opacity-100 transition-all text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                                                    <Info className="w-3 h-3" /> Details
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1.5 truncate">
                                                            {ev.type === 'sent' ? `To: ${ev.recipient}` : ev.recipientName || ev.recipient}
                                                            <span className="font-bold text-slate-400 dark:text-slate-500"> — {ev.subject}</span>
                                                        </p>
                                                        {ev.type === 'click' && ev.url && (
                                                            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block truncate mt-0.5">
                                                                🔗 {ev.url}
                                                            </a>
                                                        )}
                                                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                                                            {ev.type === 'open' && ev.location ? `📍 ${ev.location}` : ''}
                                                            {ev.type === 'open' && ev.device ? ` ${ev.device === 'Desktop' ? '💻' : '📱'} ${ev.device}` : ''}
                                                            {ev.type === 'open' && ev.browser ? ` · ${ev.browser}` : ''}
                                                            {ev.type === 'open' && ev.os ? ` (${ev.os})` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {feed.length > 0 && feed.filter((ev) => feedFilter === 'all' || ev.type === feedFilter).filter((ev) => {
                                        if (!feedSearch.trim()) return true;
                                        const q = feedSearch.toLowerCase();
                                        return ev.recipient.toLowerCase().includes(q) || (ev.recipientName || '').toLowerCase().includes(q) || ev.subject.toLowerCase().includes(q) || (ev.url || '').toLowerCase().includes(q);
                                    }).length === 0 && (
                                        <div className="p-16 text-center text-slate-300 dark:text-slate-600 font-black uppercase text-sm italic tracking-widest">
                                            NO MATCHES FOR &quot;{feedSearch}&quot;
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CLICKS REPORT TAB */}
                {activeTab === 'clicks' && (
                    <div className="rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Clicks Report</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Per-link click breakdown across all tracked emails</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={exportClicksToCSV}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>EXPORT CSV</span>
                                </button>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                                    {linkClicksReport.length} {linkClicksReport.length === 1 ? 'URL' : 'URLs'}
                                </span>
                            </div>
                        </div>

                        {linkClicksReport.length === 0 && (
                            <div className="p-20 text-center text-slate-300 dark:text-slate-600 font-black uppercase text-sm italic tracking-widest">
                                NO LINK CLICKS RECORDED YET
                            </div>
                        )}

                        {linkClicksReport.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="p-4">Clicked Link</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4">Unique</th>
                                            <th className="p-4">Last Clicked</th>
                                            <th className="p-4">Clicked By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {linkClicksReport.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4">
                                                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline break-all">
                                                        {row.url}
                                                    </a>
                                                </td>
                                                <td className="p-4 font-black text-slate-800 dark:text-slate-100">{row.total}</td>
                                                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{row.uids.size}</td>
                                                <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{new Date(row.last).toLocaleString()}</td>
                                                <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                                                    {row.emails.slice(0, 3).map((e) => e.recipient || e.subject).join(', ')}
                                                    {row.emails.length > 3 && ` +${row.emails.length - 3} more`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* COMPOSE TAB */}
                {activeTab === 'compose' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800 max-w-4xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Quick Send & Auto-Track</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Sends via Resend / SMTP with smart link wrapping & follow-up reminders</p>
                            </div>
                            <span className="text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-3 py-1 rounded-full uppercase tracking-wider">
                                Mailtrack Upgraded
                            </span>
                        </div>
                        <form onSubmit={handleSendEmail} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Recipient Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={composeForm.to}
                                        onChange={(e) => setComposeForm((prev) => ({ ...prev, to: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-slate-100 font-medium transition-all"
                                        placeholder="name@business.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Email Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={composeForm.subject}
                                        onChange={(e) => setComposeForm((prev) => ({ ...prev, subject: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-slate-100 font-medium transition-all"
                                        placeholder="AI Deployment Scope & Next Steps"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase">Your Message</label>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">URLs in body will be automatically wrapped for click tracking</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">Insert Link Preset:</span>
                                    {LINK_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => insertPresetUrl(preset.url)}
                                            className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 active:scale-95"
                                        >
                                            <span>{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    required
                                    rows={8}
                                    value={composeForm.message}
                                    onChange={(e) => setComposeForm((prev) => ({ ...prev, message: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-slate-100 font-medium transition-all font-sans leading-relaxed"
                                    placeholder="Hey John, grab a time on my calendar here: https://calendar.mckellar.dev/richard/30min and let me know."
                                />
                            </div>

                            {/* Follow-up Reminder Selection */}
                            <div className="p-4 bg-amber-50/70 dark:bg-slate-800/80 rounded-2xl border border-amber-200/60 dark:border-slate-700">
                                <label className="block text-xs font-black text-amber-900 dark:text-amber-300 uppercase mb-2 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>⏰ Auto Follow-up Reminder Rule</span>
                                </label>
                                <select
                                    value={composeFollowUp}
                                    onChange={(e) => setComposeFollowUp(e.target.value as 'none' | '24' | '48' | '72' | '168')}
                                    className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 p-3 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
                                >
                                    <option value="none">No follow-up reminder</option>
                                    <option value="24">Remind me if unopened after 24 Hours (1 Day)</option>
                                    <option value="48">Remind me if unopened after 48 Hours (2 Days)</option>
                                    <option value="72">Remind me if unopened after 72 Hours (3 Days)</option>
                                    <option value="168">Remind me if unopened after 7 Days (1 Week)</option>
                                </select>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                                    If the recipient opens the email before this deadline, the reminder is automatically cancelled.
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={sendingEmail}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl hover:shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
                                >
                                    {sendingEmail ? 'Sending...' : 'Send With Tracking →'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* GENERATOR TAB */}
                {activeTab === 'generator' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800 max-w-4xl">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Track a Single Professional Email</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-6">Use this when you are sending a specific proposal or quote to one person from your own email app.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Recipient Name or Email</label>
                                    <input
                                        type="text"
                                        value={genTo}
                                        onChange={(e) => setGenTo(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl outline-none text-slate-800 dark:text-slate-100"
                                        placeholder="e.g. John Doe / jd@biz.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Subject / Purpose</label>
                                    <input
                                        type="text"
                                        value={genSubject}
                                        onChange={(e) => setGenSubject(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl outline-none text-slate-800 dark:text-slate-100"
                                        placeholder="e.g. Proposal Click Alert"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">⏰ Follow-up Reminder</label>
                                    <select
                                        value={genFollowUp}
                                        onChange={(e) => setGenFollowUp(e.target.value as 'none' | '24' | '48' | '72' | '168')}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                                    >
                                        <option value="none">No reminder</option>
                                        <option value="24">Remind in 24 Hours if unread</option>
                                        <option value="48">Remind in 48 Hours if unread</option>
                                        <option value="72">Remind in 72 Hours if unread</option>
                                        <option value="168">Remind in 7 Days if unread</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleGenerateTrack}
                                    className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl transition-all"
                                >
                                    Create Tracking Pixel
                                </button>
                            </div>

                            <div className="flex flex-col justify-center">
                                {resultArea ? (
                                    <div className="p-6 bg-slate-800 dark:bg-slate-950 rounded-2xl text-white shadow-inner animate-fade-in">
                                        <div className="mb-4">
                                            <label className="text-[10px] font-black uppercase opacity-50 block mb-1">Tracking URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={resultArea.url}
                                                    readOnly
                                                    className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl font-mono text-xs text-blue-400"
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(resultArea.url)}
                                                    className="bg-blue-600 px-3 rounded-xl text-xs font-bold"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase opacity-50 block mb-1">HTML Pixel Code</label>
                                            <textarea
                                                value={resultArea.code}
                                                readOnly
                                                rows={2}
                                                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl font-mono text-[10px] text-green-400 h-16 mb-2"
                                            />
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => copyToClipboard(resultArea.code)}
                                                    className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest"
                                                >
                                                    Copy HTML Code
                                                </button>
                                                <span className="text-[10px] text-slate-600">|</span>
                                                <button
                                                    onClick={() => copyHtmlToClipboard(resultArea.code)}
                                                    className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest font-sans"
                                                >
                                                    Copy Rich-Text Pixel (For Outlook/Gmail)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 font-bold italic">
                                        Fill details to generate tracking code
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* SIGNATURE TAB */}
                {activeTab === 'signature' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-orange-200 dark:border-orange-950 max-w-4xl">
                        <h2 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">✉️ Signature Tracking Setup</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm leading-relaxed">
                            Add a single &quot;Ghost Pixel&quot; to your email signature once and it will track every email you send from that app (Outlook, Gmail, etc).
                        </p>

                        <div className="bg-orange-50 dark:bg-slate-800/80 border border-orange-100 dark:border-orange-950 rounded-3xl p-6 mb-8 text-center">
                            <div className="max-w-md mx-auto mb-6">
                                <label className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase block mb-2 text-left ml-2">
                                    Signature Label (e.g. Work, iPhone, Personal)
                                </label>
                                <input
                                    type="text"
                                    value={sigLabel}
                                    onChange={(e) => setSigLabel(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 p-4 rounded-2xl text-center font-bold text-slate-800 dark:text-slate-100"
                                    placeholder="Give this signature a name..."
                                />
                            </div>

                            <button
                                onClick={handleGenerateSignature}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl hover:scale-102 active:scale-98 transition-all text-lg mb-6"
                            >
                                Step 1: Get My Signature Code
                            </button>

                            {sigArea && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <label className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase block mb-2">
                                        Outlook Signature Tracker
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-2xl mx-auto justify-center">
                                        <button
                                            onClick={() => copyHtmlToClipboard(`<img src="${sigArea.url}" width="1" height="1" style="display:none;width:0;height:0;border:0;" />`)}
                                            className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-orange-700 active:scale-95 transition-all shadow-md"
                                        >
                                            📋 COPY RICH-TEXT PIXEL FOR NEW OUTLOOK SIGNATURE
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(`<img src="${sigArea.url}" width="1" height="1" style="display:none;" />`)}
                                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs hover:bg-black"
                                        >
                                            Copy Raw HTML Code
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-orange-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <img
                                                    src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                                                    className="w-5 h-5"
                                                    alt="Outlook"
                                                />
                                                <h4 className="font-black text-slate-800 dark:text-white text-sm">For Outlook</h4>
                                            </div>
                                            <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 font-bold leading-normal">
                                                <li><b>New Outlook (Windows/Web):</b></li>
                                                <li>1. Open Settings (gear icon) &gt; Accounts &gt; Signatures.</li>
                                                <li>2. Click the button above to copy the rich-text tracking element.</li>
                                                <li>3. Click at the very end of your signature and press <b>Ctrl+V</b> to paste it.</li>
                                                <li className="pt-1 border-t border-slate-100 dark:border-slate-800"><b>Classic Outlook (Desktop):</b></li>
                                                <li>1. File &gt; Options &gt; Mail &gt; Signatures.</li>
                                                <li>2. Copy the permanent URL from the box or button above.</li>
                                                <li>3. Click the &quot;Insert Picture&quot; icon &gt; paste URL into file name box.</li>
                                                <li>4. Click arrow next to Insert &gt; <b>&quot;Link to File&quot;</b>.</li>
                                            </ol>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-orange-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="bg-orange-600 text-white p-1 rounded-md text-xs font-black">
                                                    G
                                                </div>
                                                <h4 className="font-black text-slate-800 dark:text-white text-sm">Smart Gmail Tracker</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">
                                                The &quot;Mailsuite&quot; Bookmarklet
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                                                Drag the button below to your <b>Bookmarks Bar</b>. When writing a Gmail, click it to auto-sync!
                                            </p>

                                            <a
                                                href={bookmarkletHref}
                                                onClick={(e) => {
                                                    if (bookmarkletHref === '#') e.preventDefault();
                                                }}
                                                className="inline-block bg-slate-900 dark:bg-blue-600 text-white font-black py-2.5 px-5 rounded-xl shadow-lg border-b-4 border-slate-700 dark:border-blue-800 active:border-b-0 active:translate-y-0.5 transition-all text-xs cursor-move"
                                            >
                                                🚀 TRACK THIS EMAIL
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LOGS TAB / TRACK SHEET */}
                {activeTab === 'logs' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Your Tracking Sheet</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Real-time engagement feed with double-check read receipts</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={exportLogsToCSV}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>EXPORT CSV</span>
                                </button>
                                <button
                                    onClick={toggleNotifications}
                                    className={`border font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 ${
                                        notificationsEnabled
                                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                                            : 'bg-white dark:bg-slate-800 border-orange-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{notificationsEnabled ? '✅' : '🔔'}</span>
                                    <span>{notificationsEnabled ? 'ALERTS ON' : 'ENABLE ALERTS'}</span>
                                </button>
                                <button
                                    onClick={() => fetchLogs()}
                                    disabled={loadingLogs}
                                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-blue-600 dark:text-blue-400 font-black px-4 py-2.5 rounded-xl text-xs hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm disabled:opacity-50"
                                >
                                    {loadingLogs ? 'REFRESHING...' : 'REFRESH'}
                                </button>
                            </div>
                        </div>

                        {loadingLogs && !logs && (
                            <div className="p-20 text-center text-slate-400 font-black uppercase text-sm italic tracking-widest">
                                Loading sent emails...
                            </div>
                        )}

                        {logs && logs.sent.length === 0 && (
                            <div className="p-20 text-center text-slate-300 dark:text-slate-600 font-black uppercase text-sm italic tracking-widest">
                                NO EMAILS IN THE TRACKING SHEET YET
                            </div>
                        )}

                        {/* Advanced Filter Bar */}
                        {logs && logs.sent.length > 0 && (
                            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1 md:pb-0">
                                    {([
                                        { key: 'all', label: 'All Sent', count: logs.sent.length },
                                        { key: 'opened', label: '🟢 Opened', count: totalOpenedCount },
                                        { key: 'unopened', label: '⚪ Unopened', count: totalUnopenedCount },
                                        { key: 'clicked', label: '🔗 Clicked', count: totalClickedCount },
                                        { key: 'spikes', label: '🔥 Hot Spikes', count: totalSpikesCount },
                                        { key: 'reminders', label: '⏰ Reminders', count: totalRemindersCount },
                                    ] as const).map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setLogsFilter(f.key)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-1.5 flex-shrink-0 ${
                                                logsFilter === f.key
                                                    ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                                            }`}
                                        >
                                            <span>{f.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${logsFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                                {f.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="relative min-w-[200px] flex-1 md:flex-initial">
                                    <input
                                        type="text"
                                        value={logsSearch}
                                        onChange={(e) => setLogsSearch(e.target.value)}
                                        placeholder="🔍 Filter recipient or subject..."
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs outline-none text-slate-800 dark:text-slate-100 font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        {logs && logs.sent.length > 0 && filteredSentEmails.length === 0 && (
                            <div className="p-20 text-center text-slate-300 dark:text-slate-600 font-black uppercase text-sm italic tracking-widest">
                                NO EMAILS MATCH YOUR CURRENT FILTER
                            </div>
                        )}

                        {logs && logs.sent.length > 0 && filteredSentEmails.length > 0 && (
                            <div>
                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredSentEmails.map((email) => {
                                        const emailOpens = logs.opens[email.uid] || [];
                                        const emailLinkClicks = logs.emailClicks[email.uid] || [];
                                        const openCount = emailOpens.length;
                                        const isOpened = openCount > 0;
                                        const isExpanded = !!expandedUids[email.uid];
                                        const rule = followUpRules[email.uid];

                                        return (
                                            <div key={email.uid} className="p-4 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{email.to}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{email.subject}</p>
                                                    </div>
                                                    <ReadReceiptBadge
                                                        openCount={openCount}
                                                        clickCount={emailLinkClicks.length}
                                                        hasFollowUp={rule && rule.status === 'pending'}
                                                        compact={true}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-400">
                                                    <span>{new Date(email.timestamp).toLocaleDateString()}</span>
                                                    {(isOpened || emailLinkClicks.length > 0) && (
                                                        <button
                                                            onClick={() => toggleRowDetails(email.uid)}
                                                            className="text-blue-600 dark:text-blue-400 font-bold text-xs"
                                                        >
                                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="p-5 w-44">Date Sent</th>
                                                <th className="p-5">Recipient</th>
                                                <th className="p-5">Email Purpose</th>
                                                <th className="p-5 w-52">Current Status</th>
                                                <th className="p-5 text-center w-28">Open Count</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredSentEmails.map((email) => {
                                                const emailOpens = logs.opens[email.uid] || [];
                                                const emailLinkClicks = logs.emailClicks[email.uid] || [];
                                                const openCount = emailOpens.length;
                                                const isOpened = openCount > 0;
                                                const isExpanded = !!expandedUids[email.uid];
                                                const rowId = `details-${email.uid}`;
                                                const rule = followUpRules[email.uid];

                                                let timeToFirstOpen = '';
                                                if (isOpened && email.timestamp) {
                                                    const sentTime = new Date(email.timestamp).getTime();
                                                    const firstOpenTime = new Date(emailOpens[0].timestamp).getTime();
                                                    const diffMs = firstOpenTime - sentTime;
                                                    const diffMins = Math.round(diffMs / 60000);

                                                    if (diffMins < 1) timeToFirstOpen = 'under 1 min';
                                                    else if (diffMins < 60) timeToFirstOpen = `${diffMins}m after sending`;
                                                    else {
                                                        const diffHours = Math.round(diffMins / 60);
                                                        timeToFirstOpen = `${diffHours}h after sending`;
                                                    }
                                                }

                                                return (
                                                    <React.Fragment key={email.uid}>
                                                        <tr
                                                            onClick={() => isOpened || emailLinkClicks.length > 0 ? toggleRowDetails(email.uid) : null}
                                                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all border-l-4 cursor-pointer ${
                                                                isOpened ? 'border-green-500' : 'border-slate-200 dark:border-slate-700'
                                                            }`}
                                                        >
                                                            <td className="p-5 text-xs font-bold text-slate-400">
                                                                {new Date(email.timestamp).toLocaleString(undefined, {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                })}
                                                            </td>
                                                            <td className="p-5 font-black text-slate-800 dark:text-slate-100 max-w-xs truncate">
                                                                {email.to}
                                                            </td>
                                                            <td className="p-5 text-xs font-bold text-slate-600 dark:text-slate-300 max-w-sm truncate">
                                                                {email.subject}
                                                            </td>
                                                            <td className="p-5">
                                                                <ReadReceiptBadge
                                                                    openCount={openCount}
                                                                    clickCount={emailLinkClicks.length}
                                                                    hasFollowUp={rule && rule.status === 'pending'}
                                                                    timeToFirstOpen={timeToFirstOpen}
                                                                />
                                                                {(isOpened || emailLinkClicks.length > 0) && (
                                                                    <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase tracking-widest">
                                                                        {isExpanded ? '▼ Hide Logs' : '▶ Click to View Logs'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-5 text-center">
                                                                <span className={`font-black text-sm ${isOpened ? 'text-green-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                                    {openCount}
                                                                </span>
                                                            </td>
                                                        </tr>

                                                        {isExpanded && (isOpened || emailLinkClicks.length > 0) && (
                                                            <tr id={rowId} className="bg-slate-50/50 dark:bg-slate-800/30 shadow-inner">
                                                                <td colSpan={5} className="p-0 border-t border-slate-100 dark:border-slate-800">
                                                                    <div className="p-6 space-y-4 max-w-4xl">
                                                                        {emailLinkClicks.length > 0 && (
                                                                            <div className="mb-4">
                                                                                <h4 className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2 tracking-widest">
                                                                                    🎯 Inside-Email Link Clicks ({emailLinkClicks.length})
                                                                                </h4>
                                                                                <div className="space-y-2">
                                                                                    {emailLinkClicks.map((click, idx) => (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="flex flex-wrap items-center justify-between p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100/50 dark:border-blue-900/50 shadow-sm"
                                                                                        >
                                                                                            <div className="max-w-md truncate">
                                                                                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Clicked Link URL</span>
                                                                                                <a
                                                                                                    href={click.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
                                                                                                >
                                                                                                    {click.url}
                                                                                                </a>
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Time Clicked</span>
                                                                                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                                                                                    {new Date(click.timestamp).toLocaleString()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                                                                                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                                                                                    📍 {click.city || click.region || click.country ? `${click.city ? click.city + ', ' : ''}${click.country || ''}` : 'Unknown'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {isOpened && (
                                                                            <div>
                                                                                <h4 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">
                                                                                    📊 Granular Activity Log ({openCount})
                                                                                </h4>
                                                                                <div className="space-y-2">
                                                                                    {emailOpens.map((open, idx) => (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="flex flex-wrap items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                                                                        >
                                                                                            <div>
                                                                                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Opened At</span>
                                                                                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                                                                                    {new Date(open.timestamp).toLocaleString()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="text-[9px] text-slate-400 block font-bold uppercase">IP Address</span>
                                                                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                                                                                                    {open.ip_address}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Location</span>
                                                                                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">
                                                                                                    📍 {open.city || open.region || open.country ?
                                                                                                        `${open.city ? open.city + ', ' : ''}${open.region ? open.region + ' ' : ''}(${open.country || 'Unknown'})`
                                                                                                        : 'Unknown Location'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Device Details</span>
                                                                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                                                                                                    {open.device === 'Desktop' ? '💻' : '📱'} {open.device || 'Desktop'}
                                                                                                </span>
                                                                                                <span className="text-[10px] text-slate-400 block">
                                                                                                    {open.browser || 'Unknown'} ({open.os || 'Unknown'})
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {page < totalPages && (
                                    <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => {
                                                setLoadingMore(true);
                                                fetchLogs(false, true);
                                            }}
                                            disabled={loadingMore}
                                            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black px-8 py-3 rounded-2xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            {loadingMore ? 'LOADING...' : 'LOAD MORE EMAILS'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <AnalyticsView
                        sentEmails={logs?.sent || []}
                        opensMap={logs?.opens || {}}
                        clicksMap={logs?.emailClicks || {}}
                        darkMode={darkMode}
                    />
                )}

                {/* OUTLOOK SETUP TAB */}
                {activeTab === 'outlook' && (
                    <div className="space-y-8 max-w-4xl">
                        <div className="bg-slate-800 dark:bg-slate-900 rounded-3xl shadow-xl p-8 text-white border border-slate-700">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                                    🔌
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">Outlook Desktop Integration</h2>
                                    <p className="text-slate-300 text-sm mt-0.5">Automatic pixel injection on every Send — zero clicks required</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-white/10 rounded-2xl p-4 text-center">
                                    <div className="text-2xl mb-1">🎯</div>
                                    <div className="text-xs font-bold text-slate-300 uppercase">Auto-inject</div>
                                    <div className="text-white font-black text-sm mt-1">On every Send</div>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4 text-center">
                                    <div className="text-2xl mb-1">📬</div>
                                    <div className="text-xs font-bold text-slate-300 uppercase">Account-agnostic</div>
                                    <div className="text-white font-black text-sm mt-1">Gmail + All Others</div>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4 text-center">
                                    <div className="text-2xl mb-1">📱</div>
                                    <div className="text-xs font-bold text-slate-300 uppercase">Push Notifications</div>
                                    <div className="text-white font-black text-sm mt-1">ntfy + Email Alert</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">Install the Add-in in Outlook</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-2xl p-5">
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">Download the manifest file first:</p>
                                    <a
                                        href="/outlook/manifest.xml"
                                        download="InboxRetina-mckellar-manifest.xml"
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        ⬇️ Download manifest.xml
                                    </a>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">Or use the direct URL: <code className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded">https://mckellar.dev/outlook/manifest.xml</code></p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">How to Sideload in New Outlook (via Web Interface):</p>
                                    {[
                                        { step: '1', text: 'Log in to Outlook on the web at https://outlook.office.com/' },
                                        { step: '2', text: 'Go directly to the add-ins portal by opening this link: https://aka.ms/olksideload' },
                                        { step: '3', text: 'In the popup dialog, select the "My add-ins" tab and scroll down to the bottom' },
                                        { step: '4', text: 'Click "+ Add a custom add-in" → "Add from file..." and choose the downloaded manifest.xml' },
                                        { step: '5', text: 'Open/Restart your New Outlook desktop client — the add-in will automatically sync and run on Send!' },
                                    ].map(({ step, text }) => (
                                        <div key={step} className="flex gap-3 items-start">
                                            <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">{step}</span>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{text}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4">
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">⚠️ Don&apos;t see &quot;Add from file&quot;?</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Some corporate Microsoft 365 policies disable sideloading. Check with your IT admin or try using the URL method instead.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">How It Works</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { icon: '✏️', label: 'You compose an email in Outlook (any account — Gmail, @mckellar.dev, anything)' },
                                    { icon: <SentPlaneIcon className="w-5 h-5 text-blue-600 inline-block" />, label: 'You click Send — the add-in fires automatically (no button clicks, no ribbon interaction needed)' },
                                    { icon: '🎯', label: 'A 1×1 invisible tracking pixel is silently appended to your email before it leaves Outlook' },
                                    { icon: '📊', label: 'The email is registered in your Track Sheet automatically — no manual steps' },
                                    { icon: '📱', label: 'When your client opens the email, you get an ntfy push + email alert instantly' },
                                ].map(({ icon, label }, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <span className="text-xl flex-shrink-0 flex items-center justify-center pt-0.5">{icon}</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">Enable Instant Phone Notifications (Optional)</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Get a push notification on your phone the moment a client opens your email — using the free ntfy app.</p>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 rounded-2xl p-4">
                                        <p className="text-sm font-black text-purple-800 dark:text-purple-300 mb-2">📱 On your phone:</p>
                                        <ol className="text-xs text-purple-700 dark:text-purple-300 space-y-1 list-decimal list-inside">
                                            <li>Download ntfy from the App Store or Google Play</li>
                                            <li>Open the app → tap + → enter a topic name (e.g. <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">mckellar-retina-2026</code>)</li>
                                            <li>Subscribe to that topic</li>
                                        </ol>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 rounded-2xl p-4">
                                        <p className="text-sm font-black text-purple-800 dark:text-purple-300 mb-2">⚙️ In Vercel (one-time):</p>
                                        <ol className="text-xs text-purple-700 dark:text-purple-300 space-y-1 list-decimal list-inside">
                                            <li>Go to your Vercel project → Settings → Environment Variables</li>
                                            <li>Add: <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">NTFY_TOPIC</code> = your topic name</li>
                                            <li>Redeploy once — done</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Notification preview</p>
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                                            <RetinaEye className="w-5 h-5 text-emerald-500" glow={true} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">Email Opened</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">&quot;AI Deployment Scope &amp; Next Steps&quot; opened by john@business.com from Morristown, NJ</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {logs && logs.sent.some(e => e.source === 'outlook') && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200/80 dark:border-slate-800">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">📊 Recent Outlook-tracked Emails</h3>
                                <div className="space-y-3">
                                    {logs.sent
                                        .filter(e => e.source === 'outlook')
                                        .slice(0, 10)
                                        .map((email) => {
                                            const opens = logs.opens[email.uid] || [];
                                            return (
                                                <div key={email.uid} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{email.subject}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">To: {email.to} · {new Date(email.timestamp).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={`text-xs font-black px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                                                        opens.length > 0
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        {opens.length > 0 ? (
                                                            <>
                                                                <RetinaEye className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>{opens.length} open{opens.length > 1 ? 's' : ''}</span>
                                                            </>
                                                        ) : (
                                                            'Not opened'
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Event Intelligence Detail Modal */}
                <EventDetailsModal
                    event={selectedFeedEvent}
                    onClose={() => setSelectedFeedEvent(null)}
                    darkMode={darkMode}
                />

                {/* Connect Secondary Email Modal */}
                {showConnectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <span>Connect Email Account</span>
                                </h3>
                                <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Link additional email addresses (e.g., Gmail, Outlook, Work email) to your account to consolidate tracking receipts.
                            </p>
                            <form onSubmit={handleConnectNewEmail} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">New Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newEmailToConnect}
                                        onChange={(e) => setNewEmailToConnect(e.target.value)}
                                        placeholder="richard@mckellar.dev"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl outline-none text-slate-800 dark:text-slate-100 font-bold text-sm"
                                        autoFocus
                                    />
                                </div>

                                {userEmails.length > 0 && (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Currently Connected ({userEmails.length})</span>
                                        <div className="flex flex-wrap gap-1">
                                            {userEmails.map((e, idx) => (
                                                <span key={idx} className="text-[11px] font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    {e}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowConnectModal(false)}
                                        className="w-1/2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl text-xs transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs shadow-md transition-all"
                                    >
                                        Connect Email
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* In-App Real-Time Toast Notifications Stack */}
                <RetinaToastStack
                    toasts={toasts}
                    onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
}
