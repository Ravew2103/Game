"use strict";

/* =========================================================================
   Cidade Infinita — roguelike de construção de mapa por peças quadradas.

   A grade é quadrada, mas o CONTEÚDO de cada peça é desenhado de forma
   procedural com ruas que curvam e quarteirões irregulares, no estilo de
   um mapa de cidade desenhado à mão (pergaminho + tinta).

   Encaixe (estilo Carcassonne): cada lado é 'R' (rua) ou 'B' (quarteirão);
   lados vizinhos só encaixam se forem do mesmo tipo.
   ========================================================================= */

const TILE = 100;
const ROAD_W = 22;
const SPRITE = 220;
const SKIP_MAX = 3;

const N = 0, E = 1, S = 2, W = 3;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

const TILE_DEFS = [
  { id: "straight", edges: ["R", "B", "R", "B"], weight: 5 },
  { id: "corner",   edges: ["R", "R", "B", "B"], weight: 5 },
  { id: "t",        edges: ["R", "R", "R", "B"], weight: 4 },
  { id: "cross",    edges: ["R", "R", "R", "R"], weight: 2 },
  { id: "round",    edges: ["R", "R", "R", "R"], weight: 1, roundabout: true },
  { id: "end",      edges: ["R", "B", "B", "B"], weight: 2 },
  { id: "park",     edges: ["B", "B", "B", "B"], weight: 2, park: true },
];

/* -------- paleta "mapa desenhado à mão" -------- */
const PAPER = "#e7d8b6";   // base de pergaminho (quarteirões/terra)
const STREET = "#efe7cf";  // faixa de rua (clara)
const INK = "#4a3a23";     // tinta (contornos)
const PARK_GREEN = "#8a9b5c";
const TREE_GREEN = "#6f8a4a";
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

/* ===================== Lógica das peças ================================ */
function rotatedEdges(edges, rot) {
  const out = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) out[i] = edges[((i - rot) % 4 + 4) % 4];
  return out;
}
function tileEdges(def, rot) { return rotatedEdges(def.edges, rot); }
function roadDirs(def, rot) {
  const e = tileEdges(def, rot), r = [];
  for (let i = 0; i < 4; i++) if (e[i] === "R") r.push(i);
  return r;
}
function edgeMidpoint(dir) {
  switch (dir) {
    case N: return [TILE / 2, 0];
    case E: return [TILE, TILE / 2];
    case S: return [TILE / 2, TILE];
    case W: return [0, TILE / 2];
  }
}

/* ===================== Geometria auxiliar ============================== */
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

