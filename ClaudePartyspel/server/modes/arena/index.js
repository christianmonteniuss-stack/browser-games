// ── GAME MODE: ARENA (the core game loop) ────────────────────────────────────
// Between rounds the host shows "Rummet" (all characters side by side). The
// host clicks "Nästa runda" to run one round:
//
//   1. Server picks ONE random connected character. Its avatar blinks in the
//      room and a sound plays (host screen). roundNonce bumps so the client
//      plays the sound exactly once.
//   2. That player's phone shows a question (4 options); everyone else sees
//      "X svarar…"; the host shows a countdown.
//   3. Correct  -> the player points at another character, who gets points
//      equal to the current round value. All screens: "Let's go, <name>!".
//   4. Wrong (or timeout) -> the player who answered gets the round value
//      themselves. All screens: "You suck, <name>!".
//   5. After the animation the round value increases by the step and we return
//      to the room.
//
// Scoring is GOLF: lowest total wins. Getting points is bad. The leaderboard
// (built here as `_standings()`) is sorted ascending.
//
// The mode talks to the outside world only through `ctx` (see
// server/gameManager.js -> _ctx). Its own state is the phase machine below.

const CONFIG = require('./config');
const QUESTIONS = require('./questions');

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function createArenaMode() {
  return {
    id: 'arena',
    name: 'Arena',
    minPlayers: CONFIG.MIN_PLAYERS,

    // ── lifecycle ────────────────────────────────────────────────────────

    onStart(ctx) {
      this.ctx = ctx;
      this.roundValue = CONFIG.ROUND_VALUE_START;
      this.questionQueue = shuffled(QUESTIONS);
      this.timers = [];
      this.roundNonce = 0;
      this.phase = 'room'; // 'room' | 'moose' | 'question' | 'pick' | 'result'
      this.chosen = null;
      this.question = null;
      this.answered = false;

      // ── Älgen (slumphändelse ovanpå rundlogiken) ──
      this.mooseVisits = 0; // antal gånger älgen dykt upp denna omgång
      this.mooseActive = false; // aktiv för den PÅGÅENDE rundan?
      this.mooseMultiplier = 1; // 1 = ingen älg

      this._toRoom();
    },

    onEnd() {
      this._clearTimers();
      this.ctx = null;
    },

    // ── host controls ───────────────────────────────────────────────────

    onHostMessage(ctx, msg) {
      if (msg.action === 'next_round' && this.phase === 'room') {
        // Roll for the moose before the round actually starts.
        this._maybeMoose(() => this._startRound());
      } else if (msg.action === 'exit' && this.phase === 'room') {
        ctx.endMode();
      }
    },

    // ── player input ────────────────────────────────────────────────────

    onPlayerMessage(ctx, player, msg) {
      const isChosen = this.chosen && player.id === this.chosen.id;

      if (this.phase === 'question' && isChosen && msg.action === 'answer') {
        if (this.answered) return;
        const choice = msg.data && msg.data.choice;
        if (typeof choice !== 'number') return;
        this.answered = true;
        this._clearTimers();
        this._resolveAnswer(choice);
      } else if (this.phase === 'pick' && isChosen && msg.action === 'award') {
        const targetId = msg.data && msg.data.targetId;
        const target = this._readyOthers(this.chosen.id).find((p) => p.id === targetId);
        if (!target) return;
        this._clearTimers();
        this._award(target);
      }
    },

    onPlayerLeave(ctx, player) {
      // If the active player drops mid-round, abort cleanly back to the room
      // (no points, no round-value change).
      if (
        (this.phase === 'question' || this.phase === 'pick') &&
        this.chosen &&
        player.id === this.chosen.id
      ) {
        this._clearTimers();
        this._toRoom(`${player.name} kopplade från — rundan avbröts.`);
      }
    },

    onPlayerJoin(ctx, player) {
      this._sendStateTo(player);
    },

    // Re-sync a host screen that (re)connected while a round is running.
    onHostJoin(ctx) {
      if (this.phase === 'room') {
        ctx.toHost('mode_state', { modeId: this.id, view: 'room', data: this._roomData() });
      } else if (this.phase === 'moose') {
        ctx.toHost('mode_state', { modeId: this.id, view: 'moose', data: this._mooseData() });
      } else if (this.phase === 'question') {
        ctx.toHost('mode_state', { modeId: this.id, view: 'round', data: this._roundHostData(false) });
      } else if (this.phase === 'pick') {
        ctx.toHost('mode_state', {
          modeId: this.id,
          view: 'pick',
          data: {
            chosenName: this.chosen.name,
            roundValue: this.roundValue,
            characters: this._roomCharacters(),
          },
        });
      }
    },

    // ── phase transitions ──────────────────────────────────────────────

    _toRoom(notice) {
      this.phase = 'room';
      this.chosen = null;
      this.question = null;
      this.answered = false;
      this.mooseActive = false; // the moose only affects the round it appeared for
      this.mooseMultiplier = 1;

      this.ctx.toHost('mode_state', {
        modeId: this.id,
        view: 'room',
        data: this._roomData(notice ? { notice } : null),
      });
      for (const p of this._connectedPlayers()) {
        this.ctx.toPlayer(p.id, 'mode_state', {
          modeId: this.id,
          view: 'room',
          data: { roundValue: this.roundValue, standings: this._standings(), you: p.id },
        });
      }
    },

    _startRound() {
      const ready = this.ctx.lobby.readyPlayers();
      if (ready.length < CONFIG.MIN_PLAYERS) {
        // Bail back to the room (also clears any moose that was rolled).
        this._toRoom(`Behöver minst ${CONFIG.MIN_PLAYERS} spelare med karaktär.`);
        return;
      }

      this.phase = 'question';
      this.answered = false;
      this.roundNonce += 1;
      this.chosen = pickRandom(ready);

      if (this.questionQueue.length === 0) this.questionQueue = shuffled(QUESTIONS);
      this.question = this.questionQueue.shift();

      const publicQuestion = { q: this.question.q, options: this.question.options };

      this.ctx.toHost('mode_state', {
        modeId: this.id,
        view: 'round',
        data: this._roundHostData(true),
      });

      for (const p of this._connectedPlayers()) {
        if (p.id === this.chosen.id) {
          this.ctx.toPlayer(p.id, 'mode_state', {
            modeId: this.id,
            view: 'answer',
            data: {
              roundValue: this.roundValue,
              question: publicQuestion,
              answerSeconds: CONFIG.ANSWER_SECONDS,
            },
          });
        } else {
          this.ctx.toPlayer(p.id, 'mode_state', {
            modeId: this.id,
            view: 'waiting',
            data: { chosenName: this.chosen.name, roundValue: this.roundValue },
          });
        }
      }

      this._setTimer(() => {
        if (this.phase === 'question' && !this.answered) {
          this.answered = true;
          this._resolveAnswer(null); // timeout counts as wrong
        }
      }, CONFIG.ANSWER_SECONDS * 1000);
    },

    _resolveAnswer(choice) {
      const correct = choice === this.question.correct;

      if (correct) {
        this.phase = 'pick';
        const others = this._readyOthers(this.chosen.id);

        this.ctx.toHost('mode_state', {
          modeId: this.id,
          view: 'pick',
          data: {
            chosenName: this.chosen.name,
            roundValue: this.roundValue,
            characters: this._roomCharacters(),
          },
        });

        for (const p of this._connectedPlayers()) {
          if (p.id === this.chosen.id) {
            this.ctx.toPlayer(p.id, 'mode_state', {
              modeId: this.id,
              view: 'pick',
              data: {
                roundValue: this.roundValue,
                candidates: others.map((o) => ({
                  id: o.id,
                  name: o.name,
                  characterId: o.characterId,
                })),
              },
            });
          } else {
            this.ctx.toPlayer(p.id, 'mode_state', {
              modeId: this.id,
              view: 'waiting',
              data: { chosenName: this.chosen.name, note: 'correct', roundValue: this.roundValue },
            });
          }
        }

        this._setTimer(() => {
          if (this.phase !== 'pick') return;
          const pool = this._readyOthers(this.chosen.id);
          if (pool.length) this._award(pickRandom(pool));
          else this._endRound();
        }, CONFIG.PICK_SECONDS * 1000);
      } else {
        // Wrong / timeout: the player who answered takes the (bad) points.
        this.ctx.addScore(this.chosen.id, this._points());
        this._showResult('miss', this.chosen.name);
      }
    },

    _award(target) {
      this.ctx.addScore(target.id, this._points());
      this._showResult('celebrate', target.name);
    },

    _showResult(kind, name) {
      this.phase = 'result';
      this.ctx.broadcast('mode_state', {
        modeId: this.id,
        view: 'result',
        data: {
          kind,
          name,
          roundValue: this.roundValue,
          pointsAwarded: this._points(),
          moose: this.mooseActive
            ? { active: true, multiplier: this.mooseMultiplier, visits: this.mooseVisits }
            : { active: false },
          standings: this._standings(),
        },
      });
      this._setTimer(() => this._endRound(), CONFIG.RESULT_SECONDS * 1000);
    },

    _endRound() {
      this.roundValue += CONFIG.ROUND_VALUE_STEP;
      this._toRoom();
    },

    // ── Älgen ─────────────────────────────────────────────────────────
    // Rolled before every round (see onHostMessage). If she turns up, the
    // whole round's payouts are multiplied and a "BOOOOSE MOOOOSE" overlay
    // plays first. Effects get more intense with every visit this session.

    _maybeMoose(then) {
      if (Math.random() < CONFIG.MOOSE_CHANCE) {
        this.mooseVisits += 1;
        this.mooseActive = true;
        this.mooseMultiplier = CONFIG.MOOSE_BASE_MULTIPLIER + (this.mooseVisits - 1);
        this.phase = 'moose';
        this.ctx.broadcast('mode_state', {
          modeId: this.id,
          view: 'moose',
          data: this._mooseData(),
        });
        this._setTimer(() => {
          if (this.phase === 'moose') then();
        }, CONFIG.MOOSE_INTRO_SECONDS * 1000);
      } else {
        this.mooseActive = false;
        this.mooseMultiplier = 1;
        then();
      }
    },

    /** Points at stake this round, moose multiplier included. */
    _points() {
      return this.roundValue * (this.mooseActive ? this.mooseMultiplier : 1);
    },

    _mooseData() {
      return {
        visits: this.mooseVisits,
        multiplier: this.mooseMultiplier,
        // Grows with every visit -> the client makes effects bigger/faster/louder.
        intensity: this.mooseVisits,
        roundValue: this.roundValue,
      };
    },

    // ── data builders ──────────────────────────────────────────────────

    /** Golf order: lowest score first. */
    _standings() {
      return this.ctx
        .standings()
        .slice()
        .sort((a, b) => a.score - b.score);
    },

    /** Connected players who picked a character, with their character + score. */
    _roomCharacters() {
      const roster = this.ctx.lobby.characters;
      return this.ctx.lobby
        .connectedPlayers()
        .filter((p) => p.characterId)
        .map((p) => ({
          playerId: p.id,
          name: p.name,
          score: p.score,
          character: roster.find((c) => c.id === p.characterId) || null,
        }))
        .sort((a, b) => a.score - b.score);
    },

    _roomData(extra) {
      return Object.assign(
        {
          roundValue: this.roundValue,
          standings: this._standings(),
          characters: this._roomCharacters(),
          canStart: this.ctx.lobby.readyPlayers().length >= CONFIG.MIN_PLAYERS,
          minPlayers: CONFIG.MIN_PLAYERS,
          mooseVisits: this.mooseVisits,
        },
        extra || {}
      );
    },

    _roundHostData(playSound) {
      return {
        roundNonce: this.roundNonce,
        roundValue: this.roundValue,
        chosenId: this.chosen.id,
        chosenName: this.chosen.name,
        answerSeconds: CONFIG.ANSWER_SECONDS,
        characters: this._roomCharacters(),
        sound: !!playSound,
      };
    },

    // ── helpers ───────────────────────────────────────────────────────

    _connectedPlayers() {
      return this.ctx.lobby.connectedPlayers();
    },

    _readyOthers(exceptId) {
      return this.ctx.lobby.readyPlayers().filter((p) => p.id !== exceptId);
    },

    _sendStateTo(player) {
      if (!this.ctx) return;
      const V = (view, data) =>
        this.ctx.toPlayer(player.id, 'mode_state', { modeId: this.id, view, data });
      const isChosen = this.chosen && player.id === this.chosen.id;

      if (this.phase === 'room' || this.phase === 'result') {
        V('room', { roundValue: this.roundValue, standings: this._standings(), you: player.id });
      } else if (this.phase === 'moose') {
        V('moose', this._mooseData());
      } else if (this.phase === 'question') {
        if (isChosen) {
          V('answer', {
            roundValue: this.roundValue,
            question: { q: this.question.q, options: this.question.options },
            answerSeconds: CONFIG.ANSWER_SECONDS,
          });
        } else {
          V('waiting', { chosenName: this.chosen ? this.chosen.name : '', roundValue: this.roundValue });
        }
      } else if (this.phase === 'pick') {
        if (isChosen) {
          V('pick', {
            roundValue: this.roundValue,
            candidates: this._readyOthers(this.chosen.id).map((o) => ({
              id: o.id,
              name: o.name,
              characterId: o.characterId,
            })),
          });
        } else {
          V('waiting', {
            chosenName: this.chosen ? this.chosen.name : '',
            note: 'correct',
            roundValue: this.roundValue,
          });
        }
      }
    },

    _setTimer(fn, ms) {
      const id = setTimeout(fn, ms);
      this.timers.push(id);
      return id;
    },
    _clearTimers() {
      for (const id of this.timers) clearTimeout(id);
      this.timers = [];
    },
  };
}

module.exports = createArenaMode;
