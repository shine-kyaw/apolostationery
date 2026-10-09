/* ==========================================================================
   APOLO — catalogue
   Reads data/catalog.json (written by tools/sync-catalog.mjs) once per page
   and answers every question the store asks of it. Nothing else fetches data.
   ========================================================================== */

let loading = null;

/** The whole catalogue, indexed. Fetched once and shared by every caller. */
export function catalog() {
  return loading ||= fetch('/data/catalog.json')
    .then(r => { if (!r.ok) throw new Error('catalog ' + r.status); return r.json(); })
    .then(index);
}

function index(c) {
  c.byHandle = new Map(c.products.map(p => [p.handle, p]));
  c.byVariant = new Map();
  for (const p of c.products) {
    p.min = Math.min(...p.variants.map(v => v.price));
    p.max = Math.max(...p.variants.map(v => v.price));
    p.available = p.variants.some(v => v.available);
    p.collections = [];
    p.search = norm([p.title, p.vendor, p.type, ...p.tags,
                     ...p.variants.map(v => v.title)].join(' '));
    for (const v of p.variants) c.byVariant.set(v.id, { product: p, variant: v });
  }
  c.byCollection = new Map(c.collections.map(col => [col.handle, col]));
  for (const col of c.collections) {
    col.items = col.products.map(h => c.byHandle.get(h)).filter(Boolean);
    for (const p of col.items) p.collections.push(col);
  }

  /* "Featured" for the whole shop: APOLO's own strongest products first, then
     the rest dealt out one category at a time, so the grid never opens on a
     run of near-identical envelopes or reams of copy paper. */
  const lead = FEATURED.map(h => c.byHandle.get(h)).filter(Boolean);
  const seen = new Set(lead);
  const queues = c.collections.map(col => col.items.filter(p => !seen.has(p)));
  c.featured = lead.slice();
  while (queues.some(q => q.length))
    for (const q of queues) { const p = q.shift(); if (p && !seen.has(p)) { seen.add(p); c.featured.push(p); } }
  for (const p of c.products) if (!seen.has(p)) c.featured.push(p);
  return c;
}

const FEATURED = [
  'apolo-color-pencil-36-colors', 'apolo-exercise-book-55-gsm-80-pages-single-line',
  'highlighter-bright-pen-a-187', 'apolo-oil-pastel-a-242-12-colors',
  'copy-of-apolo-drawing-book-55-gsm-80-pages-12-pcs', 'gel-pen-a-101-blue-black-red',
  'apolo-sticky-note', 'copy-of-office-stapler-a191b',
  'apolo-note-book-soft-cover-a5', 'mechanical-pencil-0-5mm-a-194-pink-blue-purple-yellow',
  'apolo-glue-stick-8g-15g-36g', 'copy-of-apolo-color-paper-70-gsm-a4-500-sheets',
  'apolo-calculator', 'apolo-correction-tape-disposable-a-158',
  'apolo-clear-file-a4-20-40-60-pockets', 'apolo-binder-clip'
];

const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');

/* ---------- formatting ---------- */

/** Kyat, the way the store prints it but without the meaningless ".00". */
export const money = n => 'K' + Math.round(n).toLocaleString('en-US');

export function priceLabel(p) {
  return p.min === p.max ? money(p.min) : `From ${money(p.min)}`;
}

const CDN = 'https://cdn.shopify.com/s/files/1/0580/6443/7401/';

/** A resized derivative from Shopify's CDN. Masters are 1500px; no card needs that. */
export function img(src, width = 600) {
  if (!src) return '';
  const full = /^https?:/.test(src) ? src : CDN + src;
  return full + (full.includes('?') ? '&' : '?') + 'width=' + width;
}

export function srcset(src, widths = [300, 450, 600, 900]) {
  return widths.map(w => `${img(src, w)} ${w}w`).join(', ');
}

/** One product photo, framed. `im.c` is the square crop around the product
    measured by tools/measure-images.mjs; with it the product fills the tile
    instead of floating small in a supplier sheet. Because a crop zooms in, the
    file asked for is proportionally larger so it stays sharp.
    `air` loosens the crop (1 = as measured) for places that want context. */
