/* ==========================================================================
   APOLO — asset manifest
   --------------------------------------------------------------------------
   Every image in the hero is declared here and nowhere else.
   To swap, re-point, resize or re-position anything, edit ONLY this file.
   See docs/ASSETS-HOWTO.md for CDN vs. local mode and the download list.

   THE CROP FIELD IS NOT OPTIONAL COSMETICS — READ THIS BEFORE EDITING.
   Every Apolo source image is a 1500x1500 studio frame with the product
   floating in the middle of it. The transparent PNG cutouts cover only
   ~3-4% of their frame; the catalogue JPEGs carry supplier chrome in two
   corners. Rendering a source frame un-cropped makes the product roughly
   twenty times smaller than intended — it looks like the image failed to
   load. `crop` is [x0, y0, x1, y1] as fractions of the source, and every
   object below carries one measured from the actual pixels (alpha bounding
   box for PNGs, ink bounding box with the corner chrome masked out for
   JPEGs). Re-measure, don't guess, if you swap an asset.
   ========================================================================== */

/* Where images are loaded from.
   'cdn'   → Apolo's live Shopify CDN (default; always current, globally cached)
   'local' → ./assets/…  (run the download list in docs/ASSETS-HOWTO.md first) */
export const SOURCE = 'cdn';

const ROOT = {
  cdn:   'https://cdn.shopify.com/s/files/1/0580/6443/7401/',
  local: './assets/'
};

/* Shopify serves resized derivatives from ?width=. Keeps the 1500px masters
   off the wire — nothing in the film is rendered above ~420 CSS px. */
const WIDTH = 600;

export function url(path, width = WIDTH) {
  if (SOURCE === 'local') return ROOT.local + path.split('/').pop();
  return ROOT.cdn + path + '?width=' + width;
}

export const LOGO = 'https://apolostationey.com/cdn/shop/files/Apolo_Logo_1_1.png';
export const SHOP = 'https://apolostationey.com';

/* --------------------------------------------------------------------------
   THE HERO PENCIL — APOLO A-221C 2B, the object that draws the film.
   The source frame shows a bare pencil beside its 12-pc box; the crop keeps
   only the pencil. Measured: the graphite point sits at x 0.3835, y 0.170 of
   the source, and the crop is padded so that lands at (50%, ~0.7%) of the
   cropped box — which is where css/apolo.css puts the rotation pivot, so the
   pencil turns about its own point and the point never leaves the line.
   -------------------------------------------------------------------------- */
export const PENCIL = {
  src  : 'products/Pencil-A221C.jpg',
  kind : 'sheet',
  crop : [0.3635, 0.1655, 0.4035, 0.8100],
  tip  : [0.50, 0.007],   // where the graphite point sits inside the crop
  len  : 52,              // rendered length, vmin (width follows from the crop)
  name : 'APOLO Pencil A-221C 2B'
};

/* --------------------------------------------------------------------------
   THE FLAT-LAY
   x / y  — resting position in "world" vmin from the centre of the page.
            These are pre-camera coordinates: the camera pull-back multiplies
            them, so objects sitting outside the frame early swing into view
            as it widens. That is the point.
   len    — rendered LONG EDGE in vmin. The short edge follows from the crop's
            aspect ratio, so an object is never distorted and changing the crop
            never silently changes the size.
   r      — resting rotation, deg
   z      — depth 0 (far: least parallax, most settled) … 3 (near)
   delay  — 0…1 stagger within the product reveal
   from   — entry direction in vmin, relative to the resting position. Objects
            slide onto the page from off-frame along their own vector rather
            than all fading up together.
   kind   — 'png'   pre-cut transparent cutout, no processing
            'sheet' catalogue JPEG: cropped, levelled and multiplied onto the
                    paper at render time (see .obj--sheet in css/apolo.css)

   Assets deliberately NOT used, so nobody re-adds them:
     Scissor1 / SmartScissor / ChildrenScissor1 — every scissors photo is shot
       on a black blister card. Under `multiply` that renders as a black slab
       on the paper, which is worse than having no scissors.
     RulerSet — a translucent plastic box on white; after levelling there is
       almost nothing left, and the supplier watermark reads straight through it.
   -------------------------------------------------------------------------- */
