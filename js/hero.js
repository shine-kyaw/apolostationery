/* ==========================================================================
   APOLO — "The page that fills itself"
   Scene timeline. Maps scroll progress to visual state; owns nothing generic
   (that's engine.js) and no asset data (that's assets.js).

   SCENE MAP (p = smoothed scroll progress over the film track)

     00  THE BLANK PAGE      0.000–0.075  paper breathes, headline holds
     02  THE PENCIL ARRIVES  0.045–0.135  flies in, hesitates, touches down
                             0.075–0.150  headline lifts away *under* it
     03  THE FIRST MARK      0.115–0.400  one line draws a house, slowing
                                          into every corner
                             0.320–0.395  the door, a second short stroke
                             0.400–0.470  the pencil lifts off; a held beat
     04  THE TRANSFORMATION  0.440–0.590  the roof flattens into a notebook
                             0.500–0.585  the page itself appears beneath it
                             0.545–0.660  ruled lines and the red margin
     05  THE PRODUCTS        0.515–0.915  real APOLO objects slide on and settle
         THE CAMERA          0.340–0.960  close → medium → wide → very wide
     06  THE BRAND           0.880–1.000  the page keeps the logo. Magenta —
                                          held back all film — finally lands.
   ========================================================================== */

import {
  clamp, lerp, range, track, ease, noise,
  resample, resampleSegments, waver, morph, toPath, arcLengths, pointAt,
  createClock, createPointer
} from './engine.js';
import {
  OBJECTS, MOBILE_KEEP, MOBILE_LAYOUT, CATEGORIES, PENCIL, LOGO, SHOP, url
} from './assets.js';
import { createAudio } from './audio.js';

const $ = s => document.querySelector(s);
const reduced  = matchMedia('(prefers-reduced-motion: reduce)');
const mqMobile = matchMedia('(max-width: 820px)');

/* --------------------------------------------------------------------------
   0 · the handoff grid — always built, on every code path. It is real
   navigation, not decoration, so it must exist even if the film never runs.
   -------------------------------------------------------------------------- */
$('#cats').innerHTML = CATEGORIES.map((c, i) => `
  <a class="cat" href="${SHOP}/collections/${c.handle}">
    <span class="cat__i">${String(i + 1).padStart(2, '0')}</span>
    <h3>${c.title}</h3>
    <span class="my" lang="my">${c.my}</span>
    <p>${c.blurb}</p>
    <span class="cat__go"><i></i>${c.n} products</span>
  </a>`).join('');

boot();
/* A change of motion preference restructures the whole stage; rebuilding it
   in place is more code than it is worth for an event nobody fires twice. */
reduced.addEventListener('change', () => location.reload());

