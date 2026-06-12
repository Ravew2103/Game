"use strict";

/* =========================================================================
   Cidade Infinita — um "canvas" de mapa.

   O jogador desenha o esqueleto da cidade com poucos pincéis:
     • Rua  — a ESPESSURA define a classe da via:
              fina = rua simples; média = com faixa central;
              larga = avenida com faixa dupla; muito larga = com CANTEIRO central.
     • Rio  — água que serpenteia (a espessura é a largura do rio).
   O jogo então PREENCHE PROCEDURALMENTE em volta:
     • casas surgem ao longo das vias (faixa de fachada), alinhadas à rua;
     • toda ÁREA FECHADA por ruas/avenidas/rios tem o interior populado;
     • onde uma rua cruza um rio, nasce uma PONTE.
   ========================================================================= */

const TILE = 100;
const SPRITE = 220;
const M = 80;               // alcance de influência de um traço sobre uma célula
const FRONTAGE = 22;        // faixa de construção ao longo das vias
const SEED = 0x9e3779b9;

const PAPER = "#e7d8b6";
const STREET = "#efe7cf";
const INK = "#4a3a23";
const LANE = "rgba(120,95,55,0.55)";
const TREE_GREEN = "#6f8a4a";
const PARK_GREEN = "#8a9b5c";
const WATER = "#8fb1b4";
const WATER_INK = "#5c8084";
const WATER_HI = "#bcd6d6";
const ROOF_COLORS = ["#cdb389", "#c2a06f", "#b98c5a", "#d8c39a", "#bca16d", "#a9824f", "#c69c6d"];

/* ===================== RNG / utils ==================================== */
function hash2(x, y) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v));
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = clamp(0, 1, ((px - ax) * dx + (py - ay) * dy) / len2);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function segInt(a, b, c, d) {       // interseção de dois segmentos
  const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
  const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a[0] + t * rx, a[1] + t * ry];
}
function projPoint(px, py, a, b) {  // ponto mais próximo no segmento
  const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1;
  const t = clamp(0, 1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2);
  return [a[0] + t * dx, a[1] + t * dy];
}
// "snap": gruda um ponto em vértices/linhas de traços existentes
function getSnap(wx, wy, maxd) {
  let best = null, bd = maxd;
  for (const s of strokes) for (const v of [s.pts[0], s.pts[s.pts.length - 1]]) {
    const d = Math.hypot(v[0] - wx, v[1] - wy); if (d < bd) { bd = d; best = [v[0], v[1]]; }
  }
  for (const s of strokes) for (let i = 1; i < s.pts.length; i++) {
    const pr = projPoint(wx, wy, s.pts[i - 1], s.pts[i]);
    const d = Math.hypot(pr[0] - wx, pr[1] - wy); if (d < bd) { bd = d; best = pr; }
  }
  return best;
}
// suavização (média móvel) preservando as pontas (mantém o snap)
function smooth(pts) {
  if (pts.length < 3) return pts;
  let p = pts;
  for (let pass = 0; pass < 2; pass++) {
    const out = [p[0]];
    for (let i = 1; i < p.length - 1; i++)
      out.push([0.25 * p[i - 1][0] + 0.5 * p[i][0] + 0.25 * p[i + 1][0],
                0.25 * p[i - 1][1] + 0.5 * p[i][1] + 0.25 * p[i + 1][1]]);
    out.push(p[p.length - 1]); p = out;
  }
  return p;
}

/* ===================== Textura de papel =============================== */
const noiseCanvas = (() => {
  const nc = document.createElement("canvas");
  nc.width = nc.height = 64;
  const nx = nc.getContext("2d");
  const img = nx.createImageData(64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const c = Math.random() < 0.5 ? 40 : 230;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
    img.data[i + 3] = (Math.random() * 26) | 0;
  }
  nx.putImageData(img, 0, 0);
  return nc;
})();

/* ===================== Modelo: traços ================================= */
// stroke: { type:'road'|'river', width, pts:[[wx,wy]...], bbox }
let strokes = [];
const activeCells = new Set();
const spriteCache = new Map();

function strokeBBox(s) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of s.pts) {
    if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
    if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
  }
  const pad = s.width / 2 + 2;
  return [minx - pad, miny - pad, maxx + pad, maxy + pad];
}

