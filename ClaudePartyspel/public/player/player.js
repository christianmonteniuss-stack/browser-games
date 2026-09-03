// ── PLAYER VIEW CORE ─────────────────────────────────────────────────────────
// Runs on each phone. Responsibilities:
//   - name entry + join, with reconnect via localStorage
//   - keep a WebSocket open (auto-reconnect)
//   - show the right screen: join / lobby / game
//   - delegate the in-game screen to the active mode's renderer
//     (window.PartyModes[<modeId>], loaded from /player/modes/<id>.js)
//
// A mode renderer is: { render(msg, api) } where
//   msg = { modeId, view, data }   (straight from the server)
//   api = { root, clear(), send(action, data), me() }

(function () {
  'use strict';

  const { C2S, S2C } = window.EVENTS;
  window.PartyModes = window.PartyModes || {};

  const $ = (id) => document.getElementById(id);
  const SCREENS = ['screen-join', 'screen-character', 'screen-lobby', 'screen-game'];

  const state = {
    ws: null,
    playerId: localStorage.getItem('cp_playerId') || null,
    name: localStorage.getItem('cp_name') || '',
    characterId: null, // server-authoritative; set from JOINED / LOBBY_STATE
    characters: [], // roster from /api/characters
    players: [], // last known lobby player list
    currentMode: null,
  };

  // ── screen switching ──────────────────────────────────────────────────────

  function showScreen(id) {
    for (const s of SCREENS) $(s).hidden = s !== id;
  }

  function render() {
    if (!state.playerId) {
      showScreen('screen-join');
      return;
    }
    if (!state.characterId) {
      // Can't enter the lobby "for real" until a free character is picked.
      showScreen('screen-character');
      renderCharacterGrid();
      return;
    }
    if (state.currentMode && window.PartyModes[state.currentMode]) {
      showScreen('screen-game');
      return; // the mode renderer draws on each MODE_STATE message
    }
    showScreen('screen-lobby');
    $('lobby-greeting').textContent = 'Hej ' + state.name + '!';
  }

  // ── the api handed to mode renderers ─────────────────────────────────────

  function modeApi() {
    return {
      root: $('game-root'),
      clear() {
        $('game-root').innerHTML = '';
      },
      send(action, data) {
        sendMsg(C2S.PLAYER_ACTION, { modeId: state.currentMode, action, data });
      },
      me: () => state.playerId,
      characters: () => state.characters,
    };
  }

  // ── incoming messages ───────────────────────────────────────────────────

  function handleMessage(type, payload) {
    switch (type) {
      case S2C.JOINED:
        state.playerId = payload.playerId;
        state.name = payload.name;
        state.characterId = payload.characterId || null;
        localStorage.setItem('cp_playerId', state.playerId);
        localStorage.setItem('cp_name', state.name);
        hideJoinError();
        render();
        break;

      case S2C.ERROR:
        if (payload.code === 'unknown_session') {
          localStorage.removeItem('cp_playerId');
          state.playerId = null;
          state.characterId = null;
          state.currentMode = null;
          showJoinError(payload.message || 'Något gick fel.');
        } else if (
          payload.code === 'character_taken' ||
          payload.code === 'unknown_character'
        ) {
          showCharError(payload.message || 'Karaktären är upptagen.');
        }
        render();
        break;

      case S2C.LOBBY_STATE: {
        state.players = payload.players || [];
        const me = state.players.find((p) => p.id === state.playerId);
        if (me) state.characterId = me.characterId || null;
        renderLobbyPlayers(state.players);
        renderLobbyStandings(state.players);
        if (!state.characterId) renderCharacterGrid();
        render();
        break;
      }

      case S2C.MODE_STARTED:
        state.currentMode = payload.modeId;
        render();
        break;

      case S2C.MODE_ENDED:
        state.currentMode = null;
        render();
        break;

      case S2C.MODE_STATE: {
        state.currentMode = payload.modeId;
        // Don't skip character select — once a character is picked the server
        // re-syncs us to the live game screen.
        if (!state.characterId) {
          render();
          break;
        }
        showScreen('screen-game');
        const mode = window.PartyModes[payload.modeId];
        if (mode && typeof mode.render === 'function') {
          mode.render(payload, modeApi());
        } else {
          $('game-root').innerHTML =
            '<p class="muted">Laddar lek…</p>';
        }
        break;
      }
    }
  }

  // ── character select ──────────────────────────────────────────────────

  function renderCharacterGrid() {
    const grid = $('char-grid');
    if (!grid) return;

    const takenBy = {};
    for (const p of state.players) {
      if (p.characterId) takenBy[p.characterId] = p;
    }

    grid.innerHTML = '';
    for (const char of state.characters) {
      const owner = takenBy[char.id];
      const mine = owner && owner.id === state.playerId;
      const taken = owner && !mine;

      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className =
        'char-tile' + (taken ? ' taken' : '') + (mine ? ' selected' : '');
      tile.disabled = !!taken;
      tile.innerHTML =
        window.CharacterAvatar.html(char, { size: 72 }) +
        `<span class="char-name">${escapeHtml(char.name)}</span>` +
        `<span class="char-status">${
          taken ? 'Upptagen' : mine ? 'Vald' : 'Ledig'
        }</span>`;

      if (!taken) {
        tile.addEventListener('click', () => {
          hideCharError();
          sendMsg(C2S.CHOOSE_CHARACTER, { characterId: char.id });
        });
      }
      grid.appendChild(tile);
    }
  }

  function showCharError(msg) {
    const n = $('char-error');
    if (!n) return;
    n.textContent = msg;
    n.hidden = false;
  }
  function hideCharError() {
    const n = $('char-error');
    if (n) n.hidden = true;
  }

  // ── lobby: who is here (with their character) ─────────────────────────

  function renderLobbyPlayers(players) {
    const el = $('lobby-players');
    if (!el) return;
    el.innerHTML =
      '<ul class="lobby-people">' +
      players
        .filter((p) => p.connected)
        .map((p) => {
          const char = state.characters.find((c) => c.id === p.characterId);
          const avatar = char
            ? window.CharacterAvatar.html(char, { size: 36 })
            : '<span class="char-avatar char-avatar-empty" ' +
              'style="width:36px;height:36px;font-size:18px">…</span>';
          return (
            `<li>${avatar}<span class="${
              p.id === state.playerId ? 'me' : ''
            }">${escapeHtml(p.name)}</span></li>`
          );
        })
        .join('') +
      '</ul>';
  }

  // ── lobby standings (between games) ─────────────────────────────────────

  function renderLobbyStandings(players) {
    const el = $('lobby-standings');
    if (!players.some((p) => p.score > 0)) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML =
      '<h3>Ställning</h3><ul class="standings">' +
      players
        .map(
          (p) =>
            `<li class="${p.id === state.playerId ? 'me' : ''}">` +
            `<span>${escapeHtml(p.name)}</span><span>${p.score}</span></li>`
        )
        .join('') +
      '</ul>';
  }

  // ── join form ──────────────────────────────────────────────────────────

  $('join-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('name-input').value.trim();
    if (!name) return;
    state.name = name;
    sendMsg(C2S.JOIN, { name });
  });

  function showJoinError(msg) {
    const n = $('join-error');
    n.textContent = msg;
    n.hidden = false;
  }
  function hideJoinError() {
    $('join-error').hidden = true;
  }

  // ── websocket with auto-reconnect ──────────────────────────────────────

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = new WebSocket(proto + location.host + '/ws');
    state.ws = ws;

    ws.onopen = () => {
      $('conn-banner').hidden = true;
      if (state.playerId) sendMsg(C2S.REJOIN, { playerId: state.playerId });
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
      $('conn-banner').hidden = false;
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

  async function loadModeRenderers() {
    let list = [];
    try {
      list = await (await fetch('/api/modes')).json();
    } catch {
      return;
    }
    await Promise.all(
      list.map(
        (m) =>
          new Promise((resolve) => {
            if (m.css) {
              const l = document.createElement('link');
              l.rel = 'stylesheet';
              l.href = '/player/modes/' + m.id + '.css';
              document.head.appendChild(l);
            }
            const s = document.createElement('script');
            s.src = '/player/modes/' + m.id + '.js';
            s.onload = resolve;
            s.onerror = resolve;
            document.body.appendChild(s);
          })
      )
    );
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
  window.cpEscapeHtml = escapeHtml; // handy for mode renderers

  // ── boot ─────────────────────────────────────────────────────────────

  (async function init() {
    if (state.name) $('name-input').value = state.name;
    await Promise.all([loadModeRenderers(), loadCharacters()]);
    connect();
    render();
  })();
})();
