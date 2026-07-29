import { en, type TranslationKey } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";
import { DEFAULT_LOCALE, type Locale } from "./config";

const DICTS: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en,
  hi,
};

export type Translator = (key: TranslationKey, fallback?: string) => string;

/** Build a translator for a locale. Missing keys fall back to English, then to the key/fallback. */
export function createTranslator(locale: Locale): Translator {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  return (key, fallback) => dict[key] ?? en[key] ?? fallback ?? key;
}

export type { TranslationKey };
export type FlatDictionary = Partial<Record<TranslationKey, string>>;

/** The full string map for a locale (English base merged with locale overrides) — sent to the client provider. */
export function getFlatDictionary(locale: Locale): FlatDictionary {
  if (locale === DEFAULT_LOCALE) return en;
  return { ...en, ...DICTS[locale] };
}
