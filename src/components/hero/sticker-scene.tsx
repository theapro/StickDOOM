"use client";

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ENTER_SPAN, EXIT_SPAN, SLOT_TRANSFORMS, getDeckItems, type Slot } from "./deck";
import { SceneLights } from "./scene-lights";
import {
  StickerBody,
  shapeKey,
  useResourcesByShape,
  useStickerTexture,
  type SceneSticker,
  type SharedResources,
} from "./sticker-body";

export type { SceneSticker } from "./sticker-body";

/** Mutable input state written by the DOM stage and read every frame (no React renders). */
export interface InteractionState {
  pointerX: number;
  pointerY: number;
  dragging: boolean;
  pendingX: number;
  pendingY: number;
}

export interface StickerSceneProps {
  stickers: SceneSticker[];
  active: number;
  interactionRef: RefObject<InteractionState>;
  reducedMotion: boolean;
  paused: boolean;
  onReady: () => void;
  onError: () => void;
}

const TAU = Math.PI * 2;
const { damp, clamp } = THREE.MathUtils;

/** How much the paper curls in each slot: flat at the front, peeling as it leaves. */
const SLOT_BEND: Record<Slot, number> = { front: 0, enter: 0.18, exit: 0.5 };

interface CardProps {
  sticker: SceneSticker;
  slot: Slot;
  shared: SharedResources;
  interactionRef: RefObject<InteractionState>;
  reducedMotion: boolean;
  onFrontMounted: () => void;
}

const StickerCard = memo(function StickerCard({
  sticker,
  slot,
  shared,
  interactionRef,
  reducedMotion,
  onFrontMounted,
}: CardProps) {
  const texture = useStickerTexture(sticker.textureUrl);
  const [initial] = useState(() => SLOT_TRANSFORMS[slot]);

  const groupRef = useRef<THREE.Group>(null);
  const frontRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const backMeshRef = useRef<THREE.Mesh>(null);
  const edgeMeshRef = useRef<THREE.Mesh>(null);
  const bendRef = useRef<THREE.IUniform<number>>({ value: SLOT_BEND[slot] });
  const motionRef = useRef({ spin: 0, tilt: 0, velocity: 0, opacity: initial.opacity });

  useEffect(() => {
    if (slot === "front") onFrontMounted();
  }, [slot, onFrontMounted]);

  useFrame((_, delta) => {
    const node = groupRef.current;
    if (!node) return;
    const dt = Math.min(delta, 1 / 20);
    const target = SLOT_TRANSFORMS[slot];
    const state = motionRef.current;
    const lambda = reducedMotion ? 16 : slot === "exit" ? 7.5 : 6;

    if (slot === "front") {
      const input = interactionRef.current;
      const dx = input.pendingX;
      const dy = input.pendingY;
      input.pendingX = 0;
      input.pendingY = 0;
      if (input.dragging) {
        const step = dx * 0.0115;
        state.spin += step;
        state.tilt = clamp(state.tilt + dy * 0.007, -0.65, 0.65);
        state.velocity = damp(state.velocity, step / Math.max(dt, 1 / 120), 18, dt);
      } else {
        state.spin += state.velocity * dt;
        state.velocity *= Math.exp(-2.6 * dt);
        if (Math.abs(state.velocity) < 1.4) {
          state.spin = damp(state.spin, Math.round(state.spin / TAU) * TAU, 4.5, dt);
        }
        state.tilt = damp(state.tilt, 0, 5, dt);
      }
    } else {
      state.velocity = 0;
      state.spin = damp(state.spin, Math.round(state.spin / TAU) * TAU, 5, dt);
      state.tilt = damp(state.tilt, 0, 5, dt);
    }

    // Thin paper flexes against the spin and curls as it peels away.
    const flex = reducedMotion ? 0 : clamp(-state.velocity * 0.035, -0.32, 0.32);
    const bend = bendRef.current;
    bend.value = damp(bend.value, SLOT_BEND[slot] + flex, 7, dt);

    node.position.set(
      damp(node.position.x, target.x, lambda, dt),
      damp(node.position.y, target.y, lambda, dt),
      damp(node.position.z, target.z, lambda, dt),
    );
    node.rotation.set(
      damp(node.rotation.x, target.rx + state.tilt, lambda, dt),
      damp(node.rotation.y, target.ry + state.spin, slot === "front" ? 14 : lambda, dt),
      damp(node.rotation.z, target.rz, lambda, dt),
    );
    node.scale.setScalar(damp(node.scale.x, target.scale, lambda, dt));

    // Fade by distance to the exit and enter points: solid only near the front. The incoming card
    // stays invisible until it is most of the way forward, so it never overlaps the outgoing one.
    const { exit, enter } = SLOT_TRANSFORMS;
    const { x, y, z } = node.position;
    const toExit = Math.hypot(x - exit.x, y - exit.y, z - exit.z) / EXIT_SPAN;
    const toEnter = Math.hypot(x - enter.x, y - enter.y, z - enter.z) / ENTER_SPAN;
    const opacity = Math.min(
      THREE.MathUtils.smoothstep(toExit, 0.2, 0.85),
      THREE.MathUtils.smoothstep(toEnter, 0.7, 0.98),
    );
    if (Math.abs(opacity - state.opacity) > 1e-4) {
      state.opacity = opacity;
      if (frontRef.current) frontRef.current.opacity = opacity;
    }
    // Back and edge would show through a translucent face, so they only render when solid.
    const solid = opacity > 0.995;
    if (backMeshRef.current) backMeshRef.current.visible = solid;
    if (edgeMeshRef.current) edgeMeshRef.current.visible = solid;
    node.visible = opacity > 0.005;
  });

  // Mount at the slot's resting transform so new cards don't fly in from the origin.
  return (
    <group
      ref={groupRef}
      position={[initial.x, initial.y, initial.z]}
      rotation={[initial.rx, initial.ry, initial.rz]}
      scale={initial.scale}
    >
      <group scale={sticker.scale}>
        <StickerBody
          texture={texture}
          shared={shared}
          bendRef={bendRef}
          frontMaterialRef={frontRef}
          backMeshRef={backMeshRef}
          edgeMeshRef={edgeMeshRef}
          initialOpacity={initial.opacity}
        />
      </group>
    </group>
  );
});

