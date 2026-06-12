"use strict";

/* =========================================================================
   Cidade Infinita — construtor de cidade procedural e contínua.

   Conceito: a cidade é UM tecido contínuo gerado proceduralmente. Cada borda
   entre duas células tem um perfil determinístico (se uma rua a cruza e em que
   posição), calculado por hash das coordenadas globais da borda. Como dois
   vizinhos derivam a MESMA borda do mesmo hash, as ruas atravessam as peças de
   forma contínua — sem regras de encaixe, sem retalhos. O rio é uma curva
   global que serpenteia pelo mapa inteiro.

   O jogador apenas escolhe ONDE expandir: toca numa célula adjacente e o jogo
   "constrói" aquele pedaço; as células ao redor aparecem como esboço.
   ========================================================================= */

const TILE = 100;
const ROAD_W = 18;
const RIVER_W = 26;
const SPRITE = 220;
const ROAD_PROB = 0.5;      // chance de uma borda ter rua

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

/* -------- paleta "mapa desenhado à mão", atemporal -------- */
const PAPER = "#e7d8b6";
const STREET = "#efe7cf";
const INK = "#4a3a23";
const TREE_GREEN = "#6f8a4a";
const PARK_GREEN = "#8a9b5c";
const WATER = "#8fb1b4";
const WATER_INK = "#5c8084";
const WATER_HI = "#bcd6d6";
const ROOF_COLORS = ["#cdb389", "#c2a06f", "#b98c5a", "#d8c39a", "#bca16d", "#a9824f", "#c69c6d"];

/* ===================== RNG determinístico ============================== */
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
const lerp = (a, b, t) => a + (b - a) * t;

/* ===================== Mundo / semente ================================= */
let WORLD_SEED = (Math.random() * 1e9) | 0;
let river = { base: 0, p1: 0, p2: 0 };
function resetWorld(seed) {
  WORLD_SEED = seed >>> 0;
  built.clear(); spriteCache.clear(); placed = 0; markDirty();
  const s = WORLD_SEED;
  river = { base: 0.5 + (((s >> 5) % 5) - 2), p1: (s % 628) / 100, p2: ((s >> 7) % 314) / 100 };
  updateHud();
}
// centro do rio (em unidades de célula) em função do Y do mundo -> meandro contínuo
function riverCenterX(yc) {
  return river.base + 1.7 * Math.sin(yc * 0.55 + river.p1) + 0.8 * Math.sin(yc * 1.25 + river.p2);
}

/* ===================== Textura de papel (grão) ======================== */
const noiseCanvas = (() => {
  const nc = document.createElement("canvas");
  nc.width = nc.height = 64;
  const nx = nc.getContext("2d");
  const img = nx.createImageData(64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const c = Math.random() < 0.5 ? 30 : 235;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
    img.data[i + 3] = (Math.random() * 30) | 0;
  }
  nx.putImageData(img, 0, 0);
  return nc;
})();

/* ===================== Perfil das bordas =============================== */
// kind: 'V' (borda vertical, à esquerda da célula) ou 'H' (horizontal, no topo)
function edgeProfile(kind, ex, ey) {
  let h = hash2(ex, ey) ^ (kind === "V" ? 0x12345 : 0x6789a) ^ (WORLD_SEED | 0);
  const r = mulberry32(h >>> 0);
  return { road: r() < ROAD_PROB, t: 0.28 + r() * 0.44 };
}