/* ===================== Detecção de áreas fechadas ===================== */
// Rasteriza as vias e faz flood-fill a partir de fora; o que não é via nem
// foi alcançado de fora é "interior fechado" -> populamos com construções.
let enc = null; // { x0,y0,G,w,h,data:Uint8Array }  (data: 1=via, 2=interior)
function stampSeg(data, w, h, x0, y0, G, a, b, rad) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(len / (G * 0.6)));
  const rc = Math.max(1, Math.ceil(rad / G));
  for (let s = 0; s <= steps; s++) {
    const px = a[0] + dx * s / steps, py = a[1] + dy * s / steps;
    const cx = Math.floor((px - x0) / G), cy = Math.floor((py - y0) / G);
    for (let oy = -rc; oy <= rc; oy++) for (let ox = -rc; ox <= rc; ox++) {
      if (ox * ox + oy * oy > rc * rc + rc) continue;
      const gx = cx + ox, gy = cy + oy;
      if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
      data[gy * w + gx] = 1;
    }
  }
}
function computeEnclosed() {
  enc = null;
  if (!strokes.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, maxW = 0;
  for (const s of strokes) {
    x0 = Math.min(x0, s.bbox[0]); y0 = Math.min(y0, s.bbox[1]);
    x1 = Math.max(x1, s.bbox[2]); y1 = Math.max(y1, s.bbox[3]); maxW = Math.max(maxW, s.width);
  }
  const pad = maxW + 20; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const G = Math.max(6, Math.max(x1 - x0, y1 - y0) / 600);
  const w = Math.ceil((x1 - x0) / G), h = Math.ceil((y1 - y0) / G);
  if (w < 3 || h < 3 || w * h > 700000) return;   // nada a fechar / grande demais
  const data = new Uint8Array(w * h);
  for (const s of strokes)
    for (let i = 1; i < s.pts.length; i++) stampSeg(data, w, h, x0, y0, G, s.pts[i - 1], s.pts[i], s.width / 2);

  // flood fill de fora (bordas) sobre células livres
  const stack = [];
  const seed = (x, y) => { const i = y * w + x; if (data[i] === 0) { data[i] = 3; stack.push(i); } };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) seed(x - 1, y); if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1); if (y < h - 1) seed(x, y + 1);
  }
  for (let i = 0; i < data.length; i++) if (data[i] === 0) data[i] = 2; // interior fechado

  // densidade por área: cada bloco fechado (componente conexo) -> quanto menor, mais denso
  const dens = new Uint8Array(w * h), seen = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== 2 || seen[i]) continue;
    const comp = [i]; seen[i] = 1;
    for (let qi = 0; qi < comp.length; qi++) {
      const j = comp[qi], x = j % w, y = (j / w) | 0;
      if (x > 0 && data[j - 1] === 2 && !seen[j - 1]) { seen[j - 1] = 1; comp.push(j - 1); }
      if (x < w - 1 && data[j + 1] === 2 && !seen[j + 1]) { seen[j + 1] = 1; comp.push(j + 1); }
      if (y > 0 && data[j - w] === 2 && !seen[j - w]) { seen[j - w] = 1; comp.push(j - w); }
      if (y < h - 1 && data[j + w] === 2 && !seen[j + w]) { seen[j + w] = 1; comp.push(j + w); }
    }
    const L = Math.sqrt(comp.length * G * G);          // lado característico do bloco
    const dv = (clamp(0.4, 1, 1 - (L - 120) / 380 * 0.6) * 255) | 0;
    for (const j of comp) dens[j] = dv;
  }
  enc = { x0, y0, G, w, h, data, dens };
}
function sampleEnclosed(wx, wy) {
  if (!enc) return false;
  const gx = Math.floor((wx - enc.x0) / enc.G), gy = Math.floor((wy - enc.y0) / enc.G);
  if (gx < 0 || gy < 0 || gx >= enc.w || gy >= enc.h) return false;
  return enc.data[gy * enc.w + gx] === 2;
}
function sampleDensity(wx, wy) {
  if (!enc || !enc.dens) return 0;
  const gx = Math.floor((wx - enc.x0) / enc.G), gy = Math.floor((wy - enc.y0) / enc.G);
  if (gx < 0 || gy < 0 || gx >= enc.w || gy >= enc.h) return 0;
  return enc.dens[gy * enc.w + gx] / 255;
}

