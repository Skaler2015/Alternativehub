"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

export function KeywordActions({ id, configured }: { id: string; configured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"check" | "delete" | null>(null);
  const [note, setNote] = React.useState<string>("");

  const check = async () => {
    if (busy) return;
    setBusy("check");
    setNote("");
    const res = await fetch("/api/admin/rank/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "single", keywordId: id }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    setBusy(null);
    if (res.ok && res.configured === false) setNote("Provider not configured");
    else if (res.ok) setNote(res.rank != null ? `#${res.rank}` : "Not ranking");
    else setNote(res.error ?? "Failed");
    router.refresh();
  };

  const remove = async () => {
    if (busy || !confirm("Delete this keyword and its history?")) return;
    setBusy("delete");
    await fetch("/api/admin/rank/keywords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
    setBusy(null);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
      <button
        type="button"
        onClick={check}
        disabled={!configured || busy !== null}
        title={configured ? "Check now" : "Provider not configured"}
        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
      >
        {busy === "check" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Check
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy !== null}
        title="Delete"
        className="inline-flex items-center rounded-lg border px-2 py-1 text-xs text-rose-600 transition-colors hover:border-rose-400 disabled:opacity-50 dark:text-rose-400"
      >
        {busy === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </button>
    </div>
  );
}
