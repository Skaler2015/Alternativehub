import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects your data.`,
  path: "/privacy",
});

const UPDATED = "July 29, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }]} />

      <article className="mt-6 space-y-6 text-[15px] leading-7 text-muted-foreground">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-sm">Last updated: {UPDATED}</p>
        </header>

        <p>
          This Privacy Policy explains how {SITE.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
          uses and safeguards your information when you use {SITE.url}. By using the site you agree to
          this policy.
        </p>

        <Section title="1. Information we collect">
          <p>We keep data collection to a minimum. We may collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><b>Account data</b> — if you register: your name, email address and, for Google sign-in, your public profile and avatar.</li>
            <li><b>Content you create</b> — reviews, votes, bookmarks, tool submissions and comments.</li>
            <li><b>Newsletter</b> — your email address, only if you subscribe.</li>
            <li><b>Contact messages</b> — anything you send us via the contact form.</li>
            <li><b>Usage analytics</b> — aggregate, non-identifying signals such as page views, searches and outbound clicks. We do not use tracking cookies for advertising.</li>
            <li><b>Technical data</b> — approximate device type and referrer, used to keep the service secure and improve it.</li>
          </ul>
        </Section>

        <Section title="2. How we use your information">
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To provide core features — accounts, reviews, bookmarks and personalization.</li>
            <li>To send the newsletter you subscribed to (you can unsubscribe anytime).</li>
            <li>To respond to your messages and support requests.</li>
            <li>To understand aggregate usage and improve the product.</li>
            <li>To detect abuse, spam and keep the platform safe.</li>
          </ul>
        </Section>

        <Section title="3. Legal bases">
          <p>
            Where applicable (e.g. GDPR), we process data on the basis of your consent (newsletter),
            the performance of our service (your account), and our legitimate interests (security and
            product improvement).
          </p>
        </Section>

        <Section title="4. Cookies">
          <p>
            We use a small number of essential cookies to keep you signed in and remember your
            language preference. We use privacy-friendly, aggregate analytics that do not build an
            advertising profile of you. If we ever introduce advertising or non-essential cookies, we
            will ask for your consent first.
          </p>
        </Section>

        <Section title="5. Sharing your data">
          <p>
            We do not sell your personal data. We share it only with service providers that help us
            operate the site (for example, our database host, email delivery and hosting platform),
            and only as needed to run the service. These providers are bound to protect your data.
          </p>
        </Section>

        <Section title="6. Third-party links">
          <p>
            {SITE.name} links out to third-party tools and websites. We are not responsible for the
            privacy practices of those sites — please review their policies.
          </p>
        </Section>

        <Section title="7. Data retention">
          <p>
            We keep your data for as long as your account is active or as needed to provide the
            service. You can delete your account or unsubscribe at any time, after which we remove or
            anonymize your personal data, except where retention is required by law.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>
            Depending on your location, you may have the right to access, correct, export or delete
            your personal data, and to object to certain processing. To exercise any of these, contact
            us and we will respond within a reasonable time.
          </p>
        </Section>

        <Section title="9. Children">
          <p>{SITE.name} is not directed at children under 13, and we do not knowingly collect their data.</p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be reflected by the
            &ldquo;Last updated&rdquo; date above.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about your privacy? Email us at{" "}
            <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">{SITE.email}</a>{" "}
            or use the <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
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
