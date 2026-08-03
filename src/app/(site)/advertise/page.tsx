import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Megaphone, BadgeCheck, TrendingUp, Users, MousePointerClick } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Advertise & Promote Your Software",
  description: `Reach buyers actively researching software on ${SITE.name}. Featured listings, sponsored placement and verified company profiles.`,
  path: "/advertise",
});

const TIERS = [
  {
    icon: BadgeCheck, name: "Verified Company", highlight: false,
    tagline: "Own your listing",
    features: ["Claim & verify your company", "Edit your profile & tools", "Reply to reviews", "Company insights dashboard"],
    cta: { label: "Claim your company", href: "/companies" },
  },
  {
    icon: Sparkles, name: "Featured", highlight: true,
    tagline: "Stand out everywhere",
    features: ["Featured badge on your card", "Priority in category & search", "Homepage featured rotation", "Everything in Verified"],
    cta: { label: "Get featured", href: "/contact" },
  },
  {
    icon: Megaphone, name: "Sponsored", highlight: false,
    tagline: "Maximum reach",
    features: ["Top sponsored placement", "Sponsored badge", "Newsletter mention", "Everything in Featured"],
    cta: { label: "Talk to us", href: "/contact" },
  },
];

export default async function AdvertisePage() {
  const stats = await prisma.tool.aggregate({ where: { status: "PUBLISHED", deletedAt: null }, _sum: { viewCount: true }, _count: { _all: true } }).catch(() => null);
  const toolCount = stats?._count._all ?? 0;
  const views = stats?._sum.viewCount ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Advertise", path: "/advertise" }]} />

      <header className="mt-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Put your software in front of <span className="text-gradient">buyers who are ready</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {SITE.name} reaches people actively comparing tools and looking to switch. Promote your product where the decision happens.
        </p>
      </header>

      {/* Reach stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: "Tools listed", value: formatNumber(toolCount) },
          { icon: MousePointerClick, label: "Tool views", value: formatNumber(views) },
          { icon: Users, label: "Intent audience", value: "High" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 text-center">
            <s.icon className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tiers */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className={`flex flex-col rounded-3xl border p-6 ${tier.highlight ? "border-primary/40 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 soft-shadow-lg" : "bg-card"}`}>
            <span className={`flex size-11 items-center justify-center rounded-2xl ${tier.highlight ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white" : "bg-primary/10 text-primary"}`}>
              <tier.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{tier.name}</h2>
            <p className="text-sm text-muted-foreground">{tier.tagline}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={tier.cta.href}
              className={`mt-6 rounded-lg px-4 py-2 text-center text-sm font-medium transition-opacity hover:opacity-90 ${tier.highlight ? "bg-primary text-primary-foreground" : "border"}`}
            >
              {tier.cta.label}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 p-8 text-center">
        <h2 className="text-xl font-semibold">Ready to grow?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Tell us about your product and we&apos;ll find the right placement for your goals and budget.
        </p>
        <Link href="/contact" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Get in touch
        </Link>
      </div>
    </div>
  );
}
