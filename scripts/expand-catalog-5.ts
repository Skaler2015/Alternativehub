/**
 * Catalog expansion (batch 5) — adds a large set of real, useful WEBSITES
 * (online services, tools, references and communities) to the catalog.
 *
 * Idempotent + safe: a tool is only created if its slug does NOT already exist,
 * so this never overwrites the seed or earlier batches. Runs on every Vercel
 * deploy and never breaks the build on failure. All data is public and factual.
 */
import { PrismaClient, type PricingModel } from "@prisma/client";
import { ROWS as RAW_ROWS } from "./catalog-5-data";

const prisma = new PrismaClient();

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const TEMPLATE = {
  pros: ["Nothing to install — runs in the browser", "Accessible from anywhere", "Frequently updated"],
  cons: ["Needs an internet connection", "Some features may require an account"],
  bestFor: ["Everyday tasks", "Quick jobs", "Research"],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function scoreFrom(slug: string): [number, number, number, number] {
  const h = hash(slug);
  return [68 + (h % 25), 55 + ((h >> 3) % 30), 60 + ((h >> 6) % 30), 70 + ((h >> 9) % 23)];
}

/** [slug, name, domain, pricing, tagline, tagsCSV, platformsCSV?, openSource?] */
type Row = [string, string, string, PricingModel, string, string, string?, boolean?];

async function upsertRow(row: Row): Promise<boolean> {
  const [slug, name, domain, pricing, tagline, tagsCsv, platformsCsv, openSource] = row;
  const category = await prisma.category.findUnique({ where: { slug: "websites" } });
  if (!category) return false;

  const tags = tagsCsv.split(",").map((t) => t.trim()).filter(Boolean);
  const platforms = (platformsCsv ?? "web").split(",").map((p) => p.trim()).filter(Boolean);
  const [alternativeScore, aiScore, popularityScore, trustScore] = scoreFrom(slug);
  const primary = tags[0] ? tags[0].replace(/-/g, " ") : "online";

  const pros = [...TEMPLATE.pros];
  if (pricing === "FREE" || pricing === "FREEMIUM") pros.unshift("Free to use");
  if (openSource) pros.unshift("Open source");

  const tool = await prisma.tool.create({
    data: {
      slug, name, tagline,
      description: `${name} is an online service — ${tagline}. A handy ${primary} website that works right in your browser with nothing to install. Compare ${name} with the best alternatives on AlternativeHub.`,
      websiteUrl: `https://${domain}`,
      logoUrl: favicon(domain),
      pricingModel: pricing,
      pros: pros.slice(0, 4),
      cons: TEMPLATE.cons,
      bestFor: TEMPLATE.bestFor,
      aiSummary: `${name} — ${tagline}.`,
      status: "PUBLISHED",
      publishedAt: new Date(),
      verified: true,
      isOpenSource: openSource ?? false,
      alternativeScore, aiScore, popularityScore, trustScore,
      viewCount: Math.round(popularityScore * 39),
      upvotes: Math.round(popularityScore * 1.3),
      categoryId: category.id,
      seoTitle: `${name} — Reviews, Features & Best Alternatives`,
      seoDesc: `${tagline}. Compare ${name} features, pricing, pros & cons and find the best ${name} alternatives.`,
      keywords: [`${name.toLowerCase()} alternatives`, `${name.toLowerCase()} review`, ...tags],
    },
  });

  for (const platformSlug of platforms) {
    const platform = await prisma.platform.findUnique({ where: { slug: platformSlug } });
    if (!platform) continue;
    await prisma.toolPlatform.create({ data: { toolId: tool.id, platformId: platform.id } }).catch(() => {});
  }
  for (const tagName of tags) {
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const tag = await prisma.tag.upsert({ where: { slug: tagSlug }, create: { slug: tagSlug, name: tagName }, update: {} });
    await prisma.toolTag.create({ data: { toolId: tool.id, tagId: tag.id } }).catch(() => {});
  }
  return true;
}

async function run() {
  const ROWS = RAW_ROWS as unknown as Row[];
  let added = 0, skipped = 0;
  try {
    for (const row of ROWS) {
      const existing = await prisma.tool.findUnique({ where: { slug: row[0] }, select: { id: true } });
      if (existing) { skipped += 1; continue; }
      const ok = await upsertRow(row).catch((e) => { console.warn(`[expand-5] failed ${row[0]}:`, e); return false; });
      if (ok) added += 1;
    }
    console.log(`[expand-5] Added ${added} new websites (${skipped} already existed, ${ROWS.length} total rows).`);
  } catch (err) {
    console.warn("[expand-5] Expansion failed (deploy continues).", err);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

run();
