import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { reviewSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { recomputeToolScores } from "@/lib/automation";
import { recomputeUserReputation } from "@/lib/community";
import { invalidate, CACHE_KEYS } from "@/lib/cache";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const tool = await prisma.tool.findUnique({ where: { slug }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { toolId: tool.id, approved: true },
    orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: { user: { select: { name: true, image: true } } },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`review:${user.id}`, 10, 3600);
  if (!rl.success) return NextResponse.json({ error: "Too many reviews — slow down" }, { status: 429 });

  const { slug } = await params;
  const tool = await prisma.tool.findUnique({ where: { slug }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const review = await prisma.review.upsert({
    where: { toolId_userId: { toolId: tool.id, userId: user.id } },
    create: { toolId: tool.id, userId: user.id, ...parsed.data },
    update: { ...parsed.data },
  });

  await recomputeToolScores(tool.id);
  await recomputeUserReputation(user.id).catch(() => {});
  await invalidate(CACHE_KEYS.tool(slug), CACHE_KEYS.home);

  return NextResponse.json({ ok: true, id: review.id }, { status: 201 });
}
