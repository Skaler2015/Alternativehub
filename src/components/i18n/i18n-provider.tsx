"use client";

import * as React from "react";
import { en, type TranslationKey } from "@/lib/i18n/dictionaries/en";
import type { FlatDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type I18nContextValue = {
  locale: Locale;
  t: (key: TranslationKey, fallback?: string) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: FlatDictionary;
  children: React.ReactNode;
}) {
  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, fallback) => dict[key] ?? en[key] ?? fallback ?? key,
    }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Client hook: const { t, locale } = useT(). */
export function useT(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components never crash outside the provider (e.g. in tests)
    return { locale: "en", t: (key, fallback) => en[key] ?? fallback ?? key };
  }
  return ctx;
}
