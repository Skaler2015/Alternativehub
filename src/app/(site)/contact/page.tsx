import type { Metadata } from "next";
import { Mail, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ContactForm } from "@/components/contact/contact-form";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description: `Get in touch with the ${SITE.name} team — questions, feedback, partnerships or corrections.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">
          Questions, feedback, a correction to a listing, or a partnership idea? We&apos;d love to
          hear from you.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <a href={`mailto:${SITE.email}`} className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40">
          <Mail className="size-5 text-primary" />
          <p className="mt-2 text-sm font-medium">Email us</p>
          <p className="truncate text-xs text-muted-foreground">{SITE.email}</p>
        </a>
        <Link href="/submit" className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40">
          <Plus className="size-5 text-primary" />
          <p className="mt-2 text-sm font-medium">Submit a tool</p>
          <p className="text-xs text-muted-foreground">Add a missing app</p>
        </Link>
        <div className="rounded-2xl border bg-card p-4">
          <MessageSquare className="size-5 text-primary" />
          <p className="mt-2 text-sm font-medium">Response time</p>
          <p className="text-xs text-muted-foreground">Usually within 1–2 days</p>
        </div>
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
