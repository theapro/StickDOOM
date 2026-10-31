import type { Localized } from "@/i18n/config";

export type Currency = "UZS";

export interface ImageAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Sticker extends ImageAsset {
  /** Stable identifier, unique within the whole catalog. */
  id: string;
  /** Short display name shown in galleries and the hero. */
  name: string;
  /** Print size relative to the widest sticker in its pack (1 when a pack is shown at one size). */
  scale: number;
  /** Die-cut corner radius as a fraction of the sticker width (0 = square-cut corners). */
  radius: number;
}

export interface PackSpec {
  label: string;
  value: string;
}

/** A fully resolved sticker pack, as consumed by the UI. */
export interface StickerPack {
  id: string;
  slug: string;
  /** Short catalog code, e.g. "SD—01". */
  code: string;
  name: string;
  description: Localized;
  category: Localized;
  stickerCount: number;
  /** Price in whole currency units. `null` hides the price. */
  price: number | null;
  currency: Currency;
  /** Product page on Uzum Market. `null` disables purchasing. */
  uzumUrl: string | null;
  /** Optional dedicated cover. When `null`, a cover is composed from the stickers. */
  coverImage: ImageAsset | null;
  featured: boolean;
  /** What the stickers are printed on, e.g. "135gsm glossy photo paper". */
  material: Localized;
  specs: PackSpec[];
  stickers: Sticker[];
}
