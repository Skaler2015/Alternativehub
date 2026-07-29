import { prisma } from "@/lib/prisma";

/**
 * Admin analytics aggregation. All queries are wrapped so a cold/empty
 * database or a transient error never breaks the dashboard.
 */

export type AnalyticsSummary = {
  days: number;
  totals: {
    pageViews: number;
    toolViews: number;
    searches: number;
    clickOuts: number;
    affiliateClicks: number;
    total: number;
  };
  timeseries: { date: string; views: number }[];
  topTools: { id: string; name: string; slug: string; views: number }[];
  topSearches: { query: string; count: number }[];
  devices: { device: string; count: number }[];
  byType: { type: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
};

async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 86_400_000);

  const [byType, events, topSearchesRaw, devicesRaw, referrersRaw] = await Promise.all([
    safe([] as { type: string; count: number }[], async () => {
      const rows = await prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      });
      return rows.map((r) => ({ type: r.type as string, count: r._count._all }));
    }),
    // Raw events for timeseries + top tools (bounded to keep memory sane)
    safe([] as { type: string; toolId: string | null; createdAt: Date }[], () =>
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since } },
        select: { type: true, toolId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20000,
      }),
    ),
    safe([] as { query: string; count: number }[], async () => {
      const rows = await prisma.analyticsEvent.groupBy({
        by: ["query"],
        where: { type: "SEARCH", query: { not: null }, createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { query: "desc" } },
        take: 10,
      });
      return rows
        .filter((r) => r.query)
        .map((r) => ({ query: r.query as string, count: r._count._all }));
    }),
    safe([] as { device: string; count: number }[], async () => {
      const rows = await prisma.analyticsEvent.groupBy({
        by: ["device"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      });
      return rows.map((r) => ({ device: r.device ?? "unknown", count: r._count._all }));
    }),
    safe([] as { referrer: string; count: number }[], async () => {
      const rows = await prisma.analyticsEvent.groupBy({
        by: ["referrer"],
        where: { referrer: { not: null }, createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 8,
      });
      return rows
        .filter((r) => r.referrer)
        .map((r) => ({ referrer: hostOf(r.referrer as string), count: r._count._all }));
    }),
  ]);

  const countOf = (t: string) => byType.find((r) => r.type === t)?.count ?? 0;

  // Build daily timeseries of page views from raw events
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dateKey(new Date(Date.now() - i * 86_400_000)), 0);
  }
  const toolViewCounts = new Map<string, number>();
  for (const e of events) {
    if (e.type === "PAGE_VIEW") {
      const k = dateKey(e.createdAt);
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    if (e.type === "TOOL_VIEW" && e.toolId) {
      toolViewCounts.set(e.toolId, (toolViewCounts.get(e.toolId) ?? 0) + 1);
    }
  }
  const timeseries = [...buckets.entries()].map(([date, views]) => ({ date, views }));

  // Resolve top tools by TOOL_VIEW
  const topToolIds = [...toolViewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const toolMeta = await safe(
    [] as { id: string; name: string; slug: string }[],
    () =>
      prisma.tool.findMany({
        where: { id: { in: topToolIds.map(([id]) => id) } },
        select: { id: true, name: true, slug: true },
      }),
  );
  const topTools = topToolIds
    .map(([id, views]) => {
      const t = toolMeta.find((m) => m.id === id);
      return t ? { ...t, views } : null;
    })
    .filter((t): t is { id: string; name: string; slug: string; views: number } => !!t);

  return {
    days,
    totals: {
      pageViews: countOf("PAGE_VIEW"),
      toolViews: countOf("TOOL_VIEW"),
      searches: countOf("SEARCH"),
      clickOuts: countOf("CLICK_OUT"),
      affiliateClicks: countOf("AFFILIATE_CLICK"),
      total: byType.reduce((sum, r) => sum + r.count, 0),
    },
    timeseries,
    topTools,
    topSearches: topSearchesRaw,
    devices: devicesRaw.sort((a, b) => b.count - a.count),
    byType: byType.sort((a, b) => b.count - a.count),
    topReferrers: referrersRaw,
  };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}
