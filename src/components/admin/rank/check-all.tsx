"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Progress = { remaining: number; pending: number; processing: number; retry: number; failed: number };

export function CheckAllPanel({ providerConfigured }: { providerConfigured: boolean }) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [label, setLabel] = React.useState<string>("");
  const [total, setTotal] = React.useState(0);
  const [progress, setProgress] = React.useState<Progress | null>(null);
  const [msg, setMsg] = React.useState<string>("");

  const post = React.useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/rank/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({ ok: false }));
  }, []);

  const getProgress = React.useCallback(async (): Promise<Progress | null> => {
    const res = await fetch("/api/admin/rank/progress").then((r) => r.json()).catch(() => null);
    if (!res?.ok) return null;
    return { remaining: res.remaining, pending: res.pending, processing: res.processing, retry: res.retry, failed: res.failed };
  }, []);

  const run = React.useCallback(
    async (scope: "all" | "failed" | "notranking", scopeLabel: string) => {
      if (!providerConfigured || running) return;
      setRunning(true);
      setMsg("");
      setLabel(scopeLabel);
      try {
        const enq = await post({ action: "enqueue", scope });
        if (!enq.ok) { setMsg("Could not queue checks."); setRunning(false); return; }
        const start = await getProgress();
        const startRemaining = start?.remaining ?? enq.enqueued ?? 0;
        setTotal(startRemaining);
        setProgress(start);
        if (startRemaining === 0) { setMsg("Nothing to check."); setRunning(false); return; }

        // Drain the queue in batches until empty.
        for (let guard = 0; guard < 5000; guard++) {
          const summary = await post({ action: "process", limit: 15 });
          if (summary?.configured === false) { setMsg("Ranking provider is not configured."); break; }
          const p = await getProgress();
          setProgress(p);
          if (!p || p.remaining <= 0) break;
        }
        setMsg("Done.");
        router.refresh();
      } finally {
        setRunning(false);
      }
    },
    [getProgress, post, providerConfigured, router, running],
  );

  const done = total > 0 && progress ? Math.max(0, total - progress.remaining) : 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!providerConfigured || running} onClick={() => run("all", "All keywords")}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Check All
        </Button>
        <Button size="sm" variant="outline" disabled={!providerConfigured || running} onClick={() => run("failed", "Failed")}>
          <RefreshCw className="size-4" /> Check Failed
        </Button>
        <Button size="sm" variant="outline" disabled={!providerConfigured || running} onClick={() => run("notranking", "Not ranking")}>
          <RefreshCw className="size-4" /> Check Not Ranking
        </Button>
      </div>

      {!providerConfigured && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Configure a ranking provider in Settings to enable checks.
        </p>
      )}

      {(running || progress) && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{running ? `Checking rankings… (${label})` : "Last run"}</span>
            <span className="tabular-nums text-muted-foreground">{done} / {total} · {pct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          {progress && (
            <p className="mt-2 text-xs text-muted-foreground">
              In queue: {progress.remaining} · Processing: {progress.processing} · Retry: {progress.retry} · Failed: {progress.failed}
            </p>
          )}
          {msg && <p className="mt-1 text-xs font-medium">{msg}</p>}
        </div>
      )}
    </div>
  );
}
