/* ==========================================================================
   APOLO — product page markup
   Pure: data in, HTML out. The browser (js/pages/product.js) and the build
   (tools/build.mjs) both call these, so a page built ahead of time and the
   same page drawn in the browser are identical.
   ========================================================================== */

import { ICON, CONTACT, stepper } from '../site/chrome.js';
import { card } from '../site/card.js';
import { photo, esc, money, shortTitle, related, colTitle, optName, optVal } from '../store/catalog.js';
import { t, isMy } from '../i18n.js';

/* Option values the store uses for colour, so a pill can carry a dot of it. */
const SWATCH = {
  blue: '#2F5BC8', black: '#1C1B20', red: '#D7263D', pink: '#F06BA8', yellow: '#F7D046',
  green: '#3BAA5C', orange: '#F28C28', purple: '#8E5BC9', violet: '#8E5BC9', white: '#FFFFFF',
  grey: '#9A9A9A', gray: '#9A9A9A', brown: '#8A5A3B', gold: '#C9A44C', silver: '#C5C8CC',
  ivory: '#F4EEDC', turquoise: '#33C1C1', saffron: '#F4A300', cream: '#F3E9CF', 'rose gold': '#D9A08E',
  lemon: '#F5EB6B', taro: '#B9A3D8', parrot: '#4CC552', lavender: '#B7A6E0', lavendar: '#B7A6E0', rose: '#E98AA6',
  'cyber green': '#7BE04A', 'cyber pink': '#FF5FB0', 'cyber yellow': '#FFE83A', 'cyber orange': '#FF9A2E', 'cyber red': '#F23A3A',
  'baby pink': '#F7B6CF', beaver: '#9C7E62', 'light blue': '#8EC5EE', 'dark blue': '#233C8C', clear: '#EEF3F6'
};
export const swatch = v => {
  const k = v.toLowerCase().replace(/\(.*?\)/g, '').trim();
  return SWATCH[k] || SWATCH[k.split(/\s+/).pop()];
};

/** The variant to show first: the one in the URL, else the first in stock. */
export function firstVariant(p, wantId) {
  return p.variants.find(x => x.id === wantId) || p.variants.find(x => x.available) || p.variants[0];
}

/* ---------- specifications, read off the product's own name ----------
   The store's descriptions are thin, but its names carry the facts people
   compare on: paper weight, pages, size, ruling, model code. Each is shown
   only when the name states it and no option already covers it. */
const SPECS = [
  ['model',   /\b(A-?\s?\d{3}[A-Z]?)\b/,            m => m[1].replace(/\s+/g, '')],
  ['gsm',     /\b(\d{2,3})\s*GSM\b/i,               m => `${m[1]} GSM`],
  ['pages',   /\b(\d{2,3})\s*(?:pages|pg|pgs)\b/i, m => m[1]],
  ['sheets',  /\b(\d{2,4})\s*sheets\b/i,            m => m[1]],
  ['size',    /\b(A3|A4|A5|B5|F4|Legal)\b/,         m => m[1]],
  ['ruling',  /\b(single|double) line\b/i,          m => t(`product.spec.ruling.${m[1].toLowerCase()}`)],
  ['columns', /\b(\d+)\s*columns\b/i,               m => m[1]],
  ['colours', /\b(\d+)\s*colou?rs\b/i,              m => m[1]],
  ['grade',   /\((2B|HB|B)\)/,                      m => m[1]],
  ['ply',     /\b(\d)\s*ply\b/i,                    m => m[1]],
  ['micron',  /\b(\d{2,3})\s*(?:micron|mic)\b/i,    m => `${m[1]} µm`],
  ['pack',    /\((\d+)\s*(?:pcs|pc|nos)\)|\b(\d+)\s*per pack\b|\(1\s*doz\)/i, m => { const n = m[1] || m[2] || '12'; return +n > 1 ? n : ''; }]
];
/* an option already lets the shopper choose this, so the name's value is just one of them */
const COVERED = { pages: /page/i, sheets: /sheet/i, size: /size/i, colours: /colou?r/i, gsm: /gsm/i, micron: /micron/i, pack: /pcs|pack/i };

