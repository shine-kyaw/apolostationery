# APOLO Hero Film — Handoff / Continuation Notes

Last updated: **2026-09-05** (session 2, "creative-dev + QA pass").
Written so this project can be resumed on a different machine with zero prior
context beyond this file plus [ASSET-INVENTORY.md](ASSET-INVENTORY.md).

**The next brief is already written down: [NEXT-BRIEF-V3.md](NEXT-BRIEF-V3.md).**
Read that after this file. It is the client's V3 direction (turn the film into
an interactive brand world) and it is the actual next task.

---

## 0. TL;DR — where things stand

The film **works end to end** and has been visually QA'd frame by frame on
desktop (1440×900, 1280×800) and mobile (390×844). No console errors.
Session 2 found and fixed a long list of real bugs — several of which meant
the previous version was showing the wrong image entirely (see §2).

There is **one unverified change in flight** — see §3 — do that first.

---

## 1. What this project is

A cinematic, scroll-driven hero for **apolostationey.com** (real Myanmar
stationery brand, live Shopify store), replacing a generic ecommerce banner
with a scroll film, followed by a real product-category handoff grid.

**Concept: "The Page That Fills Itself."**
Blank sheet → an APOLO pencil enters and draws one continuous line → the line
becomes a house → the house flattens into a notebook → ruled exercise-book
lines fill it → real APOLO products settle onto the page → the camera pulls
back to a full flat-lay → the page keeps the APOLO mark.

Chosen because it is buildable entirely from **real, verified Apolo assets**
with no invented brand elements, and because Apolo's own homepage already runs
a "blank sketchbook → drawing" campaign slide (Burmese "ဆွဲမယ်" = "let's draw").

### The one narrative payoff you must not break
`products/Drawing-Book.jpg` — the APOLO Drawing Book cover **is a house with a
door and a window**. The film spends fifteen seconds drawing a house; that book
is the last object to land in the flat-lay. That rhyme is the point of the
whole product act. Do not demote it to "just another product".

---

## 2. What session 2 changed (and why)

### 2.1 Bugs found and fixed — these were breaking the render

| # | Bug | Why it mattered |
|---|-----|-----------------|
| 1 | `vector-effect:non-scaling-stroke` on `.stroke` | **Chrome measures dash patterns in device space when this is set.** The dasharray was taken from `getTotalLength()` (user space), so it was ~30% too short and the tail of the house was visible from p=0. The blank page was never blank. Fixed by removing the property and switching every animated path to `pathLength="100"`. **Do not re-add it.** |
| 2 | Every Tier-A PNG rendered at full frame | The cutouts occupy only **3–4%** of their 1500² frame. `w:4.6vmin` rendered a pen ~0.28vmin wide. Every product was effectively invisible. Fixed by measuring the alpha bounding box of every PNG and adding a `crop` for all of them. |
| 3 | Pencil crop was wrong | Documented as "fixed" last session; it wasn't. Measured true bare-pencil bbox = `[0.368, 0.170, 0.399, 0.806]`; the old crop `[0.360, 0.088, 0.457, 0.808]` was 3× too wide and 8% too high, so the render showed **the 12-pc box, not the pencil**, and the tip sat at 24%/11% of the crop instead of 50%/0.7%. |
| 4 | Pencil `transform-origin` + trailing translate | `transform-origin` applies to the *whole* transform list, so a trailing `translate(-50%,-3%)` dragged the tip off the line by half the pencil's width. Fixed: `transform-origin: 0 0` and translate by `-var(--tx)/-var(--ty)` last. |
| 5 | `.paper` was not centred | `inset:0; margin:auto` with an oversized width resolves left-aligned, so the sheet shrank toward its own off-centre midpoint during the pull-back. Now `left/top:50%` + `translate(-50%,-50%)`. |
| 6 | `overflow:hidden` on `.obj` / `.pencil` | Clipped every contact shadow into a hard rectangle. Fixed by moving the crop window into a child (`.obj__c` / `.pencil__c`) so the shadow falls outside it. |
| 7 | `mix-blend-mode` on tiles inside `.lay` | `.lay` carries the camera transform → it is its own blending group → a tile set to `multiply` has nothing to multiply with and renders opaque. Fixed: the *window* carries `background: var(--paper)` and the `<img>` multiplies onto it. |
| 8 | Paper fibre only on `.paper` | Made every opaque product tile read as a faint pale rectangle. Fixed by moving the fibre to a single `.grain` overlay above the products (**this is the unverified change — see §3**). |
| 9 | Morph resampled by total arc length | Mapped the house's roof onto part of the notebook's side; the shape appeared to melt. Fixed with `resampleSegments()` — corner-matched resampling, so the roof apex goes to the top-edge midpoint and the roof visibly **flattens**. |
| 10 | Fixed `viewBox="0 0 1000 620"` | With `meet` the tighter axis wins, so on a 390×844 phone the house rendered at **40% of the screen width**. Now the viewBox is derived per frame from an `ART` content box; the house is ~75% of the width on every screen shape. |
| 11 | Geometry APIs in the frame loop | `getTotalLength()` on the stroke + 12 rule paths, plus `getPointAtLength`, **every frame** = forced layout every frame. All replaced with JS polyline maths (`arcLengths`/`pointAt`). Zero layout reads in the loop now. |
| 12 | Invisible CTA was focusable/hoverable | The brand block sits at opacity 0 over the whole film. Now `pointer-events:none` until live, plus a `focus` handler that takes the film to the end so keyboard users land somewhere visible. |
| 13 | Skip link never appeared on focus | Was permanently `.u-hidden`. Now a real `.skip` that slides in on `:focus`. |
| 14 | Scissors + ruler assets | `Scissor1.jpg` is a **black blister card** (48% dark pixels) → renders as a black slab under multiply. `RulerSet.jpg` is translucent plastic → nothing survives levelling. Both removed; replaced with the A-191 stapler and a crop of the magenta A-210 sharpener. |

