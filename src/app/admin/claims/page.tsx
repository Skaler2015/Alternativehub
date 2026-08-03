import Link from "next/link";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ClaimActions } from "@/components/admin/claim-actions";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const claims = await prisma.company
    .findMany({
      where: { claimedById: { not: null } },
      orderBy: [{ claimVerified: "asc" }, { claimedAt: "desc" }],
      take: 100,
      select: {
        id: true, slug: true, name: true, claimVerified: true, claimedAt: true,
        claimedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { tools: true } },
      },
    })
    .catch(() => []);

  const pending = claims.filter((c) => !c.claimVerified);
  const verified = claims.filter((c) => c.claimVerified);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><ShieldCheck className="size-6 text-primary" /> Company Claims</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verify or reject company ownership claims</p>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 font-semibold"><Clock className="size-4 text-amber-500" /> Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No pending claims.</p>
        ) : (
          <div className="divide-y rounded-2xl border bg-card">
            {pending.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/companies/${c.slug}`} className="font-medium hover:text-primary">{c.name}</Link>
                  <p className="text-xs text-muted-foreground">
                    {c._count.tools} tools · claimed by {c.claimedBy?.name ?? "—"} ({c.claimedBy?.email}) {c.claimedAt && `· ${timeAgo(c.claimedAt)}`}
                  </p>
                </div>
                <ClaimActions companyId={c.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 font-semibold"><BadgeCheck className="size-4 text-sky-500" /> Verified ({verified.length})</h2>
        {verified.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No verified companies yet.</p>
        ) : (
          <div className="divide-y rounded-2xl border bg-card">
            {verified.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/companies/${c.slug}`} className="font-medium hover:text-primary">{c.name}</Link>
                  <p className="text-xs text-muted-foreground">owned by {c.claimedBy?.name ?? "—"} ({c.claimedBy?.email})</p>
                </div>
                <ClaimActions companyId={c.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
