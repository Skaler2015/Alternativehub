"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClearLogsButton({ type }: { type?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const clear = async () => {
    if (busy || !confirm(type ? `Clear all "${type}" logs?` : "Clear all logs?")) return;
    setBusy(true);
    await fetch("/api/admin/rank/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type ? { type } : {}),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  };
  return (
    <Button variant="outline" size="sm" onClick={clear} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Clear{type ? ` ${type}` : " all"}
    </Button>
  );
}
