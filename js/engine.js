/* ==========================================================================
   APOLO — scroll-film engine
   --------------------------------------------------------------------------
   Generic, film-agnostic utilities: maths, easing, polyline geometry, the
   scroll clock and the pointer. Nothing in here knows what a pencil is.

   Design rule that matters for performance: the film must never call an SVG
   geometry API (getTotalLength / getPointAtLength) inside the frame loop —
   those force layout. Every shape here is a plain polyline whose arc length
   is measured once, in JS, when the shape changes. `pointAt()` then samples
   it for free.
   ========================================================================== */

/* ---------- maths ---------- */
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp  = (a, b, t) => a + (b - a) * t;

/** Normalise `p` inside the window [a,b] → 0…1. The core of the timeline. */
export const range = (p, a, b) => clamp((p - a) / (b - a));

/** Piecewise-linear curve through `stops` = [[p, value], …]. Used for the
    camera, where a single easing can't express close → medium → wide → very
    wide without stalling somewhere. `soft` eases each leg instead of cutting. */
export function track(p, stops, soft = ease.inOut) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [pa, va] = stops[i - 1], [pb, vb] = stops[i];
    if (p <= pb) return lerp(va, vb, soft(range(p, pa, pb)));
  }
  return stops[stops.length - 1][1];
}

/* ---------- easing ----------
   Few and deliberate. Every move in the film uses one of these, so the whole
   piece shares one sense of weight. */
export const ease = {
  linear   : t => t,
  in2      : t => t * t,                                  // gather speed
  out      : t => 1 - Math.pow(1 - t, 3),                 // decelerate — reveals
  outQuint : t => 1 - Math.pow(1 - t, 5),                 // long settle — camera
  inOut    : t => (t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2),
  /** Soft overshoot, ~4%. Deliberately not a cartoon bounce. */
  settle   : t => { const c = 1.70158 * 0.42;
                    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  /** One damped oscillation, dying by t=1. For the wobble after an object lands. */
  damp     : (t, cycles = 1.5, decay = 5.5) =>
               Math.sin(t * Math.PI * 2 * cycles) * Math.exp(-t * decay)
};

/** Deterministic 1-D noise, −1…1. Three incommensurable sines: no table, no
    RNG, identical every run — so "organic imperfection" is reproducible. */
export const noise = (x, seed = 0) =>
  ( Math.sin(x * 1.000 + seed * 12.9898) * 0.55
  + Math.sin(x * 2.317 + seed *  7.2310) * 0.30
  + Math.sin(x * 4.731 + seed *  3.7710) * 0.15 );

/* ---------- polyline geometry ---------- */

/** Resample a polyline to exactly `n` evenly spaced points. Both keyshapes go
    through this so a morph is a straight per-point lerp. */
export function resample(pts, n) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i+1][0] - pts[i][0], pts[i+1][1] - pts[i][1]);
    seg.push(d); total += d;
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    let target = total * (i / (n - 1)), acc = 0, j = 0;
    while (j < seg.length - 1 && acc + seg[j] < target) { acc += seg[j]; j++; }
    const t = seg[j] ? (target - acc) / seg[j] : 0;
    out.push([ lerp(pts[j][0], pts[j+1][0], t), lerp(pts[j][1], pts[j+1][1], t) ]);
  }
  return out;
}

/** Resample a polyline giving every *segment* the same number of points.

    This is what makes the morph legible. Resampling by total arc length maps
    point i of A to whatever happens to be at the same distance along B — so
    the house's roof ends up morphing into a chunk of the notebook's side, and
    the shape appears to melt. Corner-matched resampling instead maps vertex to
    vertex: the roof apex goes to the top-edge midpoint, each wall to the wall
    beneath it, and the roof visibly *flattens*. Both keyshapes must therefore
    declare the same number of vertices, in the same traversal order. */
export function resampleSegments(pts, per = 26) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++)
    for (let k = 0; k < per; k++) {
      const t = k / per;
      out.push([ lerp(pts[i][0], pts[i+1][0], t), lerp(pts[i][1], pts[i+1][1], t) ]);
    }
  out.push(pts[pts.length - 1].slice());
  return out;
}

/** Push every point sideways by a little deterministic noise. This is what
    makes the house read as *drawn by a person* rather than plotted: the line
    is never perfectly straight and never perfectly repeatable along its run. */
export function waver(pts, amount, seed = 1) {
  const n = pts.length;
  return pts.map((p, i) => {
    const u = i / (n - 1);
    /* taper the wobble to zero at both ends so the loop still closes cleanly */
    const taper = Math.min(1, Math.sin(u * Math.PI) * 2.2);
    const a = noise(u * 9.0, seed)       * amount * taper;
    const b = noise(u * 9.0, seed + 4.1) * amount * taper;
    return [p[0] + a, p[1] + b];
  });
}

