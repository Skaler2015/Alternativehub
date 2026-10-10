"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result = {
  ok?: boolean;
  before?: number;
  after?: number;
  added?: number;
  stoppedEarly?: boolean;
  perBatch?: { batch: string; added: number }[];
  error?: string;
};

/**
 * Drives /api/admin/populate-catalog. The route publishes the full catalog in
 * idempotent passes (skipDuplicates) and stops before its time limit; this
 * button simply keeps calling it until a pass reports nothing left to do, so one
 * click reliably publishes every tool even on a slow database.
 */
export function PopulateCatalogButton() {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [current, setCurrent] = React.useState<number | null>(null);
  const [msg, setMsg] = React.useState("");

  const run = React.useCallback(async () => {
    if (running) return;
    if (!confirm("Publish the full software catalog now? Safe to run anytime — it only adds what's missing.")) return;
    setRunning(true);
    setMsg("Publishing… this can take a few minutes. Keep this tab open.");
    let added = 0;
    try {
      for (let pass = 0; pass < 20; pass++) {
        const res: Result = await fetch("/api/admin/populate-catalog", { method: "POST" })
          .then((r) => r.json())
          .catch(() => ({ error: "network" }));
        if (res.error) { setMsg(res.error === "Unauthorized" ? "You must be signed in as an admin." : "Network error — try again."); break; }
        if (typeof res.before === "number" && pass === 0) setTotal(res.before);
        if (typeof res.after === "number") setCurrent(res.after);
        added += res.added ?? 0;
        if (!res.stoppedEarly) {
          setMsg(`Done. Published ${added.toLocaleString()} tools — catalog now has ${(res.after ?? 0).toLocaleString()}.`);
          break;
        }
        setMsg(`Working… ${(res.after ?? 0).toLocaleString()} tools so far. Continuing…`);
      }
      router.refresh();
    } finally {
      setRunning(false);
    }
  }, [running, router]);

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={running} size="sm">
        {running ? <><Loader2 className="size-4 animate-spin" /> Publishing…</> : <><PackageOpen className="size-4" /> Publish full catalog</>}
      </Button>
      {(msg || current !== null) && (
        <p className="text-xs text-muted-foreground">
          {current !== null && <span className="font-medium tabular-nums">{current.toLocaleString()} tools</span>}
          {current !== null && msg && " — "}
          {msg}
          {total > 0 && current !== null && current > total && <span className="text-success"> (+{(current - total).toLocaleString()})</span>}
        </p>
      )}
    </div>
  );
}
