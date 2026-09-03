// ── GAME MODE: QUIZ ──────────────────────────────────────────────────────────
// The reference implementation of a game mode. Read this alongside the
// "Adding a game mode" section of the README.
//
// A mode is a plain object with lifecycle methods. The core calls them and
// passes a `ctx` (see server/gameManager.js -> _ctx) which is the only way a
// mode talks to the outside world.
//
// Flow:
//   host clicks "Starta Quiz"  -> onStart -> shows question 1
//   players tap an option      -> onPlayerMessage records the answer
//   all answered (or host taps "Visa svar") -> reveal: score + bar chart
//   host taps "Nästa fråga"    -> onHostMessage -> next question
//   after the last question    -> "final" screen, host taps "Tillbaka till lobbyn"

const QUESTIONS = require('./questions');

const QUESTIONS_PER_ROUND = 8;
const POINTS_CORRECT = 100;

function createQuizMode() {
  return {
    // ── identity (also declared in server/modes/index.js) ──
    id: 'quiz',
    name: 'Quiz',
    minPlayers: 1,

    // ── lifecycle ──────────────────────────────────────────────────────────

    /** Called once when the host starts this mode. */
    onStart(ctx) {
      this.ctx = ctx;
      ctx.resetScores();
      this.questions = QUESTIONS.slice(0, QUESTIONS_PER_ROUND);
      this.index = 0;
      this.phase = 'idle'; // 'question' | 'revealed' | 'done'
      this.answers = new Map(); // playerId -> chosen option index (this question)
      this._ask();
    },

    /** Called once when the mode is torn down (after ctx.endMode()). */
    onEnd() {
      this.ctx = null;
    },

    // ── host controls ─────────────────────────────────────────────────────

    onHostMessage(ctx, msg) {
      switch (msg.action) {
        case 'reveal':
          if (this.phase === 'question') this._reveal();
          break;
        case 'next':
          if (this.phase !== 'revealed') break;
          this.index += 1;
          if (this.index < this.questions.length) this._ask();
          else this._finish();
          break;
        case 'exit':
          if (this.phase === 'done') ctx.endMode();
          break;
      }
    },

    // ── player input ─────────────────────────────────────────────────────

    onPlayerMessage(ctx, player, msg) {
      if (this.phase !== 'question') return;
      const choice = msg.data && msg.data.choice;
      if (typeof choice !== 'number') return;
      if (this.answers.has(player.id)) return; // one answer per question

      const q = this.questions[this.index];
      if (choice < 0 || choice >= q.options.length) return;

      this.answers.set(player.id, choice);
      ctx.toPlayer(player.id, 'mode_state', {
        modeId: this.id,
        view: 'answered',
        data: { choice },
      });
      this._pushHostProgress();

      // Auto-reveal once every connected player has answered.
      const connected = ctx.players();
      if (connected.length > 0 && connected.every((p) => this.answers.has(p.id))) {
        this._reveal();
      }
    },

    onPlayerLeave() {
      if (this.phase === 'question') this._pushHostProgress();
    },

    /** Give a (re)joining player the current screen mid-game. */
    onPlayerJoin(ctx, player) {
      if (this.phase === 'question') {
        const q = this.questions[this.index];
        ctx.toPlayer(player.id, 'mode_state', {
          modeId: this.id,
          view: 'question',
          data: {
            index: this.index,
            total: this.questions.length,
            question: q.q,
            options: q.options,
          },
        });
      }
    },

    // ── internal helpers ─────────────────────────────────────────────────

    /** Broadcast the current question to host + players. */
    _ask() {
      const ctx = this.ctx;
      this.phase = 'question';
      this.answers = new Map();

      const q = this.questions[this.index];
      const common = {
        index: this.index,
        total: this.questions.length,
        question: q.q,
        options: q.options,
      };

      ctx.toHost('mode_state', {
        modeId: this.id,
        view: 'question',
        data: { ...common, answered: 0, totalPlayers: ctx.players().length },
      });
      ctx.toAllPlayers('mode_state', {
        modeId: this.id,
        view: 'question',
        data: common,
      });
    },

    /** Update just the "N / M have answered" line on the host screen. */
    _pushHostProgress() {
      const ctx = this.ctx;
      const q = this.questions[this.index];
      ctx.toHost('mode_state', {
        modeId: this.id,
        view: 'question',
        data: {
          index: this.index,
          total: this.questions.length,
          question: q.q,
          options: q.options,
          answered: this.answers.size,
          totalPlayers: ctx.players().length,
        },
      });
    },

    /** Score the question and show the answer + a vote bar chart. */
    _reveal() {
      const ctx = this.ctx;
      this.phase = 'revealed';
      const q = this.questions[this.index];

      const counts = q.options.map(() => 0);
      const results = {}; // playerId -> { choice, correct, gained }

      for (const player of ctx.lobby.players.values()) {
        if (!this.answers.has(player.id)) continue;
        const choice = this.answers.get(player.id);
        counts[choice] += 1;
        const correct = choice === q.correct;
        const gained = correct ? POINTS_CORRECT : 0;
        if (gained) ctx.addScore(player.id, gained);
        results[player.id] = { choice, correct, gained };
      }

      ctx.broadcast('mode_state', {
        modeId: this.id,
        view: 'reveal',
        data: {
          index: this.index,
          total: this.questions.length,
          question: q.q,
          options: q.options,
          correct: q.correct,
          counts,
          results,
          standings: ctx.standings(),
          hasNext: this.index + 1 < this.questions.length,
        },
      });
    },

    /** After the last question: show the final scoreboard. */
    _finish() {
      const ctx = this.ctx;
      this.phase = 'done';
      ctx.broadcast('mode_state', {
        modeId: this.id,
        view: 'final',
        data: { standings: ctx.standings() },
      });
      // The host stays on this screen until they tap "Tillbaka till lobbyn",
      // which sends { action: 'exit' } -> ctx.endMode().
    },
  };
}

module.exports = createQuizMode;
