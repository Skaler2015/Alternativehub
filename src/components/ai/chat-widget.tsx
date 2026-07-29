"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { ToolLogo } from "@/components/tools/tool-logo";
import { cn } from "@/lib/utils";

type ChatTool = {
  slug: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  category: string;
  pricingModel: string;
  rating: number;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  tools?: ChatTool[];
};

const SUGGESTIONS = [
  "Free alternatives to Photoshop",
  "Best AI tool for coding",
  "Open-source password manager",
];

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. Tell me what you're looking for and I'll find the best tools and alternatives for you.",
    },
  ]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    const history = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.answer, tools: data.tools }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.error ?? "Something went wrong. Try again." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
        className={cn(
          "fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105",
          "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 shadow-violet-500/30",
        )}
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-5 z-40 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border bg-popover soft-shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-4 py-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <Bot className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">AI Assistant</p>
                <p className="text-[11px] text-muted-foreground">Find your next favorite tool</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                    {m.tools && m.tools.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {m.tools.map((t) => (
                          <Link
                            key={t.slug}
                            href={`/tools/${t.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-xl bg-background/80 p-2 transition-colors hover:bg-background"
                          >
                            <ToolLogo name={t.name} logoUrl={t.logoUrl} size={28} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{t.name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{t.tagline}</p>
                            </div>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{t.rating.toFixed(1)}★</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3.5 py-2.5">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any tool..."
                className="flex-1 rounded-full border bg-background px-3.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
