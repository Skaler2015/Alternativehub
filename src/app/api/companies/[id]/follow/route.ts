import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";

type Params = Promise<{ id: string }>;

/** Follow a company. */
export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`cfollow:${user.id}`, 60, 3600);
  if (!rl.success) return NextResponse.json({ error: "Slow down" }, { status: 429 });

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.companyFollow.upsert({
    where: { userId_companyId: { userId: user.id, companyId: id } },
    create: { userId: user.id, companyId: id },
    update: {},
  });
  const followers = await prisma.companyFollow.count({ where: { companyId: id } });
  return NextResponse.json({ ok: true, following: true, followers }, { status: 201 });
}

/** Unfollow a company. */
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  await prisma.companyFollow
    .delete({ where: { userId_companyId: { userId: user.id, companyId: id } } })
    .catch(() => null);
  const followers = await prisma.companyFollow.count({ where: { companyId: id } });
  return NextResponse.json({ ok: true, following: false, followers });
}
