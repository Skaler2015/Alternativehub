import Link from "next/link";
import { Plus, Search, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolLogo } from "@/components/tools/tool-logo";
import { ToolModerationActions } from "@/components/admin/tool-moderation-actions";
import { cn, timeAgo } from "@/lib/utils";
import type { Prisma, ToolStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES = ["ALL", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED", "DELETED"] as const;

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const { status = "ALL", page: pageParam, q } = await searchParams;
  const page = Number(pageParam) || 1;
  const pageSize = 30;
  const query = (q ?? "").trim();

  const searchWhere: Prisma.ToolWhereInput = query
    ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] }
    : {};

  const where: Prisma.ToolWhereInput =
    status === "DELETED"
      ? { deletedAt: { not: null }, ...searchWhere }
      : {
          deletedAt: null,
          ...(status !== "ALL" ? { status: status as ToolStatus } : {}),
          ...searchWhere,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} listings{query ? ` matching “${query}”` : ""}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/tools/new"><Plus className="size-4" /> Add tool</Link>
        </Button>
      </div>

      <form method="get" className="flex items-center gap-2">
        {status !== "ALL" && <input type="hidden" name="status" value={status} />}
        <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search tools by name or slug…"
            className="h-9 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">Search</Button>
        {query && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/listings${status === "ALL" ? "" : `?status=${status}`}`}>Clear</Link>
          </Button>
        )}
      </form>

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
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href={`/admin/tools/${tool.id}/edit`}><Pencil className="size-3.5" /> Edit</Link>
              </Button>
              <ToolModerationActions
                toolId={tool.id}
                status={tool.status}
                featured={tool.featured}
                deleted={Boolean(tool.deletedAt)}
              />
            </div>
          </div>
        ))}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              className="text-primary hover:underline"
              href={`/admin/listings?status=${status}&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            >
              ← Previous
            </Link>
          )}
          {page * pageSize < total && (
            <Link
              className="text-primary hover:underline"
              href={`/admin/listings?status=${status}&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
