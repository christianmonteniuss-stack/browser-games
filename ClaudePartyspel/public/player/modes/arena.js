// ── PLAYER RENDERER: ARENA ───────────────────────────────────────────────────
// Registers window.PartyModes.arena. Called on every MODE_STATE for this mode.
//
//   render(msg, api)
//     msg = { modeId, view, data }
//        view: 'room' | 'moose' | 'answer' | 'waiting' | 'pick' | 'result'
//              | 'choose' | 'choose_done' | 'choose_result'
//              | 'react' (phase wait|go|tapped) | 'react_result'
//     api = { root, clear(), send(action, data), me(), characters() }

(function () {
  'use strict';
  window.PartyModes = window.PartyModes || {};

  const esc = window.cpEscapeHtml || ((s) => String(s));
  const AV = window.CharacterAvatar;
  const LETTERS = ['A', 'B', 'C', 'D'];
  const MOOSE_SOUND_URL = '/assets/sounds/moose.wav';

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

      if (view === 'moose') {
        const intensity = Math.max(1, data.intensity || 1);
        const shake = Math.max(0.06, 0.34 - (intensity - 1) * 0.06).toFixed(2);
        const scale = Math.min(1.8, 1 + (intensity - 1) * 0.15).toFixed(2);
        const vol = Math.min(0.5, 0.15 + (intensity - 1) * 0.08);
        try {
          const a = new Audio(MOOSE_SOUND_URL);
          a.volume = vol;
          a.play().catch(() => {});
        } catch (e) {
          /* ignore */
        }
        root.innerHTML =
          `<div class="moose-overlay small" style="--shake:${shake}s;--scale:${scale}">` +
          '<div class="moose-emoji">🫎</div>' +
          '<h2 class="moose-text">BOOOOSE MOOOOSE</h2>' +
          `<p class="muted">&times;${data.multiplier} den här rundan</p>` +
          '</div>';
        return;
      }

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

      if (view === 'choose') {
        root.innerHTML =
          '<p class="choose-tag">Time to Choose</p>' +
          `<h2>${esc(data.statement)}</h2>` +
          `<div id="cd" class="countdown small">${data.chooseSeconds}</div>` +
          '<p class="muted">Välj den som passar bäst — du får välja dig själv:</p>' +
          '<div class="pick-grid"></div>';

        const grid = root.querySelector('.pick-grid');
        const roster = api.characters() || [];
        data.candidates.forEach((cand) => {
          const ch = roster.find((c) => c.id === cand.characterId);
          const mine = cand.id === api.me();
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'pick-tile';
          b.innerHTML =
            (ch ? AV.html(ch, { size: 64 }) : emptyAvatar(64)) +
            `<span class="char-name">${esc(cand.name)}${mine ? ' (du)' : ''}</span>`;
          b.addEventListener('click', () => {
            api.send('choose', { targetId: cand.id });
            grid.querySelectorAll('button').forEach((x) => (x.disabled = true));
            b.classList.add('selected');
          });
          grid.appendChild(b);
        });

        let left = data.chooseSeconds;
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

      if (view === 'choose_done') {
        root.innerHTML =
          '<h2 class="good">Röst registrerad</h2>' +
          '<p class="muted">Väntar på de andra…</p>' +
          '<div class="spinner"></div>';
        return;
      }

      if (view === 'choose_result') {
        const moose = !!(data.moose && data.moose.active);
        const rows = data.rows
          .map((r) => {
            const av = r.character ? AV.html(r.character, { size: 36 }) : emptyAvatar(36);
            return (
              '<li class="choose-row">' +
              `<span class="cr-av">${av}</span>` +
              `<span class="cr-name">${esc(r.name)}</span>` +
              `<span class="cr-votes">${r.votes}</span>` +
              `<span class="cr-pts">+${r.gained}</span>` +
              '</li>'
            );
          })
          .join('');
        root.innerHTML =
          `<div class="arena-result choose${moose ? ' moose' : ''}">` +
          '<p class="choose-tag">Time to Choose</p>' +
          `<h3>${esc(data.statement)}</h3>` +
          (moose ? `<p class="muted">🫎 &times;${data.moose.multiplier}</p>` : '') +
          `<ul class="choose-tally">${rows}</ul>` +
          '</div>' +
          golfBoard(data.standings, api.me());
        return;
      }

      if (view === 'react') {
        if (data.phase === 'wait') {
          root.innerHTML =
            '<h2 class="react-wait-title">Vänta…</h2>' +
            '<button id="react-btn" class="react-btn big-btn" disabled>TRYCK</button>';
          return;
        }
        if (data.phase === 'go') {
          root.innerHTML =
            '<h2 class="react-go-title good">TRYCK NU!</h2>' +
            '<button id="react-btn" class="react-btn go big-btn">TRYCK!</button>';
          const b = root.querySelector('#react-btn');
          b.addEventListener('click', () => {
            api.send('tap', {});
            b.disabled = true;
            b.textContent = 'Skickat!';
          });
          return;
        }
        if (data.phase === 'tapped') {
          root.innerHTML =
            `<h2 class="good">${data.reactionMs} ms</h2>` +
            '<p class="muted">Väntar på de andra…</p>' +
            '<div class="spinner"></div>';
          return;
        }
        return;
      }

      if (view === 'react_result') {
        const moose = !!(data.moose && data.moose.active);
        const rows = data.rows
          .map((r) => {
            const av = r.character ? AV.html(r.character, { size: 36 }) : emptyAvatar(36);
            const time = r.reactionMs == null ? '—' : `${r.reactionMs} ms`;
            return (
              '<li class="react-row">' +
              `<span class="rr-rank">${r.rank + 1}</span>` +
              `<span class="cr-av">${av}</span>` +
              `<span class="cr-name">${esc(r.name)}</span>` +
              `<span class="rr-time">${time}</span>` +
              `<span class="cr-pts">+${r.gained}</span>` +
              '</li>'
            );
          })
          .join('');
        root.innerHTML =
          `<div class="arena-result choose${moose ? ' moose' : ''}">` +
          '<p class="choose-tag">Reaktionstest</p>' +
          '<h3>Snabbast vinner</h3>' +
          (moose ? `<p class="muted">🫎 &times;${data.moose.multiplier}</p>` : '') +
          `<ul class="choose-tally react-tally">${rows}</ul>` +
          '</div>' +
          golfBoard(data.standings, api.me());
        return;
      }

      if (view === 'result') {
        const celebrate = data.kind === 'celebrate';
        const text = (celebrate ? "Let's go, " : 'You suck, ') + esc(data.name) + '!';
        const moose = !!(data.moose && data.moose.active);
        root.innerHTML =
          `<div class="arena-result ${celebrate ? 'celebrate' : 'miss'}${moose ? ' moose' : ''}">` +
          `<div class="result-burst">${celebrate ? '🎉' : '💥'}${moose ? '🫎' : ''}</div>` +
          `<h1 class="result-text">${text}</h1>` +
          (moose ? `<p class="muted">🫎 &times;${data.moose.multiplier}</p>` : '') +
          '</div>' +
          golfBoard(data.standings, api.me());
        return;
      }
    },
  };
})();
