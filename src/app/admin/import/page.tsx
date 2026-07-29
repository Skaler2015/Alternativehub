import { CsvImport } from "@/components/admin/csv-import";
import { requireRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Paste CSV rows to import tools in bulk. Columns:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            name,websiteUrl,description,categorySlug,pricingModel
          </code>
          . Each imported tool is automatically enriched: metadata scrape, logo fetch, AI summary,
          pros/cons, tags, FAQs, SEO fields, duplicate detection and alternative linking.
        </p>
      </div>
      <CsvImport />
    </div>
  );
}
