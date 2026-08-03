"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClaimActions({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const act = async (action: "verify" | "reject") => {
    if (action === "reject" && !confirm("Reject this claim? The user will lose ownership.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/companies/${companyId}/claim`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(action === "verify" ? "Claim verified" : "Claim rejected");
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Action failed");
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => act("verify")} disabled={busy} className="gap-1"><Check className="size-3.5" /> Verify</Button>
      <Button size="sm" variant="outline" onClick={() => act("reject")} disabled={busy} className="gap-1"><X className="size-3.5" /> Reject</Button>
    </div>
  );
}
