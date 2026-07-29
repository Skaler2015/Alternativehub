"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Check, RotateCcw, Sparkles, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Approve / reject / feature / archive / restore / delete controls per listing. */
export function ToolModerationActions({
  toolId,
  status,
  featured,
  deleted,
}: {
  toolId: string;
  status: string;
  featured: boolean;
  deleted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const act = async (action: string) => {
    if (action === "delete" && !confirm("Soft-delete this listing? It can be restored later.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/tools/${toolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Done: ${action}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Action failed");
    }
  };

  if (deleted) {
    return (
      <Button size="sm" variant="outline" disabled={busy} onClick={() => act("restore")}>
        <RotateCcw className="size-3.5" /> Restore
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "PENDING" && (
        <>
          <Button size="sm" disabled={busy} onClick={() => act("approve")}>
            <Check className="size-3.5" /> Approve
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => act("reject")}>
            <X className="size-3.5" /> Reject
          </Button>
        </>
      )}
      {status === "PUBLISHED" && (
        <>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => act(featured ? "unfeature" : "feature")}>
            <Star className="size-3.5" /> {featured ? "Unfeature" : "Feature"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => act("enrich")}>
            <Sparkles className="size-3.5" /> AI Enrich
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => act("archive")}>
            <Archive className="size-3.5" />
          </Button>
        </>
      )}
      {status === "REJECTED" && (
        <Button size="sm" disabled={busy} onClick={() => act("approve")}>
          <Check className="size-3.5" /> Approve
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => act("delete")}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
