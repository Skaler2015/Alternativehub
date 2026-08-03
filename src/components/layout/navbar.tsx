"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SearchCommand } from "@/components/search/search-command";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useT } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/tools", key: "nav.browse" },
  { href: "/categories", key: "nav.categories" },
  { href: "/compare", key: "nav.compare" },
  { href: "/collections", key: "nav.collections" },
  { href: "/leaderboard", key: "nav.leaderboard" },
  { href: "/blog", key: "nav.blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useT();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname.startsWith(link.href) && "text-foreground",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-full max-w-64 items-center gap-2 rounded-lg border bg-background/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 sm:flex"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left">{t("nav.search")}</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search />
            </Button>

            <Button variant="outline" size="sm" asChild className="hidden lg:inline-flex">
              <Link href="/submit">
                <Plus /> {t("nav.submit")}
              </Link>
            </Button>

            <NotificationBell />
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t px-4 py-3 md:hidden animate-fade-in" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              href="/submit"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
            >
              + {t("nav.submit")}
            </Link>
          </nav>
        )}
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
