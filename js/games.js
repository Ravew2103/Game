/* ============ Casa Segura — jogos ============ */

/* ---------- Jogo 1: Emergência em Casa (decisão contra o tempo) ---------- */
function startEmergencyGame(container) {
  const scenarios = shuffle(EMERGENCY_SCENARIOS);
  const TIME_LIMIT = 15; // segundos por cenário
  let index = 0;
  let score = 0;
  let timerId = null;

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function renderScenario() {
    const sc = scenarios[index];
    const opts = shuffle(sc.options.map((text, i) => ({ text, correct: i === sc.answer })));
    let remaining = TIME_LIMIT * 10; // décimos de segundo

    container.innerHTML = `
      <div class="quiz-box">
        <div class="quiz-progress">
          <span>Cenário ${index + 1} de ${scenarios.length}</span>
          <span>Acertos: ${score}</span>
        </div>
        <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
        <span class="scenario-tag">${sc.tag} — Emergência!</span>
        <h2 class="quiz-question">${sc.situation}</h2>
        <div class="quiz-options">
          ${opts.map((o, i) => `
            <button class="quiz-opt" data-i="${i}">
              <span class="opt-letter">${LETTERS[i]}</span>
              <span>${o.text}</span>
            </button>`).join("")}
        </div>
        <div class="quiz-feedback"></div>
      </div>`;

    const fill = document.getElementById("timer-fill");
    timerId = setInterval(() => {
      if (!fill.isConnected) { stopTimer(); return; } // usuário saiu da página
      remaining -= 1;
      const pct = (remaining / (TIME_LIMIT * 10)) * 100;
      fill.style.width = pct + "%";
      if (pct < 30) fill.classList.add("low");
      if (remaining <= 0) {
        stopTimer();
        timeout(sc, opts);
      }
    }, 100);

    container.querySelectorAll(".quiz-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        stopTimer();
        answer(sc, opts, parseInt(btn.dataset.i, 10));
      });
    });
  }

  function revealAnswers(opts, chosen) {
    container.querySelectorAll(".quiz-opt").forEach((btn, i) => {
      btn.disabled = true;
      if (opts[i].correct) btn.classList.add("correct");
      else if (i === chosen) btn.classList.add("wrong");
    });
  }

  function showNext(sc, headline) {
    const fb = container.querySelector(".quiz-feedback");
    fb.innerHTML = `
      <div class="quiz-explain">
        <strong>${headline}</strong>
        ${sc.explain}
      </div>
      <div class="quiz-next">
        <button class="btn btn-primary" id="em-next">
          ${index + 1 < scenarios.length ? "Próximo cenário →" : "Ver resultado 🏁"}
        </button>
      </div>`;
    document.getElementById("em-next").addEventListener("click", () => {
      index += 1;
      if (index < scenarios.length) renderScenario();
      else finish();
    });
  }

  function answer(sc, opts, chosen) {
    const correct = opts[chosen].correct;
    if (correct) score += 1;
    revealAnswers(opts, chosen);
    showNext(sc, correct ? "✅ Boa decisão!" : "❌ Decisão perigosa.");
  }

  function timeout(sc, opts) {
    revealAnswers(opts, -1);
    showNext(sc, "⏰ O tempo acabou! Em emergências reais, hesitar também custa caro.");
  }

  function finish() {
    stopTimer();
    recordEmergencyResult(score);
    const total = scenarios.length;
    const pct = Math.round((score / total) * 100);
    const emoji = pct === 100 ? "🦸" : pct >= 80 ? "🚨" : pct >= 60 ? "👍" : "📚";
    container.innerHTML = `
      <div class="quiz-box quiz-result">
        <div class="big-emoji">${emoji}</div>
        <h2>${score} de ${total} decisões corretas</h2>
        <p class="score-line">
          ${pct >= 80 ? "Sua casa está em boas mãos numa emergência!" :
            pct >= 60 ? "Bom instinto — revise os cenários errados, eles salvam vidas." :
            "Vale refazer: saber reagir sob pressão é o que diferencia susto de tragédia."}
          <br>Recorde pessoal: <strong>${STATE.emergencyBest} acertos</strong>
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="em-retry">🔄 Jogar de novo</button>
          <a class="btn btn-ghost" href="#/jogos">← Outros jogos</a>
        </div>
      </div>`;
    document.getElementById("em-retry").addEventListener("click", () => startEmergencyGame(container));
  }

  renderScenario();
}

