"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Fires an admin ops action and reports the result. */
export function OpsButton({
  action,
  label,
  confirmText,
}: {
  action: string;
  label: string;
  confirmText?: string;
}) {
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    const res = await fetch("/api/admin/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok) {
      const detail = data?.count ?? data?.sent ?? (data?.report ? JSON.stringify(data.report) : "done");
      toast.success(`${label}: ${detail}`);
    } else {
      toast.error(data?.error ?? "Action failed");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={busy} className="gap-1.5">
      {busy && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}
