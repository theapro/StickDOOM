import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, hasLocale, locales, type Locale } from "@/i18n/config";

/** Saved choice first, then the browser's languages in order of preference, then Uzbek. */
function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;

  const ranked = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((entry, index) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { language: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  return ranked.map((entry) => entry.language).find(hasLocale) ?? defaultLocale;
}

/** Every page lives under a language prefix; anything without one is sent to the visitor's language. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  // Skip Next.js internals and files (anything with an extension, e.g. /sticker-packs/…/01.jpg, /icon.svg).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
