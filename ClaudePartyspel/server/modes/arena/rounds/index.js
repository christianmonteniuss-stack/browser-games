// ── ARENA ROUND TYPES ────────────────────────────────────────────────────────
// Each round type is a self-contained module with the same shape:
//
//   { id,
//     reset(),                       // optional: re-shuffle content at game start
//     start(rc),                     // run one round
//     onPlayerMessage(rc, player, msg),
//     syncPlayer(rc, player),        // resend the current view to a (re)joining player
//     syncHost(rc),                  // resend the current view to a (re)joined host
//     onPlayerLeave(rc, player) }    // optional: return true to abort the round
//
// `rc` is the round context built by the arena core (server/modes/arena/index.js
// -> _rc). It is the ONLY thing a round type may touch.
//
// To add a round type: create ./<id>.js, add it to ROUND_TYPES below, and give
// it a weight in config.ROUND_TYPE_WEIGHTS.

const CONFIG = require('../config');
const quizRound = require('./quiz');
const chooseRound = require('./choose');
const reactRound = require('./react');

const ROUND_TYPES = [quizRound, chooseRound, reactRound];

function weightFor(id) {
  const w = CONFIG.ROUND_TYPE_WEIGHTS && CONFIG.ROUND_TYPE_WEIGHTS[id];
  return typeof w === 'number' && w > 0 ? w : 0;
}

/** Weighted-random pick of a round type. Falls back to quiz if all weights are 0. */
function pickRoundType() {
  const weighted = ROUND_TYPES.map((t) => ({ t, w: weightFor(t.id) }));
  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  if (total <= 0) return quizRound;

  let r = Math.random() * total;
  for (const { t, w } of weighted) {
    r -= w;
    if (r < 0) return t;
  }
  return weighted[weighted.length - 1].t;
}

function roundTypeById(id) {
  return ROUND_TYPES.find((t) => t.id === id) || null;
}

/** Called once at game start so each round type can re-shuffle its content. */
function resetAll() {
  for (const t of ROUND_TYPES) if (typeof t.reset === 'function') t.reset();
}

module.exports = { ROUND_TYPES, pickRoundType, roundTypeById, resetAll };
