import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { reportSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

type Params = Promise<{ slug: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  const rl = await rateLimit(`report:${user?.id ?? getClientIp(req)}`, 5, 3600);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { slug } = await params;
  const tool = await prisma.tool.findUnique({ where: { slug }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid report" }, { status: 400 });

  await prisma.report.create({
    data: {
      toolId: tool.id,
      userId: user?.id ?? null,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
