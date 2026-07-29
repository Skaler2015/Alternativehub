import { Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const messages = await prisma.contactMessage
    .findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Messages sent via the contact form</p>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No messages yet.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <article key={m.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground hover:text-primary">
                      {m.email}
                    </a>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(m.createdAt)}</span>
              </div>
              {m.subject && <p className="mt-3 text-sm font-medium">{m.subject}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
