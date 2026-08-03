import Link from "next/link";
import type { Metadata } from "next";
import { Building2, BadgeCheck, Clock, ExternalLink, Eye } from "lucide-react";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { CompanyEditForm } from "@/components/company/company-edit-form";
import { MiniBarChart } from "@/components/admin/mini-bar-chart";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Company Dashboard", robots: { index: false, follow: false } };

export default async function CompanyDashboardPage() {
  const user = await requireUser();
  const company = await prisma.company.findFirst({
    where: { claimedById: user.id },
    select: {
      id: true, slug: true, name: true, description: true, websiteUrl: true, logoUrl: true,
      country: true, foundedYear: true, founder: true, employees: true, funding: true,
      claimVerified: true, claimedAt: true,
      _count: { select: { followers: true } },
      tools: {
        where: { deletedAt: null },
        orderBy: { viewCount: "desc" },
        select: { id: true, slug: true, name: true, viewCount: true, rating: true, reviewCount: true, status: true },
      },
    },
  }).catch(() => null);

  if (!company) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Company Dashboard</h1>
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Building2 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You haven&apos;t claimed a company yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Find your company and click &ldquo;Claim&rdquo; to manage its profile.</p>
          <Link href="/companies" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Browse companies
          </Link>
        </div>
      </div>
    );
  }

  const totalViews = company.tools.reduce((s, t) => s + t.viewCount, 0);
  const totalReviews = company.tools.reduce((s, t) => s + t.reviewCount, 0);

  // ── 30-day analytics for this company's tools ──
  const toolIds = company.tools.map((t) => t.id);
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [recentViews, clickOuts, events] = toolIds.length
    ? await Promise.all([
        prisma.analyticsEvent.count({ where: { type: "TOOL_VIEW", toolId: { in: toolIds }, createdAt: { gte: since } } }).catch(() => 0),
        prisma.analyticsEvent.count({ where: { type: { in: ["CLICK_OUT", "AFFILIATE_CLICK"] }, toolId: { in: toolIds }, createdAt: { gte: since } } }).catch(() => 0),
        prisma.analyticsEvent.findMany({ where: { type: "TOOL_VIEW", toolId: { in: toolIds }, createdAt: { gte: since } }, select: { createdAt: true }, take: 20000 }).catch(() => []),
      ])
    : [0, 0, [] as { createdAt: Date }[]];

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) buckets.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  for (const e of events) {
    const k = e.createdAt.toISOString().slice(0, 10);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const timeseries = [...buckets.entries()].map(([date, views]) => ({ date, views }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            {company.name}
            {company.claimVerified
              ? <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400"><BadgeCheck className="size-3.5" /> Verified</span>
              : <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"><Clock className="size-3.5" /> Pending verification</span>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your company profile</p>
        </div>
        <Link href={`/companies/${company.slug}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          View public page <ExternalLink className="size-4" />
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tools", value: company.tools.length },
          { label: "Total views", value: totalViews },
          { label: "Reviews", value: totalReviews },
          { label: "Followers", value: company._count.followers },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4">
            <p className="text-2xl font-bold">{formatNumber(s.value)}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Insights (last 30 days) */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Insights — last 30 days</h2>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><b className="text-foreground">{formatNumber(recentViews)}</b> views</span>
            <span><b className="text-foreground">{formatNumber(clickOuts)}</b> website clicks</span>
            <span><b className="text-foreground">{recentViews ? Math.round((clickOuts / recentViews) * 100) : 0}%</b> CTR</span>
          </div>
        </div>
        <MiniBarChart data={timeseries} />
      </section>

      {/* Tools */}
      {company.tools.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Your tools</h2>
          <div className="divide-y rounded-2xl border bg-card">
            {company.tools.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <Link href={`/tools/${t.slug}`} className="font-medium hover:text-primary">{t.name}</Link>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {formatNumber(t.viewCount)}</span>
                  <span>{t.rating.toFixed(1)}★ ({t.reviewCount})</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edit profile */}
      <section>
        <h2 className="mb-3 font-semibold">Edit profile</h2>
        <CompanyEditForm initial={{
          id: company.id,
          name: company.name,
          description: company.description ?? "",
          websiteUrl: company.websiteUrl ?? "",
          logoUrl: company.logoUrl ?? "",
          country: company.country ?? "",
          foundedYear: company.foundedYear ? String(company.foundedYear) : "",
          founder: company.founder ?? "",
          employees: company.employees ?? "",
          funding: company.funding ?? "",
        }} />
      </section>
    </div>
  );
}
