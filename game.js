"use strict";

/* =========================================================================
   Cidade Infinita — canvas de mapa estilo cartografia de cidade.

   O jogador desenha o esqueleto (ruas, avenidas, rios). O jogo:
   • detecta as QUADRAS (áreas entre vias) e as SUBDIVIDE em lotes
     (retângulos/triângulos de tamanhos distintos) que se encaixam;
   • orienta a subdivisão pela direção da rua que forma a quadra;
   • cria VIELAS finas, orgânicas e orientadas, que dão acesso ao miolo;
   • o fundo inacessível de quadrões vira campo (hachura);
   • rua cruzando rio vira ponte; o canteiro da avenida abre só nos cruzamentos.
   ========================================================================= */

const TILE = 100, SPRITE = 220, M = 90;
const FRONTAGE = 20, REACH = 72, SEED = 0x9e3779b9, ALLEY_W = 3;

const PAPER = "#e9e1c6", STREET = "#f2ecda", INK = "#4a3a23";
const LANE = "rgba(120,95,55,0.45)";
const TREE_GREEN = "#6f8a4a", PARK_GREEN = "#8a9b5c";
const WATER = "#8fb1b4", WATER_INK = "#5c8084", WATER_HI = "#bcd6d6";
const FIELD = "rgba(110,138,74,0.45)", BUILD_INK = "rgba(55,38,20,0.8)";
const ROOF_COLORS = ["#cf9a63", "#c98a4f", "#c5833f", "#d2a06a", "#bd7e44", "#c79257", "#caa06a"];

/* ===================== RNG / geometria =============================== */
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
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
  const t = clamp(0, 1, ((px - ax) * dx + (py - ay) * dy) / len2);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function segInt(a, b, c, d) {
  const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
  const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a[0] + t * rx, a[1] + t * ry];
}
function projPoint(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1;
  const t = clamp(0, 1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2);
  return [a[0] + t * dx, a[1] + t * dy];
}
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
function strokeBBox(s) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const p of s.pts) { if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; }
  const pad = s.width / 2 + 2; return [a - pad, b - pad, c + pad, d + pad];
}

/* ===================== Textura de papel ============================== */
const noiseCanvas = (() => {
  const nc = document.createElement("canvas"); nc.width = nc.height = 64;
  const nx = nc.getContext("2d"), img = nx.createImageData(64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const c = Math.random() < 0.5 ? 40 : 230;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = (Math.random() * 26) | 0;
  }
  nx.putImageData(img, 0, 0); return nc;
})();

/* ===================== Estado ======================================== */
let strokes = [];                       // {type:'road'|'river', width, pts, bbox}
let alleys = [];                        // {type:'alley', width, pts, bbox}
let plots = [];                         // {pts, build, color, ang, bbox}
let plotsByTile = new Map();
const activeCells = new Set();
const spriteCache = new Map();
let enc = null;                         // grid: data(1=via,2=interior), access

