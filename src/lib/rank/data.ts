/**
 * Server-side data layer for the rank tracker: project/settings, dashboard
 * stats, paginated rankings, bulk keyword upsert, the job queue and the worker
 * that turns queued jobs into real provider checks + history records.
 */
import "server-only";
import type { Prisma, RankKeyword, RankProject } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";
import { computeMovement, normalizeDomain, normalizeKeyword, type Movement } from "@/lib/rank/normalize";
import { getProviderConfig, getRankProvider } from "@/lib/rank/providers";
import type { RankResult } from "@/lib/rank/types";

const BACKOFF_SECONDS = [5, 15, 30, 60];

// ── Project / settings ──────────────────────────────────────────────────────
export async function getOrCreateProject(): Promise<RankProject> {
  const existing = await prisma.rankProject.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.rankProject.create({
    data: { name: SITE.name, domain: normalizeDomain(SITE.url), country: "in", language: "en" },
  });
}

// ── Logging & usage ─────────────────────────────────────────────────────────
export async function rankLog(input: {
  type: string;
  message: string;
  keyword?: string | null;
  provider?: string | null;
  httpStatus?: number | null;
  attempt?: number | null;
}): Promise<void> {
  await prisma.rankLog
    .create({
      data: {
        type: input.type,
        message: input.message.slice(0, 1000),
        keyword: input.keyword ?? undefined,
        provider: input.provider ?? undefined,
        httpStatus: input.httpStatus ?? undefined,
        attempt: input.attempt ?? undefined,
      },
    })
    .catch(() => {});
}

function todayKey(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(),
    );
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function bumpUsage(tz: string, ok: boolean): Promise<void> {
  const date = todayKey(tz);
  await prisma.rankApiUsage
    .upsert({
      where: { date },
      create: { date, requests: 1, success: ok ? 1 : 0, failed: ok ? 0 : 1 },
      update: { requests: { increment: 1 }, success: { increment: ok ? 1 : 0 }, failed: { increment: ok ? 0 : 1 } },
    })
    .catch(() => {});
}

// ── Dashboard stats ─────────────────────────────────────────────────────────
export type DashboardStats = {
  total: number;
  top3: number;
  top10: number;
  top20: number;
  top50: number;
  top100: number;
  notRanking: number;
  improved: number;
  dropped: number;
  noChange: number;
  apiToday: { requests: number; success: number; failed: number };
  pendingJobs: number;
};

export async function dashboardStats(projectId: string, tz: string): Promise<DashboardStats> {
  const base: Prisma.RankKeywordWhereInput = { projectId, active: true };
  const rankLte = (n: number): Prisma.RankKeywordWhereInput => ({ ...base, currentRank: { lte: n } });
  const [total, top3, top10, top20, top50, top100, notRanking, improved, dropped, noChange, usage, pendingJobs] =
    await Promise.all([
      prisma.rankKeyword.count({ where: base }),
      prisma.rankKeyword.count({ where: rankLte(3) }),
      prisma.rankKeyword.count({ where: rankLte(10) }),
      prisma.rankKeyword.count({ where: rankLte(20) }),
      prisma.rankKeyword.count({ where: rankLte(50) }),
      prisma.rankKeyword.count({ where: rankLte(100) }),
      prisma.rankKeyword.count({ where: { ...base, currentRank: null, lastCheckedAt: { not: null } } }),
      prisma.rankKeyword.count({ where: { ...base, lastStatus: "Improved" } }),
      prisma.rankKeyword.count({ where: { ...base, lastStatus: "Dropped" } }),
      prisma.rankKeyword.count({ where: { ...base, lastStatus: "No Change" } }),
      prisma.rankApiUsage.findUnique({ where: { date: todayKey(tz) } }),
      prisma.rankJob.count({ where: { projectId, status: { in: ["PENDING", "PROCESSING", "RETRY"] } } }),
    ]);
  return {
    total, top3, top10, top20, top50, top100, notRanking, improved, dropped, noChange,
    apiToday: { requests: usage?.requests ?? 0, success: usage?.success ?? 0, failed: usage?.failed ?? 0 },
    pendingJobs,
  };
}