/* ---- recomputa mundo (chamado quando os traços mudam) ---- */
function activateCellsFor(s) {
  const [x0, y0, x1, y1] = s.bbox;
  const c0 = Math.floor((x0 - M) / TILE), c1 = Math.floor((x1 + M) / TILE);
  const r0 = Math.floor((y0 - M) / TILE), r1 = Math.floor((y1 + M) / TILE);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) activeCells.add(c + "," + r);
}
function refreshWorld() {
  computeEnclosed();
  spriteCache.clear(); activeCells.clear();
  for (const s of strokes) activateCellsFor(s);
  if (enc) for (let gy = 0; gy < enc.h; gy++) for (let gx = 0; gx < enc.w; gx++) {
    if (enc.data[gy * enc.w + gx] !== 2) continue;
    const wx = enc.x0 + (gx + 0.5) * enc.G, wy = enc.y0 + (gy + 0.5) * enc.G;
    activeCells.add(Math.floor(wx / TILE) + "," + Math.floor(wy / TILE));
  }
}

/* ===================== Geração procedural de uma célula =============== */
function bboxIntersect(b, x0, y0, x1, y1) { return !(b[0] > x1 || b[2] < x0 || b[1] > y1 || b[3] < y0); }
function nearest(wx, wy, segs) {
  let d = Infinity, seg = null;
  for (const s of segs) { const dd = distToSeg(wx, wy, s.ax, s.ay, s.bx, s.by); if (dd < d) { d = dd; seg = s; } }
  return { d, seg };
}

function generateCellSprite(cx, cy) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SPRITE;
  const ctx = cv.getContext("2d");
  ctx.scale(SPRITE / TILE, SPRITE / TILE);
  const ox = cx * TILE, oy = cy * TILE;
  const rng = mulberry32((hash2(cx, cy) ^ SEED) >>> 0);

  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, TILE, TILE);

  const ex0 = ox - M, ey0 = oy - M, ex1 = ox + TILE + M, ey1 = oy + TILE + M;
  const roadSegs = [], riverSegs = [], nearRoads = [], nearRivers = [];
  for (const s of strokes) {
    if (!bboxIntersect(s.bbox, ex0, ey0, ex1, ey1)) continue;
    (s.type === "river" ? nearRivers : nearRoads).push(s);
    const dst = s.type === "river" ? riverSegs : roadSegs;
    for (let i = 1; i < s.pts.length; i++) {
      const ax = s.pts[i - 1][0], ay = s.pts[i - 1][1], bx = s.pts[i][0], by = s.pts[i][1];
      if (Math.max(ax, bx) < ex0 || Math.min(ax, bx) > ex1 || Math.max(ay, by) < ey0 || Math.min(ay, by) > ey1) continue;
      dst.push({ ax, ay, bx, by, w: s.width });
    }
  }
  const wallSegs = roadSegs.concat(riverSegs);

  // rio por baixo
  for (const s of nearRivers) drawStrokeLocal(ctx, s, ox, oy);

  // construções: faixa ao longo das vias + interior de áreas fechadas
  const step = 9;
  for (let gx = step / 2; gx < TILE; gx += step) {
    for (let gy = step / 2; gy < TILE; gy += step) {
      const lx = gx + (rng() - 0.5) * 5, ly = gy + (rng() - 0.5) * 5;
      const wx = ox + lx, wy = oy + ly;

      let onWater = false;
      for (const s of riverSegs) if (distToSeg(wx, wy, s.ax, s.ay, s.bx, s.by) < s.w / 2 + 3) { onWater = true; break; }
      if (onWater) continue;

      const r = nearest(wx, wy, roadSegs);
      if (r.seg && r.d < r.seg.w / 2 + 3) continue;            // em cima da via

      const nearRoad = r.seg && r.d < r.seg.w / 2 + FRONTAGE;
      const enclosed = sampleEnclosed(wx, wy);
      if (!nearRoad && !enclosed) continue;

      // densidade inferida: bloco menor / avenida larga -> mais denso
      let density = 0.55;
      if (enclosed) density = Math.max(density, sampleDensity(wx, wy));
      if (nearRoad) density = Math.max(density, clamp(0.55, 1, 0.5 + r.seg.w / 90));
      if (rng() > density) { if (rng() < 0.45) drawTree(ctx, lx, ly, rng); continue; } // vãos / jardins

      let ang = rng() * Math.PI;                                // orienta à via mais próxima
      if (nearRoad) ang = Math.atan2(r.seg.by - r.seg.ay, r.seg.bx - r.seg.ax);
      else { const wn = nearest(wx, wy, wallSegs); if (wn.seg) ang = Math.atan2(wn.seg.by - wn.seg.ay, wn.seg.bx - wn.seg.ax); }
      const sc = 0.8 + density * 0.7;                           // mais denso -> lotes maiores
      drawBuilding(ctx, lx, ly, ang, (5 + rng() * 6) * sc, (5 + rng() * 5) * sc, ROOF_COLORS[(rng() * ROOF_COLORS.length) | 0]);
    }
  }

  // ruas / avenidas por cima e pontes
  for (const s of nearRoads) drawStrokeLocal(ctx, s, ox, oy);
  drawBridges(ctx, roadSegs, riverSegs, ox, oy);

  return cv;
}