/* ===================== Áreas fechadas (raster + flood fill) ========== */
function stampSeg(data, w, h, x0, y0, G, a, b, rad) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(len / (G * 0.6))), rc = Math.max(1, Math.ceil(rad / G));
  for (let s = 0; s <= steps; s++) {
    const px = a[0] + dx * s / steps, py = a[1] + dy * s / steps;
    const cx = Math.floor((px - x0) / G), cy = Math.floor((py - y0) / G);
    for (let oy = -rc; oy <= rc; oy++) for (let ox = -rc; ox <= rc; ox++) {
      if (ox * ox + oy * oy > rc * rc + rc) continue;
      const gx = cx + ox, gy = cy + oy; if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
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
  const pad = maxW + REACH + 20; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const G = Math.max(6, Math.max(x1 - x0, y1 - y0) / 640);
  const w = Math.ceil((x1 - x0) / G), h = Math.ceil((y1 - y0) / G);
  if (w < 3 || h < 3 || w * h > 800000) return;
  const data = new Uint8Array(w * h);
  for (const s of strokes) for (let i = 1; i < s.pts.length; i++) stampSeg(data, w, h, x0, y0, G, s.pts[i - 1], s.pts[i], s.width / 2);
  const stack = [], seed = (x, y) => { const i = y * w + x; if (data[i] === 0) { data[i] = 3; stack.push(i); } };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) seed(x - 1, y); if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1); if (y < h - 1) seed(x, y + 1);
  }
  for (let i = 0; i < data.length; i++) if (data[i] === 0) data[i] = 2;
  enc = { x0, y0, G, w, h, data };
}
// distância às vias (ruas+vielas) -> acessibilidade (densidade)
function computeAccess() {
  if (!enc) return;
  const { x0, y0, G, w, h } = enc;
  const roadM = new Uint8Array(w * h);
  const stampRoads = (s) => { for (let i = 1; i < s.pts.length; i++) stampSeg(roadM, w, h, x0, y0, G, s.pts[i - 1], s.pts[i], s.width / 2); };
  for (const s of strokes) if (s.type !== "river") stampRoads(s);
  for (const s of alleys) stampRoads(s);
  const dist = new Int32Array(w * h).fill(1 << 30), q = [];
  for (let i = 0; i < roadM.length; i++) if (roadM[i]) { dist[i] = 0; q.push(i); }
  for (let head = 0; head < q.length; head++) {
    const i = q[head], x = i % w, y = (i / w) | 0, d = dist[i] + 1;
    const tc = (j) => { if (dist[j] > d) { dist[j] = d; q.push(j); } };
    if (x > 0) tc(i - 1); if (x < w - 1) tc(i + 1); if (y > 0) tc(i - w); if (y < h - 1) tc(i + w);
  }
  const access = new Float32Array(w * h);
  for (let i = 0; i < access.length; i++) access[i] = clamp(0, 1, 1 - (dist[i] * G - FRONTAGE) / REACH);
  enc.access = access;
}

/* ===================== Vielas (orgânicas, orientadas à rua) =========== */
function generateAlleys() {
  alleys = [];
  if (!enc) return;
  const { x0, y0, G, w, h, data } = enc;
  const seen = new Uint8Array(w * h);
  const isInW = (wx, wy) => { const gx = Math.floor((wx - x0) / G), gy = Math.floor((wy - y0) / G); return gx >= 0 && gy >= 0 && gx < w && gy < h && data[gy * w + gx] === 2; };
  const rs = [];
  for (const s of strokes) if (s.type !== "river") for (let i = 1; i < s.pts.length; i++) rs.push([s.pts[i - 1], s.pts[i]]);

  const emit = (t0, t1, fixed, ux, uy, vx, vy, alongU, rng) => {
    if (t1 - t0 < 26) return;
    const n = Math.max(2, Math.round((t1 - t0) / 22)), amp = 6 + rng() * 9, ph = rng() * 6.28, pts = [];
    for (let k = 0; k <= n; k++) {
      const tt = t0 + (t1 - t0) * k / n, off = Math.sin(k / n * Math.PI) * amp * Math.sin(k / n * 3 + ph), f = fixed + off;
      pts.push(alongU ? [tt * ux + f * vx, tt * uy + f * vy] : [f * ux + tt * vx, f * uy + tt * vy]);
    }
    const s = { type: "alley", width: ALLEY_W, pts }; s.bbox = strokeBBox(s); alleys.push(s);
  };
  const march = (lo, hi, fixed, ux, uy, vx, vy, alongU, rng) => {
    const ext = 9, step = 6; let start = null, prev = lo;
    const inside = (t) => { const wx = alongU ? t * ux + fixed * vx : fixed * ux + t * vx, wy = alongU ? t * uy + fixed * vy : fixed * uy + t * vy; return isInW(wx, wy); };
    for (let t = lo - ext; t <= hi + ext; t += step) {
      if (inside(t)) { if (start === null) start = t; prev = t; }
      else if (start !== null) { emit(start - ext, prev + ext, fixed, ux, uy, vx, vy, alongU, rng); start = null; }
    }
    if (start !== null) emit(start - ext, prev + ext, fixed, ux, uy, vx, vy, alongU, rng);
  };

  for (let i0 = 0; i0 < data.length; i0++) {
    if (data[i0] !== 2 || seen[i0]) continue;
    const comp = [i0]; seen[i0] = 1; let sx = 0, sy = 0, cnt = 0;
    for (let qi = 0; qi < comp.length; qi++) {
      const j = comp[qi], x = j % w, y = (j / w) | 0; cnt++; sx += x; sy += y;
      if (x > 0 && data[j - 1] === 2 && !seen[j - 1]) { seen[j - 1] = 1; comp.push(j - 1); }
      if (x < w - 1 && data[j + 1] === 2 && !seen[j + 1]) { seen[j + 1] = 1; comp.push(j + 1); }
      if (y > 0 && data[j - w] === 2 && !seen[j - w]) { seen[j - w] = 1; comp.push(j - w); }
      if (y < h - 1 && data[j + w] === 2 && !seen[j + w]) { seen[j + w] = 1; comp.push(j + w); }
    }
    if (Math.sqrt(cnt * G * G) < 170) continue;                 // quadra pequena: sem viela
    const cWx = x0 + (sx / cnt + 0.5) * G, cWy = y0 + (sy / cnt + 0.5) * G;
    let ang = 0, bd = 1e9;                                       // orienta pela rua que formou a quadra
    for (const e of rs) { const d = distToSeg(cWx, cWy, e[0][0], e[0][1], e[1][0], e[1][1]); if (d < bd) { bd = d; ang = Math.atan2(e[1][1] - e[0][1], e[1][0] - e[0][0]); } }
    const rng = mulberry32((hash2((cWx) | 0, (cWy) | 0) ^ SEED) >>> 0);
    const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
    let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
    for (const j of comp) { const x = j % w, y = (j / w) | 0, wx = x0 + (x + 0.5) * G, wy = y0 + (y + 0.5) * G, uu = wx * ux + wy * uy, vv = wx * vx + wy * vy; if (uu < umin) umin = uu; if (uu > umax) umax = uu; if (vv < vmin) vmin = vv; if (vv > vmax) vmax = vv; }
    const base = 64;
    for (let vv = vmin + base * (0.3 + rng()); vv < vmax; vv += base * (0.5 + rng())) if (rng() < 0.85) march(umin, umax, vv, ux, uy, vx, vy, true, rng);
    for (let uu = umin + base * (0.3 + rng()); uu < umax; uu += base * (0.5 + rng())) if (rng() < 0.65) march(vmin, vmax, uu, ux, uy, vx, vy, false, rng);
  }
}

