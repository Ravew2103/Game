"use strict";

/* =========================================================================
   Cidade Infinita — protótipo roguelike de construção de mapa por peças.

   Ideia central: a grade é de quadrados, mas o CONTEÚDO de cada peça tem
   ruas que curvam e quarteirões irregulares gerados proceduralmente, para
   que a cidade pareça orgânica e não um quadriculado.

   Regra de encaixe (estilo Carcassonne): cada lado da peça é 'R' (rua) ou
   'B' (quarteirão). Dois lados vizinhos só encaixam se forem do mesmo tipo,
   garantindo continuidade das ruas e dos quarteirões entre peças.
   ========================================================================= */

const TILE = 100;          // tamanho lógico de uma peça (unidades internas)
const ROAD_W = 22;         // largura da rua
const SPRITE = 220;        // resolução do sprite em cache de cada peça
const SKIP_MAX = 3;        // descartes iniciais

const N = 0, E = 1, S = 2, W = 3;            // índices dos lados
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // deslocamento por lado

/* ---- Definição das peças (antes de rotação) -------------------------------
   edges: [N, E, S, W]  com 'R' (rua) ou 'B' (quarteirão)                    */
const TILE_DEFS = [
  { id: "straight", edges: ["R", "B", "R", "B"], weight: 5 }, // rua passando
  { id: "corner",   edges: ["R", "R", "B", "B"], weight: 5 }, // curva
  { id: "t",        edges: ["R", "R", "R", "B"], weight: 4 }, // bifurcação T
  { id: "cross",    edges: ["R", "R", "R", "R"], weight: 2 }, // cruzamento
  { id: "round",    edges: ["R", "R", "R", "R"], weight: 1, roundabout: true },
  { id: "end",      edges: ["R", "B", "B", "B"], weight: 2 }, // fim / praça
  { id: "park",     edges: ["B", "B", "B", "B"], weight: 2, park: true },
];

/* ===================== Utilidades aleatórias (determinísticas) =========== */
function hash2(x, y) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}
// PRNG mulberry32: mesma semente -> mesma sequência (peça sempre igual)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===================== Lógica das peças ================================== */
// Gira os lados [N,E,S,W] em sentido horário, `rot` vezes (0..3).
function rotatedEdges(edges, rot) {
  const out = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) out[i] = edges[((i - rot) % 4 + 4) % 4];
  return out;
}
function tileEdges(def, rot) { return rotatedEdges(def.edges, rot); }

// Direções com rua (após rotação)
function roadDirs(def, rot) {
  const e = tileEdges(def, rot);
  const r = [];
  for (let i = 0; i < 4; i++) if (e[i] === "R") r.push(i);
  return r;
}

/* ===================== Desenho procedural de uma peça ==================== */
// Ponto médio de cada lado, em coordenadas locais (0..TILE)
function edgeMidpoint(dir) {
  switch (dir) {
    case N: return [TILE / 2, 0];
    case E: return [TILE, TILE / 2];
    case S: return [TILE / 2, TILE];
    case W: return [0, TILE / 2];
  }
}

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

const ROOF_COLORS = ["#b08968", "#9c6644", "#7f5539", "#a68a64", "#caa472", "#8d6e5c"];
const PARK_GREEN = "#5d8a5a";
const GROUND = "#cfc7b6";   // chão/calçada entre quarteirões
const ROAD_FILL = "#3c424a";
const ROAD_EDGE = "#525a63";

