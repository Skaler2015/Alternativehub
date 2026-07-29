"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Search, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/tools/tool-logo";
import { TRENDING_SEARCHES } from "@/lib/constants";
import { PRICING_LABELS } from "@/lib/constants";
import type { SearchHit } from "@/lib/search";
import { track } from "@/lib/analytics";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
};

/** ⌘K command palette: instant, typo-tolerant search with voice input. */
export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);

  // Global ⌘K / Ctrl+K shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Debounced instant search
  React.useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setHits(data.hits ?? []);
        setActive(0);
      } catch {
        // aborted or failed — keep previous results
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const go = React.useCallback(
    (path: string) => {
      const q = query.trim();
      if (q) track({ type: "SEARCH", query: q });
      onOpenChange(false);
      setQuery("");
      router.push(path);
    },
    [onOpenChange, router, query],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[active]) go(`/tools/${hits[active].slug}`);
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const toggleVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (event) => setQuery(event.results[0][0].transcript);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 p-0" showClose={false}>
        <DialogTitle className="sr-only">Search AlternativeHub</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder")}
            className="h-13 w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={toggleVoice}
            aria-label="Voice search"
            className={cn(
              "rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
              listening && "animate-pulse text-destructive",
            )}
          >
            <Mic className="size-4" />
          </button>
          <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() && (
            <div className="px-2 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TrendingUp className="size-3.5" /> {t("search.trending")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hits.map((hit, i) => (
            <button
              key={hit.id}
              onClick={() => go(`/tools/${hit.slug}`)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                i === active && "bg-accent",
              )}
            >
              <ToolLogo name={hit.name} logoUrl={hit.logoUrl} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{hit.name}</span>
                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    {hit.category}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">{hit.tagline}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {PRICING_LABELS[hit.pricingModel] ?? hit.pricingModel}
              </span>
            </button>
          ))}

          {query.trim() && !loading && hits.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("search.noResults")} &ldquo;{query}&rdquo;
            </p>
          )}

          {query.trim() && hits.length > 0 && (
            <button
              onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}
              className="mt-1 w-full rounded-xl border border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t("search.seeAll")} &ldquo;{query}&rdquo; →
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
