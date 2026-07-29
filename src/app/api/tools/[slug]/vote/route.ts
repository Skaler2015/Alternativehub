import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { voteSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { recomputeToolScores } from "@/lib/automation";
import { invalidate, CACHE_KEYS } from "@/lib/cache";

type Params = Promise<{ slug: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`vote:${user.id}`, 30, 60);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { slug } = await params;
  const tool = await prisma.tool.findUnique({ where: { slug }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid vote" }, { status: 400 });

  const existing = await prisma.vote.findUnique({
    where: { toolId_userId: { toolId: tool.id, userId: user.id } },
  });

  if (existing?.type === parsed.data.type) {
    // Toggle off
    await prisma.vote.delete({
      where: { toolId_userId: { toolId: tool.id, userId: user.id } },
    });
  } else {
    await prisma.vote.upsert({
      where: { toolId_userId: { toolId: tool.id, userId: user.id } },
      create: { toolId: tool.id, userId: user.id, type: parsed.data.type },
      update: { type: parsed.data.type },
    });
  }

  await recomputeToolScores(tool.id);
  await invalidate(CACHE_KEYS.tool(slug));

  return NextResponse.json({ ok: true });
}