/* ========================================================================== */
function boot() {

const stage   = $('#stage');
const world   = $('#world');
const paper   = $('#paper');
const sheet   = $('#sheet');
const svg     = $('#draw');
const strokeEl= $('#stroke');
const doorEl  = $('#door');
const ruling  = $('#ruling');
const lay     = $('#lay');
const settleEl= $('#settle');
const ask     = $('#ask');
const brand   = $('#brand');
const cue     = $('#cue');
const slateEl = $('#slate');

const isMobile = () => mqMobile.matches;
const mobile   = isMobile();
const still    = reduced.matches;          // reduced motion: one static frame

/* --------------------------------------------------------------------------
   1 · the two keyshapes
   Both loops are traversed the same way — along the bottom left→right, up the
   right side, across the top right→left, down the left side, and a few units
   past the start. Because the traversal matches point for point, the morph is
   a plain lerp and the roof apex necessarily lands on the notebook's top edge:
   the roof flattens rather than melting.

   The overrun past the closing corner is deliberate. Nobody drawing a box by
   hand stops exactly where they started.
   -------------------------------------------------------------------------- */
const PER = 26;                                    // points per edge, both shapes
const HOUSE = waver(resampleSegments([
  /* floor L→R      right wall     roof up       roof down    left wall    close + overrun */
  [300,472],[700,472],[700,296],[500,168],[300,296],[300,472],[326,474]
], PER), 3.4, 1);
const BOOK  = waver(resampleSegments([
  [340,538],[660,538],[660, 98],[500, 98],[340, 98],[340,538],[366,540]
], PER), 0.7, 1);

/* The door: a second, shorter stroke. Drawn while the walls are still fresh. */
const DOOR = waver(resample([[452,472],[452,368],[548,368],[548,472]], 40), 1.6, 5);
doorEl.setAttribute('d', toPath(DOOR));

/* Working buffers reused every frame — the morph never allocates. */
let PTS = HOUSE.map(p => p.slice());
let CUM = arcLengths(PTS);
let lastShape = -1;

/* --------------------------------------------------------------------------
   2 · the drawing speed
   A person does not draw at a constant rate: they run along a straight and
   brake into every corner. `warp` converts even time into uneven arc length
   by integrating a speed profile that dips at each corner of the house, then
   inverting it. Built once; it is a lookup after that.
   -------------------------------------------------------------------------- */
const CORNERS = [0.319, 0.460, 0.649, 0.839, 0.979]; // corners, as arc fractions
const warp = speedWarp(s => {
  let v = 1;
  for (const c of CORNERS) v -= 0.60 * Math.exp(-(((s - c) / 0.052) ** 2));
  return Math.max(0.18, v);
});

function speedWarp(speed, n = 257) {
  const t = new Float64Array(n);
  for (let i = 1; i < n; i++) t[i] = t[i-1] + 1 / speed((i - 0.5) / (n - 1));
  const total = t[n-1];
  for (let i = 0; i < n; i++) t[i] /= total;         // t[i] = time to reach s=i/(n-1)
  return u => {                                       // invert: time → arc length
    u = clamp(u);
    let lo = 0, hi = n - 1;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (t[m] <= u) lo = m; else hi = m; }
    const span = t[hi] - t[lo] || 1;
    return (lo + (u - t[lo]) / span) / (n - 1);
  };
}

/* --------------------------------------------------------------------------
   3 · the ruled page
   Straight lines only, so every dash length is known without asking the DOM.
   `pathLength="100"` normalises the dash units, which also sidesteps the
   reason the original reveal leaked: with `vector-effect: non-scaling-stroke`
   Chrome measures dashes in device space, so a dasharray taken from
   getTotalLength() (user space) is short and the tail of the path stays lit.
   -------------------------------------------------------------------------- */
const RULE_Y = [];
for (let y = 150; y <= 514; y += 26) RULE_Y.push(y);
ruling.innerHTML =
  `<path class="rule rule--margin" pathLength="100" d="M396 116 L396 524"></path>` +
  RULE_Y.map(y => `<path class="rule" pathLength="100" d="M362 ${y} L638 ${y}"></path>`).join('');
const marginEl = ruling.querySelector('.rule--margin');
const ruleEls  = [...ruling.querySelectorAll('.rule:not(.rule--margin)')];

/* --------------------------------------------------------------------------
   4 · the pencil
   -------------------------------------------------------------------------- */
const pencil = document.createElement('div');
pencil.className = 'pencil';
{
  const c = PENCIL.crop;
  const aspect = (c[2] - c[0]) / (c[3] - c[1]);
  pencil.style.cssText =
    `--cx0:${c[0]};--cy0:${c[1]};--cx1:${c[2]};--cy1:${c[3]};` +
    `--w:${(PENCIL.len * aspect).toFixed(3)}vmin;` +
    `--tx:${PENCIL.tip[0] * 100}%;--ty:${PENCIL.tip[1] * 100}%`;
}
pencil.innerHTML =
  `<span class="pencil__shadow"></span>
   <i class="pencil__c"><img src="${url(PENCIL.src, 520)}" alt=""
        fetchpriority="high" decoding="async"></i>`;
lay.appendChild(pencil);
const pencilImg = pencil.querySelector("img");

/* The artwork points tip-up. Rotating the body down-and-right of its own point
   is how a right hand holds a pencil in a top-down shot, and it keeps the body
   off the part of the page that has not been drawn yet. */
