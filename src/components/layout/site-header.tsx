"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { navLinks, siteConfig } from "@/config/site";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader() {
  const pathname = usePathname();
  const { t, href } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onResize = () => desktop.matches && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const isActive = (path: string) => {
    if (path.includes("#")) return false;
    const target = href(path);
    return path === "/" ? pathname === target : pathname.startsWith(target);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-(--header-h) border-b transition-[background-color,border-color] duration-300",
        scrolled || open ? "border-line bg-paper" : "border-transparent bg-paper/0",
      )}
    >
      <div className="shell grid h-full grid-cols-[1fr_auto] items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <Link
          href={href("/")}
          aria-label={format(t.common.homeLink, { name: siteConfig.name })}
          onClick={() => setOpen(false)}
          className="justify-self-start py-2"
        >
          <Wordmark />
        </Link>

        <nav aria-label={t.nav.primary} className="hidden md:block">
          <ul className="flex items-center gap-9">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={href(link.href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "label group relative inline-flex items-center gap-2 py-2 transition-colors",
                      active ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 bg-accent transition-transform duration-300 ease-out-expo",
                        active ? "scale-100" : "scale-0 group-hover:scale-100",
                      )}
                    />
                    {t.nav[link.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-self-end gap-2">
          <LanguageSwitcher className="-mr-1 sm:mr-1" onSelect={() => setOpen(false)} />
          <ButtonLink href={href("/explore")} size="sm" arrow className="max-lg:hidden">
            {t.nav.shop}
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((value) => !value)}
            className="-mr-2 grid size-11 place-items-center md:hidden"
          >
            {open ? <X aria-hidden strokeWidth={1.5} /> : <Menu aria-hidden strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-(--header-h) flex flex-col overflow-y-auto border-t border-line bg-paper md:hidden"
          >
            <nav aria-label={t.nav.mobile} className="shell flex-1 pt-8">
              <ul className="divide-y divide-line border-y border-line">
                {navLinks.map((link, index) => (
                  <li key={link.href}>
                    <Link
                      href={href(link.href)}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className="flex items-baseline justify-between gap-4 py-5"
                    >
                      <span className="type-h2 text-[clamp(1.75rem,10vw,2.75rem)]">{t.nav[link.key]}</span>
                      <span className="label text-muted">0{index + 1}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="shell flex flex-col gap-5 pb-8 pt-10">
              <ButtonLink href={href("/explore")} size="lg" arrow onClick={() => setOpen(false)} className="w-full">
                {t.nav.shop}
              </ButtonLink>
              <p className="label text-muted">
                {t.meta.tagline} — {t.common.location}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
