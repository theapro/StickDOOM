"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { LOCALE_COOKIE, localeNames, locales, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/** Links to the current page in every language; the choice is remembered for unprefixed URLs. */
export function LanguageSwitcher({ className, onSelect }: { className?: string; onSelect?: () => void }) {
  const { locale: current, t } = useI18n();
  const pathname = usePathname();

  return (
    <nav aria-label={t.nav.language} className={className}>
      <ul className="flex items-center">
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              {/* A full document load: client navigation between `[lang]` root layouts leaves the old tree mounted. */}
              <a
                href={switchLocalePath(pathname, locale)}
                hrefLang={locale}
                lang={locale}
                aria-label={`${locale.toUpperCase()} — ${localeNames[locale]}`}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  remember(locale);
                  onSelect?.();
                }}
                className={cn(
                  "label grid h-9 min-w-9 place-items-center px-1.5 transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <span className={cn("border-b pb-0.5 [font-family:var(--font-space-mono)]", active ? "border-accent" : "border-transparent")}>
                  {locale.toUpperCase()}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