/* ---------- Jogo 2: Ferramenta Certa (parear ferramenta ↔ tarefa) ---------- */
function startMatchGame(container) {
  const PAIRS = 8; // pares por partida
  const chosen = shuffle(TOOL_PAIRS).slice(0, PAIRS);

  const cards = shuffle([
    ...chosen.map((p, i) => ({ pair: i, kind: "tool", label: p.tool })),
    ...chosen.map((p, i) => ({ pair: i, kind: "task", label: p.task }))
  ]);

  let selected = null; // índice da carta selecionada
  let matched = 0;
  let attempts = 0;
  let seconds = 0;
  let clockId = null;
  let locked = false;

  container.innerHTML = `
    <div class="quiz-box" style="max-width:900px">
      <h2 style="margin-bottom:.3rem">🧰 Ferramenta Certa</h2>
      <p style="color:var(--text-muted);font-size:.9rem">
        Clique em uma <strong>ferramenta</strong> e depois na <strong>tarefa</strong> correspondente (ou vice-versa). Forme todos os ${PAIRS} pares!
      </p>
      <div class="match-hud">
        <span>⏱️ <strong id="match-clock">0s</strong></span>
        <span>🎯 Pares: <strong id="match-count">0/${PAIRS}</strong></span>
        <span>🔁 Tentativas: <strong id="match-tries">0</strong></span>
      </div>
      <div class="match-board" id="match-board">
        ${cards.map((c, i) => `
          <button class="match-card" data-i="${i}">
            ${c.kind === "tool"
              ? `<span class="match-emoji">${c.label.split(" ")[0]}</span><span>${c.label.split(" ").slice(1).join(" ")}</span>`
              : `<span>${c.label}</span>`}
          </button>`).join("")}
      </div>
    </div>`;

  const board = document.getElementById("match-board");
  const els = Array.from(board.querySelectorAll(".match-card"));

  clockId = setInterval(() => {
    seconds += 1;
    const clock = document.getElementById("match-clock");
    if (clock) clock.textContent = seconds + "s";
    else clearInterval(clockId); // usuário saiu da página
  }, 1000);

  els.forEach((el, i) => el.addEventListener("click", () => pick(i)));

  function pick(i) {
    if (locked) return;
    const card = cards[i];
    const el = els[i];
    if (el.classList.contains("matched")) return;

    if (selected === null) {
      selected = i;
      el.classList.add("selected");
      return;
    }
    if (selected === i) {
      el.classList.remove("selected");
      selected = null;
      return;
    }

    const prev = cards[selected];
    const prevEl = els[selected];
    attempts += 1;
    document.getElementById("match-tries").textContent = attempts;

    // par válido = mesmo índice de par e tipos diferentes (ferramenta + tarefa)
    if (card.pair === prev.pair && card.kind !== prev.kind) {
      el.classList.add("matched");
      prevEl.classList.remove("selected");
      prevEl.classList.add("matched");
      matched += 1;
      document.getElementById("match-count").textContent = matched + "/" + PAIRS;
      selected = null;
      if (matched === PAIRS) finish();
    } else {
      locked = true;
      el.classList.add("selected", "shake");
      prevEl.classList.add("shake");
      setTimeout(() => {
        el.classList.remove("selected", "shake");
        prevEl.classList.remove("selected", "shake");
        selected = null;
        locked = false;
      }, 450);
    }
  }

  function finish() {
    clearInterval(clockId);
    recordMatchResult(seconds);
    const perfect = attempts === PAIRS;
    container.innerHTML = `
      <div class="quiz-box quiz-result">
        <div class="big-emoji">${perfect ? "🏆" : "🧰"}</div>
        <h2>Todos os ${PAIRS} pares em ${seconds}s!</h2>
        <p class="score-line">
          ${perfect ? "Sem nenhum erro — você conhece suas ferramentas!" : `Você usou ${attempts} tentativas.`}
          <br>Melhor tempo: <strong>${STATE.matchBestTime}s</strong>
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="match-retry">🔄 Jogar de novo</button>
          <a class="btn btn-ghost" href="#/jogos">← Outros jogos</a>
        </div>
      </div>`;
    document.getElementById("match-retry").addEventListener("click", () => startMatchGame(container));
  }
}
