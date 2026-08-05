import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { DealCard } from "@/components/deals/deal-card";
import { getActiveDeals } from "@/lib/data/deals";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Software Deals & Discounts",
  description:
    "Hand-picked deals, discounts, coupon codes and lifetime offers on the best software, SaaS and AI tools — updated regularly on AlternativeHub.",
  path: "/deals",
  keywords: ["software deals", "saas discounts", "coupon codes", "lifetime deals", "app offers"],
});

export default async function DealsPage() {
  const deals = await getActiveDeals(new Date());
  const featured = deals.filter((d) => d.featured);
  const rest = deals.filter((d) => !d.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Deals", path: "/deals" }]} />

      <div className="mt-4 max-w-2xl">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Tag className="size-7 text-primary" /> Deals &amp; Discounts
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save on the software you love — hand-picked discounts, coupon codes and lifetime offers
          across SaaS, AI tools and apps.
        </p>
      </div>

      {deals.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No active deals right now — check back soon, we add new offers regularly.
        </p>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">Featured</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((d) => (
                  <DealCard key={d.id} deal={d} />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="mt-10">
              {featured.length > 0 && (
                <h2 className="text-lg font-semibold tracking-tight">All deals</h2>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((d) => (
                  <DealCard key={d.id} deal={d} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
