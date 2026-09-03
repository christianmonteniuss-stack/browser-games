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
    this.characterId = null; // chosen lobby character id, or null until picked
    this.socket = null; // current live WebSocket, or null while disconnected
    this.connected = false;
  }
}

class Lobby {
  /** @param {{id,name,color,emoji,imageUrl?}[]} characters  fixed pickable roster */
  constructor(characters = []) {
    /** @type {Map<string, Player>} */
    this.players = new Map(); // id -> Player
    /** @type {Set<import('ws').WebSocket>} */
    this.hostSockets = new Set(); // every open host-screen socket
    this.characters = characters; // see server/characters.js
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

  /** Connected players who have also picked a character — "ready" in the lobby. */
  readyPlayers() {
    return this.connectedPlayers().filter((p) => p.characterId);
  }

  // ── characters ──────────────────────────────────────────────────────────

  characterById(id) {
    return this.characters.find((c) => c.id === id) || null;
  }

  /** Is `characterId` held by someone other than `exceptPlayerId`? */
  isCharacterTaken(characterId, exceptPlayerId = null) {
    for (const p of this.players.values()) {
      if (p.id !== exceptPlayerId && p.characterId === characterId) return true;
    }
    return false;
  }

  /**
   * Claim a character for a player. One character per player; each character
   * can be held by only one player at a time. Re-picking your own is a no-op.
   * @returns {{ ok: boolean, error?: 'unknown_session'|'unknown_character'|'character_taken' }}
   */
  chooseCharacter(playerId, characterId) {
    const player = this.getPlayer(playerId);
    if (!player) return { ok: false, error: 'unknown_session' };
    if (!this.characterById(characterId)) {
      return { ok: false, error: 'unknown_character' };
    }
    if (this.isCharacterTaken(characterId, playerId)) {
      return { ok: false, error: 'character_taken' };
    }
    player.characterId = characterId; // releasing any previous pick is implicit
    return { ok: true };
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
        characterId: p.characterId,
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
