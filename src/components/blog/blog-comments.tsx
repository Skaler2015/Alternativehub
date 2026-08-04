"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { getInitials, timeAgo } from "@/lib/utils";

type Comment = {
  id: string; body: string; createdAt: string | Date;
  user: { id: string; name: string | null; image: string | null };
};

export function BlogComments({ postId, initial }: { postId: string; initial: Comment[] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comments, setComments] = React.useState<Comment[]>(initial);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const currentUserId = session?.user?.id;
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  const submit = async () => {
    if (status !== "authenticated") { router.push("/login"); return; }
    if (body.trim().length < 2) return;
    setBusy(true);
    const res = await fetch(`/api/blog/${postId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
    });
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.comment) {
      setComments((cs) => [data.comment, ...cs]);
      setBody("");
      toast.success("Comment posted");
    } else {
      toast.error(data?.error ?? "Could not post comment");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    setComments((cs) => cs.filter((c) => c.id !== id));
    const res = await fetch(`/api/blog/comments/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Could not delete"); router.refresh(); }
  };

  return (
    <section id="comments" className="mt-12 border-t pt-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="size-5" /> Comments ({comments.length})
      </h2>

      <div className="space-y-2">
        <Textarea
          placeholder={status === "authenticated" ? "Share your thoughts…" : "Log in to comment"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          disabled={status !== "authenticated"}
        />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={busy || body.trim().length < 2} size="sm">
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Post comment"}
          </Button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Be the first to comment.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {comments.map((c) => (
            <article key={c.id} className="flex gap-3">
              <Avatar className="size-8 shrink-0"><AvatarImage src={c.user.image ?? undefined} /><AvatarFallback>{getInitials(c.user.name ?? "A")}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.user.name ?? "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                  {(c.user.id === currentUserId || isStaff) && (
                    <button onClick={() => remove(c.id)} className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Delete comment">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{c.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
