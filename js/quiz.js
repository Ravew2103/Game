/* ============ Casa Segura — motor de quiz ============ */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D"];

function startQuiz(mod, container) {
  // Embaralha perguntas e a ordem das opções (guardando o índice da correta)
  const questions = shuffle(mod.quiz).map(q => {
    const opts = q.options.map((text, i) => ({ text, correct: i === q.answer }));
    return { q: q.q, explain: q.explain, options: shuffle(opts) };
  });

  let index = 0;
  let score = 0;

  function renderQuestion() {
    const item = questions[index];
    container.innerHTML = `
      <div class="quiz-box">
        <div class="quiz-progress">
          <span>Pergunta ${index + 1} de ${questions.length}</span>
          <span>Acertos: ${score}</span>
        </div>
        <div class="quiz-track"><div class="quiz-track-fill" style="width:${(index / questions.length) * 100}%"></div></div>
        <h2 class="quiz-question">${item.q}</h2>
        <div class="quiz-options">
          ${item.options.map((o, i) => `
            <button class="quiz-opt" data-i="${i}">
              <span class="opt-letter">${LETTERS[i]}</span>
              <span>${o.text}</span>
            </button>`).join("")}
        </div>
        <div class="quiz-feedback"></div>
      </div>`;

    container.querySelectorAll(".quiz-opt").forEach(btn => {
      btn.addEventListener("click", () => answer(parseInt(btn.dataset.i, 10)));
    });
  }

  function answer(chosen) {
    const item = questions[index];
    const correct = item.options[chosen].correct;
    if (correct) score += 1;

    container.querySelectorAll(".quiz-opt").forEach((btn, i) => {
      btn.disabled = true;
      if (item.options[i].correct) btn.classList.add("correct");
      else if (i === chosen) btn.classList.add("wrong");
    });

    const fb = container.querySelector(".quiz-feedback");
    fb.innerHTML = `
      <div class="quiz-explain">
        <strong>${correct ? "✅ Correto!" : "❌ Não foi dessa vez."}</strong>
        ${item.explain}
      </div>
      <div class="quiz-next">
        <button class="btn btn-primary" id="quiz-next-btn">
          ${index + 1 < questions.length ? "Próxima →" : "Ver resultado 🏁"}
        </button>
      </div>`;

    document.getElementById("quiz-next-btn").addEventListener("click", () => {
      index += 1;
      if (index < questions.length) renderQuestion();
      else finish();
    });
  }

  function finish() {
    recordQuizResult(mod.id, score, questions.length);
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚";
    const msg =
      pct === 100 ? "Perfeito! Você domina este assunto." :
      pct >= 80 ? "Excelente! Quase tudo na ponta da língua." :
      pct >= 60 ? "Bom resultado! Revise os guias para fechar as lacunas." :
      "Vale revisar os guias do módulo e tentar de novo — a prática leva à perfeição.";

    container.innerHTML = `
      <div class="quiz-box quiz-result">
        <div class="big-emoji">${emoji}</div>
        <h2>${score} de ${questions.length} (${pct}%)</h2>
        <p class="score-line">${msg}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="quiz-retry">🔄 Tentar novamente</button>
          <a class="btn btn-ghost" href="#/modulo/${mod.id}">← Voltar ao módulo</a>
        </div>
      </div>`;
    document.getElementById("quiz-retry").addEventListener("click", () => startQuiz(mod, container));
  }

  renderQuestion();
}
