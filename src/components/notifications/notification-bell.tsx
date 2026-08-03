"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";

type Notif = {
  id: string; type: string; title: string; body: string | null;
  link: string | null; readAt: string | null; createdAt: string;
};

export function NotificationBell() {
  const { status } = useSession();
  const [items, setItems] = React.useState<Notif[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadedOnce, setLoadedOnce] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json().catch(() => null);
    setLoading(false);
    setLoadedOnce(true);
    if (res.ok) { setItems(data.notifications ?? []); setUnread(data.unread ?? 0); }
  }, []);

  // Poll the unread count while signed in (light: count comes with the list fetch).
  React.useEffect(() => {
    if (status !== "authenticated") return;
    void load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [status, load]);

  const markAll = async () => {
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  };

  const markOne = async (id: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnread((n) => Math.max(0, n - 1));
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  };

  if (status !== "authenticated") return null;

  return (
    <DropdownMenu onOpenChange={(o) => o && !loadedOnce && load()}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Notifications">
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button onClick={markAll} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up 🎉</p>
          ) : (
            items.map((n) => {
              const inner = (
                <>
                  <div className="flex items-start gap-2">
                    {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                    <div className={cn("min-w-0", n.readAt && "pl-4")}>
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </>
              );
              const cls = cn("block w-full px-3 py-2.5 text-left transition-colors hover:bg-accent", !n.readAt && "bg-primary/5");
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => markOne(n.id)} className={cls}>{inner}</Link>
              ) : (
                <button key={n.id} onClick={() => markOne(n.id)} className={cls}>{inner}</button>
              );
            })
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard/notifications">View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