### 2.2 Creative / art-direction changes

- **The line is graphite, not magenta.** A 2B pencil drawing a magenta line was
  a physical lie. Magenta is now held back for exactly three places: the
  Burmese eyebrow, the word "make", and the final brand resolve.
- **The magenta flood at the end is gone.** It destroyed the flat-lay (the
  payoff) and turned the last frame into an advertisement. The ending is now:
  the flat-lay holds, a tight warm veil lifts only the notebook, and the
  **logo resolves on the page the film just drew**, with one magenta underline
  drawn like every other mark in the film.
- **Hand-drawn quality.** `waver()` pushes every point by deterministic noise
  (strong on the house, almost none on the notebook — hand-drawn becomes
  printed). The house path **overruns** its closing corner. `speedWarp()`
  integrates a speed profile that brakes into all five corners, so the drawing
  visibly slows at corners and runs on the straights.
- **Pencil physics.** Hover-then-touchdown with a settle, a slow perpendicular
  wobble along the run, wrist lean that follows the tangent only partly, and a
  shadow whose size/blur/opacity reads height off the page (`--pen-lift`).
- **The notebook is a real element** (`.sheet`), not an SVG rectangle: two
  offset leaves behind it, a shadow that grows as it settles, its own gradient.
- **Camera is a four-stop track** (close / medium / wide / very wide) via
  `track()`, with a separate gentler track for mobile, plus fake depth (near
  objects scale and spread slightly more than far ones as we pull back).
- **Products are art-directed**, not staggered fades: each has an entry vector
  (`from`), its own moment, a settle overshoot, one damped wobble after landing,
  and a shadow that tightens as it lands.
- **Editorial typography.** The headline moved off dead-centre to a low-left
  measure; a **shot slate** in the top-right relabels itself through the film
  (01 The blank page → 02 The first mark → 03 The page → 04 The desk → 05 APOLO).
- **Loading is part of the design.** Product images do not start loading until
  the pencil image is decoded (or 2.5s), and the scroll cue only appears once
  the pencil is ready — nobody is invited to scroll into an empty film.

### 2.3 Audio rewrite
Master-gain muting (no clicks on repeated toggling), context suspended while
off, `async toggle()` for Safari's promise-based `resume()`, scratch driven by
actual arc length drawn per frame, whoosh driven by camera velocity, plus a
`tap()` on pencil touchdown and a `thud()` when the drawing book lands.

