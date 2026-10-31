import type { Metadata } from "next";
import { Catalog, type CatalogItem } from "@/components/explore/catalog";
import { ComingSoonTile } from "@/components/packs/coming-soon";
import { PackCard } from "@/components/packs/pack-card";
import { SectionHead } from "@/components/ui/section-head";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/config";
import { count, format } from "@/i18n/format";
import { getI18n, languageAlternates } from "@/i18n/server";
import { getAllPacks, getCategories, getTotalStickerCount } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.explore.title,
    description: t.explore.description,
    alternates: languageAlternates(locale, "/explore"),
  };
}

export default async function ExplorePage() {
  const { locale, t } = await getI18n();
  const packs = getAllPacks();
  const items: CatalogItem[] = packs.map((pack, order) => ({
    id: pack.id,
    order,
    name: pack.name,
    category: pack.category[locale],
    price: pack.price,
    // Every language is searchable, so a Latin search term still finds packs on the Russian page.
    haystack: [
      pack.name,
      pack.code,
      ...locales.flatMap((value) => [pack.description[value], pack.category[value]]),
      ...pack.stickers.map((s) => s.name),
    ]
      .join(" ")
      .toLowerCase(),
  }));
  const cards = Object.fromEntries(packs.map((pack, index) => [pack.id, <PackCard key={pack.id} pack={pack} eager={index < 4} />]));

  return (
    <div className="shell pb-24 pt-8 md:pb-32 md:pt-14">
      <SectionHead
        index="SD"
        label={t.home.catalog}
        meta={`${count(locale, packs.length, t.common.packs)} · ${count(locale, getTotalStickerCount(), t.common.stickers)}`}
      />
      <div className="mb-12 mt-10 grid gap-6 md:mb-16 md:mt-14 lg:grid-cols-12 lg:items-end">
        <h1 className="type-h1 lg:col-span-8">
          {t.explore.heading[0]}
          <br />
          {t.explore.heading[1]}
          <span className="text-accent">.</span>
        </h1>
        <p className="type-lead max-w-sm text-muted lg:col-span-4 lg:justify-self-end lg:text-right">
          {format(t.explore.lead, { name: siteConfig.name, marketplace: siteConfig.marketplace })}
        </p>
      </div>
      <Catalog
        items={items}
        categories={getCategories(locale)}
        cards={cards}
        footer={packs.length < 8 ? <ComingSoonTile /> : null}
      />
    </div>
  );
}
