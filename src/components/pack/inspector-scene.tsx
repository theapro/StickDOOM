"use client";

import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SceneLights } from "@/components/hero/scene-lights";
import { StickerBody, useSharedResources, useStickerTexture, type SceneSticker } from "@/components/hero/sticker-body";

/** Written by the viewer's DOM layer, read every frame. `flips`/`resets` are counters: bump to trigger. */
export interface InspectorInput {
  dragging: boolean;
  pendingX: number;
  pendingY: number;
  flips: number;
  resets: number;
}

export interface InspectorSceneProps {
  sticker: SceneSticker;
  /** Box the largest sticker of the set fits in (see `stickerBounds`), so print sizes stay comparable. */
  bounds: { width: number; height: number };
  /** Neighbouring textures to warm up so browsing doesn't flash. */
  preload: string[];
  inputRef: RefObject<InspectorInput>;
  reducedMotion: boolean;
  paused: boolean;
  onReady: () => void;
  onError: () => void;
}

const TAU = Math.PI * 2;
const MAX_PITCH = 1.1;
const { damp, clamp } = THREE.MathUtils;

function InspectedSticker({
  sticker,
  bounds,
  inputRef,
  reducedMotion,
  onReady,
}: Pick<InspectorSceneProps, "sticker" | "bounds" | "inputRef" | "reducedMotion" | "onReady">) {
  const viewport = useThree((state) => state.viewport);
  const shared = useSharedResources(sticker);
  const texture = useStickerTexture(sticker.textureUrl);
  const groupRef = useRef<THREE.Group>(null);
  const frontRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const backMeshRef = useRef<THREE.Mesh>(null);
  const edgeMeshRef = useRef<THREE.Mesh>(null);
  const bendRef = useRef<THREE.IUniform<number>>({ value: 0 });
  const stateRef = useRef({
    yaw: 0,
    pitch: 0,
    velocity: 0,
    target: null as number | null,
    pitchTarget: null as number | null,
    seenFlips: -1,
    seenResets: -1,
    appear: 0,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [onReady]);

  const fit = sticker.scale * Math.min((viewport.height * 0.8) / bounds.height, (viewport.width * 0.72) / bounds.width);

  useFrame((_, delta) => {
    const node = groupRef.current;
    if (!node) return;
    const dt = Math.min(delta, 1 / 20);
    const input = inputRef.current;
    const s = stateRef.current;

    if (s.seenFlips < 0) {
      s.seenFlips = input.flips;
      s.seenResets = input.resets;
    }
    if (input.flips !== s.seenFlips) {
      s.seenFlips = input.flips;
      s.velocity = 0;
      s.target = (Math.round(s.yaw / Math.PI) + 1) * Math.PI;
    }
    if (input.resets !== s.seenResets) {
      s.seenResets = input.resets;
      s.velocity = 0;
      s.target = Math.round(s.yaw / TAU) * TAU;
      s.pitchTarget = 0;
    }

    const dx = input.pendingX;
    const dy = input.pendingY;
    input.pendingX = 0;
    input.pendingY = 0;

    if (input.dragging) {
      const step = dx * 0.011;
      s.yaw += step;
      s.pitch = clamp(s.pitch + dy * 0.008, -MAX_PITCH, MAX_PITCH);
      s.velocity = damp(s.velocity, step / Math.max(dt, 1 / 120), 18, dt);
      s.target = null;
      s.pitchTarget = null;
    } else {
      s.yaw += s.velocity * dt;
      s.velocity = reducedMotion ? 0 : s.velocity * Math.exp(-2.4 * dt);
      if (s.target !== null) s.yaw = damp(s.yaw, s.target, reducedMotion ? 20 : 6, dt);
      if (s.pitchTarget !== null) s.pitch = damp(s.pitch, s.pitchTarget, reducedMotion ? 20 : 6, dt);
    }

    // The paper flexes against the spin, like a real sheet of photo paper.
    const flex = reducedMotion ? 0 : clamp(-s.velocity * 0.035, -0.32, 0.32);
    bendRef.current.value = damp(bendRef.current.value, flex, 7, dt);

    node.rotation.set(s.pitch, s.yaw, 0);

    // Real elapsed time (not the capped step) so the fade-in finishes on schedule even on slow frames.
    s.appear = reducedMotion ? 1 : Math.min(1, s.appear + Math.min(delta, 0.25) / 0.35);
    node.scale.setScalar(fit * (0.92 + 0.08 * s.appear));
    if (frontRef.current) frontRef.current.opacity = s.appear;
    const solid = s.appear > 0.995;
    if (backMeshRef.current) backMeshRef.current.visible = solid;
    if (edgeMeshRef.current) edgeMeshRef.current.visible = solid;
  });

  return (
    <group ref={groupRef} scale={fit * 0.92}>
      <StickerBody
        texture={texture}
        shared={shared}
        bendRef={bendRef}
        frontMaterialRef={frontRef}
        backMeshRef={backMeshRef}
        edgeMeshRef={edgeMeshRef}
        initialOpacity={0}
      />
    </group>
  );
}

function Preloader({ urls }: { urls: string[] }) {
  useEffect(() => {
    for (const url of urls) useTexture.preload(url);
  }, [urls]);
  return null;
}

export default function InspectorScene({
  sticker,
  bounds,
  preload,
  inputRef,
  reducedMotion,
  paused,
  onReady,
  onError,
}: InspectorSceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
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
      <Preloader urls={preload} />
      <Suspense fallback={null}>
        <InspectedSticker
          key={sticker.id}
          sticker={sticker}
          bounds={bounds}
          inputRef={inputRef}
          reducedMotion={reducedMotion}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}