// ── Paginated rankings table ────────────────────────────────────────────────
export type RankingsQuery = {
  filter?: string;
  q?: string;
  group?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function pagedRankings(projectId: string, opts: RankingsQuery) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(250, Math.max(25, opts.pageSize ?? 50));
  const where: Prisma.RankKeywordWhereInput = { projectId, active: true };

  if (opts.q) where.keyword = { contains: opts.q, mode: "insensitive" };
  if (opts.group) where.groupName = opts.group;

  switch (opts.filter) {
    case "top3": where.currentRank = { lte: 3 }; break;
    case "top10": where.currentRank = { lte: 10 }; break;
    case "top20": where.currentRank = { lte: 20 }; break;
    case "top50": where.currentRank = { lte: 50 }; break;
    case "top100": where.currentRank = { lte: 100 }; break;
    case "notranking": where.currentRank = null; where.lastCheckedAt = { not: null }; break;
    case "improved": where.lastStatus = "Improved"; break;
    case "dropped": where.lastStatus = "Dropped"; break;
    case "nochange": where.lastStatus = "No Change"; break;
    case "new": where.lastStatus = "New"; break;
    case "newlyranking": where.lastStatus = "Newly Ranking"; break;
    case "droppedout": where.lastStatus = "Dropped Out"; break;
    default: break;
  }

  let orderBy: Prisma.RankKeywordOrderByWithRelationInput;
  switch (opts.sort) {
    case "worst": orderBy = { currentRank: { sort: "desc", nulls: "last" } }; break;
    case "keyword": orderBy = { keyword: "asc" }; break;
    case "checked": orderBy = { lastCheckedAt: { sort: "desc", nulls: "last" } }; break;
    default: orderBy = { currentRank: { sort: "asc", nulls: "last" } }; break; // best rank first
  }

  const [rows, total] = await Promise.all([
    prisma.rankKeyword.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.rankKeyword.count({ where }),
  ]);
  return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

// ── Bulk keyword upsert (duplicate-proof) ───────────────────────────────────
export async function addKeywordsBulk(
  projectId: string,
  keywords: string[],
  opts?: { group?: string | null; targetUrl?: string | null },
): Promise<{ added: number; skipped: number }> {
  // Dedupe within the incoming batch by normalized form (first wins).
  const seen = new Map<string, string>();
  for (const k of keywords) {
    const display = k.trim().replace(/\s+/g, " ");
    if (!display) continue;
    const norm = normalizeKeyword(display);
    if (!seen.has(norm)) seen.set(norm, display);
  }
  if (seen.size === 0) return { added: 0, skipped: 0 };

  const existing = await prisma.rankKeyword.findMany({
    where: { projectId, normalized: { in: [...seen.keys()] } },
    select: { normalized: true },
  });
  const have = new Set(existing.map((e) => e.normalized));

  const toCreate = [...seen.entries()]
    .filter(([norm]) => !have.has(norm))
    .map(([normalized, keyword]) => ({
      projectId,
      keyword,
      normalized,
      groupName: opts?.group || null,
      targetUrl: opts?.targetUrl || null,
    }));

  if (toCreate.length) {
    await prisma.rankKeyword.createMany({ data: toCreate, skipDuplicates: true });
  }
  return { added: toCreate.length, skipped: seen.size - toCreate.length };
}

/** Upsert keyword rows that each carry their own target URL / group (CSV import). */
export async function addKeywordRows(
  projectId: string,
  rows: { keyword: string; targetUrl?: string | null; groupName?: string | null }[],
): Promise<{ added: number; skipped: number }> {
  const seen = new Map<string, { keyword: string; targetUrl: string | null; groupName: string | null }>();
  for (const r of rows) {
    const display = (r.keyword ?? "").trim().replace(/\s+/g, " ");
    if (!display) continue;
    const norm = normalizeKeyword(display);
    if (!seen.has(norm)) {
      seen.set(norm, {
        keyword: display,
        targetUrl: r.targetUrl?.trim() || null,
        groupName: r.groupName?.trim() || null,
      });
    }
  }
  if (seen.size === 0) return { added: 0, skipped: 0 };
  const existing = await prisma.rankKeyword.findMany({
    where: { projectId, normalized: { in: [...seen.keys()] } },
    select: { normalized: true },
  });
  const have = new Set(existing.map((e) => e.normalized));
  const toCreate = [...seen.entries()]
    .filter(([norm]) => !have.has(norm))
    .map(([normalized, v]) => ({ projectId, normalized, keyword: v.keyword, targetUrl: v.targetUrl, groupName: v.groupName }));
  if (toCreate.length) await prisma.rankKeyword.createMany({ data: toCreate, skipDuplicates: true });
  return { added: toCreate.length, skipped: seen.size - toCreate.length };
}

// ── Charts & insights ───────────────────────────────────────────────────────
export async function dailyChecksSeries(days = 14): Promise<{ date: string; views: number }[]> {
  const rows = await prisma.rankApiUsage.findMany({ orderBy: { date: "desc" }, take: days });
  return rows.reverse().map((r) => ({ date: r.date, views: r.requests }));
}

export async function rankingDistribution(projectId: string) {
  const base: Prisma.RankKeywordWhereInput = { projectId, active: true };
  const [t3, t10, t20, t50, t100, notRanking] = await Promise.all([
    prisma.rankKeyword.count({ where: { ...base, currentRank: { lte: 3 } } }),
    prisma.rankKeyword.count({ where: { ...base, currentRank: { gte: 4, lte: 10 } } }),
    prisma.rankKeyword.count({ where: { ...base, currentRank: { gte: 11, lte: 20 } } }),
    prisma.rankKeyword.count({ where: { ...base, currentRank: { gte: 21, lte: 50 } } }),
    prisma.rankKeyword.count({ where: { ...base, currentRank: { gte: 51, lte: 100 } } }),
    prisma.rankKeyword.count({ where: { ...base, currentRank: null, lastCheckedAt: { not: null } } }),
  ]);
  return [
    { label: "1-3", value: t3 },
    { label: "4-10", value: t10 },
    { label: "11-20", value: t20 },
    { label: "21-50", value: t50 },
    { label: "51-100", value: t100 },
    { label: "Not Ranking", value: notRanking },
  ];
}

export type RankInsights = {
  enteredTop10: number;
  leftTop10: number;
  enteredTop20: number;
  leftTop20: number;
  gaining: number;
  losing: number;
  notCheckedRecently: number;
  withErrors: number;
  gainingSample: { id: string; keyword: string; previousRank: number | null; currentRank: number | null }[];
  losingSample: { id: string; keyword: string; previousRank: number | null; currentRank: number | null }[];
  errorSample: { id: string; keyword: string; lastError: string | null }[];
};

export async function computeInsights(projectId: string): Promise<RankInsights> {
  const base: Prisma.RankKeywordWhereInput = { projectId, active: true };
  const cutoff = new Date(Date.now() - 7 * 86400000);
  const [
    enteredTop10, leftTop10, enteredTop20, leftTop20, gaining, losing, notCheckedRecently, withErrors,
    gainingSample, losingSample, errorSample,
  ] = await Promise.all([
    prisma.rankKeyword.count({ where: { ...base, currentRank: { lte: 10 }, OR: [{ previousRank: null }, { previousRank: { gt: 10 } }] } }),
    prisma.rankKeyword.count({ where: { ...base, previousRank: { lte: 10 }, OR: [{ currentRank: null }, { currentRank: { gt: 10 } }] } }),
    prisma.rankKeyword.count({ where: { ...base, currentRank: { lte: 20 }, OR: [{ previousRank: null }, { previousRank: { gt: 20 } }] } }),
    prisma.rankKeyword.count({ where: { ...base, previousRank: { lte: 20 }, OR: [{ currentRank: null }, { currentRank: { gt: 20 } }] } }),
    prisma.rankKeyword.count({ where: { ...base, lastStatus: "Improved" } }),
    prisma.rankKeyword.count({ where: { ...base, lastStatus: "Dropped" } }),
    prisma.rankKeyword.count({ where: { ...base, OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: cutoff } }] } }),
    prisma.rankKeyword.count({ where: { ...base, lastError: { not: null } } }),
    prisma.rankKeyword.findMany({ where: { ...base, lastStatus: "Improved" }, orderBy: { currentRank: "asc" }, take: 10, select: { id: true, keyword: true, previousRank: true, currentRank: true } }),
    prisma.rankKeyword.findMany({ where: { ...base, lastStatus: "Dropped" }, orderBy: { currentRank: "desc" }, take: 10, select: { id: true, keyword: true, previousRank: true, currentRank: true } }),
    prisma.rankKeyword.findMany({ where: { ...base, lastError: { not: null } }, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, keyword: true, lastError: true } }),
  ]);
  return { enteredTop10, leftTop10, enteredTop20, leftTop20, gaining, losing, notCheckedRecently, withErrors, gainingSample, losingSample, errorSample };
}

