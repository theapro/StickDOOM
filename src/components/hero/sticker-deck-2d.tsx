import Image from "next/image";
import type { Sticker } from "@/lib/types";
import { cn } from "@/lib/cn";
import { stickerBounds, stickerCorners } from "@/lib/sticker-layout";
import { SLOT_TRANSFORMS, getDeckItems, type Slot } from "./deck";

/** Sticker-width distance between camera and deck used to fake perspective in CSS. */
const PERSPECTIVE = 4.6;

const zIndex: Record<Slot, number> = { exit: 30, front: 20, enter: 10 };

/** Flat stand-in for the WebGL grid wall, sized to roughly match it. */
const gridStyle: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(to right, rgb(17 17 17 / 0.13) 1px, transparent 1px)",
    "linear-gradient(to bottom, rgb(17 17 17 / 0.13) 1px, transparent 1px)",
    "linear-gradient(to right, rgb(17 17 17 / 0.06) 1px, transparent 1px)",
    "linear-gradient(to bottom, rgb(17 17 17 / 0.06) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "160px 160px, 160px 160px, 40px 40px, 40px 40px",
  backgroundPosition: "center",
  maskImage:
    "linear-gradient(to right, transparent, #000 24%, #000 76%, transparent), linear-gradient(to bottom, transparent, #000 24%, #000 76%, transparent)",
  maskComposite: "intersect",
};

function slotStyle(slot: Slot, aspect: number): React.CSSProperties {
  const t = SLOT_TRANSFORMS[slot];
  const depthScale = (PERSPECTIVE / (PERSPECTIVE - t.z)) * t.scale;
  const x = t.x * 100;
  const y = -t.y * aspect * 100;
  return {
    transform: `translate(-50%, -50%) translate(${x}%, ${y}%) rotate(${-t.rz}rad) scale(${depthScale})`,
    opacity: t.opacity,
    zIndex: zIndex[slot],
  };
}

/**
 * CSS rendition of the sticker showcase. Server-rendered as the hero poster
 * (stable LCP, no layout shift) and used as the full fallback without WebGL.
 */
export function StickerDeck2D({
  stickers,
  active,
  className,
}: {
  stickers: Sticker[];
  active: number;
  className?: string;
}) {
  const items = getDeckItems(stickers.length, active);
  const bounds = stickerBounds(stickers);
  return (
    <div className={cn("absolute inset-0 [container-type:size]", className)} aria-hidden>
      <div className="absolute inset-0" style={gridStyle} />
      {items.map(({ index, slot }) => {
        const sticker = stickers[index];
        const aspect = sticker.width / sticker.height;
        return (
          <div
            key={sticker.id}
            className={cn(
              "absolute left-1/2 top-1/2 transition-[transform,opacity] ease-out-expo",
              slot === "enter" ? "duration-300" : "duration-700",
              slot === "front" && "delay-150",
            )}
            style={{
              // Same fit as the WebGL deck: the largest sticker fills 64% of the height or 56% of the width.
              width: `calc(${sticker.scale} * min(${64 / bounds.height}cqh, ${56 / bounds.width}cqw))`,
              aspectRatio: `${sticker.width} / ${sticker.height}`,
              ...slotStyle(slot, aspect),
            }}
          >
            <Image
              src={sticker.src}
              alt=""
              width={sticker.width}
              height={sticker.height}
              sizes="(min-width: 1024px) 22vw, 52vw"
              loading="eager"
              fetchPriority={slot === "front" ? "high" : "low"}
              className="size-full border border-white/70 object-cover shadow-[0_2px_2px_rgba(17,17,17,0.08),0_30px_40px_-24px_rgba(17,17,17,0.45)]"
              style={stickerCorners(sticker)}
            />
          </div>
        );
      })}
    </div>
  );
}
