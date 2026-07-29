import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getBlogPost } from "@/lib/data/queries";
import { articleJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

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

/** Minimal markdown → HTML: headings, bold, links, lists, paragraphs. */
function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = esc(md).split("\n");
  const html: string[] = [];
  let inList = false;

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (trimmed.startsWith("### ")) html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
    else if (trimmed.startsWith("## ")) html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
    else if (trimmed.startsWith("# ")) html.push(`<h2>${inline(trimmed.slice(2))}</h2>`);
    else if (trimmed) html.push(`<p>${inline(trimmed)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          excerpt: post.excerpt,
          slug: post.slug,
          coverUrl: post.coverUrl,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: post.author?.name,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <header className="mt-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {post.category.replace("_", " ")}
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          {post.author?.name ?? "AlternativeHub"}
          {post.publishedAt && ` · ${formatDate(post.publishedAt)}`}
          {post.aiGenerated && " · AI-assisted"}
        </p>
      </header>

      <div
        className="prose-custom mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
    </article>
  );
}
