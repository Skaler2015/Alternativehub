import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  apiOk,
  apiError,
  apiOptions,
  publicToolSelect,
  serializeTool,
  clampInt,
} from "@/lib/api/public";

export const dynamic = "force-dynamic";

const PRICING = new Set([
  "FREE",
  "FREEMIUM",
  "PAID",
  "SUBSCRIPTION",
  "ONE_TIME",
  "OPEN_SOURCE",
  "CONTACT",
]);

const SORTS: Record<string, Prisma.ToolOrderByWithRelationInput[]> = {
  popular: [{ popularityScore: "desc" }, { upvotes: "desc" }],
  top_rated: [{ rating: "desc" }, { reviewCount: "desc" }],
  newest: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  name: [{ name: "asc" }],
};

export function OPTIONS() {
  return apiOptions();
}

/**
 * GET /api/v1/tools
 * Query: q, category (slug), pricing, sort (popular|top_rated|newest|name),
 *        page (1-based), limit (1-50)
 */
export async function GET(req: Request) {
  const rl = await rateLimit(`api-v1:${getClientIp(req)}`, 120, 60);
  if (!rl.success) return apiError(429, "Rate limit exceeded");

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().slice(0, 100) || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const pricingRaw = searchParams.get("pricing")?.trim().toUpperCase();
  const pricing = pricingRaw && PRICING.has(pricingRaw) ? pricingRaw : undefined;
  const sortKey = searchParams.get("sort")?.trim() ?? "popular";
  const orderBy = SORTS[sortKey] ?? SORTS.popular;
  const limit = clampInt(searchParams.get("limit"), 20, 1, 50);
  const page = clampInt(searchParams.get("page"), 1, 1, 10000);

  const where: Prisma.ToolWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    ...(category ? { category: { slug: category } } : {}),
    ...(pricing ? { pricingModel: pricing as Prisma.ToolWhereInput["pricingModel"] } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { tagline: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [total, tools] = await Promise.all([
      prisma.tool.count({ where }),
      prisma.tool.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: publicToolSelect,
      }),
    ]);

    return apiOk({
      data: tools.map(serializeTool),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: page * limit < total,
      },
    });
  } catch {
    return apiError(500, "Internal error");
  }
}
