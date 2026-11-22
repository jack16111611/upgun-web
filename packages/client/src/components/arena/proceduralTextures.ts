import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { BlockMaterialKind } from "@upgun/shared";
import {
  drawCobblestone,
  drawConcrete,
  drawFoliage,
  drawGrass,
  drawMarble,
  drawSandstone,
  drawSteel,
  drawTerracotta,
  drawTimber,
  type DrawFn,
} from "./proceduralTexturePainters";

export interface MaterialTextureSet {
  map: CanvasTexture;
  bumpMap: CanvasTexture;
  roughnessMap: CanvasTexture;
  roughness: number;
  metalness: number;
}

interface MaterialPbrSpec {
  roughness: number;
  metalness: number;
  roughMin: number;
  roughMax: number;
  seed: number;
  draw: DrawFn;
}

interface CanvasTriple {
  diffuse: HTMLCanvasElement;
  bump: HTMLCanvasElement;
  rough: HTMLCanvasElement;
  roughness: number;
  metalness: number;
}

const TEX_SIZE = 256;

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MATERIAL_SPECS: Record<BlockMaterialKind, MaterialPbrSpec> = {
  cobblestone: { roughness: 0.88, metalness: 0.02, roughMin: 0.7, roughMax: 1.0, seed: 101, draw: drawCobblestone },
  terracotta: { roughness: 0.78, metalness: 0.03, roughMin: 0.66, roughMax: 1.0, seed: 202, draw: drawTerracotta },
  grass: { roughness: 0.94, metalness: 0.0, roughMin: 0.84, roughMax: 1.0, seed: 303, draw: drawGrass },
  sandstone: { roughness: 0.9, metalness: 0.02, roughMin: 0.78, roughMax: 1.0, seed: 404, draw: drawSandstone },
  timber: { roughness: 0.78, metalness: 0.03, roughMin: 0.68, roughMax: 1.0, seed: 505, draw: drawTimber },
  concrete: { roughness: 0.85, metalness: 0.04, roughMin: 0.74, roughMax: 1.0, seed: 606, draw: drawConcrete },
  marble: { roughness: 0.42, metalness: 0.05, roughMin: 0.62, roughMax: 1.0, seed: 707, draw: drawMarble },
  steel: { roughness: 0.46, metalness: 0.45, roughMin: 0.6, roughMax: 1.0, seed: 808, draw: drawSteel },
  foliage: { roughness: 0.92, metalness: 0.0, roughMin: 0.82, roughMax: 1.0, seed: 909, draw: drawFoliage },
};

const baseCanvasCache = new Map<BlockMaterialKind, CanvasTriple>();
const textureSetCache = new Map<string, MaterialTextureSet>();

function buildRoughnessCanvas(bump: HTMLCanvasElement, minR: number, maxR: number): HTMLCanvasElement {
  const rough = document.createElement("canvas");
  rough.width = rough.height = bump.width;
  const bCtx = bump.getContext("2d");
  const rCtx = rough.getContext("2d");
  if (!bCtx || !rCtx) return rough;
  const src = bCtx.getImageData(0, 0, bump.width, bump.height);
  const dst = rCtx.createImageData(bump.width, bump.height);
  const sData = src.data;
  const dData = dst.data;
  for (let i = 0; i < sData.length; i += 4) {
    const height = (sData[i] ?? 128) / 255;
    const val = Math.round((maxR - height * (maxR - minR)) * 255);
    dData[i] = val;
    dData[i + 1] = val;
    dData[i + 2] = val;
    dData[i + 3] = 255;
  }
  rCtx.putImageData(dst, 0, 0);
  return rough;
}

function getOrCreateCanvasTriple(kind: BlockMaterialKind): CanvasTriple {
  const existing = baseCanvasCache.get(kind);
  if (existing) return existing;
  const spec = MATERIAL_SPECS[kind];
  const diffuse = document.createElement("canvas");
  const bump = document.createElement("canvas");
  diffuse.width = bump.width = diffuse.height = bump.height = TEX_SIZE;
  const dCtx = diffuse.getContext("2d");
  const bCtx = bump.getContext("2d");
  if (dCtx && bCtx) spec.draw(dCtx, bCtx, TEX_SIZE, createRng(spec.seed));
  const rough = buildRoughnessCanvas(bump, spec.roughMin, spec.roughMax);
  const triple: CanvasTriple = {
    diffuse,
    bump,
    rough,
    roughness: spec.roughness,
    metalness: spec.metalness,
  };
  baseCanvasCache.set(kind, triple);
  return triple;
}

function makeTiledTexture(canvas: HTMLCanvasElement, rx: number, ry: number, srgb: boolean): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(rx, ry);
  if (srgb) tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Returns cached procedural diffuse + bump + roughness CanvasTextures and PBR parameters
 * for the requested architectural material and UV repeat scale.
 */
export function getMaterialTextures(
  kind: BlockMaterialKind,
  repeatX: number,
  repeatY: number,
): MaterialTextureSet {
  const rx = Math.max(0.5, Math.round(repeatX * 2) / 2);
  const ry = Math.max(0.5, Math.round(repeatY * 2) / 2);
  const key = `${kind}:${rx}:${ry}`;
  const cached = textureSetCache.get(key);
  if (cached) return cached;

  const triple = getOrCreateCanvasTriple(kind);
  const set: MaterialTextureSet = {
    map: makeTiledTexture(triple.diffuse, rx, ry, true),
    bumpMap: makeTiledTexture(triple.bump, rx, ry, false),
    roughnessMap: makeTiledTexture(triple.rough, rx, ry, false),
    roughness: triple.roughness,
    metalness: triple.metalness,
  };
  textureSetCache.set(key, set);
  return set;
}
