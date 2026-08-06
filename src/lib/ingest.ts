import { prisma } from "@/lib/prisma";
import type { PricingModel } from "@prisma/client";

/**
 * Automated discovery of NEW real tools/products from public sources:
 *   - Hacker News "Show HN" (Algolia API, free, no key)
 *   - GitHub trending / newly popular repos (public search API)
 *   - Product Hunt daily feed (RSS)
 *
 * Everything is failure-safe and de-duplicated (by slug and by domain), so it
 * never adds a duplicate and a source outage never breaks the cron. New tools
 * are published as verified:false so the nightly AI enrichment + admin can
 * refine them. Runs on Vercel (which has outbound internet).
 */

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
};
const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

type Candidate = { name: string; url: string; description: string; source: string };

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AlternativeHub-Bot/1.0", ...headers }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; } finally { clearTimeout(t); }
}

async function fetchText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AlternativeHub-Bot/1.0" }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; } finally { clearTimeout(t); }
}

/** Hacker News "Show HN" — people launching new products/tools. */
async function fromHackerNews(): Promise<Candidate[]> {
  const data = (await fetchJson("https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=50")) as
    | { hits?: { title?: string; url?: string; points?: number }[] }
    | null;
  const out: Candidate[] = [];
  for (const h of data?.hits ?? []) {
    if (!h.url || !h.title) continue;
    if ((h.points ?? 0) < 5) continue;
    // "Show HN: Foo – a bar tool" → name "Foo", desc "a bar tool"
    let title = h.title.replace(/^show hn:?\s*/i, "").trim();
    const parts = title.split(/\s[–—\-|:]\s/);
    const name = (parts[0] || title).trim();
    const description = (parts.slice(1).join(" - ") || "").trim();
    if (name.length < 2 || name.length > 60) continue;
    out.push({ name, url: h.url, description, source: "Hacker News" });
  }
  return out;
}

/** GitHub — newly popular repositories (last ~2 weeks, well-starred). */
async function fromGitHub(): Promise<Candidate[]> {
  // 14 days ago, no Date.now() issues here (this runs in a normal Node runtime).
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const data = (await fetchJson(
    `https://api.github.com/search/repositories?q=created:>${since}+stars:>200&sort=stars&order=desc&per_page=40`,
    { Accept: "application/vnd.github+json" },
  )) as { items?: { name?: string; description?: string; homepage?: string; html_url?: string }[] } | null;
  const out: Candidate[] = [];
  for (const r of data?.items ?? []) {
    if (!r.name) continue;
    const url = (r.homepage && /^https?:\/\//.test(r.homepage) ? r.homepage : r.html_url) || "";
    if (!url) continue;
    out.push({ name: r.name, url, description: (r.description ?? "").trim(), source: "GitHub" });
  }
  return out;
}

/** Product Hunt daily feed (RSS). */
async function fromProductHunt(): Promise<Candidate[]> {
  const xml = await fetchText("https://www.producthunt.com/feed");
  if (!xml) return [];
  const out: Candidate[] = [];
  const items = xml.split(/<item>/i).slice(1);
  for (const item of items.slice(0, 40)) {
    const title = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || "").trim();
    const link = (item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1] || "").trim();
    const descRaw = (item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] || "").trim();
    if (!title || !link) continue;
    // Product Hunt titles are often "Name — tagline"
    const parts = title.split(/\s[–—\-|:]\s/);
    const name = (parts[0] || title).trim();
    const description = (parts.slice(1).join(" - ") || descRaw.replace(/<[^>]+>/g, "")).trim().slice(0, 300);
    if (name.length < 2 || name.length > 60) continue;
    out.push({ name, url: link, description, source: "Product Hunt" });
  }
  return out;
}