/* ===================== Geometria das vias ============================= */
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = clamp(0, 1, ((px - ax) * dx + (py - ay) * dy) / len2);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function segDistApprox(px, py, sg) {
  let prev = sg.a, best = Infinity;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3, it = 1 - t;
    const x = it * it * sg.a[0] + 2 * it * t * sg.c[0] + t * t * sg.b[0];
    const y = it * it * sg.a[1] + 2 * it * t * sg.c[1] + t * t * sg.b[1];
    best = Math.min(best, distToSeg(px, py, prev[0], prev[1], x, y));
    prev = [x, y];
  }
  return best;
}
function distToPoly(px, py, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++)
    best = Math.min(best, distToSeg(px, py, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
  return best;
}
// liga os pontos de rua das bordas por dentro da peça (curvas = organicidade)
function buildRoadSegs(pts, rng) {
  const segs = [], ends = []; let hub = null;
  const C = [TILE / 2, TILE / 2];
  if (pts.length === 1) {
    const a = pts[0];
    const b = [lerp(a[0], C[0], 0.5) + (rng() - 0.5) * 16, lerp(a[1], C[1], 0.5) + (rng() - 0.5) * 16];
    segs.push({ a, c: [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5)], b });
    ends.push(b);
  } else if (pts.length === 2) {
    const a = pts[0], b = pts[1];
    segs.push({ a, c: [lerp(a[0], b[0], 0.5) + (rng() - 0.5) * 34, lerp(a[1], b[1], 0.5) + (rng() - 0.5) * 34], b });
  } else if (pts.length >= 3) {
    hub = [C[0] + (rng() - 0.5) * 26, C[1] + (rng() - 0.5) * 26];
    for (const a of pts)
      segs.push({ a, c: [lerp(a[0], hub[0], 0.5) + (rng() - 0.5) * 16, lerp(a[1], hub[1], 0.5) + (rng() - 0.5) * 16], b: hub });
  }
  return { segs, hub, ends };
}
function riverPolyline(cx, cy) {
  const pts = []; let touches = false;
  const STEPS = 12;
  for (let i = 0; i <= STEPS; i++) {
    const yc = cy - 0.08 + 1.16 * (i / STEPS);
    const lx = (riverCenterX(yc) - cx) * TILE, ly = (yc - cy) * TILE;
    pts.push([lx, ly]);
    if (lx >= -RIVER_W && lx <= TILE + RIVER_W) touches = true;
  }
  return touches ? pts : null;
}

/* ===================== Geração procedural da peça ===================== */
function generateTileSprite(cx, cy) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SPRITE;
  const ctx = cv.getContext("2d");
  ctx.scale(SPRITE / TILE, SPRITE / TILE);
  const rng = mulberry32((hash2(cx, cy) ^ (WORLD_SEED | 0) ^ 0xABCDEF) >>> 0);

  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, TILE, TILE);

  // pontos de rua nas 4 bordas (compartilhados com os vizinhos)
  const pts = [];
  let p;
  p = edgeProfile("H", cx, cy);     if (p.road) pts.push([p.t * TILE, 0]);
  p = edgeProfile("H", cx, cy + 1); if (p.road) pts.push([p.t * TILE, TILE]);
  p = edgeProfile("V", cx, cy);     if (p.road) pts.push([0, p.t * TILE]);
  p = edgeProfile("V", cx + 1, cy); if (p.road) pts.push([TILE, p.t * TILE]);
  const road = buildRoadSegs(pts, rng);

  const riverPts = riverPolyline(cx, cy);

  // rio por baixo
  if (riverPts) {
    strokePoly(ctx, riverPts, RIVER_W + 3, WATER_INK);
    strokePoly(ctx, riverPts, RIVER_W, WATER);
    strokePoly(ctx, riverPts, 4, WATER_HI);
  }

  // quarteirões: lotes evitando ruas e rio -> blocos irregulares que se
  // estendem para os vizinhos (porque as ruas se alinham nas bordas)
  const step = 11;
  for (let gx = step / 2; gx < TILE; gx += step) {
    for (let gy = step / 2; gy < TILE; gy += step) {
      const jx = gx + (rng() - 0.5) * 6, jy = gy + (rng() - 0.5) * 6;
      if (jx < 3 || jy < 3 || jx > TILE - 3 || jy > TILE - 3) continue;
      let block = false;
      for (const sg of road.segs) if (segDistApprox(jx, jy, sg) < ROAD_W / 2 + 5) { block = true; break; }
      if (!block && riverPts && distToPoly(jx, jy, riverPts) < RIVER_W / 2 + 6) block = true;
      if (block) continue;
      if (rng() < 0.12) { drawTree(ctx, jx, jy, rng); continue; }
      const w = 6 + rng() * 6, h = 6 + rng() * 6;
      ctx.fillStyle = ROOF_COLORS[(rng() * ROOF_COLORS.length) | 0];
      ctx.fillRect(jx - w / 2, jy - h / 2, w, h);
      ctx.strokeStyle = "rgba(40,28,15,0.55)"; ctx.lineWidth = 0.9;
      ctx.strokeRect(jx - w / 2, jy - h / 2, w, h);
    }
  }

  // ruas por cima
  for (const sg of road.segs) strokeSeg(ctx, sg, ROAD_W + 3, INK);
  for (const sg of road.segs) strokeSeg(ctx, sg, ROAD_W, STREET);
  if (road.hub) { fillCircle(ctx, road.hub[0], road.hub[1], ROAD_W * 0.55, STREET); }
  for (const e of road.ends) { fillCircle(ctx, e[0], e[1], ROAD_W * 0.6, STREET); strokeCircle(ctx, e[0], e[1], ROAD_W * 0.6, INK, 1); }

  // grão de papel
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.55; ctx.fillStyle = ctx.createPattern(noiseCanvas, "repeat");
  ctx.fillRect(0, 0, SPRITE, SPRITE); ctx.restore();
  return cv;
}

