"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const act = async (status: "RESOLVED" | "DISMISSED") => {
    setBusy(true);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(status === "RESOLVED" ? "Resolved" : "Dismissed");
      router.refresh();
    } else {
      toast.error("Action failed");
    }
  };

  return (
    <div className="flex gap-1.5">
      <Button size="sm" disabled={busy} onClick={() => act("RESOLVED")}>
        <Check className="size-3.5" /> Resolve
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => act("DISMISSED")}>
        <X className="size-3.5" /> Dismiss
      </Button>
    </div>
  );
}
