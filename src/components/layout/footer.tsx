import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { getT } from "@/lib/i18n/server";
import { SITE } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n";

export async function Footer() {
  const { t } = await getT();

  const FOOTER_LINKS: { titleKey: TranslationKey; links: { labelKey?: TranslationKey; label?: string; href: string }[] }[] = [
    {
      titleKey: "footer.discover",
      links: [
        { labelKey: "footer.browseTools", href: "/tools" },
        { labelKey: "footer.categories", href: "/categories" },
        { labelKey: "footer.comparisons", href: "/compare" },
        { labelKey: "footer.aiTools", href: "/categories/ai-tools" },
        { labelKey: "footer.openSource", href: "/tools?pricing=OPEN_SOURCE" },
      ],
    },
    {
      titleKey: "footer.popular",
      links: [
        { label: "ChatGPT Alternatives", href: "/alternatives/chatgpt" },
        { label: "Photoshop Alternatives", href: "/alternatives/adobe-photoshop" },
        { label: "Notion Alternatives", href: "/alternatives/notion" },
        { label: "Canva Alternatives", href: "/alternatives/canva" },
        { label: "WhatsApp Alternatives", href: "/alternatives/whatsapp" },
      ],
    },
    {
      titleKey: "footer.company",
      links: [
        { labelKey: "footer.blog", href: "/blog" },
        { labelKey: "footer.leaderboard", href: "/leaderboard" },
        { labelKey: "footer.submit", href: "/submit" },
        { labelKey: "footer.rss", href: "/rss.xml" },
        { labelKey: "footer.sitemap", href: "/sitemap.xml" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{SITE.description}</p>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{t("footer.newsletterTitle")}</p>
              <NewsletterForm compact />
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.titleKey}>
              <h3 className="mb-3 text-sm font-semibold">{t(group.titleKey)}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.labelKey ? t(link.labelKey) : link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name} · {SITE.tagline}</p>
          <p>{t("footer.tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