/* ===================== Subdivisão das quadras em lotes (BSP) ========== */
function generatePlots() {
  plots = []; plotsByTile = new Map();
  if (!enc || !enc.access) return;
  const { x0, y0, G, w, h, data, access } = enc;
  const dev = new Uint8Array(w * h);
  for (let i = 0; i < dev.length; i++) dev[i] = (data[i] !== 1 && (data[i] === 2 || access[i] > 0.04)) ? 1 : 0;
  const inDev = (wx, wy) => { const gx = Math.floor((wx - x0) / G), gy = Math.floor((wy - y0) / G); return gx >= 0 && gy >= 0 && gx < w && gy < h && dev[gy * w + gx]; };
  const accAt = (wx, wy) => { const gx = Math.floor((wx - x0) / G), gy = Math.floor((wy - y0) / G); return (gx >= 0 && gy >= 0 && gx < w && gy < h) ? access[gy * w + gx] : 0; };
  const rs = [];
  for (const s of strokes) if (s.type !== "river") for (let i = 1; i < s.pts.length; i++) rs.push([s.pts[i - 1], s.pts[i]]);
  for (const s of alleys) for (let i = 1; i < s.pts.length; i++) rs.push([s.pts[i - 1], s.pts[i]]);

  const seen = new Uint8Array(w * h);
  for (let i0 = 0; i0 < dev.length; i0++) {
    if (!dev[i0] || seen[i0]) continue;
    const comp = [i0]; seen[i0] = 1; let sx = 0, sy = 0, cnt = 0;
    for (let qi = 0; qi < comp.length; qi++) {
      const j = comp[qi], x = j % w, y = (j / w) | 0; cnt++; sx += x; sy += y;
      if (x > 0 && dev[j - 1] && !seen[j - 1]) { seen[j - 1] = 1; comp.push(j - 1); }
      if (x < w - 1 && dev[j + 1] && !seen[j + 1]) { seen[j + 1] = 1; comp.push(j + 1); }
      if (y > 0 && dev[j - w] && !seen[j - w]) { seen[j - w] = 1; comp.push(j - w); }
      if (y < h - 1 && dev[j + w] && !seen[j + w]) { seen[j + w] = 1; comp.push(j + w); }
    }
    if (cnt < 3) continue;
    const cWx = x0 + (sx / cnt + 0.5) * G, cWy = y0 + (sy / cnt + 0.5) * G;
    let ang = 0, bd = 1e9;
    for (const e of rs) { const d = distToSeg(cWx, cWy, e[0][0], e[0][1], e[1][0], e[1][1]); if (d < bd) { bd = d; ang = Math.atan2(e[1][1] - e[0][1], e[1][0] - e[0][0]); } }
    const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
    const toW = (uu, vv) => [uu * ux + vv * vx, uu * uy + vv * vy];
    let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
    for (const j of comp) { const x = j % w, y = (j / w) | 0, wx = x0 + (x + 0.5) * G, wy = y0 + (y + 0.5) * G, uu = wx * ux + wy * uy, vv = wx * vx + wy * vy; if (uu < umin) umin = uu; if (uu > umax) umax = uu; if (vv < vmin) vmin = vv; if (vv > vmax) vmax = vv; }
    const crng = mulberry32((hash2((cWx) | 0, (cWy) | 0) ^ 0x51ed) >>> 0);
    const stack = [[umin, umax, vmin, vmax, 0]];
    let guard = 0;
    while (stack.length && guard++ < 60000 && plots.length < 90000) {
      const [a0, a1, b0, b1, depth] = stack.pop();
      const du = a1 - a0, dv = b1 - b0, target = 15 + crng() * 18;
      if ((du <= target && dv <= target) || depth > 13) { emitPlot(a0, a1, b0, b1, toW, inDev, accAt, ang, crng); continue; }
      if (du >= dv) { const s = a0 + du * (0.34 + crng() * 0.32); stack.push([a0, s, b0, b1, depth + 1], [s, a1, b0, b1, depth + 1]); }
      else { const s = b0 + dv * (0.34 + crng() * 0.32); stack.push([a0, a1, b0, s, depth + 1], [a0, a1, s, b1, depth + 1]); }
    }
  }
  for (const p of plots) bucketPlot(p);
}
function emitPlot(a0, a1, b0, b1, toW, inDev, accAt, ang, crng) {
  const inset = 0.9, u0 = a0 + inset, u1 = a1 - inset, v0 = b0 + inset, v1 = b1 - inset;
  if (u1 <= u0 || v1 <= v0) return;
  const C = toW((u0 + u1) / 2, (v0 + v1) / 2);
  if (!inDev(C[0], C[1])) return;
  let pts = [toW(u0, v0), toW(u1, v0), toW(u1, v1), toW(u0, v1)];
  if (crng() < 0.14) pts.splice((crng() * 4) | 0, 1);          // alguns lotes viram triângulo
  const acc = accAt(C[0], C[1]);
  const build = acc > 0.3 ? true : crng() < acc * 1.6;
  plots.push({ pts, build, ang, color: ROOF_COLORS[(crng() * ROOF_COLORS.length) | 0] });
}
function bucketPlot(p) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const c of p.pts) { if (c[0] < x0) x0 = c[0]; if (c[0] > x1) x1 = c[0]; if (c[1] < y0) y0 = c[1]; if (c[1] > y1) y1 = c[1]; }
  p.bbox = [x0, y0, x1, y1];
  for (let c = Math.floor(x0 / TILE); c <= Math.floor(x1 / TILE); c++)
    for (let r = Math.floor(y0 / TILE); r <= Math.floor(y1 / TILE); r++) {
      const k = c + "," + r; let arr = plotsByTile.get(k); if (!arr) { arr = []; plotsByTile.set(k, arr); } arr.push(p); activeCells.add(k);
    }
}

