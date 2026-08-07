import { prisma } from "@/lib/prisma";
import { aiEnabled, aiJson } from "@/lib/ai";
import type { PricingModel } from "@prisma/client";

/**
 * AI-powered daily catalog growth. Asks the configured AI provider for batches
 * of real, well-known software, de-duplicates against the existing catalog, and
 * publishes the new ones. Auto-generated tools are marked verified:false so the
 * admin can review, edit or remove them.
 *
 * Safe by design: no-op without an AI provider; every failure is swallowed so a
 * bad batch never breaks the cron. Nightly enrichment fills richer AI content later.
 */
export const DAILY_TARGET = 150;

const PRICINGS: PricingModel[] = ["FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT"];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}&sz=128`;

type Candidate = {
  name: string; domain: string; category: string; pricing: string;
  tagline: string; description: string; pros?: string[]; cons?: string[]; tags?: string[];
};

const BATCH_SCHEMA = {
  type: "object",
  properties: {
    tools: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          domain: { type: "string", description: "official website hostname, e.g. figma.com" },
          category: { type: "string", description: "one of the provided category slugs" },
          pricing: { type: "string", enum: PRICINGS },
          tagline: { type: "string" },
          description: { type: "string" },
          pros: { type: "array", items: { type: "string" } },
          cons: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "domain", "category", "pricing", "tagline", "description"],
      },
    },
  },
  required: ["tools"],
} as const;

async function requestBatch(categorySlugs: string[], avoid: string[], perBatch: number): Promise<Candidate[]> {
  const system =
    "You are a software directory researcher. You ONLY output real, currently-existing, well-known software products with accurate details. " +
    "Never invent products, fake domains, or fictional tools. If unsure a product is real, omit it.";
  const prompt =
    `List ${perBatch} real software products spread across these category slugs: ${categorySlugs.join(", ")}.\n` +
    `For each: the exact product name, its official website domain (hostname only), the best-fitting category slug from the list, ` +
    `a pricing model, a one-line tagline, a 2-sentence factual description, 3 short pros, 2 short cons, and 3 lowercase tags.\n` +
    `Do NOT include any of these already-listed products: ${avoid.slice(0, 120).join(", ")}.\n` +
    `Prefer widely-known, real tools. Return strictly the JSON schema.`;
  const res = await aiJson<{ tools: Candidate[] }>(system, prompt, BATCH_SCHEMA as unknown as Record<string, unknown>).catch(() => null);
  return res?.tools ?? [];
}

/** Generate and publish up to `target` new tools. Returns the number actually added. */
export async function generateAndPublishTools(target = DAILY_TARGET): Promise<number> {
  if (!aiEnabled()) return 0;

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } }).catch(() => []);
  if (categories.length === 0) return 0;
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const catSlugs = categories.map((c) => c.slug);

  // Existing slugs (dedupe) + a sample of names to steer the AI away from repeats.
  const existing = await prisma.tool.findMany({ select: { slug: true, name: true } }).catch(() => []);
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const avoidNames = existing.map((t) => t.name);

  const perBatch = 40;
  const maxRounds = 6; // safety cap → ~240 candidates max per run (fits the 60s cron budget)
  const toInsert: import("@prisma/client").Prisma.ToolCreateManyInput[] = [];
  const usedSlugs = new Set<string>();

  for (let round = 0; round < maxRounds && toInsert.length < target; round++) {
    // Rotate the category focus each round so batches stay varied.
    const focus = catSlugs.slice((round * 6) % catSlugs.length).concat(catSlugs).slice(0, 8);
    const batch = await requestBatch(focus, avoidNames, perBatch).catch(() => []);

    for (const c of batch) {
      if (toInsert.length >= target) break;
      const slug = slugify(c.name);
      if (!slug || existingSlugs.has(slug) || usedSlugs.has(slug)) continue;
      const categoryId = catBySlug.get(c.category) ?? catBySlug.get(catSlugs[round % catSlugs.length]);
      if (!categoryId) continue;
      const domain = (c.domain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
      if (!domain || !domain.includes(".")) continue;
      const pricing = (PRICINGS.includes(c.pricing as PricingModel) ? c.pricing : "FREEMIUM") as PricingModel;

      usedSlugs.add(slug);
      avoidNames.push(c.name); // steer subsequent rounds away
      toInsert.push({
        slug,
        name: c.name.slice(0, 120),
        tagline: (c.tagline || "").slice(0, 160) || null,
        description: (c.description || c.tagline || c.name).slice(0, 4000),
        websiteUrl: `https://${domain}`,
        logoUrl: favicon(domain),
        pricingModel: pricing,
        pros: (c.pros ?? []).slice(0, 6),
        cons: (c.cons ?? []).slice(0, 6),
        bestFor: [],
        status: "PUBLISHED",
        publishedAt: new Date(),
        verified: false,
        isOpenSource: pricing === "OPEN_SOURCE",
        alternativeScore: 62, aiScore: 65, popularityScore: 55, trustScore: 60,
        viewCount: 0, upvotes: 0,
        categoryId,
        aiSummary: `${c.name} — ${c.tagline ?? ""}`.slice(0, 500),
        seoTitle: `${c.name} — Reviews, Pricing & Best Alternatives`,
        seoDesc: (c.tagline || c.description || "").slice(0, 300),
        keywords: [`${c.name.toLowerCase()} alternatives`, `${c.name.toLowerCase()} review`, ...(c.tags ?? [])].slice(0, 10),
      });
    }
  }

  if (toInsert.length === 0) return 0;

  const result = await prisma.tool.createMany({ data: toInsert, skipDuplicates: true }).catch(() => ({ count: 0 }));
  return result.count;
}
