import { Mail, Users, UserMinus, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OpsButton } from "@/components/admin/ops-button";
import { emailEnabled } from "@/lib/email";
import { formatNumber, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const [total, active, unsubscribed, recent] = await Promise.all([
    prisma.newsletterSubscriber.count().catch(() => 0),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }).catch(() => 0),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }).catch(() => 0),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 25, select: { email: true, createdAt: true, unsubscribedAt: true } }).catch(() => []),
  ]);

  const email = emailEnabled();

  const cards = [
    { label: "Total", value: total, icon: Mail },
    { label: "Active", value: active, icon: Users },
    { label: "Unsubscribed", value: unsubscribed, icon: UserMinus },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
        <p className="mt-1 text-sm text-muted-foreground">Subscribers and the weekly digest</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5">
            <c.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{formatNumber(c.value)}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Send className="size-4" /></span>
          <div>
            <p className="text-sm font-medium">Send weekly digest now</p>
            <p className="text-xs text-muted-foreground">
              Emails this week's freshest tools to all active subscribers.
              {!email && <span className="text-warning"> Requires RESEND_API_KEY.</span>}
            </p>
          </div>
        </div>
        {email
          ? <OpsButton action="send-digest" label="Send digest" confirmText={`Send the digest to ${active} subscribers now?`} />
          : <span className="text-xs text-muted-foreground">Disabled</span>}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Recent subscribers</h2>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No subscribers yet.</p>
        ) : (
          <div className="divide-y rounded-2xl border bg-card">
            {recent.map((s) => (
              <div key={s.email} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className={s.unsubscribedAt ? "text-muted-foreground line-through" : ""}>{s.email}</span>
                <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
