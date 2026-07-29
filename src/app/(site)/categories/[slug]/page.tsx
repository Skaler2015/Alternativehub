import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, listTools } from "@/lib/data/queries";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ sort?: string; page?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return buildMetadata({
    title: category.seoTitle ?? `Best ${category.name} — Top Tools & Alternatives`,
    description:
      category.seoDesc ??
      `Discover the best ${category.name.toLowerCase()} of ${new Date().getFullYear()}. Compare ${category._count.tools}+ tools by rating, pricing and features on AlternativeHub.`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Number(sp.page) || 1;
  const { tools, total, pageSize } = await listTools({
    categorySlug: slug,
    sort: sp.sort,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          tools.map((t) => ({ name: t.name, path: `/tools/${t.slug}` })),
          `Best ${category.name}`,
        )}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ]}
      />

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        Best {category.name}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {category.description ?? `The top ${category.name.toLowerCase()} ranked by the community.`}{" "}
        {total} tools listed.
      </p>

      {category.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/categories/${slug}?sort=${opt.value}`}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              (sp.sort ?? "popular") === opt.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {tools.length === 0 ? (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No tools in this category yet.{" "}
          <Link href="/submit" className="text-primary hover:underline">
            Submit the first one →
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/categories/${slug}?page=${page - 1}`}>← Previous</Link>
            </Button>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/categories/${slug}?page=${page + 1}`}>Next →</Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