function drawStrokeLocal(ctx, s, ox, oy) {
  const lp = s.pts.map((p) => [p[0] - ox, p[1] - oy]);
  if (lp.length < 2) return;
  if (s.type === "river") {
    strokePoly(ctx, lp, s.width + 3, WATER_INK);
    strokePoly(ctx, lp, s.width, WATER);
    strokePoly(ctx, lp, Math.max(3, s.width * 0.18), WATER_HI);
    return;
  }
  // Rua: a largura define a classe da via
  strokePoly(ctx, lp, s.width + 3, INK);
  strokePoly(ctx, lp, s.width, STREET);
  if (s.width >= 44) {                       // avenida com canteiro central
    strokePoly(ctx, lp, Math.max(6, s.width * 0.26), PARK_GREEN);
    medianTrees(ctx, lp);
    strokePoly(ctx, lp, 0.8, "rgba(60,80,50,0.4)");
  } else if (s.width >= 28) {                // avenida: faixa central sólida
    strokePoly(ctx, lp, 2, LANE);
  } else if (s.width >= 16) {                // rua larga: faixa central tracejada
    ctx.save(); ctx.setLineDash([6, 7]); strokePoly(ctx, lp, 1.6, LANE); ctx.restore();
  }
}
function drawBridges(ctx, roadSegs, riverSegs, ox, oy) {
  for (const rs of roadSegs) for (const ws of riverSegs) {
    const ip = segInt([rs.ax, rs.ay], [rs.bx, rs.by], [ws.ax, ws.ay], [ws.bx, ws.by]);
    if (!ip) continue;
    const dl = Math.hypot(rs.bx - rs.ax, rs.by - rs.ay) || 1;
    const dx = (rs.bx - rs.ax) / dl, dy = (rs.by - rs.ay) / dl, nx = -dy, ny = dx;
    const half = ws.w / 2 + 6, rh = rs.w / 2;
    const lx = ip[0] - ox, ly = ip[1] - oy;
    ctx.lineCap = "butt";
    ctx.strokeStyle = STREET; ctx.lineWidth = rs.w;            // tabuleiro sobre a água
    line(ctx, lx - dx * half, ly - dy * half, lx + dx * half, ly + dy * half);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2;                // guarda-corpos
    for (const sg of [1, -1])
      line(ctx, lx - dx * half + nx * rh * sg, ly - dy * half + ny * rh * sg, lx + dx * half + nx * rh * sg, ly + dy * half + ny * rh * sg);
    ctx.lineCap = "round";
  }
}
function line(ctx, ax, ay, bx, by) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
function strokePoly(ctx, pts, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length < 3) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); }
  else {                                   // curva suave passando pelos pontos
    for (let i = 1; i < pts.length - 1; i++)
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
  ctx.stroke();
}
function medianTrees(ctx, lp) {
  ctx.fillStyle = TREE_GREEN;
  for (let i = 1; i < lp.length; i++) {
    const ax = lp[i - 1][0], ay = lp[i - 1][1], bx = lp[i][0], by = lp[i][1];
    const n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 16));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      ctx.beginPath(); ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawBuilding(ctx, x, y, ang, w, h, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = "rgba(40,28,15,0.55)"; ctx.lineWidth = 0.9; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}
function drawTree(ctx, x, y, rng) {
  ctx.fillStyle = rng() < 0.5 ? TREE_GREEN : PARK_GREEN;
  ctx.beginPath(); ctx.arc(x, y, 3 + rng() * 2, 0, Math.PI * 2); ctx.fill();
}
function getSprite(cx, cy) {
  const k = cx + "," + cy;
  let s = spriteCache.get(k);
  if (!s) { s = generateCellSprite(cx, cy); spriteCache.set(k, s); }
  return s;
}

