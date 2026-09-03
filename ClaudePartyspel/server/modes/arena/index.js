// ── GAME MODE: ARENA (the core game loop) ────────────────────────────────────
// Between rounds the host shows "Rummet". The host clicks "Nästa runda" to run
// one round. Each round is one of the pluggable ROUND TYPES in
// server/modes/arena/rounds/ (quiz, choose, ...), picked at random by weight
// (config ROUND_TYPE_WEIGHTS).
//
// This file owns everything a round type is NOT allowed to care about:
//   - the shared round value (starts at ROUND_VALUE_START, +ROUND_VALUE_STEP
//     after every completed round, any type)
//   - the moose random event and its multiplier
//   - the result animation timing and the return to "Rummet"
//   - the golf leaderboard (lowest total wins -> _standings sorts ascending)
//
// A round type only ever sees the `rc` object built by _rc() below.

const CONFIG = require('./config');
const rounds = require('./rounds');

function createArenaMode() {
  return {
    id: 'arena',
    name: 'Arena',
    minPlayers: CONFIG.MIN_PLAYERS,

    // ── lifecycle ────────────────────────────────────────────────────────

    onStart(ctx) {
      this.ctx = ctx;
      this.roundValue = CONFIG.ROUND_VALUE_START;
      this.timers = [];
      this.roundNonce = 0;
      this.phase = 'room'; // 'room' | 'moose' | 'round' | 'result'
      this.round = null; // active round-type module
      this.roundState = null; // its per-round scratch state

      // ── Älgen (slumphändelse ovanpå rundlogiken) ──
      this.mooseVisits = 0; // gånger älgen dykt upp denna omgång
      this.mooseActive = false; // aktiv för den PÅGÅENDE rundan?
      this.mooseMultiplier = 1; // 1 = ingen älg

      rounds.resetAll();
      this._toRoom();
    },

    onEnd() {
      this._clearTimers();
      this.ctx = null;
    },

    // ── host controls ───────────────────────────────────────────────────

    onHostMessage(ctx, msg) {
      if (msg.action === 'next_round' && this.phase === 'room') {
        this._maybeMoose(() => this._startRound());
      } else if (msg.action === 'exit' && this.phase === 'room') {
        ctx.endMode();
      }
    },

    // Redraw the current screen for a host that (re)connected mid-game.
    onHostJoin(ctx) {
      if (this.phase === 'room') {
        ctx.toHost('mode_state', { modeId: this.id, view: 'room', data: this._roomData() });
      } else if (this.phase === 'moose') {
        ctx.toHost('mode_state', { modeId: this.id, view: 'moose', data: this._mooseData() });
      } else if (this.phase === 'round' && this.round) {
        this.round.syncHost(this._rc());
      }
    },

    // ── player input ────────────────────────────────────────────────────

    onPlayerMessage(ctx, player, msg) {
      if (this.phase === 'round' && this.round) {
        this.round.onPlayerMessage(this._rc(), player, msg);
      }
    },

    onPlayerLeave(ctx, player) {
      if (this.phase === 'round' && this.round && this.round.onPlayerLeave) {
        const abort = this.round.onPlayerLeave(this._rc(), player);
        if (abort) {
          this._clearTimers();
          this._toRoom(`${player.name} kopplade från — rundan avbröts.`);
        }
      }
    },

    onPlayerJoin(ctx, player) {
      if (!this.ctx) return;
      if (this.phase === 'room' || this.phase === 'result') {
        this.ctx.toPlayer(player.id, 'mode_state', {
          modeId: this.id,
          view: 'room',
          data: { roundValue: this.roundValue, standings: this._standings(), you: player.id },
        });
      } else if (this.phase === 'moose') {
        this.ctx.toPlayer(player.id, 'mode_state', {
          modeId: this.id,
          view: 'moose',
          data: this._mooseData(),
        });
      } else if (this.phase === 'round' && this.round) {
        this.round.syncPlayer(this._rc(), player);
      }
    },

    // ── round lifecycle (core) ─────────────────────────────────────────

    _toRoom(notice) {
      this.phase = 'room';
      this.round = null;
      this.roundState = null;
      this.mooseActive = false; // the moose only affects the round it appeared for
      this.mooseMultiplier = 1;

      this.ctx.toHost('mode_state', {
        modeId: this.id,
        view: 'room',
        data: this._roomData(notice ? { notice } : null),
      });
      for (const p of this.ctx.lobby.connectedPlayers()) {
        this.ctx.toPlayer(p.id, 'mode_state', {
          modeId: this.id,
          view: 'room',
          data: { roundValue: this.roundValue, standings: this._standings(), you: p.id },
        });
      }
    },

    _startRound() {
      this._clearTimers();
      const ready = this.ctx.lobby.readyPlayers();
      if (ready.length < CONFIG.MIN_PLAYERS) {
        // Bail back to the room (also clears any moose that was rolled).
        this._toRoom(`Behöver minst ${CONFIG.MIN_PLAYERS} spelare med karaktär.`);
        return;
      }
      this.phase = 'round';
      this.roundNonce += 1;
      this.roundState = {};
      this.round = rounds.pickRoundType();
      this.round.start(this._rc());
    },

    /** A round type calls rc.finish(extra) to end its round. */
    _finishRound(extra) {
      extra = extra || {};
      this._clearTimers();
      this.phase = 'result';
      this.ctx.broadcast('mode_state', {
        modeId: this.id,
        view: extra.view || 'result',
        data: Object.assign(
          {
            roundValue: this.roundValue,
            moose: this.mooseActive
              ? { active: true, multiplier: this.mooseMultiplier, visits: this.mooseVisits }
              : { active: false },
            standings: this._standings(),
          },
          extra.data || {}
        ),
      });
      this._setTimer(() => this._endRound(), CONFIG.RESULT_SECONDS * 1000);
    },

    _endRound() {
      this.roundValue += CONFIG.ROUND_VALUE_STEP;
      this._toRoom();
    },

    // ── Älgen ─────────────────────────────────────────────────────────
    // Rolled before every round. If she turns up, the whole round's payouts
    // are multiplied and a "BOOOOSE MOOOOSE" overlay plays first. Effects get
    // more intense with every visit this session.

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

    _mooseData() {
      return {
        visits: this.mooseVisits,
        multiplier: this.mooseMultiplier,
        // Grows with every visit -> the client makes effects bigger/faster/louder.
        intensity: this.mooseVisits,
        roundValue: this.roundValue,
      };
    },

    // ── the round context handed to round types ───────────────────────

    _rc() {
      const self = this;
      return {
        ctx: this.ctx,
        config: CONFIG,
        state: this.roundState,

        get roundValue() {
          return self.roundValue;
        },
        get roundNonce() {
          return self.roundNonce;
        },
        get moose() {
          return {
            active: self.mooseActive,
            multiplier: self.mooseMultiplier,
            visits: self.mooseVisits,
          };
        },

        players: () => self.ctx.lobby.connectedPlayers(),
        readyPlayers: () => self.ctx.lobby.readyPlayers(),
        characters: () => self.ctx.lobby.characters,
        roomCharacters: () => self._roomCharacters(),
        standings: () => self._standings(),

        // `units` = how many round-values are at stake (quiz: 1; choose: vote count).
        points: (units) => self._points(units),
        addScore: (playerId, units) => self.ctx.addScore(playerId, self._points(units)),

        toHost: (view, data) =>
          self.ctx.toHost('mode_state', { modeId: self.id, view, data }),
        toPlayer: (id, view, data) =>
          self.ctx.toPlayer(id, 'mode_state', { modeId: self.id, view, data }),
        toAllPlayers: (view, data) => {
          for (const p of self.ctx.lobby.connectedPlayers()) {
            self.ctx.toPlayer(p.id, 'mode_state', { modeId: self.id, view, data });
          }
        },
        broadcast: (view, data) =>
          self.ctx.broadcast('mode_state', { modeId: self.id, view, data }),

        setTimer: (fn, ms) => self._setTimer(fn, ms),
        finish: (extra) => self._finishRound(extra),
      };
    },

    // ── shared helpers ───────────────────────────────────────────────

    /** `units` round-values, active moose multiplier included. */
    _points(units) {
      const u = units == null ? 1 : units;
      return u * this.roundValue * (this.mooseActive ? this.mooseMultiplier : 1);
    },

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
