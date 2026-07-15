/* ============ Casa Segura — roteador e páginas ============ */

const app = document.getElementById("app");

const DIFFICULTY = {
  easy: { label: "Fácil", cls: "badge-easy" },
  medium: { label: "Médio", cls: "badge-medium" },
  hard: { label: "Avançado", cls: "badge-hard" }
};

/* ---------- Páginas ---------- */

function renderHome() {
  const totalGuides = MODULES.reduce((n, m) => n + m.guides.length, 0);
  const totalQuestions = MODULES.reduce((n, m) => n + m.quiz.length, 0);
  const doneGuides = Object.keys(STATE.guidesDone).length;

  app.innerHTML = `
    <section class="hero">
      <h1>Aprenda a cuidar da sua casa,<br><span>com segurança e confiança</span></h1>
      <p>Guias visuais de elétrica, gás, encanamento, carpintaria, marcenaria, limpeza e manutenção — com quizzes e jogos para fixar o que importa de verdade.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#/modulos">📚 Explorar módulos</a>
        <a class="btn btn-ghost" href="#/jogos">🎮 Ir para os jogos</a>
      </div>
      <div class="stats-row">
        <div class="stat-tile"><div class="num">${MODULES.length}</div><div class="lbl">módulos</div></div>
        <div class="stat-tile"><div class="num">${totalGuides}</div><div class="lbl">guias práticos</div></div>
        <div class="stat-tile"><div class="num">${totalQuestions}</div><div class="lbl">perguntas de quiz</div></div>
        <div class="stat-tile"><div class="num">${doneGuides}</div><div class="lbl">guias concluídos por você</div></div>
      </div>
    </section>

    <h2 class="section-title">🧭 Comece por onde quiser</h2>
    <div class="grid">${MODULES.map(moduleCardHTML).join("")}</div>

    <h2 class="section-title">🎮 Aprenda jogando</h2>
    <p class="section-sub">Testar-se sob pressão é a melhor forma de gravar o que fazer numa emergência de verdade.</p>
    <div class="grid">
      ${gameCardHTML("🚨", "Emergência em Casa", "12 cenários reais, 15 segundos para decidir. Você faria a escolha certa?", "#/jogo/emergencia", STATE.emergencyBest ? `Recorde: ${STATE.emergencyBest} acertos` : "")}
      ${gameCardHTML("🧰", "Ferramenta Certa", "Pareie cada ferramenta com sua função contra o relógio.", "#/jogo/pares", STATE.matchBestTime !== null ? `Melhor tempo: ${STATE.matchBestTime}s` : "")}
    </div>`;
}

function moduleCardHTML(mod) {
  const prog = moduleProgress(mod);
  return `
    <a class="module-card" href="#/modulo/${mod.id}" style="--mc:${mod.color}">
      <div class="module-icon">${mod.icon}</div>
      <h3>${mod.name}</h3>
      <p>${mod.description}</p>
      <div class="module-progress">
        <div class="pbar"><div class="pbar-fill" style="width:${prog.pct}%"></div></div>
        <span>${prog.done}/${prog.total}</span>
        ${isModuleMaster(mod) ? "🎓" : ""}
      </div>
    </a>`;
}

function gameCardHTML(emoji, title, desc, href, best) {
  return `
    <div class="game-card">
      <div class="game-emoji">${emoji}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
      ${best ? `<div class="game-best">🏅 ${best}</div>` : ""}
      <a class="btn btn-primary btn-sm" href="${href}">Jogar agora</a>
    </div>`;
}

function renderModules() {
  app.innerHTML = `
    <h2 class="section-title">📚 Módulos de conhecimento</h2>
    <p class="section-sub">Cada módulo tem guias passo a passo e um quiz. Complete tudo para virar especialista 🎓.</p>
    <div class="grid">${MODULES.map(moduleCardHTML).join("")}</div>`;
}

