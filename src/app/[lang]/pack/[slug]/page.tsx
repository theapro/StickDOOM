import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StickerGallery } from "@/components/pack/sticker-gallery";
import { BuyButton } from "@/components/packs/buy-button";
import { PackCard } from "@/components/packs/pack-card";
import { Price } from "@/components/packs/price";
import { PrintNote } from "@/components/packs/print-note";
import { buttonClasses } from "@/components/ui/button";
import { SectionHead } from "@/components/ui/section-head";
import { siteConfig } from "@/config/site";
import { count, format } from "@/i18n/format";
import { getI18n, languageAlternates } from "@/i18n/server";
import { getAllPacks, getOtherPacks, getPackBySlug } from "@/lib/catalog";

type Props = PageProps<"/[lang]/pack/[slug]">;

export function generateStaticParams() {
  return getAllPacks().map((pack) => ({ slug: pack.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t } = await getI18n();
  const pack = getPackBySlug(slug);
  if (!pack) return { title: t.pack.notFound };
  const cover = pack.coverImage ?? pack.stickers[0];
  return {
    title: `${pack.name} — ${count(locale, pack.stickerCount, t.common.stickers)}`,
    description: pack.description[locale],
    alternates: languageAlternates(locale, `/pack/${pack.slug}`),
    openGraph: {
      title: `${pack.name} — ${siteConfig.name}`,
      description: pack.description[locale],
      locale: t.meta.ogLocale,
      images: [{ url: cover.src, width: cover.width, height: cover.height, alt: cover.alt }],
    },
  };
}

export default function PackPage({ params }: Props) {
  return (
    <Suspense fallback={<PackSkeleton />}>
      <PackDetail params={params} />
    </Suspense>
  );
}

async function PackDetail({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const pack = getPackBySlug(slug);
  if (!pack) notFound();
  const { locale, t, href } = await getI18n();
  const material = pack.material[locale];
  const marketplace = siteConfig.marketplace;

  const others = getOtherPacks(pack.slug);
  const facts = [
    { label: t.pack.code, value: pack.code },
    { label: t.pack.stickers, value: String(pack.stickerCount) },
    { label: t.pack.paper, value: material },
    { label: t.pack.category, value: pack.category[locale] },
    ...pack.specs,
  ];

  return (
    <div className="shell pb-24 pt-6 md:pb-32 md:pt-10">
      <nav aria-label={t.pack.breadcrumb}>
        <ol className="label flex items-center gap-2 text-muted">
          <li>
            <Link href={href("/explore")} className="hover:text-ink">
              {t.pack.explore}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">
            {pack.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-14">
        <section aria-label={format(t.pack.stickersIn, { name: pack.name })} className="order-2 lg:order-1 lg:col-span-7">
          <StickerGallery stickers={pack.stickers} packName={pack.name} material={material} />
        </section>

        <aside className="order-1 lg:order-2 lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <p className="label flex items-center gap-2.5 text-muted">
              <span aria-hidden className="size-1.5 bg-accent" />
              {pack.code} — {pack.category[locale]}
            </p>
            <h1 className="type-h1 mt-5 text-[clamp(3rem,6.2vw,6rem)]">{pack.name}</h1>
            <p className="type-lead mt-6 max-w-md text-muted">{pack.description[locale]}</p>

            <div className="mt-8 flex items-baseline justify-between border-y border-line py-5">
              <span className="label text-muted">{t.pack.price}</span>
              <Price pack={pack} amountClassName="text-2xl" />
            </div>

            <dl className="divide-y divide-line border-b border-line">
              {facts.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-6 py-3">
                  <dt className="label text-muted">{fact.label}</dt>
                  <dd className="text-right text-[0.9375rem]">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <PrintNote material={material} copy={t.print} className="mt-6 border-l-2 border-accent pl-4 text-sm" />

            <div className="mt-8 grid gap-2">
              <BuyButton pack={pack} size="lg" label={format(t.pack.buyOn, { marketplace })} className="w-full" />
              <Link href={href("/explore")} className={buttonClasses({ variant: "secondary", size: "lg", className: "w-full" })}>
                {t.pack.back}
              </Link>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              {format(pack.uzumUrl ? t.pack.orderNote : t.pack.unlistedNote, { marketplace })}
            </p>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-24 md:mt-32">
          <SectionHead index="++" label={t.pack.more} />
          <h2 id="more-heading" className="type-h2 mt-10">
            {t.pack.keepCollecting}
            <span className="text-accent">.</span>
          </h2>
          <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((other) => (
              <li key={other.id}>
                <PackCard pack={other} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PackSkeleton() {
  return (
    <div className="shell pb-24 pt-6 md:pt-10" aria-busy>
      <div className="h-3 w-40 bg-card" />
      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="aspect-square animate-pulse bg-card sm:aspect-[5/4]" />
          <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="aspect-[0.78] animate-pulse bg-card" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="h-3 w-32 bg-card" />
          <div className="mt-6 h-20 w-3/4 bg-card" />
          <div className="mt-6 h-16 w-full bg-card" />
        </div>
      </div>
    </div>
  );
}
