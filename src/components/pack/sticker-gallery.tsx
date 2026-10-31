"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Box } from "lucide-react";
import { stickerShadow } from "@/components/packs/pack-cover";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { Sticker } from "@/lib/types";
import { cn } from "@/lib/cn";
import { stickerBounds, stickerCorners } from "@/lib/sticker-layout";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { StickerViewer } from "./sticker-viewer";

const pad = (value: number) => String(value).padStart(2, "0");

export function StickerGallery({
  stickers,
  packName,
  material,
}: {
  stickers: Sticker[];
  packName: string;
  material: string;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const bounds = stickerBounds(stickers);
  const viewerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // The dialog's open state always follows React state, and it is closed whenever this view
  // unmounts or is hidden, so it can never be left open as a non-modal, in-flow element.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded) {
      if (!dialog.matches(":modal")) {
        if (dialog.open) dialog.close();
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [expanded]);

  const select = (next: number) => {
    setIndex(next);
    const viewer = viewerRef.current;
    if (viewer && viewer.getBoundingClientRect().top < 0) {
      viewer.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <>
      <div ref={viewerRef} className="scroll-mt-[calc(var(--header-h)+1rem)]">
        <StickerViewer
          stickers={stickers}
          index={index}
          onIndexChange={setIndex}
          material={material}
          live={!expanded}
          onExpand={() => setExpanded(true)}
        />
      </div>

      <ul className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
        {stickers.map((sticker, i) => {
          const active = i === index;
          return (
            <li key={sticker.id}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-label={format(t.viewer.thumb, { index: i + 1, name: sticker.name })}
                aria-pressed={active}
                className="group block w-full text-left"
              >
                <span
                  className={cn(
                    "relative block bg-card px-[14%] py-[12%] outline outline-1 -outline-offset-1 transition-[outline-color] duration-300",
                    active ? "outline-ink" : "outline-transparent",
                  )}
                >
                  <span className="grid place-items-center" style={{ aspectRatio: `${bounds.width} / ${bounds.height}` }}>
                    <Image
                      src={sticker.src}
                      alt={sticker.alt}
                      width={sticker.width}
                      height={sticker.height}
                      sizes="(min-width: 1280px) 11vw, (min-width: 1024px) 13vw, (min-width: 640px) 18vw, 28vw"
                      loading={i < 8 ? "eager" : "lazy"}
                      className={cn(
                        "h-auto transition-transform duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:-rotate-2",
                        stickerShadow,
                      )}
                      style={{ width: `${(sticker.scale / bounds.width) * 100}%`, ...stickerCorners(sticker) }}
                    />
                  </span>
                  <Box
                    aria-hidden
                    strokeWidth={1.5}
                    className={cn(
                      "absolute right-2 top-2 size-3.5 text-ink transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                    )}
                  />
                </span>
                <span className="label mt-2.5 flex justify-between gap-2 text-muted">
                  <span className={cn("truncate", active ? "text-ink" : "text-ink/80")}>{sticker.name}</span>
                  <span>{pad(i + 1)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={format(t.viewer.dialog, { name: packName })}
        onClose={() => setExpanded(false)}
        className="fixed inset-0 z-[100] m-0 h-dvh max-h-none w-full max-w-none bg-paper p-0 text-ink backdrop:bg-ink/50 open:flex open:flex-col"
      >
        {expanded && (
          <StickerViewer
            stickers={stickers}
            index={index}
            onIndexChange={setIndex}
            material={material}
            expanded
            onClose={() => setExpanded(false)}
            className="shell min-h-0 flex-1 py-4 md:py-6"
          />
        )}
      </dialog>
    </>
  );
}
