// ── GAME MANAGER ─────────────────────────────────────────────────────────────
// The core. It owns the lobby, routes every WebSocket message, and runs at
// most one game mode at a time. Game modes never touch sockets directly —
// they are handed a `ctx` object (see `_ctx()` below) that is the ENTIRE
// surface they are allowed to use. Add a new game by writing a module against
// that interface; you should not need to change this file.

const { S2C, send } = require('./protocol');
const { Lobby } = require('./lobby');
const modes = require('./modes');

class GameManager {
  constructor() {
    this.lobby = new Lobby();
    this.activeMode = null; // the running mode instance, or null in the lobby
    this.joinUrl = ''; // filled in once the HTTP server knows its address
  }

  setJoinUrl(url) {
    this.joinUrl = url;
  }

  // ── SOCKET LIFECYCLE ──────────────────────────────────────────────────────

  /** Called by the ws server for every incoming message (raw string). */
  handleMessage(socket, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return; // ignore anything that isn't JSON
    }
    const { type, payload = {} } = msg || {};

    switch (type) {
      case 'host_hello':
        return this._onHostHello(socket);
      case 'join':
        return this._onJoin(socket, payload);
      case 'rejoin':
        return this._onRejoin(socket, payload);
      case 'host_start_mode':
        return this._onHostStartMode(socket, payload);
      case 'host_action':
        return this._onHostAction(socket, payload);
      case 'player_action':
        return this._onPlayerAction(socket, payload);
      default:
        return; // unknown type -> ignore
    }
  }

  /** Called by the ws server when any socket closes. */
  handleClose(socket) {
    this.lobby.removeHost(socket);

    for (const player of this.lobby.players.values()) {
      if (player.socket === socket) {
        player.socket = null;
        player.connected = false;
        if (this.activeMode && this.activeMode.onPlayerLeave) {
          this.activeMode.onPlayerLeave(this._ctx(), player);
        }
      }
    }
    this._broadcastLobby();
  }

  // ── MESSAGE HANDLERS ──────────────────────────────────────────────────────

  _onHostHello(socket) {
    this.lobby.addHost(socket);
    send(socket, S2C.LOBBY_STATE, this._lobbyState());
    if (this.activeMode) {
      send(socket, S2C.MODE_STARTED, { modeId: this.activeMode.id });
    }
  }

  _onJoin(socket, { name }) {
    const player = this.lobby.createPlayer(name);
    player.socket = socket;
    player.connected = true;
    send(socket, S2C.JOINED, { playerId: player.id, name: player.name });
    this._broadcastLobby();
    this._resyncPlayer(player);
  }

  _onRejoin(socket, { playerId }) {
    const player = this.lobby.getPlayer(playerId);
    if (!player) {
      // Server was restarted, or the lobby was reset. Ask the phone to
      // fall back to the name-entry screen.
      send(socket, S2C.ERROR, {
        code: 'unknown_session',
        message: 'Sessionen finns inte längre — skriv in ditt namn igen.',
      });
      return;
    }
    player.socket = socket;
    player.connected = true;
    send(socket, S2C.JOINED, { playerId: player.id, name: player.name });
    this._broadcastLobby();
    if (this.activeMode) {
      send(socket, S2C.MODE_STARTED, { modeId: this.activeMode.id });
    }
    this._resyncPlayer(player);
  }

  _onHostStartMode(socket, { modeId }) {
    if (this.activeMode) return; // one game at a time
    const mode = modes.createMode(modeId);
    if (!mode) {
      send(socket, S2C.ERROR, { message: `Okänt spelläge: ${modeId}` });
      return;
    }
    this.activeMode = mode;
    this._broadcast(S2C.MODE_STARTED, { modeId: mode.id });
    mode.onStart(this._ctx());
    this._broadcastLobby();
  }

  _onHostAction(socket, payload) {
    // `reset_scores` is a core action available in the lobby (no mode running).
    if (payload && payload.action === 'reset_scores' && !this.activeMode) {
      this.lobby.resetScores();
      this._broadcastLobby();
      return;
    }
    if (this.activeMode && this.activeMode.onHostMessage) {
      this.activeMode.onHostMessage(this._ctx(), payload || {});
    }
  }

  _onPlayerAction(socket, payload) {
    const player = this._playerBySocket(socket);
    if (!player || !this.activeMode) return;
    // Guard against a late message from a previous mode.
    if (payload && payload.modeId && payload.modeId !== this.activeMode.id) return;
    if (this.activeMode.onPlayerMessage) {
      this.activeMode.onPlayerMessage(this._ctx(), player, payload || {});
    }
  }

  // ── THE GAME-MODE INTERFACE ───────────────────────────────────────────────
  // Everything a mode is allowed to do. Kept small on purpose.

  _ctx() {
    const self = this;
    return {
      /** The Lobby instance — read player list / scores from here. */
      lobby: this.lobby,

      /** Connected players only (array of Player). */
      players: () => self.lobby.connectedPlayers(),

      /** Score table, highest first: [{ id, name, score, connected }]. */
      standings: () => self.lobby.standings(),

      /** Add points to the central leaderboard. */
      addScore: (playerId, points) => {
        const p = self.lobby.getPlayer(playerId);
        if (p) p.score += points;
      },

      /** Zero every score. */
      resetScores: () => self.lobby.resetScores(),

      /** Send a message to every host screen. */
      toHost: (type, payload) => {
        for (const s of self.lobby.hostSockets) send(s, type, payload);
      },

      /** Send a message to one player. */
      toPlayer: (playerId, type, payload) => {
        const p = self.lobby.getPlayer(playerId);
        if (p) send(p.socket, type, payload);
      },

      /** Send a message to every player. */
      toAllPlayers: (type, payload) => {
        for (const p of self.lobby.players.values()) send(p.socket, type, payload);
      },

      /** Send a message to the host screen AND every player. */
      broadcast: (type, payload) => self._broadcast(type, payload),

      /** Tell the core this mode is finished; returns to the lobby. */
      endMode: () => self._endActiveMode(),
    };
  }

  _endActiveMode() {
    if (!this.activeMode) return;
    const ended = this.activeMode;
    if (ended.onEnd) ended.onEnd(this._ctx());
    this.activeMode = null;
    this._broadcast(S2C.MODE_ENDED, { modeId: ended.id });
    this._broadcastLobby();
  }

  // ── INTERNAL HELPERS ──────────────────────────────────────────────────────

  /** Give a (re)joining player the current mode screen, if a mode is running. */
  _resyncPlayer(player) {
    if (this.activeMode && this.activeMode.onPlayerJoin) {
      this.activeMode.onPlayerJoin(this._ctx(), player);
    }
  }

  _playerBySocket(socket) {
    for (const p of this.lobby.players.values()) {
      if (p.socket === socket) return p;
    }
    return null;
  }

  _lobbyState() {
    return {
      players: this.lobby.standings(),
      activeMode: this.activeMode ? this.activeMode.id : null,
      joinUrl: this.joinUrl,
    };
  }

  _broadcastLobby() {
    this._broadcast(S2C.LOBBY_STATE, this._lobbyState());
  }

  _broadcast(type, payload) {
    for (const s of this.lobby.hostSockets) send(s, type, payload);
    for (const p of this.lobby.players.values()) send(p.socket, type, payload);
  }
}

module.exports = { GameManager };
