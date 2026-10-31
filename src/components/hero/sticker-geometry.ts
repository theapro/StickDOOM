import * as THREE from "three";

/** Visual thickness: the real stickers are thin 135gsm photo paper, so the edge only just reads. */
export const STICKER_THICKNESS = 0.006;
const FACE_OFFSET = 0.0004;
/** Columns of vertices across the width, so the paper can flex smoothly. */
const SEGMENTS = 32;
/** Extra vertex columns per rounded corner. */
const CORNER_SEGMENTS = 10;

export interface StickerGeometry {
  width: number;
  height: number;
  front: THREE.BufferGeometry;
  back: THREE.BufferGeometry;
  /** Paper edge: a thin wall following the outline. */
  edge: THREE.BufferGeometry;
  dispose: () => void;
}

/**
 * The sticker outline as vertical columns: x positions with the half-height of the shape there.
 * Rounded corners get extra columns, and every column is a vertex line the paper bend can follow.
 */
function outlineColumns(width: number, height: number, radius: number) {
  const halfW = width / 2;
  const halfH = height / 2;
  const xs = Array.from({ length: SEGMENTS + 1 }, (_, i) => -halfW + (width * i) / SEGMENTS);
  if (radius > 0) {
    for (let i = 0; i <= CORNER_SEGMENTS; i++) {
      const offset = radius * (1 - Math.cos((Math.PI / 2) * (i / CORNER_SEGMENTS)));
      xs.push(-halfW + offset, halfW - offset);
    }
  }
  const sorted = xs.sort((a, b) => a - b).filter((x, i, all) => i === 0 || x - all[i - 1] > 1e-6);
  const inner = halfW - radius;
  return sorted.map((x) => {
    const dx = Math.abs(x) - inner;
    return { x, y: dx > 0 ? halfH - radius + Math.sqrt(Math.max(0, radius * radius - dx * dx)) : halfH };
  });
}

function createFace(columns: { x: number; y: number }[], width: number, height: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const { x, y } of columns) {
    positions.push(x, y, 0, x, -y, 0);
    uvs.push(x / width + 0.5, y / height + 0.5, x / width + 0.5, -y / height + 0.5);
  }
  for (let i = 0; i < columns.length - 1; i++) {
    const top = i * 2;
    const bottom = top + 1;
    indices.push(bottom, bottom + 2, top + 2, bottom, top + 2, top);
  }
  const face = new THREE.BufferGeometry();
  face.setIndex(indices);
  face.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  face.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  face.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(positions.length / 3).fill([0, 0, 1]).flat(), 3));
  return face;
}

function createEdge(columns: { x: number; y: number }[]) {
  // Clockwise loop: along the top left to right, then back along the bottom.
  const loop = [...columns.map(({ x, y }) => [x, y]), ...[...columns].reverse().map(({ x, y }) => [x, -y])];
  const z = STICKER_THICKNESS / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  for (let i = 0; i < loop.length; i++) {
    const [px, py] = loop[i];
    const [qx, qy] = loop[(i + 1) % loop.length];
    const length = Math.hypot(qx - px, qy - py);
    if (length < 1e-9) continue;
    const nx = -(qy - py) / length;
    const ny = (qx - px) / length;
    positions.push(px, py, -z, qx, qy, z, qx, qy, -z, px, py, -z, px, py, z, qx, qy, z);
    for (let k = 0; k < 6; k++) normals.push(nx, ny, 0);
  }
  const edge = new THREE.BufferGeometry();
  edge.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  edge.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return edge;
}

/**
 * A paper sticker one unit wide with a printed face, backing and edge. `radius` is the die-cut
 * corner radius as a fraction of the width; 0 gives square corners.
 */
export function createStickerGeometry(aspect: number, radius = 0): StickerGeometry {
  const width = 1;
  const height = 1 / aspect;
  const half = STICKER_THICKNESS / 2 + FACE_OFFSET;
  const columns = outlineColumns(width, height, Math.min(radius, width / 2, height / 2));

  const front = createFace(columns, width, height);
  front.translate(0, 0, half);

  const back = createFace(columns, width, height);
  back.rotateY(Math.PI);
  back.translate(0, 0, -half);

  const edge = createEdge(columns);

  return {
    width,
    height,
    front,
    back,
    edge,
    dispose() {
      front.dispose();
      back.dispose();
      edge.dispose();
    },
  };
}

/**
 * Injects a paper flex into a built-in material: the sticker curves around its vertical axis by
 * `bend` (edge lift = bend / 4 sticker widths). Normals follow the curve so lighting stays right.
 */
export function applyPaperBend(shader: THREE.WebGLProgramParametersWithUniforms, bend: THREE.IUniform<number>) {
  shader.uniforms.uBend = bend;
  shader.vertexShader = `uniform float uBend;\n${shader.vertexShader}`
    .replace(
      "#include <beginnormal_vertex>",
      "#include <beginnormal_vertex>\nobjectNormal.x -= 2.0 * uBend * position.x * objectNormal.z;",
    )
    .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.z += uBend * position.x * position.x;");
}

/** Release-liner texture for the back of every sticker: paper tone, repeated wordmark, split line. */
export function createBackingTexture(aspect: number, maxAnisotropy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = Math.round(512 / aspect);
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  if (!ctx) return texture;

  const styles = getComputedStyle(document.documentElement);
  const display = styles.getPropertyValue("--font-space-grotesk").trim() || "sans-serif";
  const mono = styles.getPropertyValue("--font-space-mono").trim() || "monospace";
  const { width, height } = canvas;

  ctx.fillStyle = "#ecebe6";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.fillStyle = "#dedcd5";
  ctx.font = `700 30px ${display}`;
  ctx.textAlign = "center";
  const step = 64;
  for (let row = -14; row <= 14; row++) {
    const shift = row % 2 === 0 ? 0 : 110;
    for (let col = -4; col <= 4; col++) {
      ctx.fillText("STICKDOOM", col * 220 + shift, row * step);
    }
  }
  ctx.restore();

  ctx.strokeStyle = "#c4c2bb";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 9]);
  ctx.beginPath();
  ctx.moveTo(width * 0.38, 0);
  ctx.lineTo(width * 0.38, height);
  ctx.stroke();

  ctx.fillStyle = "#8f8d87";
  ctx.font = `400 15px ${mono}`;
  ctx.fillText("STICKDOOM — STICK YOUR WORLD.", 26, height - 30);
  ctx.fillStyle = "#e53935";
  ctx.fillRect(26, 26, 12, 12);

  texture.needsUpdate = true;
  return texture;
}
