"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClaimCompanyButton({ companyId, claimed }: { companyId: string; claimed: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (claimed) {
    return <span className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground">Claimed</span>;
  }

  const claim = async () => {
    if (status !== "authenticated") { router.push("/login"); return; }
    if (!confirm("Claim this company? You'll be able to manage its profile after verification.")) return;
    setBusy(true);
    const res = await fetch(`/api/companies/${companyId}/claim`, { method: "POST" });
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setDone(true);
      toast.success("Claim submitted — manage it from your dashboard");
      router.push("/dashboard/company");
    } else {
      toast.error(data?.error ?? "Could not submit claim");
    }
  };

  if (done) return <span className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground">Claim pending</span>;

  return (
    <Button variant="outline" size="sm" onClick={claim} disabled={busy} className="gap-1.5">
      <ShieldCheck className="size-4" /> Claim
    </Button>
  );
}