/* ===================== Render procedural da peça ====================== */
function renderTileSprite(def, rot, cx, cy) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SPRITE;
  const ctx = cv.getContext("2d");
  ctx.scale(SPRITE / TILE, SPRITE / TILE);
  const rng = mulberry32(hash2(cx, cy) ^ (def.id.length * 2654435761));

  // base
  ctx.fillStyle = def.park ? PARK_GREEN : PAPER;
  ctx.fillRect(0, 0, TILE, TILE);

  const dirs = roadDirs(def, rot);
  const hub = [TILE / 2 + (rng() - 0.5) * 22, TILE / 2 + (rng() - 0.5) * 22];

  // centerlines das ruas como curvas (a curvatura é o que dá organicidade)
  const segs = [];
  if (dirs.length === 2 && (dirs[0] + 2) % 4 === dirs[1]) {
    const a = edgeMidpoint(dirs[0]), b = edgeMidpoint(dirs[1]);
    segs.push({ a, c: [(a[0] + b[0]) / 2 + (rng() - 0.5) * 30, (a[1] + b[1]) / 2 + (rng() - 0.5) * 30], b });
  } else {
    for (const d of dirs) {
      const a = edgeMidpoint(d);
      segs.push({ a, c: [(a[0] + hub[0]) / 2 + (rng() - 0.5) * 18, (a[1] + hub[1]) / 2 + (rng() - 0.5) * 18], b: hub });
    }
  }

  // quarteirões: lotes espalhados evitando as ruas -> blocos irregulares
  if (!def.park) {
    const step = 12;
    for (let gx = step / 2; gx < TILE; gx += step) {
      for (let gy = step / 2; gy < TILE; gy += step) {
        const jx = gx + (rng() - 0.5) * 6, jy = gy + (rng() - 0.5) * 6;
        let near = Infinity;
        for (const sg of segs) near = Math.min(near, segDistApprox(jx, jy, sg));
        if (near < ROAD_W / 2 + 5) continue;
        if (jx < 3 || jy < 3 || jx > TILE - 3 || jy > TILE - 3) continue;
        if (rng() < 0.12) { drawTree(ctx, jx, jy, rng); continue; }
        const w = 6 + rng() * 6, h = 6 + rng() * 6;
        ctx.fillStyle = ROOF_COLORS[(rng() * ROOF_COLORS.length) | 0];
        ctx.fillRect(jx - w / 2, jy - h / 2, w, h);
        ctx.strokeStyle = "rgba(40,28,15,0.55)";  // contorno de tinta
        ctx.lineWidth = 0.9;
        ctx.strokeRect(jx - w / 2, jy - h / 2, w, h);
      }
    }
  } else {
    for (let i = 0; i < 16; i++) drawTree(ctx, 10 + rng() * 80, 10 + rng() * 80, rng);
  }

  // ruas: contorno de tinta por baixo + faixa clara por cima
  for (const sg of segs) strokeSeg(ctx, sg, ROAD_W + 3, INK);
  for (const sg of segs) strokeSeg(ctx, sg, ROAD_W, STREET);

  // praças / rotatórias
  if (def.roundabout) {
    fillCircle(ctx, hub[0], hub[1], 18, STREET); strokeCircle(ctx, hub[0], hub[1], 18, INK, 1.2);
    fillCircle(ctx, hub[0], hub[1], 9, PARK_GREEN);
  } else if (dirs.length >= 3) {
    fillCircle(ctx, hub[0], hub[1], ROAD_W * 0.55, STREET);
  } else if (dirs.length === 1) {
    fillCircle(ctx, hub[0], hub[1], ROAD_W * 0.7, STREET); strokeCircle(ctx, hub[0], hub[1], ROAD_W * 0.7, INK, 1);
  }

  // moldura discreta da peça (ajuda a leitura, bem suave)
  ctx.strokeStyle = "rgba(74,58,35,0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  return cv;
}

function strokeSeg(ctx, sg, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(sg.a[0], sg.a[1]);
  ctx.quadraticCurveTo(sg.c[0], sg.c[1], sg.b[0], sg.b[1]); ctx.stroke();
}
function drawTree(ctx, x, y, rng) {
  ctx.fillStyle = rng() < 0.5 ? TREE_GREEN : PARK_GREEN;
  ctx.beginPath(); ctx.arc(x, y, 3 + rng() * 2, 0, Math.PI * 2); ctx.fill();
}
function fillCircle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function strokeCircle(ctx, x, y, r, c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }

/* ===================== Estado ========================================= */
const board = new Map();
const camera = { x: 0, y: 0, scale: 2.2 };
let deck = [], current = null, skips = SKIP_MAX, placed = 0, score = 0;
let hover = null;            // { cx, cy, valid }
let showGrid = true;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const elScore = document.getElementById("score");
const elPlaced = document.getElementById("placed");
const elSkips = document.getElementById("skips");
const zoomSlider = document.getElementById("zoom");

const key = (x, y) => x + "," + y;

/* ---- Baralho ---- */
function drawTileIndex() {
  let total = 0; for (const d of TILE_DEFS) total += d.weight;
  let r = Math.random() * total;
  for (let i = 0; i < TILE_DEFS.length; i++) { r -= TILE_DEFS[i].weight; if (r <= 0) return i; }
  return 0;
}
function refillDeck() { while (deck.length < 4) deck.push(drawTileIndex()); }
function nextTile() { refillDeck(); current = { defIndex: deck.shift(), rot: 0 }; refillDeck(); updateHud(); }

/* ---- Encaixe ---- */
function canPlace(cx, cy, defIndex, rot) {
  if (board.has(key(cx, cy))) return false;
  if (board.size === 0) return cx === 0 && cy === 0;
  const e = tileEdges(TILE_DEFS[defIndex], rot);
  let touches = false;
  for (let d = 0; d < 4; d++) {
    const nb = board.get(key(cx + DIRS[d][0], cy + DIRS[d][1]));
    if (!nb) continue;
    touches = true;
    if (tileEdges(nb.def, nb.rot)[(d + 2) % 4] !== e[d]) return false;
  }
  return touches;
}
function placeTile(cx, cy) {
  if (!current || !canPlace(cx, cy, current.defIndex, current.rot)) return false;
  const def = TILE_DEFS[current.defIndex];
  board.set(key(cx, cy), { def, rot: current.rot, sprite: renderTileSprite(def, current.rot, cx, cy) });
  let pts = 1;
  const e = tileEdges(def, current.rot);
  for (let d = 0; d < 4; d++) if (board.get(key(cx + DIRS[d][0], cy + DIRS[d][1])) && e[d] === "R") pts += 2;
  score += pts; placed++;
  nextTile();
  return true;
}