/* ===================== Recomputa o mundo ============================= */
function activateCellsFor(s) {
  const c0 = Math.floor((s.bbox[0] - M) / TILE), c1 = Math.floor((s.bbox[2] + M) / TILE);
  const r0 = Math.floor((s.bbox[1] - M) / TILE), r1 = Math.floor((s.bbox[3] + M) / TILE);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) activeCells.add(c + "," + r);
}
function refreshWorld() {
  computeEnclosed();
  generateAlleys();
  computeAccess();
  spriteCache.clear(); activeCells.clear(); plotsByTile = new Map();
  for (const s of strokes) activateCellsFor(s);
  for (const s of alleys) activateCellsFor(s);
  generatePlots();
}

/* ===================== Render de uma célula ========================== */
function bboxIntersect(b, x0, y0, x1, y1) { return !(b[0] > x1 || b[2] < x0 || b[1] > y1 || b[3] < y0); }
const loc = (s, ox, oy) => s.pts.map((p) => [p[0] - ox, p[1] - oy]);

function generateCellSprite(cx, cy) {
  const cv = document.createElement("canvas"); cv.width = cv.height = SPRITE;
  const ctx = cv.getContext("2d"); ctx.scale(SPRITE / TILE, SPRITE / TILE);
  const ox = cx * TILE, oy = cy * TILE;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, TILE, TILE);

  const ex0 = ox - M, ey0 = oy - M, ex1 = ox + TILE + M, ey1 = oy + TILE + M;
  const roadSegs = [], riverSegs = [], nearRoads = [], nearRivers = [], nearAlleys = [];
  const pushSegs = (arr, s) => {
    for (let i = 1; i < s.pts.length; i++) {
      const ax = s.pts[i - 1][0], ay = s.pts[i - 1][1], bx = s.pts[i][0], by = s.pts[i][1];
      if (Math.max(ax, bx) < ex0 || Math.min(ax, bx) > ex1 || Math.max(ay, by) < ey0 || Math.min(ay, by) > ey1) continue;
      arr.push({ ax, ay, bx, by, w: s.width, src: s });
    }
  };
  const collect = (s) => {
    if (!bboxIntersect(s.bbox, ex0, ey0, ex1, ey1)) return;
    if (s.type === "river") { nearRivers.push(s); pushSegs(riverSegs, s); }
    else if (s.type === "alley") nearAlleys.push(s);
    else { nearRoads.push(s); pushSegs(roadSegs, s); }
  };
  for (const s of strokes) collect(s);
  for (const s of alleys) collect(s);

  // rios (camadas: cruzamentos se fundem)
  for (const s of nearRivers) riverPass(ctx, s, ox, oy, 0);
  for (const s of nearRivers) riverPass(ctx, s, ox, oy, 1);
  for (const s of nearRivers) riverPass(ctx, s, ox, oy, 2);

  // quadras subdivididas em lotes
  const parr = plotsByTile.get(cx + "," + cy);
  if (parr) for (const p of parr) drawPlot(ctx, p, ox, oy);

  // vielas (finas, por cima dos lotes)
  for (const s of nearAlleys) drawAlley(ctx, s, ox, oy);

  // ruas (camadas) + pontes + abertura de canteiro
  for (const s of nearRoads) roadPass(ctx, s, ox, oy, 0);
  for (const s of nearRoads) roadPass(ctx, s, ox, oy, 1);
  drawBridges(ctx, roadSegs, riverSegs, ox, oy);
  for (const s of nearRoads) roadPass(ctx, s, ox, oy, 2);
  medianGaps(ctx, roadSegs, ox, oy);
  return cv;
}