/* ===================== Câmera ========================================= */
const camera = { x: 0, y: 0, scale: 2.2 };
let showGrid = true;
const w2s = (wx, wy) => [camera.x + wx * camera.scale, camera.y + wy * camera.scale];
const s2w = (sx, sy) => [(sx - camera.x) / camera.scale, (sy - camera.y) / camera.scale];
function setZoom(ns, ax, ay) {
  ns = clamp(0.6, 6, ns);
  const k = ns / camera.scale;
  camera.x = ax - (ax - camera.x) * k; camera.y = ay - (ay - camera.y) * k;
  camera.scale = ns; zoomSlider.value = ns;
}

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const zoomSlider = document.getElementById("zoom");
const sizeSlider = document.getElementById("size");

/* ===================== Render ========================================= */
function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
function render() {
  const w = innerWidth, h = innerHeight, size = TILE * camera.scale;

  if (pointers.size === 0 && (Math.abs(momentum.x) > 0.08 || Math.abs(momentum.y) > 0.08)) {
    camera.x += momentum.x; camera.y += momentum.y; momentum.x *= 0.90; momentum.y *= 0.90;
  } else if (pointers.size === 0) { momentum.x = momentum.y = 0; }

  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);

  for (const k of activeCells) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = w2s(cx * TILE, cy * TILE);
    if (sx > w || sy > h || sx + size < 0 || sy + size < 0) continue;
    ctx.drawImage(getSprite(cx, cy), sx, sy, size, size);
  }

  if (showGrid) {
    ctx.strokeStyle = "rgba(74,58,35,0.13)"; ctx.lineWidth = 1; ctx.beginPath();
    const c0 = Math.floor(-camera.x / size), c1 = Math.ceil((w - camera.x) / size);
    const r0 = Math.floor(-camera.y / size), r1 = Math.ceil((h - camera.y) / size);
    for (let c = c0; c <= c1; c++) { const x = camera.x + c * size; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let r = r0; r <= r1; r++) { const y = camera.y + r * size; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  if (current) {                                   // traço em andamento
    const col = current.type === "river" ? "rgba(120,170,180,0.85)" : "rgba(40,33,24,0.9)";
    ctx.strokeStyle = col; ctx.lineWidth = current.width * camera.scale;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
    const p0 = w2s(current.pts[0][0], current.pts[0][1]); ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i < current.pts.length; i++) { const p = w2s(current.pts[i][0], current.pts[i][1]); ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
  }

  ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = ctx.createPattern(noiseCanvas, "repeat"); ctx.fillRect(0, 0, w, h); ctx.restore();

  if (hover && tool !== "hand") {                  // cursor do pincel
    ctx.strokeStyle = tool === "erase" ? "rgba(196,80,60,0.9)" : "rgba(40,33,24,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hover.sx, hover.sy, (toolWidth[tool] / 2) * camera.scale, 0, Math.PI * 2); ctx.stroke();
  }

  requestAnimationFrame(render);
}

/* ===================== Ferramentas =================================== */
let tool = "road";
const toolWidth = { hand: 0, road: 14, river: 22, erase: 30 };
function selectTool(t) {
  tool = t;
  for (const b of document.querySelectorAll("#tools button")) b.classList.toggle("active", b.dataset.tool === t);
  if (toolWidth[t] && t !== "hand") sizeSlider.value = toolWidth[t];
}

/* ===================== Edição ======================================= */
function finalizeStroke(s) {
  if (s.pts.length === 1) s.pts.push([s.pts[0][0] + 0.5, s.pts[0][1] + 0.5]);
  const end = s.pts[s.pts.length - 1];                        // gruda a ponta final
  const sn = getSnap(end[0], end[1], Math.max(16 / camera.scale, s.width * 0.7));
  if (sn) s.pts[s.pts.length - 1] = sn;
  s.pts = smooth(s.pts);                                      // alisa (mantém as pontas)
  s.bbox = strokeBBox(s);
  strokes.push(s);
  refreshWorld();
}
function eraseAt(wx, wy) {
  const radius = toolWidth.erase / 2;
  let changed = false;
  strokes = strokes.filter((s) => {
    let hit = false;
    for (let i = 1; i < s.pts.length; i++)
      if (distToSeg(wx, wy, s.pts[i - 1][0], s.pts[i - 1][1], s.pts[i][0], s.pts[i][1]) < radius + s.width / 2) { hit = true; break; }
    if (hit) changed = true;
    return !hit;
  });
  if (changed) refreshWorld();
}

/* ===================== Entrada (Pointer Events) ====================== */
const pointers = new Map();
const momentum = { x: 0, y: 0 };
let lastV = { x: 0, y: 0 };
let pinching = false, pinchDist0 = 0, pinchScale0 = 0, spaceDown = false;
let mode = "idle", current = null, hover = null;
const TAP_THRESH = 9;
const updateHover = (sx, sy) => (hover = { sx, sy });

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture?.(ev.pointerId);
  momentum.x = momentum.y = 0;
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: 0 });
  updateHover(ev.clientX, ev.clientY);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; pinchScale0 = camera.scale;
    pinching = true; mode = "pinch"; current = null; ev.preventDefault(); return;
  }
  const panGesture = tool === "hand" || (ev.pointerType === "mouse" && (ev.button === 1 || ev.button === 2 || spaceDown));
  if (panGesture) mode = "pan";
  else if (tool === "erase") { mode = "erase"; const [wx, wy] = s2w(ev.clientX, ev.clientY); eraseAt(wx, wy); }
  else {
    mode = "draw";
    let sp = s2w(ev.clientX, ev.clientY);                     // gruda a ponta inicial
    const sn = getSnap(sp[0], sp[1], Math.max(16 / camera.scale, toolWidth[tool] * 0.7));
    if (sn) sp = sn;
    current = { type: tool, width: toolWidth[tool], pts: [sp] };
  }
  ev.preventDefault();
}, { passive: false });

