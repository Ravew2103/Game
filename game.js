"use strict";

/* =========================================================================
   Cidade Infinita — um "canvas" de mapa.

   O jogador pinta o esqueleto da cidade com pincéis (rua, avenida, rio,
   quadra) e o jogo PREENCHE PROCEDURALMENTE em volta: casas surgem ao longo
   das ruas, dentro de uma faixa de distância, alinhadas à via. Quadras viram
   áreas densas de construção; o rio é desenhado como água.

   Tudo vive em coordenadas de mundo (px na escala 1). A renderização é feita
   em "células" (tiles) cacheadas só para performance — o conteúdo em si é
   contínuo, derivado dos traços do jogador.
   ========================================================================= */

const TILE = 100;           // tamanho da célula de cache (px de mundo)
const SPRITE = 220;         // resolução do sprite de cada célula
const M = 80;               // margem: quão longe um traço influencia uma célula
const FRONTAGE = 22;        // faixa de construção ao longo das vias
const SEED = 0x9e3779b9;    // semente do espalhamento de construções

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

/* ===================== Modelo: traços do jogador ====================== */
// stroke: { type:'road'|'avenue'|'river'|'block', width, pts:[[wx,wy],...], bbox }
let strokes = [];
const activeCells = new Set();   // chaves "cx,cy" que têm conteúdo
const spriteCache = new Map();   // "cx,cy" -> canvas

function strokeBBox(s) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of s.pts) {
    if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
    if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
  }
  const pad = s.width / 2 + 2;
  return [minx - pad, miny - pad, maxx + pad, maxy + pad];
}
function activateCellsFor(s) {
  const [x0, y0, x1, y1] = s.bbox;
  const c0 = Math.floor((x0 - M) / TILE), c1 = Math.floor((x1 + M) / TILE);
  const r0 = Math.floor((y0 - M) / TILE), r1 = Math.floor((y1 + M) / TILE);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    const k = c + "," + r; activeCells.add(k); spriteCache.delete(k);
  }
}
function rebuildActive() {
  activeCells.clear(); spriteCache.clear();
  for (const s of strokes) activateCellsFor(s);
}

/* ===================== Geração procedural de uma célula =============== */
function bboxIntersect(b, x0, y0, x1, y1) { return !(b[0] > x1 || b[2] < x0 || b[1] > y1 || b[3] < y0); }

