import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ShieldCheck, Users, Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "About AlternativeHub",
  description:
    "AlternativeHub helps you discover better software, apps and AI tools — ranked by real users and AI. Learn what we do and why.",
  path: "/about",
});

const VALUES = [
  { icon: Sparkles, title: "AI + human", body: "Every listing blends community ratings with AI analysis, so you get honest signal — not marketing copy." },
  { icon: Scale, title: "Fair comparisons", body: "Transparent scores and side-by-side breakdowns help you decide, with a clear winner for your use case." },
  { icon: Users, title: "Community-driven", body: "Real reviews, votes and submissions from people who actually use these tools every day." },
  { icon: ShieldCheck, title: "Free & open", body: "Browsing, comparing and discovering is completely free — and always will be." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Discover <span className="text-gradient">better alternatives</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {SITE.name} is a discovery platform for finding the best alternatives to apps, websites,
          AI tools, desktop software, SaaS products, browser extensions, APIs and games.
        </p>
      </header>

      <section className="mt-10 space-y-4 text-[15px] leading-7 text-muted-foreground">
        <p>
          Every day, better tools launch — but finding them, and knowing whether they&apos;re
          actually worth switching to, is hard. Reviews are scattered, comparisons are biased, and
          &ldquo;top 10&rdquo; lists are often just affiliate bait.
        </p>
        <p>
          We built {SITE.name} to fix that. We bring every tool into one place, enrich it with
          AI-generated summaries, pros and cons, and combine that with genuine community ratings —
          so you can compare with confidence and switch without regret.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border bg-card p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary">
              <v.icon className="size-5" />
            </span>
            <h2 className="mt-3 font-semibold">{v.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 p-8 text-center">
        <h2 className="text-xl font-semibold">Know a tool we&apos;re missing?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Anyone can add a tool. Our AI enriches it and it goes live for everyone to discover.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Submit a tool
          </Link>
          <Link href="/contact" className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40">
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