type DeckProps = Omit<StickerSceneProps, "paused" | "onError">;

function Deck({ stickers, active, interactionRef, reducedMotion, onReady }: DeckProps) {
  const viewport = useThree((state) => state.viewport);
  const resources = useResourcesByShape(stickers);
  const rigRef = useRef<THREE.Group>(null);
  const readyRef = useRef(false);

  const items = useMemo(() => getDeckItems(stickers.length, active), [stickers.length, active]);

  // One scale for every sticker, sized so the largest takes ≈ 64% of the stage height, so stickers
  // keep their true relative proportions and print sizes.
  const tallest = Math.max(...stickers.map((sticker) => sticker.scale / sticker.aspect));
  const widest = Math.max(...stickers.map((sticker) => sticker.scale));
  const fit = Math.min((viewport.height * 0.64) / tallest, (viewport.width * 0.56) / widest);

  useEffect(() => {
    for (const d of [2, 3]) {
      const url = stickers[(active + d) % stickers.length]?.textureUrl;
      if (url) useTexture.preload(url);
    }
  }, [active, stickers]);

  useEffect(() => {
    const urls = stickers.map((sticker) => sticker.textureUrl);
    return () => useTexture.clear(urls);
  }, [stickers]);

  const handleFrontMounted = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    requestAnimationFrame(() => requestAnimationFrame(onReady));
  }, [onReady]);

  useFrame((state, delta) => {
    const node = rigRef.current;
    if (!node) return;
    const dt = Math.min(delta, 1 / 20);
    const input = interactionRef.current;
    const t = state.clock.elapsedTime;
    const follow = reducedMotion ? 0 : 1;
    node.rotation.y = damp(node.rotation.y, input.pointerX * 0.32 * follow, 3.2, dt);
    node.rotation.x = damp(node.rotation.x, -input.pointerY * 0.2 * follow, 3.2, dt);
    node.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.55) * 0.018;
    node.position.y = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.035;
  });

  return (
    <group ref={rigRef} scale={fit}>
      {items.map(({ index, slot }) => (
        <Suspense key={stickers[index].id} fallback={null}>
          <StickerCard
            sticker={stickers[index]}
            slot={slot}
            shared={resources.get(shapeKey(stickers[index]))!}
            interactionRef={interactionRef}
            reducedMotion={reducedMotion}
            onFrontMounted={handleFrontMounted}
          />
        </Suspense>
      ))}
    </group>
  );
}

export default function StickerScene({ paused, onError, ...deck }: StickerSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={paused ? "never" : "always"}
      flat
      shadows="percentage"
      camera={{ fov: 30, position: [0, 0, 8], near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onError();
        });
      }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <SceneLights />
      <Suspense fallback={null}>
        <Deck {...deck} />
      </Suspense>
    </Canvas>
  );
}
