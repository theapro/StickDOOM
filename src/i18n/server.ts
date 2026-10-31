import type { Metadata } from "next";
import { lang } from "next/root-params";
import { defaultLocale, hasLocale, localePath, locales, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return hasLocale(value) ? value : defaultLocale;
}

/** The current language, its dictionary and a helper for language-prefixed links. */
export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: dictionaries[locale],
    href: (path: string) => localePath(locale, path),
  };
}

/** Canonical URL for the current language plus `hreflang` links to the other versions of a page. */
export function languageAlternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((value) => [value, localePath(value, path)])),
      "x-default": localePath(defaultLocale, path),
    },
  };
}
