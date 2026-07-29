import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { listBlogPosts } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Blog — Guides, Top Lists & Comparisons",
  description:
    "Software guides, top lists, buying guides, tutorials and in-depth comparisons from the AlternativeHub team.",
  path: "/blog",
});

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "News",
  TOP_LISTS: "Top Lists",
  COMPARISONS: "Comparisons",
  BUYING_GUIDES: "Buying Guides",
  TUTORIALS: "Tutorials",
};

export default async function BlogIndexPage() {
  const posts = await listBlogPosts(30);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Blog</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Guides, top lists and comparisons to help you pick better tools
      </p>

      {posts.length === 0 ? (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No posts yet — the first stories are on their way.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {CATEGORY_LABELS[post.category] ?? post.category}
              </span>
              <h2 className="mt-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                {post.author?.name ?? "AlternativeHub"}
                {post.publishedAt && ` · ${formatDate(post.publishedAt)}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
