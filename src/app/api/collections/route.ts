import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { collectionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "collection";

/** List the current user's collections. With ?toolId, flag which ones contain it. */
export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const toolId = new URL(req.url).searchParams.get("toolId") ?? undefined;
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, name: true, isPublic: true,
      _count: { select: { items: true } },
      ...(toolId ? { items: { where: { toolId }, select: { toolId: true } } } : {}),
    },
  });

  return NextResponse.json({
    collections: collections.map((c) => ({
      id: c.id, slug: c.slug, name: c.name, isPublic: c.isPublic,
      count: c._count.items,
      contains: toolId ? (c as { items?: unknown[] }).items!.length > 0 : undefined,
    })),
  });
}

/** Create a collection. */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`collection:${user.id}`, 30, 3600);
  if (!rl.success) return NextResponse.json({ error: "Too many collections — slow down" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, description, isPublic } = parsed.data;

  // Ensure a unique slug per user.
  const base = slugify(name);
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const clash = await prisma.collection.findUnique({ where: { userId_slug: { userId: user.id, slug } }, select: { id: true } });
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const collection = await prisma.collection.create({
    data: { userId: user.id, name, slug, description: description || null, isPublic: isPublic ?? false },
    select: { id: true, slug: true },
  });

  return NextResponse.json({ ok: true, id: collection.id, slug: collection.slug }, { status: 201 });
}
