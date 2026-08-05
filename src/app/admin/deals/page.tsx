import type { Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { getAllDealsForAdmin } from "@/lib/data/deals";
import { DealManager } from "@/components/admin/deal-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Deals", robots: { index: false, follow: false } };

export default async function AdminDealsPage() {
  await requireRole("ADMIN", "MODERATOR");
  const deals = await getAllDealsForAdmin();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deals &amp; Discounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage promotional offers shown on tool pages and the public deals page.
        </p>
      </div>
      <DealManager deals={deals} />
    </div>
  );
}