// Renderiza a peça (def, rot) da célula (cx,cy) num canvas próprio (cache).
function renderTileSprite(def, rot, cx, cy) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SPRITE;
  const ctx = cv.getContext("2d");
  const s = SPRITE / TILE;
  ctx.scale(s, s);

  const rng = mulberry32(hash2(cx, cy) ^ (def.id.length * 2654435761));

  // 1) Base de chão
  ctx.fillStyle = def.park ? PARK_GREEN : GROUND;
  ctx.fillRect(0, 0, TILE, TILE);

  const dirs = roadDirs(def, rot);

  // 2) Nó central das ruas, com leve deslocamento -> ruas curvam = organicidade
  const hub = [TILE / 2 + (rng() - 0.5) * 22, TILE / 2 + (rng() - 0.5) * 22];

  // Monta os segmentos (centerlines) das ruas como curvas quadráticas.
  const segs = []; // {a:[x,y], c:[x,y], b:[x,y]} a=início, c=controle, b=fim
  if (dirs.length === 2 && (dirs[0] + 2) % 4 === dirs[1]) {
    // Rua reta: uma curva suave de um lado ao outro (com barriga aleatória)
    const a = edgeMidpoint(dirs[0]), b = edgeMidpoint(dirs[1]);
    const c = [(a[0] + b[0]) / 2 + (rng() - 0.5) * 30, (a[1] + b[1]) / 2 + (rng() - 0.5) * 30];
    segs.push({ a, c, b });
  } else {
    // Junções, curvas e fins: cada rua vai do lado até o nó central
    for (const d of dirs) {
      const a = edgeMidpoint(d);
      const c = [(a[0] + hub[0]) / 2 + (rng() - 0.5) * 18, (a[1] + hub[1]) / 2 + (rng() - 0.5) * 18];
      segs.push({ a, c, b: hub });
    }
  }

  // 3) Quarteirões: espalha lotes evitando as ruas. Como as ruas curvam,
  //    os quarteirões saem com formato irregular -> aspecto orgânico.
  if (!def.park) {
    const step = 13;
    for (let gx = step / 2; gx < TILE; gx += step) {
      for (let gy = step / 2; gy < TILE; gy += step) {
        const jx = gx + (rng() - 0.5) * 6;
        const jy = gy + (rng() - 0.5) * 6;
        let near = Infinity;
        for (const sg of segs) near = Math.min(near, segDistApprox(jx, jy, sg));
        if (near < ROAD_W / 2 + 6) continue;        // muito perto da rua
        if (jx < 4 || jy < 4 || jx > TILE - 4 || jy > TILE - 4) continue;
        if (rng() < 0.12) { drawTree(ctx, jx, jy, rng); continue; } // verde solto
        const w = 6 + rng() * 6, h = 6 + rng() * 6;
        ctx.fillStyle = ROOF_COLORS[(rng() * ROOF_COLORS.length) | 0];
        ctx.fillRect(jx - w / 2, jy - h / 2, w, h);
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 0.7;
        ctx.strokeRect(jx - w / 2, jy - h / 2, w, h);
      }
    }
  } else {
    // Parque: várias árvores
    for (let i = 0; i < 16; i++) drawTree(ctx, 10 + rng() * 80, 10 + rng() * 80, rng);
  }

  // 4) Ruas por cima (asfalto + meio-fio)
  for (const sg of segs) {
    strokeSeg(ctx, sg, ROAD_W + 4, ROAD_EDGE);
  }
  for (const sg of segs) {
    strokeSeg(ctx, sg, ROAD_W, ROAD_FILL);
  }

  // 5) Detalhes de junção: praça/rotatória
  if (def.roundabout) {
    ctx.fillStyle = ROAD_FILL;
    ctx.beginPath(); ctx.arc(hub[0], hub[1], 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PARK_GREEN;
    ctx.beginPath(); ctx.arc(hub[0], hub[1], 9, 0, Math.PI * 2); ctx.fill();
  } else if (dirs.length >= 3) {
    ctx.fillStyle = ROAD_FILL;
    ctx.beginPath(); ctx.arc(hub[0], hub[1], ROAD_W * 0.6, 0, Math.PI * 2); ctx.fill();
  } else if (dirs.length === 1) {
    // cul-de-sac
    ctx.fillStyle = ROAD_FILL;
    ctx.beginPath(); ctx.arc(hub[0], hub[1], ROAD_W * 0.7, 0, Math.PI * 2); ctx.fill();
  }

  return cv;
}

function segDistApprox(px, py, sg) {
  // aproxima a curva quadrática por 3 retas para o teste de distância
  let prev = sg.a, best = Infinity;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3;
    const x = (1 - t) * (1 - t) * sg.a[0] + 2 * (1 - t) * t * sg.c[0] + t * t * sg.b[0];
    const y = (1 - t) * (1 - t) * sg.a[1] + 2 * (1 - t) * t * sg.c[1] + t * t * sg.b[1];
    best = Math.min(best, distToSeg(px, py, prev[0], prev[1], x, y));
    prev = [x, y];
  }
  return best;
}

