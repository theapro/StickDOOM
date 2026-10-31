export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uz";

/** Remembers the visitor's language choice for URLs without a language prefix. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** A value written once per language, e.g. a pack description. */
export type Localized<T = string> = Record<Locale, T>;

export const localeNames: Localized = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefixes an app path with the language: "/explore" → "/uz/explore", "/#about" → "/uz#about". */
export function localePath(locale: Locale, path: string) {
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** The same page in another language: swaps the leading language segment of a pathname. */
export function switchLocalePath(pathname: string, locale: Locale) {
  const [, first, ...rest] = pathname.split("/");
  const tail = hasLocale(first ?? "") ? rest : [first, ...rest].filter(Boolean);
  return tail.length ? `/${locale}/${tail.join("/")}` : `/${locale}`;
}