const TILT = -28;

/* --------------------------------------------------------------------------
   5 · the flat-lay
   -------------------------------------------------------------------------- */
const items = (mobile ? OBJECTS.filter(o => MOBILE_KEEP.has(o.id)) : OBJECTS)
  .map(src => {
    const o  = mobile ? { ...src, ...(MOBILE_LAYOUT[src.id] || {}) } : { ...src };
    const c  = o.crop;
    const ar = (c[2] - c[0]) / (c[3] - c[1]);
    /* `len` is the long edge; the short edge comes from the crop, so an object
       can never be stretched and re-cropping never silently resizes it. */
    o.w = ar < 1 ? o.len * ar : o.len;

    const el = document.createElement('div');
    el.className = 'obj' + (o.kind === 'sheet' ? ' obj--sheet' : '');
    el.style.cssText =
      `--w:${o.w.toFixed(3)}vmin;--cx0:${c[0]};--cy0:${c[1]};--cx1:${c[2]};--cy1:${c[3]};` +
      `z-index:${o.z}`;
    const crop = document.createElement("i");
    crop.className = "obj__c";
    const img = document.createElement("img");
    img.alt = ""; img.decoding = "async"; img.fetchPriority = "low";
    img.addEventListener("load",  () => el.classList.add("is-ready"), { once: true });
    img.addEventListener("error", () => el.classList.add("is-failed"), { once: true });
    crop.appendChild(img); el.appendChild(crop);
    lay.appendChild(el);

    o.el = el; o.img = img; o.lit = false;
    return o;
  });

/* Product photography waits for the pencil: it is the only image on screen for
   the first third of the film, and fourteen product JPEGs queued in front of it
   is the difference between the pencil arriving on cue and arriving late. */
function loadProducts() {
  if (loadProducts.done) return;
  loadProducts.done = true;
  for (const o of items) o.img.src = url(o.src);
}
if (pencilImg.complete) queueLoad(); else {
  pencilImg.addEventListener('load', queueLoad, { once: true });
  pencilImg.addEventListener('error', queueLoad, { once: true });
}
function queueLoad() {
  stage.classList.add('is-armed');            // reveals the scroll cue
  (window.requestIdleCallback || (f => setTimeout(f, 200)))(loadProducts, { timeout: 1500 });
}
setTimeout(queueLoad, 2500);                  // never let a stalled CDN hide the cue

/* --------------------------------------------------------------------------
   6 · sound — synthesised, no files, off until asked for
   -------------------------------------------------------------------------- */
const audio = createAudio();
const soundBtn = $('#sound'), soundLabel = $('#soundLabel');
soundBtn.addEventListener('click', async () => {
  const on = await audio.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  soundLabel.textContent = on ? 'Sound on' : 'Sound off';
});

/* --------------------------------------------------------------------------
   6b · the shot slate
   A film has scene headings; this one labels itself in the corner the way a
   slate does on set. It is the only piece of chrome that persists through the
   whole piece, and it quietly tells the visitor the film has structure —
   which is what stops a long scroll feeling like an unbroken tunnel.
   -------------------------------------------------------------------------- */
const SLATES = [
  [0.000, '01', 'The blank page',  'APOLO A-221C, 2B'],
  [0.135, '02', 'The first mark',  'One continuous line'],
  [0.440, '03', 'The page',        'Exercise ruling, 100 GSM'],
  [0.585, '04', 'The desk',        '14 APOLO products'],
  [0.905, '05', 'APOLO',           'Yangon, Myanmar']
];
let slateIdx = -1, slateTimer = 0;
function setSlate(p) {
  let i = 0;
  while (i < SLATES.length - 1 && p >= SLATES[i + 1][0]) i++;
  if (i === slateIdx) return;
  const first = slateIdx === -1;
  slateIdx = i;
  const write = () => {
    const [, n, t, d] = SLATES[i];
    slateEl.innerHTML = `<span>${n}</span> ${t} &mdash; <i>${d}</i>`;
    slateEl.style.setProperty('--slate', '0.85');
  };
  if (first) { write(); return; }
  slateEl.style.setProperty('--slate', '0');   // .32s CSS fade, then swap
  clearTimeout(slateTimer);
  slateTimer = setTimeout(write, 320);
}