export function specs(p) {
  const name = p.titleEn || p.title;
  const out = [];
  for (const [key, re, val] of SPECS) {
    if (COVERED[key] && p.options.some(o => COVERED[key].test(o.name))) continue;
    const m = name.match(re);
    const v = m && val(m);
    if (v) out.push([t(`product.spec.${key}`), v]);
  }
  return out;
}

/** The description's text as sentences: list bullets ("- Soft, smooth…")
    and line breaks become full stops, so it reads well where it is quoted
    (search results, link previews). */
export function plainText(html) {
  return String(html || '')
    .replace(/<\/(p|li|tr|h\d)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .split('\n').map(l => l.replace(/^[\s\-–•*·]+/, '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    .map(l => /[.!?။:)]$/.test(l) ? l : l + (/[က-႟]$/.test(l) ? '။' : '.'))
    .join(' ');
}

/** About 150 characters for <meta name=description>: the product's own words,
    cut at a word, then the delivery promise. */
export function metaDescription(p) {
  const plain = plainText(p.body);
  const cut = plain.length > 140 ? plain.slice(0, 140).replace(/\s+\S*$/, '') + '…' : plain;
  return (cut ? cut + ' ' : '') + t('product.meta.tail');
}

/* ---------- page parts ---------- */

/** Breadcrumb items after Home / Shop. */
export function crumbsHTML(p) {
  const col = p.collections[0];
  return (col ? `<li><a href="/collections/${col.handle}">${esc(colTitle(col))}</a></li>` : '') +
    `<li><span aria-current="page">${esc(shortTitle(p))}</span></li>`;
}

/** The stage photo for an image index: framed like the cards, but looser,
    because the product page keeps some of the photo around the product. */
export function stagePhoto(p, i) {
  const im = p.images[i] || p.images[0];
  return photo(im, { w: 620, sizes: '(max-width:900px) 92vw, 620px', air: 1.22, lazy: false, high: true });
}

export const priceHTML = v => `${money(v.price)}${v.compare > v.price ? ` <s>${money(v.compare)}</s>` : ''}`;
export const stockText = v => v ? (v.available ? t('product.stock.in') : t('product.sold_out')) : t('product.stock.unavailable');

export function productHTML(p, v) {
  const col = p.collections[0];
  const vi = v.image >= 0 ? v.image : 0;
  const spec = specs(p);
  return `
  <div class="pdp">
    <div class="gallery">
      <div class="stage-img is-in" id="stageImg" role="img" aria-label="${esc(p.name)}">
        <div class="stage-img__in" id="stageIn" data-shown="${vi}">${stagePhoto(p, vi)}</div>
      </div>
      ${p.images.length > 1 ? `<div class="thumbs" id="thumbs" aria-label="${esc(t('product.gallery.label'))}">${p.images.map((im, i) => `
        <button type="button" data-i="${i}" aria-current="${i === vi}" aria-label="${esc(t('product.gallery.show', { i: i + 1, n: p.images.length }))}">
          ${photo(im, { w: 70 })}</button>`).join('')}</div>` : ''}
    </div>

    <div class="buy" id="buy" tabindex="-1">
      <div class="buy__meta">
        ${col ? `<a href="/collections/${col.handle}">${esc(colTitle(col))}</a>${isMy ? '' : `<span class="my" lang="my">${col.my}</span>`}` : ''}
        ${!/^apolo/i.test(p.vendor) ? `<span>${esc(p.vendor)}</span>` : ''}
      </div>
      <h1>${esc(p.name)}</h1>
      <div class="buy__price" id="price" aria-live="polite">${priceHTML(v)}</div>

      ${p.options.map((o, oi) => `
        <fieldset class="opt" data-oi="${oi}">
          <legend>${esc(optName(o.name))} <span data-sel>${esc(optVal(v.o[oi] || ''))}</span></legend>
          <div class="pills">${o.values.map(val => {
            const sw = /colou?r/i.test(o.name) ? swatch(val) : null;
            const ok = p.variants.some(x => x.available && x.o[oi] === val && x.o.every((y, j) => j === oi || y === v.o[j]));
            return `<label class="pill${ok ? '' : ' is-na'}"><input type="radio" name="o${oi}" value="${esc(val)}"${val === v.o[oi] ? ' checked' : ''}>
                    <span>${sw ? `<i style="--sw:${sw}"></i>` : ''}${esc(optVal(val))}</span></label>`;
          }).join('')}</div>
        </fieldset>`).join('')}

      <p class="buy__stock${v.available ? '' : ' is-out'}" id="stock">${stockText(v)}</p>

      <div class="buy__dock">
        <div class="buy__row">
          <div class="step step--lg" id="qty" role="group" aria-label="${esc(t('product.qty'))}">${stepper(1, t('product.qty')).replace(/^<div[^>]*>|<\/div>$/g, '')}</div>
          <button type="button" class="btn btn--brand" id="add"${v.available ? '' : ' disabled'}>${v.available ? `${ICON.bag} ${t('product.add')}` : t('product.sold_out')}</button>
          <a class="btn btn--ghost buy__now" data-now href="https://apolostationey.com/cart/${v.id}:1">${t('product.buy_now')}</a>
        </div>
      </div>
      <a class="btn btn--ghost btn--block buy__now-m" data-now href="https://apolostationey.com/cart/${v.id}:1">${t('product.buy_now_m')}</a>

      <ul class="assure">
        <li>${ICON.truck}<div>${t('product.assure.delivery')}</div></li>
        <li>${ICON.cash}<div>${t('product.assure.cod')}</div></li>
        <li>${ICON.shield}<div>${t('product.assure.guarantee')}</div></li>
        <li>${ICON.phone}<div>${t('product.assure.support', { tel: CONTACT.phone, phone: CONTACT.phoneLabel })}</div></li>
      </ul>

      <div class="details">
        ${p.body ? `<details open><summary>${t('product.desc')} ${ICON.chev}</summary><div class="rich">${p.body}</div></details>` : ''}
        <details ${p.body ? '' : 'open'}><summary>${t('product.details')} ${ICON.chev}</summary>
          <dl class="spec">
            <dt>${t('product.spec.brand')}</dt><dd>${esc(/^apolo/i.test(p.vendor) ? 'APOLO' : p.vendor)}</dd>
            ${col ? `<dt>${t('product.spec.category')}</dt><dd><a href="/collections/${col.handle}">${esc(colTitle(col))}</a></dd>` : ''}
            ${spec.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join('')}
            ${p.options.map(o => `<dt>${esc(optName(o.name))}</dt><dd>${o.values.map(val => esc(optVal(val))).join(', ')}</dd>`).join('')}
          </dl>
        </details>
        <details><summary>${esc(t('product.returns'))} ${ICON.chev}</summary>
          <div class="rich"><p>${t('product.returns.text')}</p></div>
        </details>
      </div>
    </div>
  </div>`;
}

/** "More products" under the buy box; '' when there is nothing to show. */
export function relatedHTML(c, p) {
  const rel = related(c, p, 10);
  if (!rel.length) return '';
  const col = p.collections[0];
  return `
      <div class="wrap"><div class="sec-head sec-head--row">
        <div><p class="kicker">${col ? t('product.more_in', { category: esc(colTitle(col)) }) : t('product.also_need')}</p>
             <h2>${t('product.same_desk')}</h2></div>
        <div class="sec-head__end">
          ${col ? `<a class="link-arrow" href="/collections/${col.handle}">${t('product.see_all', { n: col.items.length })} ${ICON.arrow}</a>` : ''}
          <div class="rail-ctl" data-for="relRail">
            <button type="button" class="tool tool--line" data-dir="-1" aria-label="${esc(t('product.rail.back'))}"></button>
            <button type="button" class="tool tool--line" data-dir="1" aria-label="${esc(t('product.rail.forward'))}"></button>
          </div>
        </div>
      </div></div>
      <div class="rail" id="relRail" tabindex="0" aria-label="${esc(t('product.rail.label'))}">${rel.map(x => card(x)).join('')}</div>`;
}

export function missingHTML() {
  return `
    <div class="lost">
      <div class="blank__page" aria-hidden="true"></div>
      <h1>${t('product.missing.title')}</h1>
      <p>${t('product.missing.text')}</p>
      <div class="visit__cta">
        <button type="button" class="btn btn--ink" data-open="search">${ICON.search} ${t('product.missing.search')}</button>
        <a class="btn btn--ghost" href="/shop">${t('product.missing.browse')}</a>
      </div>
    </div>`;
}
