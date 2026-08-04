import Link from "next/link";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { MarkAllRead } from "@/components/notifications/mark-all-read";
import { EnablePush } from "@/components/notifications/enable-push";
import { cn, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, body: true, link: true, readAt: true, createdAt: true },
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Bell className="size-6 text-primary" /> Notifications</h1>
        <div className="flex items-center gap-2">
          <EnablePush />
          <MarkAllRead hasUnread={hasUnread} />
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          You&apos;re all caught up 🎉 — notifications about your tools and reviews will appear here.
        </p>
      ) : (
        <div className="divide-y rounded-2xl border bg-card">
          {notifications.map((n) => {
            const body = (
              <div className="flex items-start gap-3 p-4">
                {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                <div className={cn("min-w-0", n.readAt && "pl-5")}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block transition-colors hover:bg-accent">{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
