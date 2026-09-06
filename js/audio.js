/* ==========================================================================
   APOLO — sound
   Synthesised in the Web Audio API. No audio files, nothing to download,
   nothing to decode, nothing to license. Five textures:

     scratch  filtered noise; loudness and brightness track the drawing speed
     tap      the pencil point touching the paper
     thud     something heavier landing on the page
     whoosh   a slow filter sweep while the camera is actually moving
     click    a short tick on the CTA

   Rules this file keeps:
   · The AudioContext is created inside the visitor's click, so autoplay policy
     is satisfied by construction and nothing can make a sound uninvited.
   · Muting ramps a single master gain rather than zeroing nodes, so toggling
     repeatedly can never click, and the context is suspended while off so a
     muted page costs no audio thread.
   · Every level is set through setTargetAtTime, so no value can step.
   · Nothing here is load-bearing: the film is complete with sound off.
   ========================================================================== */

const MASTER = 0.5;      // ceiling for everything below

export function createAudio() {
  let ctx = null, on = false, master = null;
  let scratchGain, scratchFilter, whooshGain, whooshFilter;
  let lastPull = 0, lastAt = 0;

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    /* two seconds of looping pink-ish noise, generated once and shared */
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
    }

    /* graphite on paper: a narrow band, driven by how fast the line is growing */
    const n1 = ctx.createBufferSource();
    n1.buffer = buf; n1.loop = true;
    scratchFilter = ctx.createBiquadFilter();
    scratchFilter.type = 'bandpass';
    scratchFilter.frequency.value = 2100;
    scratchFilter.Q.value = 1.1;
    scratchGain = ctx.createGain();
    scratchGain.gain.value = 0;
    n1.connect(scratchFilter).connect(scratchGain).connect(master);

    /* paper and air: the same noise, swept low and wide, while the camera moves */
    const n2 = ctx.createBufferSource();
    n2.buffer = buf; n2.loop = true;
    whooshFilter = ctx.createBiquadFilter();
    whooshFilter.type = 'lowpass';
    whooshFilter.frequency.value = 340;
    whooshGain = ctx.createGain();
    whooshGain.gain.value = 0;
    n2.connect(whooshFilter).connect(whooshGain).connect(master);

    n1.start(); n2.start();
    return true;
  }

  const live = () => on && ctx && ctx.state === 'running';

  /** One short filtered-noise burst — the physical vocabulary of paper. */
  function burst({ freq, q, type = 'bandpass', gain, decay }) {
    if (!live()) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource();
    const l = Math.floor(ctx.sampleRate * (decay + 0.02));
    const b = ctx.createBuffer(1, l, ctx.sampleRate);
    const c = b.getChannelData(0);
    for (let i = 0; i < l; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / l);
    n.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    n.connect(f).connect(g).connect(master);
    n.start(t); n.stop(t + decay + 0.02);
  }

  return {
    /** Returns the new state. Async because resume() is a promise on Safari. */
    async toggle() {
      if (!ctx && !build()) return false;
      on = !on;
      try {
        if (on) await ctx.resume();
        else {
          master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
          /* let the ramp finish before parking the audio thread */
          setTimeout(() => { if (!on && ctx.state === 'running') ctx.suspend(); }, 220);
        }
      } catch { /* a blocked resume just means no sound; never a broken page */ }
      if (on) master.gain.setTargetAtTime(MASTER, ctx.currentTime, 0.05);
      return on;
    },

    /** @param {number} active 0…1 how much the pencil is in contact
        @param {number} speed  arc-length drawn since the last frame (0…~0.02) */
    scratch(active, speed) {
      if (!live()) return;
      const v = Math.min(speed * 90, 1);
      const t = ctx.currentTime;
      scratchGain.gain.setTargetAtTime(active * v * 0.075, t, 0.05);
      scratchFilter.frequency.setTargetAtTime(1500 + v * 2900, t, 0.09);
    },

    /** @param {number} pull 0…1 camera position. Only sounds while it changes. */
    whoosh(pull) {
      if (!live()) return;
      const t = ctx.currentTime;
      const dt = Math.max(t - lastAt, 1 / 120);
      const v = Math.min(Math.abs(pull - lastPull) / dt * 1.6, 1);
      lastPull = pull; lastAt = t;
      whooshGain.gain.setTargetAtTime(v * 0.075, t, 0.12);
      whooshFilter.frequency.setTargetAtTime(260 + v * 700, t, 0.14);
    },

    tap()  { burst({ freq: 2600, q: 0.7, gain: 0.10, decay: 0.045 }); },
    thud() { burst({ freq:  190, q: 0.5, type: 'lowpass', gain: 0.22, decay: 0.20 }); },

    click() {
      if (!live()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 1650;
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.06);
    }
  };
}
