"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

/** Minimal CSV parser that handles quoted fields, commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row); }
  return rows;
}

const NONE = "—";

export function CsvImport() {
  const router = useRouter();
  const [raw, setRaw] = React.useState("");
  const [hasHeader, setHasHeader] = React.useState(true);
  const [map, setMap] = React.useState({ keyword: "0", targetUrl: NONE, group: NONE });
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  const grid = React.useMemo(() => parseCsv(raw), [raw]);
  const headerRow = grid[0] ?? [];
  const dataRows = hasHeader ? grid.slice(1) : grid;
  const colCount = Math.max(0, ...grid.map((r) => r.length));
  const colOptions = Array.from({ length: colCount }, (_, i) => String(i));

  // Auto-detect columns from header names on first parse.
  React.useEffect(() => {
    if (!hasHeader || headerRow.length === 0) return;
    const find = (re: RegExp) => {
      const idx = headerRow.findIndex((h) => re.test(h.trim().toLowerCase()));
      return idx >= 0 ? String(idx) : NONE;
    };
    setMap({
      keyword: find(/keyword|query|term/) !== NONE ? find(/keyword|query|term/) : "0",
      targetUrl: find(/target|url|page/),
      group: find(/group|category|cluster/),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, hasHeader]);

  const preview = React.useMemo(() => {
    const kIdx = Number(map.keyword);
    const seen = new Set<string>();
    let valid = 0, duplicate = 0, invalid = 0;
    for (const r of dataRows) {
      const kw = (r[kIdx] ?? "").trim().replace(/\s+/g, " ");
      if (!kw) { invalid++; continue; }
      const norm = kw.toLowerCase();
      if (seen.has(norm)) { duplicate++; continue; }
      seen.add(norm); valid++;
    }
    return { total: dataRows.length, valid, duplicate, invalid };
  }, [dataRows, map.keyword]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const submit = async () => {
    if (preview.valid === 0 || busy) return;
    setBusy(true);
    setResult(null);
    const kIdx = Number(map.keyword);
    const tIdx = map.targetUrl === NONE ? -1 : Number(map.targetUrl);
    const gIdx = map.group === NONE ? -1 : Number(map.group);
    const rows = dataRows
      .map((r) => ({
        keyword: (r[kIdx] ?? "").trim(),
        targetUrl: tIdx >= 0 ? (r[tIdx] ?? "").trim() : undefined,
        groupName: gIdx >= 0 ? (r[gIdx] ?? "").trim() : undefined,
      }))
      .filter((r) => r.keyword);
    const res = await fetch("/api/admin/rank/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (res.ok) { setResult(`Imported: ${res.added} new, ${res.skippedExisting} already existed.`); setRaw(""); router.refresh(); }
    else setResult(res.error ?? "Import failed.");
  };

  const Select = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border bg-background px-2 py-1.5 text-sm">
      <option value={NONE}>{NONE}</option>
      {colOptions.map((c) => (
        <option key={c} value={c}>{hasHeader && headerRow[Number(c)] ? headerRow[Number(c)] : `Column ${Number(c) + 1}`}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-primary/40">
          <FileUp className="size-4" /> Upload CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} /> First row is a header</label>
      </div>

      <Textarea rows={6} placeholder={"…or paste CSV here, e.g.\nKeyword,Target URL,Group\nnotion alternatives,/tools/notion,Alternatives"} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono text-xs" />

      {colCount > 0 && (
        <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
          <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Keyword column *</span><div><Select value={map.keyword} onChange={(v) => setMap((m) => ({ ...m, keyword: v }))} /></div></label>
          <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Target URL</span><div><Select value={map.targetUrl} onChange={(v) => setMap((m) => ({ ...m, targetUrl: v }))} /></div></label>
          <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Group</span><div><Select value={map.group} onChange={(v) => setMap((m) => ({ ...m, group: v }))} /></div></label>
        </div>
      )}

      {raw && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Total rows: <b className="text-foreground">{preview.total}</b></span>
          <span>Valid: <b className="text-foreground">{preview.valid}</b></span>
          <span>Duplicates: <b>{preview.duplicate}</b></span>
          <span>Invalid: <b>{preview.invalid}</b></span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={busy || preview.valid === 0}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Import {preview.valid > 0 ? preview.valid : ""} keywords
        </Button>
        {result && <p className="text-xs text-muted-foreground">{result}</p>}
      </div>
    </div>
  );
}