export const OBJECTS = [
  /* ---- the payoff object -------------------------------------------------
     The Drawing Book cover is a house with a door and a window. The film has
     just spent fifteen seconds drawing a house. This object lands last, on
     the beat, and is the reason the flat-lay is composed around the right. */
  { id:'drawing-book', name:'APOLO Drawing Book 100 GSM', kind:'sheet',
    src:'products/Drawing-Book.jpg',  crop:[0.198,0.172,0.802,0.804],
    x: 71, y: 20, len:64, r:  7, z:1, delay:.80, from:[ 34,  16] },

  /* ---- far layer: the boxed goods ---------------------------------------- */
  { id:'colour-pencils', name:'APOLO Color Pencil A-186 — 36 Colours', kind:'sheet',
    src:'products/Color-Pencil-36Pcs.jpg', crop:[0.392,0.150,0.613,0.856],
    x:-73, y: -8, len:64, r:-13, z:1, delay:.60, from:[-30,  10] },

  { id:'oil-pastel', name:'APOLO Oil Pastel A-242 — 12 Colours', kind:'sheet',
    src:'products/Oil-Pastel-12Pcs-Front.jpg', crop:[0.354,0.156,0.641,0.814],
    x:-63, y: 43, len:52, r: 13, z:1, delay:.66, from:[-26,  22] },

  { id:'sharpener', name:'APOLO Pencil Sharpener A-210', kind:'sheet',
    /* three sharpeners share the frame; the crop keeps the magenta one */
    src:'products/Sharpener210A-1.jpg', crop:[0.386,0.252,0.650,0.578],
    x:-65, y:-38, len:32, r:-11, z:0, delay:.70, from:[-16, -20] },

  { id:'stapler', name:'APOLO Stapler A-191', kind:'sheet',
    src:'products/A191C3.jpg', crop:[0.191,0.304,0.810,0.696],
    x: 66, y:-36, len:38, r:-10, z:0, delay:.73, from:[ 20, -18] },

  { id:'glue', name:'APOLO Glue Stick', kind:'sheet',
    src:'products/GlueStick.jpg', crop:[0.322,0.192,0.497,0.766],
    x: 55, y: -6, len:30, r: 15, z:2, delay:.54, from:[ 22,  -4] },

  /* ---- near layer: the bare writing instruments (clean cutouts) ----------- */
  { id:'cruizer-blue', name:'APOLO Ball Pen Cruizer — Blue', kind:'png',
    src:'files/CruizerPenBlue.png', crop:[0.462,0.086,0.530,0.904],
    x:-24, y:-46, len:46, r: 95, z:3, delay:.00, from:[ -8, -26] },

  { id:'high-yellow', name:'APOLO Highlighter Bright A-187 — Yellow', kind:'png',
    src:'products/HighYellow.png', crop:[0.444,0.188,0.534,0.838],
    x: 24, y:-48, len:35, r: 79, z:3, delay:.22, from:[  8, -24] },

  { id:'gel-red', name:'APOLO Gel Pen A-101 — Red', kind:'png',
    src:'products/GelPenRed.png', crop:[0.456,0.082,0.536,0.918],
    x: 15, y: 47, len:46, r:-85, z:3, delay:.08, from:[  6,  26] },

  { id:'high-pink', name:'APOLO Highlighter Bright A-187 — Pink', kind:'png',
    src:'products/HighPink.png', crop:[0.450,0.184,0.540,0.836],
    x:-27, y: 45, len:35, r: 98, z:3, delay:.16, from:[ -8,  24] },

  { id:'mech', name:'APOLO Mechanical Pencil A-194', kind:'png',
    src:'products/MachanicalPencilOldDesign.png', crop:[0.470,0.186,0.526,0.812],
    x:-49, y: 19, len:42, r: 27, z:2, delay:.30, from:[-22,  10] },

  { id:'marker-wb', name:'APOLO White Board Marker', kind:'png',
    src:'files/MB-Copy.png', crop:[0.384,0.188,0.482,0.810],
    x: 46, y: 42, len:40, r:-73, z:2, delay:.42, from:[ 18,  22] },

  { id:'correction', name:'APOLO Correction Pen A-107', kind:'png',
    src:'files/CorrectionPenA107_5ML.png', crop:[0.444,0.188,0.532,0.812],
    x: 42, y:-23, len:32, r: 24, z:2, delay:.36, from:[ 18, -12] },

  { id:'eraser', name:'APOLO Eraser A-150', kind:'png',
    src:'products/Eraser.png', crop:[0.376,0.342,0.558,0.774],
    x: 35, y: 28, len:16, r:-21, z:3, delay:.48, from:[  9,   9] }
];

/* Objects kept on small screens. Everything else is never created — not
   hidden, not downloaded. A phone gets a deliberately sparser composition:
   the payoff object, one box, one tube, and three pens reading as a cross
   around the notebook. Keep this list short; the point of the mobile cut is
   air, not density. */
export const MOBILE_KEEP = new Set([
  'drawing-book', 'colour-pencils', 'cruizer-blue', 'gel-red', 'high-pink', 'eraser'
]);

/* Portrait overrides — a deliberately different composition, not a squeezed
   one. Positions are in world vmin, and on a phone vmin is the *width*, so a
   y of 80 is only ~37% of the height while an x of 34 is 34% of the width.
   The vertical numbers are therefore much larger than the horizontal ones by
   design; copying the desktop values here produces a tight clump in the
   middle of a very tall frame. `delay` is respaced too: six objects arriving
   on the desktop's fourteen-object schedule leaves long dead stretches. */
export const MOBILE_LAYOUT = {
  'cruizer-blue'  : { x: -31, y:  26, len: 46, r: 76, delay:.00, from:[-16,  10] },
  'high-pink'     : { x: -28, y:  78, len: 34, r:100, delay:.18, from:[-10,  34] },
  'gel-red'       : { x:  33, y: -26, len: 46, r:-74, delay:.34, from:[ 16, -14] },
  'eraser'        : { x:  31, y:  30, len: 15, r:-21, delay:.48, from:[ 10,  14] },
  'colour-pencils': { x: -35, y: -86, len: 54, r:-14, delay:.62, from:[-16, -28] },
  'drawing-book'  : { x:  27, y:  80, len: 52, r:  8, delay:.82, from:[ 18,  30] }
};

/* Real Shopify collection handles, verified against /collections.json */
export const CATEGORIES = [
  { title:'Books',    my:'စာအုပ်',       handle:'books',               n:29,
    blurb:'Exercise, drawing and note books' },
  { title:'Writing',  my:'ရေးသားရန်',     handle:'writing-instruments', n:32,
    blurb:'Pens, pencils, markers, pastels' },
  { title:'Desk',     my:'စားပွဲသုံး',     handle:'desk-accessories',    n:21,
    blurb:'Staplers, clips, glue, cutters' },
  { title:'Supplies', my:'ကိရိယာများ',    handle:'stationery-supplies', n:9,
    blurb:'Rulers, sharpeners, film' },
  { title:'Paper',    my:'စက္ကူ',         handle:'copy-paper',          n:12,
    blurb:'Copy and colour paper' }
];
