import { prisma } from "@/lib/prisma";
import { toolCardSelect, type ToolCard } from "@/lib/data/queries";

/**
 * Discovery / recommendation helpers.
 *
 * Everything here is failure-safe: a DB hiccup or empty analytics must never
 * break the pages that use these — they always return a (possibly empty) array
 * and fall back to denormalized scores when live signals are missing.
 */

const PUBLISHED = { status: "PUBLISHED", deletedAt: null } as const;

/** Order a fetched tool list to match a given ordering of ids. */
function orderByIds(tools: ToolCard[], ids: string[]): ToolCard[] {
  const map = new Map(tools.map((t) => [t.id, t]));
  return ids.map((id) => map.get(id)).filter((t): t is ToolCard => Boolean(t));
}

/**
 * Tools trending over the last `days` days, ranked by real TOOL_VIEW events.
 * Falls back to popularity/view scores when analytics has no recent data
 * (e.g. a fresh deployment).
 */
export async function getTrendingTools({ days = 7, limit = 12 } = {}): Promise<ToolCard[]> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const grouped = await prisma.analyticsEvent.groupBy({
      by: ["toolId"],
      where: { type: "TOOL_VIEW", createdAt: { gte: since }, toolId: { not: null } },
      _count: { toolId: true },
      orderBy: { _count: { toolId: "desc" } },
      take: limit * 2, // over-fetch: some may be unpublished/deleted
    });

    const ids = grouped.map((g) => g.toolId).filter((id): id is string => Boolean(id));
    if (ids.length > 0) {
      const tools = await prisma.tool.findMany({
        where: { ...PUBLISHED, id: { in: ids } },
        select: toolCardSelect,
      });
      const ordered = orderByIds(tools, ids).slice(0, limit);
      if (ordered.length > 0) return ordered;
    }
  } catch {
    // fall through to score-based fallback
  }

  // Fallback: denormalized popularity, then upvotes.
  try {
    return await prisma.tool.findMany({
      where: PUBLISHED,
      orderBy: [{ popularityScore: "desc" }, { upvotes: "desc" }, { viewCount: "desc" }],
      take: limit,
      select: toolCardSelect,
    });
  } catch {
    return [];
  }
}

/** Most recently published tools. */
export async function getRecentlyAddedTools(limit = 12): Promise<ToolCard[]> {
  try {
    return await prisma.tool.findMany({
      where: PUBLISHED,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: toolCardSelect,
    });
  } catch {
    return [];
  }
}

/**
 * Personalized "For You" recommendations.
 *
 * Signal: the categories of the tools a user has bookmarked or recently viewed.
 * We surface other published tools in those categories the user hasn't already
 * engaged with, ranked by quality (rating → popularity). Returns [] when we
 * have no signal, so callers can hide the section gracefully.
 */
export async function getRecommendedForUser(userId: string, limit = 8): Promise<ToolCard[]> {
  try {
    const [bookmarks, viewed] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { tool: { select: { id: true, categoryId: true } } },
      }),
      prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: 40,
        select: { tool: { select: { id: true, categoryId: true } } },
      }),
    ]);

    const seen = new Set<string>();
    const categoryIds = new Set<string>();
    for (const b of bookmarks) {
      if (b.tool) { seen.add(b.tool.id); categoryIds.add(b.tool.categoryId); }
    }
    for (const v of viewed) {
      if (v.tool) { seen.add(v.tool.id); categoryIds.add(v.tool.categoryId); }
    }
    if (categoryIds.size === 0) return [];

    const recs = await prisma.tool.findMany({
      where: {
        ...PUBLISHED,
        categoryId: { in: [...categoryIds] },
        id: { notIn: [...seen] },
      },
      orderBy: [{ rating: "desc" }, { popularityScore: "desc" }, { reviewCount: "desc" }],
      take: limit,
      select: toolCardSelect,
    });
    return recs;
  } catch {
    return [];
  }
}
