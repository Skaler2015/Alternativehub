/**
 * SEO Rank Tracker — provider abstraction.
 *
 * The tracker NEVER fabricates rankings. All ranks come from a real SERP data
 * provider through this interface. When no provider is configured, the app must
 * surface "Ranking provider is not configured." and never invent a number.
 */

export type RankDeviceType = "DESKTOP" | "MOBILE";

/** A single URL from the tracked domain found in the SERP. */
export type RankMatch = { url: string; rank: number; title?: string };

/** Normalized result of checking one keyword — the shape every provider returns. */
export type RankResult = {
  keyword: string;
  rank: number | null; // null = not found within the requested depth
  rankingUrl: string | null; // best (highest) ranking URL from the domain
  rankingTitle: string | null;
  allUrls: RankMatch[]; // every matching URL from the domain, best rank first
  searchEngine: string;
  country: string;
  device: RankDeviceType;
  checkedAt: string; // ISO timestamp
  found: boolean;
  provider: string;
  error: string | null;
  /** Internal hint for the job queue: whether a failed check is worth retrying. */
  retryable?: boolean;
};

export type RankCheckInput = {
  keyword: string;
  domain: string; // host, e.g. "www.alternativehub.in"
  country: string; // ISO-3166 alpha-2, lowercase, e.g. "in"
  language: string; // ISO-639-1, e.g. "en"
  device: RankDeviceType;
  depth: number; // how many results to scan (10/20/50/100)
};

export interface RankProviderInterface {
  /** Machine name, e.g. "serpapi" / "dataforseo". */
  readonly name: string;
  /** Check the Google rank of a single keyword for the domain. */
  checkKeywordRank(input: RankCheckInput): Promise<RankResult>;
  /**
   * Check several keywords. Default implementations may simply map over
   * checkKeywordRank; providers with native batch endpoints can override.
   */
  checkBulkKeywords(inputs: RankCheckInput[]): Promise<RankResult[]>;
}

/** Thrown by adapters so the queue can distinguish retryable vs terminal errors. */
export class RankProviderError extends Error {
  constructor(
    message: string,
    readonly opts: { retryable: boolean; httpStatus?: number; type: string },
  ) {
    super(message);
    this.name = "RankProviderError";
  }
}
