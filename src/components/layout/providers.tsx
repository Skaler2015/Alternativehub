"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import type { FlatDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export function Providers({
  children,
  locale,
  dict,
}: {
  children: React.ReactNode;
  locale: Locale;
  dict: FlatDictionary;
}) {
  return (
    <SessionProvider>
      <I18nProvider locale={locale} dict={dict}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
