import { NextResponse } from "next/server";
import type { RankDevice } from "@prisma/client";
import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getOrCreateProject } from "@/lib/rank/data";
import { normalizeDomain } from "@/lib/rank/normalize";
import { encryptSecret } from "@/lib/rank/crypto";

export const dynamic = "force-dynamic";

async function guard() {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v.trim() : d);

/** Save project (search) settings and provider config. API keys are encrypted
 *  and never returned to the client. Blank key fields keep the existing value. */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  const project = await getOrCreateProject();

  // ── Project / search settings ──
  const device: RankDevice = str(body.device).toUpperCase() === "MOBILE" ? "MOBILE" : "DESKTOP";
  await prisma.rankProject.update({
    where: { id: project.id },
    data: {
      name: str(body.name, project.name) || project.name,
      domain: body.domain ? normalizeDomain(str(body.domain)) : project.domain,
      country: (str(body.country) || project.country).toLowerCase(),
      language: (str(body.language) || project.language).toLowerCase(),
      device,
      rankDepth: [10, 20, 50, 100].includes(num(body.rankDepth, project.rankDepth)) ? num(body.rankDepth, project.rankDepth) : project.rankDepth,
      active: body.active === undefined ? project.active : Boolean(body.active),
      autoTracking: body.autoTracking === undefined ? project.autoTracking : Boolean(body.autoTracking),
      frequency: ["daily", "weekly", "custom"].includes(str(body.frequency)) ? str(body.frequency) : project.frequency,
      preferredHour: Math.min(23, Math.max(0, num(body.preferredHour, project.preferredHour))),
      intervalDays: Math.max(1, num(body.intervalDays, project.intervalDays)),
      timezone: str(body.timezone) || project.timezone,
      historyRetentionDays: num(body.historyRetentionDays, project.historyRetentionDays),
    },
  });

  // ── Provider config ──
  if (body.provider !== undefined) {
    const apiKey = str(body.apiKey);
    const apiSecret = str(body.apiSecret);
    await prisma.rankProviderConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        provider: str(body.provider, "none") || "none",
        apiKeyEnc: apiKey ? encryptSecret(apiKey) : null,
        apiSecretEnc: apiSecret ? encryptSecret(apiSecret) : null,
        endpoint: str(body.endpoint) || null,
        requestsPerMinute: num(body.requestsPerMinute, 30),
        batchSize: num(body.batchSize, 10),
        requestDelayMs: num(body.requestDelayMs, 1200),
        maxRetries: num(body.maxRetries, 3),
        dailyQuota: body.dailyQuota ? num(body.dailyQuota, 0) : null,
      },
      update: {
        provider: str(body.provider, "none") || "none",
        // Only overwrite keys when a new value is actually provided.
        ...(apiKey ? { apiKeyEnc: encryptSecret(apiKey) } : {}),
        ...(apiSecret ? { apiSecretEnc: encryptSecret(apiSecret) } : {}),
        endpoint: str(body.endpoint) || null,
        requestsPerMinute: num(body.requestsPerMinute, 30),
        batchSize: num(body.batchSize, 10),
        requestDelayMs: num(body.requestDelayMs, 1200),
        maxRetries: num(body.maxRetries, 3),
        dailyQuota: body.dailyQuota ? num(body.dailyQuota, 0) : null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
