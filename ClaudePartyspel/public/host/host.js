// ── HOST VIEW CORE ───────────────────────────────────────────────────────────
// Runs on the host screen. Responsibilities:
//   - show the join QR + URL and the live player list
//   - offer a "Starta <mode>" button per registered game mode
//   - keep a WebSocket open (auto-reconnect), identifying as the host
//   - delegate the in-game screen to the active mode's renderer
//     (window.HostModes[<modeId>], loaded from /host/modes/<id>.js)
//
// A mode renderer is: { render(msg, api) } where
//   msg = { modeId, view, data }
//   api = { root, clear(), send(action, data) }   -> send() emits HOST_ACTION

(function () {
  'use strict';

  const { C2S, S2C } = window.EVENTS;
  window.HostModes = window.HostModes || {};

  const $ = (id) => document.getElementById(id);

  const state = {
    ws: null,
    modes: [], // [{ id, name, minPlayers }]
    characters: [], // [{ id, name, color, emoji, imageUrl? }]
    activeMode: null,
  };

  // ── screen switching ──────────────────────────────────────────────────────

  function showScreen(which) {
    $('screen-lobby').hidden = which !== 'lobby';
    $('screen-game').hidden = which !== 'game';
  }

  // ── the api handed to mode renderers ─────────────────────────────────────

  function modeApi() {
    return {
      root: $('game-root'),
      clear() {
        $('game-root').innerHTML = '';
      },
      send(action, data) {
        sendMsg(C2S.HOST_ACTION, { action, data });
      },
      characters: () => state.characters,
    };
  }

  // ── incoming messages ───────────────────────────────────────────────────

  function handleMessage(type, payload) {
    switch (type) {
      case S2C.LOBBY_STATE:
        $('join-url').textContent = payload.joinUrl || '';
        state.activeMode = payload.activeMode;
        renderPlayers(payload.players || []);
        renderCharRoster(payload.players || []);
        renderStandings(payload.players || []);
        setModeButtonsEnabled(!payload.activeMode);
        if (!payload.activeMode) showScreen('lobby');
        break;

      case S2C.MODE_STARTED:
        state.activeMode = payload.modeId;
        setModeButtonsEnabled(false);
        showScreen('game');
        $('game-root').innerHTML = '<p class="muted">Startar…</p>';
        break;

      case S2C.MODE_ENDED:
        state.activeMode = null;
        setModeButtonsEnabled(true);
        showScreen('lobby');
        break;

      case S2C.MODE_STATE: {
        showScreen('game');
        const mode = window.HostModes[payload.modeId];
        if (mode && typeof mode.render === 'function') {
          mode.render(payload, modeApi());
        } else {
          $('game-root').innerHTML = '<p class="muted">Laddar lek…</p>';
        }
        break;
      }
    }
  }

  // ── lobby rendering ────────────────────────────────────────────────────

  function renderPlayers(players) {
    $('player-count').textContent = players.length;
    $('player-list').innerHTML = players
      .map((p) => {
        const char = state.characters.find((c) => c.id === p.characterId);
        const avatar = char
          ? window.CharacterAvatar.html(char, { size: 32 })
          : '<span class="char-avatar char-avatar-empty" ' +
            'style="width:32px;height:32px;font-size:15px">…</span>';
        const cls =
          (p.connected ? '' : 'gone ') + (p.characterId ? '' : 'choosing');
        const tail = p.characterId ? '' : '<span class="muted">väljer…</span>';
        return (
          `<li class="${cls.trim()}">${avatar}` +
          `<span>${escapeHtml(p.name)}</span>${tail}</li>`
        );
      })
      .join('');
  }

  function renderCharRoster(players) {
    const el = $('char-roster');
    if (!el) return;
    if (!state.characters.length) {
      el.innerHTML = '';
      return;
    }
    const takenBy = {};
    for (const p of players) {
      if (p.characterId) takenBy[p.characterId] = p.name;
    }
    const connected = players.filter((p) => p.connected);
    const ready = connected.filter((p) => p.characterId).length;

    el.innerHTML =
      `<h3>Karaktärer &middot; ${ready}/${connected.length} redo</h3>` +
      '<div class="char-grid">' +
      state.characters
        .map((c) => {
          const owner = takenBy[c.id];
          return (
            `<div class="char-tile ${owner ? 'taken' : ''}">` +
            window.CharacterAvatar.html(c, { size: 44 }) +
            `<span class="char-name">${escapeHtml(c.name)}</span>` +
            `<span class="char-status">${
              owner ? escapeHtml(owner) : 'Ledig'
            }</span></div>`
          );
        })
        .join('') +
      '</div>';
  }

  function renderStandings(players) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (!sorted.some((p) => p.score > 0)) {
      $('standings-panel').innerHTML = '';
      return;
    }
    $('standings-panel').innerHTML =
      '<h3>Ställning</h3><ol class="standings">' +
      sorted
        .map(
          (p) =>
            `<li><span>${escapeHtml(p.name)}</span><span>${p.score}</span></li>`
        )
        .join('') +
      '</ol>';
  }

  function renderModeButtons() {
    $('mode-buttons').innerHTML = state.modes
      .map(
        (m) =>
          `<button class="mode-btn" data-mode="${m.id}">Starta ${escapeHtml(
            m.name
          )}</button>`
      )
      .join('');
    $('mode-buttons')
      .querySelectorAll('button')
      .forEach((b) => {
        b.addEventListener('click', () =>
          sendMsg(C2S.HOST_START_MODE, { modeId: b.dataset.mode })
        );
      });
  }

  function setModeButtonsEnabled(enabled) {
    $('mode-buttons')
      .querySelectorAll('button')
      .forEach((b) => (b.disabled = !enabled));
  }

  $('reset-scores').addEventListener('click', () =>
    sendMsg(C2S.HOST_ACTION, { action: 'reset_scores' })
  );

  // ── websocket with auto-reconnect ──────────────────────────────────────

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = new WebSocket(proto + location.host + '/ws');
    state.ws = ws;

    ws.onopen = () => {
      $('conn-dot').className = 'online';
      sendMsg(C2S.HOST_HELLO, {});
    };
    ws.onmessage = (ev) => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch {
        return;
      }
      handleMessage(m.type, m.payload || {});
    };
    ws.onclose = () => {
      $('conn-dot').className = 'offline';
      setTimeout(connect, 1000);
    };
    ws.onerror = () => ws.close();
  }

  function sendMsg(type, payload) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({ type, payload }));
    }
  }

  // ── mode renderer loading ─────────────────────────────────────────────

  async function loadModes() {
    try {
      state.modes = await (await fetch('/api/modes')).json();
    } catch {
      state.modes = [];
    }
    await Promise.all(
      state.modes.map(
        (m) =>
          new Promise((resolve) => {
            if (m.css) {
              const l = document.createElement('link');
              l.rel = 'stylesheet';
              l.href = '/host/modes/' + m.id + '.css';
              document.head.appendChild(l);
            }
            const s = document.createElement('script');
            s.src = '/host/modes/' + m.id + '.js';
            s.onload = resolve;
            s.onerror = resolve;
            document.body.appendChild(s);
          })
      )
    );
    renderModeButtons();
  }

  async function loadCharacters() {
    try {
      state.characters = await (await fetch('/api/characters')).json();
    } catch {
      state.characters = [];
    }
  }

  // ── shared helper ─────────────────────────────────────────────────────

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }
  window.cpEscapeHtml = escapeHtml;

  // ── boot ─────────────────────────────────────────────────────────────

  (async function init() {
    await Promise.all([loadModes(), loadCharacters()]);
    connect();
  })();
})();
