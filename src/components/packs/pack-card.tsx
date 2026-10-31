import Link from "next/link";
import { ArrowGlyph, buttonClasses } from "@/components/ui/button";
import { count, format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import type { StickerPack } from "@/lib/types";
import { cn } from "@/lib/cn";
import { BuyButton } from "./buy-button";
import { PackCoverFan } from "./pack-cover";
import { Price } from "./price";

export const packCardSizes = "(min-width: 1280px) 10vw, (min-width: 1024px) 13vw, (min-width: 640px) 20vw, 40vw";

export async function PackCard({ pack, eager = false }: { pack: StickerPack; eager?: boolean }) {
  const { locale, t, href: localize } = await getI18n();
  const href = localize(`/pack/${pack.slug}`);
  return (
    <article className="group/card flex flex-col">
      <Link
        href={href}
        prefetch
        aria-label={format(t.pack.viewDetails, { name: pack.name })}
        className="group relative block aspect-4/5 overflow-hidden bg-card transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(17,17,17,0.45)]"
      >
        <PackCoverFan pack={pack} sizes={packCardSizes} eager={eager} />
        <span className="label absolute left-4 top-4 text-ink">{pack.code}</span>
        <span className="label absolute right-4 top-4 text-muted">{pack.category[locale]}</span>
        <span className="label absolute bottom-4 left-4 inline-flex items-center gap-2 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {t.pack.viewPack}
          <ArrowGlyph className="size-3.5" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col border-b border-line pb-5 pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-xl font-bold tracking-[-0.03em]">
            <Link href={href} className="hover:underline hover:underline-offset-4">
              {pack.name}
            </Link>
          </h3>
          <Price pack={pack} className="shrink-0" amountClassName="text-sm" />
        </div>
        <p className="label mt-2 text-muted">
          {count(locale, pack.stickerCount, t.common.stickers)} · {pack.material[locale]}
        </p>
        <p className="mt-3 line-clamp-2 text-[0.9375rem] leading-relaxed text-muted">{pack.description[locale]}</p>
        <div className="mt-auto flex gap-2 pt-5">
          <Link href={href} className={cn(buttonClasses({ variant: "secondary", size: "sm" }), "flex-1")}>
            {t.pack.details}
          </Link>
          <BuyButton pack={pack} size="sm" unavailableLabel={t.pack.soonOnUzum} className="flex-1" />
        </div>
      </div>
    </article>
  );
}