/** Data-retention cleanup — delete history older than the retention window.
 *  Never touches today's records. */
export async function cleanupHistory(projectId: string, retentionDays: number): Promise<number> {
  if (!retentionDays || retentionDays >= 3650) return 0; // "forever"
  const cutoff = new Date(Date.now() - retentionDays * 86400000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const effective = cutoff < startOfToday ? cutoff : startOfToday;
  const res = await prisma.rankHistory.deleteMany({ where: { projectId, checkedAt: { lt: effective } } });
  return res.count;
}

// ── Job queue ───────────────────────────────────────────────────────────────
/** Enqueue checks for the given keyword ids (or all active), skipping keywords
 *  that already have an in-flight job. Returns how many jobs were created. */
export async function enqueueChecks(
  projectId: string,
  opts: { keywordIds?: string[]; scope?: "all" | "failed" | "notranking" },
): Promise<number> {
  const where: Prisma.RankKeywordWhereInput = { projectId, active: true };
  if (opts.keywordIds?.length) where.id = { in: opts.keywordIds };
  else if (opts.scope === "failed") where.lastError = { not: null };
  else if (opts.scope === "notranking") { where.currentRank = null; where.lastCheckedAt = { not: null }; }

  const keywords = await prisma.rankKeyword.findMany({ where, select: { id: true }, take: 20000 });
  if (keywords.length === 0) return 0;
  const ids = keywords.map((k) => k.id);

  const busy = await prisma.rankJob.findMany({
    where: { keywordId: { in: ids }, status: { in: ["PENDING", "PROCESSING", "RETRY"] } },
    select: { keywordId: true },
  });
  const busySet = new Set(busy.map((b) => b.keywordId));
  const data = ids.filter((id) => !busySet.has(id)).map((keywordId) => ({ projectId, keywordId }));
  if (data.length === 0) return 0;
  await prisma.rankJob.createMany({ data, skipDuplicates: true });
  return data.length;
}

// ── Record a completed check ────────────────────────────────────────────────
async function recordResult(project: RankProject, keyword: RankKeyword, result: RankResult): Promise<Movement> {
  const prevRank = keyword.currentRank;
  const { movement } = computeMovement({
    previousRank: prevRank,
    currentRank: result.rank,
    hadPreviousCheck: keyword.lastCheckedAt != null,
  });
  await prisma.rankHistory.create({
    data: {
      projectId: project.id,
      keywordId: keyword.id,
      rank: result.rank,
      rankingUrl: result.rankingUrl,
      rankingTitle: result.rankingTitle,
      allUrls: result.allUrls as unknown as Prisma.InputJsonValue,
      searchEngine: result.searchEngine,
      country: result.country,
      language: project.language,
      device: project.device,
      provider: result.provider,
      status: result.found ? "FOUND" : "NOT_FOUND",
    },
  });
  await prisma.rankKeyword.update({
    where: { id: keyword.id },
    data: {
      previousRank: prevRank,
      currentRank: result.rank,
      rankingUrl: result.rankingUrl,
      lastStatus: movement,
      lastCheckedAt: new Date(),
      lastError: null,
    },
  });
  return movement;
}

/** Instant single-keyword check (for the "Check Now" button). Returns a clear
 *  not-configured signal instead of ever faking a rank. */
export async function checkKeywordNow(
  keywordId: string,
): Promise<
  | { ok: true; configured: true; rank: number | null; rankingUrl: string | null; movement: Movement }
  | { ok: true; configured: false }
  | { ok: false; error: string }
> {
  const keyword = await prisma.rankKeyword.findUnique({ where: { id: keywordId } });
  if (!keyword) return { ok: false, error: "Keyword not found." };
  const project = await prisma.rankProject.findUnique({ where: { id: keyword.projectId } });
  if (!project) return { ok: false, error: "Project not found." };
  const provider = await getRankProvider();
  if (!provider) return { ok: true, configured: false };
  try {
    const result = await provider.checkKeywordRank({
      keyword: keyword.keyword,
      domain: project.domain,
      country: project.country,
      language: project.language,
      device: project.device,
      depth: project.rankDepth,
    });
    const movement = await recordResult(project, keyword, result);
    await bumpUsage(project.timezone, true);
    return { ok: true, configured: true, rank: result.rank, rankingUrl: result.rankingUrl, movement };
  } catch (err) {
    await bumpUsage(project.timezone, false);
    const e = err as { message?: string; opts?: { type?: string; httpStatus?: number } };
    const message = e.message ?? "Provider error.";
    await rankLog({ type: e.opts?.type ?? "API_ERROR", message, keyword: keyword.keyword, provider: provider.name, httpStatus: e.opts?.httpStatus ?? null });
    await prisma.rankKeyword.update({ where: { id: keyword.id }, data: { lastError: message } }).catch(() => {});
    return { ok: false, error: message };
  }
}

// ── The worker ──────────────────────────────────────────────────────────────
export type ProcessSummary = {
  provider: string | null;
  processed: number;
  completed: number;
  failed: number;
  retried: number;
  configured: boolean;
};

export async function processRankJobs(limit = 20): Promise<ProcessSummary> {
  const project = await getOrCreateProject();
  const provider = await getRankProvider();
  const config = await getProviderConfig();

  const jobs = await prisma.rankJob.findMany({
    where: { projectId: project.id, status: { in: ["PENDING", "RETRY"] }, nextRunAt: { lte: new Date() } },
    orderBy: [{ priority: "desc" }, { nextRunAt: "asc" }],
    take: Math.min(limit, 100),
    include: { keyword: true },
  });

  const summary: ProcessSummary = {
    provider: provider?.name ?? null,
    processed: 0,
    completed: 0,
    failed: 0,
    retried: 0,
    configured: !!provider,
  };
  if (jobs.length === 0) return summary;

  // Not configured → fail the batch cleanly with a clear message (never fake).
  if (!provider) {
    await prisma.rankJob.updateMany({
      where: { id: { in: jobs.map((j) => j.id) } },
      data: { status: "FAILED", errorMessage: "Ranking provider is not configured.", completedAt: new Date() },
    });
    await prisma.rankKeyword.updateMany({
      where: { id: { in: jobs.map((j) => j.keywordId) } },
      data: { lastError: "Ranking provider is not configured." },
    });
    await rankLog({ type: "AUTH_ERROR", message: "Ranking provider is not configured." });
    summary.processed = jobs.length;
    summary.failed = jobs.length;
    return summary;
  }

  for (const job of jobs) {
    summary.processed += 1;
    await prisma.rankJob.update({ where: { id: job.id }, data: { status: "PROCESSING", startedAt: new Date() } });
    try {
      const result = await provider.checkKeywordRank({
        keyword: job.keyword.keyword,
        domain: project.domain,
        country: project.country,
        language: project.language,
        device: project.device,
        depth: project.rankDepth,
      });
      await recordResult(project, job.keyword, result);
      await prisma.rankJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date(), errorMessage: null } });
      await bumpUsage(project.timezone, true);
      summary.completed += 1;
    } catch (err) {
      await bumpUsage(project.timezone, false);
      const e = err as { message?: string; opts?: { retryable?: boolean; httpStatus?: number; type?: string } };
      const message = e.message ?? "Provider error.";
      const retryable = e.opts?.retryable ?? false;
      const attempts = job.attempts + 1;
      await rankLog({
        type: e.opts?.type ?? "API_ERROR",
        message,
        keyword: job.keyword.keyword,
        provider: provider.name,
        httpStatus: e.opts?.httpStatus ?? null,
        attempt: attempts,
      });
      if (retryable && attempts <= config.maxRetries) {
        const wait = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)] * 1000;
        await prisma.rankJob.update({
          where: { id: job.id },
          data: { status: "RETRY", attempts, nextRunAt: new Date(Date.now() + wait), errorMessage: message },
        });
        summary.retried += 1;
      } else {
        await prisma.rankJob.update({ where: { id: job.id }, data: { status: "FAILED", attempts, completedAt: new Date(), errorMessage: message } });
        await prisma.rankHistory.create({
          data: {
            projectId: project.id, keywordId: job.keywordId, rank: null, searchEngine: "google",
            country: project.country, language: project.language, device: project.device,
            provider: provider.name, status: "ERROR", errorMessage: message,
          },
        });
        await prisma.rankKeyword.update({ where: { id: job.keywordId }, data: { lastError: message } });
        summary.failed += 1;
      }
    }
    if (config.requestDelayMs > 0) await new Promise((r) => setTimeout(r, config.requestDelayMs));
  }
  return summary;
}
