"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  if (!hasUnread) return null;

  const run = async () => {
    setBusy(true);
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setBusy(false);
    router.refresh();
  };

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={busy} className="gap-1.5">
      <CheckCheck className="size-4" /> Mark all read
    </Button>
  );
}
