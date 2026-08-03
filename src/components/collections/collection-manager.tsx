"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Lock, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type Collection = { id: string; slug: string; name: string; description: string | null; isPublic: boolean; count: number };

export function CollectionManager({ initial }: { initial: Collection[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState<Collection[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const create = async () => {
    if (name.trim().length < 2) return;
    setBusy(true);
    const res = await fetch("/api/collections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc || undefined, isPublic }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Collection created");
      setName(""); setDesc(""); setIsPublic(false); setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Could not create");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this collection? Its saved tools will be removed from it.")) return;
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((xs) => xs.filter((x) => x.id !== id));
      toast.success("Collection deleted");
    } else toast.error("Could not delete");
  };

  const togglePublic = async (c: Collection) => {
    const next = !c.isPublic;
    setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, isPublic: next } : x)));
    const res = await fetch(`/api/collections/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: next }),
    });
    if (!res.ok) {
      setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, isPublic: !next } : x)));
      toast.error("Could not update visibility");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        {!open && <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> New collection</Button>}
      </div>

      {open && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <Input placeholder="Collection name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={500} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="size-4 accent-primary" />
            Make public (others can discover it)
          </label>
          <div className="flex gap-2">
            <Button onClick={create} disabled={busy || name.trim().length < 2}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Create"}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No collections yet. Create one, then hit “Save” on any tool to add it.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderOpen className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <Link href={`/collections/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link>
                <p className="text-xs text-muted-foreground">{c.count} tools</p>
                {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => togglePublic(c)} title={c.isPublic ? "Public — click to make private" : "Private — click to make public"}>
                  {c.isPublic ? <Globe className="size-4 text-emerald-500" /> : <Lock className="size-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(c.id)} aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
