"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Scale, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToolLogo } from "@/components/tools/tool-logo";
import type { SearchHit } from "@/lib/search";

/** Pick 2–4 tools via instant search, then navigate to /compare/a-vs-b(-vs-c). */
export function CompareBuilder() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<SearchHit[]>([]);
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setHits(
          (data.hits ?? []).filter(
            (h: SearchHit) => !selected.some((s) => s.id === h.id),
          ),
        );
      } catch {
        // ignore
      }
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, selected]);

  const add = (hit: SearchHit) => {
    if (selected.length >= 4) {
      toast.info("Maximum 4 tools per comparison");
      return;
    }
    setSelected((s) => [...s, hit]);
    setQuery("");
    setHits([]);
  };

  const go = () => {
    if (selected.length < 2) {
      toast.info("Pick at least 2 tools to compare");
      return;
    }
    router.push(`/compare/${selected.map((s) => s.slug).join("-vs-")}`);
  };

  return (
    <div className="rounded-2xl border bg-card p-5 soft-shadow">
      <div className="flex flex-wrap items-center gap-3">
        {selected.map((tool, i) => (
          <React.Fragment key={tool.id}>
            {i > 0 && <span className="text-sm font-bold text-muted-foreground">VS</span>}
            <span className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
              <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={24} />
              <span className="text-sm font-medium">{tool.name}</span>
              <button
                onClick={() => setSelected((s) => s.filter((t) => t.id !== tool.id))}
                aria-label={`Remove ${tool.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </React.Fragment>
        ))}

        {selected.length < 4 && (
          <div className="relative">
            {selected.length > 0 && (
              <span className="mr-3 text-sm font-bold text-muted-foreground">
                {selected.length > 0 ? "VS" : ""}
              </span>
            )}
            <div className="relative inline-block">
              <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2">
                <Plus className="size-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 200)}
                  placeholder="Add a tool..."
                  className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {open && hits.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border bg-popover p-1.5 soft-shadow-lg">
                  {hits.slice(0, 6).map((hit) => (
                    <button
                      key={hit.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        add(hit);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent"
                    >
                      <ToolLogo name={hit.name} logoUrl={hit.logoUrl} size={28} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{hit.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{hit.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <Button onClick={go} disabled={selected.length < 2} variant="gradient" className="ml-auto">
          <Scale className="size-4" /> Compare {selected.length >= 2 ? `(${selected.length})` : ""}
        </Button>
      </div>
    </div>
  );
}