---

## 3. ⚠️ IN FLIGHT — do this first

The last edit moved the paper fibre from `.paper::after` to a new shared
`.grain` overlay (`index.html` line ~54, `css/apolo.css` §1.6b) and **was not
visually verified**. Serve the site, go to `p ≈ 0.86`, and check:

1. Product tiles no longer show as faint pale rectangles on the sheet.
2. The overall paper texture still reads (tune `.grain { opacity }`, currently `.3`).
3. `.grain` sits **above** `.lay` and **below** `.light` in the DOM.

If it looks wrong, the fallback is to set the sheet tiles to a slightly darker
flat colour instead (`.obj--sheet .obj__c { background:#F0EBE0 }`) and restore
the fibre to `.paper::after`.

---

## 4. How to run it

No install step. ES modules must be served over `http://`, not `file://`.

```bash
python -m http.server 8123 --directory .
```

```bash
npx serve . -l 8123
```

**Neither Python nor Node exists on the machine this was built on.** A
PowerShell `HttpListener` static server was hand-rolled in the scratchpad each
session. If you need it again:

```powershell
$l=New-Object System.Net.HttpListener;$l.Prefixes.Add("http://127.0.0.1:8123/");$l.Start()
while($l.IsListening){$c=$l.GetContext();$r=[Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/');if(!$r){$r="index.html"};$p=Join-Path "C:\path\to\ss" ($r -replace '/','\');if(Test-Path $p -PathType Leaf){$e=[IO.Path]::GetExtension($p);$c.Response.ContentType=@{".html"="text/html";".css"="text/css";".js"="text/javascript"}[$e];$c.Response.Headers.Add("Cache-Control","no-store");$b=[IO.File]::ReadAllBytes($p);$c.Response.OutputStream.Write($b,0,$b.Length)}else{$c.Response.StatusCode=404};$c.Response.OutputStream.Close()}
```

### QA handle
`hero.js` exposes `window.APOLO` in non-reduced-motion mode:

```js
APOLO.seek(0.53)   // pin the film to an exact frame, ignoring scroll
APOLO.release()    // hand it back to the scrollbar
APOLO.progress     // current smoothed progress
APOLO.items        // the built flat-lay objects, with their resolved geometry
```

`seek()` **pins** the clock (`held` flag in `createClock`) so a screenshot can
be taken of a known state. Without that, any stray scroll event overwrites the
frame you were trying to inspect. Always `release()` when done.

### Browser-pane gotchas (cost a lot of time last session)
- The pane silently collapses to `innerWidth === 0`; everything then measures
  zero and screenshots come back blank. Check `innerWidth` before believing a
  screenshot. Fix with `resize_window preset:desktop` then an explicit size.
- rAF is throttled when the pane isn't painting, so the smoothed clock never
  reaches the target. `APOLO.seek()` sidesteps this.
- ES modules are cached hard. Force a fresh graph with
  `location.replace('http://127.0.0.1:8123/?r='+Date.now())`.
- Always take **two** screenshots and use the second; the first is often a
  mid-paint frame (useful, actually — it shows bare tiles without images).

---

## 5. Architecture

```
index.html      markup: .film > .stage > .world (all camera layers) + .type
css/apolo.css   all styling, responsive, reduced-motion
js/engine.js    generic: maths, easing, noise, polyline geometry, clock, pointer
js/assets.js    SINGLE SOURCE OF TRUTH for every image, crop, position, timing
js/hero.js      the scene timeline: scroll progress → visual state
js/audio.js     synthesised sound
```

Keep that separation. `engine.js` knows nothing about pencils; `assets.js`
knows nothing about time; `hero.js` owns all the numbers that are *timing*.

### Key invariants
- **No SVG geometry API in the frame loop.** Shapes are plain polylines;
  `arcLengths()` runs only when the path is rebuilt, `pointAt()` is a binary
  search. Layout is measured only in `measure()`, on resize.
- **`crop` is mandatory on every object.** Source frames are 1500² with the
  product floating in the middle. Re-measure with canvas pixel scanning (alpha
  bbox for PNG, ink bbox with the top-right logo and bottom-left badge masked
  out for JPEG) — never guess.
