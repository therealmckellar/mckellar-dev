import type { APIRoute } from 'astro';

interface Inquiry {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server-only env (also falls back to process.env for node standalone runtime)
function env(key: string, fallback = ''): string {
  const v = (import.meta.env as Record<string, string | undefined>)[key]
    ?? (process.env as Record<string, string | undefined>)[key];
  return v ?? fallback;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const { name, email, company, phone, subject, message, source } = body ?? {};

  if (!name || !email || !subject || !message) {
    return json({ ok: false, error: 'Missing required fields (name, email, subject, message).' }, 422);
  }
  if (!EMAIL_RE.test(String(email))) {
    return json({ ok: false, error: 'Invalid email address.' }, 422);
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

  // ── 1. ntfy push notification ──────────────────────────────────────────────
  try {
    const server = env('NTFY_SERVER');
    const topic = env('NTFY_TOPIC');
    if (server && topic) {
      const url = `${server.replace(/\/$/, '')}/${encodeURIComponent(topic)}`;
      const headers: Record<string, string> = {
        'Title': `New Inquiry: ${inquiry.subject}`,
        'Tags': 'envelope,wave',
        'Priority': 'high',
        'Content-Type': 'text/plain',
      };
      const user = env('NTFY_USER');
      const pass = env('NTFY_PASS');
      if (user && pass) {
        headers['Authorization'] = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
      }
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

  // ── 2. Email via SMTP (nodemailer) ────────────────────────────────────────
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
      await transporter.sendMail({
        from,
        to,
        replyTo: inquiry.email,
        subject: `New Inquiry: ${inquiry.subject}`,
        text,
      });
      results.email = 'sent';
    } else {
      results.email = 'skipped (not configured)';
    }
  } catch (e: any) {
    results.email = `error:${e?.message ?? 'unknown'}`;
  }

  // ── 3. Generic webhook (JSON POST) ─────────────────────────────────────────
  try {
    const wh = env('INQUIRY_WEBHOOK_URL');
    if (wh) {
      const r = await fetch(wh, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry',
          ...inquiry,
          receivedAt: new Date().toISOString(),
        }),
      });
      results.webhook = r.ok ? 'sent' : `failed:${r.status}`;
    } else {
      results.webhook = 'skipped (not configured)';
    }
  } catch (e: any) {
    results.webhook = `error:${e?.message ?? 'unknown'}`;
  }

  return json({ ok: true, results }, 200);
};

export const GET: APIRoute = async () => json({ ok: false, error: 'Method not allowed' }, 405);
