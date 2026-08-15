/**
 * Pure helpers for the rank tracker: keyword normalization, bulk parsing,
 * domain/URL matching, and rank status / change calculation. No I/O — easy to
 * reason about and safe to run anywhere.
 */

/** Lowercase + collapse whitespace, used only for duplicate detection. */
export function normalizeKeyword(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export type BulkParseResult = {
  /** Unique keywords in original display form (first occurrence wins). */
  valid: string[];
  total: number; // non-empty lines seen
  duplicates: number;
  invalid: number; // blank/whitespace-only lines
};

/** Parse a pasted block: one keyword per line; trim, drop blanks, de-dupe. */
export function parseBulkKeywords(text: string): BulkParseResult {
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const valid: string[] = [];
  let total = 0;
  let duplicates = 0;
  let invalid = 0;
  for (const line of lines) {
    const display = line.trim().replace(/\s+/g, " ");
    if (!display) {
      invalid += 1;
      continue;
    }
    total += 1;
    const norm = normalizeKeyword(display);
    if (seen.has(norm)) {
      duplicates += 1;
      continue;
    }
    seen.add(norm);
    valid.push(display);
  }
  return { valid, total, duplicates, invalid };
}

/** Extract a bare host from a domain string or full URL: "https://www.x.in/a" -> "www.x.in". */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/\/.*$/, ""); // strip path
  s = s.replace(/:\d+$/, ""); // strip port
  return s;
}

const stripWww = (host: string) => host.replace(/^www\./, "");

/** Does a SERP result URL belong to the tracked domain? (www-insensitive). */
export function urlMatchesDomain(url: string, domain: string): boolean {
  try {
    const host = new URL(url).host.toLowerCase();
    const d = stripWww(normalizeDomain(domain));
    const h = stripWww(host);
    return h === d || h.endsWith(`.${d}`);
  } catch {
    return false;
  }
}

/** Depth bucket label for a rank (used for Top 3/10/20/50/100 filtering & badges). */
export function rankBucket(rank: number | null | undefined): string {
  if (rank == null) return "Not Ranking";
  if (rank <= 3) return "Top 3";
  if (rank <= 10) return "Top 10";
  if (rank <= 20) return "Top 20";
  if (rank <= 50) return "Top 50";
  if (rank <= 100) return "Top 100";
  return "Not Ranking";
}

export type Movement =
  | "Improved"
  | "Dropped"
  | "No Change"
  | "New"
  | "Newly Ranking"
  | "Dropped Out"
  | "Not Ranking";

/**
 * Compute the movement label + numeric change between two checks.
 * `change` is (previous - current): positive = improved (lower rank is better).
 */
export function computeMovement(input: {
  previousRank: number | null;
  currentRank: number | null;
  hadPreviousCheck: boolean;
}): { movement: Movement; change: number | null } {
  const { previousRank, currentRank, hadPreviousCheck } = input;
  if (!hadPreviousCheck) {
    return { movement: currentRank != null ? "New" : "Not Ranking", change: null };
  }
  if (previousRank != null && currentRank == null) return { movement: "Dropped Out", change: null };
  if (previousRank == null && currentRank != null) return { movement: "Newly Ranking", change: null };
  if (previousRank == null && currentRank == null) return { movement: "Not Ranking", change: null };
  const change = (previousRank as number) - (currentRank as number);
  if (change > 0) return { movement: "Improved", change };
  if (change < 0) return { movement: "Dropped", change };
  return { movement: "No Change", change: 0 };
}
