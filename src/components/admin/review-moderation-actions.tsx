"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviewModerationActions({
  reviewId,
  approved,
}: {
  reviewId: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const act = async (action: "toggle" | "delete") => {
    if (action === "delete" && !confirm("Permanently delete this review?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Done");
      router.refresh();
    } else {
      toast.error("Action failed");
    }
  };

  return (
    <div className="flex gap-1.5">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => act("toggle")}>
        {approved ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {approved ? "Hide" : "Show"}
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => act("delete")}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
