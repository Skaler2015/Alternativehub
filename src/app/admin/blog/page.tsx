import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { BlogDeleteButton } from "@/components/admin/blog-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost
    .findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, slug: true, title: true, category: true, published: true, createdAt: true, viewCount: true } })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">{posts.length} posts</p>
        </div>
        <Button asChild size="sm"><Link href="/admin/blog/new"><Plus className="size-4" /> New post</Link></Button>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No posts yet. Write your first article — great for SEO traffic.
        </p>
      ) : (
        <div className="divide-y rounded-2xl border bg-card">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.title}</span>
                  <Badge variant={p.published ? "success" : "secondary"}>{p.published ? "published" : "draft"}</Badge>
                  <Badge variant="outline">{p.category.replace(/_/g, " ").toLowerCase()}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Added {timeAgo(p.createdAt)} · {p.viewCount} views</p>
              </div>
              <div className="flex items-center gap-2">
                {p.published && (
                  <Button asChild variant="ghost" size="icon-sm"><Link href={`/blog/${p.slug}`} target="_blank"><ExternalLink className="size-4" /></Link></Button>
                )}
                <Button asChild variant="outline" size="sm" className="gap-1"><Link href={`/admin/blog/${p.id}/edit`}><Pencil className="size-3.5" /> Edit</Link></Button>
                <BlogDeleteButton id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
