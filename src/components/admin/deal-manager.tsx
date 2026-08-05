"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";

type AdminDeal = {
  id: string;
  title: string;
  discountLabel: string;
  couponCode: string | null;
  url: string;
  featured: boolean;
  active: boolean;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  clicks: number;
  tool: { name: string; slug: string };
};

type ToolHit = { id: string; name: string; slug: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function DealManager({ deals }: { deals: AdminDeal[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  // Tool picker
  const [toolQuery, setToolQuery] = React.useState("");
  const [hits, setHits] = React.useState<ToolHit[]>([]);
  const [tool, setTool] = React.useState<ToolHit | null>(null);

  // Form fields
  const [title, setTitle] = React.useState("");
  const [discountLabel, setDiscountLabel] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [couponCode, setCouponCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [endsAt, setEndsAt] = React.useState("");

  React.useEffect(() => {
    if (tool || toolQuery.trim().length < 2) { setHits([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(toolQuery)}`, { signal: ctrl.signal });
        const data = await res.json();
        setHits((data.hits ?? []).map((h: ToolHit) => ({ id: h.id, name: h.name, slug: h.slug })));
      } catch { /* ignore */ }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [toolQuery, tool]);

  const reset = () => {
    setTool(null); setToolQuery(""); setHits([]);
    setTitle(""); setDiscountLabel(""); setUrl(""); setCouponCode(""); setDescription("");
    setFeatured(false); setEndsAt("");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool) { toast.error("Pick a tool first"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id, title, discountLabel, url,
          couponCode: couponCode || undefined,
          description: description || undefined,
          featured, endsAt: endsAt || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Deal created"); reset(); router.refresh(); }
      else toast.error(data.error ?? "Could not create deal");
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/deals/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) router.refresh();
    else toast.error("Update failed");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    const res = await fetch(`/api/admin/deals/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); router.refresh(); }
    else toast.error("Delete failed");
  };

  return (
    <div className="space-y-8">
      {/* Create form */}
      <form onSubmit={create} className="rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">New deal</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Tool">
              {tool ? (
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                  <span className="font-medium">{tool.name}</span>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setTool(null)}>Change</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
                    <Search className="size-4 text-muted-foreground" />
                    <input value={toolQuery} onChange={(e) => setToolQuery(e.target.value)} placeholder="Search a tool…" className="h-9 w-full bg-transparent text-sm outline-none" />
                  </div>
                  {hits.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-card shadow-lg">
                      {hits.map((h) => (
                        <button key={h.id} type="button" onClick={() => { setTool(h); setHits([]); setToolQuery(""); }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent">{h.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Field>
          </div>

          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="e.g. Lifetime access — 60% off" /></Field>
          <Field label="Discount label"><Input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} required maxLength={40} placeholder="60% OFF" /></Field>
          <Field label="Deal URL"><Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://…" /></Field>
          <Field label="Coupon code (optional)"><Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} maxLength={40} placeholder="SAVE60" /></Field>
          <div className="sm:col-span-2">
            <Field label="Description (optional)"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} /></Field>
          </div>
          <Field label="Ends at (optional)"><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="size-4" />
            Featured
          </label>
        </div>

        <div className="mt-4">
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Create deal
          </Button>
        </div>
      </form>

      {/* Existing deals */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">All deals ({deals.length})</h2>
        {deals.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No deals yet.</p>
        ) : (
          <div className="divide-y rounded-2xl border bg-card">
            {deals.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{d.discountLabel}</span>
                    <span className="truncate text-sm font-medium">{d.title}</span>
                    {!d.active && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">inactive</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {d.tool.name} · {d.clicks} clicks{d.endsAt ? ` · ends ${formatDate(d.endsAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Toggle featured" onClick={() => patch(d.id, { featured: !d.featured })}>
                    <Star className={cn("size-4", d.featured && "fill-amber-400 text-amber-400")} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => patch(d.id, { active: !d.active })}>
                    {d.active ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete deal" onClick={() => remove(d.id)}>
                    <Trash2 className="size-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
