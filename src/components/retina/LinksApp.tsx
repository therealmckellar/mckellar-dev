import React, { useState, useEffect, useRef } from 'react';
import type { ShortLink, ClickEvent } from '../../lib/retinaTypes';

interface LinksData {
    links: ShortLink[];
    clicks: Record<string, ClickEvent[]>;
}

async function generateQrDataUrl(shortUrl: string): Promise<string> {
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(shortUrl)}`;
    try {
        const res = await fetch(apiUrl);
        if (!res.ok) return apiUrl;
        const blob = await res.blob();
        return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : apiUrl);
            reader.onerror = () => resolve(apiUrl);
            reader.readAsDataURL(blob);
        });
    } catch {
        return apiUrl;
    }
}

export default function LinksApp() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');

    const [linksData, setLinksData] = useState<LinksData | null>(null);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [expandedSlugs, setExpandedSlugs] = useState<Record<string, boolean>>({});

    // QR Codes Cache
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
    const [showQrModal, setShowQrModal] = useState<string | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Create Link Form
    const [formSlug, setFormSlug] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formName, setFormName] = useState('');
    const [creatingLink, setCreatingLink] = useState(false);

    // Edit Link Form / Modal State
    const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editName, setEditName] = useState('');
    const [updatingLink, setUpdatingLink] = useState(false);

    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const baseUrlRef = useRef<string>('');

    useEffect(() => {
        baseUrlRef.current = window.location.origin;

        const savedPassword = sessionStorage.getItem('retina_password');
        if (savedPassword) {
            fetch('/api/retina/auth/', {
                headers: { 'x-retina-password': savedPassword },
            }).then(res => {
                if (res.ok) setIsAuthenticated(true);
            }).catch(() => {});
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchLinks();
    }, [isAuthenticated]);

    // Automatically generate QR codes for links when loaded
    useEffect(() => {
        if (!linksData) return;
        linksData.links.forEach((link) => {
            const shortUrl = `${baseUrlRef.current}/l/${link.slug}`;
            if (!qrCodes[link.slug]) {
                generateQrDataUrl(shortUrl)
                    .then((dataUrl) => {
                        setQrCodes((prev) => ({ ...prev, [link.slug]: dataUrl }));
                    })
                    .catch((err) => console.error('Error generating QR:', err));
            }
        });
    }, [linksData]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/retina/auth/', {
                method: 'POST',
                headers: { 'x-retina-password': password },
            });
            if (res.ok) {
                sessionStorage.setItem('retina_password', password);
                setIsAuthenticated(true);
                setLoginError('');
            } else {
                setLoginError('Incorrect password.');
            }
        } catch {
            setLoginError('Network error. Please try again.');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('retina_password');
        setIsAuthenticated(false);
        setLinksData(null);
    };

    const fetchLinks = async () => {
        setLoadingLinks(true);
        const savedPassword = sessionStorage.getItem('retina_password') || password;

        try {
            const res = await fetch('/api/retina/links/', {
                headers: {
                    'x-retina-password': savedPassword,
                },
            });

            if (res.ok) {
                const data: LinksData = await res.json();
                data.links = data.links.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setLinksData(data);
            } else if (res.status === 401) {
                handleLogout();
            }
        } catch (err) {
            console.error('Error fetching links:', err);
        } finally {
            setLoadingLinks(false);
        }
    };

    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingLink(true);
        setAlertMessage(null);

        const savedPassword = sessionStorage.getItem('retina_password') || password;

        try {
            const res = await fetch('/api/retina/links/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-retina-password': savedPassword,
                },
                body: JSON.stringify({
                    slug: formSlug,
                    url: formUrl,
                    name: formName,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const shortUrl = `${baseUrlRef.current}/l/${data.slug}`;
                setAlertMessage({
                    type: 'success',
                    text: `✅ Success! Link created: ${shortUrl}`,
                });
                setFormSlug('');
                setFormUrl('');
                setFormName('');
                fetchLinks();
            } else {
                const errData = await res.json().catch(() => ({}));
                setAlertMessage({
                    type: 'error',
                    text: `❌ Error: ${errData.error || 'Failed to create link.'}`,
                });
            }
        } catch {
            setAlertMessage({
                type: 'error',
                text: '❌ Network error creating link.',
            });
        } finally {
            setCreatingLink(false);
        }
    };

    const handleOpenEdit = (link: ShortLink) => {
        setEditingLink(link);
        setEditUrl(link.url);
        setEditName(link.name);
        setAlertMessage(null);
    };

    const handleUpdateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLink) return;
        setUpdatingLink(true);

        const savedPassword = sessionStorage.getItem('retina_password') || password;

        try {
            const res = await fetch('/api/retina/links/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-retina-password': savedPassword,
                },
                body: JSON.stringify({
                    slug: editingLink.slug,
                    url: editUrl,
                    name: editName,
                }),
            });

            if (res.ok) {
                setAlertMessage({
                    type: 'success',
                    text: `✏️ Updated link destination for: /l/${editingLink.slug}`,
                });
                setEditingLink(null);
                fetchLinks();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Error updating link: ${errData.error || 'Failed.'}`);
            }
        } catch (err) {
            console.error('Error updating link:', err);
        } finally {
            setUpdatingLink(false);
        }
    };

    const handleDeleteLink = async (slug: string) => {
        if (!confirm(`Are you sure you want to delete /l/${slug}?`)) return;

        const savedPassword = sessionStorage.getItem('retina_password') || password;

        try {
            const res = await fetch('/api/retina/links/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-retina-password': savedPassword,
                },
                body: JSON.stringify({ slug }),
            });

            if (res.ok) {
                setAlertMessage({
                    type: 'success',
                    text: `🗑️ Deleted link: /l/${slug}`,
                });
                fetchLinks();
            } else {
                alert('Failed to delete link');
            }
        } catch (err) {
            console.error('Error deleting link:', err);
        }
    };

    const downloadQrCode = (slug: string) => {
        const dataUrl = qrCodes[slug];
        if (!dataUrl) return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${slug}-qr-code.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const toggleRowDetails = (slug: string) => {
        setExpandedSlugs((prev) => ({
            ...prev,
            [slug]: !prev[slug],
        }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied link to clipboard!');
    };

    const filteredLinks = linksData?.links.filter((link) => {
        const query = searchQuery.toLowerCase();
        return (
            link.name.toLowerCase().includes(query) ||
            link.slug.toLowerCase().includes(query) ||
            link.url.toLowerCase().includes(query)
        );
    }) || [];

    if (!isAuthenticated) {
        return (
            <div className="bg-slate-900 min-h-screen flex items-center justify-center font-sans p-4">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-96 border border-slate-100">
                    <div className="text-center mb-6">
                        <span className="text-4xl">🔗</span>
                        <h1 className="text-2xl font-black text-slate-800 mt-2">Link Manager</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">mckellar.dev Branded Shortener</p>
                    </div>
                    {loginError && <p className="text-red-500 text-sm font-bold text-center mb-4">{loginError}</p>}
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="w-full border border-slate-200 p-4 rounded-2xl mb-4 focus:ring-4 focus:ring-indigo-500/10 outline-none text-center font-bold text-slate-800"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black p-4 rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            Access Manager
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 text-slate-800 min-h-screen font-sans pb-16 relative">
            {/* Navbar */}
            <div className="max-w-6xl mx-auto px-4 pt-10">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🔗</span>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
                                Link Manager
                            </h1>
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md mt-1 inline-block uppercase">
                                mckellar.dev Retina Links
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="/email-logs/" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                            Email Tracking
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
                            alertMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {alertMessage.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Link Sidebar */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200/80 h-fit lg:col-span-1">
                        <h2 className="text-xl font-black text-slate-800 mb-4">Create Short Link</h2>
                        <form onSubmit={handleCreateLink} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Link Name / Description</label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-800 text-sm font-bold"
                                    placeholder="e.g. AI Readiness Deck"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Destination URL</label>
                                <input
                                    type="url"
                                    required
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-800 text-sm font-bold"
                                    placeholder="https://calendar.mckellar.dev/richard/30min"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Short Path (Slug)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                                    <span className="text-xs font-bold text-slate-400 select-none">/l/</span>
                                    <input
                                        type="text"
                                        required
                                        value={formSlug}
                                        onChange={(e) => setFormSlug(e.target.value)}
                                        className="w-full bg-transparent border-0 p-3.5 outline-none text-slate-800 text-sm font-bold"
                                        placeholder="call"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={creatingLink}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all text-sm"
                            >
                                {creatingLink ? 'Creating...' : 'Shorten Link →'}
                            </button>
                        </form>
                    </div>

                    {/* Links Table & List */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 lg:col-span-2 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                            <h2 className="text-xl font-black text-slate-800">Short Links & Engagement</h2>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="🔍 Search links..."
                                    className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all w-full sm:w-48"
                                />
                                <button
                                    onClick={fetchLinks}
                                    disabled={loadingLinks}
                                    className="bg-white border text-indigo-600 border-indigo-200 font-black px-4 py-2 rounded-xl text-xs hover:bg-indigo-50 transition-all shadow-sm shrink-0"
                                >
                                    {loadingLinks ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>
                        </div>

                        {loadingLinks && !linksData && (
                            <div className="p-16 text-center text-slate-400 font-bold italic">
                                Loading short links...
                            </div>
                        )}

                        {linksData && filteredLinks.length === 0 && (
                            <div className="p-16 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest">
                                {searchQuery ? 'No matching links found.' : 'No short links created yet.'}
                            </div>
                        )}

                        {linksData && filteredLinks.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 w-14 text-center">QR</th>
                                            <th className="p-4">Link Details</th>
                                            <th className="p-4 text-center w-28">Clicks</th>
                                            <th className="p-4 w-28 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLinks.map((link) => {
                                            const clickEvents = linksData.clicks[link.slug] || [];
                                            const clickCount = clickEvents.length;
                                            const isExpanded = !!expandedSlugs[link.slug];
                                            const shortUrl = `${baseUrlRef.current}/l/${link.slug}`;
                                            const qrUrl = qrCodes[link.slug];

                                            return (
                                                <React.Fragment key={link.slug}>
                                                    <tr className="hover:bg-slate-50/40 transition-colors">
                                                        <td className="p-4 text-center">
                                                            {qrUrl ? (
                                                                <button
                                                                    onClick={() => setShowQrModal(link.slug)}
                                                                    className="hover:scale-110 active:scale-95 transition-transform"
                                                                    title="View QR Code"
                                                                >
                                                                    <img src={qrUrl} alt="QR Thumbnail" className="w-8 h-8 border border-slate-200 rounded-md shadow-sm" />
                                                                </button>
                                                            ) : (
                                                                <span className="text-[9px] text-slate-300 font-black">QR</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-black text-slate-800 text-sm leading-snug">
                                                                {link.name}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <button
                                                                    onClick={() => copyToClipboard(shortUrl)}
                                                                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded"
                                                                >
                                                                    /l/{link.slug} 📋
                                                                </button>
                                                                <span className="text-[10px] text-slate-300">→</span>
                                                                <span className="text-[10px] text-slate-400 max-w-xs truncate font-medium">
                                                                    {link.url}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button
                                                                onClick={() => clickCount > 0 ? toggleRowDetails(link.slug) : null}
                                                                disabled={clickCount === 0}
                                                                className={`font-black text-sm px-3 py-1 rounded-full ${
                                                                    clickCount > 0
                                                                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                                                        : 'text-slate-300 pointer-events-none'
                                                                }`}
                                                            >
                                                                {clickCount}
                                                            </button>
                                                            {clickCount > 0 && (
                                                                <span className="text-[8px] text-slate-400 block mt-1 uppercase font-bold">
                                                                    {isExpanded ? '▼ Hide' : '▶ Details'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleOpenEdit(link)}
                                                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLink(link.slug)}
                                                                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-3 py-2 rounded-xl transition-all"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {isExpanded && clickCount > 0 && (
                                                        <tr className="bg-slate-50/50 shadow-inner">
                                                            <td colSpan={4} className="p-4 border-t border-slate-100">
                                                                <div className="space-y-2 max-w-3xl">
                                                                    <h4 className="text-[9px] font-black uppercase text-indigo-600 tracking-widest mb-2">
                                                                        📊 Click Analytics Log
                                                                    </h4>
                                                                    {clickEvents.map((click, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex flex-wrap items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm text-xs"
                                                                        >
                                                                            <div>
                                                                                <span className="text-[8px] text-slate-400 block font-bold uppercase">Click Date & Time</span>
                                                                                <span className="font-black text-slate-800">
                                                                                    {new Date(click.timestamp).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-[8px] text-slate-400 block font-bold uppercase">Visitor IP</span>
                                                                                <span className="font-bold text-indigo-600 block">
                                                                                    {click.ip_address}
                                                                                </span>
                                                                                {click.referrer && (
                                                                                    <span className="text-[8px] text-slate-400">
                                                                                        Ref: {click.referrer}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-[8px] text-slate-400 block font-bold uppercase">Location</span>
                                                                                <span className="font-black text-emerald-700 block">
                                                                                    📍 {click.city || click.region || click.country ?
                                                                                        `${click.city ? click.city + ', ' : ''}${click.region ? click.region + ' ' : ''}(${click.country || 'Unknown'})`
                                                                                        : 'Unknown Location'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <span className="text-[8px] text-slate-400 block font-bold uppercase">Device Details</span>
                                                                                <span className="font-black text-slate-700 block">
                                                                                    {click.device === 'Desktop' ? '💻' : '📱'} {click.device || 'Desktop'}
                                                                                </span>
                                                                                <span className="text-[9px] text-slate-400 block">
                                                                                    {click.browser} ({click.os})
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
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
                        )}
                    </div>
                </div>
            </div>

            {/* QR CODE VIEW MODAL */}
            {showQrModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in scale-in duration-200">
                        <h3 className="text-xl font-black text-slate-800 mb-2">QR Code</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">/l/{showQrModal}</p>

                        {qrCodes[showQrModal] && (
                            <img src={qrCodes[showQrModal]} alt="Full QR Code" className="w-56 h-56 mx-auto border border-slate-200 rounded-2xl shadow-inner mb-6" />
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => downloadQrCode(showQrModal)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl transition-all shadow-md text-sm"
                            >
                                Download PNG
                            </button>
                            <button
                                onClick={() => setShowQrModal(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-6 rounded-2xl transition-all text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT LINK MODAL */}
            {editingLink && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in scale-in duration-200">
                        <h3 className="text-xl font-black text-slate-800 mb-2">Edit Short Link Destination</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Modifying URL for: <b>/l/{editingLink.slug}</b></p>

                        <form onSubmit={handleUpdateLink} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Link Name / Description</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none text-slate-800 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Destination URL</label>
                                <input
                                    type="url"
                                    required
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none text-slate-800 text-sm font-bold"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={updatingLink}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-xl transition-all shadow-md text-sm disabled:opacity-50"
                                >
                                    {updatingLink ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingLink(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-6 rounded-xl transition-all text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
