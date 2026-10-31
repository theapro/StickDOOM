/**
 * Brand-level configuration. Social links stay `null` until real URLs exist;
 * the footer renders them as "coming soon" instead of linking anywhere.
 * Translated copy (tagline, description, location) lives in `src/i18n/dictionaries`.
 */
export const siteConfig = {
  name: "STICKDOOM",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  marketplace: "Uzum Market",
  socials: {
    instagram: null as string | null,
    telegram: null as string | null,
  },
} as const;

/** Paths are language-neutral; components prefix them with the current language. */
export const navLinks = [
  { href: "/", key: "home" },
  { href: "/explore", key: "explore" },
  { href: "/#about", key: "about" },
] as const;
