import type { CSSProperties } from "react";
import type { Sticker } from "./types";

type Shape = Pick<Sticker, "width" | "height" | "scale" | "radius">;

/** Rounds an image's corners to the sticker's die cut, so shadows and outlines follow the shape. */
export function stickerCorners(sticker: Shape): CSSProperties | undefined {
  if (!sticker.radius) return undefined;
  const aspect = sticker.width / sticker.height;
  return { borderRadius: `${sticker.radius * 100}% / ${sticker.radius * aspect * 100}%` };
}

/**
 * The box every sticker in a set fits in, in units of a full-scale sticker width. Laying stickers
 * out against it keeps their relative print sizes.
 */
export function stickerBounds(stickers: Shape[]) {
  return {
    width: Math.max(...stickers.map((sticker) => sticker.scale)),
    height: Math.max(...stickers.map((sticker) => (sticker.scale * sticker.height) / sticker.width)),
  };
}
