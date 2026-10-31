"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { SceneGrid } from "./scene-grid";

/** Studio lighting, the shadow-catching wall and the grid backdrop shared by every sticker scene. */
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={1.05} />
      <directionalLight
        position={[-2.5, 3.5, 8.5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={9}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <mesh position={[0, 0, -1.6]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
      <SceneGrid />
      {/* Light-formers sit off the view axis, so the laminate reflects them only when tilted. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={4} position={[-6, 4, 3.5]} scale={[3, 9, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.5} position={[6, -2, 3.5]} scale={[2.5, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 7, 2]} scale={[10, 2, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}
