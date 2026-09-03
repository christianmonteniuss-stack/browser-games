// ── GAME MODE REGISTRY ───────────────────────────────────────────────────────
// The single list of every game mode the server knows about.
//
// To add a new mode:
//   1. Create server/modes/<id>/index.js exporting a factory function
//      (see server/modes/quiz/index.js and the README for the interface).
//   2. Add one line to REGISTRY below.
//   3. Create the two browser renderers:
//        public/host/modes/<id>.js    (registers window.HostModes.<id>)
//        public/player/modes/<id>.js  (registers window.PartyModes.<id>)
//      The host and player pages load these automatically from /api/modes —
//      no HTML edits needed.

const createQuizMode = require('./quiz');

/**
 * Each entry: { id, name, minPlayers, factory }.
 * `factory()` must return a fresh mode instance every call so each game
 * starts with clean state.
 */
const REGISTRY = [
  { id: 'quiz', name: 'Quiz', minPlayers: 1, factory: createQuizMode },
];

/** Metadata for the host UI and the /api/modes endpoint. */
function listModes() {
  return REGISTRY.map(({ id, name, minPlayers }) => ({ id, name, minPlayers }));
}

/** Instantiate a mode by id, or null if unknown. */
function createMode(id) {
  const entry = REGISTRY.find((m) => m.id === id);
  return entry ? entry.factory() : null;
}

module.exports = { listModes, createMode };
