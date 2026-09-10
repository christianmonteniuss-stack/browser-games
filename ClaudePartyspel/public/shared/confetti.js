// ── SHARED CONFETTI ──────────────────────────────────────────────────────────
// A one-shot canvas confetti burst. No dependencies. Used by both views on
// wins and game-over screens.
//
//   window.Confetti.burst()                        default burst from mid-top
//   window.Confetti.burst({ count, x, y, colors }) x / y are 0..1 of viewport
//
// The canvas removes itself once every particle has fallen off-screen.

(function () {
  'use strict';

  const PALETTE = ['#ffd23f', '#ff5da2', '#3ddad7', '#a3e635', '#8b5cf6', '#38bdf8', '#fb7185'];

  function burst(opts) {
    opts = opts || {};
    if (typeof document === 'undefined' || !document.body) return;

    const count = opts.count || 130;
    const colors = opts.colors || PALETTE;
    const cv = document.createElement('canvas');
    cv.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.floor(window.innerWidth * dpr);
    cv.height = Math.floor(window.innerHeight * dpr);
    document.body.appendChild(cv);

    const c = cv.getContext('2d');
    c.scale(dpr, dpr);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const ox = (opts.x == null ? 0.5 : opts.x) * W;
    const oy = (opts.y == null ? 0.32 : opts.y) * H;

    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 9;
      parts.push({
        x: ox,
        y: oy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 5,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.4,
        col: colors[(Math.random() * colors.length) | 0],
      });
    }

    const t0 = performance.now();
    let last = t0;

    function frame(now) {
      const dt = Math.min(34, now - last) / 16;
      last = now;
      const age = (now - t0) / 2600;
      c.clearRect(0, 0, W, H);
      let alive = 0;

      for (const p of parts) {
        p.vy += 0.2 * dt;
        p.vx *= 0.992;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const life = 1 - age;
        if (life > 0 && p.y < H + 40) {
          alive++;
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.globalAlpha = Math.max(0, Math.min(1, life));
          c.fillStyle = p.col;
          c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          c.restore();
        }
      }

      if (alive > 0) requestAnimationFrame(frame);
      else cv.remove();
    }

    requestAnimationFrame(frame);
  }

  window.Confetti = { burst: burst };
})();
