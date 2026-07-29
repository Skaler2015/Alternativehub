import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ReportActions } from "@/components/admin/report-actions";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      tool: { select: { name: true, slug: true } },
      user: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">User & automation reports on listings</p>
      </div>

      <div className="divide-y rounded-2xl border bg-card">
        {reports.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">No reports 🎉</p>
        )}
        {reports.map((report) => (
          <div key={report.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/tools/${report.tool.slug}`} className="font-medium hover:text-primary">
                  {report.tool.name}
                </Link>
                <Badge variant="warning">{report.reason.replace("_", " ").toLowerCase()}</Badge>
                <Badge
                  variant={
                    report.status === "OPEN"
                      ? "destructive"
                      : report.status === "RESOLVED"
                        ? "success"
                        : "secondary"
                  }
                >
                  {report.status.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {report.detail ?? "No details"} · {report.user?.name ?? "automation"} ·{" "}
                {timeAgo(report.createdAt)}
              </p>
            </div>
            {report.status === "OPEN" && <ReportActions reportId={report.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
