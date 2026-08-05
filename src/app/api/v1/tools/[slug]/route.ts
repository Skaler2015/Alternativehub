import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  apiOk,
  apiError,
  apiOptions,
  publicToolSelect,
  serializeTool,
} from "@/lib/api/public";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

/** GET /api/v1/tools/{slug} — a single published tool. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = await rateLimit(`api-v1:${getClientIp(req)}`, 120, 60);
  if (!rl.success) return apiError(429, "Rate limit exceeded");

  const { slug } = await params;
  try {
    const tool = await prisma.tool.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      select: publicToolSelect,
    });
    if (!tool) return apiError(404, "Tool not found");
    return apiOk({ data: serializeTool(tool) });
  } catch {
    return apiError(500, "Internal error");
  }
}
