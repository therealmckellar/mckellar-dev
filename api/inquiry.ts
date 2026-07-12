// Standalone Vercel serverless function for lead capture.
// Deployed automatically from the repo-root `api/` directory.
// Astro is pure-static (output builds to dist/), so this function handles
// the /api/inquiry POST and fans out to ntfy + SMTP + webhook.
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Inquiry {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  source?: string;
}

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

function env(key: string, fallback = ''): string {
  return (process.env[key] ?? fallback) || '';
}

function send(res: VercelResponse, status: number, body: unknown) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return send(res, 405, { ok: false, error: 'Method not allowed' });
  }

  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return send(res, 400, { ok: false, error: 'Invalid JSON' });
  }

  const { name, email, company, phone, subject, message, source } = body ?? {};

  if (!name || !email || !subject || !message) {
    return send(res, 422, { ok: false, error: 'Missing required fields (name, email, subject, message).' });
  }
  if (!EMAIL_RE.test(String(email))) {
    return send(res, 422, { ok: false, error: 'Invalid email address.' });
  }

  const inquiry: Inquiry = {
    name: String(name).trim(),
    email: String(email).trim(),
    company: company ? String(company).trim() : '',
    phone: phone ? String(phone).trim() : '',
    subject: String(subject).trim(),
    message: String(message).trim(),
    source: source ? String(source).trim() : 'website',
  };

  const results: Record<string, string> = {};

  // 1. ntfy push notification
  try {
    const server = env('NTFY_SERVER');
    const topic = env('NTFY_TOPIC');
    if (server && topic) {
      const base = server.endsWith('/') ? server.slice(0, -1) : server;
      const url = `${base}/${encodeURIComponent(topic)}`;
      const headers: Record<string, string> = {
        Title: `New Inquiry: ${inquiry.subject}`,
        Tags: 'envelope,wave',
        Priority: 'high',
        'Content-Type': 'text/plain',
      };
      const user = env('NTFY_USER');
      const pass = env('NTFY_PASS');
      if (user && pass) headers['Authorization'] = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
      const text =
        `Name: ${inquiry.name}\n` +
        `Email: ${inquiry.email}\n` +
        `Company: ${inquiry.company || '-'}\n` +
        `Phone: ${inquiry.phone || '-'}\n` +
        `Subject: ${inquiry.subject}\n` +
        `Source: ${inquiry.source}\n\n` +
        inquiry.message;
      const r = await fetch(url, { method: 'POST', headers, body: text });
      results.ntfy = r.ok ? 'sent' : `failed:${r.status}`;
    } else {
      results.ntfy = 'skipped (not configured)';
    }
  } catch (e: any) {
    results.ntfy = `error:${e?.message ?? 'unknown'}`;
  }

  // 2. Email via SMTP (nodemailer)
  try {
    const host = env('SMTP_HOST');
    const user = env('SMTP_USER');
    const pass = env('SMTP_PASS');
    const to = env('INQUIRY_EMAIL_TO');
    const from = env('SMTP_FROM') || user;
    if (host && user && pass && to) {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host,
        port: Number(env('SMTP_PORT', '587')),
        secure: env('SMTP_SECURE', 'false') === 'true',
        auth: { user, pass },
      });
      const text =
        `New inquiry from ${inquiry.name} (${inquiry.email})\n` +
        `Company: ${inquiry.company || '-'}\n` +
        `Phone: ${inquiry.phone || '-'}\n` +
        `Subject: ${inquiry.subject}\n` +
        `Source: ${inquiry.source}\n\n` +
        inquiry.message;
      await transporter.sendMail({ from, to, replyTo: inquiry.email, subject: `New Inquiry: ${inquiry.subject}`, text });
      results.email = 'sent';
    } else {
      results.email = 'skipped (not configured)';
    }
  } catch (e: any) {
    results.email = `error:${e?.message ?? 'unknown'}`;
  }

  // 3. Generic webhook (JSON POST)
  try {
    const wh = env('INQUIRY_WEBHOOK_URL');
    if (wh) {
      const r = await fetch(wh, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'inquiry', ...inquiry, receivedAt: new Date().toISOString() }),
      });
      results.webhook = r.ok ? 'sent' : `failed:${r.status}`;
    } else {
      results.webhook = 'skipped (not configured)';
    }
  } catch (e: any) {
    results.webhook = `error:${e?.message ?? 'unknown'}`;
  }

  return send(res, 200, { ok: true, results });
}
