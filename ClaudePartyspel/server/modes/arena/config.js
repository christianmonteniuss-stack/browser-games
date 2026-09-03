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

  // ── Älgen (slumphändelse ovanpå rundlogiken) ──
  // Chans per runda att älgen dyker upp innan rundan körs.
  MOOSE_CHANCE: 0.15,
  // Multiplikatorn för en älg-runda är MOOSE_BASE_MULTIPLIER + antal TIDIGARE
  // älg-besök denna omgång: 2x första gången, 3x andra, 4x tredje ...
  MOOSE_BASE_MULTIPLIER: 2,
  // Hur länge "BOOOOSE MOOOOSE"-overlayen visas innan rundan startar.
  MOOSE_INTRO_SECONDS: 3,

  // ── "Time to Choose"-rundan ──
  // Sekunder spelarna har på sig att rösta.
  CHOOSE_SECONDS: 20,

  // ── Reaktionstestet ──
  // Signalen kommer efter en slumpad fördröjning i [MIN, MAX] sekunder.
  REACT_DELAY_MIN: 3,
  REACT_DELAY_MAX: 8,
  // Trycker man inte inom så här lång tid EFTER signalen räknas man som sist.
  REACT_MAX_SECONDS: 5,

  // ── Rundtyp per runda ──
  // Relativa vikter för vilken rundtyp som slumpas när en runda startar.
  // Normaliseras (behöver inte summera till 1). Saknad nyckel / 0 => körs aldrig.
  ROUND_TYPE_WEIGHTS: {
    quiz: 0.6,
    choose: 0.2,
    react: 0.2,
  },
};




