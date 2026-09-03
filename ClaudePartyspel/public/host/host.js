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
    };
  }

  // ── incoming messages ───────────────────────────────────────────────────

  function handleMessage(type, payload) {
    switch (type) {
      case S2C.LOBBY_STATE:
        $('join-url').textContent = payload.joinUrl || '';
        state.activeMode = payload.activeMode;
        renderPlayers(payload.players || []);
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
      .map(
        (p) =>
          `<li class="${p.connected ? '' : 'gone'}">${escapeHtml(p.name)}</li>`
      )
      .join('');
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
    await loadModes();
    connect();
  })();
})();
