import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, List } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareButtons } from "@/components/blog/share-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { getBlogPost, getRelatedPosts } from "@/lib/data/queries";
import { articleJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate, getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDesc ?? post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverUrl ?? undefined,
    keywords: post.keywords,
  });
}

const slugifyHeading = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);

/** Minimal markdown → HTML with heading anchors + a table of contents. */
function renderMarkdown(md: string): { html: string; toc: { id: string; text: string; level: number }[] } {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = esc(md).split("\n");
  const html: string[] = [];
  const toc: { id: string; text: string; level: number }[] = [];
  let inList = false;

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');

  const heading = (text: string, level: number) => {
    const id = slugifyHeading(text);
    toc.push({ id, text, level });
    html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }
    if (inList) { html.push("</ul>"); inList = false; }
    if (trimmed.startsWith("### ")) heading(trimmed.slice(4), 3);
    else if (trimmed.startsWith("## ")) heading(trimmed.slice(3), 2);
    else if (trimmed.startsWith("# ")) heading(trimmed.slice(2), 2);
    else if (trimmed) html.push(`<p>${inline(trimmed)}</p>`);
  }
  if (inList) html.push("</ul>");
  return { html: html.join("\n"), toc };
}

function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.slug);
  const { html, toc } = renderMarkdown(post.content);
  const minutes = readingTime(post.content);

  // Fire-and-forget view bump
  void prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd
        data={articleJsonLd({
          title: post.title, excerpt: post.excerpt, slug: post.slug, coverUrl: post.coverUrl,
          publishedAt: post.publishedAt, updatedAt: post.updatedAt, author: post.author?.name,
        })}
      />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]} />

      <div className="mt-6 flex flex-col gap-10 lg:flex-row">
        <article className="min-w-0 max-w-3xl flex-1">
          <header>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{post.category.replace(/_/g, " ")}</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="mt-3 text-muted-foreground">{post.excerpt}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8"><AvatarImage src={post.author?.image ?? undefined} /><AvatarFallback>{getInitials(post.author?.name ?? "A")}</AvatarFallback></Avatar>
                <div className="text-xs">
                  <p className="font-medium">{post.author?.name ?? "AlternativeHub"}</p>
                  <p className="text-muted-foreground">
                    {post.publishedAt && formatDate(post.publishedAt)} · <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {minutes} min read</span>
                    {post.aiGenerated && " · AI-assisted"}
                  </p>
                </div>
              </div>
              <ShareButtons title={post.title} />
            </div>
          </header>

          {post.coverUrl && (
            <img src={post.coverUrl} alt="" className="mt-6 aspect-[16/9] w-full rounded-2xl border object-cover" />
          )}

          {/* Mobile TOC */}
          {toc.length > 2 && (
            <details className="mt-6 rounded-2xl border bg-card p-4 lg:hidden">
              <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold"><List className="size-4" /> Contents</summary>
              <ul className="mt-3 space-y-1.5 text-sm">
                {toc.map((h) => <li key={h.id} className={h.level === 3 ? "ml-4" : ""}><a href={`#${h.id}`} className="text-muted-foreground hover:text-primary">{h.text}</a></li>)}
              </ul>
            </details>
          )}

          <div
            className="prose-custom mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12 border-t pt-8">
              <h2 className="mb-4 text-lg font-semibold">Related articles</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="group rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{r.category.replace(/_/g, " ")}</span>
                    <h3 className="mt-1.5 line-clamp-2 font-medium leading-snug transition-colors group-hover:text-primary">{r.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Desktop sticky TOC */}
        {toc.length > 2 && (
          <aside className="hidden lg:block lg:w-56 lg:shrink-0">
            <div className="sticky top-20">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><List className="size-3.5" /> On this page</p>
              <ul className="space-y-1.5 border-l text-sm">
                {toc.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "ml-3" : ""}>
                    <a href={`#${h.id}`} className="-ml-px block border-l border-transparent pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary">{h.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
