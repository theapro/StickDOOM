"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { HeroSticker } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { CropMarks } from "@/components/ui/crop-marks";
import { wrapIndex } from "./deck";
import { StickerDeck2D } from "./sticker-deck-2d";
import type { InteractionState, SceneSticker } from "./sticker-scene";
import { SceneBoundary, supportsWebGL, toSceneSticker, whenIdle, type GlState } from "./webgl";

const StickerScene = dynamic(() => import("./sticker-scene"), { ssr: false });

const AUTOPLAY_MS = 4200;

const controlClass =
  "grid size-11 place-items-center border border-line-strong bg-paper text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper";

export function HeroStage({ stickers }: { stickers: HeroSticker[] }) {
  const { t } = useI18n();
  const count = stickers.length;
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [gl, setGl] = useState<GlState>("idle");
  const reducedMotion = usePrefersReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const interaction = useRef<InteractionState>({ pointerX: 0, pointerY: 0, dragging: false, pendingX: 0, pendingY: 0 });

  // Autoplay always runs; the timer only holds while a finger is mid-drag or nobody can see the stage.
  const playing = count > 1;
  const running = playing && !dragging && inView && pageVisible;

  const sceneStickers = useMemo<SceneSticker[]>(() => stickers.map(toSceneSticker), [stickers]);

  const go = useCallback((step: number) => setActive((index) => wrapIndex(index + step, count)), [count]);

  // Load the WebGL scene once the browser is idle so it never competes with first paint.
  useEffect(() => whenIdle(() => setGl(supportsWebGL() ? "loading" : "unsupported")), []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Cursor anywhere in the window gently steers the deck.
  useEffect(() => {
    if (!inView || reducedMotion) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      interaction.current.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      interaction.current.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onLeave = () => {
      interaction.current.pointerX = 0;
      interaction.current.pointerY = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [inView, reducedMotion]);

  const endDrag = (event: React.PointerEvent) => {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    interaction.current.dragging = false;
    setDragging(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  };

  const onGlReady = useCallback(() => setGl("ready"), []);
  const onGlError = useCallback(() => setGl("unsupported"), []);

  const current = stickers[active];
  const position = `${String(active + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  const showScene = gl === "loading" || gl === "ready";

  return (
    <div className="flex h-full flex-col">
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={t.hero.stage}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          interaction.current.dragging = true;
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.id !== event.pointerId) return;
          interaction.current.pendingX += event.clientX - drag.x;
          interaction.current.pendingY += event.clientY - drag.y;
          drag.x = event.clientX;
          drag.y = event.clientY;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "relative min-h-[22rem] flex-1 touch-pan-y select-none overflow-hidden outline-offset-[-2px]",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <CropMarks className="inset-3 z-10" />

        <StickerDeck2D
          stickers={stickers}
          active={active}
          className={cn("transition-opacity duration-700", gl === "ready" && "opacity-0")}
        />

        {showScene && (
          <SceneBoundary onError={onGlError}>
            <div className={cn("absolute inset-0 transition-opacity duration-700", gl === "ready" ? "opacity-100" : "opacity-0")}>
              <StickerScene
                stickers={sceneStickers}
                active={active}
                interactionRef={interaction}
                reducedMotion={reducedMotion}
                paused={!inView || !pageVisible}
                onReady={onGlReady}
                onError={onGlError}
              />
            </div>
          </SceneBoundary>
        )}

        <div className="label pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2 text-ink">
          <span aria-hidden className="size-1.5 bg-accent" />
          {position}
        </div>
        <p className="label pointer-events-none absolute right-6 top-6 z-10 flex flex-col items-end gap-1.5 text-right text-muted">
          <span className="text-ink">
            <span className="sr-only">{format(t.hero.position, { index: active + 1, count })}</span>
            {current.name}
          </span>
          <span>
            {current.packCode} {current.packName}
          </span>
        </p>
        <p className="label pointer-events-none absolute bottom-6 left-6 z-10 hidden text-muted sm:block" aria-hidden>
          {gl === "unsupported" ? t.hero.useArrows : t.hero.dragToRotate}
        </p>
      </div>

      <div className="flex items-center gap-4 border-t border-line pt-4">
        <div className="flex flex-1 items-center gap-[3px]" aria-hidden>
          {stickers.map((sticker, index) => (
            <span key={sticker.id} className="relative h-[3px] flex-1 overflow-hidden bg-line">
              {index < active && <span className="absolute inset-0 bg-ink/35" />}
              {index === active &&
                (playing ? (
                  <span
                    key={active}
                    data-autoplay-progress
                    className="absolute inset-0 origin-left animate-progress bg-ink"
                    style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                    onAnimationEnd={() => go(1)}
                  />
                ) : (
                  <span className="absolute inset-0 bg-accent" />
                ))}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" className={controlClass} onClick={() => go(-1)} aria-label={t.hero.previous}>
            <ChevronLeft aria-hidden strokeWidth={1.5} className="size-5" />
          </button>
          <button type="button" className={controlClass} onClick={() => go(1)} aria-label={t.hero.next}>
            <ChevronRight aria-hidden strokeWidth={1.5} className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
