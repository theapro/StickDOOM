import { ComingSoonTile } from "@/components/packs/coming-soon";
import { PackCard } from "@/components/packs/pack-card";
import { PackSpotlight } from "@/components/packs/pack-spotlight";
import { ButtonLink } from "@/components/ui/button";
import { SectionHead } from "@/components/ui/section-head";
import { count, format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getAllPacks, getHomePacks, getTotalStickerCount } from "@/lib/catalog";

/** With fewer than this many packs, each one gets the wide spotlight layout instead of a card. */
const GRID_THRESHOLD = 3;

export async function FeaturedPacks() {
  const { locale, t, href } = await getI18n();
  const packs = getHomePacks(8);
  const total = getAllPacks().length;
  const useGrid = packs.length >= GRID_THRESHOLD;

  return (
    <section id="collection" aria-labelledby="collection-heading" className="shell py-20 md:py-28">
      <SectionHead
        index="01"
        label={t.home.collection}
        meta={`${count(locale, total, t.common.packs)} · ${count(locale, getTotalStickerCount(), t.common.stickers)}`}
      />

      <div className="mt-10 grid gap-6 md:mt-14 lg:grid-cols-12 lg:items-end">
        <h2 id="collection-heading" className="type-h2 lg:col-span-8">
          {t.home.collectTitle[0]}
          <br />
          {t.home.collectTitle[1]}
          <span className="text-accent">.</span>
        </h2>
        <p className="type-lead text-muted lg:col-span-4 lg:justify-self-end lg:text-right">{t.home.collectLead}</p>
      </div>

      <div className="mt-12 md:mt-16">
        {useGrid ? (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packs.map((pack, index) => (
              <li key={pack.id}>
                <PackCard pack={pack} eager={index < 2} />
              </li>
            ))}
            {packs.length < 8 && (
              <li>
                <ComingSoonTile />
              </li>
            )}
          </ul>
        ) : (
          <div className="space-y-6">
            {packs.map((pack) => (
              <PackSpotlight key={pack.id} pack={pack} />
            ))}
            <div className="flex flex-col gap-3 border border-dashed border-line-strong px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-lg font-bold tracking-[-0.02em]">{t.home.comingSoon}</p>
              <p className="label text-muted">SD—NEXT · {t.home.inStudio}</p>
            </div>
          </div>
        )}
        {total > packs.length && (
          <div className="mt-12 flex justify-center">
            <ButtonLink href={href("/explore")} variant="secondary" size="lg" arrow>
              {format(t.home.viewAll, { count: total })}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
