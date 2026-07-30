"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

const CATEGORIES = ["NEWS", "TOP_LISTS", "COMPARISONS", "BUYING_GUIDES", "TUTORIALS"];

export type BlogFormValues = {
  id?: string;
  title: string; slug: string; excerpt: string; content: string; coverUrl: string;
  category: string; published: boolean; seoTitle: string; seoDesc: string; keywords: string;
};

const EMPTY: BlogFormValues = {
  title: "", slug: "", excerpt: "", content: "", coverUrl: "", category: "TOP_LISTS",
  published: false, seoTitle: "", seoDesc: "", keywords: "",
};

const commas = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const selectCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function BlogForm({ initial }: { initial?: Partial<BlogFormValues> & { id?: string } }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [v, setV] = React.useState<BlogFormValues>({ ...EMPTY, ...initial } as BlogFormValues);
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(isEdit);

  const set = <K extends keyof BlogFormValues>(k: K, val: BlogFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const save = async (publishOverride?: boolean) => {
    setSaving(true);
    const payload = {
      title: v.title, slug: v.slug, excerpt: v.excerpt, content: v.content,
      coverUrl: v.coverUrl || undefined, category: v.category,
      published: publishOverride ?? v.published,
      seoTitle: v.seoTitle || undefined, seoDesc: v.seoDesc || undefined, keywords: commas(v.keywords),
    };
    const res = await fetch(isEdit ? `/api/admin/blog/${initial!.id}` : "/api/admin/blog", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      toast.success(isEdit ? "Post saved" : "Post created");
      router.push("/admin/blog");
      router.refresh();
    } else {
      toast.error(data?.error ?? "Could not save");
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <Input value={v.title} onChange={(e) => setV((s) => ({ ...s, title: e.target.value, slug: slugTouched ? s.slug : slugify(e.target.value) }))} required maxLength={200} />
        </Field>
        <Field label="Slug" hint="lowercase-with-hyphens">
          <Input value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select className={selectCls} value={v.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
        <Field label="Cover image URL"><Input type="url" value={v.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} /></Field>
      </div>

      <Field label="Excerpt" hint="short summary shown in listings"><Textarea value={v.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} required maxLength={500} /></Field>
      <Field label="Content" hint="Markdown supported"><Textarea value={v.content} onChange={(e) => set("content", e.target.value)} rows={16} required className="font-mono text-sm" /></Field>

      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">SEO (optional)</summary>
        <div className="mt-4 space-y-4">
          <Field label="SEO title"><Input value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={160} /></Field>
          <Field label="SEO description"><Textarea value={v.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} rows={2} maxLength={320} /></Field>
          <Field label="Keywords" hint="comma-separated"><Input value={v.keywords} onChange={(e) => set("keywords", e.target.value)} /></Field>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={saving} onClick={() => save(false)}>Save draft</Button>
        <Button type="button" disabled={saving} onClick={() => save(true)}>{saving ? "Saving…" : "Publish"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
