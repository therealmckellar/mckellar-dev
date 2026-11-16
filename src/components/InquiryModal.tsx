import React, { useState, useEffect, useCallback } from 'react';
import { CALENDAR_URL } from '../lib/inquiry';

interface OpenDetail {
  subject?: string;
  source?: string;
}

declare global {
  interface Window {
    __pendingInquiry?: OpenDetail | null;
  }
}

const EMPTY = { name: '', email: '', company: '', phone: '', subject: '', message: '' };

const InquiryModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [presetSubject, setPresetSubject] = useState('General Advisory Inquiry');
  const [source, setSource] = useState('website');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'scheduling' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const openWithDetail = useCallback((detail: OpenDetail) => {
    setPresetSubject(detail.subject || 'General Advisory Inquiry');
    setSource(detail.source || 'website');
    setForm(EMPTY);
    setStatus('idle');
    setError('');
    setOpen(true);
  }, []);

  // Listen for the global open-inquiry event dispatched by any Inquire button
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenDetail>).detail || {};
      openWithDetail(detail);
    };
    window.addEventListener('open-inquiry', handler as EventListener);

    // Flush any click that happened prior to React hydration
    if (window.__pendingInquiry) {
      const pending = window.__pendingInquiry;
      window.__pendingInquiry = null;
      queueMicrotask(() => openWithDetail(pending));
    }

    return () => window.removeEventListener('open-inquiry', handler as EventListener);
  }, [openWithDetail]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const update = (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // Single POST to /api/inquiry. Returns true on success.
  const postInquiry = async (): Promise<boolean> => {
    if (!form.name || !form.email || !form.message) {
      setError('Name, email, and message are required.');
      setStatus('error');
      return false;
    }
    setError('');
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subject: form.subject || presetSubject,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return true;
      setStatus('error');
      setError(data.error || 'Something went wrong. Please try again.');
      return false;
    } catch {
      setStatus('error');
      setError('Network error. Please try again.');
      return false;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const ok = await postInquiry();
    if (ok) setStatus('success');
  };

  // Submit the inquiry AND open the calendar in a new tab to book a 30-min call.
  const submitAndSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('scheduling');
    const ok = await postInquiry();
    window.open(CALENDAR_URL, '_blank');
    setStatus(ok ? 'success' : 'error');
  };

  if (!open) return null;

  return (
    <div className="inquiry-overlay" onClick={close} role="presentation">
      <div
        className="inquiry-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Send a message to Richard McKellar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-semibold mb-1">
              Get in Touch
            </p>
            <h3 className="font-display font-bold text-lg text-on-surface leading-tight">
              Send Richard a Message
            </h3>
          </div>
          <button type="button" onClick={close} aria-label="Close inquiry modal" className="inquiry-close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="inquiry-success">
            <div className="inquiry-success-icon" aria-hidden="true">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-display font-semibold text-base text-on-surface">Thanks — your inquiry is in.</p>
            <p className="text-sm text-on-surface-muted mt-1.5">
              Got it—Richard McKellar will follow up with you shortly.
            </p>
            <button type="button" onClick={close} className="inquiry-submit mt-5">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--color-accent-dim)] border border-indigo-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface">{presetSubject}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required className="inquiry-input" placeholder="Full name *" value={form.name} onChange={update('name')} />
              <input required type="email" className="inquiry-input" placeholder="Email *" value={form.email} onChange={update('email')} />
              <input className="inquiry-input" placeholder="Company" value={form.company} onChange={update('company')} />
              <input className="inquiry-input" placeholder="Phone (optional)" value={form.phone} onChange={update('phone')} />
            </div>
            <input className="inquiry-input" placeholder="Subject (optional)" value={form.subject} onChange={update('subject')} />
            <textarea required className="inquiry-input inquiry-textarea" placeholder="How can Richard help? *" value={form.message} onChange={update('message')} />
            {status === 'error' && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button type="submit" disabled={status === 'sending' || status === 'scheduling'} className="inquiry-submit">
              {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
            </button>
            <button
              type="button"
              onClick={submitAndSchedule}
              disabled={status === 'sending' || status === 'scheduling'}
              className="inquiry-schedule"
            >
              {status === 'scheduling' ? 'Sending & Opening Calendar...' : 'Send Inquiry & Book 30-Min Call'}
            </button>
            <p className="text-[10px] font-mono text-on-surface-subtle text-center">
              Morristown, NJ · Goes straight to Richard McKellar
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