function nearest(wx, wy, segs) {
  let d = Infinity, seg = null;
  for (const s of segs) {
    const dd = distToSeg(wx, wy, s.ax, s.ay, s.bx, s.by);
    if (dd < d) { d = dd; seg = s; }
  }
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

  // segmentos próximos, separados por tipo
  const ex0 = ox - M, ey0 = oy - M, ex1 = ox + TILE + M, ey1 = oy + TILE + M;
  const roadSegs = [], riverSegs = [], blockSegs = [], blockPolys = [];
  const nearRoads = [], nearRivers = [], nearBlocks = [];
  for (const s of strokes) {
    if (!bboxIntersect(s.bbox, ex0, ey0, ex1, ey1)) continue;
    if (s.type === "river") nearRivers.push(s);
    else if (s.type === "block") { nearBlocks.push(s); blockPolys.push(s.pts); }
    else nearRoads.push(s);
    const dst = s.type === "river" ? riverSegs : s.type === "block" ? blockSegs : roadSegs;
    const n = s.pts.length, lim = s.type === "block" ? n : n - 1; // quadra fecha o polígono
    for (let i = 0; i < lim; i++) {
      const a = s.pts[i], b = s.pts[(i + 1) % n];
      const ax = a[0], ay = a[1], bx = b[0], by = b[1];
      if (Math.max(ax, bx) < ex0 || Math.min(ax, bx) > ex1 || Math.max(ay, by) < ey0 || Math.min(ay, by) > ey1) continue;
      dst.push({ ax, ay, bx, by, w: s.width });
    }
  }

  // rio por baixo
  for (const s of nearRivers) drawStrokeLocal(ctx, s, ox, oy);

  // espalhamento de construções (o "preenchimento procedural ao redor")
  const step = 9;
  for (let gx = step / 2; gx < TILE; gx += step) {
    for (let gy = step / 2; gy < TILE; gy += step) {
      const lx = gx + (rng() - 0.5) * 5, ly = gy + (rng() - 0.5) * 5;
      const wx = ox + lx, wy = oy + ly;

      // água manda embora
      let onWater = false;
      for (const s of riverSegs) if (distToSeg(wx, wy, s.ax, s.ay, s.bx, s.by) < s.w / 2 + 3) { onWater = true; break; }
      if (onWater) continue;

      const r = nearest(wx, wy, roadSegs);
      if (r.seg && r.d < r.seg.w / 2 + 3) continue;        // em cima da rua

      // quadra = interior do perímetro desenhado pelo jogador
      let inBlock = false;
      for (const poly of blockPolys) if (pointInPolygon(wx, wy, poly)) { inBlock = true; break; }
      const nearRoad = r.seg && r.d < r.seg.w / 2 + FRONTAGE;
      if (!inBlock && !nearRoad) continue;                  // longe de tudo -> papel

      if (rng() < 0.1) { drawTree(ctx, lx, ly, rng); continue; }
      // orienta a construção: pela via mais próxima ou, dentro da quadra, pela borda dela
      let ang = rng() * Math.PI;
      if (nearRoad) ang = Math.atan2(r.seg.by - r.seg.ay, r.seg.bx - r.seg.ax);
      else if (inBlock && blockSegs.length) {
        const be = nearest(wx, wy, blockSegs);
        if (be.seg) ang = Math.atan2(be.seg.by - be.seg.ay, be.seg.bx - be.seg.ax);
      }
      drawBuilding(ctx, lx, ly, ang, 6 + rng() * 7, 6 + rng() * 6, ROOF_COLORS[(rng() * ROOF_COLORS.length) | 0]);
    }
  }

  // contorno discreto das quadras (o perímetro que você desenhou)
  for (const s of nearBlocks) drawBlockOutline(ctx, s, ox, oy);

  // ruas / avenidas por cima
  for (const s of nearRoads) drawStrokeLocal(ctx, s, ox, oy);

  return cv;
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function drawBlockOutline(ctx, s, ox, oy) {
  if (s.pts.length < 3) return;
  ctx.strokeStyle = "rgba(74,58,35,0.28)"; ctx.lineWidth = 1.4; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(s.pts[0][0] - ox, s.pts[0][1] - oy);
  for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0] - ox, s.pts[i][1] - oy);
  ctx.closePath(); ctx.stroke();
}

function drawStrokeLocal(ctx, s, ox, oy) {
  const lp = s.pts.map((p) => [p[0] - ox, p[1] - oy]);
  if (lp.length < 2) return;
  if (s.type === "river") {
    strokePoly(ctx, lp, s.width + 3, WATER_INK);
    strokePoly(ctx, lp, s.width, WATER);
    strokePoly(ctx, lp, Math.max(3, s.width * 0.18), WATER_HI);
  } else { // road / avenue
    strokePoly(ctx, lp, s.width + 3, INK);
    strokePoly(ctx, lp, s.width, STREET);
    if (s.type === "avenue") {                 // faixa central tracejada
      ctx.save(); ctx.setLineDash([6, 7]);
      strokePoly(ctx, lp, 1.6, "rgba(120,95,55,0.5)");
      ctx.restore();
    }
  }
}
function strokePoly(ctx, pts, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
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

  // papel
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);

  // células com conteúdo
  for (const k of activeCells) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = w2s(cx * TILE, cy * TILE);
    if (sx > w || sy > h || sx + size < 0 || sy + size < 0) continue;
    ctx.drawImage(getSprite(cx, cy), sx, sy, size, size);
  }

  // grade suave
  if (showGrid) {
    ctx.strokeStyle = "rgba(74,58,35,0.13)"; ctx.lineWidth = 1; ctx.beginPath();
    const c0 = Math.floor(-camera.x / size), c1 = Math.ceil((w - camera.x) / size);
    const r0 = Math.floor(-camera.y / size), r1 = Math.ceil((h - camera.y) / size);
    for (let c = c0; c <= c1; c++) { const x = camera.x + c * size; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let r = r0; r <= r1; r++) { const y = camera.y + r * size; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  // traço sendo desenhado agora (feedback imediato, em tela)
  if (current) {
    const isBlock = current.type === "block";
    const col = current.type === "river" ? "rgba(120,170,180,0.85)"
      : isBlock ? "rgba(90,70,40,0.9)" : "rgba(40,33,24,0.9)";
    ctx.strokeStyle = col; ctx.lineWidth = isBlock ? 2 : current.width * camera.scale;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (isBlock) ctx.setLineDash([6, 6]);
    ctx.beginPath();
    const p0 = w2s(current.pts[0][0], current.pts[0][1]); ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i < current.pts.length; i++) { const p = w2s(current.pts[i][0], current.pts[i][1]); ctx.lineTo(p[0], p[1]); }
    if (isBlock && current.pts.length > 2) { ctx.lineTo(p0[0], p0[1]); } // dica de fechamento
    ctx.stroke(); ctx.setLineDash([]);
  }

  // grão de papel por cima (uniforme, sem emendas)
  ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = ctx.createPattern(noiseCanvas, "repeat"); ctx.fillRect(0, 0, w, h); ctx.restore();

  // cursor do pincel
  if (hover && tool !== "hand") {
    ctx.strokeStyle = tool === "erase" ? "rgba(196,80,60,0.9)" : "rgba(40,33,24,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hover.sx, hover.sy, (toolWidth[tool] / 2) * camera.scale, 0, Math.PI * 2); ctx.stroke();
  }

  requestAnimationFrame(render);
}

