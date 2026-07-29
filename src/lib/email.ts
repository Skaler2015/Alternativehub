import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { unsubscribeUrl } from "@/lib/newsletter-token";

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
  const unsub = unsubscribeUrl(SITE.url, to);
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
      <p style="color:#b0b4bd;font-size:11px;margin-top:20px;">
        <a href="${unsub}" style="color:#9aa0ab;">Unsubscribe</a>
      </p>
    `),
    text: `Welcome to ${SITE.name}! Thanks for subscribing. Explore tools at ${SITE.url}/tools\n\nUnsubscribe: ${unsub}`,
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

// ── Weekly digest ──────────────────────────────────────────────────────

type DigestTool = { name: string; slug: string; tagline: string | null; logoUrl: string | null; category: { name: string } | null };

function digestToolRow(t: DigestTool): string {
  const url = `${SITE.url}/tools/${t.slug}`;
  const logo = t.logoUrl
    ? `<img src="${t.logoUrl}" width="40" height="40" alt="" style="border-radius:10px;display:block;" />`
    : `<div style="width:40px;height:40px;border-radius:10px;background:#eee;"></div>`;
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f3;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:52px;vertical-align:top;">${logo}</td>
          <td style="vertical-align:top;">
            <a href="${url}" style="color:#16161f;font-weight:600;font-size:15px;text-decoration:none;">${escapeHtml(t.name)}</a>
            ${t.category ? `<span style="color:#9aa0ab;font-size:12px;"> · ${escapeHtml(t.category.name)}</span>` : ""}
            <div style="color:#4a4a57;font-size:13px;line-height:1.5;margin-top:2px;">${escapeHtml(t.tagline ?? "")}</div>
          </td>
        </tr></table>
      </td>
    </tr>`;
}

/**
 * Send the weekly digest to all confirmed, subscribed addresses.
 * No-op (returns 0) when email is disabled or there are no fresh tools.
 * Each email carries a signed one-click unsubscribe link.
 */
export async function sendWeeklyDigest(limitTools = 6): Promise<number> {
  if (!emailEnabled()) return 0;

  const tools = (await prisma.tool
    .findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { popularityScore: "desc" }],
      take: limitTools,
      select: { name: true, slug: true, tagline: true, logoUrl: true, category: { select: { name: true } } },
    })
    .catch(() => [])) as DigestTool[];

  if (tools.length === 0) return 0;

  const subscribers = await prisma.newsletterSubscriber
    .findMany({ where: { unsubscribedAt: null }, select: { email: true }, take: 2000 })
    .catch(() => []);
  if (subscribers.length === 0) return 0;

  const rows = tools.map(digestToolRow).join("");
  let sent = 0;

  for (const sub of subscribers) {
    const unsub = unsubscribeUrl(SITE.url, sub.email);
    const html = shell(`
      <h1 style="font-size:20px;margin:0 0 6px;color:#16161f;">This week's best tools 🚀</h1>
      <p style="color:#4a4a57;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Fresh software, apps and AI tools worth a look — hand-picked from ${SITE.name}.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
      <p style="margin:24px 0 4px;">${btn(`${SITE.url}/tools`, "Browse all tools")}</p>
      <p style="color:#b0b4bd;font-size:11px;margin-top:20px;line-height:1.5;">
        You're receiving this because you subscribed at ${SITE.url.replace(/^https?:\/\//, "")}.
        <a href="${unsub}" style="color:#9aa0ab;">Unsubscribe</a>
      </p>
    `);
    const ok = await sendEmail({
      to: sub.email,
      subject: `${tools[0].name} & more — this week on ${SITE.name}`,
      html,
      text: `This week's best tools on ${SITE.name}:\n${tools.map((t) => `- ${t.name}: ${SITE.url}/tools/${t.slug}`).join("\n")}\n\nUnsubscribe: ${unsub}`,
    });
    if (ok) sent += 1;
  }

  return sent;
}
