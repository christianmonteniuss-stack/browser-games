// ── PLAYER RENDERER: QUIZ ────────────────────────────────────────────────────
// Registers window.PartyModes.quiz. The core (player.js) calls render() every
// time a MODE_STATE message for this mode arrives.
//
//   render(msg, api)
//     msg = { modeId, view, data }   view: 'question' | 'answered' | 'reveal' | 'final'
//     api = { root, clear(), send(action, data), me() }

(function () {
  'use strict';
  window.PartyModes = window.PartyModes || {};

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const esc = window.cpEscapeHtml || ((s) => String(s));

  window.PartyModes.quiz = {
    render(msg, api) {
      const { view, data } = msg;
      if (view === 'question') return renderQuestion(api, data);
      if (view === 'answered') return renderAnswered(api, data);
      if (view === 'reveal') return renderReveal(api, data);
      if (view === 'final') return renderFinal(api, data);
    },
  };

  function renderQuestion(api, data) {
    const root = api.root;
    root.innerHTML =
      `<div class="quiz-q">` +
      `<p class="quiz-progress">Fråga ${data.index + 1} / ${data.total}</p>` +
      `<h2>${esc(data.question)}</h2></div>`;

    data.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-option big-btn';
      b.innerHTML = `<span class="letter">${LETTERS[i]}</span> ${esc(opt)}`;
      b.addEventListener('click', () => {
        api.send('answer', { choice: i });
        root.querySelectorAll('button').forEach((x) => (x.disabled = true));
        b.classList.add('picked');
      });
      root.appendChild(b);
    });
  }

  // Server confirms the answer landed — keep the picked styling, add a note.
  function renderAnswered(api, data) {
    const root = api.root;
    root.querySelectorAll('button').forEach((x) => (x.disabled = true));
    if (!root.querySelector('.quiz-wait')) {
      const p = document.createElement('p');
      p.className = 'quiz-wait';
      p.textContent = 'Svar skickat! Väntar på de andra…';
      root.appendChild(p);
    }
  }

  function renderReveal(api, data) {
    const myId = api.me();
    const mine = data.results[myId];
    const correctText =
      LETTERS[data.correct] + '. ' + data.options[data.correct];

    let verdict;
    if (!mine) verdict = `<h2 class="neutral">Inget svar registrerat</h2>`;
    else if (mine.correct) verdict = `<h2 class="good">Rätt! +${mine.gained}</h2>`;
    else verdict = `<h2 class="bad">Fel den här gången</h2>`;

    const rank = data.standings.findIndex((s) => s.id === myId) + 1;
    const rankLine =
      rank > 0
        ? `<p class="muted">Din plats: ${rank} av ${data.standings.length}</p>`
        : '';

    api.root.innerHTML =
      verdict +
      `<p>Rätt svar: <strong>${esc(correctText)}</strong></p>` +
      rankLine +
      `<p class="quiz-wait">Väntar på nästa fråga…</p>`;
  }

  function renderFinal(api, data) {
    const myId = api.me();
    const rank = data.standings.findIndex((s) => s.id === myId) + 1;
    const me = data.standings.find((s) => s.id === myId);

    api.root.innerHTML =
      `<h2>Klart!</h2>` +
      (rank > 0
        ? `<p class="big-rank">Plats ${rank} av ${data.standings.length}</p>`
        : '') +
      `<p>${me ? me.score : 0} poäng</p>` +
      `<p class="quiz-wait">Väntar i lobbyn…</p>`;
  }
})();
