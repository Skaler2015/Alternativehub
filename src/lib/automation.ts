import { prisma } from "@/lib/prisma";
import { faviconUrl, slugify } from "@/lib/utils";
import { generateToolContent } from "@/lib/ai";
import { uploadRemoteImage } from "@/lib/cloudinary";

/**
 * Automation pipeline for tool ingestion:
 * metadata fetch → logo fetch → AI enrichment → category detection →
 * duplicate detection → similar-tool linking → broken-link checks.
 */

/** Scrape basic metadata (title/description/og-image) from a tool's website. */
export async function fetchSiteMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  ogImage?: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AlternativeHubBot/1.0 (+https://alternativehub.in)" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);

    const pick = (re: RegExp) => html.match(re)?.[1]?.trim();
    return {
      title:
        pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<title[^>]*>([^<]+)<\/title>/i),
      description:
        pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
      ogImage: pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
    };
  } catch {
    return null;
  }
}

/** Duplicate detection: slug match or same registrable domain. */
export async function findDuplicates(name: string, websiteUrl: string) {
  const slug = slugify(name);
  let domain = "";
  try {
    domain = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    // invalid URL — slug check only
  }

  return prisma.tool.findMany({
    where: {
      deletedAt: null,
      OR: [
        { slug },
        { name: { equals: name, mode: "insensitive" } },
        ...(domain ? [{ websiteUrl: { contains: domain, mode: "insensitive" as const } }] : []),
      ],
    },
    select: { id: true, slug: true, name: true, websiteUrl: true, status: true },
    take: 5,
  });
}

/** Full enrichment used by admin import + submit approval. */
export async function enrichTool(toolId: string): Promise<void> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: { category: true },
  });
  if (!tool) return;

  // 1. Logo: favicon service → Cloudinary CDN when configured
  if (!tool.logoUrl) {
    const favicon = faviconUrl(tool.websiteUrl, 128);
    const uploaded = favicon ? await uploadRemoteImage(favicon, "logos", tool.slug) : null;
    await prisma.tool.update({
      where: { id: toolId },
      data: { logoUrl: uploaded?.url ?? favicon ?? null },
    });
  }

  // 2. AI enrichment (summary, pros/cons, tags, FAQs, SEO, category)
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { slug: true },
  });
  const content = await generateToolContent({
    name: tool.name,
    description: tool.description,
    websiteUrl: tool.websiteUrl,
    categories: categories.map((c) => c.slug),
  });
  if (!content) return;

  const suggested = await prisma.category.findUnique({
    where: { slug: content.suggestedCategory },
  });

  await prisma.tool.update({
    where: { id: toolId },
    data: {
      aiSummary: content.summary,
      pros: tool.pros.length ? tool.pros : content.pros,
      cons: tool.cons.length ? tool.cons : content.cons,
      bestFor: content.bestFor,
      seoTitle: tool.seoTitle ?? content.seoTitle,
      seoDesc: tool.seoDesc ?? content.seoDescription,
      keywords: content.keywords,
      aiScore: Math.min(100, 60 + content.pros.length * 5),
      // Auto-detected category applies only while the tool is still pending review
      ...(suggested && tool.status === "PENDING" ? { categoryId: suggested.id } : {}),
    },
  });

  for (const tagName of content.tags) {
    const tagSlug = slugify(tagName);
    if (!tagSlug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug: tagSlug },
      create: { slug: tagSlug, name: tagName },
      update: {},
    });
    await prisma.toolTag
      .upsert({
        where: { toolId_tagId: { toolId, tagId: tag.id } },
        create: { toolId, tagId: tag.id },
        update: {},
      })
      .catch(() => {});
  }

  // 3. FAQs
  for (const [i, faq] of content.faqs.entries()) {
    await prisma.faq
      .create({
        data: { toolId, question: faq.question, answer: faq.answer, sortOrder: i, aiGenerated: true },
      })
      .catch(() => {});
  }

  // 4. Similar-tool detection → alternative edges (same category, shared tags)
  await detectAlternatives(toolId);
}