function drawPlot(ctx, p, ox, oy) {
  const pts = p.pts;
  ctx.beginPath(); ctx.moveTo(pts[0][0] - ox, pts[0][1] - oy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] - ox, pts[i][1] - oy);
  ctx.closePath();
  if (p.build) {
    ctx.fillStyle = p.color; ctx.fill();
    ctx.strokeStyle = BUILD_INK; ctx.lineWidth = 1; ctx.lineJoin = "round"; ctx.stroke();
  } else {                                                     // campo: hachura dentro do lote
    ctx.save(); ctx.clip();
    ctx.strokeStyle = FIELD; ctx.lineWidth = 0.8;
    const ca = Math.cos(p.ang), sa = Math.sin(p.ang);
    const minx = p.bbox[0] - ox, miny = p.bbox[1] - oy, maxx = p.bbox[2] - ox, maxy = p.bbox[3] - oy;
    const diag = Math.hypot(maxx - minx, maxy - miny);
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    for (let o = -diag; o < diag; o += 3.5) {
      ctx.beginPath();
      ctx.moveTo(cx + ca * -diag - sa * o, cy + sa * -diag + ca * o);
      ctx.lineTo(cx + ca * diag - sa * o, cy + sa * diag + ca * o);
      ctx.stroke();
    }
    ctx.restore();
  }
}
function drawAlley(ctx, s, ox, oy) {
  const lp = loc(s, ox, oy); if (lp.length < 2) return;
  strokePoly(ctx, lp, s.width + 1.2, "rgba(74,58,35,0.18)");
  strokePoly(ctx, lp, s.width, STREET);
}
function riverPass(ctx, s, ox, oy, pass) {
  const lp = loc(s, ox, oy); if (lp.length < 2) return;
  if (pass === 0) strokePoly(ctx, lp, s.width + 3, WATER_INK);
  else if (pass === 1) strokePoly(ctx, lp, s.width, WATER);
  else strokePoly(ctx, lp, Math.max(3, s.width * 0.18), WATER_HI);
}
function roadPass(ctx, s, ox, oy, pass) {
  const lp = loc(s, ox, oy); if (lp.length < 2) return;
  if (pass === 0) { strokePoly(ctx, lp, s.width + 3, INK); return; }
  if (pass === 1) { strokePoly(ctx, lp, s.width, STREET); return; }
  if (s.width >= 44) { strokePoly(ctx, lp, Math.max(6, s.width * 0.26), PARK_GREEN); medianTrees(ctx, lp); strokePoly(ctx, lp, 0.8, "rgba(60,80,50,0.4)"); }
  else if (s.width >= 28) strokePoly(ctx, lp, 2, LANE);
  else if (s.width >= 16) { ctx.save(); ctx.setLineDash([6, 7]); strokePoly(ctx, lp, 1.6, LANE); ctx.restore(); }
}
function medianGaps(ctx, roadSegs, ox, oy) {
  for (const a of roadSegs) {
    if (a.w < 44) continue;
    const mw = Math.max(6, a.w * 0.26) + 2, dl = Math.hypot(a.bx - a.ax, a.by - a.ay) || 1;
    const dx = (a.bx - a.ax) / dl, dy = (a.by - a.ay) / dl;
    for (const b of roadSegs) {
      if (b.src === a.src) continue;                          // ignora o próprio traço (corrige canteiro)
      const ip = segInt([a.ax, a.ay], [a.bx, a.by], [b.ax, b.ay], [b.bx, b.by]);
      if (!ip) continue;
      if (hash2(Math.round(ip[0]), Math.round(ip[1])) % 100 > 70) continue;  // abre ~70% dos cruzamentos
      const half = Math.min(b.w, a.w * 0.5) / 2 + 3;
      ctx.strokeStyle = STREET; ctx.lineWidth = mw; ctx.lineCap = "butt";
      line(ctx, ip[0] - ox - dx * half, ip[1] - oy - dy * half, ip[0] - ox + dx * half, ip[1] - oy + dy * half);
    }
  }
}
function drawBridges(ctx, roadSegs, riverSegs, ox, oy) {
  for (const rs of roadSegs) for (const ws of riverSegs) {
    const ip = segInt([rs.ax, rs.ay], [rs.bx, rs.by], [ws.ax, ws.ay], [ws.bx, ws.by]);
    if (!ip) continue;
    const dl = Math.hypot(rs.bx - rs.ax, rs.by - rs.ay) || 1;
    const dx = (rs.bx - rs.ax) / dl, dy = (rs.by - rs.ay) / dl, nx = -dy, ny = dx;
    const half = ws.w / 2 + 6, rh = rs.w / 2, lx = ip[0] - ox, ly = ip[1] - oy;
    ctx.lineCap = "butt"; ctx.strokeStyle = STREET; ctx.lineWidth = rs.w;
    line(ctx, lx - dx * half, ly - dy * half, lx + dx * half, ly + dy * half);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    for (const sg of [1, -1]) line(ctx, lx - dx * half + nx * rh * sg, ly - dy * half + ny * rh * sg, lx + dx * half + nx * rh * sg, ly + dy * half + ny * rh * sg);
    ctx.lineCap = "round";
  }
}
function line(ctx, ax, ay, bx, by) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
function strokePoly(ctx, pts, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length < 3) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); }
  else { for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); }
  ctx.stroke();
}
function medianTrees(ctx, lp) {
  ctx.fillStyle = TREE_GREEN;
  for (let i = 1; i < lp.length; i++) {
    const ax = lp[i - 1][0], ay = lp[i - 1][1], bx = lp[i][0], by = lp[i][1];
    const n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 16));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; ctx.beginPath(); ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, 2.2, 0, Math.PI * 2); ctx.fill(); }
  }
}
function getSprite(cx, cy) {
  const k = cx + "," + cy; let s = spriteCache.get(k);
  if (!s) { s = generateCellSprite(cx, cy); spriteCache.set(k, s); }
  return s;
}

