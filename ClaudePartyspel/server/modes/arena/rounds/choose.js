// ── ROUND TYPE: "TIME TO CHOOSE" ─────────────────────────────────────────────
// Everyone sees a statement and votes for the connected character it fits
// best — their own included (self-vote is always allowed). When everyone has
// voted (or the timer runs out) each character scores:
//
//     votes  ×  round value  ×  active moose multiplier
//
// (rc.addScore(id, votes) already folds in the round value and moose.)
// The host then shows every character with its vote count and points gained.
//
// All round state lives on rc.state; this module keeps none of its own.

const { shuffled } = require('../util');
const STATEMENTS = require('../statements');

let queue = shuffled(STATEMENTS);

module.exports = {
  id: 'choose',

  reset() {
    queue = shuffled(STATEMENTS);
  },

  start(rc) {
    const s = rc.state;
    if (queue.length === 0) queue = shuffled(STATEMENTS);
    s.statement = queue.shift().text;
    s.votes = new Map(); // voterId -> targetId  (one per voter, last wins)
    s.done = false;

    const candidates = rc
      .readyPlayers()
      .map((p) => ({ id: p.id, name: p.name, characterId: p.characterId }));

    rc.toHost('choose', this._hostData(rc));
    for (const p of rc.readyPlayers()) {
      rc.toPlayer(p.id, 'choose', {
        roundValue: rc.roundValue,
        statement: s.statement,
        candidates, // includes the voter themselves — self-vote allowed
        chooseSeconds: rc.config.CHOOSE_SECONDS,
      });
    }

    rc.setTimer(() => {
      if (!rc.state.done) this._tally(rc);
    }, rc.config.CHOOSE_SECONDS * 1000);
  },

  onPlayerMessage(rc, player, msg) {
    const s = rc.state;
    if (s.done || msg.action !== 'choose') return;

    const targetId = msg.data && msg.data.targetId;
    if (!rc.readyPlayers().some((p) => p.id === targetId)) return; // self allowed
    s.votes.set(player.id, targetId);

    rc.toPlayer(player.id, 'choose_done', { targetId });
    rc.toHost('choose', this._hostData(rc));

    const voters = rc.readyPlayers();
    if (voters.length > 0 && voters.every((p) => s.votes.has(p.id))) this._tally(rc);
  },

  _tally(rc) {
    const s = rc.state;
    s.done = true;

    const counts = new Map(); // targetId -> votes
    for (const targetId of s.votes.values()) {
      counts.set(targetId, (counts.get(targetId) || 0) + 1);
    }

    const rows = rc
      .roomCharacters()
      .map((c) => {
        const votes = counts.get(c.playerId) || 0;
        if (votes > 0) rc.addScore(c.playerId, votes); // votes units of round value
        return {
          playerId: c.playerId,
          name: c.name,
          character: c.character,
          votes,
          gained: rc.points(votes),
        };
      })
      .sort((a, b) => b.votes - a.votes);

    rc.finish({ view: 'choose_result', data: { statement: s.statement, rows } });
  },

  syncPlayer(rc, player) {
    const s = rc.state;
    if (s.done) return;
    if (s.votes.has(player.id)) {
      rc.toPlayer(player.id, 'choose_done', { targetId: s.votes.get(player.id) });
    } else {
      rc.toPlayer(player.id, 'choose', {
        roundValue: rc.roundValue,
        statement: s.statement,
        candidates: rc
          .readyPlayers()
          .map((p) => ({ id: p.id, name: p.name, characterId: p.characterId })),
        chooseSeconds: rc.config.CHOOSE_SECONDS,
      });
    }
  },

  syncHost(rc) {
    rc.toHost('choose', this._hostData(rc));
  },

  onPlayerLeave(rc, player) {
    const s = rc.state;
    if (s.done) return false;
    const voters = rc.readyPlayers();
    if (voters.length > 0 && voters.every((p) => s.votes.has(p.id))) this._tally(rc);
    else rc.toHost('choose', this._hostData(rc));
    return false; // a choose round never aborts on a leaver
  },

  _hostData(rc) {
    const s = rc.state;
    return {
      roundValue: rc.roundValue,
      statement: s.statement,
      voterCount: rc.readyPlayers().length,
      voted: s.votes ? s.votes.size : 0,
      chooseSeconds: rc.config.CHOOSE_SECONDS,
      characters: rc.roomCharacters(),
    };
  },
};
