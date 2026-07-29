/**
 * Comparison "awards" engine — deterministically picks the winner for each
 * category from real tool data (scores, pricing, ratings, capabilities).
 * No AI key required; if AI is configured the page can still layer a prose
 * verdict on top via lib/ai.
 */

export type AwardToolLike = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  rating: number;
  alternativeScore: number;
  aiScore: number;
  trustScore: number;
  popularityScore: number;
  pricingModel: string;
  isOpenSource: boolean;
  apiAvailable: boolean;
  gdpr: boolean;
  soc2: boolean;
  hasFreeTrial: boolean;
  integrations: string[];
  categorySlug?: string;
};

export type Award<T> = {
  key: string;
  label: string;
  icon: string; // lucide icon name
  tool: T | null;
  reason: string;
};

const FREE_MODELS = ["FREE", "FREEMIUM", "OPEN_SOURCE"];

function best<T extends AwardToolLike>(
  tools: T[],
  filter: (t: T) => boolean,
  score: (t: T) => number,
): T | null {
  const pool = tools.filter(filter);
  if (pool.length === 0) return null;
  return pool.reduce((a, b) => (score(b) > score(a) ? b : a));
}

/** Compute the full set of award winners for a comparison. */
export function computeAwards<T extends AwardToolLike>(tools: T[]): Award<T>[] {
  const overall = best(tools, () => true, (t) => t.alternativeScore || t.rating * 20);
  const bestFree = best(
    tools,
    (t) => FREE_MODELS.includes(t.pricingModel),
    (t) => t.rating * 20 + t.popularityScore,
  );
  const bestValue = best(
    tools,
    (t) => t.pricingModel === "FREEMIUM" || t.hasFreeTrial,
    (t) => t.rating * 20 + t.aiScore,
  );
  const enterprise = best(
    tools,
    (t) => t.soc2 || t.gdpr || t.apiAvailable || ["SUBSCRIPTION", "CONTACT"].includes(t.pricingModel),
    (t) => t.trustScore + (t.soc2 ? 15 : 0) + (t.gdpr ? 10 : 0) + (t.apiAvailable ? 5 : 0),
  );
  const developers = best(
    tools,
    (t) => t.apiAvailable || t.isOpenSource || t.categorySlug === "developer-tools" || t.categorySlug === "coding",
    (t) => t.alternativeScore + (t.apiAvailable ? 10 : 0) + (t.isOpenSource ? 8 : 0) + t.integrations.length,
  );
  const students = best(
    tools,
    (t) => FREE_MODELS.includes(t.pricingModel),
    (t) =>
      t.rating * 20 +
      (t.pricingModel === "FREE" ? 20 : t.pricingModel === "OPEN_SOURCE" ? 12 : 0),
  );

  return [
    { key: "overall", label: "Best Overall", icon: "Trophy", tool: overall, reason: overall ? `Top alternative score (${Math.round(overall.alternativeScore)}/100)` : "" },
    { key: "value", label: "Best Value", icon: "Gem", tool: bestValue, reason: bestValue ? "Great quality with a free tier or trial" : "" },
    { key: "free", label: "Best Free", icon: "Gift", tool: bestFree, reason: bestFree ? `Highest-rated free option (${bestFree.rating.toFixed(1)}★)` : "" },
    { key: "enterprise", label: "Best for Enterprise", icon: "Building2", tool: enterprise, reason: enterprise ? "Strongest trust, security & API support" : "" },
    { key: "developers", label: "Best for Developers", icon: "Code2", tool: developers, reason: developers ? "Best API, integrations & extensibility" : "" },
    { key: "students", label: "Best for Students", icon: "GraduationCap", tool: students, reason: students ? "Most affordable capable choice" : "" },
  ];
}

/** Build a deterministic verdict paragraph when no AI summary is stored. */
export function buildVerdict<T extends AwardToolLike>(tools: T[], awards: Award<T>[]): string {
  const names = tools.map((t) => t.name);
  const overall = awards.find((a) => a.key === "overall")?.tool;
  const free = awards.find((a) => a.key === "free")?.tool;
  const enterprise = awards.find((a) => a.key === "enterprise")?.tool;

  const parts: string[] = [];
  parts.push(`All ${names.length} tools are strong choices, but they win in different lanes.`);
  if (overall) parts.push(`${overall.name} takes the top spot overall thanks to its balance of quality, popularity and community trust.`);
  if (free && (!overall || free.id !== overall.id)) parts.push(`If budget matters, ${free.name} is the best free pick.`);
  if (enterprise && (!overall || enterprise.id !== overall.id)) parts.push(`For teams and organizations, ${enterprise.name} offers the strongest security and API story.`);
  parts.push(`Use the table below to weigh the exact trade-offs for your use case.`);
  return parts.join(" ");
}
