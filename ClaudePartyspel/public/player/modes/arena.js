// ── PLAYER RENDERER: ARENA ───────────────────────────────────────────────────
// Registers window.PartyModes.arena. Called on every MODE_STATE for this mode.
//
//   render(msg, api)
//     msg = { modeId, view, data }
//        view: 'room' | 'answer' | 'waiting' | 'pick' | 'result'
//     api = { root, clear(), send(action, data), me(), characters() }

(function () {
  'use strict';
  window.PartyModes = window.PartyModes || {};

  const esc = window.cpEscapeHtml || ((s) => String(s));
  const AV = window.CharacterAvatar;
  const LETTERS = ['A', 'B', 'C', 'D'];

  let countdown = null;
  function clearCountdown() {
    if (countdown) {
      clearInterval(countdown);
      countdown = null;
    }
  }

  function emptyAvatar(size) {
    return (
      `<span class="char-avatar char-avatar-empty" ` +
      `style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px">?</span>`
    );
  }

  function golfBoard(standings, youId) {
    return (
      '<div class="golf-board"><h4>Ställning &mdash; lägst vinner</h4>' +
      '<ol class="golf-list">' +
      standings
        .map(
          (s, i) =>
            `<li class="${i === 0 ? 'leader' : ''} ${s.id === youId ? 'me' : ''}">` +
            `<span class="pos">${i + 1}</span>` +
            `<span class="who">${esc(s.name)}</span>` +
            `<span class="pts">${s.score}</span></li>`
        )
        .join('') +
      '</ol><p class="golf-hint">&#9660; Lågt är bra</p></div>'
    );
  }

  window.PartyModes.arena = {
    render(msg, api) {
      clearCountdown();
      const { view, data } = msg;
      const root = api.root;

      if (view === 'room') {
        root.innerHTML =
          '<h2>Rummet</h2>' +
          `<p class="muted">Runda-värde: <strong>${data.roundValue}</strong>. ` +
          'Vänta på att värden startar nästa runda…</p>' +
          golfBoard(data.standings, data.you || api.me());
        return;
      }

      if (view === 'waiting') {
        root.innerHTML =
          `<h2>${esc(data.chosenName || 'Någon')} svarar…</h2>` +
          `<p class="muted">Runda-värde: ${data.roundValue}</p>` +
          '<div class="spinner"></div>';
        return;
      }

      if (view === 'answer') {
        root.innerHTML =
          `<p class="quiz-progress">Din tur! Runda-värde: ${data.roundValue}</p>` +
          `<h2>${esc(data.question.q)}</h2>` +
          `<div id="cd" class="countdown small">${data.answerSeconds}</div>`;

        data.question.options.forEach((opt, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'quiz-option big-btn';
          b.innerHTML = `<span class="letter">${LETTERS[i]}</span> ${esc(opt)}`;
          b.addEventListener('click', () => {
            api.send('answer', { choice: i });
            root.querySelectorAll('button').forEach((x) => (x.disabled = true));
            b.classList.add('picked');
          });
          root.appendChild(b);
        });

        let left = data.answerSeconds;
        const el = root.querySelector('#cd');
        countdown = setInterval(() => {
          left -= 1;
          if (left <= 0) {
            clearCountdown();
            if (el) el.textContent = '0';
            return;
          }
          if (el) {
            el.textContent = String(left);
            el.classList.toggle('urgent', left <= 5);
          }
        }, 1000);
        return;
      }

      if (view === 'pick') {
        root.innerHTML =
          '<h2 class="good">Rätt!</h2>' +
          `<p>Peka ut vem som får <strong>${data.roundValue}</strong> straffpoäng:</p>` +
          '<div class="pick-grid"></div>';
        const grid = root.querySelector('.pick-grid');
        const roster = api.characters() || [];

        data.candidates.forEach((cand) => {
          const ch = roster.find((c) => c.id === cand.characterId);
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'pick-tile';
          b.innerHTML =
            (ch ? AV.html(ch, { size: 64 }) : emptyAvatar(64)) +
            `<span class="char-name">${esc(cand.name)}</span>`;
          b.addEventListener('click', () => {
            api.send('award', { targetId: cand.id });
            grid.querySelectorAll('button').forEach((x) => (x.disabled = true));
            b.classList.add('selected');
          });
          grid.appendChild(b);
        });
        return;
      }

      if (view === 'result') {
        const celebrate = data.kind === 'celebrate';
        const text = (celebrate ? "Let's go, " : 'You suck, ') + esc(data.name) + '!';
        root.innerHTML =
          `<div class="arena-result ${celebrate ? 'celebrate' : 'miss'}">` +
          `<div class="result-burst">${celebrate ? '🎉' : '💥'}</div>` +
          `<h1 class="result-text">${text}</h1>` +
          '</div>' +
          golfBoard(data.standings, api.me());
        return;
      }
    },
  };
})();
