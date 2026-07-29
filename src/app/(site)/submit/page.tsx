import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { SubmitForm } from "@/components/tools/submit-form";
import { getCategories } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Submit a Tool",
  description:
    "Submit an app, website, AI tool or software to AlternativeHub. Our AI enriches every listing with summaries, pros & cons and alternatives.",
  path: "/submit",
});

export default async function SubmitPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Submit", path: "/submit" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Submit a Tool</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Know a great tool that&apos;s missing? Submit it below. After a quick review, our AI
        enriches the listing with a summary, pros & cons, tags and alternatives — then it goes
        live.
      </p>
      <div className="mt-8">
        <SubmitForm categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      </div>
    </div>
  );
}
