/**
 * Unified email delivery helper for Inbox Retina on mckellar.dev.
 * Supports:
 * 1. Resend HTTP API (process.env.RESEND_API_KEY) — zero extra npm dependency required
 * 2. Nodemailer SMTP (process.env.SMTP_HOST, SMTP_USER, SMTP_PASS)
 */
export async function sendRetinaEmail({
    to,
    subject,
    html,
    from,
    replyTo,
}: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
    const recipients = Array.isArray(to) ? to : [to];
    const resendApiKey = process.env.RESEND_API_KEY;

    // 1. Try Resend HTTP API first if configured
    if (resendApiKey) {
        const primaryFrom = from || process.env.RETINA_FROM_EMAIL || 'Inbox Retina <no-reply@mckellar.dev>';
        const fallbackFrom = 'Inbox Retina <no-reply@mycommercialfunding.com>';

        const sendViaResend = async (fromAddress: string) => {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: recipients,
                    subject,
                    html,
                    ...(replyTo ? { reply_to: replyTo } : {}),
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
            return { status: res.status, ok: res.ok, data };
        };

        try {
            let attempt = await sendViaResend(primaryFrom);
            // If mckellar.dev is not yet verified on this Resend key, seamlessly retry with fallback domain
            if (!attempt.ok && (attempt.status === 403 || attempt.status === 422) && primaryFrom !== fallbackFrom) {
                attempt = await sendViaResend(fallbackFrom);
            }
            if (attempt.ok) {
                return { ok: true, id: attempt.data.id };
            }
            console.error('[RetinaEmail] Resend API error:', attempt.status, attempt.data);
        } catch (err: any) {
            console.error('[RetinaEmail] Resend fetch error:', err);
        }
    }

    // 2. Try Nodemailer SMTP if configured
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
        try {
            const nodemailer = (await import('nodemailer')).default;
            const transporter = nodemailer.createTransport({
                host,
                port: Number(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user, pass },
            });
            const info = await transporter.sendMail({
                from: from || process.env.SMTP_FROM || `Inbox Retina <${user}>`,
                to: recipients.join(', '),
                ...(replyTo ? { replyTo } : {}),
                subject,
                html,
            });
            return { ok: true, id: info.messageId };
        } catch (err: any) {
            console.error('[RetinaEmail] SMTP error:', err);
            return { ok: false, error: err?.message || 'SMTP error' };
        }
    }

    return { ok: false, error: 'Neither RESEND_API_KEY nor SMTP credentials are configured' };
}
