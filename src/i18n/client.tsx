"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localePath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  href: (path: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: ReactNode }) {
  const value = useMemo(
    () => ({ locale, t: dictionary, href: (path: string) => localePath(locale, path) }),
    [locale, dictionary],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return value;
}
