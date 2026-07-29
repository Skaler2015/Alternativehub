import { MeiliSearch } from "meilisearch";
import { prisma } from "@/lib/prisma";

export type SearchHit = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  category: string;
  categorySlug: string;
  pricingModel: string;
  rating: number;
  reviewCount: number;
  popularityScore: number;
};

const INDEX = "tools";

let client: MeiliSearch | null | undefined;

function getMeili(): MeiliSearch | null {
  if (client !== undefined) return client;
  const host = process.env.MEILISEARCH_HOST;
  client = host
    ? new MeiliSearch({ host, apiKey: process.env.MEILISEARCH_API_KEY })
    : null;
  return client;
}

/**
 * Instant search: Meilisearch (typo-tolerant, <50 ms) with automatic
 * Postgres fallback so search never goes down with the search cluster.
 */
export async function searchTools(
  query: string,
  opts: { category?: string; limit?: number } = {},
): Promise<{ hits: SearchHit[]; source: "meilisearch" | "postgres" }> {
  const limit = opts.limit ?? 8;
  const meili = getMeili();

  if (meili) {
    try {
      const res = await meili.index(INDEX).search<SearchHit>(query, {
        limit,
        filter: opts.category ? [`categorySlug = ${JSON.stringify(opts.category)}`] : undefined,
        attributesToHighlight: [],
      });
      return { hits: res.hits, source: "meilisearch" };
    } catch {
      // fall through to Postgres
    }
  }

  const tools = await prisma.tool.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(opts.category ? { category: { slug: opts.category } } : {}),
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { tagline: { contains: query, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: query, mode: "insensitive" } } } } },
      ],
    },
    include: { category: true },
    orderBy: { popularityScore: "desc" },
    take: limit,
  });

  return {
    hits: tools.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      logoUrl: t.logoUrl,
      category: t.category.name,
      categorySlug: t.category.slug,
      pricingModel: t.pricingModel,
      rating: t.rating,
      reviewCount: t.reviewCount,
      popularityScore: t.popularityScore,
    })),
    source: "postgres",
  };
}

/** Sync all published tools into the Meilisearch index (see scripts/sync-search.ts). */
export async function syncSearchIndex(): Promise<number> {
  const meili = getMeili();
  if (!meili) throw new Error("MEILISEARCH_HOST is not configured");

  const tools = await prisma.tool.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    include: { category: true, tags: { include: { tag: true } } },
  });

  const documents = tools.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    description: t.description.slice(0, 2000),
    logoUrl: t.logoUrl,
    category: t.category.name,
    categorySlug: t.category.slug,
    pricingModel: t.pricingModel,
    rating: t.rating,
    reviewCount: t.reviewCount,
    popularityScore: t.popularityScore,
    tags: t.tags.map((tt) => tt.tag.name),
    keywords: t.keywords,
  }));

  const index = meili.index(INDEX);
  await index.updateSettings({
    searchableAttributes: ["name", "tagline", "tags", "keywords", "description", "category"],
    filterableAttributes: ["categorySlug", "pricingModel"],
    sortableAttributes: ["popularityScore", "rating"],
    rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness", "popularityScore:desc"],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
  });
  await index.addDocuments(documents, { primaryKey: "id" });
  return documents.length;
}
