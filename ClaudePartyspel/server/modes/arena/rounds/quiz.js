// ── ROUND TYPE: QUIZ ─────────────────────────────────────────────────────────
// One random character is put on the spot with a 4-option question.
//   correct       -> they point at another character, who takes 1× the round value
//   wrong/timeout -> they take it themselves
//
// Sub-phase lives in rc.state.sub: 'question' -> 'pick'. All round state lives
// on rc.state; this module keeps no per-round state of its own.

const { shuffled, pickRandom } = require('../util');
const QUESTIONS = require('../questions');

let queue = shuffled(QUESTIONS);

module.exports = {
  id: 'quiz',

  /** Re-shuffle the question queue (called at game start). */
  reset() {
    queue = shuffled(QUESTIONS);
  },

  start(rc) {
    const s = rc.state;
    s.chosen = pickRandom(rc.readyPlayers());
    s.sub = 'question';
    s.answered = false;
    if (queue.length === 0) queue = shuffled(QUESTIONS);
    s.question = queue.shift();

    const pub = { q: s.question.q, options: s.question.options };

    rc.toHost('round', {
      roundNonce: rc.roundNonce,
      roundValue: rc.roundValue,
      chosenId: s.chosen.id,
      chosenName: s.chosen.name,
      answerSeconds: rc.config.ANSWER_SECONDS,
      characters: rc.roomCharacters(),
      sound: true,
    });
    for (const p of rc.players()) {
      if (p.id === s.chosen.id) {
        rc.toPlayer(p.id, 'answer', {
          roundValue: rc.roundValue,
          question: pub,
          answerSeconds: rc.config.ANSWER_SECONDS,
        });
      } else {
        rc.toPlayer(p.id, 'waiting', { chosenName: s.chosen.name, roundValue: rc.roundValue });
      }
    }

    rc.setTimer(() => {
      if (rc.state.sub === 'question' && !rc.state.answered) {
        rc.state.answered = true;
        this._resolve(rc, null); // timeout counts as wrong
      }
    }, rc.config.ANSWER_SECONDS * 1000);
  },

  onPlayerMessage(rc, player, msg) {
    const s = rc.state;
    const isChosen = s.chosen && player.id === s.chosen.id;

    if (s.sub === 'question' && isChosen && msg.action === 'answer') {
      if (s.answered) return;
      const choice = msg.data && msg.data.choice;
      if (typeof choice !== 'number') return;
      s.answered = true;
      this._resolve(rc, choice);
    } else if (s.sub === 'pick' && isChosen && msg.action === 'award') {
      const targetId = msg.data && msg.data.targetId;
      // The bounce room includes the answerer themselves — self-pick allowed.
      const target = rc.readyPlayers().find((p) => p.id === targetId);
      if (!target) return;
      rc.addScore(target.id, 1);
      rc.finish({
        view: 'result',
        data: {
          kind: 'celebrate',
          name: target.name,
          scoredId: target.id,
          pointsAwarded: rc.points(1),
        },
      });
    }
  },

  _resolve(rc, choice) {
    const s = rc.state;
    const correct = choice === s.question.correct;

    if (correct) {
      s.sub = 'pick';
      s.pickCandidates = this._pickCandidates(rc); // shuffled, NO names, incl. self
      rc.toHost('pick', {
        chosenName: s.chosen.name,
        roundValue: rc.roundValue,
        characters: rc.roomCharacters(),
      });
      for (const p of rc.players()) {
        if (p.id === s.chosen.id) {
          rc.toPlayer(p.id, 'pick', {
            roundValue: rc.roundValue,
            candidates: s.pickCandidates,
          });
        } else {
          rc.toPlayer(p.id, 'waiting', {
            chosenName: s.chosen.name,
            note: 'correct',
            roundValue: rc.roundValue,
          });
        }
      }
      rc.setTimer(() => {
        if (rc.state.sub !== 'pick') return;
        const pool = this._others(rc);
        if (pool.length) {
          const t = pool[Math.floor(Math.random() * pool.length)];
          rc.addScore(t.id, 1);
          rc.finish({
            view: 'result',
            data: {
              kind: 'celebrate',
              name: t.name,
              scoredId: t.id,
              pointsAwarded: rc.points(1),
            },
          });
        } else {
          rc.finish({
            view: 'result',
            data: { kind: 'celebrate', name: s.chosen.name, scoredId: null, pointsAwarded: 0 },
          });
        }
      }, rc.config.PICK_SECONDS * 1000);
    } else {
      rc.addScore(s.chosen.id, 1);
      rc.finish({
        view: 'result',
        data: {
          kind: 'miss',
          name: s.chosen.name,
          scoredId: s.chosen.id,
          pointsAwarded: rc.points(1),
        },
      });
    }
  },

  _others(rc) {
    const chosen = rc.state.chosen;
    return rc.readyPlayers().filter((p) => chosen && p.id !== chosen.id);
  },

  /**
   * The pick pool sent to the answerer's phone: EVERY ready player (the
   * answerer included, so they can fat-finger themselves), shuffled, and
   * WITHOUT names — the phone shows nameless bouncing figures only.
   */
  _pickCandidates(rc) {
    return shuffled(rc.readyPlayers()).map((p) => ({
      id: p.id,
      characterId: p.characterId,
    }));
  },

  syncPlayer(rc, player) {
    const s = rc.state;
    const isChosen = s.chosen && player.id === s.chosen.id;
    if (s.sub === 'question') {
      if (isChosen) {
        rc.toPlayer(player.id, 'answer', {
          roundValue: rc.roundValue,
          question: { q: s.question.q, options: s.question.options },
          answerSeconds: rc.config.ANSWER_SECONDS,
        });
      } else {
        rc.toPlayer(player.id, 'waiting', {
          chosenName: s.chosen ? s.chosen.name : '',
          roundValue: rc.roundValue,
        });
      }
    } else if (s.sub === 'pick') {
      if (isChosen) {
        rc.toPlayer(player.id, 'pick', {
          roundValue: rc.roundValue,
          candidates: s.pickCandidates || this._pickCandidates(rc),
        });
      } else {
        rc.toPlayer(player.id, 'waiting', {
          chosenName: s.chosen ? s.chosen.name : '',
          note: 'correct',
          roundValue: rc.roundValue,
        });
      }
    }
  },

  syncHost(rc) {
    const s = rc.state;
    if (s.sub === 'question') {
      rc.toHost('round', {
        roundNonce: rc.roundNonce,
        roundValue: rc.roundValue,
        chosenId: s.chosen.id,
        chosenName: s.chosen.name,
        answerSeconds: rc.config.ANSWER_SECONDS,
        characters: rc.roomCharacters(),
        sound: false,
      });
    } else if (s.sub === 'pick') {
      rc.toHost('pick', {
        chosenName: s.chosen.name,
        roundValue: rc.roundValue,
        characters: rc.roomCharacters(),
      });
    }
  },

  /** Abort the round if the player on the spot disconnects. */
  onPlayerLeave(rc, player) {
    return !!(rc.state.chosen && player.id === rc.state.chosen.id);
  },
};
