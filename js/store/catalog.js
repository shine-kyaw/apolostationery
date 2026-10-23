/* ==========================================================================
   APOLO — catalogue
   Reads data/catalog.json (written by tools/sync-catalog.mjs) once per page
   and answers every question the store asks of it. Nothing else fetches data.
   ========================================================================== */

import { isMy, t, tr } from '../i18n.js';
import { displayName, slugs } from './names.js';
import { searchCatalog } from './search.js';

let loading = null;

/** The whole catalogue, indexed. Fetched once and shared by every caller.
    In Burmese, data/catalog.my.json (optional) supplies Burmese product names
    and descriptions by handle; anything it does not cover stays English. */
export function catalog() {
  /* a page built ahead of time carries the catalogue's URL with a version on it */
  const ds = globalThis.document?.documentElement.dataset || {};
  return loading ||= Promise.all([
    fetch(ds.catalog || '/data/catalog.json').then(r => { if (!r.ok) throw new Error('catalog ' + r.status); return r.json(); }),
    isMy ? fetch(ds.catalogMy || '/data/catalog.my.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})) : {}
  ]).then(([c, ov]) => index(c, ov));
}

export function index(c, ov = {}) {
  c.byHandle = new Map(c.products.map(p => [p.handle, p]));
  const slug = slugs(c.products);
  c.bySlug = new Map();
  c.byVariant = new Map();
  for (const p of c.products) {
    p.min = Math.min(...p.variants.map(v => v.price));
    p.max = Math.max(...p.variants.map(v => v.price));
    p.available = p.variants.some(v => v.available);
    p.collections = [];
    const my = ov[p.handle] || {};
    p.slug = slug.get(p.handle);
    p.url = '/products/' + p.slug;
    c.bySlug.set(p.slug, p);
    /* the name people read; the store's full title is kept for search */
    p.name = displayName(p);
    if (my.title) { p.titleEn = p.title; p.nameEn = p.name; p.title = p.name = my.title; }
    if (my.body) { p.bodyEn = p.body; p.body = my.body; }
    for (const v of p.variants) c.byVariant.set(v.id, { product: p, variant: v });
  }
  c.byCollection = new Map(c.collections.map(col => [col.handle, col]));
  for (const col of c.collections) {
    col.items = col.products.map(h => c.byHandle.get(h)).filter(Boolean);
    for (const p of col.items) p.collections.push(col);
  }

  /* Someone looking for a deal types "package", "combo", "promotion", "discount"
     or "sale" (or the Burmese for them). Those words are not in a product's
     name, so package sets and anything marked down carry them for search. */
  const pk = c.byCollection.get('package-sets');
  for (const p of c.products)
    if ((pk && pk.products.includes(p.handle)) || p.variants.some(v => v.compare > v.price)) p.promo = PROMO_WORDS;

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

const PROMO_WORDS = 'package packages combo bundle set sets promotion promo discount offer offers sale deal ' +
  'ပက်ကေ့ချ် ပက်ကေ့ဂျ် ဆက် ပရိုမိုးရှင်း လျှော့စျေး လျှော့ဈေး အထူးလျှော့စျေး';

const FEATURED = [
  'thadingyut-creative-package-set-20-off',
  'apolo-color-pencil-36-colors', 'apolo-exercise-book-55-gsm-80-pages-single-line',
  'highlighter-bright-pen-a-187', 'apolo-oil-pastel-a-242-12-colors',
  'copy-of-apolo-drawing-book-55-gsm-80-pages-12-pcs', 'gel-pen-a-101-blue-black-red',
  'apolo-sticky-note', 'copy-of-office-stapler-a191b',
  'apolo-note-book-soft-cover-a5', 'mechanical-pencil-0-5mm-a-194-pink-blue-purple-yellow',
  'apolo-glue-stick-8g-15g-36g', 'copy-of-apolo-color-paper-70-gsm-a4-500-sheets',
  'apolo-calculator', 'apolo-correction-tape-disposable-a-158',
  'apolo-clear-file-a4-20-40-60-pockets', 'apolo-binder-clip'
];

/* ---------- formatting ---------- */

/** Kyat, the way the store prints it but without the meaningless ".00":
    K48,200 in English, 48,200 ကျပ် in Burmese (digits stay Arabic, as on the
    store). The pattern is the `price.fmt` entry in the language tables. */
export const money = n => t('price.fmt', { n: Math.round(n).toLocaleString('en-US') });

export function priceLabel(p) {
  return p.min === p.max ? money(p.min) : t('price.from', { price: money(p.min) });
}

/* ---------- words the catalogue gives us in English ---------- */

/** A category's name, short name and one-line description in this language. */
export const colTitle = col => tr(`cat.${col.handle}.title`, col.title);
export const colShort = col => tr(`cat.${col.handle}.short`, col.short || col.title);
export const colBlurb = col => tr(`cat.${col.handle}.blurb`, col.blurb);

/** "Color" → အရောင်. Unknown names stay as Shopify wrote them. */
export const optName = name => tr(`opt.${String(name).toLowerCase().trim()}`, name);

const UNITS = { sheet: 'unit.sheet', sheets: 'unit.sheet', page: 'unit.page', pages: 'unit.page',
  pocket: 'unit.pocket', pockets: 'unit.pocket', layer: 'unit.layer', layers: 'unit.layer',
  divider: 'unit.divider' };
/** An option value: a colour name, or a count with a unit ("10 sheets"). Sizes
    and codes ("A4", "0.5mm") are the same in every language. */
export function optVal(v) {
  if (!isMy) return v;
  const k = String(v).toLowerCase().trim();
  const hit = tr(`val.${k}`, null);
  if (hit) return hit;
  const m = k.match(/^(\d+)\s+([a-z]+)$/);
  if (m && UNITS[m[2]]) return `${m[1]} ${t(UNITS[m[2]])}`;
  return v;
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
export function photo(im, { w = 450, sizes = '', alt = '', cls = '', lazy = true, air = 1, high = false, defer = false } = {}) {
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
  /* `defer`: the file is named but not fetched until something asks for it
     (a card's second photo, shown only on hover) */
  const at = defer ? 'data-' : '';
  return `<img class="ph${c ? ' ph--c' : ''}${cls ? ' ' + cls : ''}"${style} ${at}src="${img(im.src, ws[1])}"
    ${at}srcset="${set}"${sizes ? ` sizes="${sizes}"` : ''} alt="${esc(alt)}" width="${im.w || 450}" height="${im.h || 450}"
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
  return (p.name || p.title).replace(/^apolo\s+/i, '').replace(/\s+/g, ' ').trim();
}

/* ---------- queries ---------- */

/** Products for a search box query, best first (see js/store/search.js).
    The result carries `loose: true` when nothing matched every word. */
export function search(c, q) {
  return searchCatalog(c, q, { burmeseCat: col => tr(`cat.${col.handle}.title`, '') });
}

/* Labels come from the language tables (sort.<key>); `label` reads them when
   asked, so a sort order is named in whatever language the page is in. */
const sortOf = (key, fn) => ({ fn, get label() { return t(`sort.${key}`); } });
export const SORTS = {
  featured:     sortOf('featured', null),
  'price-asc':  sortOf('price-asc', (a, b) => a.min - b.min),
  'price-desc': sortOf('price-desc', (a, b) => b.min - a.min),
  'title':      sortOf('title', (a, b) => shortTitle(a).localeCompare(shortTitle(b), isMy ? 'my' : 'en')),
  'new':        sortOf('new', (a, b) => b.created.localeCompare(a.created))
};

/** Products that belong with this one: same collection first, nearest in
    price. Near-twins are left out — the store lists some products two or
    three times under one photo ("White Board Marker", "… Refill", "… & Refill"),
    and a shelf of the same picture helps nobody. */
export function related(c, p, n = 8) {
  const pool = (p.collections[0]?.items || c.products).filter(x => x !== p);
  const pic = x => (x.images[0]?.src || '').split('?')[0];
  const seen = new Set([pic(p)]);
  const out = [];
  for (const [, x] of pool
    .map(x => [Math.abs(Math.log((x.min || 1) / (p.min || 1))) - (x.type === p.type ? 0.5 : 0), x])
    .sort((a, b) => a[0] - b[0])) {
    if (seen.has(pic(x))) continue;
    seen.add(pic(x)); out.push(x);
    if (out.length === n) break;
  }
  return out;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
