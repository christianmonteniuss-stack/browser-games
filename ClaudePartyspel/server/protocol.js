// ── WIRE PROTOCOL ─────────────────────────────────────────────────────────────
// Every WebSocket message is JSON of the shape: { type: string, payload: object }
//
// These constants name every message type that crosses the wire. The browser
// has its own copy in public/shared/events.js — KEEP THE TWO FILES IN SYNC.
// (They are tiny and rarely change, so a manual copy is simpler than a build
// step that shares one file between Node and the browser.)

// Client -> Server
const C2S = {
  JOIN: 'join', // player: { name } -> asks to join the lobby
  REJOIN: 'rejoin', // player: { playerId } -> reconnect an existing session
  PLAYER_ACTION: 'player_action', // player: { modeId, action, data } -> in-game input
  HOST_HELLO: 'host_hello', // host view: {} -> identifies this socket as the host screen
  HOST_START_MODE: 'host_start_mode', // host: { modeId } -> start a game mode
  HOST_ACTION: 'host_action', // host: { action, data } -> control the running mode
};

// Server -> Client
const S2C = {
  JOINED: 'joined', // -> { playerId, name }   sent to a player after JOIN/REJOIN
  ERROR: 'error', // -> { code?, message }
  LOBBY_STATE: 'lobby_state', // -> { players[], activeMode, joinUrl }  (broadcast on any change)
  MODE_STARTED: 'mode_started', // -> { modeId }
  MODE_STATE: 'mode_state', // -> { modeId, view, data }  a game mode's render payload
  MODE_ENDED: 'mode_ended', // -> { modeId }
};

/**
 * Safe send: serialises { type, payload } and ignores closed / missing sockets.
 * Game-mode code and the core both go through this, so a disconnected player
 * never throws.
 */
function send(socket, type, payload = {}) {
  if (!socket || socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify({ type, payload }));
}

module.exports = { C2S, S2C, send };