/* ---- Células candidatas (vizinhas vazias de peças já postas) ---- */
function candidateCells() {
  const set = new Map(); // "x,y" -> bool(valid p/ peça atual)
  if (board.size === 0) { set.set(key(0, 0), true); return set; }
  for (const k of board.keys()) {
    const [x, y] = k.split(",").map(Number);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, nk = key(nx, ny);
      if (board.has(nk) || set.has(nk)) continue;
      set.set(nk, current ? canPlace(nx, ny, current.defIndex, current.rot) : false);
    }
  }
  return set;
}

/* ===================== Câmera ========================================= */
function worldToScreen(cx, cy) { return [camera.x + cx * TILE * camera.scale, camera.y + cy * TILE * camera.scale]; }
function screenToCell(sx, sy) {
  return [Math.floor((sx - camera.x) / (TILE * camera.scale)), Math.floor((sy - camera.y) / (TILE * camera.scale))];
}
function setZoom(ns, ax, ay) {
  ns = clamp(0.6, 6, ns);
  const k = ns / camera.scale;
  camera.x = ax - (ax - camera.x) * k;
  camera.y = ay - (ay - camera.y) * k;
  camera.scale = ns;
  zoomSlider.value = ns;
}

/* ===================== Render ========================================= */
function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
function drawGrid() {
  const size = TILE * camera.scale;
  const w = innerWidth, h = innerHeight;

  if (showGrid) {
    // linhas suaves
    ctx.strokeStyle = "rgba(74,58,35,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const c0 = Math.floor(-camera.x / size), c1 = Math.ceil((w - camera.x) / size);
    const r0 = Math.floor(-camera.y / size), r1 = Math.ceil((h - camera.y) / size);
    for (let c = c0; c <= c1; c++) { const x = camera.x + c * size; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let r = r0; r <= r1; r++) { const y = camera.y + r * size; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  // células onde dá pra encaixar
  for (const [k, valid] of candidateCells()) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = worldToScreen(cx, cy);
    if (sx > w || sy > h || sx + size < 0 || sy + size < 0) continue;
    if (valid) {
      ctx.fillStyle = "rgba(138,168,106,0.22)";
      ctx.fillRect(sx, sy, size, size);
      ctx.strokeStyle = "rgba(138,168,106,0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, size - 2, size - 2);
    } else if (showGrid) {
      ctx.strokeStyle = "rgba(74,58,35,0.30)";
      ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + 2, sy + 2, size - 4, size - 4);
      ctx.setLineDash([]);
    }
  }
}
function render() {
  const w = innerWidth, h = innerHeight, size = TILE * camera.scale;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#2a2620"; ctx.fillRect(0, 0, w, h);

  drawGrid();

  for (const [k, t] of board) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = worldToScreen(cx, cy);
    if (sx > w || sy > h || sx + size < 0 || sy + size < 0) continue;
    ctx.drawImage(t.sprite, sx, sy, size, size);
  }

  if (hover && current && (board.size === 0 ? (hover.cx === 0 && hover.cy === 0) : true)) {
    const [sx, sy] = worldToScreen(hover.cx, hover.cy);
    if (!(sx > w || sy > h || sx + size < 0 || sy + size < 0)) {
      const sprite = renderTileSprite(TILE_DEFS[current.defIndex], current.rot, hover.cx, hover.cy);
      ctx.globalAlpha = 0.78;
      ctx.drawImage(sprite, sx, sy, size, size);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3;
      ctx.strokeStyle = hover.valid ? "#8aa86a" : "#c4674a";
      ctx.strokeRect(sx + 1.5, sy + 1.5, size - 3, size - 3);
    }
  }
  requestAnimationFrame(render);
}

/* ===================== HUD ============================================ */
function paintPreview(cv, defIndex, rot) {
  const c = cv.getContext("2d");
  c.clearRect(0, 0, cv.width, cv.height);
  c.drawImage(renderTileSprite(TILE_DEFS[defIndex], rot, defIndex + 7, 999), 0, 0, cv.width, cv.height);
}
function updateHud() {
  if (current) paintPreview(document.getElementById("current"), current.defIndex, current.rot);
  const q = document.getElementById("queue");
  q.innerHTML = "";
  for (let i = 0; i < 3 && i < deck.length; i++) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 40;
    paintPreview(cv, deck[i], 0);
    q.appendChild(cv);
  }
  elScore.textContent = score; elPlaced.textContent = placed; elSkips.textContent = skips;
}

