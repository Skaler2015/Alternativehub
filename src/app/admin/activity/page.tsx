import { History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const logs = await prisma.activityLog
    .findMany({ orderBy: { createdAt: "desc" }, take: 150, include: { user: { select: { name: true } } } })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><History className="size-6 text-primary" /> Activity Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Audit trail of admin & system actions</p>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="divide-y rounded-2xl border bg-card">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <span className="font-medium">{log.user?.name ?? "System"}</span>{" "}
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{log.action}</span>{" "}
                {log.entity && <span className="text-muted-foreground">on {log.entity}</span>}
                {typeof log.meta === "object" && log.meta && "name" in log.meta ? (
                  <span className="text-muted-foreground"> · {String((log.meta as Record<string, unknown>).name)}</span>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
