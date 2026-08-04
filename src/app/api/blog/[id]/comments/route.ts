import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { blogCommentSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

/** List comments for a post. */
export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const comments = await prisma.blogComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, body: true, createdAt: true, user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json({ comments });
}

/** Post a comment. */
export async function POST(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`comment:${user.id}`, 20, 3600);
  if (!rl.success) return NextResponse.json({ error: "Too many comments — slow down" }, { status: 429 });

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, slug: true, title: true, authorId: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = blogCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const comment = await prisma.blogComment.create({
    data: { postId: id, userId: user.id, body: parsed.data.body },
    select: { id: true, body: true, createdAt: true, user: { select: { id: true, name: true, image: true } } },
  });

  if (post.authorId && post.authorId !== user.id) {
    void notify({
      userId: post.authorId,
      type: "SYSTEM",
      title: `New comment on “${post.title}”`,
      body: parsed.data.body.slice(0, 140),
      link: `/blog/${post.slug}#comments`,
    });
  }

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
