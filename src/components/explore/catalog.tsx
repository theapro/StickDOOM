"use client";

import { useDeferredValue, useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Search, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { count, format } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

export interface CatalogItem {
  id: string;
  order: number;
  name: string;
  category: string;
  price: number | null;
  /** Lower-cased text used for search: name, code, description, category, sticker names. */
  haystack: string;
}

const sorts = {
  featured: { label: "sortFeatured", compare: (a: CatalogItem, b: CatalogItem) => a.order - b.order },
  name: { label: "sortName", compare: (a: CatalogItem, b: CatalogItem) => a.name.localeCompare(b.name) },
  "price-asc": { label: "sortPriceAsc", compare: byPrice(1) },
  "price-desc": { label: "sortPriceDesc", compare: byPrice(-1) },
} as const;

type SortKey = keyof typeof sorts;

function byPrice(direction: 1 | -1) {
  return (a: CatalogItem, b: CatalogItem) => {
    if (a.price === null && b.price === null) return a.order - b.order;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return (a.price - b.price) * direction;
  };
}

export function Catalog({
  items,
  categories,
  cards,
  footer,
}: {
  items: CatalogItem[];
  categories: string[];
  cards: Record<string, ReactNode>;
  footer?: ReactNode;
}) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");
  const deferredQuery = useDeferredValue(query);
  const reducedMotion = usePrefersReducedMotion();
  const searchId = useId();
  const sortId = useId();

  const results = useMemo(() => {
    const terms = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items
      .filter((item) => !category || item.category === category)
      .filter((item) => terms.every((term) => item.haystack.includes(term)))
      .sort(sorts[sort].compare);
  }, [items, category, deferredQuery, sort]);

  const filtered = query.trim() !== "" || category !== null;
  const reset = () => {
    setQuery("");
    setCategory(null);
  };

  const chip = (active: boolean) =>
    cn(
      "label h-9 border px-3.5 transition-colors duration-200",
      active ? "border-ink bg-ink text-paper" : "border-line-strong text-ink hover:border-ink",
    );

  return (
    <div>
      <div className="sticky top-(--header-h) z-20 -mx-(--gutter) border-y border-line bg-paper px-(--gutter) py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div role="search" className="relative lg:w-80">
            <label htmlFor={searchId} className="sr-only">
              {t.explore.searchLabel}
            </label>
            <Search aria-hidden strokeWidth={1.5} className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.explore.searchPlaceholder}
              autoComplete="off"
              className="h-11 w-full border-b border-ink bg-transparent pl-7 pr-9 text-[0.9375rem] placeholder:text-muted focus:outline-none focus-visible:border-accent [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t.explore.clearSearch}
                className="absolute right-0 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-muted hover:text-ink"
              >
                <X aria-hidden className="size-4" strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div role="group" aria-label={t.explore.filterLabel} className="flex flex-1 flex-wrap gap-2 lg:justify-center">
            <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip(category === null)}>
              {t.explore.all}
            </button>
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={category === name}
                onClick={() => setCategory(category === name ? null : name)}
                className={chip(category === name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor={sortId} className="label text-muted">
              {t.explore.sort}
            </label>
            <div className="relative">
              <select
                id={sortId}
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="label h-9 appearance-none border border-line-strong bg-paper pl-3 pr-9 text-ink hover:border-ink"
              >
                {Object.entries(sorts).map(([key, option]) => (
                  <option key={key} value={key}>
                    {t.explore[option.label]}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      <p className="label mt-8 text-muted" aria-live="polite" aria-atomic>
        {filtered
          ? format(t.explore.found, { count: count(locale, results.length, t.common.packs) })
          : count(locale, results.length, t.common.packs)}
      </p>

      {results.length > 0 ? (
        <ul className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((item) => (
              <motion.li
                key={item.id}
                layout={!reducedMotion}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {cards[item.id]}
              </motion.li>
            ))}
          </AnimatePresence>
          {!filtered && footer && <li>{footer}</li>}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col items-start border border-dashed border-line-strong px-6 py-16 sm:px-12">
          <p className="type-h3">
            {query.trim() ? format(t.explore.noMatchQuery, { query: query.trim() }) : t.explore.noMatchFilter}
          </p>
          <p className="mt-3 max-w-md text-muted">{t.explore.noMatchHint}</p>
          <button type="button" onClick={reset} className={cn(buttonClasses({ variant: "secondary", size: "sm" }), "mt-8")}>
            {t.explore.clearFilters}
          </button>
        </div>
      )}
    </div>
  );
}
