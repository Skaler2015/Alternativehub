"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UserRoleActions({
  userId,
  role,
  isBanned,
}: {
  userId: string;
  role: string;
  isBanned: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const update = async (body: Record<string, unknown>) => {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("User updated");
      router.refresh();
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={(v) => update({ role: v })} disabled={busy}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <ShieldCheck className="size-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USER">User</SelectItem>
          <SelectItem value="MODERATOR">Moderator</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant={isBanned ? "outline" : "ghost"}
        className={isBanned ? "" : "text-destructive"}
        disabled={busy}
        onClick={() => update({ isBanned: !isBanned })}
      >
        <Ban className="size-3.5" /> {isBanned ? "Unban" : "Ban"}
      </Button>
    </div>
  );
}