/* ===================== Câmera / render =============================== */
const camera = { x: 0, y: 0, scale: 2.2 };
let showGrid = true;
const w2s = (wx, wy) => [camera.x + wx * camera.scale, camera.y + wy * camera.scale];
const s2w = (sx, sy) => [(sx - camera.x) / camera.scale, (sy - camera.y) / camera.scale];
function setZoom(ns, ax, ay) {
  ns = clamp(0.6, 6, ns); const k = ns / camera.scale;
  camera.x = ax - (ax - camera.x) * k; camera.y = ay - (ay - camera.y) * k; camera.scale = ns; zoomSlider.value = ns;
}
const canvas = document.getElementById("game"), ctx = canvas.getContext("2d");
const zoomSlider = document.getElementById("zoom"), sizeSlider = document.getElementById("size");

function resize() {
  canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
function render() {
  const w = innerWidth, h = innerHeight, size = TILE * camera.scale;
  if (pointers.size === 0 && (Math.abs(momentum.x) > 0.08 || Math.abs(momentum.y) > 0.08)) {
    camera.x += momentum.x; camera.y += momentum.y; momentum.x *= 0.90; momentum.y *= 0.90;
  } else if (pointers.size === 0) { momentum.x = momentum.y = 0; }

  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  for (const k of activeCells) {
    const [cx, cy] = k.split(",").map(Number), [sx, sy] = w2s(cx * TILE, cy * TILE);
    if (sx > w || sy > h || sx + size < 0 || sy + size < 0) continue;
    ctx.drawImage(getSprite(cx, cy), sx, sy, size, size);
  }
  if (showGrid) {
    ctx.strokeStyle = "rgba(74,58,35,0.12)"; ctx.lineWidth = 1; ctx.beginPath();
    const c0 = Math.floor(-camera.x / size), c1 = Math.ceil((w - camera.x) / size);
    const r0 = Math.floor(-camera.y / size), r1 = Math.ceil((h - camera.y) / size);
    for (let c = c0; c <= c1; c++) { const x = camera.x + c * size; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let r = r0; r <= r1; r++) { const y = camera.y + r * size; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }
  if (current) {
    ctx.strokeStyle = current.type === "river" ? "rgba(120,170,180,0.85)" : "rgba(40,33,24,0.9)";
    ctx.lineWidth = current.width * camera.scale; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
    const p0 = w2s(current.pts[0][0], current.pts[0][1]); ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i < current.pts.length; i++) { const p = w2s(current.pts[i][0], current.pts[i][1]); ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
  }
  ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = ctx.createPattern(noiseCanvas, "repeat"); ctx.fillRect(0, 0, w, h); ctx.restore();
  if (hover && tool !== "hand") {
    ctx.strokeStyle = tool === "erase" ? "rgba(196,80,60,0.9)" : "rgba(40,33,24,0.5)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hover.sx, hover.sy, (toolWidth[tool] / 2) * camera.scale, 0, Math.PI * 2); ctx.stroke();
  }
  requestAnimationFrame(render);
}

/* ===================== Ferramentas / edição ========================= */
let tool = "road";
const toolWidth = { hand: 0, road: 14, river: 22, erase: 30 };
function selectTool(t) {
  tool = t;
  for (const b of document.querySelectorAll("#tools button")) b.classList.toggle("active", b.dataset.tool === t);
  if (toolWidth[t] && t !== "hand") sizeSlider.value = toolWidth[t];
}
function finalizeStroke(s) {
  if (s.pts.length === 1) s.pts.push([s.pts[0][0] + 0.5, s.pts[0][1] + 0.5]);
  const end = s.pts[s.pts.length - 1], sn = getSnap(end[0], end[1], Math.max(16 / camera.scale, s.width * 0.7));
  if (sn) s.pts[s.pts.length - 1] = sn;
  s.pts = smooth(s.pts); s.bbox = strokeBBox(s); strokes.push(s); refreshWorld();
}
function eraseAt(wx, wy) {
  const radius = toolWidth.erase / 2; let changed = false;
  strokes = strokes.filter((s) => {
    let hit = false;
    for (let i = 1; i < s.pts.length; i++) if (distToSeg(wx, wy, s.pts[i - 1][0], s.pts[i - 1][1], s.pts[i][0], s.pts[i][1]) < radius + s.width / 2) { hit = true; break; }
    if (hit) changed = true; return !hit;
  });
  if (changed) refreshWorld();
}

/* ===================== Entrada ====================================== */
const pointers = new Map(), momentum = { x: 0, y: 0 };
let lastV = { x: 0, y: 0 }, pinching = false, pinchDist0 = 0, pinchScale0 = 0, spaceDown = false;
let mode = "idle", current = null, hover = null;
const TAP_THRESH = 9;
const updateHover = (sx, sy) => (hover = { sx, sy });

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture?.(ev.pointerId); momentum.x = momentum.y = 0;
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: 0 });
  updateHover(ev.clientX, ev.clientY);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; pinchScale0 = camera.scale; pinching = true; mode = "pinch"; current = null; ev.preventDefault(); return;
  }
  const pan = tool === "hand" || (ev.pointerType === "mouse" && (ev.button === 1 || ev.button === 2 || spaceDown));
  if (pan) mode = "pan";
  else if (tool === "erase") { mode = "erase"; const [wx, wy] = s2w(ev.clientX, ev.clientY); eraseAt(wx, wy); }
  else {
    mode = "draw"; let sp = s2w(ev.clientX, ev.clientY);
    const sn = getSnap(sp[0], sp[1], Math.max(16 / camera.scale, toolWidth[tool] * 0.7)); if (sn) sp = sn;
    current = { type: tool, width: toolWidth[tool], pts: [sp] };
  }
  ev.preventDefault();
}, { passive: false });

