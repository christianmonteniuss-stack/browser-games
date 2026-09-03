// ── HOST RENDERER: QUIZ ──────────────────────────────────────────────────────
// Registers window.HostModes.quiz. Called on every MODE_STATE for this mode.
//
//   render(msg, api)
//     msg = { modeId, view, data }   view: 'question' | 'reveal' | 'final'
//     api = { root, clear(), send(action, data) }   send -> HOST_ACTION

(function () {
  'use strict';
  window.HostModes = window.HostModes || {};

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const esc = window.cpEscapeHtml || ((s) => String(s));

  window.HostModes.quiz = {
    render(msg, api) {
      const { view, data } = msg;
      if (view === 'question') return renderQuestion(api, data);
      if (view === 'reveal') return renderReveal(api, data);
      if (view === 'final') return renderFinal(api, data);
    },
  };

  function optionCells(data, { showResult }) {
    const maxCount = showResult ? Math.max(1, ...data.counts) : 0;
    return data.options
      .map((opt, i) => {
        let cls = 'quiz-cell';
        let bar = '';
        let count = '';
        if (showResult) {
          cls += i === data.correct ? ' correct' : ' wrong';
          const w = (data.counts[i] / maxCount) * 100;
          bar = `<span class="bar" style="width:${w}%"></span>`;
          count = `<span class="count">${data.counts[i]}</span>`;
        }
        return (
          `<div class="${cls}">` +
          `<span class="letter">${LETTERS[i]}</span>${esc(opt)}${count}${bar}` +
          `</div>`
        );
      })
      .join('');
  }

  function renderQuestion(api, data) {
    api.root.innerHTML =
      `<p class="quiz-progress">Fråga ${data.index + 1} / ${data.total}</p>` +
      `<h2 class="quiz-question">${esc(data.question)}</h2>` +
      `<div class="quiz-grid">${optionCells(data, { showResult: false })}</div>` +
      `<p class="answer-count">${data.answered} / ${data.totalPlayers} har svarat</p>` +
      `<button id="reveal-btn" class="mode-btn">Visa svar</button>`;

    api.root
      .querySelector('#reveal-btn')
      .addEventListener('click', () => api.send('reveal'));
  }

  function renderReveal(api, data) {
    api.root.innerHTML =
      `<p class="quiz-progress">Fråga ${data.index + 1} / ${data.total}</p>` +
      `<h2 class="quiz-question">${esc(data.question)}</h2>` +
      `<div class="quiz-grid">${optionCells(data, { showResult: true })}</div>` +
      `<h3>Ställning</h3>` +
      `<ol class="standings">` +
      data.standings
        .map(
          (s) =>
            `<li><span>${esc(s.name)}</span><span>${s.score}</span></li>`
        )
        .join('') +
      `</ol>` +
      `<button id="next-btn" class="mode-btn">${
        data.hasNext ? 'Nästa fråga' : 'Avsluta'
      }</button>`;

    api.root
      .querySelector('#next-btn')
      .addEventListener('click', () => api.send('next'));
  }

  function renderFinal(api, data) {
    const top = data.standings.slice(0, 3);
    api.root.innerHTML =
      `<h2>Slutresultat</h2>` +
      `<ol class="podium">` +
      top
        .map(
          (s) =>
            `<li><span>${esc(s.name)}</span><span>${s.score}</span></li>`
        )
        .join('') +
      `</ol>` +
      (data.standings.length > 3
        ? `<ol class="standings">` +
          data.standings
            .slice(3)
            .map(
              (s) =>
                `<li><span>${esc(s.name)}</span><span>${s.score}</span></li>`
            )
            .join('') +
          `</ol>`
        : '') +
      `<button id="exit-btn" class="mode-btn">Tillbaka till lobbyn</button>`;

    api.root
      .querySelector('#exit-btn')
      .addEventListener('click', () => api.send('exit'));
  }
})();
