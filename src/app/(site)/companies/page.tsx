import Link from "next/link";
import type { Metadata } from "next";
import { Building2, BadgeCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Companies — Software Makers & Developers",
  description: "Browse the companies behind the software on AlternativeHub — explore their tools, profiles and alternatives.",
  path: "/companies",
});

export default async function CompaniesPage() {
  const companies = await prisma.company
    .findMany({
      where: { tools: { some: { status: "PUBLISHED", deletedAt: null } } },
      orderBy: { tools: { _count: "desc" } },
      take: 90,
      select: {
        id: true, slug: true, name: true, logoUrl: true, description: true, claimVerified: true,
        _count: { select: { tools: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Companies", path: "/companies" }]} />

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-primary"><Building2 className="size-6" /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Companies</h1>
          <p className="text-sm text-muted-foreground">The makers behind the tools</p>
        </div>
      </div>

      {companies.length === 0 ? (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">No companies yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.slug}`} className="group flex items-start gap-3 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg">
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
                {c.logoUrl ? <img src={c.logoUrl} alt="" className="size-full object-contain p-1.5" /> : <span className="text-sm font-semibold">{getInitials(c.name)}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 font-semibold transition-colors group-hover:text-primary">
                  <span className="truncate">{c.name}</span>
                  {c.claimVerified && <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-white" />}
                </p>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                <p className="mt-1.5 text-xs text-muted-foreground">{c._count.tools} tool{c._count.tools === 1 ? "" : "s"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
