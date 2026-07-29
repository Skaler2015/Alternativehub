"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Bookmark,
  Check,
  Copy,
  Flag,
  Link2,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";

export function ToolActions({
  slug,
  name,
  upvotes,
  bookmarked: initialBookmarked,
  voted: initialVoted,
}: {
  slug: string;
  name: string;
  upvotes: number;
  bookmarked?: boolean;
  voted?: "UP" | "DOWN" | null;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked ?? false);
  const [voted, setVoted] = React.useState<"UP" | "DOWN" | null>(initialVoted ?? null);
  const [voteCount, setVoteCount] = React.useState(upvotes);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("BROKEN_LINK");
  const [reportDetail, setReportDetail] = React.useState("");

  const requireAuth = () => {
    if (status !== "authenticated") {
      toast.info("Log in to continue");
      router.push("/login");
      return false;
    }
    return true;
  };

  const vote = async (type: "UP" | "DOWN") => {
    if (!requireAuth()) return;
    const prev = { voted, voteCount };
    const next = voted === type ? null : type;
    setVoted(next);
    setVoteCount((c) => c + (type === "UP" ? (next === "UP" ? 1 : -1) : 0));
    const res = await fetch(`/api/tools/${slug}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) {
      setVoted(prev.voted);
      setVoteCount(prev.voteCount);
      toast.error("Vote failed — try again");
    }
  };

  const toggleBookmark = async () => {
    if (!requireAuth()) return;
    const next = !bookmarked;
    setBookmarked(next);
    const res = await fetch(`/api/tools/${slug}/bookmark`, {
      method: next ? "POST" : "DELETE",
    });
    if (!res.ok) {
      setBookmarked(!next);
      toast.error("Could not update bookmark");
    } else {
      toast.success(next ? "Added to bookmarks" : "Removed from bookmarks");
    }
  };

  const share = async (target: "copy" | "twitter") => {
    const url = window.location.href;
    if (target === "copy") {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } else {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${name} — found on AlternativeHub`)}&url=${encodeURIComponent(url)}`,
        "_blank",
      );
    }
  };

  const submitReport = async () => {
    const res = await fetch(`/api/tools/${slug}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason, detail: reportDetail || undefined }),
    });
    if (res.ok) {
      toast.success("Report submitted — thank you");
      setReportOpen(false);
      setReportDetail("");
    } else {
      toast.error("Could not submit report");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center overflow-hidden rounded-lg border">
        <button
          onClick={() => vote("UP")}
          aria-label="Upvote"
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            voted === "UP" && "bg-primary/10 text-primary",
          )}
        >
          <ThumbsUp className="size-4" /> {formatNumber(voteCount)}
        </button>
        <span className="h-5 w-px bg-border" />
        <button
          onClick={() => vote("DOWN")}
          aria-label="Downvote"
          className={cn(
            "px-3 py-2 transition-colors hover:bg-accent",
            voted === "DOWN" && "bg-destructive/10 text-destructive",
          )}
        >
          <ThumbsDown className="size-4" />
        </button>
      </div>

      <Button
        variant={bookmarked ? "default" : "outline"}
        size="sm"
        onClick={toggleBookmark}
        className="gap-1.5"
      >
        {bookmarked ? <Check className="size-4" /> : <Bookmark className="size-4" />}
        {bookmarked ? "Saved" : "Bookmark"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="size-4" /> Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => share("copy")}>
            <Copy /> Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => share("twitter")}>
            <Twitter /> Share on X
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              navigator.share?.({ title: name, url: window.location.href }).catch(() => {})
            }
          >
            <Link2 /> More options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setReportOpen(true)}
      >
        <Flag className="size-4" /> Report
      </Button>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {name}</DialogTitle>
            <DialogDescription>
              Help us keep listings accurate. What&apos;s wrong with this tool?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BROKEN_LINK">Broken link</SelectItem>
                <SelectItem value="INCORRECT_INFO">Incorrect information</SelectItem>
                <SelectItem value="SPAM">Spam</SelectItem>
                <SelectItem value="DUPLICATE">Duplicate listing</SelectItem>
                <SelectItem value="OFFENSIVE">Offensive content</SelectItem>
                <SelectItem value="MALWARE">Malware / unsafe</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Add details (optional)"
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
            />
            <Button onClick={submitReport} className="w-full">
              Submit report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
