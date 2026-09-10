// ── HOST RENDERER: ARENA ─────────────────────────────────────────────────────
// Registers window.HostModes.arena. Called on every MODE_STATE for this mode.
//
//   render(msg, api)
//     msg = { modeId, view, data }
//       view: 'room' | 'moose' | 'round' | 'pick' | 'result' | 'final'
//             | 'choose' | 'choose_result' | 'react' | 'react_result'
//     api = { root, clear(), send(action, data), characters() }

(function () {
  'use strict';
  window.HostModes = window.HostModes || {};

  // Placeholder sounds. Swap the files (keep the names), or repoint these.
  const SOUND_URL = '/assets/sounds/select.wav';
  const MOOSE_SOUND_URL = '/assets/sounds/moose.wav';

  const esc = window.cpEscapeHtml || ((s) => String(s));
  const AV = window.CharacterAvatar;

  let countdownTimer = null;
  let lastSoundNonce = 0;
  let chooseLive = false; // a "Time to Choose" countdown is currently running
  let reactLive = false; // a reaction test is in its 'go' phase

  function clearCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function emptyAvatar(size) {
    return (
      `<span class="char-avatar char-avatar-empty" ` +
      `style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px">?</span>`
    );
  }

  // The row of all characters — the "Rummet".
  function roomStrip(characters, blinkPlayerId) {
    return (
      '<div class="arena-strip">' +
      characters
        .map((c) => {
          const blink = blinkPlayerId && c.playerId === blinkPlayerId ? ' blink' : '';
          const av = c.character ? AV.html(c.character, { size: 84 }) : emptyAvatar(84);
          return (
            `<div class="arena-slot${blink}">${av}` +
            `<span class="arena-name">${esc(c.name)}</span>` +
            `<span class="arena-score">${c.score}</span></div>`
          );
        })
        .join('') +
      '</div>'
    );
  }

  // Golf leaderboard: lowest first, leader highlighted.
  function golfBoard(standings) {
    return (
      '<div class="golf-board"><h3>Ställning &mdash; lägst vinner</h3>' +
      '<ol class="golf-list">' +
      standings
        .map(
          (s, i) =>
            `<li class="${i === 0 ? 'leader' : ''}">` +
            `<span class="pos">${i + 1}</span>` +
            `<span class="who">${esc(s.name)}</span>` +
            `<span class="pts">${s.score}</span></li>`
        )
        .join('') +
      '</ol><p class="golf-hint">&#9660; Lågt är bra (som golf)</p></div>'
    );
  }

  window.HostModes.arena = {
    render(msg, api) {
      const { view, data } = msg;
      const root = api.root;

      // Live vote count during "Time to Choose" — update the text only, leave
      // the running countdown untouched.
      if (view === 'choose' && chooseLive && root.querySelector('#choose-progress')) {
        root.querySelector('#choose-progress').textContent =
          `${data.voted} / ${data.voterCount} har röstat`;
        return;
      }

      // Live tap count during a reaction test — text only, don't rebuild.
      if (
        view === 'react' &&
        data.phase === 'go' &&
        reactLive &&
        root.querySelector('#react-progress')
      ) {
        root.querySelector('#react-progress').textContent =
          `${data.tapped} / ${data.total} har tryckt`;
        return;
      }

      clearCountdown();
      chooseLive = false;
      reactLive = false;
      if (window.SFX) window.SFX.stopLoop(); // kill any reaction-test metronome

      if (view === 'moose') {
        const intensity = Math.max(1, data.intensity || 1);
        // Everything ramps up with every visit: shake faster, moose bigger,
        // red lights faster & brighter, and more overlapping stomps.
        const shake = Math.max(0.035, 0.3 - (intensity - 1) * 0.07).toFixed(3);
        const scale = Math.min(2.8, 1 + (intensity - 1) * 0.28).toFixed(2);
        const lights = Math.max(0.07, 0.34 - (intensity - 1) * 0.06).toFixed(3);
        const lightsOpacity = Math.min(0.85, 0.34 + (intensity - 1) * 0.13).toFixed(2);
        const vol = Math.min(1, 0.5 + (intensity - 1) * 0.18);
        const rate = Math.min(1.9, 1 + (intensity - 1) * 0.1);
        try {
          const a = new Audio(MOOSE_SOUND_URL);
          a.volume = vol;
          a.playbackRate = rate;
          a.play().catch(() => {});
        } catch (e) {
          /* ignore */
        }
        if (window.SFX) {
          const stomps = Math.min(6, 1 + intensity); // 2, 3, 4 … overlapping hits
          for (let i = 0; i < stomps; i++) {
            setTimeout(() => window.SFX.play('moose'), i * 240);
          }
          setTimeout(() => window.SFX.say('boooooze moooose'), 200 + stomps * 130);
        }
        root.innerHTML =
          `<div class="moose-overlay" style="--shake:${shake}s;--scale:${scale};` +
          `--lights:${lights}s;--lights-opacity:${lightsOpacity}">` +
          '<div class="moose-lights"></div>' +
          '<div class="moose-emoji">🫎</div>' +
          '<h1 class="moose-text">BOOOOSE MOOOOSE</h1>' +
          `<p class="moose-sub">Älg-besök #${data.visits} &middot; ` +
          `allt &times;${data.multiplier} resten av spelet!</p>` +
          '</div>';
        return;
      }

      if (view === 'room') {
        const mult = data.mooseMultiplier || 1;
        root.innerHTML =
          '<div class="arena-view">' +
          roomStrip(data.characters, null) +
          '<div class="arena-mid">' +
          `<p class="round-value">Runda-värde: <strong>${data.roundValue}</strong>` +
          (mult > 1 ? ` <span class="moose-mult">🫎 &times;${mult}</span>` : '') +
          '</p>' +
          (data.notice ? `<p class="arena-notice">${esc(data.notice)}</p>` : '') +
          `<button id="next-round" class="mode-btn"${data.canStart ? '' : ' disabled'}>Nästa runda</button>` +
          (data.canStart
            ? ''
            : `<p class="muted">Minst ${data.minPlayers} spelare med karaktär behövs.</p>`) +
          '<button id="arena-exit" class="ghost-btn">Avsluta &amp; kora vinnare</button>' +
          '</div>' +
          golfBoard(data.standings) +
          '</div>';
        root.querySelector('#next-round').addEventListener('click', () => api.send('next_round'));
        root.querySelector('#arena-exit').addEventListener('click', () => api.send('end_game'));
        return;
      }

      if (view === 'round') {
        if (data.sound && data.roundNonce !== lastSoundNonce) {
          lastSoundNonce = data.roundNonce;
          try {
            const a = new Audio(SOUND_URL);
            a.play().catch(() => {});
          } catch (e) {
            /* ignore */
          }
        }
        root.innerHTML =
          '<div class="arena-view">' +
          roomStrip(data.characters, data.chosenId) +
          '<div class="arena-mid">' +
          `<p class="round-value">Runda-värde: <strong>${data.roundValue}</strong></p>` +
          `<p class="arena-turn"><strong>${esc(data.chosenName)}</strong> svarar…</p>` +
          `<div id="countdown" class="countdown">${data.answerSeconds}</div>` +
          '</div></div>';

        let left = data.answerSeconds;
        const el = root.querySelector('#countdown');
        countdownTimer = setInterval(() => {
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
          '<div class="arena-view">' +
          roomStrip(data.characters, null) +
          '<div class="arena-mid">' +
          `<p class="arena-turn"><strong>${esc(data.chosenName)}</strong> hade rätt och ` +
          `väljer vem som får ${data.roundValue} straffpoäng…</p>` +
          '</div></div>';
        return;
      }

      if (view === 'choose') {
        root.innerHTML =
          '<div class="arena-view">' +
          roomStrip(data.characters, null) +
          '<div class="arena-mid">' +
          '<p class="choose-tag">Time to Choose</p>' +
          `<h2 class="choose-statement">${esc(data.statement)}</h2>` +
          `<div id="countdown" class="countdown">${data.chooseSeconds}</div>` +
          `<p id="choose-progress" class="answer-count">${data.voted} / ${data.voterCount} har röstat</p>` +
          '</div></div>';

        chooseLive = true;
        let left = data.chooseSeconds;
        const el = root.querySelector('#countdown');
        countdownTimer = setInterval(() => {
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

      if (view === 'choose_result') {
        const moose = !!(data.moose && data.moose.multiplier > 1);
        const rows = data.rows
          .map((r) => {
            const av = r.character ? AV.html(r.character, { size: 48 }) : emptyAvatar(48);
            return (
              '<li class="choose-row">' +
              `<span class="cr-av">${av}</span>` +
              `<span class="cr-name">${esc(r.name)}</span>` +
              `<span class="cr-votes">${r.votes} röster</span>` +
              `<span class="cr-pts">+${r.gained}</span>` +
              '</li>'
            );
          })
          .join('');
        root.innerHTML =
          `<div class="arena-result choose${moose ? ' moose' : ''}">` +
          '<p class="choose-tag">Time to Choose</p>' +
          `<h2 class="choose-statement">${esc(data.statement)}</h2>` +
          (moose ? `<p class="result-sub">🫎 &times;${data.moose.multiplier}!</p>` : '') +
          `<ul class="choose-tally">${rows}</ul>` +
          '</div>' +
          golfBoard(data.standings);
        return;
      }

      if (view === 'react') {
        if (data.phase === 'wait') {
          root.innerHTML =
            '<div class="react-hype pulsing">' +
            '<div class="react-c">C</div>' +
            '<p class="react-sub">Vänta på signalen…</p>' +
            '</div>';
          const cEl = root.querySelector('.react-c');
          const hype = root.querySelector('.react-hype');
          if (window.SFX) {
            window.SFX.startLoop((p) => {
              window.SFX.tick(p);
              if (cEl) {
                cEl.classList.add('beat');
                setTimeout(() => cEl.classList.remove('beat'), 90);
              }
              if (hype) {
                hype.style.setProperty('--flash', (0.05 + p * 0.28).toFixed(2));
                hype.classList.add('flash');
                setTimeout(() => hype.classList.remove('flash'), 80);
              }
            });
          }
          return;
        }
        // phase === 'go' — the "C" freezes: that is the signal
        if (window.SFX) {
          window.SFX.stopLoop();
          window.SFX.play('signal');
        }
        root.innerHTML =
          '<div class="react-hype go">' +
          '<div class="react-c go">C</div>' +
          '<p class="react-go-text">NU!</p>' +
          `<p id="react-progress" class="answer-count">${data.tapped} / ${data.total} har tryckt</p>` +
          '</div>';
        reactLive = true;
        return;
      }

      if (view === 'react_result') {
        const moose = !!(data.moose && data.moose.multiplier > 1);
        const rows = data.rows
          .map((r) => {
            const av = r.character ? AV.html(r.character, { size: 44 }) : emptyAvatar(44);
            const time =
              r.reactionMs == null
                ? '<span class="rt-slow">ingen tryckning</span>'
                : `${r.reactionMs} ms`;
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
          '<h2 class="choose-statement">Snabbast vinner (får minst poäng)</h2>' +
          (moose ? `<p class="result-sub">🫎 &times;${data.moose.multiplier}!</p>` : '') +
          `<ul class="choose-tally react-tally">${rows}</ul>` +
          '</div>' +
          golfBoard(data.standings);
        return;
      }

      if (view === 'result') {
        const celebrate = data.kind === 'celebrate';
        const text = (celebrate ? "Let's go, " : 'You suck, ') + esc(data.name) + '!';
        const pts = data.pointsAwarded != null ? data.pointsAwarded : data.roundValue;
        const moose = !!(data.moose && data.moose.multiplier > 1);
        const sub =
          `${esc(data.name)} får ${pts} straffpoäng` +
          (celebrate ? '' : ' för fel svar') +
          (moose ? ` &nbsp;🫎 &times;${data.moose.multiplier}!` : '');
        root.innerHTML =
          `<div class="arena-result ${celebrate ? 'celebrate' : 'miss'}${moose ? ' moose' : ''}">` +
          `<div class="result-burst">${celebrate ? '🎉' : '💥'}${moose ? '🫎' : ''}</div>` +
          `<h1 class="result-text">${text}</h1>` +
          `<p class="result-sub">${sub}</p>` +
          '</div>' +
          golfBoard(data.standings);
        if (window.SFX) window.SFX.play(celebrate ? 'win' : 'lose');
        if (celebrate && window.Confetti) {
          window.Confetti.burst({ count: moose ? 220 : 150 });
        }
        return;
      }

      if (view === 'final') {
        const w = data.winner;
        const l = data.loser;
        const av = (c, size) => (c ? AV.html(c, { size }) : emptyAvatar(size));
        root.innerHTML =
          '<div class="arena-final">' +
          '<p class="choose-tag">Slutresultat</p>' +
          (w
            ? '<div class="final-winner">' +
              av(w.character, 96) +
              `<h1 class="result-text">🏆 ${esc(w.name)} vinner!</h1>` +
              `<p class="final-sub">${w.score} straffpoäng &middot; GULD + 10 stödbög-klunkar</p>` +
              '</div>'
            : '') +
          (l
            ? '<div class="final-loser">' +
              av(l.character, 64) +
              `<h2>${esc(l.name)} — flest straffpoäng (${l.score})</h2>` +
              '<p class="final-sub">10 utdelningsklunkar 🍺</p>' +
              '</div>'
            : '') +
          golfBoard(data.standings) +
          '<button id="final-exit" class="mode-btn">Tillbaka till lobbyn</button>' +
          '</div>';
        root.querySelector('#final-exit').addEventListener('click', () => api.send('exit'));
        if (window.SFX) window.SFX.play('fanfare');
        if (window.Confetti) window.Confetti.burst({ count: 240, y: 0.25 });
        return;
      }
    },
  };
})();
