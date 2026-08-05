import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { SITE } from "@/lib/constants";

/**
 * Public Developer API (v1) helpers.
 *
 * The v1 API is read-only, unauthenticated, CORS-enabled and rate-limited.
 * It exposes ONLY public, already-crawlable data — never internal scores,
 * submitter ids, or moderation fields — so it can be safely called from any
 * origin, including the browser.
 */

/** CORS headers for a public, read-only, cross-origin JSON API. */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** Standard cache policy for public API responses (CDN-friendly). */
const CACHE = "public, s-maxage=300, stale-while-revalidate=600";

/** A successful JSON response with CORS + cache headers. */
export function apiOk(body: unknown, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    headers: { ...CORS_HEADERS, "Cache-Control": CACHE, ...extraHeaders },
  });
}

/** A JSON error response with CORS headers. */
export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

/** Preflight / OPTIONS handler shared by every v1 route. */
export function apiOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The Prisma select that backs every public tool payload. */
export const publicToolSelect = {
  slug: true,
  name: true,
  tagline: true,
  description: true,
  websiteUrl: true,
  logoUrl: true,
  videoUrl: true,
  pricingModel: true,
  rating: true,
  reviewCount: true,
  upvotes: true,
  verified: true,
  isOpenSource: true,
  featured: true,
  pros: true,
  cons: true,
  useCases: true,
  integrations: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { slug: true, name: true } },
  platforms: { select: { platform: { select: { slug: true, name: true } } } },
  tags: { select: { tag: { select: { slug: true, name: true } } } },
} satisfies Prisma.ToolSelect;

type PublicTool = Prisma.ToolGetPayload<{ select: typeof publicToolSelect }>;

/** Shape a tool row into the stable public API JSON contract. */
export function serializeTool(t: PublicTool) {
  return {
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    description: t.description,
    url: `${SITE.url}/tools/${t.slug}`,
    websiteUrl: t.websiteUrl,
    logoUrl: t.logoUrl,
    videoUrl: t.videoUrl,
    pricing: t.pricingModel,
    rating: t.rating,
    reviewCount: t.reviewCount,
    upvotes: t.upvotes,
    verified: t.verified,
    openSource: t.isOpenSource,
    featured: t.featured,
    pros: t.pros,
    cons: t.cons,
    useCases: t.useCases,
    integrations: t.integrations,
    category: t.category ? { slug: t.category.slug, name: t.category.name } : null,
    platforms: t.platforms.map((p) => ({ slug: p.platform.slug, name: p.platform.name })),
    tags: t.tags.map((x) => ({ slug: x.tag.slug, name: x.tag.name })),
    publishedAt: t.publishedAt,
    updatedAt: t.updatedAt,
  };
}

/** Clamp a numeric query param into a range with a default. */
export function clampInt(raw: string | null, def: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}
