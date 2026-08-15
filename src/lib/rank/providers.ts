/**
 * Rank provider adapters + factory.
 *
 * getRankProvider() reads the (encrypted) provider config from the DB and
 * returns a ready-to-use provider, or null when nothing is configured. Callers
 * MUST treat null as "Ranking provider is not configured." and never fake data.
 */
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/rank/crypto";
import { urlMatchesDomain } from "@/lib/rank/normalize";
import {
  RankProviderError,
  type RankCheckInput,
  type RankMatch,
  type RankProviderInterface,
  type RankResult,
} from "@/lib/rank/types";

const DEFAULT_TIMEOUT_MS = 20000;

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text.slice(0, 500) };
    }
    return { status: res.status, json };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new RankProviderError(aborted ? "Provider timeout. Retry scheduled." : "Network error.", {
      retryable: true,
      type: aborted ? "TIMEOUT" : "NETWORK_ERROR",
    });
  } finally {
    clearTimeout(t);
  }
}

/** Map an HTTP status to a friendly, retry-aware provider error. */
function httpError(status: number): RankProviderError {
  if (status === 401) return new RankProviderError("Invalid API credentials.", { retryable: false, httpStatus: 401, type: "AUTH_ERROR" });
  if (status === 403) return new RankProviderError("API access denied.", { retryable: false, httpStatus: 403, type: "AUTH_ERROR" });
  if (status === 429) return new RankProviderError("Rate limit reached. Retry scheduled.", { retryable: true, httpStatus: 429, type: "API_LIMIT" });
  if (status >= 500) return new RankProviderError("Provider server error.", { retryable: true, httpStatus: status, type: "API_ERROR" });
  return new RankProviderError(`Provider error (HTTP ${status}).`, { retryable: false, httpStatus: status, type: "API_ERROR" });
}

function buildResult(
  input: RankCheckInput,
  provider: string,
  matches: RankMatch[],
): RankResult {
  matches.sort((a, b) => a.rank - b.rank);
  const best = matches[0] ?? null;
  return {
    keyword: input.keyword,
    rank: best ? best.rank : null,
    rankingUrl: best ? best.url : null,
    rankingTitle: best?.title ?? null,
    allUrls: matches,
    searchEngine: "google",
    country: input.country,
    device: input.device,
    checkedAt: new Date().toISOString(),
    found: !!best,
    provider,
    error: null,
  };
}

// ── SerpApi ──────────────────────────────────────────────────────────────
class SerpApiProvider implements RankProviderInterface {
  readonly name = "serpapi";
  constructor(private apiKey: string, private endpoint?: string | null) {}

  async checkKeywordRank(input: RankCheckInput): Promise<RankResult> {
    const base = this.endpoint || "https://serpapi.com/search.json";
    const params = new URLSearchParams({
      engine: "google",
      q: input.keyword,
      gl: input.country,
      hl: input.language,
      num: String(Math.min(Math.max(input.depth, 10), 100)),
      device: input.device.toLowerCase(),
      api_key: this.apiKey,
    });
    const { status, json } = await fetchJson(`${base}?${params.toString()}`, { method: "GET" });
    if (status !== 200) throw httpError(status);
    const data = json as { error?: string; organic_results?: { position?: number; link?: string; title?: string }[] };
    if (data.error) {
      throw new RankProviderError(String(data.error), { retryable: /rate|limit|run out/i.test(data.error), type: "API_ERROR" });
    }
    const matches: RankMatch[] = [];
    for (const r of data.organic_results ?? []) {
      if (!r.link || typeof r.position !== "number") continue;
      if (urlMatchesDomain(r.link, input.domain)) matches.push({ url: r.link, rank: r.position, title: r.title });
    }
    return buildResult(input, this.name, matches);
  }

  async checkBulkKeywords(inputs: RankCheckInput[]): Promise<RankResult[]> {
    return Promise.all(inputs.map((i) => this.checkKeywordRank(i)));
  }
}