function strokeSeg(ctx, sg, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(sg.a[0], sg.a[1]); ctx.quadraticCurveTo(sg.c[0], sg.c[1], sg.b[0], sg.b[1]); ctx.stroke();
}
function strokePoly(ctx, pts, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
function drawTree(ctx, x, y, rng) {
  ctx.fillStyle = rng() < 0.5 ? TREE_GREEN : PARK_GREEN;
  ctx.beginPath(); ctx.arc(x, y, 3 + rng() * 2, 0, Math.PI * 2); ctx.fill();
}
function fillCircle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function strokeCircle(ctx, x, y, r, c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }

/* ===================== Estado ========================================= */
const built = new Set();              // chaves "x,y" já construídas
const spriteCache = new Map();        // "x,y" -> canvas (gerado sob demanda)
const camera = { x: 0, y: 0, scale: 2.2 };
let placed = 0, hover = null, showGrid = true;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const elPlaced = document.getElementById("placed");
const zoomSlider = document.getElementById("zoom");
const key = (x, y) => x + "," + y;

function getSprite(cx, cy) {
  const k = key(cx, cy);
  let s = spriteCache.get(k);
  if (!s) { s = generateTileSprite(cx, cy); spriteCache.set(k, s); }
  return s;
}

/* ---- fronteira (células vazias vizinhas das construídas) ---- */
let candCache = null, candDirty = true;
function markDirty() { candDirty = true; }
function getCandidates() {
  if (!candDirty && candCache) return candCache;
  const set = new Set();
  if (built.size === 0) set.add(key(0, 0));
  else for (const k of built) {
    const [x, y] = k.split(",").map(Number);
    for (const [dx, dy] of DIRS) {
      const nk = key(x + dx, y + dy);
      if (!built.has(nk)) set.add(nk);
    }
  }
  candCache = set; candDirty = false;
  return set;
}
function buildCell(cx, cy) {
  const k = key(cx, cy);
  if (built.has(k)) return;
  if (built.size > 0) {
    let adj = false;
    for (const [dx, dy] of DIRS) if (built.has(key(cx + dx, cy + dy))) { adj = true; break; }
    if (!adj) return;
  }
  built.add(k); placed++; markDirty(); updateHud();
}

/* ===================== Câmera ========================================= */
function worldToScreen(cx, cy) { return [camera.x + cx * TILE * camera.scale, camera.y + cy * TILE * camera.scale]; }
function screenToCell(sx, sy) {
  return [Math.floor((sx - camera.x) / (TILE * camera.scale)), Math.floor((sy - camera.y) / (TILE * camera.scale))];
}
function setZoom(ns, ax, ay) {
  ns = clamp(0.6, 6, ns);
  const k = ns / camera.scale;
  camera.x = ax - (ax - camera.x) * k; camera.y = ay - (ay - camera.y) * k;
  camera.scale = ns; zoomSlider.value = ns;
}

/* ===================== Render ========================================= */
function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
function cellVisible(sx, sy, size, w, h) { return !(sx > w || sy > h || sx + size < 0 || sy + size < 0); }

function render() {
  const w = innerWidth, h = innerHeight, size = TILE * camera.scale;

  if (pointers.size === 0 && (Math.abs(momentum.x) > 0.08 || Math.abs(momentum.y) > 0.08)) {
    camera.x += momentum.x; camera.y += momentum.y; momentum.x *= 0.90; momentum.y *= 0.90;
  } else if (pointers.size === 0) { momentum.x = momentum.y = 0; }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#2a2620"; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = ctx.createPattern(noiseCanvas, "repeat"); ctx.fillRect(0, 0, w, h); ctx.restore();

  // grade suave
  if (showGrid) {
    ctx.strokeStyle = "rgba(74,58,35,0.14)"; ctx.lineWidth = 1; ctx.beginPath();
    const c0 = Math.floor(-camera.x / size), c1 = Math.ceil((w - camera.x) / size);
    const r0 = Math.floor(-camera.y / size), r1 = Math.ceil((h - camera.y) / size);
    for (let c = c0; c <= c1; c++) { const x = camera.x + c * size; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let r = r0; r <= r1; r++) { const y = camera.y + r * size; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  // fronteira: esboço da cidade já gerada ao redor (toque para construir)
  for (const k of getCandidates()) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = worldToScreen(cx, cy);
    if (!cellVisible(sx, sy, size, w, h)) continue;
    const hot = hover && hover.cx === cx && hover.cy === cy;
    ctx.globalAlpha = hot ? 0.55 : 0.30;
    ctx.drawImage(getSprite(cx, cy), sx, sy, size, size);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hot ? "rgba(138,168,106,1)" : "rgba(138,168,106,0.7)";
    ctx.lineWidth = hot ? 3 : 2;
    ctx.strokeRect(sx + 1.5, sy + 1.5, size - 3, size - 3);
  }

  // cidade construída
  for (const k of built) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = worldToScreen(cx, cy);
    if (!cellVisible(sx, sy, size, w, h)) continue;
    ctx.drawImage(getSprite(cx, cy), sx, sy, size, size);
  }

  requestAnimationFrame(render);
}

/* ===================== HUD ============================================ */
function updateHud() { elPlaced.textContent = placed; }

/* ===================== Entrada (Pointer Events) ======================= */
const pointers = new Map();
const momentum = { x: 0, y: 0 };
let lastV = { x: 0, y: 0 };
let pinching = false, pinchDist0 = 0, pinchScale0 = 0, suppressTap = false, spaceDown = false;
const TAP_THRESH = 9;

function refreshHover(x, y) { const [cx, cy] = screenToCell(x, y); hover = { cx, cy }; }
function isPanPointer(ev) { return ev.pointerType !== "mouse" || ev.buttons !== 0 || spaceDown; }

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture?.(ev.pointerId);
  momentum.x = momentum.y = 0;
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: 0, pan: isPanPointer(ev) });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; pinchScale0 = camera.scale; pinching = true; suppressTap = true;
  }
  refreshHover(ev.clientX, ev.clientY);
  ev.preventDefault();
}, { passive: false });

