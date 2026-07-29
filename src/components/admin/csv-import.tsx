"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Switch, Label } from "@/components/ui/misc";

const EXAMPLE = `name,websiteUrl,description,categorySlug,pricingModel
Linear,https://linear.app,"Purpose-built issue tracking for modern software teams",productivity,SUBSCRIPTION
Raycast,https://raycast.com,"Blazingly fast launcher for macOS with extensions",apps,FREEMIUM`;

export function CsvImport() {
  const [csv, setCsv] = React.useState("");
  const [enrich, setEnrich] = React.useState(true);
  const [autoPublish, setAutoPublish] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; skipped: string[] } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, enrich, autoPublish }),
    });
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setResult(data);
      toast.success(`Imported ${data.imported} tools`);
    } else {
      toast.error(data?.error ?? "Import failed");
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6">
      <Textarea
        rows={10}
        placeholder={EXAMPLE}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        className="font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={enrich} onCheckedChange={setEnrich} />
          <Label>AI enrichment</Label>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
          <Label>Publish immediately</Label>
        </label>
        <Button onClick={run} disabled={busy || !csv.trim()} className="ml-auto">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          {busy ? "Importing..." : "Run import"}
        </Button>
      </div>

      {result && (
        <div className="rounded-xl border bg-background p-4 text-sm">
          <p className="font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Imported {result.imported} tools
          </p>
          {result.skipped.length > 0 && (
            <div className="mt-2 text-muted-foreground">
              <p className="font-medium">Skipped:</p>
              <ul className="mt-1 list-inside list-disc">
                {result.skipped.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
