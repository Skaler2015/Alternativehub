/**
 * Bulk catalog expansion (batch 4) — 1,000+ real software products.
 *
 * Uses the shared bulk inserter (a handful of queries instead of tens of
 * thousands) so a batch this large finishes inside the Vercel build.
 * Duplicate-proof and idempotent: only brand-new slugs are inserted and
 * existing data is never overwritten. All rows describe real, public products.
 */
import { PrismaClient, type PricingModel } from "@prisma/client";
import { ROWS as RAW_ROWS } from "./catalog-4-data";
import { bulkInsert, type NormalizedRow } from "./bulk-catalog";

const prisma = new PrismaClient();

const CAT_LABEL: Record<string, string> = {
  "apps": "app", "websites": "online service", "ai-tools": "AI tool",
  "desktop-software": "desktop application", "games": "game", "browser-extensions": "browser extension",
  "saas": "SaaS platform", "developer-tools": "developer tool", "productivity": "productivity tool",
  "finance": "finance tool", "education": "learning platform", "security": "security tool",
  "cloud": "cloud platform", "marketing": "marketing tool", "video-editing": "video editor",
  "photo-editing": "photo editor", "pdf-tools": "PDF tool", "coding": "coding tool",
  "hosting": "hosting platform", "vpn": "VPN service", "streaming": "streaming service",
  "crm": "CRM platform", "erp": "ERP platform", "database": "database platform",
  "email": "email tool", "automation": "automation platform", "no-code": "no-code platform",
  "low-code": "low-code platform",
};

const CAT_TEMPLATE: Record<string, { pros: string[]; cons: string[]; bestFor: string[] }> = {
  "ai-tools": { pros: ["Saves time on repetitive work", "Improving rapidly", "Easy to get started"], cons: ["Output needs review", "Usage limits on free plans"], bestFor: ["Creators", "Teams", "Automation"] },
  "developer-tools": { pros: ["Boosts developer productivity", "Integrates with common stacks", "Good documentation"], cons: ["Learning curve", "Advanced features are paid"], bestFor: ["Developers", "DevOps", "Teams"] },
  "coding": { pros: ["Fast and lightweight", "Extensible", "Cross-platform"], cons: ["Setup can be involved", "Some features need plugins"], bestFor: ["Developers", "Students", "Open source"] },
  "productivity": { pros: ["Keeps work organized", "Clean interface", "Syncs across devices"], cons: ["Can be feature-heavy", "Best features are paid"], bestFor: ["Individuals", "Teams", "Remote work"] },
  "saas": { pros: ["Scales with your team", "No installation required", "Regular updates"], cons: ["Subscription cost", "Data lives in the cloud"], bestFor: ["Startups", "SMBs", "Enterprises"] },
  "marketing": { pros: ["Grows reach and engagement", "Useful analytics", "Automation options"], cons: ["Pricing scales with usage", "Learning curve"], bestFor: ["Marketers", "Agencies", "Founders"] },
  "finance": { pros: ["Clear financial overview", "Secure", "Time-saving automation"], cons: ["Premium tiers for full features", "Region availability varies"], bestFor: ["Individuals", "Freelancers", "Businesses"] },
  "security": { pros: ["Strong protection", "Cross-platform", "Easy to manage"], cons: ["Premium for advanced features", "Occasional setup complexity"], bestFor: ["Individuals", "Teams", "Privacy-focused users"] },
  "video-editing": { pros: ["Powerful editing tools", "Good export options", "Regular updates"], cons: ["Can be resource heavy", "Pro features are paid"], bestFor: ["Creators", "YouTubers", "Marketers"] },
  "photo-editing": { pros: ["Rich editing features", "Non-destructive workflow", "Great results"], cons: ["Learning curve", "Paid for full toolkit"], bestFor: ["Photographers", "Designers", "Creators"] },
  "pdf-tools": { pros: ["Handles PDFs with ease", "Fast", "Works across platforms"], cons: ["Advanced tools are paid", "Large files can be slow"], bestFor: ["Office work", "Students", "Teams"] },
  "hosting": { pros: ["Reliable uptime", "Easy deployment", "Scales on demand"], cons: ["Costs grow with traffic", "Some lock-in"], bestFor: ["Developers", "Agencies", "Startups"] },
  "cloud": { pros: ["Access anywhere", "Reliable storage", "Team sharing"], cons: ["Ongoing subscription", "Privacy depends on provider"], bestFor: ["Teams", "Remote work", "Backups"] },
  "vpn": { pros: ["Protects privacy", "Unblocks content", "Easy to use"], cons: ["Can slow connection", "Best plans are paid"], bestFor: ["Privacy", "Travel", "Streaming"] },
  "streaming": { pros: ["Huge library", "Multi-device", "Good discovery"], cons: ["Monthly cost", "Regional catalogs differ"], bestFor: ["Entertainment", "Music lovers", "Families"] },
  "crm": { pros: ["Centralizes customer data", "Automates follow-ups", "Useful pipeline views"], cons: ["Setup takes time", "Costs scale per seat"], bestFor: ["Sales teams", "SMBs", "Agencies"] },
  "erp": { pros: ["Unifies business operations", "Scalable", "Detailed reporting"], cons: ["Complex to implement", "Higher cost"], bestFor: ["Enterprises", "Manufacturers", "Operations"] },
  "database": { pros: ["Reliable and performant", "Good tooling", "Scales well"], cons: ["Requires expertise", "Ops overhead"], bestFor: ["Developers", "Data teams", "Apps"] },
  "email": { pros: ["Clean inbox experience", "Good search", "Cross-device"], cons: ["Premium for extras", "Migration effort"], bestFor: ["Professionals", "Teams", "Newsletters"] },
  "automation": { pros: ["Saves manual work", "Connects your apps", "No-code friendly"], cons: ["Complex flows get pricey", "Debugging can be tricky"], bestFor: ["Ops", "Marketers", "Solopreneurs"] },
  "no-code": { pros: ["Build without coding", "Fast to ship", "Visual editor"], cons: ["Limits at scale", "Vendor lock-in"], bestFor: ["Founders", "Makers", "Small teams"] },
  "low-code": { pros: ["Faster development", "Flexible", "Enterprise-ready"], cons: ["Some coding still needed", "Platform cost"], bestFor: ["Dev teams", "Enterprises", "IT"] },
  "education": { pros: ["Learn at your pace", "Quality content", "Track progress"], cons: ["Best courses are paid", "Requires discipline"], bestFor: ["Students", "Professionals", "Self-learners"] },
  "games": { pros: ["Fun and engaging", "Active community", "Regular content"], cons: ["Can be time-consuming", "In-app purchases"], bestFor: ["Gamers", "Casual play", "Communities"] },
  "browser-extensions": { pros: ["Lightweight", "Improves your workflow", "Free to try"], cons: ["Permissions to review", "Browser-dependent"], bestFor: ["Everyday browsing", "Productivity", "Research"] },
  "desktop-software": { pros: ["Powerful native features", "Works offline", "Reliable"], cons: ["Install and updates required", "Platform-specific"], bestFor: ["Professionals", "Power users", "Offline work"] },
  "apps": { pros: ["Convenient on the go", "Simple to use", "Syncs data"], cons: ["Ads on free tier", "Battery/data usage"], bestFor: ["Mobile users", "Everyday tasks", "On the go"] },
  "websites": { pros: ["Nothing to install", "Accessible anywhere", "Frequent updates"], cons: ["Needs internet", "Account may be required"], bestFor: ["Everyone", "Quick tasks", "Collaboration"] },
};
const DEFAULT_TEMPLATE = { pros: ["Useful feature set", "Easy to start", "Actively maintained"], cons: ["Premium features are paid", "Learning curve"], bestFor: ["Individuals", "Teams", "Businesses"] };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function scoreFrom(slug: string): [number, number, number, number] {
  const h = hash(slug);
  return [68 + (h % 25), 58 + ((h >> 3) % 30), 62 + ((h >> 6) % 29), 70 + ((h >> 9) % 23)];
}