/** Auto-link alternatives by shared category + tag overlap. */
export async function detectAlternatives(toolId: string): Promise<void> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: { tags: true },
  });
  if (!tool) return;

  const tagIds = tool.tags.map((t) => t.tagId);
  const candidates = await prisma.tool.findMany({
    where: {
      id: { not: toolId },
      status: "PUBLISHED",
      deletedAt: null,
      OR: [
        { categoryId: tool.categoryId },
        ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    include: { tags: true },
    take: 30,
  });

  for (const candidate of candidates) {
    const sharedTags = candidate.tags.filter((t) => tagIds.includes(t.tagId)).length;
    const sameCategory = candidate.categoryId === tool.categoryId;
    const matchScore = Math.min(100, (sameCategory ? 50 : 20) + sharedTags * 10 + candidate.rating * 4);
    if (matchScore < 40) continue;

    await prisma.alternative
      .upsert({
        where: { sourceToolId_targetToolId: { sourceToolId: toolId, targetToolId: candidate.id } },
        create: { sourceToolId: toolId, targetToolId: candidate.id, matchScore, aiGenerated: true },
        update: { matchScore },
      })
      .catch(() => {});
    // Bidirectional edge
    await prisma.alternative
      .upsert({
        where: { sourceToolId_targetToolId: { sourceToolId: candidate.id, targetToolId: toolId } },
        create: { sourceToolId: candidate.id, targetToolId: toolId, matchScore, aiGenerated: true },
        update: {},
      })
      .catch(() => {});
  }
}

/**
 * Broken-link sweep: HEAD-check websites concurrently, open a report for each
 * failure. Skips tools that already have an OPEN broken-link report so daily
 * runs don't pile up duplicates.
 */
export async function checkBrokenLinks(batchSize = 30): Promise<{ checked: number; broken: number }> {
  const tools = await prisma.tool.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { id: true, websiteUrl: true },
    orderBy: { updatedAt: "asc" },
    take: batchSize,
  });

  const results = await Promise.allSettled(
    tools.map(async (tool) => {
      try {
        const res = await fetch(tool.websiteUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(6000),
          redirect: "follow",
        });
        if (res.status >= 400) throw new Error(String(res.status));
        return true;
      } catch {
        const existing = await prisma.report.findFirst({
          where: { toolId: tool.id, reason: "BROKEN_LINK", status: "OPEN" },
          select: { id: true },
        });
        if (!existing) {
          await prisma.report
            .create({
              data: { toolId: tool.id, reason: "BROKEN_LINK", detail: "Automated link check failed" },
            })
            .catch(() => {});
        }
        return false;
      }
    }),
  );

  const broken = results.filter((r) => r.status === "fulfilled" && r.value === false).length;
  return { checked: tools.length, broken };
}

/** Recompute denormalized scores (called after votes/reviews change). */
export async function recomputeToolScores(toolId: string): Promise<void> {
  const [agg, votes, bookmarks] = await Promise.all([
    prisma.review.aggregate({
      where: { toolId, approved: true },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.vote.groupBy({ by: ["type"], where: { toolId }, _count: true }),
    prisma.bookmark.count({ where: { toolId } }),
  ]);

  const upvotes = votes.find((v) => v.type === "UP")?._count ?? 0;
  const downvotes = votes.find((v) => v.type === "DOWN")?._count ?? 0;
  const rating = agg._avg.rating ?? 0;
  const reviewCount = agg._count;

  const tool = await prisma.tool.findUnique({ where: { id: toolId }, select: { viewCount: true } });
  const views = tool?.viewCount ?? 0;

  const popularityScore = Math.min(
    100,
    Math.log10(views + 1) * 15 + upvotes * 0.5 + bookmarks * 1.5 + reviewCount * 2,
  );
  const alternativeScore = Math.min(100, rating * 14 + Math.log10(upvotes + 1) * 10 + (reviewCount > 5 ? 10 : 0));
  const trustScore = Math.min(100, 40 + rating * 8 + (reviewCount > 10 ? 15 : reviewCount) - downvotes * 0.5);

  await prisma.tool.update({
    where: { id: toolId },
    data: {
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      upvotes,
      downvotes,
      bookmarkCount: bookmarks,
      popularityScore: Math.round(popularityScore * 10) / 10,
      alternativeScore: Math.round(alternativeScore * 10) / 10,
      trustScore: Math.round(trustScore * 10) / 10,
    },
  });
}
