import {
  Eye,
  Flag,
  Hourglass,
  ListChecks,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    toolCount,
    pendingCount,
    userCount,
    reviewCount,
    openReports,
    totalViews,
    recentActivity,
    topTools,
  ] = await Promise.all([
    prisma.tool.count({ where: { deletedAt: null } }),
    prisma.tool.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.user.count(),
    prisma.review.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.tool.aggregate({ _sum: { viewCount: true } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
    prisma.tool.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { name: true, slug: true, viewCount: true, rating: true },
    }),
  ]);

  const stats = [
    { label: "Total Listings", value: toolCount, icon: ListChecks, href: "/admin/listings" },
    { label: "Pending Approval", value: pendingCount, icon: Hourglass, href: "/admin/listings?status=PENDING", highlight: pendingCount > 0 },
    { label: "Users", value: userCount, icon: Users, href: "/admin/users" },
    { label: "Reviews", value: reviewCount, icon: MessageSquare, href: "/admin/reviews" },
    { label: "Open Reports", value: openReports, icon: Flag, href: "/admin/reports", highlight: openReports > 0 },
    { label: "Total Views", value: totalViews._sum.viewCount ?? 0, icon: Eye, href: "/admin" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:soft-shadow ${stat.highlight ? "border-warning/50" : ""}`}
          >
            <stat.icon className={`size-5 ${stat.highlight ? "text-warning" : "text-primary"}`} />
            <p className="mt-3 text-2xl font-bold">{formatNumber(stat.value)}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <TrendingUp className="size-4" /> Top Tools by Views
          </h2>
          <div className="space-y-3">
            {topTools.map((tool, i) => (
              <div key={tool.slug} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-muted-foreground">{i + 1}.</span>
                <Link href={`/tools/${tool.slug}`} className="flex-1 truncate font-medium hover:text-primary">
                  {tool.name}
                </Link>
                <Badge variant="secondary">{formatNumber(tool.viewCount)} views</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">
                  <b>{log.user?.name ?? "System"}</b>{" "}
                  <span className="text-muted-foreground">{log.action}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
