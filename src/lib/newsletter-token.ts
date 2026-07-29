import crypto from "crypto";

/**
 * Signed, stateless unsubscribe tokens. An HMAC of the email means we can
 * verify a one-click unsubscribe link without storing per-user tokens, and
 * nobody can unsubscribe someone else without the secret.
 */
function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? process.env.CRON_SECRET ?? "alternativehub-fallback-secret";
}

export function unsubscribeToken(email: string): string {
  return crypto.createHmac("sha256", secret()).update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  // constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function unsubscribeUrl(baseUrl: string, email: string): string {
  const params = new URLSearchParams({ email, token: unsubscribeToken(email) });
  return `${baseUrl}/api/newsletter/unsubscribe?${params.toString()}`;
}
