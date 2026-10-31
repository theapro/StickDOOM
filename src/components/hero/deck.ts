/**
 * Showcase layout shared by the WebGL scene and the CSS fallback.
 * Units are sticker widths; +y is up, -z is away from the viewer.
 * Only one sticker is visible at a time: the next one waits, invisible, behind it.
 */

export type Slot = "front" | "enter" | "exit";

export interface SlotTransform {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  opacity: number;
}

export const SLOT_TRANSFORMS: Record<Slot, SlotTransform> = {
  front: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1, opacity: 1 },
  enter: { x: 0.12, y: -0.06, z: -0.9, rx: 0.12, ry: 0.35, rz: -0.12, scale: 0.9, opacity: 0 },
  // Lifts toward the viewer like a peeled sticker; stays inside the stage so it never clips.
  exit: { x: -0.28, y: 0.2, z: 0.9, rx: -0.32, ry: -0.45, rz: 0.2, scale: 1, opacity: 0 },
};

function span(slot: Slot) {
  const from = SLOT_TRANSFORMS.front;
  const to = SLOT_TRANSFORMS[slot];
  return Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
}

/** Distances from the front slot; cards fade by travel, not time. */
export const EXIT_SPAN = span("exit");
export const ENTER_SPAN = span("enter");

export interface DeckItem {
  index: number;
  slot: Slot;
}

/**
 * Which stickers to mount for the current index: the visible one, the next
 * one waiting behind it, and the one that just left (so it can animate out,
 * or back in on "previous").
 */
export function getDeckItems(count: number, active: number): DeckItem[] {
  if (count === 1) return [{ index: 0, slot: "front" }];
  const items: DeckItem[] = [{ index: active, slot: "front" }];
  items.push({ index: wrapIndex(active + 1, count), slot: "enter" });
  if (count > 2) items.push({ index: wrapIndex(active - 1, count), slot: "exit" });
  return items;
}

export function wrapIndex(index: number, count: number) {
  return ((index % count) + count) % count;
}
