"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export type CompanyValues = {
  id: string;
  name: string; description: string; websiteUrl: string; logoUrl: string;
  country: string; foundedYear: string; founder: string; employees: string; funding: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function CompanyEditForm({ initial }: { initial: CompanyValues }) {
  const router = useRouter();
  const [v, setV] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const set = <K extends keyof CompanyValues>(k: K, val: CompanyValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/companies/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name, description: v.description || undefined, websiteUrl: v.websiteUrl || undefined,
        logoUrl: v.logoUrl || undefined, country: v.country || undefined,
        foundedYear: v.foundedYear ? Number(v.foundedYear) : null,
        founder: v.founder || undefined, employees: v.employees || undefined, funding: v.funding || undefined,
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    if (res.ok) { toast.success("Company profile saved"); router.refresh(); }
    else toast.error(data?.error ?? "Could not save");
  };

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-5">
      <Field label="Company name"><Input value={v.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} /></Field>
      <Field label="Description"><Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={2000} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website URL"><Input type="url" value={v.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} /></Field>
        <Field label="Logo URL"><Input type="url" value={v.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} /></Field>
        <Field label="Country"><Input value={v.country} onChange={(e) => set("country", e.target.value)} maxLength={60} /></Field>
        <Field label="Founded year"><Input type="number" value={v.foundedYear} onChange={(e) => set("foundedYear", e.target.value)} min={1800} max={2100} /></Field>
        <Field label="Founder"><Input value={v.founder} onChange={(e) => set("founder", e.target.value)} maxLength={160} /></Field>
        <Field label="Employees"><Input value={v.employees} onChange={(e) => set("employees", e.target.value)} placeholder="e.g. 51-200" maxLength={40} /></Field>
      </div>
      <Field label="Funding"><Input value={v.funding} onChange={(e) => set("funding", e.target.value)} placeholder="e.g. Series B" maxLength={60} /></Field>
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
