export type Ctx = CanvasRenderingContext2D;
export type DrawFn = (d: Ctx, b: Ctx, s: number, rand: () => number) => void;

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
    const shade = rand() > 0.5 ? 255 : 36;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${(0.025 + rand() * maxAlpha).toFixed(3)})`;
    ctx.fillRect(rand() * s, rand() * s, 1 + rand() * 2.5, 1 + rand() * 2.5);
  }
}

export const drawCobblestone: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#a99e8b", "#383838");
  const tones = ["#ebe2d2", "#e1d5c2", "#d8c9b2", "#f0e8da", "#cfc0a8"];
  const cellH = s / 6;
  const cellW = s / 4;
  for (let r = 0; r < 6; r++) {
    const off = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= 4; c++) {
      const x = c * cellW + off + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;
      d.fillStyle = pick(tones, rand, "#e1d5c2");
      d.beginPath();
      d.roundRect(x, y, w, h, 7);
      d.fill();
      d.strokeStyle = "rgba(255,252,245,0.42)";
      d.lineWidth = 2;
      d.stroke();
      d.strokeStyle = "rgba(72,58,42,0.2)";
      d.lineWidth = 1;
      d.strokeRect(x + 2, y + h - 3, w - 4, 2);
      const lum = Math.floor(180 + rand() * 62);
      b.fillStyle = `rgb(${lum},${lum},${lum})`;
      b.beginPath();
      b.roundRect(x + 1, y + 1, w - 2, h - 2, 6);
      b.fill();
    }
  }
  addNoise(d, s, rand, 320, 0.055);
  addNoise(b, s, rand, 260, 0.085);
};

export const drawTerracotta: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#bd502b", "#565656");
  const rowH = s / 4;
  const colW = s / 6;
  const tones = ["#e2754b", "#d6643c", "#eb845b", "#cc5a33"];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const x = c * colW;
      const y = r * rowH;
      const g = d.createLinearGradient(x, y, x + colW, y);
      g.addColorStop(0, "#a84423");
      g.addColorStop(0.45, pick(tones, rand, "#e2754b"));
      g.addColorStop(0.75, "#f0966e");
      g.addColorStop(1, "#9d3d1e");
      d.fillStyle = g;
      d.fillRect(x + 1, y + 2, colW - 2, rowH - 3);
      d.fillStyle = "rgba(82,24,10,0.34)";
      d.fillRect(x, y + rowH - 6, colW, 6);
      const bg = b.createLinearGradient(x, y, x + colW, y);
      bg.addColorStop(0, "#404040");
      bg.addColorStop(0.5, "#f0f0f0");
      bg.addColorStop(1, "#404040");
      b.fillStyle = bg;
      b.fillRect(x + 1, y + 2, colW - 2, rowH - 5);
    }
  }
  addNoise(d, s, rand, 220, 0.045);
};

export const drawGrass: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#5fa845", "#808080");
  const greens = ["#72bd54", "#52963b", "#83ce60", "#498935", "#96d970"];
  for (let i = 0; i < 660; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const tx = x + (rand() - 0.5) * 5.5;
    const ty = y - (5 + rand() * 11);
    d.strokeStyle = pick(greens, rand, "#72bd54");
    d.lineWidth = 1.6;
    d.beginPath();
    d.moveTo(x, y);
    d.lineTo(tx, ty);
    d.stroke();
    const lum = Math.floor(110 + rand() * 115);
    b.strokeStyle = `rgb(${lum},${lum},${lum})`;
    b.lineWidth = 1.4;
    b.beginPath();
    b.moveTo(x, y);
    b.lineTo(tx, ty);
    b.stroke();
  }
};

export const drawSandstone: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#e3b986", "#969696");
  const bands = ["#edd0a3", "#dca973", "#e6bc8b", "#d0975e", "#f2d6ae"];
  const rowH = s / 4;
  for (let r = 0; r < 4; r++) {
    const y = r * rowH;
    const off = (r % 2) * (s / 4);
    for (let c = -1; c <= 2; c++) {
      const x = c * (s / 2) + off;
      const w = s / 2;
      d.fillStyle = pick(bands, rand, "#e6bc8b");
      d.fillRect(x + 2, y + 2, w - 4, rowH - 4);
      const bv = Math.floor(148 + rand() * 68);
      b.fillStyle = `rgb(${bv},${bv},${bv})`;
      b.fillRect(x + 2, y + 2, w - 4, rowH - 4);
      d.fillStyle = "rgba(128,72,30,0.22)";
      d.fillRect(x, y, w, 2);
      d.fillRect(x, y, 2, rowH);
      b.fillStyle = "#484848";
      b.fillRect(x, y, w, 2);
      b.fillRect(x, y, 2, rowH);
    }
  }
  addNoise(d, s, rand, 440, 0.06);
  addNoise(b, s, rand, 380, 0.09);
};

export const drawTimber: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#b87f50", "#8e8e8e");
  const plankH = s / 6;
  const tones = ["#c88f5e", "#b57b4c", "#d19a6b", "#a96e40"];
  for (let p = 0; p < 6; p++) {
    const y = p * plankH;
    d.fillStyle = pick(tones, rand, "#b87f50");
    d.fillRect(0, y + 1, s, plankH - 2);
    for (let g = 0; g < 12; g++) {
      const gy = y + 3 + rand() * (plankH - 6);
      d.strokeStyle = rand() > 0.5 ? "rgba(88,48,20,0.18)" : "rgba(255,232,198,0.18)";
      d.lineWidth = 1 + rand() * 1.4;
      d.beginPath();
      d.moveTo(0, gy);
      d.bezierCurveTo(s * 0.33, gy + (rand() - 0.5) * 4, s * 0.66, gy + (rand() - 0.5) * 4, s, gy);
      d.stroke();
    }
    const jointX = ((p * 97 + 42) % (s - 40)) + 20;
    d.fillStyle = "#764824";
    d.fillRect(0, y, s, 2);
    d.fillRect(jointX, y, 2, plankH);
    drawCircle(d, jointX - 6, y + plankH * 0.5, 2.1, "rgba(45,32,24,0.55)");
    drawCircle(d, jointX + 8, y + plankH * 0.5, 2.1, "rgba(45,32,24,0.55)");
    b.fillStyle = "#2c2c2c";
    b.fillRect(0, y, s, 3);
    b.fillRect(jointX, y, 2, plankH);
    b.fillStyle = "#d2d2d2";
    b.fillRect(0, y + 3, s, plankH - 4);
  }
};

export const drawConcrete: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#d8dfe7", "#b8b8b8");
  const half = s / 2;
  d.fillStyle = "rgba(255,255,255,0.14)";
  d.fillRect(0, 0, half, half);
  d.fillRect(half, half, half, half);
  strokeCrossGrid(d, s, "rgba(100,116,139,0.32)", 3);
  strokeCrossGrid(b, s, "#525252", 3);
  const dots: readonly [number, number][] = [
    [22, 22], [half - 22, 22], [half + 22, 22], [s - 22, 22], [22, half + 22], [s - 22, half + 22],
  ];
  for (const [dx, dy] of dots) {
    drawCircle(d, dx, dy, 3.2, "rgba(85,100,122,0.34)");
    drawCircle(b, dx, dy, 3.2, "#464646");
  }
  addNoise(d, s, rand, 360, 0.055);
  addNoise(b, s, rand, 360, 0.075);
};

export const drawMarble: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#f5f3ec", "#e2e2e2");
  for (let v = 0; v < 11; v++) {
    d.strokeStyle = v % 3 === 0 ? "rgba(192,164,116,0.24)" : "rgba(148,163,184,0.22)";
    d.lineWidth = 1.1 + rand() * 2.1;
    let x = rand() * s;
    let y = rand() * s;
    d.beginPath();
    d.moveTo(x, y);
    for (let st = 0; st < 5; st++) {
      x += (rand() - 0.35) * 58;
      y += (rand() - 0.35) * 58;
      d.lineTo(x, y);
    }
    d.stroke();
  }
  strokeCrossGrid(d, s, "rgba(155,148,136,0.38)", 2);
  strokeCrossGrid(b, s, "#646464", 2);
};

export const drawSteel: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#eef2f6", "#b8b8b8");
  for (let i = 0; i < 180; i++) {
    d.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.22)" : "rgba(71,85,105,0.09)";
    d.fillRect(0, rand() * s, s, 1.5);
  }
  d.strokeStyle = "rgba(51,65,85,0.32)";
  d.lineWidth = 4;
  d.strokeRect(4, 4, s - 8, s - 8);
  d.fillStyle = "rgba(255,255,255,0.24)";
  d.fillRect(10, s * 0.44, s - 20, s * 0.12);
  b.strokeStyle = "#424242";
  b.lineWidth = 4;
  b.strokeRect(4, 4, s - 8, s - 8);
  for (let i = 1; i <= 5; i++) {
    const p = (i * s) / 6;
    for (const edge of [16, s - 16]) {
      drawCircle(d, p, edge, 4, "rgba(60,74,94,0.38)");
      drawCircle(b, p, edge, 4.2, "#f4f4f4");
    }
  }
};

export const drawFoliage: DrawFn = (d, b, s, rand) => {
  fillPair(d, b, s, "#428f39", "#606060");
  const leaves = ["#58b34b", "#3f8a36", "#72ca5f", "#88d971", "#33742d"];
  for (let i = 0; i < 340; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const rx = 5 + rand() * 10;
    const ry = 3 + rand() * 6;
    const ang = rand() * Math.PI;
    d.fillStyle = pick(leaves, rand, "#58b34b");
    d.beginPath();
    d.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2);
    d.fill();
    const lum = Math.floor(110 + rand() * 130);
    b.fillStyle = `rgb(${lum},${lum},${lum})`;
    b.beginPath();
    b.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2);
    b.fill();
  }
};
