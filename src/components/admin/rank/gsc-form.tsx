"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function GscForm({
  initial,
}: {
  initial: { enabled: boolean; siteUrl: string; clientEmail: string | null };
}) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(initial.enabled);
  const [siteUrl, setSiteUrl] = React.useState(initial.siteUrl);
  const [json, setJson] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const save = async () => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/rank/gsc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, siteUrl, serviceAccountJson: json || undefined }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    setBusy(false);
    setMsg(res.ok ? "Saved." : res.error ?? "Could not save.");
    if (res.ok) { setJson(""); router.refresh(); }
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable Search Console
      </label>
      <label className="space-y-1 block">
        <span className="text-xs font-medium text-muted-foreground">Property URL</span>
        <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://www.alternativehub.in/  or  sc-domain:alternativehub.in" />
      </label>
      <label className="space-y-1 block">
        <span className="text-xs font-medium text-muted-foreground">
          Service account JSON key {initial.clientEmail && <span>(current: {initial.clientEmail})</span>}
        </span>
        <Textarea rows={5} value={json} onChange={(e) => setJson(e.target.value)} placeholder={initial.clientEmail ? "Leave blank to keep the existing key" : "Paste the full service account JSON here"} className="font-mono text-xs" />
      </label>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
