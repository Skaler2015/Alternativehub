import { prisma } from "@/lib/prisma";
import { cached, CACHE_KEYS } from "@/lib/cache";
import type { Prisma } from "@prisma/client";

/**
 * Data-access layer. Public reads are Redis-cached and wrapped in `safe()` so
 * pages render (with empty states) even if the database is briefly
 * unreachable — the cache and DB are performance layers, not hard deps for
 * shell rendering.
 */
async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.error("[data]", err);
    return fallback;
  }
}

export const toolCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  logoUrl: true,
  websiteUrl: true,
  pricingModel: true,
  rating: true,
  reviewCount: true,
  alternativeScore: true,
  popularityScore: true,
  upvotes: true,
  featured: true,
  verified: true,
  tier: true,
  isOpenSource: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ToolSelect;

export type ToolCard = Prisma.ToolGetPayload<{ select: typeof toolCardSelect }>;

const PUBLISHED = { status: "PUBLISHED" as const, deletedAt: null };

// ─────────────────────────────── Home ───────────────────────────────

const EMPTY_HOME = {
  featured: [] as ToolCard[],
  topRated: [] as ToolCard[],
  newest: [] as ToolCard[],
  trendingAi: [] as ToolCard[],
  trendingApps: [] as ToolCard[],
  aiPicks: [] as ToolCard[],
  openSource: [] as ToolCard[],
  bestFree: [] as ToolCard[],
  enterprise: [] as ToolCard[],
  comparisons: [] as { slug: string; title: string; summary: string | null }[],
  posts: [] as { slug: string; title: string; excerpt: string; coverUrl: string | null; category: string; publishedAt: Date | null }[],
};

export async function getHomeData(): Promise<typeof EMPTY_HOME> {
  return cached(CACHE_KEYS.home, 300, () =>
    safe(EMPTY_HOME, async () => {
      const [
        featured, topRated, newest, trendingAi, trendingApps, aiPicks,
        openSource, bestFree, enterprise, comparisons, posts,
      ] = await Promise.all([
        prisma.tool.findMany({
          where: { ...PUBLISHED, featured: true },
          select: toolCardSelect,
          orderBy: { popularityScore: "desc" },
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, reviewCount: { gt: 0 } },
          select: toolCardSelect,
          orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
          take: 8,
        }),
        prisma.tool.findMany({
          where: PUBLISHED,
          select: toolCardSelect,
          orderBy: { publishedAt: "desc" },
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, category: { slug: "ai-tools" } },
          select: toolCardSelect,
          orderBy: { popularityScore: "desc" },
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, category: { slug: "apps" } },
          select: toolCardSelect,
          orderBy: { popularityScore: "desc" },
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, aiScore: { gte: 85 } },
          select: toolCardSelect,
          orderBy: { aiScore: "desc" },
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, isOpenSource: true },
          select: toolCardSelect,
          orderBy: { popularityScore: "desc" },
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, pricingModel: { in: ["FREE", "FREEMIUM", "OPEN_SOURCE"] } },
          select: toolCardSelect,
          orderBy: [{ rating: "desc" }, { popularityScore: "desc" }],
          take: 8,
        }),
        prisma.tool.findMany({
          where: { ...PUBLISHED, category: { slug: { in: ["saas", "crm", "erp", "cloud"] } } },
          select: toolCardSelect,
          orderBy: { popularityScore: "desc" },
          take: 8,
        }),
        prisma.comparison.findMany({
          orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
          select: { slug: true, title: true, summary: true },
          take: 4,
        }),
        prisma.blogPost.findMany({
          where: { published: true },
          orderBy: { publishedAt: "desc" },
          select: { slug: true, title: true, excerpt: true, coverUrl: true, category: true, publishedAt: true },
          take: 3,
        }),
      ]);
      return {
        featured, topRated, newest, trendingAi, trendingApps, aiPicks,
        openSource, bestFree, enterprise, comparisons, posts,
      };
    }),
  );
}

export type PlatformStats = {
  tools: number;
  categories: number;
  reviews: number;
  comparisons: number;
  totalViews: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  return cached(CACHE_KEYS.stats, 600, () =>
    safe({ tools: 0, categories: 0, reviews: 0, comparisons: 0, totalViews: 0 }, async () => {
      const [tools, categories, reviews, comparisons, views] = await Promise.all([
        prisma.tool.count({ where: PUBLISHED }),
        prisma.category.count(),
        prisma.review.count({ where: { approved: true } }),
        prisma.comparison.count(),
        prisma.tool.aggregate({ where: PUBLISHED, _sum: { viewCount: true } }),
      ]);
      return { tools, categories, reviews, comparisons, totalViews: views._sum.viewCount ?? 0 };
    }),
  );
}

