import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { collectionItemSchema } from "@/lib/validations";

type Params = Promise<{ id: string }>;

async function ownedCollection(id: string, userId: string) {
  const c = await prisma.collection.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!c || c.userId !== userId) return null;
  return c;
}

/** Add a tool to a collection. */
export async function POST(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedCollection(id, user.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = collectionItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const tool = await prisma.tool.findUnique({ where: { id: parsed.data.toolId }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  await prisma.collectionItem.upsert({
    where: { collectionId_toolId: { collectionId: id, toolId: tool.id } },
    create: { collectionId: id, toolId: tool.id, note: parsed.data.note ?? null },
    update: { note: parsed.data.note ?? null },
  });
  return NextResponse.json({ ok: true, added: true }, { status: 201 });
}

/** Remove a tool from a collection. */
export async function DELETE(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedCollection(id, user.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = collectionItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.collectionItem
    .delete({ where: { collectionId_toolId: { collectionId: id, toolId: parsed.data.toolId } } })
    .catch(() => null);
  return NextResponse.json({ ok: true, added: false });
}
