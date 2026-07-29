import Link from "next/link";
import * as Icons from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import type { LucideIcon } from "lucide-react";

type CategoryItem = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  _count: { tools: number };
};

function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && (Icons as unknown as Record<string, LucideIcon>)[name]) || Icons.Box;
  return <Icon className={className} />;
}

export function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  if (categories.length === 0) return null;

  return (
    <FadeIn>
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Popular Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore alternatives across every kind of software
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.slice(0, 14).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow"
            >
              <span
                className="flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${category.color ?? "#6366f1"}1a`,
                  color: category.color ?? "#6366f1",
                }}
              >
                <CategoryIcon name={category.icon} className="size-5" />
              </span>
              <span className="text-xs font-medium leading-tight">{category.name}</span>
              <span className="text-[10px] text-muted-foreground">{category._count.tools} tools</span>
            </Link>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