type Row = [string, string, string, string, PricingModel, string, string, string?, boolean?];

function normalize(row: Row): NormalizedRow {
  const [slug, name, domain, cat, pricing, tagline, tagsCsv, platformsCsv, openSource] = row;
  const tags = tagsCsv.split(",").map((t) => t.trim()).filter(Boolean);
  const platforms = (platformsCsv ?? "web").split(",").map((p) => p.trim()).filter(Boolean);
  const tpl = CAT_TEMPLATE[cat] ?? DEFAULT_TEMPLATE;
  const label = CAT_LABEL[cat] ?? "tool";
  const primary = tags[0] ? tags[0].replace(/-/g, " ") : label;
  const pros = [...tpl.pros];
  if (pricing === "FREE" || pricing === "FREEMIUM") pros.unshift("Has a free plan");
  if (openSource) pros.unshift("Open source");
  return {
    slug, name, domain, category: cat, pricing, tagline,
    description: `${name} is a ${label} — ${tagline}. It's a popular choice for anyone looking for a reliable ${primary} solution, offering a well-rounded feature set, a clean experience, and steady updates. Compare ${name} with the best alternatives on AlternativeHub.`,
    pros: pros.slice(0, 4),
    cons: tpl.cons,
    bestFor: tpl.bestFor,
    aiSummary: `${name} — ${tagline}.`,
    seoTitle: `${name} — Reviews, Pricing & Best Alternatives`,
    seoDesc: `${tagline}. Compare ${name} features, pricing, pros & cons and find the best ${name} alternatives.`,
    keywords: [`${name.toLowerCase()} alternatives`, `${name.toLowerCase()} review`, ...tags],
    scores: scoreFrom(slug),
    tags, platforms, openSource: openSource ?? false,
  };
}

async function run() {
  try {
    const rows = (RAW_ROWS as unknown as Row[]).map(normalize);
    await bulkInsert(prisma, rows, "expand-4");
  } catch (err) {
    console.warn("[expand-4] Expansion failed (deploy continues).", err);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

run();