function strokeSeg(ctx, sg, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(sg.a[0], sg.a[1]);
  ctx.quadraticCurveTo(sg.c[0], sg.c[1], sg.b[0], sg.b[1]);
  ctx.stroke();
}

function drawTree(ctx, x, y, rng) {
  ctx.fillStyle = rng() < 0.5 ? "#4f7d4c" : "#5d8a5a";
  ctx.beginPath();
  ctx.arc(x, y, 3 + rng() * 2, 0, Math.PI * 2);
  ctx.fill();
}

/* ===================== Estado do jogo =================================== */
const board = new Map();   // "x,y" -> { def, rot, sprite }
const camera = { x: 0, y: 0, scale: 2.2 }; // x,y = canto sup-esq em px de tela

let deck = [];             // fila de peças futuras (índices em TILE_DEFS)
let current = null;        // { defIndex, rot }
let skips = SKIP_MAX;
let placed = 0;
let score = 0;
let hover = null;          // { cx, cy, valid }

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const elScore = document.getElementById("score");
const elPlaced = document.getElementById("placed");
const elSkips = document.getElementById("skips");

function key(x, y) { return x + "," + y; }

/* ---- Baralho (saco aleatório ponderado) ---- */
function drawTileIndex() {
  let total = 0;
  for (const d of TILE_DEFS) total += d.weight;
  let r = Math.random() * total;
  for (let i = 0; i < TILE_DEFS.length; i++) {
    r -= TILE_DEFS[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}
function refillDeck() {
  while (deck.length < 4) deck.push(drawTileIndex());
}
function nextTile() {
  refillDeck();
  current = { defIndex: deck.shift(), rot: 0 };
  refillDeck();
  updateHud();
}

/* ---- Validação de encaixe ---- */
function canPlace(cx, cy, defIndex, rot) {
  if (board.has(key(cx, cy))) return false;
  if (board.size === 0) return cx === 0 && cy === 0; // primeira peça na origem

  const e = tileEdges(TILE_DEFS[defIndex], rot);
  let touches = false;
  for (let d = 0; d < 4; d++) {
    const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
    const nb = board.get(key(nx, ny));
    if (!nb) continue;
    touches = true;
    const nbEdges = tileEdges(nb.def, nb.rot);
    if (nbEdges[(d + 2) % 4] !== e[d]) return false; // tipos não batem
  }
  return touches;
}

function placeTile(cx, cy) {
  if (!current || !canPlace(cx, cy, current.defIndex, current.rot)) return;
  const def = TILE_DEFS[current.defIndex];
  const sprite = renderTileSprite(def, current.rot, cx, cy);
  board.set(key(cx, cy), { def, rot: current.rot, sprite });

  // pontuação: +1 pela peça, +2 por cada lado de rua conectado a vizinho
  let pts = 1;
  const e = tileEdges(def, current.rot);
  for (let d = 0; d < 4; d++) {
    const nb = board.get(key(cx + DIRS[d][0], cy + DIRS[d][1]));
    if (nb && e[d] === "R") pts += 2;
  }
  score += pts;
  placed++;
  nextTile();
}

/* ===================== Câmera / coordenadas ============================= */
function worldToScreen(cx, cy) {
  return [camera.x + cx * TILE * camera.scale, camera.y + cy * TILE * camera.scale];
}
function screenToCell(sx, sy) {
  const wx = (sx - camera.x) / (TILE * camera.scale);
  const wy = (sy - camera.y) / (TILE * camera.scale);
  return [Math.floor(wx), Math.floor(wy)];
}

/* ===================== Render principal ================================= */
function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function render() {
  const w = window.innerWidth, h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#1d2228";
  ctx.fillRect(0, 0, w, h);

  const size = TILE * camera.scale;

  // peças colocadas
  for (const [k, t] of board) {
    const [cx, cy] = k.split(",").map(Number);
    const [sx, sy] = worldToScreen(cx, cy);
    if (sx > w || sy > h || sx + size < 0 || sy + size < 0) continue;
    ctx.drawImage(t.sprite, sx, sy, size, size);
  }

  // fantasma da peça atual sob o cursor
  if (hover && current) {
    const [sx, sy] = worldToScreen(hover.cx, hover.cy);
    const def = TILE_DEFS[current.defIndex];
    const sprite = renderTileSprite(def, current.rot, hover.cx, hover.cy);
    ctx.globalAlpha = 0.7;
    ctx.drawImage(sprite, sx, sy, size, size);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = hover.valid ? "#6fc28b" : "#d9694f";
    ctx.strokeRect(sx + 1.5, sy + 1.5, size - 3, size - 3);
  }

  requestAnimationFrame(render);
}

/* ===================== HUD (mão de peças) =============================== */
function paintPreview(cv, defIndex, rot) {
  const c = cv.getContext("2d");
  c.clearRect(0, 0, cv.width, cv.height);
  const sprite = renderTileSprite(TILE_DEFS[defIndex], rot, defIndex + 7, 999);
  c.drawImage(sprite, 0, 0, cv.width, cv.height);
}
function updateHud() {
  if (current) paintPreview(document.getElementById("current"), current.defIndex, current.rot);
  const q = document.getElementById("queue");
  q.innerHTML = "";
  for (let i = 0; i < 3 && i < deck.length; i++) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 56;
    paintPreview(cv, deck[i], 0);
    q.appendChild(cv);
  }
  elScore.textContent = score;
  elPlaced.textContent = placed;
  elSkips.textContent = skips;
}

/* ===================== Entrada (mouse/teclado) ========================== */
let panning = false, spaceDown = false, lastX = 0, lastY = 0;

canvas.addEventListener("mousemove", (ev) => {
  if (panning) {
    camera.x += ev.clientX - lastX;
    camera.y += ev.clientY - lastY;
    lastX = ev.clientX; lastY = ev.clientY;
    return;
  }
  const [cx, cy] = screenToCell(ev.clientX, ev.clientY);
  hover = { cx, cy, valid: current ? canPlace(cx, cy, current.defIndex, current.rot) : false };
});

canvas.addEventListener("mousedown", (ev) => {
  if (ev.button === 2 || ev.button === 1 || (ev.button === 0 && spaceDown)) {
    panning = true; lastX = ev.clientX; lastY = ev.clientY;
    canvas.style.cursor = "grabbing";
    ev.preventDefault();
    return;
  }
  if (ev.button === 0) {
    const [cx, cy] = screenToCell(ev.clientX, ev.clientY);
    placeTile(cx, cy);
  }
});

window.addEventListener("mouseup", () => {
  panning = false;
  canvas.style.cursor = "crosshair";
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const factor = ev.deltaY < 0 ? 1.1 : 1 / 1.1;
  const ns = Math.max(0.6, Math.min(6, camera.scale * factor));
  // zoom em torno do cursor
  const wx = (ev.clientX - camera.x), wy = (ev.clientY - camera.y);
  camera.x = ev.clientX - wx * (ns / camera.scale);
  camera.y = ev.clientY - wy * (ns / camera.scale);
  camera.scale = ns;
}, { passive: false });

window.addEventListener("keydown", (ev) => {
  if (ev.code === "Space") { spaceDown = true; ev.preventDefault(); }
  if (ev.key === "r" || ev.key === "R") {
    if (current) { current.rot = (current.rot + 1) % 4; updateHud();
      if (hover) hover.valid = canPlace(hover.cx, hover.cy, current.defIndex, current.rot); }
  }
  if (ev.key === "d" || ev.key === "D") doSkip();
});
window.addEventListener("keyup", (ev) => { if (ev.code === "Space") spaceDown = false; });

function doSkip() {
  if (skips <= 0 || !current) return;
  skips--;
  nextTile();
}

document.getElementById("rotate").onclick = () => {
  if (current) { current.rot = (current.rot + 1) % 4; updateHud(); }
};
document.getElementById("skip").onclick = doSkip;

/* ===================== Início ========================================== */
function start() {
  resize();
  refillDeck();
  nextTile();
  // centraliza a câmera na origem
  camera.x = (window.innerWidth - 240) / 2 - TILE * camera.scale / 2;
  camera.y = window.innerHeight / 2 - TILE * camera.scale / 2;
  render();
}
window.addEventListener("resize", resize);
start();
