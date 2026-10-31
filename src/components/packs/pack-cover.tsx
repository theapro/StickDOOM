import Image from "next/image";
import type { StickerPack } from "@/lib/types";
import { cn } from "@/lib/cn";
import { stickerCorners } from "@/lib/sticker-layout";

export const stickerShadow =
  "shadow-[0_1px_1px_rgba(17,17,17,0.08),0_10px_24px_-10px_rgba(17,17,17,0.35)]";

function pickCoverStickers(pack: StickerPack) {
  const { stickers } = pack;
  if (stickers.length < 3) return stickers;
  return [stickers[0], stickers[Math.floor(stickers.length / 2)], stickers[stickers.length - 1]];
}

const fanPositions = [
  "-translate-x-[58%] -rotate-[9deg] group-hover:-translate-x-[66%] group-hover:-rotate-[13deg]",
  "z-10 -translate-y-[2%] group-hover:-translate-y-[6%]",
  "translate-x-[58%] rotate-[9deg] group-hover:translate-x-[66%] group-hover:rotate-[13deg]",
];

/**
 * Card cover. Uses `pack.coverImage` when configured, otherwise fans out
 * three real stickers from the pack.
 */
export function PackCoverFan({
  pack,
  sizes,
  eager = false,
}: {
  pack: StickerPack;
  sizes: string;
  eager?: boolean;
}) {
  if (pack.coverImage) {
    return (
      <Image
        src={pack.coverImage.src}
        alt={pack.coverImage.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
      />
    );
  }

  const stickers = pickCoverStickers(pack);
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      {stickers.map((sticker, index) => (
        <div
          key={sticker.id}
          className={cn(
            "absolute transition-transform duration-700 ease-out-expo",
            stickers.length === 3 ? fanPositions[index] : "",
          )}
          style={{ width: `${37 * sticker.scale}%` }}
        >
          <Image
            src={sticker.src}
            alt=""
            width={sticker.width}
            height={sticker.height}
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            className={cn("h-auto w-full", stickerShadow)}
            style={stickerCorners(sticker)}
          />
        </div>
      ))}
    </div>
  );
}

/** A printed-sheet layout showing every sticker in the pack. */
export function PackSheet({
  pack,
  sizes,
  className,
  eager = false,
  decorative = false,
}: {
  pack: StickerPack;
  sizes: string;
  className?: string;
  eager?: boolean;
  /** Hide per-sticker alt text when the sheet is only a preview (the caller describes it). */
  decorative?: boolean;
}) {
  const count = pack.stickers.length;
  const columns = count <= 4 ? 2 : count <= 9 ? 3 : count <= 16 ? 4 : 5;
  return (
    <ul
      className={cn("grid gap-[clamp(0.5rem,1.4vw,1.25rem)]", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {pack.stickers.map((sticker, index) => (
        <li
          key={sticker.id}
          className="transition-transform duration-500 ease-out-expo hover:-translate-y-1 hover:-rotate-2"
        >
          <Image
            src={sticker.src}
            alt={decorative ? "" : sticker.alt}
            width={sticker.width}
            height={sticker.height}
            sizes={sizes}
            loading={eager && index < columns * 2 ? "eager" : "lazy"}
            className={cn("mx-auto h-auto", stickerShadow)}
            style={{ width: `${sticker.scale * 100}%`, ...stickerCorners(sticker) }}
          />
        </li>
      ))}
    </ul>
  );
}
