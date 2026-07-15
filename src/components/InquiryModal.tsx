import React, { useState, useEffect, useCallback } from 'react';
import { CALENDAR_URL } from '../lib/inquiry';

interface OpenDetail {
  subject?: string;
  source?: string;
}

const EMPTY = { name: '', email: '', company: '', phone: '', subject: '', message: '' };

const InquiryModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [presetSubject, setPresetSubject] = useState('General Advisory Inquiry');
  const [source, setSource] = useState('website');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'scheduling' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Listen for the global open-inquiry event dispatched by any Inquire button
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenDetail>).detail || {};
      setPresetSubject(detail.subject || 'General Advisory Inquiry');
      setSource(detail.source || 'website');
      setForm(EMPTY);
      setStatus('idle');
      setError('');
      setOpen(true);
    };
    window.addEventListener('open-inquiry', handler as EventListener);
    return () => window.removeEventListener('open-inquiry', handler as EventListener);
  }, []);

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
    // Open booking in a new tab regardless; if submit failed, still let them book.
    window.open(CALENDAR_URL, '_blank', 'noopener,noreferrer');
    setStatus(ok ? 'success' : 'error');
  };

  if (!open) return null;

  return (
    <div className="inquiry-overlay" onClick={close} role="presentation">
      <div
        className="inquiry-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Start a conversation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-on-surface">Start a Conversation</h3>
          <button type="button" onClick={close} aria-label="Close" className="inquiry-close">×</button>
        </div>

        {status === 'success' ? (
          <div className="inquiry-success">
            <div className="inquiry-success-icon">✓</div>
            <p className="font-semibold text-on-surface">Thanks — your inquiry is in.</p>
            <p className="text-sm text-on-surface-muted mt-1">
              Rich will reach out shortly. The team is notified instantly via ntfy, email, and webhook.
            </p>
            <button type="button" onClick={close} className="inquiry-submit mt-4">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <p className="text-xs font-mono uppercase tracking-wider text-indigo-400">{presetSubject}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required className="inquiry-input" placeholder="Full name *" value={form.name} onChange={update('name')} />
              <input required type="email" className="inquiry-input" placeholder="Email *" value={form.email} onChange={update('email')} />
              <input className="inquiry-input" placeholder="Company" value={form.company} onChange={update('company')} />
              <input className="inquiry-input" placeholder="Phone (optional)" value={form.phone} onChange={update('phone')} />
            </div>
            <input className="inquiry-input" placeholder="Subject (optional)" value={form.subject} onChange={update('subject')} />
            <textarea required className="inquiry-input inquiry-textarea" placeholder="How can Rich help? *" value={form.message} onChange={update('message')} />
            {status === 'error' && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={status === 'sending' || status === 'scheduling'} className="inquiry-submit">
              {status === 'sending' ? 'Sending…' : 'Send Inquiry'}
            </button>
            <button
              type="button"
              onClick={submitAndSchedule}
              disabled={status === 'sending' || status === 'scheduling'}
              className="inquiry-schedule"
            >
              {status === 'scheduling' ? 'Sending & Opening Calendar…' : 'Send Inquiry & Book a Call'}
            </button>
            <p className="text-[10px] text-on-surface-subtle text-center">
              We'll notify Rich instantly via ntfy, email, and webhook.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
