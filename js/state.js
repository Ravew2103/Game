/* ============ Casa Segura — estado e progresso (localStorage) ============ */

const STORAGE_KEY = "casa-segura-v1";

const XP = {
  GUIDE_DONE: 20,
  QUIZ_QUESTION: 10,
  QUIZ_PERFECT_BONUS: 25,
  EMERGENCY_CORRECT: 8,
  MATCH_COMPLETE: 40
};

function defaultState() {
  return {
    xp: 0,
    guidesDone: {},      // { "eletrica/quadro-energia": true }
    quizBest: {},        // { "eletrica": 4 } melhor pontuação por módulo
    quizDone: {},        // { "eletrica": true } quiz já concluído ao menos 1x
    emergencyBest: 0,    // melhor pontuação no jogo de emergências
    matchBestTime: null, // melhor tempo (s) no jogo de pares
    badges: {}           // { "first-guide": true }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

let STATE = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  } catch (e) { /* modo privado / sem storage: segue sem persistir */ }
  updatePlayerChip();
}

/* ---------- XP e níveis ---------- */
// Nível n exige n*100 XP acumulados do nível anterior (100, 200, 300...)
function levelInfo(xp) {
  let level = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = level * 100;
  }
  return { level, current: rest, need, pct: Math.round((rest / need) * 100) };
}

function addXP(amount, reason) {
  if (amount <= 0) return;
  const before = levelInfo(STATE.xp).level;
  STATE.xp += amount;
  const after = levelInfo(STATE.xp).level;
  saveState();
  toast(`+${amount} XP${reason ? " — " + reason : ""}`);
  if (after > before) {
    toast(`🎉 Você subiu para o nível ${after}!`);
    checkBadges();
  }
}

/* ---------- Progresso ---------- */
function guideKey(moduleId, guideId) { return moduleId + "/" + guideId; }

function isGuideDone(moduleId, guideId) {
  return !!STATE.guidesDone[guideKey(moduleId, guideId)];
}

function toggleGuideDone(moduleId, guideId) {
  const key = guideKey(moduleId, guideId);
  if (STATE.guidesDone[key]) {
    delete STATE.guidesDone[key];
    saveState();
  } else {
    STATE.guidesDone[key] = true;
    saveState();
    addXP(XP.GUIDE_DONE, "guia concluído");
    checkBadges();
  }
}

function moduleProgress(mod) {
  const total = mod.guides.length + 1; // guias + quiz
  let done = mod.guides.filter(g => isGuideDone(mod.id, g.id)).length;
  if (STATE.quizDone[mod.id]) done += 1;
  return { done, total, pct: Math.round((done / total) * 100) };
}

function isModuleMaster(mod) {
  return mod.guides.every(g => isGuideDone(mod.id, g.id)) && !!STATE.quizDone[mod.id];
}

function recordQuizResult(moduleId, score, total) {
  const first = !STATE.quizDone[moduleId];
  STATE.quizDone[moduleId] = true;
  STATE.quizBest[moduleId] = Math.max(STATE.quizBest[moduleId] || 0, score);
  saveState();
  addXP(score * XP.QUIZ_QUESTION, "quiz");
  if (score === total) addXP(XP.QUIZ_PERFECT_BONUS, "gabaritou! 💯");
  checkBadges({ quizPerfect: score === total, firstQuiz: first });
}

function recordEmergencyResult(score) {
  STATE.emergencyBest = Math.max(STATE.emergencyBest, score);
  saveState();
  addXP(score * XP.EMERGENCY_CORRECT, "emergências");
  checkBadges();
}

function recordMatchResult(seconds) {
  if (STATE.matchBestTime === null || seconds < STATE.matchBestTime) {
    STATE.matchBestTime = seconds;
  }
  saveState();
  addXP(XP.MATCH_COMPLETE, "pares completos");
  checkBadges();
}

/* ---------- Conquistas ---------- */
function unlockBadge(id) {
  if (STATE.badges[id]) return;
  STATE.badges[id] = true;
  saveState();
  const badge = BADGES.find(b => b.id === id);
  if (badge) toast(`${badge.emoji} Conquista desbloqueada: ${badge.name}!`);
}

function checkBadges(ctx) {
  ctx = ctx || {};
  if (Object.keys(STATE.guidesDone).length > 0) unlockBadge("first-guide");
  if (Object.keys(STATE.quizDone).length > 0) unlockBadge("first-quiz");
  if (ctx.quizPerfect) unlockBadge("quiz-perfect");
  if (MODULES.some(isModuleMaster)) unlockBadge("module-master");
  if (STATE.emergencyBest >= 10) unlockBadge("emergency-hero");
  if (STATE.matchBestTime !== null) unlockBadge("tool-wizard");
  if (MODULES.every(isModuleMaster)) unlockBadge("all-modules");
  if (levelInfo(STATE.xp).level >= 5) unlockBadge("level-5");
}

function resetProgress() {
  STATE = defaultState();
  saveState();
}

/* ---------- UI compartilhada ---------- */
function updatePlayerChip() {
  const info = levelInfo(STATE.xp);
  const lv = document.getElementById("chip-level");
  const xp = document.getElementById("chip-xp");
  const bar = document.getElementById("chip-bar-fill");
  if (lv) lv.textContent = "Nv " + info.level;
  if (xp) xp.textContent = STATE.xp + " XP";
  if (bar) bar.style.width = info.pct + "%";
}

function toast(msg) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 320);
  }, 2600);
}
