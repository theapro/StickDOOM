import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowUpRight } from "lucide-react";
import { Mark } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";

const socials = [
  { label: "Instagram", href: siteConfig.socials.instagram },
  { label: "Telegram", href: siteConfig.socials.telegram },
];

const linkClass = "inline-flex items-center gap-1.5 py-1 transition-colors hover:text-ink";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function SiteFooter() {
  const { t, href } = await getI18n();
  return (
    <footer className="mt-auto border-t border-line">
      <div className="shell grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-6">
          <Link href={href("/")} aria-label={format(t.common.homeLink, { name: siteConfig.name })} className="inline-flex">
            <Mark className="size-8" />
          </Link>
          <p className="mt-6 max-w-sm text-muted">{t.meta.description}</p>
        </div>

        <nav aria-label={t.footer.label} className="md:col-span-3">
          <h2 className="label mb-4 text-ink">{t.footer.shop}</h2>
          <ul className="space-y-2 text-muted">
            <li>
              <Link href={href("/explore")} className={linkClass}>
                {t.nav.explore}
              </Link>
            </li>
            <li>
              <Link href={href("/#about")} className={linkClass}>
                {t.nav.about}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="label mb-4 text-ink">{t.footer.follow}</h2>
          <ul className="space-y-2 text-muted">
            {socials.map((social) => (
              <li key={social.label}>
                {social.href ? (
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {social.label}
                    <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
                    <span className="sr-only">{t.common.opensInNewTab}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 py-1">
                    {social.label}
                    <span className="label border border-line px-1.5 py-0.5 text-[0.625rem]">{t.footer.soon}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shell" aria-hidden>
        <div className="@container overflow-hidden">
          <p lang="en" className="type-display select-none whitespace-nowrap pb-[0.06em] text-[19.4cqw]">STICKDOOM</p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell label flex flex-col gap-2 py-5 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {siteConfig.name}. {t.footer.rights}
          </p>
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-1.5 bg-accent" />
            {t.common.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
