"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

/** Client-side mirror of the server parser for instant counts. */
function parse(text: string) {
  const seen = new Set<string>();
  let total = 0, duplicates = 0, invalid = 0, valid = 0;
  for (const line of text.split(/\r?\n/)) {
    const display = line.trim().replace(/\s+/g, " ");
    if (!display) { invalid += 1; continue; }
    total += 1;
    const norm = display.toLowerCase();
    if (seen.has(norm)) { duplicates += 1; continue; }
    seen.add(norm); valid += 1;
  }
  return { total, duplicates, invalid, valid };
}

export function BulkAddKeywords() {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [targetUrl, setTargetUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const counts = React.useMemo(() => parse(text), [text]);

  const submit = async () => {
    if (counts.valid === 0 || busy) return;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/rank/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, group: group || undefined, targetUrl: targetUrl || undefined }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (res.ok) {
      setResult(`Added ${res.added} new · ${res.skippedExisting} already existed · ${res.duplicatesInPaste} duplicates in paste.`);
      setText("");
      router.refresh();
    } else {
      setResult(res.error ?? "Could not import keywords.");
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        rows={8}
        placeholder={"Paste keywords — one per line, e.g.\nnotion alternatives\nbest free vpn\nfigma vs sketch"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-mono text-sm"
      />
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Valid: <span className="font-semibold text-foreground">{counts.valid.toLocaleString()}</span></span>
        <span>Duplicates: <span className="font-semibold">{counts.duplicates.toLocaleString()}</span></span>
        <span>Blank: <span className="font-semibold">{counts.invalid.toLocaleString()}</span></span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Group (optional) — e.g. Alternatives" value={group} onChange={(e) => setGroup(e.target.value)} />
        <Input placeholder="Target URL (optional) — e.g. /tools/notion" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={busy || counts.valid === 0}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add {counts.valid > 0 ? counts.valid.toLocaleString() : ""} keywords
        </Button>
        {result && <p className="text-xs text-muted-foreground">{result}</p>}
      </div>
    </div>
  );
}
