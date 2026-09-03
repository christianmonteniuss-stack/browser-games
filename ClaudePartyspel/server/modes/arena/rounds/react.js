// ── ROUND TYPE: REACTION TEST ───────────────────────────────────────────────
// Host flashes a big moving "C" and a strobing background (pure hype). Every
// phone shows a big button + "Vänta...". After a random REACT_DELAY the "C"
// freezes — that is the signal — and every phone flips to "TRYCK NU!". The
// server times each tap from the moment it SENT the signal (as fair as we can
// get across the network).
//
// Sorted fastest -> slowest. Rank r (0-based) scores  r × round value ×
// active moose multiplier — so the fastest gets 0. Anyone who has not tapped
// REACT_MAX_SECONDS after the signal is counted as slowest.
//
// rc.state:
//   phase    'wait' | 'go' | 'done'
//   signalAt server ms timestamp when the signal fired
//   taps     Map(playerId -> reactionMs)

module.exports = {
  id: 'react',

  start(rc) {
    const s = rc.state;
    s.phase = 'wait';
    s.signalAt = 0;
    s.taps = new Map();

    rc.toHost('react', { phase: 'wait', roundValue: rc.roundValue });
    for (const p of rc.readyPlayers()) {
      rc.toPlayer(p.id, 'react', { phase: 'wait', roundValue: rc.roundValue });
    }

    const min = rc.config.REACT_DELAY_MIN;
    const max = rc.config.REACT_DELAY_MAX;
    const delayMs = (min + Math.random() * Math.max(0, max - min)) * 1000;
    rc.setTimer(() => this._signal(rc), delayMs);
  },

  _signal(rc) {
    const s = rc.state;
    if (s.phase !== 'wait') return;
    s.phase = 'go';
    s.signalAt = Date.now();

    const total = rc.readyPlayers().length;
    rc.toHost('react', { phase: 'go', roundValue: rc.roundValue, tapped: 0, total });
    for (const p of rc.readyPlayers()) {
      rc.toPlayer(p.id, 'react', { phase: 'go', roundValue: rc.roundValue });
    }

    rc.setTimer(() => {
      if (rc.state.phase === 'go') this._finish(rc);
    }, rc.config.REACT_MAX_SECONDS * 1000);
  },

  onPlayerMessage(rc, player, msg) {
    const s = rc.state;
    if (s.phase !== 'go' || msg.action !== 'tap') return; // ignore pre-signal / post-finish taps
    if (s.taps.has(player.id)) return; // one tap per player

    const ms = Date.now() - s.signalAt;
    s.taps.set(player.id, ms);

    rc.toPlayer(player.id, 'react', { phase: 'tapped', reactionMs: ms });
    rc.toHost('react', {
      phase: 'go',
      roundValue: rc.roundValue,
      tapped: s.taps.size,
      total: rc.readyPlayers().length,
    });

    const players = rc.readyPlayers();
    if (players.length > 0 && players.every((p) => s.taps.has(p.id))) this._finish(rc);
  },

  _finish(rc) {
    const s = rc.state;
    if (s.phase === 'done') return;
    s.phase = 'done';

    const entries = rc.roomCharacters().map((c) => ({
      playerId: c.playerId,
      name: c.name,
      character: c.character,
      reactionMs: s.taps.has(c.playerId) ? s.taps.get(c.playerId) : null,
    }));

    // tappers by time ascending; non-tappers ("sist") after, keeping their order
    entries.sort((a, b) => {
      if (a.reactionMs == null && b.reactionMs == null) return 0;
      if (a.reactionMs == null) return 1;
      if (b.reactionMs == null) return -1;
      return a.reactionMs - b.reactionMs;
    });

    const rows = entries.map((e, rank) => {
      if (rank > 0) rc.addScore(e.playerId, rank); // rank units of round value; fastest (0) scores nothing
      return { ...e, rank, gained: rc.points(rank) };
    });

    rc.finish({ view: 'react_result', data: { rows } });
  },

  syncPlayer(rc, player) {
    const s = rc.state;
    if (s.phase === 'done') return;
    if (s.taps.has(player.id)) {
      rc.toPlayer(player.id, 'react', { phase: 'tapped', reactionMs: s.taps.get(player.id) });
    } else {
      rc.toPlayer(player.id, 'react', {
        phase: s.phase === 'go' ? 'go' : 'wait',
        roundValue: rc.roundValue,
      });
    }
  },

  syncHost(rc) {
    const s = rc.state;
    if (s.phase === 'wait') {
      rc.toHost('react', { phase: 'wait', roundValue: rc.roundValue });
    } else {
      rc.toHost('react', {
        phase: 'go',
        roundValue: rc.roundValue,
        tapped: s.taps.size,
        total: rc.readyPlayers().length,
      });
    }
  },

  onPlayerLeave(rc, player) {
    const s = rc.state;
    if (s.phase !== 'go') return false;
    const players = rc.readyPlayers();
    if (players.length > 0 && players.every((p) => s.taps.has(p.id))) this._finish(rc);
    else {
      rc.toHost('react', {
        phase: 'go',
        roundValue: rc.roundValue,
        tapped: s.taps.size,
        total: players.length,
      });
    }
    return false; // a reaction round never aborts on a leaver
  },
};
