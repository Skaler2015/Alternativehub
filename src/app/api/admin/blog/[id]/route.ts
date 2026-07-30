import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { blogWriteSchema } from "@/lib/validations";
import { invalidate, CACHE_KEYS } from "@/lib/cache";

type Params = Promise<{ id: string }>;

/** Edit a blog post. */
export async function PUT(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, slug: true, publishedAt: true, published: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = blogWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  if (d.slug !== existing.slug) {
    const clash = await prisma.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (clash) return NextResponse.json({ error: "Another post already uses this slug" }, { status: 409 });
  }

  const willPublish = d.published ?? existing.published;
  await prisma.blogPost.update({
    where: { id },
    data: {
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      coverUrl: d.coverUrl || null,
      category: d.category,
      published: willPublish,
      publishedAt: willPublish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      seoTitle: d.seoTitle || null,
      seoDesc: d.seoDesc || null,
      keywords: d.keywords ?? [],
    },
  });

  await logActivity({ userId: user.id, action: "blog.edit", entity: "BlogPost", entityId: id, meta: { title: d.title } });
  await invalidate(CACHE_KEYS.home).catch(() => {});

  return NextResponse.json({ ok: true, slug: d.slug });
}

/** Delete a blog post. */
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } }).catch(() => null);
  await logActivity({ userId: user.id, action: "blog.delete", entity: "BlogPost", entityId: id });
  await invalidate(CACHE_KEYS.home).catch(() => {});
  return NextResponse.json({ ok: true });
}