/* --------------------------------------------------------------------------
   7 · cached geometry
   Nothing in the frame loop is allowed to read layout. Everything the film
   needs about the size of the stage is measured here, on resize only.
   -------------------------------------------------------------------------- */
/* The drawing lives in its own coordinate space, and the viewBox is *derived*
   from the frame rather than fixed. A fixed 1000x620 box with `meet` is sized
   by whichever axis is tighter, so on a 390x844 phone the house came out at
   40% of the screen width — the drawing, which is the whole film, read as a
   small diagram floating in a big empty page. Framing the content box instead
   keeps the house at ~75% of the frame's width on every shape of screen. */
const ART = { cx: 500, cy: 320, w: 460, h: 500 };   // what must always be in shot
const FILL_X = 0.86, FILL_Y = 0.80;                 // how much of the frame it may use

const M = { w: 0, h: 0, s: 1, x0: 0, y0: 0, vmin: 0 };
function measure() {
  M.w = world.clientWidth  || 1;
  M.h = world.clientHeight || 1;
  M.vmin = Math.min(M.w, M.h) / 100;
  M.s  = Math.min(M.w * FILL_X / ART.w, M.h * FILL_Y / ART.h);
  const vbW = M.w / M.s, vbH = M.h / M.s;
  M.x0 = ART.cx - vbW / 2;
  M.y0 = ART.cy - vbH / 2;
  /* viewBox aspect equals the element's by construction, so `meet` is exact */
  svg.setAttribute('viewBox',
    `${M.x0.toFixed(1)} ${M.y0.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`);

  /* the notebook page, in stage pixels, from the BOOK keyshape's own rect */
  const tl = toStage(340, 98);
  sheet.style.left   = tl.x + 'px';
  sheet.style.top    = tl.y + 'px';
  sheet.style.width  = (320 * M.s) + 'px';
  sheet.style.height = (440 * M.s) + 'px';
}
const toStage = (ux, uy) => ({ x: (ux - M.x0) * M.s, y: (uy - M.y0) * M.s });
measure();
addEventListener('resize', measure, { passive: true });

/* --------------------------------------------------------------------------
   8 · the frame
   -------------------------------------------------------------------------- */
/* The camera track: four named distances, not one long scale-down, so each
   leg can decelerate into the next without the middle of the move stalling.
   A phone starts further back in effect (its drawing already fills more of
   the frame) so it needs — and can take — much less pull-back before the
   composition stops reading. */
const CAM = mobile ? [
  [0.00, 1.000], [0.34, 0.985], [0.46, 0.972],
  [0.62, 0.900], [0.79, 0.790], [0.92, 0.720], [1.00, 0.705]
] : [
  [0.00, 1.000],   // CLOSE      the sheet is bigger than the frame
  [0.34, 0.965],   //            a slow drift in, so the shot is never dead
  [0.46, 0.940],
  [0.62, 0.800],   // MEDIUM     the notebook, whole, with air around it
  [0.79, 0.640],   // WIDE       the products are inside the frame
  [0.92, 0.545],   // VERY WIDE  the sheet is an object on a desk
  [1.00, 0.528]
];

const pointer = createPointer();
let prevDrawn = 0, bookLanded = false, brandLive = false;

