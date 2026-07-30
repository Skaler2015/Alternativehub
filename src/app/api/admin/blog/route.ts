import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { blogWriteSchema } from "@/lib/validations";
import { invalidate, CACHE_KEYS } from "@/lib/cache";

/** Create a blog post. */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = blogWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const clash = await prisma.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } });
  if (clash) return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });

  const post = await prisma.blogPost.create({
    data: {
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      coverUrl: d.coverUrl || null,
      category: d.category,
      published: d.published ?? false,
      publishedAt: d.published ? new Date() : null,
      seoTitle: d.seoTitle || null,
      seoDesc: d.seoDesc || null,
      keywords: d.keywords ?? [],
      authorId: user.id,
    },
  });

  await logActivity({ userId: user.id, action: "blog.create", entity: "BlogPost", entityId: post.id, meta: { title: post.title } });
  await invalidate(CACHE_KEYS.home).catch(() => {});

  return NextResponse.json({ ok: true, id: post.id, slug: post.slug }, { status: 201 });
}