function renderModule(moduleId) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) { renderNotFound(); return; }
  const prog = moduleProgress(mod);
  const best = STATE.quizBest[mod.id];

  app.innerHTML = `
    <a class="back-link" href="#/modulos">← Todos os módulos</a>
    <div class="module-header" style="--mc:${mod.color}">
      <div class="module-icon">${mod.icon}</div>
      <div style="flex:1;min-width:220px">
        <h1>${mod.name} ${isModuleMaster(mod) ? "🎓" : ""}</h1>
        <p>${mod.description}</p>
      </div>
      <div style="min-width:150px">
        <div class="module-progress">
          <div class="pbar"><div class="pbar-fill" style="width:${prog.pct}%"></div></div>
          <span>${prog.pct}%</span>
        </div>
        <a class="btn btn-primary btn-sm" style="margin-top:.6rem" href="#/quiz/${mod.id}">
          🧠 Fazer o quiz${best !== undefined ? ` (melhor: ${best}/${mod.quiz.length})` : ""}
        </a>
      </div>
    </div>

    <h2 class="section-title">📖 Guias práticos</h2>
    <div id="guides" style="--mc:${mod.color}">
      ${mod.guides.map(g => guideHTML(mod, g)).join("")}
    </div>`;

  // interações do acordeão + botão de conclusão
  mod.guides.forEach(g => {
    const guideEl = document.getElementById("guide-" + g.id);
    guideEl.querySelector(".guide-head").addEventListener("click", () => {
      guideEl.classList.toggle("open");
    });
    guideEl.querySelector(".guide-done-btn").addEventListener("click", () => {
      toggleGuideDone(mod.id, g.id);
      renderModule(moduleId); // re-render para atualizar marcadores
      document.getElementById("guide-" + g.id).classList.add("open");
    });
  });
}

function guideHTML(mod, g) {
  const done = isGuideDone(mod.id, g.id);
  const dif = DIFFICULTY[g.difficulty] || DIFFICULTY.easy;
  return `
    <div class="guide" id="guide-${g.id}">
      <button class="guide-head" type="button">
        <span class="chev">▶</span>
        <h3>${g.title}</h3>
        <span class="badge ${dif.cls}">${dif.label}</span>
        <span class="badge badge-time">⏱ ${g.time}</span>
        ${done ? '<span class="guide-done-mark">✔</span>' : ""}
      </button>
      <div class="guide-body">
        ${g.warning ? `<div class="callout callout-danger"><span>⚠️</span><div><strong>Segurança primeiro:</strong> ${g.warning}</div></div>` : ""}
        ${g.figure ? `<figure class="figure">${g.figure.svg}<figcaption class="figure-caption">${g.figure.caption}</figcaption></figure>` : ""}
        <strong style="font-size:.85rem">🧰 Você vai precisar de:</strong>
        <div class="tools-list">${g.tools.map(t => `<span>${t}</span>`).join("")}</div>
        <ol class="steps">${g.steps.map(s => `<li>${s}</li>`).join("")}</ol>
        ${g.html || ""}
        ${g.tip ? `<div class="callout callout-tip"><span>💡</span><div><strong>Dica de quem sabe:</strong> ${g.tip}</div></div>` : ""}
        <div class="guide-actions">
          <button class="btn ${done ? "btn-ghost" : "btn-primary"} btn-sm guide-done-btn" type="button">
            ${done ? "↩ Desmarcar conclusão" : "✔ Marcar como concluído (+20 XP)"}
          </button>
        </div>
      </div>
    </div>`;
}

function renderQuiz(moduleId) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) { renderNotFound(); return; }
  app.innerHTML = `
    <a class="back-link" href="#/modulo/${mod.id}">← Voltar para ${mod.name}</a>
    <h2 class="section-title">${mod.icon} Quiz: ${mod.name}</h2>
    <div id="quiz-container"></div>`;
  startQuiz(mod, document.getElementById("quiz-container"));
}

function renderGames() {
  app.innerHTML = `
    <h2 class="section-title">🎮 Jogos</h2>
    <p class="section-sub">Aprender brincando fixa mais: cada partida vale XP e pode desbloquear conquistas.</p>
    <div class="grid">
      ${gameCardHTML("🚨", "Emergência em Casa", "12 cenários reais, 15 segundos para decidir cada um. Treine o instinto certo para vazamentos, incêndios, choques e mais.", "#/jogo/emergencia", STATE.emergencyBest ? `Recorde: ${STATE.emergencyBest} acertos` : "")}
      ${gameCardHTML("🧰", "Ferramenta Certa", "Um jogo de pares: ligue cada ferramenta à sua função, no menor tempo possível.", "#/jogo/pares", STATE.matchBestTime !== null ? `Melhor tempo: ${STATE.matchBestTime}s` : "")}
      ${gameCardHTML("🧠", "Quizzes por módulo", "Cada módulo tem seu próprio quiz com explicações detalhadas. Gabarite para ganhar bônus!", "#/modulos", "")}
    </div>`;
}

