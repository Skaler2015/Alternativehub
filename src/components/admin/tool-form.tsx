"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

const PRICING = ["FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT"];
const TIERS = ["STANDARD", "PREMIUM", "SPONSORED"];
const STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"];

export type ToolFormValues = {
  id?: string;
  name: string; slug: string; tagline: string; description: string;
  websiteUrl: string; affiliateUrl: string; downloadUrl: string; logoUrl: string;
  categoryId: string; pricingModel: string; tier: string; status: string;
  featured: boolean; verified: boolean; isOpenSource: boolean;
  launchYear: string; pros: string; cons: string; bestFor: string; tags: string;
  seoTitle: string; seoDesc: string;
};

const EMPTY: ToolFormValues = {
  name: "", slug: "", tagline: "", description: "", websiteUrl: "", affiliateUrl: "",
  downloadUrl: "", logoUrl: "", categoryId: "", pricingModel: "FREEMIUM", tier: "STANDARD",
  status: "PUBLISHED", featured: false, verified: true, isOpenSource: false, launchYear: "",
  pros: "", cons: "", bestFor: "", tags: "", seoTitle: "", seoDesc: "",
};

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const commas = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const selectCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function ToolForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial?: Partial<ToolFormValues> & { id?: string };
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [v, setV] = React.useState<ToolFormValues>({ ...EMPTY, ...initial } as ToolFormValues);
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(isEdit);

  const set = <K extends keyof ToolFormValues>(k: K, val: ToolFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const onName = (name: string) => {
    setV((s) => ({ ...s, name, slug: slugTouched ? s.slug : slugify(name) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: v.name, slug: v.slug, tagline: v.tagline || undefined, description: v.description,
      websiteUrl: v.websiteUrl, affiliateUrl: v.affiliateUrl || undefined, downloadUrl: v.downloadUrl || undefined,
      logoUrl: v.logoUrl || undefined, categoryId: v.categoryId, pricingModel: v.pricingModel,
      tier: v.tier, status: v.status, featured: v.featured, verified: v.verified, isOpenSource: v.isOpenSource,
      launchYear: v.launchYear ? Number(v.launchYear) : null,
      pros: lines(v.pros), cons: lines(v.cons), bestFor: lines(v.bestFor), tags: commas(v.tags),
      seoTitle: v.seoTitle || undefined, seoDesc: v.seoDesc || undefined,
    };
    const res = await fetch(isEdit ? `/api/admin/tools/${initial!.id}` : "/api/admin/tools", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      toast.success(isEdit ? "Tool updated" : "Tool created");
      router.push("/admin/listings");
      router.refresh();
    } else {
      toast.error(data?.error ?? "Could not save");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><Input value={v.name} onChange={(e) => onName(e.target.value)} required maxLength={120} /></Field>
        <Field label="Slug" hint="lowercase-with-hyphens (used in the URL)">
          <Input value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} required />
        </Field>
      </div>

      <Field label="Tagline"><Input value={v.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={160} /></Field>
      <Field label="Description"><Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={5} required /></Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website URL"><Input type="url" value={v.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} required /></Field>
        <Field label="Affiliate URL" hint="optional — used for 'Visit Website' & revenue"><Input type="url" value={v.affiliateUrl} onChange={(e) => set("affiliateUrl", e.target.value)} /></Field>
        <Field label="Download URL"><Input type="url" value={v.downloadUrl} onChange={(e) => set("downloadUrl", e.target.value)} /></Field>
        <Field label="Logo URL" hint="leave blank to auto-use the site favicon"><Input type="url" value={v.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <select className={selectCls} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Pricing">
          <select className={selectCls} value={v.pricingModel} onChange={(e) => set("pricingModel", e.target.value)}>
            {PRICING.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Launch year"><Input type="number" value={v.launchYear} onChange={(e) => set("launchYear", e.target.value)} min={1970} max={2100} /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tier" hint="PREMIUM / SPONSORED = paid promotion">
          <select className={selectCls} value={v.tier} onChange={(e) => set("tier", e.target.value)}>
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={selectCls} value={v.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Pros" hint="one per line"><Textarea value={v.pros} onChange={(e) => set("pros", e.target.value)} rows={4} /></Field>
        <Field label="Cons" hint="one per line"><Textarea value={v.cons} onChange={(e) => set("cons", e.target.value)} rows={4} /></Field>
        <Field label="Best for" hint="one per line"><Textarea value={v.bestFor} onChange={(e) => set("bestFor", e.target.value)} rows={4} /></Field>
      </div>

      <Field label="Tags" hint="comma-separated"><Input value={v.tags} onChange={(e) => set("tags", e.target.value)} /></Field>

      <div className="flex flex-wrap gap-5 rounded-xl border bg-card p-4">
        {([["featured", "Featured"], ["verified", "Verified"], ["isOpenSource", "Open source"]] as const).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} className="size-4 accent-primary" />
            {label}
          </label>
        ))}
      </div>

      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">SEO (optional)</summary>
        <div className="mt-4 space-y-4">
          <Field label="SEO title"><Input value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={160} /></Field>
          <Field label="SEO description"><Textarea value={v.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} rows={2} maxLength={320} /></Field>
        </div>
      </details>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Create tool"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
