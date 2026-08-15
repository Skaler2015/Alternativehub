"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type RankSettingsData = {
  name: string;
  domain: string;
  country: string;
  language: string;
  device: "DESKTOP" | "MOBILE";
  rankDepth: number;
  active: boolean;
  autoTracking: boolean;
  frequency: string;
  preferredHour: number;
  intervalDays: number;
  timezone: string;
  historyRetentionDays: number;
  provider: string;
  maskedApiKey: string;
  maskedApiSecret: string;
  endpoint: string;
  requestsPerMinute: number;
  batchSize: number;
  requestDelayMs: number;
  maxRetries: number;
  dailyQuota: number | null;
};

const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const lbl = "text-xs font-medium text-muted-foreground";

export function RankSettingsForm({ initial }: { initial: RankSettingsData }) {
  const router = useRouter();
  const [s, setS] = React.useState(initial);
  const [apiKey, setApiKey] = React.useState("");
  const [apiSecret, setApiSecret] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const set = <K extends keyof RankSettingsData>(k: K, v: RankSettingsData[K]) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/rank/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...s,
        apiKey: apiKey || undefined, // blank keeps existing
        apiSecret: apiSecret || undefined,
      }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    setBusy(false);
    setMsg(res.ok ? "Saved." : res.error ?? "Could not save.");
    if (res.ok) { setApiKey(""); setApiSecret(""); router.refresh(); }
  };

  return (
    <div className="space-y-8">
      {/* Search settings */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Website &amp; search settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1"><span className={lbl}>Project name</span><Input value={s.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className="space-y-1"><span className={lbl}>Domain</span><Input value={s.domain} onChange={(e) => set("domain", e.target.value)} placeholder="www.alternativehub.in" /></label>
          <label className="space-y-1"><span className={lbl}>Country (ISO-2)</span><Input value={s.country} onChange={(e) => set("country", e.target.value)} placeholder="in" /></label>
          <label className="space-y-1"><span className={lbl}>Language (ISO)</span><Input value={s.language} onChange={(e) => set("language", e.target.value)} placeholder="en" /></label>
          <label className="space-y-1">
            <span className={lbl}>Device</span>
            <select className={field} value={s.device} onChange={(e) => set("device", e.target.value as "DESKTOP" | "MOBILE")}>
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className={lbl}>Search depth</span>
            <select className={field} value={s.rankDepth} onChange={(e) => set("rankDepth", Number(e.target.value))}>
              {[10, 20, 50, 100].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Automation */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Automatic tracking</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.autoTracking} onChange={(e) => set("autoTracking", e.target.checked)} /> Enable automatic tracking</label>
          <label className="space-y-1">
            <span className={lbl}>Frequency</span>
            <select className={field} value={s.frequency} onChange={(e) => set("frequency", e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom (every N days)</option>
            </select>
          </label>
          {s.frequency === "custom" && (
            <label className="space-y-1"><span className={lbl}>Interval (days)</span><Input type="number" value={s.intervalDays} onChange={(e) => set("intervalDays", Number(e.target.value))} /></label>
          )}
          <label className="space-y-1"><span className={lbl}>Preferred hour (0-23)</span><Input type="number" value={s.preferredHour} onChange={(e) => set("preferredHour", Number(e.target.value))} /></label>
          <label className="space-y-1"><span className={lbl}>Timezone</span><Input value={s.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Kolkata" /></label>
          <label className="space-y-1">
            <span className={lbl}>History retention (days)</span>
            <select className={field} value={s.historyRetentionDays} onChange={(e) => set("historyRetentionDays", Number(e.target.value))}>
              {[30, 90, 180, 365, 3650].map((d) => <option key={d} value={d}>{d === 3650 ? "Forever" : d}</option>)}
            </select>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatic tracking uses the daily cron. Make sure <code className="rounded bg-muted px-1">CRON_SECRET</code> is set in Vercel.
        </p>
      </section>

      {/* Provider */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Rank provider (real SERP data)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={lbl}>Provider</span>
            <select className={field} value={s.provider} onChange={(e) => set("provider", e.target.value)}>
              <option value="none">None (not configured)</option>
              <option value="serpapi">SerpApi</option>
              <option value="dataforseo">DataForSEO</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className={lbl}>API key {s.maskedApiKey && <span className="text-muted-foreground">(current: {s.maskedApiKey})</span>}</span>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={s.maskedApiKey ? "Leave blank to keep" : "Paste API key"} autoComplete="off" />
          </label>
          <label className="space-y-1">
            <span className={lbl}>API secret {s.maskedApiSecret && <span className="text-muted-foreground">(current: {s.maskedApiSecret})</span>} {s.provider === "dataforseo" ? "" : "(if required)"}</span>
            <Input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder={s.maskedApiSecret ? "Leave blank to keep" : "Paste API secret"} autoComplete="off" />
          </label>
          <label className="space-y-1"><span className={lbl}>Custom endpoint (optional)</span><Input value={s.endpoint} onChange={(e) => set("endpoint", e.target.value)} placeholder="default" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="space-y-1"><span className={lbl}>Requests/min</span><Input type="number" value={s.requestsPerMinute} onChange={(e) => set("requestsPerMinute", Number(e.target.value))} /></label>
          <label className="space-y-1"><span className={lbl}>Batch size</span><Input type="number" value={s.batchSize} onChange={(e) => set("batchSize", Number(e.target.value))} /></label>
          <label className="space-y-1"><span className={lbl}>Delay (ms)</span><Input type="number" value={s.requestDelayMs} onChange={(e) => set("requestDelayMs", Number(e.target.value))} /></label>
          <label className="space-y-1"><span className={lbl}>Max retries</span><Input type="number" value={s.maxRetries} onChange={(e) => set("maxRetries", Number(e.target.value))} /></label>
        </div>
        <p className="text-xs text-muted-foreground">
          Keys are encrypted before storage and never shown in full. Real Google rank data requires a paid SERP API — no reliable free option exists.
        </p>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
