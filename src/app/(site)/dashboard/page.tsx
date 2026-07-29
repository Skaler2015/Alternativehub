import Link from "next/link";
import { Bookmark, Eye, Star, Upload } from "lucide-react";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/tool-card";
import { toolCardSelect } from "@/lib/data/queries";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [bookmarkCount, reviewCount, submissions, recent] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.tool.findMany({
      where: { submittedById: user.id },
      select: { id: true, name: true, slug: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: "desc" },
      take: 4,
      include: { tool: { select: toolCardSelect } },
    }),
  ]);

  const stats = [
    { label: "Bookmarks", value: bookmarkCount, icon: Bookmark },
    { label: "Reviews", value: reviewCount, icon: Star },
    { label: "Submissions", value: submissions.length, icon: Upload },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hey, {user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your AlternativeHub activity at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-5">
            <stat.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {submissions.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Your Submissions</h2>
          <div className="divide-y rounded-2xl border bg-card">
            {submissions.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between gap-4 p-4">
                <Link href={`/tools/${tool.slug}`} className="text-sm font-medium hover:text-primary">
                  {tool.name}
                </Link>
                <Badge
                  variant={
                    tool.status === "PUBLISHED"
                      ? "success"
                      : tool.status === "REJECTED"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {tool.status.toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
            <Eye className="size-4" /> Recently Viewed
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((rv) => (
              <ToolCard key={rv.toolId} tool={rv.tool} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
