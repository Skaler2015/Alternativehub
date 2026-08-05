import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { apiOk, apiError, apiOptions } from "@/lib/api/public";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

/** GET /api/v1/categories — all categories with published-tool counts. */
export async function GET(req: Request) {
  const rl = await rateLimit(`api-v1:${getClientIp(req)}`, 120, 60);
  if (!rl.success) return apiError(429, "Rate limit exceeded");

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        description: true,
        parent: { select: { slug: true } },
        _count: {
          select: { tools: { where: { status: "PUBLISHED", deletedAt: null } } },
        },
      },
    });

    return apiOk({
      data: categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        parentSlug: c.parent?.slug ?? null,
        toolCount: c._count.tools,
        url: `${SITE.url}/categories/${c.slug}`,
      })),
    });
  } catch {
    return apiError(500, "Internal error");
  }
}
