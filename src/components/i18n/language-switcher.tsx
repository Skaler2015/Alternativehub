"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useT();
  const [pending, setPending] = React.useState<Locale | null>(null);

  const change = (next: Locale) => {
    if (next === locale) return;
    setPending(next);
    // 1-year cookie; readable by server components on the next request
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change language">
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => change(l)} className="gap-2">
            <span>{LOCALE_LABELS[l].flag}</span>
            <span className="flex-1">{LOCALE_LABELS[l].native}</span>
            {(pending ?? locale) === l && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
