import Link from "next/link";
import type { Metadata } from "next";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getCategories } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "All Categories — Apps, AI Tools, Software & More",
  description:
    "Explore every category on AlternativeHub: apps, websites, AI tools, desktop software, games, browser extensions, SaaS, developer tools and more.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find alternatives across every kind of software and service
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => {
          const Icon =
            ((category.icon &&
              (Icons as unknown as Record<string, LucideIcon>)[category.icon]) as LucideIcon) ||
            Icons.Box;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex items-start gap-4 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg"
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${category.color ?? "#6366f1"}1a`,
                  color: category.color ?? "#6366f1",
                }}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold transition-colors group-hover:text-primary">
                  {category.name}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {category.description}
                </p>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                  {category._count.tools} tools
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
