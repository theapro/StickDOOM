import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { CropMarks } from "@/components/ui/crop-marks";
import { format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import type { StickerPack } from "@/lib/types";
import { BuyButton } from "./buy-button";
import { PackSheet } from "./pack-cover";
import { Price } from "./price";
/** Wide editorial layout used when the catalog is still small. */
export async function PackSpotlight({ pack }: { pack: StickerPack }) {
  const { locale, t, href: localize } = await getI18n();
  const href = localize(`/pack/${pack.slug}`);
  return (
    <article className="grid border border-line lg:grid-cols-12" aria-labelledby={`spotlight-${pack.slug}`}>
      <figure className="relative bg-card px-[7%] py-[8%] lg:col-span-7">
        <CropMarks className="inset-4" />
        <PackSheet
          pack={pack}
          decorative
          sizes="(min-width: 1024px) 120px, 21vw"
          className="mx-auto max-w-[30rem]"
        />
        <figcaption className="sr-only">
          {format(t.pack.allStickers, { count: pack.stickerCount, name: pack.name })}
        </figcaption>
      </figure>

      <div className="flex flex-col border-t border-line p-6 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0">
        <div className="label flex justify-between text-muted">
          <span className="text-ink">{pack.code}</span>
          <span>{pack.category[locale]}</span>
        </div>

        <div className="mt-12 lg:mt-auto">
          <h3 id={`spotlight-${pack.slug}`} className="type-h2 text-[clamp(2.5rem,4.6vw,4.25rem)]">
            {pack.name}
          </h3>
          <p className="type-lead mt-5 max-w-md text-muted">{pack.description[locale]}</p>
        </div>

        <dl className="mt-10 grid grid-cols-3 border-y border-line py-4">
          <div>
            <dt className="label text-muted">{t.pack.stickers}</dt>
            <dd className="mt-2 font-display text-lg font-medium">{pack.stickerCount}</dd>
          </div>
          <div>
            <dt className="label text-muted">{t.pack.category}</dt>
            <dd className="mt-2 font-display text-lg font-medium">{pack.category[locale]}</dd>
          </div>
          <div>
            <dt className="label text-muted">{t.pack.price}</dt>
            <dd className="mt-2 text-lg">
              <Price pack={pack} />
            </dd>
          </div>
        </dl>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href={href} prefetch className={buttonClasses({ variant: "secondary", size: "lg" })}>
            {t.pack.viewPack}
          </Link>
          <BuyButton pack={pack} size="lg" />
        </div>
      </div>
    </article>
  );
}
