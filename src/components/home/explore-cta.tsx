import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHead } from "@/components/ui/section-head";
import { count } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getAllPacks, getCategories } from "@/lib/catalog";

export async function ExploreCta() {
  const { locale, t, href } = await getI18n();
  const packs = getAllPacks().length;
  const categories = getCategories(locale).length;

  return (
    <section aria-labelledby="explore-heading" className="border-y border-line bg-ink text-paper">
      <div className="shell py-16 md:py-24">
        <SectionHead
          index="02"
          label={t.home.catalog}
          meta={`${count(locale, packs, t.common.packs)} · ${count(locale, categories, t.common.categories)}`}
          className="text-paper/60 [&>span:first-child]:text-paper [&>span[aria-hidden]]:bg-paper/20"
        />
        <Link
          href={href("/explore")}
          className="group mt-10 flex flex-col gap-8 focus-visible:outline-paper md:mt-14 md:flex-row md:items-end md:justify-between"
        >
          <h2 id="explore-heading" className="type-h1">
            {t.home.exploreTitle[0]}
            <br />
            <span className="inline-flex items-center gap-[0.15em]">
              {t.home.exploreTitle[1]}
              <span aria-hidden className="inline-block size-[0.16em] translate-y-[0.22em] bg-accent" />
            </span>
          </h2>
          <span className="flex items-center gap-5">
            <span className="max-w-[16rem] text-paper/70">{t.home.exploreLead}</span>
            <span className="grid size-16 shrink-0 place-items-center border border-paper/30 transition-colors duration-300 group-hover:border-accent group-hover:bg-accent md:size-24">
              <ArrowRight
                aria-hidden
                strokeWidth={1.25}
                className="size-7 transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 md:size-9"
              />
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