/** Cheap keyword-based category guess; nightly enrichment/admin refine later. */
function guessCategory(text: string, valid: Set<string>): string {
  const t = text.toLowerCase();
  const rules: [string, string][] = [
    ["ai-tools", "ai |gpt|llm|machine learning|chatbot|agent|neural"],
    ["developer-tools", "api|sdk|developer|devops|cli|framework|library|open source|self-host|kubernetes|docker"],
    ["design", "design|figma|ui |ux|icon|font|illustration"],
    ["marketing", "marketing|seo|email|social media|analytics|ads"],
    ["productivity", "productivity|notes|task|calendar|workflow|note-taking"],
    ["finance", "finance|payment|invoice|budget|crypto|banking|accounting"],
    ["security", "security|password|vpn|encryption|privacy|auth"],
    ["saas", "saas|crm|dashboard|platform|b2b"],
    ["games", "game|gaming|play"],
  ];
  for (const [cat, kw] of rules) {
    const target = cat === "design" ? "photo-editing" : cat;
    if (valid.has(target) && new RegExp(kw).test(t)) return target;
  }
  return valid.has("developer-tools") ? "developer-tools" : [...valid][0];
}

/**
 * Fetch from all sources, de-duplicate, and publish new tools.
 * @param limit max new tools to add this run (keeps the cron within its budget)
 */
export async function ingestNewTools(limit = 40): Promise<{ added: number; bySource: Record<string, number> }> {
  const bySource: Record<string, number> = {};
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } }).catch(() => []);
  if (categories.length === 0) return { added: 0, bySource };
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const validCats = new Set(categories.map((c) => c.slug));

  // Gather candidates from every source (independent — one failing is fine).
  const [hn, gh, ph] = await Promise.all([
    fromHackerNews().catch(() => []),
    fromGitHub().catch(() => []),
    fromProductHunt().catch(() => []),
  ]);
  const candidates = [...ph, ...hn, ...gh]; // Product Hunt first (highest quality)

  // Dedupe vs existing catalog (slug + domain).
  const existing = await prisma.tool.findMany({ select: { slug: true, websiteUrl: true } }).catch(() => []);
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const existingDomains = new Set(existing.map((t) => hostOf(t.websiteUrl)).filter(Boolean));

  const seenSlug = new Set<string>();
  const seenDomain = new Set<string>();
  const toInsert: import("@prisma/client").Prisma.ToolCreateManyInput[] = [];

  for (const c of candidates) {
    if (toInsert.length >= limit) break;
    const domain = hostOf(c.url);
    if (!domain || !domain.includes(".")) continue;
    // skip aggregator/self domains
    if (/(github\.com|news\.ycombinator\.com|producthunt\.com)$/.test(domain)) {
      if (c.source !== "GitHub") continue; // GitHub html_url allowed as fallback
    }
    const slug = slugify(c.name);
    if (!slug || existingSlugs.has(slug) || seenSlug.has(slug)) continue;
    if (existingDomains.has(domain) || seenDomain.has(domain)) continue;

    seenSlug.add(slug);
    seenDomain.add(domain);
    const category = guessCategory(`${c.name} ${c.description} ${c.source}`, validCats);
    const categoryId = catBySlug.get(category);
    if (!categoryId) continue;

    const tagline = (c.description || `${c.name} — discovered via ${c.source}`).slice(0, 160);
    toInsert.push({
      slug,
      name: c.name.slice(0, 120),
      tagline,
      description: (c.description || c.name).slice(0, 4000),
      websiteUrl: c.url.startsWith("http") ? c.url : `https://${domain}`,
      logoUrl: favicon(domain),
      pricingModel: "FREEMIUM" as PricingModel,
      pros: [],
      cons: [],
      bestFor: [],
      status: "PUBLISHED",
      publishedAt: new Date(),
      verified: false,
      alternativeScore: 55,
      aiScore: 55,
      popularityScore: 50,
      trustScore: 52,
      viewCount: 0,
      upvotes: 0,
      categoryId,
      aiSummary: `${c.name} — ${tagline}`.slice(0, 500),
      seoTitle: `${c.name} — Reviews, Pricing & Best Alternatives`,
      seoDesc: tagline.slice(0, 300),
      keywords: [`${c.name.toLowerCase()} alternatives`, `${c.name.toLowerCase()} review`, c.source.toLowerCase()],
    });
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
  }

  if (toInsert.length === 0) return { added: 0, bySource };
  const result = await prisma.tool.createMany({ data: toInsert, skipDuplicates: true }).catch(() => ({ count: 0 }));
  return { added: result.count, bySource };
}
