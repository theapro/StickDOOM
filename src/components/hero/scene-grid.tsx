"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Minor cells, major sections and "+" marks on section crossings, faded toward the stage edges.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uMinor;
  uniform float uMajor;
  uniform vec2 uResolution;
  varying vec2 vPos;

  float gridLine(vec2 p, float size, float width) {
    vec2 coord = p / size;
    vec2 g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }

  void main() {
    vec2 p = vPos;
    float minor = gridLine(p, uMinor, 1.0);
    float major = gridLine(p, uMajor, 1.4);

    vec2 cell = abs(fract(p / uMajor - 0.5) - 0.5) * uMajor;
    float arm = 0.07;
    float thick = 0.006;
    float mark = max(
      step(cell.x, thick) * step(cell.y, arm),
      step(cell.y, thick) * step(cell.x, arm)
    );

    // Screen-space vignette so the wall always dissolves before the stage edges, whatever the aspect.
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 edge = smoothstep(vec2(0.0), vec2(0.24), uv) * smoothstep(vec2(0.0), vec2(0.24), 1.0 - uv);

    float alpha = minor * 0.06 + major * 0.13 + mark * 0.45;
    gl_FragColor = vec4(uColor, alpha * edge.x * edge.y);
  }
`;

/** Static futuristic backdrop wall behind the sticker; the sticker's shadow falls across it. */
export function SceneGrid({ z = -1.62 }: { z?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(0x111111) },
      uMinor: { value: 0.32 },
      uMajor: { value: 1.28 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useFrame((state) => {
    const material = materialRef.current;
    if (material) state.gl.getDrawingBufferSize(material.uniforms.uResolution.value);
  });

  return (
    <mesh position={[0, 0, z]} renderOrder={-1}>
      <planeGeometry args={[16, 11]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