/** Per-point lerp between two equal-length point arrays. */
export const morph = (A, B, t) => A.map((p, i) => [
  lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)
]);

/** Cumulative arc lengths for a polyline. cum[i] = distance from the start to
    point i; cum[n-1] is the total length. Computed once per shape rebuild. */
export function arcLengths(pts) {
  const cum = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++)
    cum[i] = cum[i-1] + Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]);
  return cum;
}

/** Sample a polyline at arc length `s`. Returns position and tangent angle in
    degrees. Binary search, so cost is flat in the number of points. */
export function pointAt(pts, cum, s) {
  const total = cum[cum.length - 1];
  s = clamp(s, 0, total);
  let lo = 0, hi = cum.length - 1;
  while (lo < hi - 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (s - cum[lo]) / seg;
  const dx = pts[hi][0] - pts[lo][0], dy = pts[hi][1] - pts[lo][1];
  return {
    x: lerp(pts[lo][0], pts[hi][0], t),
    y: lerp(pts[lo][1], pts[hi][1], t),
    angle: Math.atan2(dy, dx) * 180 / Math.PI
  };
}

/** Point array → SVG path data, smoothed through segment midpoints.
    Quadratics rather than line joins: at 140 points the corners keep their
    shape but stop looking like a plotter drew them. */
export function toPath(pts) {
  const n = pts.length;
  if (n < 3) return pts.reduce((d, p, i) => d + (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]), '');
  let d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
  for (let i = 1; i < n - 1; i++) {
    const mx = (pts[i][0] + pts[i+1][0]) / 2, my = (pts[i][1] + pts[i+1][1]) / 2;
    d += 'Q' + f(pts[i][0]) + ' ' + f(pts[i][1]) + ' ' + f(mx) + ' ' + f(my);
  }
  return d + 'L' + f(pts[n-1][0]) + ' ' + f(pts[n-1][1]);
}
const f = v => Math.round(v * 10) / 10;

/* ---------- the scroll clock ----------
   Reads scroll once per frame, smooths it so the film carries weight, and
   parks the rAF loop the moment nothing is moving.

   Progress is measured against the *sticky element's* height, not
   innerHeight: on mobile innerHeight changes every time the browser chrome
   slides, and tying the timeline to it makes the film jitter under the thumb.
   -------------------------------------------------------------------------- */
export function createClock(track, sticky, onFrame, { smoothing = 0.13 } = {}) {
  let target = 0, smooth = 0, raf = 0, running = false, travel = 1, held = false;

  const measure = () => { travel = Math.max(1, track.offsetHeight - sticky.offsetHeight); };
  const read = () => {
    if (held) return;                                   // QA: seek() pins the clock
    target = clamp(-track.getBoundingClientRect().top / travel);
  };

  const frame = () => {
    smooth = lerp(smooth, target, smoothing);
    const done = Math.abs(target - smooth) < 0.00012;
    if (done) smooth = target;
    onFrame(smooth);
    if (done) { running = false; raf = 0; return; }      // park until next input
    raf = requestAnimationFrame(frame);
  };

  const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const onScroll = () => { read(); kick(); };
  const onResize = () => { measure(); read(); kick(); };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize, { passive: true });
  /* Coming back to a backgrounded tab: re-sync instead of animating the catch-up. */
  addEventListener('visibilitychange', () => {
    if (!document.hidden) { measure(); read(); smooth = target; onFrame(smooth); }
  });

  measure(); read(); smooth = target; onFrame(smooth);

  return {
    kick,
    get progress() { return smooth; },
    /** QA helper: pin the film to an exact frame, ignoring scroll, so a
        screenshot can be taken of a known state. `release()` hands it back. */
    seek(p) { held = true; smooth = target = clamp(p); onFrame(smooth); },
    release() { held = false; measure(); read(); kick(); },
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
    }
  };
}

/* ---------- pointer ----------
   Normalised −1…1 offset, smoothed, and decaying back to centre when the
   pointer leaves. Drives parallax only; the film is fully legible without it
   and it is never created on a coarse pointer. */
export function createPointer(smoothing = 0.055) {
  const s = { x: 0, y: 0 }, t = { x: 0, y: 0 };
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine) {
    addEventListener('pointermove', e => {
      t.x = (e.clientX / innerWidth  - 0.5) * 2;
      t.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    addEventListener('pointerleave', () => { t.x = 0; t.y = 0; });
  }
  return {
    enabled: fine,
    update() {
      s.x = lerp(s.x, t.x, smoothing);
      s.y = lerp(s.y, t.y, smoothing);
      return s;
    },
    /** True while the smoothed value is still chasing the target — lets the
        clock know it must keep rendering even though scroll has settled. */
    get moving() { return Math.abs(s.x - t.x) > 0.0015 || Math.abs(s.y - t.y) > 0.0015; }
  };
}