function renderEmergencyGame() {
  app.innerHTML = `
    <a class="back-link" href="#/jogos">← Todos os jogos</a>
    <h2 class="section-title">🚨 Emergência em Casa</h2>
    <p class="section-sub">Você tem <strong>15 segundos</strong> por cenário. Numa emergência real, o relógio também corre.</p>
    <div id="game-container"></div>`;
  startEmergencyGame(document.getElementById("game-container"));
}

function renderMatchGame() {
  app.innerHTML = `
    <a class="back-link" href="#/jogos">← Todos os jogos</a>
    <h2 class="section-title">🧰 Ferramenta Certa</h2>
    <div id="game-container"></div>`;
  startMatchGame(document.getElementById("game-container"));
}

function renderProgress() {
  const info = levelInfo(STATE.xp);
  const doneGuides = Object.keys(STATE.guidesDone).length;
  const totalGuides = MODULES.reduce((n, m) => n + m.guides.length, 0);
  const masters = MODULES.filter(isModuleMaster).length;

  app.innerHTML = `
    <div class="level-card">
      <h2>⭐ Nível ${info.level}</h2>
      <p class="xp-line">${STATE.xp} XP no total — faltam ${info.need - info.current} XP para o nível ${info.level + 1}</p>
      <div class="pbar"><div class="pbar-fill" style="width:${info.pct}%"></div></div>
    </div>

    <h2 class="section-title">📊 Seu panorama</h2>
    <div class="stats-row" style="justify-content:flex-start">
      <div class="stat-tile"><div class="num">${doneGuides}/${totalGuides}</div><div class="lbl">guias concluídos</div></div>
      <div class="stat-tile"><div class="num">${Object.keys(STATE.quizDone).length}/${MODULES.length}</div><div class="lbl">quizzes feitos</div></div>
      <div class="stat-tile"><div class="num">${masters}/${MODULES.length}</div><div class="lbl">módulos dominados 🎓</div></div>
      <div class="stat-tile"><div class="num">${STATE.emergencyBest}</div><div class="lbl">recorde em emergências</div></div>
      <div class="stat-tile"><div class="num">${STATE.matchBestTime !== null ? STATE.matchBestTime + "s" : "—"}</div><div class="lbl">melhor tempo nos pares</div></div>
    </div>

    <h2 class="section-title">🧭 Progresso por módulo</h2>
    <div class="grid">${MODULES.map(moduleCardHTML).join("")}</div>

    <h2 class="section-title">🏅 Conquistas</h2>
    <div class="badges-grid">
      ${BADGES.map(b => `
        <div class="badge-card ${STATE.badges[b.id] ? "" : "locked"}">
          <div class="badge-emoji">${b.emoji}</div>
          <h4>${b.name}</h4>
          <p>${b.desc}</p>
        </div>`).join("")}
    </div>

    <div style="margin-top:2rem;text-align:center">
      <button class="btn btn-ghost btn-sm" id="reset-btn">🗑 Zerar meu progresso</button>
    </div>`;

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Tem certeza? Todo o seu progresso, XP e conquistas serão apagados.")) {
      resetProgress();
      renderProgress();
      toast("Progresso zerado. Recomeçar também é aprender!");
    }
  });
}

function renderNotFound() {
  app.innerHTML = `
    <div class="hero">
      <h1>🔍 Página não encontrada</h1>
      <p>O caminho que você tentou acessar não existe.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="#/">← Voltar ao início</a></div>
    </div>`;
}

/* ---------- Roteador (hash) ---------- */

function setActiveNav(key) {
  document.querySelectorAll("[data-nav]").forEach(a => {
    a.classList.toggle("active", a.dataset.nav === key);
  });
}

function route() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/").filter(Boolean);
  window.scrollTo(0, 0);

  if (parts.length === 0) { setActiveNav("home"); renderHome(); return; }

  switch (parts[0]) {
    case "modulos": setActiveNav("modulos"); renderModules(); break;
    case "modulo": setActiveNav("modulos"); renderModule(parts[1]); break;
    case "quiz": setActiveNav("modulos"); renderQuiz(parts[1]); break;
    case "jogos": setActiveNav("jogos"); renderGames(); break;
    case "jogo":
      setActiveNav("jogos");
      if (parts[1] === "emergencia") renderEmergencyGame();
      else if (parts[1] === "pares") renderMatchGame();
      else renderNotFound();
      break;
    case "progresso": setActiveNav("progresso"); renderProgress(); break;
    default: renderNotFound();
  }
}

window.addEventListener("hashchange", route);
updatePlayerChip();
route();
