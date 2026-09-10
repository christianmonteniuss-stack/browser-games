// ── SHARED SOUND EFFECTS ─────────────────────────────────────────────────────
// A tiny WebAudio synth — no audio files to ship. One shared AudioContext,
// unlocked on the first user gesture (browsers block audio until then).
//
// Used by both the host view and the player view:
//   window.SFX.unlock()              call from a click / tap / keydown handler
//   window.SFX.play('win')           fire a named one-shot
//   window.SFX.tick(progress)        one metronome blip (0..1 raises pitch/volume)
//   window.SFX.startLoop(onBeat)     accelerating metronome (reaction-test build-up)
//   window.SFX.stopLoop()            stop the metronome
//
// Every effect is a short amplitude envelope over one or two oscillators, so
// the whole thing is a few hundred bytes of code and cannot fail to load.

(function () {
  'use strict';

  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    // A near-silent blip — satisfies iOS' "must produce sound in a gesture" rule.
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      g.gain.value = 0.0001;
      o.connect(g).connect(master);
      o.start();
      o.stop(c.currentTime + 0.02);
    } catch (e) {
      /* ignore */
    }
  }

  // One enveloped tone.
  function tone(freq, t0, dur, opts) {
    opts = opts || {};
    const type = opts.type || 'sine';
    const gain = opts.gain == null ? 0.3 : opts.gain;
    const attack = opts.attack == null ? 0.005 : opts.attack;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (opts.glideTo) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.glideTo), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  // A burst of filtered white noise (claps / risers / the moose stomp).
  function noise(t0, dur, opts) {
    opts = opts || {};
    const gain = opts.gain == null ? 0.3 : opts.gain;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = opts.hp == null ? 800 : opts.hp;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(master);
    src.start(t0);
  }

  const RECIPES = {
    join: (t) => {
      tone(523, t, 0.12, { type: 'triangle', gain: 0.22 });
      tone(784, t + 0.09, 0.16, { type: 'triangle', gain: 0.22 });
    },
    vote: (t) => tone(660, t, 0.08, { type: 'square', gain: 0.14 }),
    reveal: (t) => {
      tone(440, t, 0.1, { type: 'triangle', gain: 0.18 });
      tone(660, t + 0.08, 0.14, { type: 'triangle', gain: 0.18 });
    },
    signal: (t) => {
      tone(180, t, 0.4, { type: 'sawtooth', gain: 0.4, glideTo: 80 });
      noise(t, 0.28, { gain: 0.35, hp: 500 });
    },
    correct: (t) => {
      tone(880, t, 0.11, { type: 'triangle', gain: 0.3 });
      tone(1320, t + 0.1, 0.18, { type: 'triangle', gain: 0.3 });
    },
    wrong: (t) => {
      tone(220, t, 0.32, { type: 'square', gain: 0.25, glideTo: 130 });
    },
    win: (t) => {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, t + i * 0.1, 0.24, { type: 'triangle', gain: 0.3 })
      );
      noise(t + 0.42, 0.4, { gain: 0.14, hp: 4000 });
    },
    lose: (t) => {
      tone(300, t, 0.5, { type: 'sawtooth', gain: 0.3, glideTo: 110 });
      tone(150, t + 0.06, 0.5, { type: 'square', gain: 0.2, glideTo: 65 });
    },
    fanfare: (t) => {
      [392, 523, 659, 784, 1047].forEach((f, i) =>
        tone(f, t + i * 0.13, 0.32, { type: 'triangle', gain: 0.32 })
      );
      noise(t + 0.7, 0.5, { gain: 0.12, hp: 3500 });
    },
    moose: (t) => {
      tone(90, t, 0.7, { type: 'sawtooth', gain: 0.4, glideTo: 55 });
      tone(140, t + 0.1, 0.6, { type: 'square', gain: 0.24, glideTo: 85 });
      noise(t, 0.5, { gain: 0.2, hp: 250 });
    },
  };

  let loopTimer = null;

  window.SFX = {
    unlock: unlock,

    play: function (name) {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      const r = RECIPES[name];
      if (r) r(ctx.currentTime + 0.001);
    },

    // Single metronome blip; `progress` 0..1 raises the pitch and volume.
    tick: function (progress) {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      const p = Math.max(0, Math.min(1, progress || 0));
      tone(500 + p * 900, ctx.currentTime + 0.001, 0.05, {
        type: 'square',
        gain: 0.1 + p * 0.14,
      });
    },

    // Accelerating metronome for the reaction-test build-up. `onBeat(progress,
    // beat)` fires on every beat so the caller can flash the screen in time.
    startLoop: function (onBeat) {
      this.stopLoop();
      let beat = 0;
      const schedule = () => {
        const p = Math.min(1, beat / 16);
        if (typeof onBeat === 'function') onBeat(p, beat);
        beat += 1;
        const interval = 520 - p * 300; // 520 ms → 220 ms
        loopTimer = setTimeout(schedule, interval);
      };
      schedule();
    },

    stopLoop: function () {
      if (loopTimer) {
        clearTimeout(loopTimer);
        loopTimer = null;
      }
    },

    // Speak a phrase out loud via the browser's speech synthesis (used for the
    // "boooooze moooose" announcer). No-op where speech synthesis is missing.
    say: function (text, opts) {
      opts = opts || {};
      if (
        typeof window === 'undefined' ||
        !window.speechSynthesis ||
        !window.SpeechSynthesisUtterance
      ) {
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const u = new window.SpeechSynthesisUtterance(String(text));
        u.rate = opts.rate == null ? 0.6 : opts.rate;
        u.pitch = opts.pitch == null ? 0.7 : opts.pitch;
        u.volume = opts.volume == null ? 1 : opts.volume;
        const voices = cachedVoices.length
          ? cachedVoices
          : window.speechSynthesis.getVoices() || [];
        const en = voices.find((v) => /^en(-|$)/i.test(v.lang || ''));
        if (en) u.voice = en;
        window.speechSynthesis.speak(u);
      } catch (e) {
        /* ignore */
      }
    },
  };

  // Voice list loads asynchronously in some browsers — cache it when ready.
  let cachedVoices = [];
  function loadVoices() {
    try {
      cachedVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    } catch (e) {
      cachedVoices = [];
    }
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    loadVoices();
    try {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    } catch (e) {
      /* ignore */
    }
  }
})();
