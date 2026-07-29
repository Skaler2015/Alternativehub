import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { SITE } from "@/lib/constants";

const FOOTER_LINKS = [
  {
    title: "Discover",
    links: [
      { label: "Browse Tools", href: "/tools" },
      { label: "Categories", href: "/categories" },
      { label: "Comparisons", href: "/compare" },
      { label: "AI Tools", href: "/categories/ai-tools" },
      { label: "Open Source", href: "/tools?pricing=OPEN_SOURCE" },
    ],
  },
  {
    title: "Popular",
    links: [
      { label: "ChatGPT Alternatives", href: "/alternatives/chatgpt" },
      { label: "Photoshop Alternatives", href: "/alternatives/adobe-photoshop" },
      { label: "Notion Alternatives", href: "/alternatives/notion" },
      { label: "Canva Alternatives", href: "/alternatives/canva" },
      { label: "WhatsApp Alternatives", href: "/alternatives/whatsapp" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Submit a Tool", href: "/submit" },
      { label: "RSS Feed", href: "/rss.xml" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{SITE.description}</p>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Get weekly tool discoveries</p>
              <NewsletterForm compact />
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name} · {SITE.tagline}</p>
          <p>Made for people who love finding better software.</p>
        </div>
      </div>
    </footer>
  );
}
