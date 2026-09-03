// ── LOBBY ────────────────────────────────────────────────────────────────────
// The lobby is the shared state that every game mode builds on: who is here,
// what they are called, and how many points they have. It knows nothing about
// any specific game.

const crypto = require('crypto');

class Player {
  constructor(id, name) {
    this.id = id; // stable id, kept across reconnects (stored in the phone's localStorage)
    this.name = name;
    this.score = 0;
    this.socket = null; // current live WebSocket, or null while disconnected
    this.connected = false;
  }
}

class Lobby {
  constructor() {
    /** @type {Map<string, Player>} */
    this.players = new Map(); // id -> Player
    /** @type {Set<import('ws').WebSocket>} */
    this.hostSockets = new Set(); // every open host-screen socket
  }

  addHost(socket) {
    this.hostSockets.add(socket);
  }

  removeHost(socket) {
    this.hostSockets.delete(socket);
  }

  /** Create a brand-new player with a fresh id. */
  createPlayer(rawName) {
    const id = crypto.randomUUID();
    const name = sanitiseName(rawName);
    const player = new Player(id, name);
    this.players.set(id, player);
    return player;
  }

  getPlayer(id) {
    return this.players.get(id) || null;
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  /** Players with a live socket right now. */
  connectedPlayers() {
    return [...this.players.values()].filter((p) => p.connected);
  }

  /** Everyone, highest score first — the shape the UIs render directly. */
  standings() {
    return [...this.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        connected: p.connected,
      }));
  }

  resetScores() {
    for (const p of this.players.values()) p.score = 0;
  }
}

function sanitiseName(raw) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  return name || 'Spelare';
}

module.exports = { Lobby, Player };