canvas.addEventListener("pointermove", (ev) => {
  const p = pointers.get(ev.pointerId);
  if (!p) { if (ev.pointerType === "mouse") refreshHover(ev.clientX, ev.clientY); return; }
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
  p.x = ev.clientX; p.y = ev.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
  if (pinching && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    setZoom(pinchScale0 * (dist / pinchDist0), (a.x + b.x) / 2, (a.y + b.y) / 2);
    return;
  }
  if (p.pan) { camera.x += dx; camera.y += dy; lastV = { x: dx, y: dy }; }
  refreshHover(ev.clientX, ev.clientY);
}, { passive: false });

function endPointer(ev) {
  const p = pointers.get(ev.pointerId);
  pointers.delete(ev.pointerId);
  const lastOne = pointers.size === 0;
  if (lastOne && p && !suppressTap && p.moved <= TAP_THRESH) {
    if (ev.pointerType !== "mouse" || ev.button === 0) { const [cx, cy] = screenToCell(p.sx, p.sy); buildCell(cx, cy); }
  }
  if (lastOne && p && p.moved > TAP_THRESH) { momentum.x = lastV.x; momentum.y = lastV.y; }
  if (lastOne) { pinching = false; suppressTap = false; }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", (ev) => { pointers.delete(ev.pointerId); if (pointers.size === 0) { pinching = false; suppressTap = false; } });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("wheel", (ev) => { ev.preventDefault(); setZoom(camera.scale * (ev.deltaY < 0 ? 1.1 : 1 / 1.1), ev.clientX, ev.clientY); }, { passive: false });

addEventListener("keydown", (ev) => { if (ev.code === "Space") { spaceDown = true; ev.preventDefault(); } });
addEventListener("keyup", (ev) => { if (ev.code === "Space") spaceDown = false; });

zoomSlider.addEventListener("input", () => setZoom(parseFloat(zoomSlider.value), innerWidth / 2, innerHeight * 0.42));
document.getElementById("gridchk").addEventListener("change", (e) => { showGrid = e.target.checked; });
document.getElementById("newcity").addEventListener("click", () => {
  resetWorld((Math.random() * 1e9) | 0);
  camera.x = innerWidth / 2 - TILE * camera.scale / 2;
  camera.y = innerHeight * 0.42 - TILE * camera.scale / 2;
});

/* ===================== Início ======================================== */
function start() {
  resize();
  resetWorld(WORLD_SEED);
  camera.x = innerWidth / 2 - TILE * camera.scale / 2;
  camera.y = innerHeight * 0.42 - TILE * camera.scale / 2;
  zoomSlider.value = camera.scale;
  render();
}
addEventListener("resize", resize);
start();