function frame(p) {
  const pt = pointer.update();
  const px = pt.x, py = pt.y;

  /* ---- the camera -------------------------------------------------------
     Four distinct distances rather than one long scale-down: close on the
     paper, medium on the notebook, wide on the products, very wide on the
     whole desk. A piecewise track means each leg can decelerate into the next
     without the middle of the move stalling. */
  const cam = track(p, CAM);
  const pull = range(cam, 1.0, CAM[CAM.length - 1][1]);   // 0…1 "how far back"
  const camY = track(p, [[0,0],[0.46,-0.4],[0.92,-0.4],[1,-0.5]]) + py * 0.55 * (1 - pull);

  stage.style.setProperty('--cam', cam.toFixed(4));
  stage.style.setProperty('--cam-y', camY.toFixed(2) + 'vmin');

  /* The sheet stops being "the world" and becomes an object lying on a desk:
     corners round off, a real shadow grows underneath it. */
  paper.style.setProperty('--paper-r', (pull * 9).toFixed(1) + 'px');
  paper.style.setProperty('--paper-shadow', pull < 0.015 ? 'none'
    : `0 ${(pull*2.6).toFixed(2)}vmin ${(pull*8).toFixed(2)}vmin rgba(72,52,38,${(pull*0.17).toFixed(3)})`);

  /* ---- 00 · the blank page ---------------------------------------------- */
  const askOut = ease.inOut(range(p, 0.075, 0.150));
  ask.style.setProperty('--ask', (1 - askOut).toFixed(3));
  ask.style.setProperty('--ask-y', (askOut * -5 + py * 0.45).toFixed(2) + 'vmin');
  ask.style.setProperty('--ask-b', (askOut * 5).toFixed(2) + 'px');
  cue.style.setProperty('--cue', (1 - range(p, 0.015, 0.055)).toFixed(3));
  setSlate(p);

  /* ---- 03–04 · the line -------------------------------------------------- */
  const shape = ease.inOut(range(p, 0.440, 0.585));      // house → notebook
  if (Math.abs(shape - lastShape) > 0.0015 || (shape === 0) !== (lastShape === 0)
      || (shape === 1) !== (lastShape === 1)) {
    PTS = shape === 0 ? HOUSE : shape === 1 ? BOOK : morph(HOUSE, BOOK, shape);
    CUM = arcLengths(PTS);
    strokeEl.setAttribute('d', toPath(PTS));
    lastShape = shape;
  }

  const drawn = warp(range(p, 0.115, 0.400));
  strokeEl.style.strokeDashoffset = (100 * (1 - drawn)).toFixed(3);

  /* Graphite while a pencil is making it; once it has become a printed
     notebook the line settles to a light rule. It is never magenta — the
     brand colour is saved for the last eight percent of the film. */
  const printed = ease.inOut(range(p, 0.480, 0.650));
  strokeEl.style.setProperty('--ink-mix', printed.toFixed(3));
  strokeEl.style.strokeWidth = lerp(3.4, 1.9, printed).toFixed(2);
  strokeEl.style.opacity = (1 - range(p, 0.86, 0.99) * 0.45).toFixed(3);

  const doorDrawn = ease.out(range(p, 0.320, 0.395));
  doorEl.style.strokeDashoffset = (100 * (1 - doorDrawn)).toFixed(2);
  doorEl.style.opacity = (doorDrawn * (1 - ease.inOut(range(p, 0.450, 0.530)))).toFixed(3);

  /* ---- the page appears underneath the outline --------------------------- */
  const pageIn = ease.out(range(p, 0.560, 0.648));
  sheet.style.setProperty('--page-o', pageIn.toFixed(3));
  sheet.style.setProperty('--page-s', (lerp(0.985, 1, pageIn)).toFixed(4));
  sheet.style.setProperty('--page-lift', (pageIn * (1 - range(p, 0.92, 1) * 0.4)).toFixed(3));

  /* ---- the ruling -------------------------------------------------------- */
  const dim = 1 - range(p, 0.885, 0.99) * 0.42;           // make room for the logo
  marginEl.style.strokeDashoffset = (100 * (1 - ease.out(range(p, 0.600, 0.662)))).toFixed(2);
  marginEl.style.opacity = (0.85 * dim * pageIn).toFixed(3);
  for (let i = 0; i < ruleEls.length; i++) {
    const a = 0.612 + (i / ruleEls.length) * 0.086;
    const t = ease.out(range(p, a, a + 0.048));
    ruleEls[i].style.strokeDashoffset = (100 * (1 - t)).toFixed(2);
    ruleEls[i].style.opacity = (t * 0.85 * dim).toFixed(3);
  }

  /* ---- 02 · the pencil ---------------------------------------------------
     The tip is sampled from the line itself, so the mark is genuinely made by
     the pencil rather than timed alongside it. Everything else — the hover
     before it lands, the wrist rotation, the wobble, the lift-off — is layered
     on top of that one honest anchor. */
  const arrive = ease.out(range(p, 0.045, 0.128));
  const land   = ease.settle(range(p, 0.100, 0.150));    // hover → paper contact
  const leave  = ease.inOut(range(p, 0.400, 0.470));
  const penOn  = Math.min(arrive * 1.35, 1) * (1 - leave);

  if (penOn > 0.002) {
    const s   = CUM[CUM.length - 1] * clamp(drawn, 0.0004, 1);
    const a   = pointAt(PTS, CUM, s);
    const tip = toStage(a.x, a.y);

    /* Nobody's hand is a plotter. A slow wobble along the run, perpendicular
       to the stroke, keeps the pencil alive without letting it leave the line. */
    const wob = noise(s * 0.020, 2) * 1.6 * M.s * (1 - leave);
    const rad = a.angle * Math.PI / 180;
    tip.x += -Math.sin(rad) * wob;
    tip.y +=  Math.cos(rad) * wob;

    /* in from off-frame bottom-right, out to the top-right */
    const from = { x: M.w * 1.05, y: M.h * 1.30 };
    const to   = { x: tip.x + M.w * 0.34, y: tip.y - M.h * 0.52 };
    const x = lerp(lerp(from.x, tip.x, arrive), to.x, leave);
    /* the hover: still a few millimetres off the page until `land` completes */
    const hover = (1 - land) * M.h * 0.045;
    const y = lerp(lerp(from.y, tip.y, arrive), to.y, leave) - hover;

    /* The wrist turns with the stroke, but only a little — the grip does not
       change just because the line does. */
    const lean = Math.sin(rad) * 8 + noise(s * 0.011, 7) * 2.2;
    const rot  = TILT + lean * (1 - leave) + leave * 34 + px * 1.4 * (1 - leave);

    pencil.style.transform =
      `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)` +
      ` translate(calc(-1 * var(--tx)), calc(-1 * var(--ty)))`;
    pencil.style.setProperty('--pen-o', penOn.toFixed(3));
    /* shadow reads the height off the page: tight on contact, soft in the air */
    pencil.style.setProperty('--pen-lift', (Math.max(1 - land, leave)).toFixed(3));

    const speed = Math.abs(drawn - prevDrawn);
    audio.scratch(drawn > 0.0005 && drawn < 0.9995 ? land * (1 - leave) : 0, speed);
    if (land > 0.5 && !audio.tapped) { audio.tap(); audio.tapped = true; }
  } else {
    pencil.style.setProperty('--pen-o', '0');
    audio.scratch(0, 0);
  }
  prevDrawn = drawn;

  /* ---- 05 · the products -------------------------------------------------
     Each object has its own vector onto the page, its own moment, and one
     small damped wobble after it lands. Nothing simply fades up. */
  for (const o of items) {
    const a = 0.545 + o.delay * 0.28;
    const q = range(p, a, a + 0.140);
    if (q === 0) {                                   // not yet — write nothing
      if (o.lit) { o.el.style.opacity = '0'; o.lit = false; }
      continue;
    }
    o.lit = true;
    const t = ease.settle(q);
    const d = (o.z + 1) / 4;                          // 0.25 (far) … 1 (near)

    /* Fake depth: as the camera pulls back, near objects grow and spread a
       little faster than far ones. Cheaper and calmer than a real perspective. */
    const persp = 1 + (o.z - 1.5) * 0.045 * pull;
    const ox = lerp(o.x + o.from[0], o.x, t) * persp + px * d * 2.1 * (0.35 + 0.65 * pull);
    const oy = lerp(o.y + o.from[1], o.y, t) * persp + py * d * 1.5 * (0.35 + 0.65 * pull);

    /* settle: one damped oscillation, dying within a fifth of the timeline */
    const wob = ease.damp(range(p, a + 0.09, a + 0.30), 1.25, 6) * 1.5;
    const rot = lerp(o.r - 20 * Math.sign(o.from[0] || 1), o.r, t) + wob + px * d * 1.1;
    const sc  = lerp(0.88, 1, t) * persp;

    o.el.style.transform =
      `translate3d(calc(-50% + ${ox.toFixed(2)}vmin), calc(-50% + ${oy.toFixed(2)}vmin), 0)` +
      ` rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    o.el.style.opacity = clamp(q * 2.4).toFixed(3);
    o.el.style.setProperty('--lift', (1 - t).toFixed(3));

    if (o.id === 'drawing-book' && t > 0.55 && !bookLanded) { bookLanded = true; audio.thud(); }
  }

  /* ---- 06 · the brand ----------------------------------------------------
     No magenta flood. The film has been paper, graphite and product colour for
     fifty seconds; the payoff is that the page it drew keeps the mark. A warm
     veil lifts the middle of the sheet so the logo has somewhere to sit, and
     the products stay exactly where the camera found them. */
  const veil = ease.inOut(range(p, 0.878, 0.958));
  settleEl.style.setProperty('--veil', veil.toFixed(3));

  const bIn = ease.out(range(p, 0.912, 0.995));
  brand.style.setProperty('--brand', bIn.toFixed(3));
  brand.style.setProperty('--brand-y', (lerp(2.2, 0, bIn) + py * 0.25).toFixed(2) + 'vmin');
  brand.style.setProperty('--brand-s', (lerp(0.965, 1, bIn) + px * 0.003).toFixed(4));
  /* the last mark of the film: one magenta stroke, drawn like all the others */
  brand.style.setProperty("--underline", ease.out(range(p, 0.950, 1.0)).toFixed(3));
  const live = bIn > 0.35;
  if (live !== brandLive) { brand.classList.toggle('is-live', live); brandLive = live; }

  audio.whoosh(pull);
}

/* --------------------------------------------------------------------------
   9 · run it
   -------------------------------------------------------------------------- */
if (still) {
  /* Reduced motion: no clock, no scroll coupling — but not a blank page
     either. We render one frame from deep in the film, where the drawing is
     finished, the products have landed and the brand has resolved, then let
     CSS lay the whole thing out as a static composition. The concept still
     reads; it simply doesn't move. */
  document.documentElement.classList.add('is-still');
  loadProducts();
  measure();
  frame(0.915);
  addEventListener("resize", () => { measure(); frame(0.915); }, { passive: true });
} else {
  const clock = createClock($('#film'), stage, frame);

  /* Pointer parallax has to keep rendering after the scroll has settled, but
     only while the smoothed pointer is still catching up. */
  if (pointer.enabled) {
    addEventListener('pointermove', () => clock.kick(), { passive: true });
    const chase = () => { if (pointer.moving) clock.kick(); requestAnimationFrame(chase); };
    requestAnimationFrame(chase);
  }

  /* The breakpoint changes which objects exist at all, so crossing it rebuilds. */
  mqMobile.addEventListener('change', () => location.reload());

  /* Keyboard: the CTA lives at the end of the film. Tabbing to it while the
     film is at the start would move focus somewhere invisible, so focusing it
     takes the film with you. */
  $('#cta').addEventListener('focus', () => {
    if (clock.progress < 0.9) {
      const film = $('#film');
      scrollTo({ top: film.offsetTop + film.offsetHeight - stage.offsetHeight, behavior: 'instant' });
    }
  });

  /* QA handle. Documented in docs/TECHNICAL.md; five lines, no cost, and the
     only practical way to inspect a scroll film at an exact frame. */
  window.APOLO = {
    /** Pin the film to an exact frame without moving the page. */
    seek: f => clock.seek(f),
    /** Hand the film back to the scrollbar. */
    release: () => clock.release(),
    get progress() { return clock.progress; },
    items, PENCIL
  };
}

/* CTA: a small tactile click, only if the visitor turned sound on */
$('#cta').addEventListener('pointerenter', () => audio.click());

/* The logo is the one image we never want missing */
$('#mark').src = LOGO;

}
