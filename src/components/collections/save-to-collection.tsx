"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FolderPlus, Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Row = { id: string; name: string; count: number; contains: boolean };

export function SaveToCollection({ toolId }: { toolId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/collections?toolId=${toolId}`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (res.ok) setRows((data.collections ?? []).map((c: Row & { contains?: boolean }) => ({ ...c, contains: !!c.contains })));
  }, [toolId]);

  const openPicker = () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setOpen(true);
    void load();
  };

  const toggle = async (row: Row) => {
    setBusy(row.id);
    const res = await fetch(`/api/collections/${row.id}/items`, {
      method: row.contains ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId }),
    });
    setBusy(null);
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, contains: !r.contains, count: r.count + (r.contains ? -1 : 1) } : r)));
    } else {
      toast.error("Could not update collection");
    }
  };

  const create = async () => {
    const name = newName.trim();
    if (name.length < 2) return;
    setBusy("new");
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      // add the tool immediately
      await fetch(`/api/collections/${data.id}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolId }),
      });
      setNewName("");
      setCreating(false);
      toast.success(`Saved to “${name}”`);
      await load();
    } else {
      toast.error(data?.error ?? "Could not create collection");
    }
    setBusy(null);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openPicker} className="gap-1.5">
        <FolderPlus className="size-4" /> Save
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to collection</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {rows.length === 0 && !creating && (
                <p className="py-2 text-sm text-muted-foreground">No collections yet — create your first one.</p>
              )}
              {rows.map((row) => (
                <button
                  key={row.id}
                  onClick={() => toggle(row)}
                  disabled={busy === row.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                    row.contains && "border-primary/40 bg-primary/5",
                  )}
                >
                  <span className={cn("flex size-5 items-center justify-center rounded-md border", row.contains && "border-primary bg-primary text-primary-foreground")}>
                    {busy === row.id ? <Loader2 className="size-3 animate-spin" /> : row.contains ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className="flex-1 font-medium">{row.name}</span>
                  <span className="text-xs text-muted-foreground">{row.count}</span>
                </button>
              ))}

              {creating ? (
                <div className="flex gap-2 pt-1">
                  <Input autoFocus placeholder="Collection name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80}
                    onKeyDown={(e) => e.key === "Enter" && create()} />
                  <Button size="sm" onClick={create} disabled={busy === "new" || newName.trim().length < 2}>
                    {busy === "new" ? <Loader2 className="size-4 animate-spin" /> : "Create"}
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="mt-1 w-full justify-start gap-1.5 text-primary" onClick={() => setCreating(true)}>
                  <Plus className="size-4" /> New collection
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
