// ── PLAYER RENDERER: ARENA ───────────────────────────────────────────────────
// Registers window.PartyModes.arena. Called on every MODE_STATE for this mode.
//
//   render(msg, api)
//     msg = { modeId, view, data }
//        view: 'room' | 'moose' | 'answer' | 'waiting' | 'pick' | 'result' | 'final'
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

  // ── the "bounce room" for picking a target after a correct answer ──────────
  // Nameless character figures drift around and bounce off the walls; you tap
  // one to hand it the straffpoäng. Your own figure is in there too.
  let bounceRAF = null;
  function stopBounce() {
    if (bounceRAF) {
      cancelAnimationFrame(bounceRAF);
      bounceRAF = null;
    }
  }
  function startBounce(room, candidates, roster, onPick) {
    stopBounce();
    const SIZE = 58;
    const figs = candidates.map((c) => {
      const ch = roster.find((r) => r.id === c.characterId);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'bounce-fig';
      el.innerHTML = ch ? AV.html(ch, { size: SIZE }) : emptyAvatar(SIZE);
      el.addEventListener('click', () => {
        if (room.dataset.done) return;
        room.dataset.done = '1';
        stopBounce();
        room.querySelectorAll('.bounce-fig').forEach((b) => (b.disabled = true));
        el.classList.add('selected');
        if (navigator.vibrate) navigator.vibrate(30);
        onPick(c.id);
      });
      room.appendChild(el);
      const w = Math.max(1, (room.clientWidth || 320) - SIZE);
      const h = Math.max(1, (room.clientHeight || 320) - SIZE);
      return {
        el,
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (0.9 + Math.random() * 2.1) * (Math.random() < 0.5 ? -1 : 1),
        vy: (0.9 + Math.random() * 2.1) * (Math.random() < 0.5 ? -1 : 1),
      };
    });
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(32, now - last) / 16;
      last = now;
      const maxX = Math.max(1, (room.clientWidth || 320) - SIZE);
      const maxY = Math.max(1, (room.clientHeight || 320) - SIZE);
      for (const s of figs) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x <= 0) {
          s.x = 0;
          s.vx = Math.abs(s.vx);
        } else if (s.x >= maxX) {
          s.x = maxX;
          s.vx = -Math.abs(s.vx);
        }
        if (s.y <= 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy);
        } else if (s.y >= maxY) {
          s.y = maxY;
          s.vy = -Math.abs(s.vy);
        }
        s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
      bounceRAF = requestAnimationFrame(frame);
    }
    bounceRAF = requestAnimationFrame(frame);
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
      stopBounce();
      if (window.SFX) window.SFX.stopLoop();
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
        if (window.SFX) window.SFX.play('moose');
        if (navigator.vibrate) navigator.vibrate([90, 40, 140]);
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
        if (window.SFX) window.SFX.play('correct');
        root.innerHTML =
          '<h2 class="good">Rätt!</h2>' +
          `<p>Klicka på en figur — den får <strong>${data.roundValue}</strong> straffpoäng:</p>` +
          '<p class="muted">Inga namn. Din egen figur är också med — se upp var du klickar!</p>' +
          '<div class="bounce-room" id="bounce-room"></div>';
        const room = root.querySelector('#bounce-room');
        const roster = api.characters() || [];
        startBounce(room, data.candidates || [], roster, (id) =>
          api.send('award', { targetId: id })
        );
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
            '<button id="react-btn" class="react-btn big-btn pulsing" disabled>TRYCK</button>';
          return;
        }
        if (data.phase === 'go') {
          if (window.SFX) window.SFX.play('signal');
          if (navigator.vibrate) navigator.vibrate(180);
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
        const iScored = data.scoredId && data.scoredId === api.me();
        const pts = data.pointsAwarded != null ? data.pointsAwarded : data.roundValue;
        root.innerHTML =
          (iScored
            ? `<div class="you-scored">Du får <strong>+${pts}</strong> straffpoäng` +
              (moose ? ` 🫎&times;${data.moose.multiplier}` : '') +
              '</div>'
            : '') +
          `<div class="arena-result ${celebrate ? 'celebrate' : 'miss'}${moose ? ' moose' : ''}">` +
          `<div class="result-burst">${celebrate ? '🎉' : '💥'}${moose ? '🫎' : ''}</div>` +
          `<h1 class="result-text">${text}</h1>` +
          (moose ? `<p class="muted">🫎 &times;${data.moose.multiplier}</p>` : '') +
          '</div>' +
          golfBoard(data.standings, api.me());
        if (window.SFX) window.SFX.play(iScored ? 'lose' : celebrate ? 'win' : 'lose');
        if (celebrate && !iScored && window.Confetti) {
          window.Confetti.burst({ count: 70, y: 0.3 });
        }
        return;
      }

      if (view === 'final') {
        const me = api.me();
        const w = data.winner;
        const l = data.loser;
        const iWon = w && w.playerId === me;
        const iLost = l && l.playerId === me;
        const mine = (data.standings || []).find((s) => s.id === me);
        const place = (data.standings || []).findIndex((s) => s.id === me) + 1;
        root.innerHTML =
          '<div class="arena-result">' +
          '<p class="choose-tag">Slutresultat</p>' +
          (iWon
            ? '<h1 class="result-text good">🏆 Du vann!</h1><p class="you-scored">GULD + 10 stödbög-klunkar</p>'
            : iLost
              ? '<h1 class="result-text">Du fick flest straffpoäng…</h1><p class="you-scored">10 utdelningsklunkar 🍺</p>'
              : `<h1 class="result-text">${w ? esc(w.name) + ' vann' : 'Slut'}</h1>` +
                (place > 0
                  ? `<p class="muted">Din plats: ${place} av ${data.standings.length} (${mine ? mine.score : 0} p)</p>`
                  : '')) +
          '</div>' +
          golfBoard(data.standings, me);
        if (window.SFX) window.SFX.play(iWon ? 'win' : 'fanfare');
        if (iWon && window.Confetti) window.Confetti.burst({ count: 120, y: 0.3 });
        return;
      }
    },
  };
})();