- **`len` is the long edge in vmin**; the short edge comes from the crop's
  aspect ratio, so recropping can never silently resize or distort an object.
- **World coordinates are pre-camera.** An object at `x:71` is off-frame at the
  start and swings into view as the camera widens. That is deliberate.
- **`svh` everywhere**, and progress is measured against the sticky stage's
  height, not `innerHeight`, so mobile browser chrome sliding does not lurch
  the timeline.

### Scene map (p = smoothed progress)
| p | scene |
|---|-------|
| 0.000–0.075 | blank page, headline holds |
| 0.045–0.135 | pencil flies in, hesitates, touches down |
| 0.075–0.150 | headline lifts away *under* the pencil |
| 0.115–0.400 | the line draws the house, braking into corners |
| 0.320–0.395 | the door |
| 0.400–0.470 | pencil lifts off; held beat |
| 0.440–0.585 | house → notebook morph |
| 0.560–0.648 | the page appears beneath the outline |
| 0.600–0.662 | red margin |
| 0.612–0.720 | ruled lines, staggered |
| 0.545–0.909 | products (`a = 0.545 + delay*0.28`, each lasts 0.140) |
| 0.000–1.000 | camera, four stops |
| 0.878–0.958 | warm veil over the notebook |
| 0.912–0.995 | brand resolve |
| 0.950–1.000 | magenta underline drawn |

---

## 6. Still to do

1. **Verify the `.grain` change** (§3).
2. **Tablet (768×1024) has not been opened.** Desktop and 390×844 have.
   Also untested: 360×800, 430×932, short landscape.
3. **`prefers-reduced-motion` has only been faked** by adding `.is-still` and
   calling `frame(0.915)` by hand. The CSS layout was verified that way and
   looks right (a composed plate + two-column copy below), but the real JS
   branch has never run. Test with an actual OS/browser reduced-motion setting.
4. **Audio has never been heard.** The code is rewritten and the toggle wires
   up without errors, but nothing has been listened to. Check: no sound before
   the first click, no volume spike, repeated toggling is clean, `thud` fires
   once and only once.
5. **Composition still has weak spots** at the widest camera: the left column
   (sharpener / colour pencils / oil pastel / mech pencil) reads as one heavy
   stack, and the bottom three pens sit in a near-collinear row. Vary rotation
   and stagger their y positions.
6. **The remaining docs the brief asked for** were not written:
   `ASSETS-HOWTO.md` (CDN vs local, how to switch `SOURCE`, download list),
   storyboard, motion spec, interaction spec, technical architecture.
   `assets.js` still contains a comment pointing at `ASSETS-HOWTO.md`.
7. **No performance measurement** — no Lighthouse pass, no frame-rate capture
   under real scroll. The obvious wins (no layout reads, no per-frame
   allocation, skipped writes for invisible objects) are in, but unmeasured.
8. **`_research/`** still contains `probe.html` and `probe2.html` (throwaway
   watermark-removal tests, nothing depends on them) plus reference product
   images that are genuinely useful — keep the images, the probes can go.

---

## 7. Decisions not to re-litigate

- **No build step, no framework, no GSAP/Three.js.** One scroll-driven
  timeline does not justify the payload. (Note: NEXT-BRIEF-V3 explicitly
  reopens this — for V3 you *may* add libraries if they earn their place.)
- **Images hotlink Apolo's live Shopify CDN** (`cdn.shopify.com`, CORS-enabled
  and canvas-readable). Always current, no asset pipeline. `SOURCE` in
  `assets.js` flips to local files.
- **Watermark removal is pure CSS**: crop away the corner chrome, then
  `brightness(1.07) contrast(1.13) saturate(1.03)` + `multiply` onto a
  paper-coloured window. The pencil uses a lighter hand
  (`brightness(1.01) contrast(1.10)`) because over-lifting turns its sharpened
  wood cone into a blank white point.
- **Sound is synthesised, never sampled.** No licensing, no files, and the
  `AudioContext` can only be created inside the visitor's own click.
- **Shopify collection handles were verified** against `/collections.json`:
  `books`, `writing-instruments`, `desk-accessories`, `stationery-supplies`,
  `copy-paper`.