export function photo(im, { w = 450, sizes = '', alt = '', cls = '', lazy = true, air = 1, high = false } = {}) {
  if (!im) return '';
  let c = im.w === im.h && im.c ? im.c.slice() : null;
  if (c && air !== 1) {
    const s = Math.min(1, c[2] * air);
    c = s >= 0.98 ? null : [
      Math.min(Math.max(c[0] - (s - c[2]) / 2, 0), 1 - s),
      Math.min(Math.max(c[1] - (s - c[2]) / 2, 0), 1 - s), s];
  }
  const z = c ? 1 / c[2] : 1;
  const ws = [0.66, 1, 1.5, 2].map(k => Math.min(1500, Math.round(w * k * z / 50) * 50));
  const set = [...new Set(ws)].map(x => `${img(im.src, x)} ${x}w`).join(', ');
  const style = c ? ` style="--x:${c[0]};--y:${c[1]};--s:${c[2]}"` : '';
  return `<img class="ph${c ? ' ph--c' : ''}${cls ? ' ' + cls : ''}"${style} src="${img(im.src, ws[1])}"
    srcset="${set}"${sizes ? ` sizes="${sizes}"` : ''} alt="${esc(alt)}" width="${im.w || 450}" height="${im.h || 450}"
    ${lazy ? 'loading="lazy"' : ''} ${high ? 'fetchpriority="high"' : ''} decoding="async">` + (c ? chrome(im.src, c, cls) : '');
}

/* Supplier sheets carry an APOLO logo top-right and a spec badge bottom-left.
   A wide crop can catch a sliver of either at the tile's corners; paint those
   zones out (the same zones the measurement ignored). Cutout PNGs have none. */
const CHROME = [[0.80, 0, 1, 0.15], [0, 0.82, 0.30, 1]];
function chrome(src, [x, y, s], cls) {
  if (/\.png/i.test(src)) return '';
  return CHROME.map(([a, b, c2, d]) => {
    const l = (a - x) / s, t = (b - y) / s, r = (c2 - x) / s, btm = (d - y) / s;
    if (r <= 0 || btm <= 0 || l >= 1 || t >= 1) return '';
    const pct = v => (Math.min(Math.max(v, 0), 1) * 100).toFixed(1) + '%';
    return `<i class="ph-mask${cls ? ' ' + cls : ''}" aria-hidden="true" style="left:${pct(l)};top:${pct(t)};` +
           `right:${pct(1 - r)};bottom:${pct(1 - btm)}"></i>`;
  }).join('');
}

/** The image a variant should show, falling back to the product's first. */
export function variantImage(p, v) {
  const i = v && v.image >= 0 ? v.image : 0;
  return p.images[i] || p.images[0] || null;
}

/** Product names arrive shouty and padded ("APOLO PENCIL A-221R (2B)").
    Keep the model codes and sizes, drop the brand prefix the card already shows. */
export function shortTitle(p) {
  const t = p.title.replace(/^apolo\s+/i, '').replace(/\s+/g, ' ').trim();
  /* a few titles were typed in capitals; set those in title case, keeping codes */
  return /[a-z]/.test(t) ? t : t.replace(/\b([A-Z])([A-Z]{2,})\b/g, (w, a, b) =>
    ACRONYMS.has(w) ? w : a + b.toLowerCase());
}
const ACRONYMS = new Set(['GSM', 'OHP', 'PCS', 'PVC', 'A4', 'A3', 'A5', 'CD']);

/* ---------- queries ---------- */

/** Every word must appear somewhere; title hits rank above tag hits. */
export function search(c, q, limit = Infinity) {
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return [];
  const out = [];
  for (const p of c.products) {
    if (!words.every(w => p.search.includes(w))) continue;
    const t = norm(p.title);
    let score = 0;
    for (const w of words) score += t.includes(w) ? (t.startsWith(w) || t.includes(' ' + w) ? 3 : 2) : 1;
    out.push([score, p]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => x[1]);
}

export const SORTS = {
  featured:   { label: 'Featured',            fn: null },
  'price-asc':  { label: 'Price, low to high', fn: (a, b) => a.min - b.min },
  'price-desc': { label: 'Price, high to low', fn: (a, b) => b.min - a.min },
  'title':      { label: 'Name, A–Z',          fn: (a, b) => shortTitle(a).localeCompare(shortTitle(b)) },
  'new':        { label: 'Newest',             fn: (a, b) => b.created.localeCompare(a.created) }
};

/** Products that belong with this one: same collection first, nearest in price. */
export function related(c, p, n = 8) {
  const pool = (p.collections[0]?.items || c.products).filter(x => x !== p);
  return pool
    .map(x => [Math.abs(Math.log((x.min || 1) / (p.min || 1))) - (x.type === p.type ? 0.5 : 0), x])
    .sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