/* ===================== Pincéis / ferramentas ========================= */
let tool = "road";
const toolWidth = { hand: 0, road: 14, avenue: 28, river: 22, block: 44, erase: 30 };

function selectTool(t) {
  tool = t;
  for (const b of document.querySelectorAll("#tools button")) b.classList.toggle("active", b.dataset.tool === t);
  if (toolWidth[t]) sizeSlider.value = toolWidth[t];
}

/* ===================== Edição (desenhar / apagar) ==================== */
function finalizeStroke(s) {
  if (s.pts.length === 1) s.pts.push([s.pts[0][0] + 0.5, s.pts[0][1] + 0.5]);
  s.bbox = strokeBBox(s);
  strokes.push(s);
  activateCellsFor(s);
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
  if (changed) rebuildActive();
}

/* ===================== Entrada (Pointer Events) ====================== */
const pointers = new Map();
const momentum = { x: 0, y: 0 };
let lastV = { x: 0, y: 0 };
let pinching = false, pinchDist0 = 0, pinchScale0 = 0, spaceDown = false;
let mode = "idle", current = null, hover = null;
const TAP_THRESH = 9;

function updateHover(sx, sy) { hover = { sx, sy }; }

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture?.(ev.pointerId);
  momentum.x = momentum.y = 0;
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: 0 });
  updateHover(ev.clientX, ev.clientY);

  if (pointers.size === 2) {                       // 2 dedos -> pan/zoom; cancela desenho
    const [a, b] = [...pointers.values()];
    pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; pinchScale0 = camera.scale;
    pinching = true; mode = "pinch"; current = null;
    ev.preventDefault(); return;
  }

  const panGesture = tool === "hand" || (ev.pointerType === "mouse" && (ev.button === 1 || ev.button === 2 || spaceDown));
  if (panGesture) { mode = "pan"; }
  else if (tool === "erase") { mode = "erase"; const [wx, wy] = s2w(ev.clientX, ev.clientY); eraseAt(wx, wy); }
  else { mode = "draw"; current = { type: tool, width: toolWidth[tool], pts: [s2w(ev.clientX, ev.clientY)] }; }
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
    const wp = s2w(ev.clientX, ev.clientY);
    const last = current.pts[current.pts.length - 1];
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
sizeSlider.addEventListener("input", () => { if (toolWidth[tool] !== undefined && tool !== "hand") toolWidth[tool] = parseInt(sizeSlider.value, 10); });
zoomSlider.addEventListener("input", () => setZoom(parseFloat(zoomSlider.value), innerWidth / 2, innerHeight * 0.42));
document.getElementById("gridchk").addEventListener("change", (e) => { showGrid = e.target.checked; });
document.getElementById("clear").addEventListener("click", () => { strokes = []; activeCells.clear(); spriteCache.clear(); current = null; });

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
