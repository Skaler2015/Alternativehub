"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(t("newsletter.success"));
      setEmail("");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? t("newsletter.error"));
    }
  };

  return (
    <form onSubmit={submit} className={cn("flex w-full gap-2", compact ? "max-w-sm" : "mx-auto max-w-md")}>
      <Input
        type="email"
        required
        placeholder={t("newsletter.placeholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
        className="bg-background"
      />
      <Button type="submit" disabled={loading} variant={compact ? "default" : "gradient"}>
        <Mail className="size-4" />
        {loading ? "..." : t("newsletter.cta")}
      </Button>
    </form>
  );
}
