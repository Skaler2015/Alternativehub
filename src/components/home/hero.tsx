"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { SearchCommand } from "@/components/search/search-command";
import { SEARCH_PLACEHOLDERS, TRENDING_SEARCHES } from "@/lib/constants";

export function Hero({ toolCount }: { toolCount: number }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length),
      2600,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden border-b">
      <div className="aurora" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3 text-primary" />
            {toolCount > 0 ? `${toolCount}+ tools, AI-analyzed & community-rated` : "AI-analyzed & community-rated"}
          </span>
        </motion.div>

        <motion.h1
          className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          Discover <span className="text-gradient">Better Alternatives</span>
          <br />
          to any app or tool
        </motion.h1>

        <motion.p
          className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          The most advanced way to find alternatives for apps, websites, AI tools, desktop
          software, SaaS, extensions, APIs and games — ranked by real users and AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={() => setSearchOpen(true)}
            className="group mx-auto mt-8 flex h-14 w-full max-w-xl items-center gap-3 rounded-2xl border bg-card/70 px-5 text-left soft-shadow backdrop-blur transition-all hover:border-primary/40 hover:soft-shadow-lg"
          >
            <Search className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="flex-1 truncate text-muted-foreground" aria-live="polite">
              {SEARCH_PLACEHOLDERS[placeholderIndex]}
            </span>
            <kbd className="hidden rounded-lg border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground sm:block">
              ⌘K
            </kbd>
          </button>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Trending:</span>
            {TRENDING_SEARCHES.slice(0, 4).map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="group inline-flex items-center gap-1 rounded-full border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {term}
                <ArrowRight className="size-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </section>
  );
}
