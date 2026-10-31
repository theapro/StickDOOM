"use client";

import { getImageProps } from "next/image";
import { Component, type ReactNode } from "react";
import type { Sticker } from "@/lib/types";
import type { SceneSticker } from "./sticker-body";

export type GlState = "idle" | "loading" | "ready" | "unsupported";

/** Swaps a crashed WebGL scene for nothing and lets the caller fall back to its 2D poster. */
export class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Optimised image URL for a sticker texture, served through the Next.js image pipeline. */
export function textureUrl(sticker: Sticker) {
  return getImageProps({ src: sticker.src, alt: "", width: sticker.width, height: sticker.height, quality: 85 }).props
    .src;
}

export function toSceneSticker(sticker: Sticker): SceneSticker {
  return {
    id: sticker.id,
    textureUrl: textureUrl(sticker),
    aspect: sticker.width / sticker.height,
    radius: sticker.radius,
    scale: sticker.scale,
  };
}

/** Runs `start` once the browser is idle so the 3D scene never competes with first paint. */
export function whenIdle(start: () => void) {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(start, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(start, 300);
  return () => clearTimeout(id);
}