canvas.addEventListener("pointermove", (ev) => {
  updateHover(ev.clientX, ev.clientY);
  const p = pointers.get(ev.pointerId);
  if (!p) return;
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
  p.x = ev.clientX; p.y = ev.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
  if (mode === "pinch" && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    setZoom(pinchScale0 * (dist / pinchDist0), (a.x + b.x) / 2, (a.y + b.y) / 2);
    return;
  }
  if (mode === "pan") { camera.x += dx; camera.y += dy; lastV = { x: dx, y: dy }; }
  else if (mode === "draw" && current) {
    const wp = s2w(ev.clientX, ev.clientY), last = current.pts[current.pts.length - 1];
    if (Math.hypot(wp[0] - last[0], wp[1] - last[1]) > 3 / camera.scale) current.pts.push(wp);
  } else if (mode === "erase") { const [wx, wy] = s2w(ev.clientX, ev.clientY); eraseAt(wx, wy); }
  ev.preventDefault();
}, { passive: false });

function endPointer(ev) {
  const p = pointers.get(ev.pointerId);
  pointers.delete(ev.pointerId);
  const lastOne = pointers.size === 0;
  if (mode === "draw" && current) { finalizeStroke(current); current = null; }
  if (lastOne && mode === "pan" && p && p.moved > TAP_THRESH) { momentum.x = lastV.x; momentum.y = lastV.y; }
  if (lastOne) { pinching = false; mode = "idle"; }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", (ev) => { pointers.delete(ev.pointerId); if (pointers.size === 0) { pinching = false; mode = "idle"; current = null; } });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("wheel", (ev) => { ev.preventDefault(); setZoom(camera.scale * (ev.deltaY < 0 ? 1.1 : 1 / 1.1), ev.clientX, ev.clientY); }, { passive: false });

addEventListener("keydown", (ev) => { if (ev.code === "Space") { spaceDown = true; ev.preventDefault(); } });
addEventListener("keyup", (ev) => { if (ev.code === "Space") spaceDown = false; });

/* ===================== UI ============================================ */
document.getElementById("tools").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b && b.dataset.tool) selectTool(b.dataset.tool);
});
sizeSlider.addEventListener("input", () => { if (tool !== "hand") toolWidth[tool] = parseInt(sizeSlider.value, 10); });
zoomSlider.addEventListener("input", () => setZoom(parseFloat(zoomSlider.value), innerWidth / 2, innerHeight * 0.42));
document.getElementById("gridchk").addEventListener("change", (e) => { showGrid = e.target.checked; });
document.getElementById("clear").addEventListener("click", () => { strokes = []; enc = null; activeCells.clear(); spriteCache.clear(); current = null; });

/* ===================== Início ======================================== */
function start() {
  resize();
  selectTool("road");
  camera.x = innerWidth / 2; camera.y = innerHeight * 0.42;
  zoomSlider.value = camera.scale;
  render();
}
addEventListener("resize", resize);
start();
