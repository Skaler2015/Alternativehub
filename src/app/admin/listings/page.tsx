import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/tools/tool-logo";
import { ToolModerationActions } from "@/components/admin/tool-moderation-actions";
import { cn, timeAgo } from "@/lib/utils";
import type { ToolStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES = ["ALL", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED", "DELETED"] as const;

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status = "ALL", page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const pageSize = 30;

  const where =
    status === "DELETED"
      ? { deletedAt: { not: null } }
      : {
          deletedAt: null,
          ...(status !== "ALL" ? { status: status as ToolStatus } : {}),
        };

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true } },
        submittedBy: { select: { name: true } },
      },
    }),
    prisma.tool.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} listings</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/listings${s === "ALL" ? "" : `?status=${s}`}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              status === s
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      <div className="divide-y rounded-2xl border bg-card">
        {tools.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">No listings here.</p>
        )}
        {tools.map((tool) => (
          <div key={tool.id} className="flex flex-wrap items-center gap-4 p-4">
            <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/tools/${tool.slug}`} className="font-medium hover:text-primary">
                  {tool.name}
                </Link>
                <Badge
                  variant={
                    tool.deletedAt
                      ? "destructive"
                      : tool.status === "PUBLISHED"
                        ? "success"
                        : tool.status === "PENDING"
                          ? "warning"
                          : "secondary"
                  }
                >
                  {tool.deletedAt ? "deleted" : tool.status.toLowerCase()}
                </Badge>
                {tool.featured && <Badge variant="gradient">featured</Badge>}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {tool.category.name} · added {timeAgo(tool.createdAt)}
                {tool.submittedBy?.name && ` by ${tool.submittedBy.name}`}
              </p>
            </div>
            <ToolModerationActions
              toolId={tool.id}
              status={tool.status}
              featured={tool.featured}
              deleted={Boolean(tool.deletedAt)}
            />
          </div>
        ))}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              className="text-primary hover:underline"
              href={`/admin/listings?status=${status}&page=${page - 1}`}
            >
              ← Previous
            </Link>
          )}
          {page * pageSize < total && (
            <Link
              className="text-primary hover:underline"
              href={`/admin/listings?status=${status}&page=${page + 1}`}
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