canvas.addEventListener("pointermove", (ev) => {
  updateHover(ev.clientX, ev.clientY);
  const p = pointers.get(ev.pointerId); if (!p) return;
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
  if (mode === "pinch" && pointers.size >= 2) {
    const [a, b] = [...pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    setZoom(pinchScale0 * (dist / pinchDist0), (a.x + b.x) / 2, (a.y + b.y) / 2); return;
  }
  if (mode === "pan") { camera.x += dx; camera.y += dy; lastV = { x: dx, y: dy }; }
  else if (mode === "draw" && current) {
    const wp = s2w(ev.clientX, ev.clientY), last = current.pts[current.pts.length - 1];
    if (Math.hypot(wp[0] - last[0], wp[1] - last[1]) > 3 / camera.scale) current.pts.push(wp);
  } else if (mode === "erase") { const [wx, wy] = s2w(ev.clientX, ev.clientY); eraseAt(wx, wy); }
  ev.preventDefault();
}, { passive: false });

function endPointer(ev) {
  const p = pointers.get(ev.pointerId); pointers.delete(ev.pointerId); const lastOne = pointers.size === 0;
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

document.getElementById("tools").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && b.dataset.tool) selectTool(b.dataset.tool); });
sizeSlider.addEventListener("input", () => { if (tool !== "hand") toolWidth[tool] = parseInt(sizeSlider.value, 10); });
zoomSlider.addEventListener("input", () => setZoom(parseFloat(zoomSlider.value), innerWidth / 2, innerHeight * 0.42));
document.getElementById("gridchk").addEventListener("change", (e) => { showGrid = e.target.checked; });
document.getElementById("clear").addEventListener("click", () => { strokes = []; alleys = []; plots = []; plotsByTile = new Map(); enc = null; activeCells.clear(); spriteCache.clear(); current = null; });

/* ===================== Início ======================================= */
function start() {
  resize(); selectTool("road");
  camera.x = innerWidth / 2; camera.y = innerHeight * 0.42; zoomSlider.value = camera.scale;
  render();
}
addEventListener("resize", resize);
start();
