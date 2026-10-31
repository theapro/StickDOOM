import { ButtonLink } from "@/components/ui/button";
import { dictionaries } from "@/i18n/dictionaries";
import { count } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getAllPacks, getHeroStickers, getTotalStickerCount } from "@/lib/catalog";
import { HeroStage } from "./hero-stage";

export async function Hero() {
  const { locale, t, href } = await getI18n();
  const stickers = getHeroStickers();
  const packCount = getAllPacks().length;
  const stickerCount = getTotalStickerCount();

  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="shell grid gap-y-10 pb-10 pt-6 md:pt-10 lg:min-h-[calc(100svh-var(--header-h))] lg:grid-cols-12 lg:gap-x-8 lg:pb-10 lg:pt-8">
        <div className="flex flex-col lg:col-span-6 lg:pb-2">
          <p className="label flex items-center gap-2.5 text-muted">
            <span aria-hidden className="size-1.5 bg-accent" />
            {t.hero.kicker} — {count(locale, packCount, t.common.packs)} — {count(locale, stickerCount, t.common.stickers)}
          </p>

          <div className="@container mt-10 lg:my-auto lg:py-10">
            <h1 id="hero-title" lang="en" className="type-display -ml-[0.04em] text-[19.4cqw]">
              STICKDOOM
            </h1>
            <p
              lang={t.meta.tagline === dictionaries.en.meta.tagline ? "en" : undefined}
              className="mt-[0.35em] font-display text-[clamp(1.75rem,6.4cqw,3.25rem)] font-bold uppercase leading-[0.95] tracking-[-0.04em]">
              {t.meta.tagline.replace(/\.$/, "")}
              <span className="text-accent">.</span>
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <ButtonLink href={href("/explore")} size="lg" arrow>
                {t.hero.explore}
              </ButtonLink>
              <ButtonLink href={href("/#collection")} variant="quiet" className="label! text-[0.75rem]!">
                {t.hero.seeAll}
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="aspect-4/5 max-h-[44rem] sm:aspect-square lg:col-span-6 lg:aspect-auto lg:max-h-none">
          <HeroStage stickers={stickers} />
        </div>
      </div>
    </section>
  );
}
