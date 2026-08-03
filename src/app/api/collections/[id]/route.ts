import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { collectionSchema } from "@/lib/validations";

type Params = Promise<{ id: string }>;

async function ownedCollection(id: string, userId: string) {
  const c = await prisma.collection.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!c || c.userId !== userId) return null;
  return c;
}

/** Edit a collection (name, description, visibility). Owner only. */
export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedCollection(id, user.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = collectionSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, description, isPublic } = parsed.data;
  await prisma.collection.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(isPublic !== undefined ? { isPublic } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

/** Delete a collection. Owner only. */
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedCollection(id, user.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
