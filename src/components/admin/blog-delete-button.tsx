"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlogDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const del = async () => {
    if (!confirm("Delete this post permanently?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Post deleted");
      router.refresh();
    } else {
      toast.error("Could not delete");
    }
  };

  return (
    <Button variant="ghost" size="icon-sm" onClick={del} disabled={busy} aria-label="Delete post">
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
