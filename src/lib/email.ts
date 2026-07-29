import { SITE } from "@/lib/constants";

/**
 * Transactional email via Resend (REST — no SDK, no extra dependency).
 *
 * Fully optional and graceful: with no RESEND_API_KEY the app behaves exactly
 * as before (nothing is sent, no errors). Set RESEND_API_KEY to enable welcome
 * emails, contact notifications and the weekly digest. Free tier: 3,000/month.
 *
 * FROM address must be on a domain you've verified in Resend. Override with
 * EMAIL_FROM, otherwise we default to the site's contact address.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? `${SITE.name} <${SITE.email}>`;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

/** Send one email. Returns true on success, false if disabled or on failure (never throws). */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Branded shell so every email looks consistent ──
function shell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #ececf1;">
      <div style="font-size:20px;font-weight:700;color:#6d5ce7;margin-bottom:20px;">${SITE.name}</div>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#9aa0ab;font-size:12px;margin-top:20px;">
      ${SITE.name} · ${SITE.tagline}<br/>
      <a href="${SITE.url}" style="color:#9aa0ab;">${SITE.url.replace(/^https?:\/\//, "")}</a>
    </p>
  </div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#6d5ce7;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">${label}</a>`;

/** Welcome email after a newsletter subscription. */
export async function sendWelcomeEmail(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Welcome to ${SITE.name} 🎉`,
    html: shell(`
      <h1 style="font-size:22px;margin:0 0 12px;color:#16161f;">You're in! 🎉</h1>
      <p style="color:#4a4a57;font-size:15px;line-height:1.6;">
        Thanks for subscribing to ${SITE.name}. Every week we'll send you the best new software,
        apps and AI tools — plus fresh comparisons and deals. No spam, unsubscribe anytime.
      </p>
      <p style="margin:24px 0 8px;">${btn(`${SITE.url}/tools`, "Explore trending tools")}</p>
    `),
    text: `Welcome to ${SITE.name}! Thanks for subscribing. Explore tools at ${SITE.url}/tools`,
  });
}

/** Notify the site owner of a new contact message. */
export async function sendContactNotification(msg: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<boolean> {
  return sendEmail({
    to: SITE.email,
    replyTo: msg.email,
    subject: `New contact: ${msg.subject || "Message"} — from ${msg.name}`,
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 12px;color:#16161f;">New contact message</h1>
      <p style="color:#4a4a57;font-size:14px;line-height:1.6;">
        <b>From:</b> ${msg.name} (${msg.email})<br/>
        <b>Subject:</b> ${msg.subject || "—"}
      </p>
      <div style="margin-top:12px;padding:14px;background:#f5f5f7;border-radius:10px;color:#16161f;font-size:14px;white-space:pre-wrap;">${escapeHtml(msg.message)}</div>
    `),
    text: `From ${msg.name} (${msg.email})\nSubject: ${msg.subject || "—"}\n\n${msg.message}`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
