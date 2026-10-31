"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FlipHorizontal2, Maximize2, RotateCcw, X } from "lucide-react";
import { CropMarks } from "@/components/ui/crop-marks";
import { PrintNote } from "@/components/packs/print-note";
import { SceneBoundary, supportsWebGL, textureUrl, toSceneSticker, whenIdle, type GlState } from "@/components/hero/webgl";
import type { SceneSticker } from "@/components/hero/sticker-body";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { Sticker } from "@/lib/types";
import { cn } from "@/lib/cn";
import { stickerBounds, stickerCorners } from "@/lib/sticker-layout";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { InspectorInput } from "./inspector-scene";

const InspectorScene = dynamic(() => import("./inspector-scene"), { ssr: false });

const iconButton =
  "grid size-11 place-items-center border border-line-strong bg-paper text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper";

const pad = (value: number) => String(value).padStart(2, "0");

export interface StickerViewerProps {
  stickers: Sticker[];
  index: number;
  onIndexChange: (index: number) => void;
  material: string;
  /** Full-screen variant shown inside the dialog. */
  expanded?: boolean;
  /** When false the WebGL scene is not mounted (e.g. while the full-screen viewer owns the GPU). */
  live?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
  className?: string;
}

/** Drag-to-inspect 3D view of one sticker, with a 2D poster that doubles as the no-WebGL fallback. */
export function StickerViewer({
  stickers,
  index,
  onIndexChange,
  material,
  expanded = false,
  live = true,
  onExpand,
  onClose,
  className,
}: StickerViewerProps) {
  const { t } = useI18n();
  const count = stickers.length;
  const current = stickers[index];
  const [gl, setGl] = useState<GlState>("idle");
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const input = useRef<InspectorInput>({ dragging: false, pendingX: 0, pendingY: 0, flips: 0, resets: 0 });

  const go = useCallback((step: number) => onIndexChange((index + step + count) % count), [count, index, onIndexChange]);
  const flip = () => {
    input.current.flips += 1;
  };
  const reset = () => {
    input.current.resets += 1;
  };

  useEffect(() => whenIdle(() => setGl(supportsWebGL() ? "loading" : "unsupported")), []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const sceneSticker = useMemo<SceneSticker>(() => toSceneSticker(current), [current]);
  const bounds = useMemo(() => stickerBounds(stickers), [stickers]);
  const preload = useMemo(
    () => [stickers[(index + 1) % count], stickers[(index - 1 + count) % count]].map(textureUrl),
    [stickers, index, count],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "f" || event.key === "F") flip();
    else if (event.key === "r" || event.key === "R") reset();
    else return;
    event.preventDefault();
  };

  const endDrag = (event: React.PointerEvent) => {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    input.current.dragging = false;
    setDragging(false);
  };

  const onGlReady = useCallback(() => setGl("ready"), []);
  const onGlError = useCallback(() => setGl("unsupported"), []);
  const showScene = live && (gl === "loading" || gl === "ready");
  const sceneVisible = showScene && gl === "ready";

  return (
    <div className={cn("flex flex-col", className)} onKeyDown={onKeyDown}>
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="3D sticker viewer"
        aria-label={format(t.viewer.stage, { name: current.name })}
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.button !== 0 || !sceneVisible) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          input.current.dragging = true;
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.id !== event.pointerId) return;
          input.current.pendingX += event.clientX - drag.x;
          input.current.pendingY += event.clientY - drag.y;
          drag.x = event.clientX;
          drag.y = event.clientY;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={reset}
        className={cn(
          "relative flex-1 select-none overflow-hidden bg-card outline-offset-[-2px]",
          expanded ? "touch-none" : "touch-pan-y",
          sceneVisible && (dragging ? "cursor-grabbing" : "cursor-grab"),
          expanded ? "min-h-0" : "aspect-square max-h-[72svh] w-full sm:aspect-[5/4]",
        )}
      >
        <CropMarks className="inset-3 z-10" />

        <div
          className={cn(
            "absolute inset-0 grid place-items-center transition-opacity duration-500 [container-type:size]",
            sceneVisible && "opacity-0",
          )}
        >
          {/* Same fit as the 3D scene: the pack's largest sticker fills 80% of the height or 72% of the width. */}
          <Image
            key={current.id}
            src={current.src}
            alt={current.alt}
            width={current.width}
            height={current.height}
            sizes={expanded ? "(min-width: 768px) 40vw, 80vw" : "(min-width: 1024px) 30vw, 70vw"}
            loading="eager"
            className="h-auto max-w-none shadow-[0_2px_2px_rgba(17,17,17,0.08),0_30px_40px_-24px_rgba(17,17,17,0.45)]"
            style={{
              width: `calc(${current.scale} * min(${80 / bounds.height}cqh, ${72 / bounds.width}cqw))`,
              ...stickerCorners(current),
            }}
          />
        </div>

        {showScene && (
          <SceneBoundary onError={onGlError}>
            <div className={cn("absolute inset-0 transition-opacity duration-500", sceneVisible ? "opacity-100" : "opacity-0")}>
              <InspectorScene
                sticker={sceneSticker}
                bounds={bounds}
                preload={preload}
                inputRef={input}
                reducedMotion={reducedMotion}
                paused={!inView}
                onReady={onGlReady}
                onError={onGlError}
              />
            </div>
          </SceneBoundary>
        )}

        <p className="label pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2 text-ink">
          <span aria-hidden className="size-1.5 bg-accent" />
          {pad(index + 1)} / {pad(count)}
        </p>
        <p className="label pointer-events-none absolute right-6 top-6 z-10 text-right text-ink" aria-live="polite">
          {current.name}
        </p>
        <p className="label pointer-events-none absolute bottom-6 left-6 z-10 text-muted" aria-hidden>
          {gl === "unsupported" ? (
            t.viewer.unavailable
          ) : (
            <>
              {t.viewer.dragToInspect}
              <span className="hidden sm:inline">{t.viewer.doubleClick}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
        <button type="button" onClick={() => go(-1)} className={iconButton} aria-label={t.viewer.previous}>
          <ChevronLeft aria-hidden strokeWidth={1.5} className="size-5" />
        </button>
        <button type="button" onClick={() => go(1)} className={iconButton} aria-label={t.viewer.next}>
          <ChevronRight aria-hidden strokeWidth={1.5} className="size-5" />
        </button>
        {gl !== "unsupported" && (
          <>
            <span aria-hidden className="mx-1.5 h-6 w-px bg-line" />
            <button type="button" onClick={flip} className={iconButton} aria-label={t.viewer.flip}>
              <FlipHorizontal2 aria-hidden strokeWidth={1.5} className="size-[1.1rem]" />
            </button>
            <button type="button" onClick={reset} className={iconButton} aria-label={t.viewer.reset}>
              <RotateCcw aria-hidden strokeWidth={1.5} className="size-[1.1rem]" />
            </button>
          </>
        )}
        <div className="ml-auto">
          {expanded ? (
            <button type="button" onClick={onClose} className={iconButton} aria-label={t.viewer.close} autoFocus>
              <X aria-hidden strokeWidth={1.5} className="size-5" />
            </button>
          ) : (
            onExpand && (
              <button type="button" onClick={onExpand} className={iconButton} aria-label={t.viewer.open} aria-haspopup="dialog">
                <Maximize2 aria-hidden strokeWidth={1.5} className="size-[1.1rem]" />
              </button>
            )
          )}
        </div>
      </div>
      <PrintNote material={material} copy={t.print} className="mt-3 text-xs" />
    </div>
  );
}
