"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FollowCompanyButton({
  companyId,
  initialFollowing,
  initialFollowers,
}: {
  companyId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = React.useState(initialFollowing);
  const [busy, setBusy] = React.useState(false);

  const toggle = async () => {
    if (status !== "authenticated") { router.push("/login"); return; }
    setBusy(true);
    const next = !following;
    setFollowing(next);
    const res = await fetch(`/api/companies/${companyId}/follow`, { method: next ? "POST" : "DELETE" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data) setFollowing(data.following);
    } else {
      setFollowing(!next);
      toast.error("Could not update follow");
    }
  };

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} disabled={busy} className="gap-1.5">
      {following ? <><BellRing className="size-4" /> Following</> : <><Bell className="size-4" /> Follow</>}
    </Button>
  );
}
