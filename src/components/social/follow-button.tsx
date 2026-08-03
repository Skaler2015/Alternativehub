"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FollowButton({
  userId,
  initialFollowing,
  initialFollowers,
}: {
  userId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = React.useState(initialFollowing);
  const [followers, setFollowers] = React.useState(initialFollowers);
  const [busy, setBusy] = React.useState(false);

  const toggle = async () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setBusy(true);
    const next = !following;
    // optimistic
    setFollowing(next);
    setFollowers((n) => n + (next ? 1 : -1));
    const res = await fetch(`/api/users/${userId}/follow`, { method: next ? "POST" : "DELETE" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data) { setFollowing(data.following); setFollowers(data.followers); }
    } else {
      setFollowing(!next);
      setFollowers((n) => n + (next ? -1 : 1));
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not update follow");
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={busy}
      className="gap-1.5"
    >
      {following ? <><UserCheck className="size-4" /> Following</> : <><UserPlus className="size-4" /> Follow</>}
    </Button>
  );
}
