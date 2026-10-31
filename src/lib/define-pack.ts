import type { Localized } from "@/i18n/config";
import type { Currency, ImageAsset, PackSpec, StickerPack } from "./types";

export interface StickerInput {
  /** File name inside `assets.dir`, e.g. "01.png" or "01.jpg". */
  file: string;
  name: string;
  alt: string;
  /** Override when a sticker's pixel size differs from the pack default. */
  width?: number;
  height?: number;
}

export interface PackInput {
  slug: string;
  code: string;
  name: string;
  /** Written in every site language (uz, ru, en). */
  description: Localized;
  /** Explore filter label. Packs that belong together must use identical wording in every language. */
  category: Localized;
  price: number | null;
  currency?: Currency;
  uzumUrl: string | null;
  coverImage?: ImageAsset | null;
  featured?: boolean;
  /** Print stock. Defaults to the standard STICKDOOM paper. */
  material?: Localized;
  /** Die-cut corner radius in image pixels. Defaults to 0 (square-cut corners). */
  cornerRadius?: number;
  /**
   * Set when every image in the pack was exported at the same print resolution, so the stickers
   * keep their real size differences. Otherwise every sticker is shown at the same width.
   */
  trueToScale?: boolean;
  specs?: PackSpec[];
  assets: {
    /** Public folder path, e.g. "/sticker-packs/spirited-away". */
    dir: string;
    /** Default pixel size of every sticker image in the folder. */
    width: number;
    height: number;
  };
  stickers: StickerInput[];
}

export const DEFAULT_MATERIAL: Localized = {
  uz: "135 g/m² yaltiroq fotoqog‘oz",
  ru: "глянцевая фотобумага 135 г/м²",
  en: "135gsm glossy photo paper",
};

const UZUM_HOSTS = ["uzum.uz"];

function assertUzumUrl(slug: string, url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`[packs] "${slug}": uzumUrl is not a valid URL: ${url}`);
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = UZUM_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  if (parsed.protocol !== "https:" || !allowed) {
    throw new Error(
      `[packs] "${slug}": uzumUrl must be an https link on uzum.uz, got ${url}`,
    );
  }
}

/**
 * Normalises and validates a pack definition. Throws during build/dev when
 * the data is inconsistent so mistakes never reach production.
 */
export function definePack(input: PackInput): StickerPack {
  const { slug } = input;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`[packs] slug "${slug}" must be lowercase kebab-case.`);
  }
  if (input.stickers.length === 0) {
    throw new Error(`[packs] "${slug}" has no stickers.`);
  }
  if (input.price !== null && (!Number.isInteger(input.price) || input.price <= 0)) {
    throw new Error(`[packs] "${slug}": price must be a positive integer or null.`);
  }
  if (input.uzumUrl) assertUzumUrl(slug, input.uzumUrl);
  const cornerRadius = input.cornerRadius ?? 0;
  if (!(cornerRadius >= 0)) {
    throw new Error(`[packs] "${slug}": cornerRadius must be zero or a positive number of pixels.`);
  }

  const dir = input.assets.dir.replace(/\/$/, "");
  const sized = input.stickers.map((sticker) => ({
    ...sticker,
    width: sticker.width ?? input.assets.width,
    height: sticker.height ?? input.assets.height,
  }));
  const widest = Math.max(...sized.map((sticker) => sticker.width));

  return {
    id: slug,
    slug,
    code: input.code,
    name: input.name,
    description: input.description,
    category: input.category,
    stickerCount: input.stickers.length,
    price: input.price,
    currency: input.currency ?? "UZS",
    uzumUrl: input.uzumUrl || null,
    coverImage: input.coverImage ?? null,
    featured: input.featured ?? false,
    material: input.material ?? DEFAULT_MATERIAL,
    specs: input.specs ?? [],
    stickers: sized.map((sticker, index) => ({
      id: `${slug}-${String(index + 1).padStart(2, "0")}`,
      src: `${dir}/${sticker.file}`,
      width: sticker.width,
      height: sticker.height,
      name: sticker.name,
      alt: sticker.alt,
      scale: input.trueToScale ? sticker.width / widest : 1,
      radius: Math.min(cornerRadius, sticker.width / 2, sticker.height / 2) / sticker.width,
    })),
  };
}
