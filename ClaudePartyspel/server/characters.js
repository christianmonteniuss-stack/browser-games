// ── CHARACTERS ───────────────────────────────────────────────────────────────
// The fixed roster of characters a player picks in the lobby. Data only — no
// image files needed yet.
//
// Each character:
//   id        unique string (sent over the wire, stored on the player)
//   name      display name
//   color     CSS colour for the avatar circle
//   emoji     drawn in the middle of the circle when `imageUrl` is missing
//   imageUrl  OPTIONAL — set this later to show a real picture instead of the
//             emoji/colour circle. The renderer (public/shared/character.js)
//             falls back to emoji + colour whenever it is absent, so nothing
//             else in the codebase has to change.
//
// (Field names are kept in English to match the rest of the code, e.g.
// Player.name / Player.score.)
//
// Served to the browser as JSON at GET /api/characters.

module.exports = [
  { id: 'rav', name: 'Räven', color: '#e8663d', emoji: '🦊' },
  { id: 'grodan', name: 'Grodan', color: '#4c9f38', emoji: '🐸' },
  { id: 'ugglan', name: 'Ugglan', color: '#8d6e63', emoji: '🦉' },
  { id: 'katten', name: 'Katten', color: '#9c4dcc', emoji: '🐱' },
  { id: 'pandan', name: 'Pandan', color: '#546e7a', emoji: '🐼' },
  { id: 'bjornen', name: 'Björnen', color: '#a1795a', emoji: '🐻' },
  { id: 'enhorningen', name: 'Enhörningen', color: '#ec407a', emoji: '🦄' },
  { id: 'draken', name: 'Draken', color: '#2e9e5b', emoji: '🐉' },

  // Example of the future image form (nothing else changes):
  // { id: 'roboten', name: 'Roboten', color: '#5b8cff', emoji: '🤖',
  //   imageUrl: '/assets/characters/roboten.png' },
];
