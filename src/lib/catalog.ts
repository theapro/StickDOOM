import { packs } from "@/data/packs";
import type { Locale } from "@/i18n/config";
import type { Sticker, StickerPack } from "./types";

const seen = new Set<string>();
for (const pack of packs) {
  if (seen.has(pack.slug)) {
    throw new Error(`[packs] duplicate slug "${pack.slug}" in src/data/packs.ts`);
  }
  seen.add(pack.slug);
}

export function getAllPacks(): StickerPack[] {
  return packs;
}

export function getPackBySlug(slug: string): StickerPack | undefined {
  return packs.find((pack) => pack.slug === slug);
}

/** Every pack, featured ones first, in catalog order within each group. */
export function getHomePacks(limit = 8): StickerPack[] {
  return [...packs.filter((pack) => pack.featured), ...packs.filter((pack) => !pack.featured)].slice(0, limit);
}

export function getCategories(locale: Locale): string[] {
  return Array.from(new Set(packs.map((pack) => pack.category[locale]))).sort((a, b) => a.localeCompare(b, locale));
}

export function getOtherPacks(slug: string, limit = 4): StickerPack[] {
  return packs.filter((pack) => pack.slug !== slug).slice(0, limit);
}

export function getTotalStickerCount(): number {
  return packs.reduce((sum, pack) => sum + pack.stickerCount, 0);
}

export interface HeroSticker extends Sticker {
  packCode: string;
  packName: string;
}

/** Stickers for the homepage hero, taken round-robin across all packs so every collection appears. */
export function getHeroStickers(limit = 18): HeroSticker[] {
  const sources = getHomePacks(Infinity);
  const result: HeroSticker[] = [];
  for (let round = 0; result.length < limit; round++) {
    let added = false;
    for (const pack of sources) {
      const sticker = pack.stickers[round];
      if (!sticker || result.length >= limit) continue;
      result.push({ ...sticker, packCode: pack.code, packName: pack.name });
      added = true;
    }
    if (!added) break;
  }
  return result;
}

/** "45 000 so‘m": thousands grouped with no-break spaces, followed by the localized currency unit. */
export function formatPrice(price: number | null, unit: string): string | null {
  if (price === null) return null;
  const grouped = String(price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${grouped}\u00a0${unit}`;
}
