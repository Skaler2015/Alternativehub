import Link from "next/link";
import { Bookmark, History, LayoutDashboard, Settings, Star } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/dashboard/reviews", label: "My Reviews", icon: Star },
  { href: "/dashboard/history", label: "Recently Viewed", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Dashboard">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
