"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

const KEY = "ah-cookie-consent";

/** Minimal, non-blocking cookie notice. Shows once until dismissed (localStorage). */
export function CookieConsent() {
  const { t } = useT();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // localStorage unavailable — don't nag
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl animate-fade-in rounded-2xl border bg-popover/95 p-4 soft-shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="size-5" />
        </span>
        <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
          {t("cookie.text")}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t("cookie.learnMore")}
          </Link>
        </p>
        <Button size="sm" onClick={accept} className="shrink-0">
          {t("cookie.accept")}
        </Button>
      </div>
    </div>
  );
}
