/**
 * Google Search Console integration (READ-ONLY).
 *
 * This is deliberately SEPARATE from SERP rank tracking. It surfaces Search
 * Console's own metrics — clicks, impressions, CTR and *average position* —
 * which are NOT the same thing as an actual SERP rank and must never be mixed
 * with one.
 *
 * Auth uses a Google service account (no interactive OAuth): we sign a JWT with
 * the service account private key, exchange it for an access token, then call
 * the Search Analytics API. Dependency-free (Node crypto + fetch).
 */
import "server-only";
import { createSign } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/rank/crypto";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GscConfig = { enabled: boolean; siteUrl: string | null; clientEmail: string | null; configured: boolean };

type ServiceAccount = { client_email: string; private_key: string };

async function loadServiceAccount(): Promise<ServiceAccount | null> {
  const row = await prisma.rankGscConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  const raw = decryptSecret(row?.serviceAccountEnc) ?? process.env.GSC_SERVICE_ACCOUNT ?? "";
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (parsed.client_email && parsed.private_key) return parsed;
  } catch {
    /* invalid JSON */
  }
  return null;
}

/** Public config summary (never returns the private key). */
export async function getGscConfig(): Promise<GscConfig> {
  const row = await prisma.rankGscConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  const sa = await loadServiceAccount();
  return {
    enabled: row?.enabled ?? false,
    siteUrl: row?.siteUrl ?? (process.env.GSC_SITE_URL || null),
    clientEmail: sa?.client_email ?? null,
    configured: !!(row?.enabled && (row?.siteUrl || process.env.GSC_SITE_URL) && sa),
  };
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(sa.private_key, "base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Could not authenticate with Google.");
  }
  return json.access_token;
}

export type GscRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscSummary = {
  ok: boolean;
  error?: string;
  range: { startDate: string; endDate: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: GscRow[];
  topPages: GscRow[];
};

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function query(
  token: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<{ rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (res.status === 403) throw new Error("Access denied — add the service account email as a user of this property in Search Console.");
  if (res.status === 401) throw new Error("Invalid Google credentials.");
  if (!res.ok) throw new Error(`Search Console error (HTTP ${res.status}).`);
  return res.json();
}

/** Fetch a 28-day GSC summary: totals + top queries + top pages. */
export async function fetchGscSummary(days = 28): Promise<GscSummary> {
  const end = new Date(Date.now() - 3 * 86400000); // GSC data lags ~2-3 days
  const start = new Date(end.getTime() - days * 86400000);
  const range = { startDate: dateStr(start), endDate: dateStr(end) };
  const empty: GscSummary = { ok: false, range, totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 }, topQueries: [], topPages: [] };

  const sa = await loadServiceAccount();
  const cfg = await prisma.rankGscConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  const siteUrl = cfg?.siteUrl || process.env.GSC_SITE_URL || "";
  if (!sa || !siteUrl || !cfg?.enabled) return { ...empty, error: "Search Console is not configured." };

  try {
    const token = await getAccessToken(sa);
    const [totalsRes, queriesRes, pagesRes] = await Promise.all([
      query(token, siteUrl, { ...range }),
      query(token, siteUrl, { ...range, dimensions: ["query"], rowLimit: 25 }),
      query(token, siteUrl, { ...range, dimensions: ["page"], rowLimit: 25 }),
    ]);
    const t = totalsRes.rows?.[0];
    const map = (rows: typeof queriesRes.rows): GscRow[] =>
      (rows ?? []).map((r) => ({ key: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
    return {
      ok: true,
      range,
      totals: { clicks: t?.clicks ?? 0, impressions: t?.impressions ?? 0, ctr: t?.ctr ?? 0, position: t?.position ?? 0 },
      topQueries: map(queriesRes.rows),
      topPages: map(pagesRes.rows),
    };
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : "Search Console request failed." };
  }
}
