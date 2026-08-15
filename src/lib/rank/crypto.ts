/**
 * Small AES-256-GCM helper for encrypting provider API keys at rest.
 *
 * The key is derived from RANK_ENCRYPTION_KEY (preferred) or the existing
 * NextAuth secret, so nothing extra is required to get encryption working.
 * Ciphertext format: base64(iv):base64(authTag):base64(ciphertext).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const secret =
    process.env.RANK_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "";
  // Derive a stable 32-byte key. If no secret is set we still work (dev), but a
  // real secret should always be configured in production.
  return createHash("sha256").update(secret || "alternativehub-rank-fallback").digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [ivB64, tagB64, ctB64] = payload.split(":");
    if (!ivB64 || !tagB64 || !ctB64) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

/** Mask a secret for display, e.g. "sk-live-1234" -> "••••••1234". */
export function maskSecret(payload: string | null | undefined): string {
  const plain = decryptSecret(payload);
  if (!plain) return "";
  const last = plain.slice(-4);
  return `${"•".repeat(Math.min(10, Math.max(4, plain.length - 4)))}${last}`;
}
