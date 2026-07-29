import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";

type Params = Promise<{ slug: string }>;

async function getTool(slug: string) {
  return prisma.tool.findUnique({ where: { slug }, select: { id: true } });
}

export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.bookmark.upsert({
    where: { toolId_userId: { toolId: tool.id, userId: user.id } },
    create: { toolId: tool.id, userId: user.id },
    update: {},
  });
  await prisma.tool.update({
    where: { id: tool.id },
    data: { bookmarkCount: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.bookmark
    .delete({ where: { toolId_userId: { toolId: tool.id, userId: user.id } } })
    .catch(() => {});
  await prisma.tool.update({
    where: { id: tool.id },
    data: { bookmarkCount: { decrement: 1 } },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
