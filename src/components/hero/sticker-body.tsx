"use client";

import { useCallback, useEffect, useMemo, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { applyPaperBend, createBackingTexture, createStickerGeometry, type StickerGeometry } from "./sticker-geometry";

export interface SceneSticker {
  id: string;
  textureUrl: string;
  aspect: number;
  /** Corner radius as a fraction of the width. */
  radius: number;
  /** Print size relative to the other stickers in the scene. */
  scale: number;
}

export interface SharedResources {
  geometry: StickerGeometry;
  backing: THREE.CanvasTexture;
}

/** Stickers with the same key share geometry and backing. */
export const shapeKey = (sticker: Pick<SceneSticker, "aspect" | "radius">) => `${sticker.aspect}|${sticker.radius}`;

function createResources(key: string, maxAnisotropy: number): SharedResources {
  const [aspect, radius] = key.split("|").map(Number);
  return {
    geometry: createStickerGeometry(aspect, radius),
    backing: createBackingTexture(aspect, maxAnisotropy),
  };
}

/** Geometry and backing texture for one sticker shape; disposed with the scene. */
export function useSharedResources(sticker: Pick<SceneSticker, "aspect" | "radius">): SharedResources {
  const gl = useThree((state) => state.gl);
  const key = shapeKey(sticker);
  const resources = useMemo(() => createResources(key, gl.capabilities.getMaxAnisotropy()), [key, gl]);

  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.backing.dispose();
    },
    [resources],
  );
  return resources;
}

/** One set of shared resources per distinct sticker shape, for scenes mixing packs. Keyed by `shapeKey`. */
export function useResourcesByShape(stickers: SceneSticker[]): Map<string, SharedResources> {
  const gl = useThree((state) => state.gl);
  const key = [...new Set(stickers.map(shapeKey))].sort().join(",");
  const map = useMemo(
    () => new Map(key.split(",").map((shape) => [shape, createResources(shape, gl.capabilities.getMaxAnisotropy())] as const)),
    [key, gl],
  );

  useEffect(
    () => () => {
      for (const resources of map.values()) {
        resources.geometry.dispose();
        resources.backing.dispose();
      }
    },
    [map],
  );
  return map;
}

/** Loads a sticker print as an sRGB, anisotropic texture and frees it from the GPU on unmount. */
export function useStickerTexture(url: string) {
  const gl = useThree((state) => state.gl);
  const configure = useCallback(
    (loaded: THREE.Texture | THREE.Texture[]) => {
      for (const tex of Array.isArray(loaded) ? loaded : [loaded]) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      }
    },
    [gl],
  );
  const texture = useTexture(url, configure);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** The physical sticker: glossy printed face, branded backing and paper edge, all sharing one flex. */
export function StickerBody({
  texture,
  shared,
  bendRef,
  frontMaterialRef,
  backMeshRef,
  edgeMeshRef,
  initialOpacity = 1,
}: {
  texture: THREE.Texture;
  shared: SharedResources;
  bendRef: RefObject<THREE.IUniform<number>>;
  frontMaterialRef?: RefObject<THREE.MeshPhysicalMaterial | null>;
  backMeshRef?: RefObject<THREE.Mesh | null>;
  edgeMeshRef?: RefObject<THREE.Mesh | null>;
  initialOpacity?: number;
}) {
  const onBeforeCompile = useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => applyPaperBend(shader, bendRef.current),
    [bendRef],
  );
  const solid = initialOpacity === 1;

  return (
    <>
      <mesh geometry={shared.geometry.front} castShadow receiveShadow>
        {/* Matte print under a glossy laminate: no base specular keeps the ink colours true,
            the sharp clearcoat only glints when the sticker tilts toward a light. */}
        <meshPhysicalMaterial
          ref={frontMaterialRef}
          map={texture}
          roughness={0.6}
          specularIntensity={0}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transparent
          opacity={initialOpacity}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>
      <mesh ref={backMeshRef} geometry={shared.geometry.back} visible={solid}>
        <meshStandardMaterial map={shared.backing} roughness={0.85} onBeforeCompile={onBeforeCompile} />
      </mesh>
      <mesh ref={edgeMeshRef} geometry={shared.geometry.edge} visible={solid}>
        <meshStandardMaterial color="#f3f2ee" roughness={0.55} onBeforeCompile={onBeforeCompile} />
      </mesh>
    </>
  );
}