export type Testimonial = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  user: { name: string | null; image: string | null };
  tool: { name: string; slug: string; logoUrl: string | null };
};

export async function getTestimonials(): Promise<Testimonial[]> {
  return cached(CACHE_KEYS.testimonials, 600, () =>
    safe([] as Testimonial[], () =>
      prisma.review.findMany({
        where: { approved: true, rating: { gte: 4 }, body: { not: "" } },
        orderBy: [{ rating: "desc" }, { helpful: "desc" }],
        take: 6,
        select: {
          id: true, rating: true, title: true, body: true,
          user: { select: { name: true, image: true } },
          tool: { select: { name: true, slug: true, logoUrl: true } },
        },
      }),
    ),
  );
}

// ───────────────────────────── Categories ─────────────────────────────

export async function getCategories() {
  return cached(CACHE_KEYS.categories, 600, () =>
    safe([], async () =>
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { tools: { where: PUBLISHED } } } },
      }),
    ),
  );
}

export async function getCategoryBySlug(slug: string) {
  return safe(null, () =>
    prisma.category.findUnique({
      where: { slug },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
        _count: { select: { tools: { where: PUBLISHED } } },
      },
    }),
  );
}

// ─────────────────────────────── Tools ───────────────────────────────

export type ToolListParams = {
  categorySlug?: string;
  pricing?: string;
  platform?: string;
  q?: string;
  openSource?: boolean;
  verified?: boolean;
  freeTrial?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function listTools(params: ToolListParams) {
  const pageSize = params.pageSize ?? 24;
  const page = Math.max(1, params.page ?? 1);

  const q = params.q?.trim();
  const where: Prisma.ToolWhereInput = {
    ...PUBLISHED,
    ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
    ...(params.pricing ? { pricingModel: params.pricing as never } : {}),
    ...(params.platform ? { platforms: { some: { platform: { slug: params.platform } } } } : {}),
    ...(params.openSource ? { isOpenSource: true } : {}),
    ...(params.verified ? { verified: true } : {}),
    ...(params.freeTrial ? { hasFreeTrial: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { tagline: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ToolOrderByWithRelationInput[] =
    params.sort === "rating"
      ? [{ rating: "desc" }, { reviewCount: "desc" }]
      : params.sort === "newest"
        ? [{ publishedAt: "desc" }]
        : params.sort === "alternatives"
          ? [{ alternativeScore: "desc" }]
          : [{ tier: "asc" }, { popularityScore: "desc" }];

  return safe({ tools: [] as ToolCard[], total: 0, page, pageSize }, async () => {
    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        select: toolCardSelect,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tool.count({ where }),
    ]);
    return { tools, total, page, pageSize };
  });
}

export async function getToolBySlug(slug: string) {
  return cached(CACHE_KEYS.tool(slug), 600, () =>
    safe(null, () =>
      prisma.tool.findFirst({
        where: { slug, ...PUBLISHED },
        include: {
          category: true,
          subcategory: true,
          company: true,
          platforms: { include: { platform: true } },
          features: { include: { feature: true } },
          pricingPlans: { orderBy: { sortOrder: "asc" } },
          tags: { include: { tag: true } },
          media: { orderBy: { sortOrder: "asc" } },
          faqs: { orderBy: { sortOrder: "asc" } },
          alternativesFrom: {
            orderBy: { matchScore: "desc" },
            take: 12,
            include: { target: { select: toolCardSelect } },
          },
        },
      }),
    ),
  );
}

/**
 * Personalized recommendations — from the categories of a user's bookmarks and
 * recently-viewed tools, surface top tools they haven't seen yet. Falls back to
 * popular tools when there's no history. Deterministic (no AI cost).
 */
export async function getPersonalizedTools(userId: string, take = 8): Promise<ToolCard[]> {
  return safe([] as ToolCard[], async () => {
    const [bookmarks, viewed] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        select: { toolId: true, tool: { select: { categoryId: true } } },
        take: 50,
      }),
      prisma.recentlyViewed.findMany({
        where: { userId },
        select: { toolId: true, tool: { select: { categoryId: true } } },
        orderBy: { viewedAt: "desc" },
        take: 50,
      }),
    ]);

    const seenIds = new Set([...bookmarks, ...viewed].map((r) => r.toolId));
    const categoryIds = Array.from(
      new Set([...bookmarks, ...viewed].map((r) => r.tool.categoryId)),
    );

    if (categoryIds.length === 0) {
      // No history yet → popular tools
      return prisma.tool.findMany({
        where: PUBLISHED,
        select: toolCardSelect,
        orderBy: { popularityScore: "desc" },
        take,
      });
    }

    const recs = await prisma.tool.findMany({
      where: { ...PUBLISHED, categoryId: { in: categoryIds }, id: { notIn: Array.from(seenIds) } },
      select: toolCardSelect,
      orderBy: [{ rating: "desc" }, { popularityScore: "desc" }],
      take,
    });

    if (recs.length >= take) return recs;
    // Top up with popular tools not already recommended
    const fill = await prisma.tool.findMany({
      where: { ...PUBLISHED, id: { notIn: [...seenIds, ...recs.map((r) => r.id)] } },
      select: toolCardSelect,
      orderBy: { popularityScore: "desc" },
      take: take - recs.length,
    });
    return [...recs, ...fill];
  });
}

