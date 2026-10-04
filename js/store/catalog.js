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
  return c;
}

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
