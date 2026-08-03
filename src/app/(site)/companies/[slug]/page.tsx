import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Building2, BadgeCheck, Globe, MapPin, Users, Calendar } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { FollowCompanyButton } from "@/components/social/follow-company-button";
import { ClaimCompanyButton } from "@/components/company/claim-company-button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toolCardSelect } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = await prisma.company.findUnique({ where: { slug }, select: { name: true, description: true } }).catch(() => null);
  if (!c) return { title: "Company not found" };
  return buildMetadata({
    title: `${c.name} — Company Profile & Tools`,
    description: c.description ?? `Explore ${c.name}'s software, reviews and alternatives on AlternativeHub.`,
    path: `/companies/${slug}`,
  });
}

export default async function CompanyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();

  const company = await prisma.company.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, description: true, logoUrl: true, websiteUrl: true,
      country: true, foundedYear: true, founder: true, employees: true, funding: true,
      claimedById: true, claimVerified: true,
      tools: { where: { status: "PUBLISHED", deletedAt: null }, orderBy: { popularityScore: "desc" }, select: toolCardSelect },
      _count: { select: { followers: true } },
    },
  }).catch(() => null);

  if (!company) notFound();

  const isFollowing = session?.user
    ? !!(await prisma.companyFollow.findUnique({
        where: { userId_companyId: { userId: session.user.id, companyId: company.id } },
        select: { userId: true },
      }).catch(() => null))
    : false;
  const isOwner = session?.user?.id === company.claimedById;

  const meta = [
    company.country && { icon: MapPin, value: company.country },
    company.foundedYear && { icon: Calendar, value: `Founded ${company.foundedYear}` },
    company.employees && { icon: Users, value: company.employees },
  ].filter(Boolean) as { icon: typeof MapPin; value: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Organization",
        name: company.name, url: company.websiteUrl ?? `${SITE.url}/companies/${company.slug}`,
        logo: company.logoUrl ?? undefined, description: company.description ?? undefined,
      }} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Companies", path: "/companies" }, { name: company.name, path: `/companies/${company.slug}` }]} />

      <header className="mt-6 flex flex-col gap-5 rounded-3xl border bg-card p-6 sm:flex-row sm:items-start">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background">
          {company.logoUrl ? <img src={company.logoUrl} alt="" className="size-full object-contain p-2" /> : <Building2 className="size-7 text-muted-foreground" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            {company.claimVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            )}
          </div>
          {company.description && <p className="mt-1.5 text-sm text-muted-foreground">{company.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><b className="text-foreground">{company._count.followers}</b> followers · <b className="text-foreground">{company.tools.length}</b> tools</span>
            {meta.map((m) => <span key={m.value} className="inline-flex items-center gap-1"><m.icon className="size-3" /> {m.value}</span>)}
            {company.websiteUrl && (
              <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-foreground">
                <Globe className="size-3" /> Website
              </a>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FollowCompanyButton companyId={company.id} initialFollowing={isFollowing} initialFollowers={company._count.followers} />
          {isOwner ? (
            <Link href="/dashboard/company" className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40">Manage</Link>
          ) : (
            <ClaimCompanyButton companyId={company.id} claimed={!!company.claimedById} />
          )}
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Tools by {company.name}</h2>
        {company.tools.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No published tools yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
          </div>
        )}
      </section>
    </div>
  );
}
