import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditBlogPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const initial = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverUrl: post.coverUrl ?? "",
    category: post.category,
    published: post.published,
    seoTitle: post.seoTitle ?? "",
    seoDesc: post.seoDesc ?? "",
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Blog
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit post</h1>
      </div>
      <BlogForm initial={initial} />
    </div>
  );
}
