// ── ARENA CONFIG ─────────────────────────────────────────────────────────────
// Tunables for the core game loop. Safe to tweak — no game logic lives here.

module.exports = {
  // Round value = the points at stake in a round. It starts here...
  ROUND_VALUE_START: 1,
  // ...and grows by this much after every completed round (any round type).
  ROUND_VALUE_STEP: 1,

  // Seconds the chosen player has to answer (the host shows this countdown).
  // Running out counts as a wrong answer.
  ANSWER_SECONDS: 20,

  // Seconds the winner has to point at someone before a random other player
  // is picked automatically (keeps the loop from hanging).
  PICK_SECONDS: 20,

  // How long the "Let's go / You suck" animation holds before the room returns.
  RESULT_SECONDS: 4,

  // A round needs at least this many connected players who have a character.
  MIN_PLAYERS: 2,
};
