import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { BlockMaterialKind } from "@upgun/shared";

export interface MaterialTextureSet {
  map: CanvasTexture;
  bumpMap: CanvasTexture;
  roughness: number;
  metalness: number;
}

type Ctx = CanvasRenderingContext2D;
type DrawFn = (d: Ctx, b: Ctx, s: number, rand: () => number) => void;
interface MaterialPbrSpec { roughness: number; metalness: number; seed: number; draw: DrawFn }
interface CanvasPair { diffuse: HTMLCanvasElement; bump: HTMLCanvasElement; roughness: number; metalness: number }

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

const pick = <T,>(items: readonly T[], rand: () => number, fallback: T): T =>
  items[Math.floor(rand() * items.length)] ?? fallback;

function fillPair(d: Ctx, b: Ctx, s: number, dColor: string, bColor: string): void {
  d.fillStyle = dColor;
  d.fillRect(0, 0, s, s);
  b.fillStyle = bColor;
  b.fillRect(0, 0, s, s);
}

function drawCircle(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function strokeCrossGrid(ctx: Ctx, s: number, color: string, width: number): void {
  const half = s / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(width / 2, width / 2, s - width, s - width);
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(half, s);
  ctx.moveTo(0, half);
  ctx.lineTo(s, half);
  ctx.stroke();
}

function addNoise(ctx: Ctx, s: number, rand: () => number, count: number, maxAlpha: number): void {
  for (let i = 0; i < count; i++) {
    const shade = rand() > 0.5 ? 255 : 40;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${(0.03 + rand() * maxAlpha).toFixed(3)})`;
    ctx.fillRect(rand() * s, rand() * s, 1 + rand() * 3, 1 + rand() * 3);
  }
}

const drawCobblestone: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#b9ae9c", "#484848");
  const tones = ["#e8dfd0", "#dfd4c1", "#d6c8b2", "#ede6d8", "#cbbda6"];
  const cellH = s / 6;
  const cellW = s / 4;
  for (let r = 0; r < 6; r++) {
    const off = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= 4; c++) {
      const x = c * cellW + off + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;
      d.fillStyle = pick(tones, rand, "#dfd4c1");
      d.beginPath();
      d.roundRect(x, y, w, h, 7);
      d.fill();
      d.strokeStyle = "rgba(255,255,255,0.34)";
      d.lineWidth = 2;
      d.stroke();
      const lum = Math.floor(175 + rand() * 60);
      b.fillStyle = `rgb(${lum},${lum},${lum})`;
      b.beginPath();
      b.roundRect(x + 1, y + 1, w - 2, h - 2, 6);
      b.fill();
    }
  }
  addNoise(d, s, rand, 280, 0.05);
  addNoise(b, s, rand, 240, 0.08);
};

const drawTerracotta: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#c95b34", "#6a6a6a");
  const rowH = s / 4;
  const colW = s / 6;
  const tones = ["#df7249", "#d4643c", "#e68058", "#cb5a33"];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const x = c * colW;
      const y = r * rowH;
      const g = d.createLinearGradient(x, y, x + colW, y);
      g.addColorStop(0, "#b84f2c");
      g.addColorStop(0.45, pick(tones, rand, "#df7249"));
      g.addColorStop(1, "#ad4726");
      d.fillStyle = g;
      d.fillRect(x + 1, y + 2, colW - 2, rowH - 3);
      d.fillStyle = "rgba(90,28,12,0.28)";
      d.fillRect(x, y + rowH - 5, colW, 5);
      const bg = b.createLinearGradient(x, y, x + colW, y);
      bg.addColorStop(0, "#505050");
      bg.addColorStop(0.5, "#e6e6e6");
      bg.addColorStop(1, "#505050");
      b.fillStyle = bg;
      b.fillRect(x + 1, y + 2, colW - 2, rowH - 4);
    }
  }
  addNoise(d, s, rand, 220, 0.04);
};

const drawGrass: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#62ab48", "#888888");
  const greens = ["#72bd54", "#559a3e", "#81cb5f", "#4c8e37", "#92d46e"];
  for (let i = 0; i < 620; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const tx = x + (rand() - 0.5) * 5;
    const ty = y - (5 + rand() * 11);
    d.strokeStyle = pick(greens, rand, "#72bd54");
    d.lineWidth = 1.6;
    d.beginPath();
    d.moveTo(x, y);
    d.lineTo(tx, ty);
    d.stroke();
    const lum = Math.floor(110 + rand() * 110);
    b.strokeStyle = `rgb(${lum},${lum},${lum})`;
    b.lineWidth = 1.4;
    b.beginPath();
    b.moveTo(x, y);
    b.lineTo(tx, ty);
    b.stroke();
  }
};

const drawSandstone: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#e3b885", "#969696");
  const bands = ["#ecc596", "#dba872", "#e4ba88", "#cf965d", "#f0cfa4"];
  for (let y = 0; y < s; ) {
    const h = 8 + rand() * 18;
    d.fillStyle = pick(bands, rand, "#e4ba88");
    d.fillRect(0, y, s, h);
    const bv = Math.floor(120 + rand() * 85);
    b.fillStyle = `rgb(${bv},${bv},${bv})`;
    b.fillRect(0, y, s, h);
    d.fillStyle = "rgba(138,79,36,0.16)";
    d.fillRect(0, y, s, 2);
    b.fillStyle = "#525252";
    b.fillRect(0, y, s, 2);
    y += h;
  }
  addNoise(d, s, rand, 420, 0.06);
  addNoise(b, s, rand, 360, 0.09);
};

const drawTimber: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#b87f50", "#909090");
  const plankH = s / 6;
  const tones = ["#c68d5c", "#b57b4c", "#ce9768", "#aa7043"];
  for (let p = 0; p < 6; p++) {
    const y = p * plankH;
    d.fillStyle = pick(tones, rand, "#b87f50");
    d.fillRect(0, y + 1, s, plankH - 2);
    for (let g = 0; g < 11; g++) {
      const gy = y + 3 + rand() * (plankH - 6);
      d.strokeStyle = rand() > 0.5 ? "rgba(92,52,22,0.16)" : "rgba(255,230,196,0.16)";
      d.lineWidth = 1 + rand() * 1.4;
      d.beginPath();
      d.moveTo(0, gy);
      d.bezierCurveTo(s * 0.33, gy + (rand() - 0.5) * 4, s * 0.66, gy + (rand() - 0.5) * 4, s, gy);
      d.stroke();
    }
    d.fillStyle = "#7a4c28";
    d.fillRect(0, y, s, 2);
    b.fillStyle = "#323232";
    b.fillRect(0, y, s, 3);
    b.fillStyle = "#c8c8c8";
    b.fillRect(0, y + 3, s, plankH - 4);
  }
};

const drawConcrete: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#d8dfe7", "#b8b8b8");
  const half = s / 2;
  d.fillStyle = "rgba(255,255,255,0.12)";
  d.fillRect(0, 0, half, half);
  d.fillRect(half, half, half, half);
  strokeCrossGrid(d, s, "rgba(100,116,139,0.28)", 3);
  strokeCrossGrid(b, s, "#5a5a5a", 3);
  const dots: readonly [number, number][] = [
    [22, 22], [half - 22, 22], [half + 22, 22], [s - 22, 22], [22, half + 22], [s - 22, half + 22],
  ];
  for (const [dx, dy] of dots) {
    drawCircle(d, dx, dy, 3.2, "rgba(100,116,139,0.3)");
    drawCircle(b, dx, dy, 3.2, "#4c4c4c");
  }
  addNoise(d, s, rand, 340, 0.05);
  addNoise(b, s, rand, 340, 0.07);
};

const drawMarble: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#f4f2eb", "#dcdcdc");
  for (let v = 0; v < 9; v++) {
    d.strokeStyle = v % 3 === 0 ? "rgba(186,162,118,0.22)" : "rgba(148,163,184,0.22)";
    d.lineWidth = 1.2 + rand() * 2.2;
    let x = rand() * s;
    let y = rand() * s;
    d.beginPath();
    d.moveTo(x, y);
    for (let st = 0; st < 5; st++) {
      x += (rand() - 0.35) * 60;
      y += (rand() - 0.35) * 60;
      d.lineTo(x, y);
    }
    d.stroke();
  }
  strokeCrossGrid(d, s, "rgba(160,155,142,0.35)", 2);
  strokeCrossGrid(b, s, "#767676", 2);
};

const drawSteel: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#eef2f6", "#b0b0b0");
  for (let i = 0; i < 160; i++) {
    d.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.2)" : "rgba(71,85,105,0.08)";
    d.fillRect(0, rand() * s, s, 1.5);
  }
  d.strokeStyle = "rgba(51,65,85,0.28)";
  d.lineWidth = 4;
  d.strokeRect(4, 4, s - 8, s - 8);
  d.fillStyle = "rgba(255,255,255,0.22)";
  d.fillRect(10, s * 0.45, s - 20, s * 0.1);
  b.strokeStyle = "#484848";
  b.lineWidth = 4;
  b.strokeRect(4, 4, s - 8, s - 8);
  for (let i = 1; i <= 5; i++) {
    const p = (i * s) / 6;
    for (const edge of [16, s - 16]) {
      drawCircle(d, p, edge, 4, "rgba(71,85,105,0.34)");
      drawCircle(b, p, edge, 4.2, "#f2f2f2");
    }
  }
};

const drawFoliage: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#45943c", "#666666");
  const leaves = ["#58b34b", "#3f8a36", "#6fc75d", "#84d66e", "#35782e"];
  for (let i = 0; i < 320; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const rx = 5 + rand() * 10;
    const ry = 3 + rand() * 6;
    const ang = rand() * Math.PI;
    d.fillStyle = pick(leaves, rand, "#58b34b");
    d.beginPath();
    d.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2);
    d.fill();
    const lum = Math.floor(110 + rand() * 125);
    b.fillStyle = `rgb(${lum},${lum},${lum})`;
    b.beginPath();
    b.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2);
    b.fill();
  }
};

const MATERIAL_SPECS: Record<BlockMaterialKind, MaterialPbrSpec> = {
  cobblestone: { roughness: 0.86, metalness: 0.02, seed: 101, draw: drawCobblestone },
  terracotta: { roughness: 0.78, metalness: 0.03, seed: 202, draw: drawTerracotta },
  grass: { roughness: 0.92, metalness: 0.0, seed: 303, draw: drawGrass },
  sandstone: { roughness: 0.88, metalness: 0.02, seed: 404, draw: drawSandstone },
  timber: { roughness: 0.76, metalness: 0.04, seed: 505, draw: drawTimber },
  concrete: { roughness: 0.84, metalness: 0.04, seed: 606, draw: drawConcrete },
  marble: { roughness: 0.42, metalness: 0.06, seed: 707, draw: drawMarble },
  steel: { roughness: 0.48, metalness: 0.42, seed: 808, draw: drawSteel },
  foliage: { roughness: 0.9, metalness: 0.0, seed: 909, draw: drawFoliage },
};

const baseCanvasCache = new Map<BlockMaterialKind, CanvasPair>();
const textureSetCache = new Map<string, MaterialTextureSet>();

function getOrCreateCanvasPair(kind: BlockMaterialKind): CanvasPair {
  const existing = baseCanvasCache.get(kind);
  if (existing) return existing;
  const spec = MATERIAL_SPECS[kind];
  const diffuse = document.createElement("canvas");
  const bump = document.createElement("canvas");
  diffuse.width = bump.width = diffuse.height = bump.height = TEX_SIZE;
  const dCtx = diffuse.getContext("2d");
  const bCtx = bump.getContext("2d");
  if (dCtx && bCtx) spec.draw(dCtx, bCtx, TEX_SIZE, createRng(spec.seed));
  const pair: CanvasPair = { diffuse, bump, roughness: spec.roughness, metalness: spec.metalness };
  baseCanvasCache.set(kind, pair);
  return pair;
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
 * Returns cached procedural diffuse + bump CanvasTextures and PBR parameters
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

  const pair = getOrCreateCanvasPair(kind);
  const set: MaterialTextureSet = {
    map: makeTiledTexture(pair.diffuse, rx, ry, true),
    bumpMap: makeTiledTexture(pair.bump, rx, ry, false),
    roughness: pair.roughness,
    metalness: pair.metalness,
  };
  textureSetCache.set(key, set);
  return set;
}