// ── DataForSEO ─────────────────────────────────────────────────────────────
const COUNTRY_TO_LOCATION: Record<string, string> = {
  in: "India", us: "United States", gb: "United Kingdom", ca: "Canada",
  au: "Australia", de: "Germany", fr: "France", sg: "Singapore",
  ae: "United Arab Emirates", np: "Nepal", bd: "Bangladesh", pk: "Pakistan",
};

class DataForSeoProvider implements RankProviderInterface {
  readonly name = "dataforseo";
  constructor(private login: string, private password: string, private endpoint?: string | null) {}

  async checkKeywordRank(input: RankCheckInput): Promise<RankResult> {
    const base = this.endpoint || "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";
    const auth = Buffer.from(`${this.login}:${this.password}`).toString("base64");
    const body = [
      {
        keyword: input.keyword,
        language_code: input.language,
        location_name: COUNTRY_TO_LOCATION[input.country] ?? "United States",
        device: input.device.toLowerCase(),
        depth: Math.min(Math.max(input.depth, 10), 100),
      },
    ];
    const { status, json } = await fetchJson(base, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (status !== 200) throw httpError(status);
    const data = json as {
      status_code?: number;
      tasks?: {
        status_code?: number;
        status_message?: string;
        result?: { items?: { type?: string; rank_absolute?: number; url?: string; title?: string }[] }[];
      }[];
    };
    const task = data.tasks?.[0];
    if (!task || (task.status_code && task.status_code >= 40000)) {
      const msg = task?.status_message || "Provider error.";
      const retryable = task?.status_code === 40202 || /rate|limit|queue/i.test(msg);
      throw new RankProviderError(msg, { retryable, type: "API_ERROR" });
    }
    const items = task.result?.[0]?.items ?? [];
    const matches: RankMatch[] = [];
    for (const it of items) {
      if (it.type !== "organic" || !it.url || typeof it.rank_absolute !== "number") continue;
      if (urlMatchesDomain(it.url, input.domain)) matches.push({ url: it.url, rank: it.rank_absolute, title: it.title });
    }
    return buildResult(input, this.name, matches);
  }

  async checkBulkKeywords(inputs: RankCheckInput[]): Promise<RankResult[]> {
    // Sequential to respect rate limits; the queue also paces requests.
    const out: RankResult[] = [];
    for (const i of inputs) out.push(await this.checkKeywordRank(i));
    return out;
  }
}

export type ProviderConfig = {
  provider: string;
  requestsPerMinute: number;
  batchSize: number;
  requestDelayMs: number;
  maxRetries: number;
  dailyQuota: number | null;
};

/** Load the saved provider config (safe defaults if the row doesn't exist). */
export async function getProviderConfig(): Promise<ProviderConfig> {
  const row = await prisma.rankProviderConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  return {
    provider: row?.provider ?? "none",
    requestsPerMinute: row?.requestsPerMinute ?? 30,
    batchSize: row?.batchSize ?? 10,
    requestDelayMs: row?.requestDelayMs ?? 1200,
    maxRetries: row?.maxRetries ?? 3,
    dailyQuota: row?.dailyQuota ?? null,
  };
}

/**
 * Build the configured provider, or return null when none is set up.
 * Reads keys from the DB config first, then falls back to env vars so the tool
 * works either way. NEVER returns a fake/stub provider.
 */
export async function getRankProvider(): Promise<RankProviderInterface | null> {
  const row = await prisma.rankProviderConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  const provider = row?.provider ?? process.env.RANK_PROVIDER ?? "none";
  if (!provider || provider === "none") return null;

  const apiKey = decryptSecret(row?.apiKeyEnc) ?? process.env.RANK_API_KEY ?? "";
  const apiSecret = decryptSecret(row?.apiSecretEnc) ?? process.env.RANK_API_SECRET ?? "";
  const endpoint = row?.endpoint ?? null;

  if (provider === "serpapi") {
    if (!apiKey) return null;
    return new SerpApiProvider(apiKey, endpoint);
  }
  if (provider === "dataforseo") {
    if (!apiKey || !apiSecret) return null;
    return new DataForSeoProvider(apiKey, apiSecret, endpoint);
  }
  return null;
}