export async function getToolReviews(toolId: string, take = 10) {
  return safe([], () =>
    prisma.review.findMany({
      where: { toolId, approved: true },
      orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
      take,
      include: {
        user: { select: { id: true, name: true, image: true } },
        repliedBy: { select: { name: true } },
      },
    }),
  );
}

/** Star distribution (1-5) + total for a tool's approved reviews. */
export async function getRatingBreakdown(toolId: string) {
  return safe({ total: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number> }, async () => {
    const rows = await prisma.review.groupBy({
      by: ["rating"],
      where: { toolId, approved: true },
      _count: { _all: true },
    });
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    for (const r of rows) {
      counts[r.rating] = r._count._all;
      total += r._count._all;
    }
    return { total, counts };
  });
}

/** Similar tools = same category, excluding the tool and its listed alternatives. */
export async function getSimilarTools(toolId: string, categoryId: string, excludeIds: string[]) {
  return safe([] as ToolCard[], () =>
    prisma.tool.findMany({
      where: {
        ...PUBLISHED,
        categoryId,
        id: { notIn: [toolId, ...excludeIds] },
      },
      select: toolCardSelect,
      orderBy: { popularityScore: "desc" },
      take: 6,
    }),
  );
}

// ─────────────────────── Alternatives (programmatic SEO) ───────────────────────

export async function getAlternativesPage(slug: string) {
  return cached(CACHE_KEYS.alternatives(slug), 600, () =>
    safe(null, async () => {
      const tool = await prisma.tool.findFirst({
        where: { slug, ...PUBLISHED },
        include: {
          category: true,
          alternativesFrom: {
            orderBy: { matchScore: "desc" },
            take: 20,
            include: {
              target: {
                select: { ...toolCardSelect, pros: true, cons: true, aiSummary: true },
              },
            },
          },
        },
      });
      return tool;
    }),
  );
}

/** Tools that have alternatives — drives the programmatic sitemap. */
export async function getToolsWithAlternatives(take = 500) {
  return safe([], () =>
    prisma.tool.findMany({
      where: { ...PUBLISHED, alternativesFrom: { some: {} } },
      select: { slug: true, name: true, updatedAt: true },
      orderBy: { popularityScore: "desc" },
      take,
    }),
  );
}

// ───────────────────────────── Comparisons ─────────────────────────────

export async function getComparisonBySlug(slug: string) {
  return cached(CACHE_KEYS.comparison(slug), 600, () =>
    safe(null, () =>
      prisma.comparison.findUnique({
        where: { slug },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              tool: {
                include: {
                  category: true,
                  platforms: { include: { platform: true } },
                  features: { include: { feature: true } },
                  pricingPlans: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      }),
    ),
  );
}

export async function listComparisons(take = 30) {
  return safe([], () =>
    prisma.comparison.findMany({
      orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
      take,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: { tool: { select: { name: true, slug: true, logoUrl: true, websiteUrl: true } } },
        },
      },
    }),
  );
}

// ─────────────────────────────── Blog ───────────────────────────────

export async function listBlogPosts(take = 20) {
  return safe([], () =>
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take,
      select: {
        slug: true, title: true, excerpt: true, coverUrl: true,
        category: true, publishedAt: true, viewCount: true,
        author: { select: { name: true } },
      },
    }),
  );
}

export async function getBlogPost(slug: string) {
  return safe(null, () =>
    prisma.blogPost.findFirst({
      where: { slug, published: true },
      include: { author: { select: { name: true, image: true } } },
    }),
  );
}
