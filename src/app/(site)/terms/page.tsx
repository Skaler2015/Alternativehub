import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `The terms that govern your use of ${SITE.name}.`,
  path: "/terms",
});

const UPDATED = "July 29, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Terms of Service", path: "/terms" }]} />

      <article className="mt-6 space-y-6 text-[15px] leading-7 text-muted-foreground">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          <p className="mt-2 text-sm">Last updated: {UPDATED}</p>
        </header>

        <p>
          These Terms govern your use of {SITE.name} ({SITE.url}). By accessing or using the site,
          you agree to these Terms. If you do not agree, please do not use the site.
        </p>

        <Section title="1. Using the service">
          <p>
            You may browse, search and compare tools freely. Some features — reviewing, voting,
            bookmarking and submitting tools — require a free account. You are responsible for keeping
            your account credentials secure and for all activity under your account.
          </p>
        </Section>

        <Section title="2. Acceptable use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Post false, misleading, spammy, or fake reviews or submissions.</li>
            <li>Post unlawful, hateful, infringing or malicious content.</li>
            <li>Scrape, overload, or attempt to disrupt or reverse-engineer the service.</li>
            <li>Impersonate others or misrepresent your affiliation with any tool or company.</li>
          </ul>
          <p className="mt-2">
            We may remove content and suspend accounts that violate these Terms, at our discretion.
          </p>
        </Section>

        <Section title="3. User content">
          <p>
            You retain ownership of the reviews and content you submit. By posting, you grant
            {" "}{SITE.name} a non-exclusive, worldwide, royalty-free license to display, distribute
            and promote that content on the platform. You are responsible for the content you post and
            confirm you have the right to share it.
          </p>
        </Section>

        <Section title="4. Tool listings & accuracy">
          <p>
            Listings combine community input and AI-generated analysis. While we strive for accuracy,
            we do not guarantee that any information — including features, pricing, ratings or
            availability — is complete or up to date. Verify important details on the tool&apos;s
            official website before making decisions.
          </p>
        </Section>

        <Section title="5. Third-party tools & links">
          <p>
            {SITE.name} links to third-party products and websites. We do not endorse, control, or
            take responsibility for them. Some outbound links may be affiliate links, meaning we may
            earn a commission at no extra cost to you. This never affects our rankings or reviews.
          </p>
        </Section>

        <Section title="6. Intellectual property">
          <p>
            The {SITE.name} name, design, and original content are owned by us and protected by
            applicable laws. Product names and logos belong to their respective owners and are used
            for identification only.
          </p>
        </Section>

        <Section title="7. Disclaimer of warranties">
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, express or implied. We do not warrant that the service will be
            uninterrupted, secure, or error-free.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            To the maximum extent permitted by law, {SITE.name} shall not be liable for any indirect,
            incidental or consequential damages arising from your use of the service or from decisions
            made based on information found here.
          </p>
        </Section>

        <Section title="9. Changes">
          <p>
            We may update these Terms from time to time. Continued use of the site after changes take
            effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these Terms? Reach us at{" "}
            <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">{SITE.email}</a>{" "}
            or via the <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