/* ===================== Entrada (mouse + toque via Pointer Events) ===== */
const pointers = new Map();   // id -> {x,y,sx,sy,moved}
let mode = "idle";            // idle | pan | pinch
let pinchDist0 = 0, pinchScale0 = 0, suppressTap = false, spaceDown = false;
const TAP_THRESH = 9;

function refreshHover(x, y) {
  const [cx, cy] = screenToCell(x, y);
  hover = { cx, cy, valid: current ? canPlace(cx, cy, current.defIndex, current.rot) : false };
}

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture?.(ev.pointerId);
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: 0 });

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    pinchScale0 = camera.scale;
    mode = "pinch"; suppressTap = true;
  } else if (ev.pointerType === "mouse" && (ev.button === 1 || ev.button === 2 || spaceDown)) {
    mode = "pan";
  } else {
    mode = "idle";
    refreshHover(ev.clientX, ev.clientY);
  }
  ev.preventDefault();
}, { passive: false });

canvas.addEventListener("pointermove", (ev) => {
  const p = pointers.get(ev.pointerId);
  if (!p) { if (ev.pointerType === "mouse") refreshHover(ev.clientX, ev.clientY); return; }

  const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
  p.x = ev.clientX; p.y = ev.clientY;
  p.moved += Math.abs(dx) + Math.abs(dy);

  if (mode === "pinch" && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    setZoom(pinchScale0 * (dist / pinchDist0), (a.x + b.x) / 2, (a.y + b.y) / 2);
    return;
  }

  if (mode === "pan" || (mode === "idle" && p.moved > TAP_THRESH)) {
    mode = mode === "pan" ? "pan" : "pan-drag";
    camera.x += dx; camera.y += dy;
  }
  refreshHover(ev.clientX, ev.clientY);
}, { passive: false });

function endPointer(ev) {
  const p = pointers.get(ev.pointerId);
  pointers.delete(ev.pointerId);

  // toque/clique curto = colocar peça
  if (p && !suppressTap && (mode === "idle") && p.moved <= TAP_THRESH) {
    if (ev.pointerType !== "mouse" || ev.button === 0) {
      const [cx, cy] = screenToCell(p.sx, p.sy);
      placeTile(cx, cy);
    }
  }
  if (pointers.size === 0) { mode = "idle"; suppressTap = false; }
  else if (pointers.size === 1) { mode = "idle"; } // saiu da pinça: evita salto
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", (ev) => { pointers.delete(ev.pointerId); if (!pointers.size) { mode = "idle"; suppressTap = false; } });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  setZoom(camera.scale * (ev.deltaY < 0 ? 1.1 : 1 / 1.1), ev.clientX, ev.clientY);
}, { passive: false });

/* ---- teclado (desktop) ---- */
addEventListener("keydown", (ev) => {
  if (ev.code === "Space") { spaceDown = true; ev.preventDefault(); }
  if (ev.key === "r" || ev.key === "R") rotateCurrent();
  if (ev.key === "d" || ev.key === "D") doSkip();
});
addEventListener("keyup", (ev) => { if (ev.code === "Space") spaceDown = false; });

/* ---- botões / sliders ---- */
function rotateCurrent() {
  if (!current) return;
  current.rot = (current.rot + 1) % 4;
  if (hover) hover.valid = canPlace(hover.cx, hover.cy, current.defIndex, current.rot);
  updateHud();
}
function doSkip() { if (skips > 0 && current) { skips--; nextTile(); } }

document.getElementById("rotate").onclick = rotateCurrent;
document.getElementById("skip").onclick = doSkip;
zoomSlider.addEventListener("input", () => setZoom(parseFloat(zoomSlider.value), innerWidth / 2, innerHeight * 0.42));
document.getElementById("gridchk").addEventListener("change", (e) => { showGrid = e.target.checked; });

/* ===================== Início ======================================== */
function start() {
  resize();
  refillDeck(); nextTile();
  camera.x = innerWidth / 2 - TILE * camera.scale / 2;
  camera.y = innerHeight * 0.42 - TILE * camera.scale / 2;
  zoomSlider.value = camera.scale;
  render();
}
addEventListener("resize", resize);
start();
