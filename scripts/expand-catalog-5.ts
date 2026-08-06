/**
 * Catalog expansion (batch 5) — real WEBSITES (online services).
 *
 * Uses the shared bulk inserter for speed. Duplicate-proof and idempotent:
 * only brand-new slugs are inserted, existing data is never overwritten, and a
 * failure never breaks the deploy. All rows describe real, public services.
 */
import { PrismaClient, type PricingModel } from "@prisma/client";
import { ROWS as RAW_ROWS } from "./catalog-5-data";
import { bulkInsert, type NormalizedRow } from "./bulk-catalog";

const prisma = new PrismaClient();

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

function normalize(row: Row): NormalizedRow {
  const [slug, name, domain, pricing, tagline, tagsCsv, platformsCsv, openSource] = row;
  const tags = tagsCsv.split(",").map((t) => t.trim()).filter(Boolean);
  const platforms = (platformsCsv ?? "web").split(",").map((p) => p.trim()).filter(Boolean);
  const primary = tags[0] ? tags[0].replace(/-/g, " ") : "online";
  const pros = [...TEMPLATE.pros];
  if (pricing === "FREE" || pricing === "FREEMIUM") pros.unshift("Free to use");
  if (openSource) pros.unshift("Open source");
  return {
    slug, name, domain, category: "websites", pricing, tagline,
    description: `${name} is an online service — ${tagline}. A handy ${primary} website that works right in your browser with nothing to install. Compare ${name} with the best alternatives on AlternativeHub.`,
    pros: pros.slice(0, 4),
    cons: TEMPLATE.cons,
    bestFor: TEMPLATE.bestFor,
    aiSummary: `${name} — ${tagline}.`,
    seoTitle: `${name} — Reviews, Features & Best Alternatives`,
    seoDesc: `${tagline}. Compare ${name} features, pricing, pros & cons and find the best ${name} alternatives.`,
    keywords: [`${name.toLowerCase()} alternatives`, `${name.toLowerCase()} review`, ...tags],
    scores: scoreFrom(slug),
    tags, platforms, openSource: openSource ?? false,
  };
}

async function run() {
  try {
    const rows = (RAW_ROWS as unknown as Row[]).map(normalize);
    await bulkInsert(prisma, rows, "expand-5");
  } catch (err) {
    console.warn("[expand-5] Expansion failed (deploy continues).", err);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

run();
