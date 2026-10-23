/* ==========================================================================
   APOLO — home page markup, below the film
   Pure: data in, HTML out, shared by js/pages/home.js and tools/build.mjs.
   ========================================================================== */

import { ICON } from '../site/chrome.js';
import { card } from '../site/card.js';
import { photo, esc, money, shortTitle, colTitle, colShort, colBlurb } from '../store/catalog.js';
import { t, isMy } from '../i18n.js';

const LOGO = '/img/apolo-logo.png';

/* APOLO's own homepage campaign artwork, each pointed at what it advertises. */
const CAMPAIGNS = [
  { src: 'https://apolostationey.com/cdn/shop/files/Apolo1_copy.jpg?v=1716622025', href: '/shop', alt: () => t('home.camp.1.alt') },
  { src: 'https://apolostationey.com/cdn/shop/files/WSL.jpg?v=1718168729',
    href: '/products/apolo-exercise-book-55-gsm-80-pages-single-line', alt: () => t('home.camp.2.alt') },
  { src: 'https://apolostationey.com/cdn/shop/files/Apolo6_c7e3e1ed-9e93-4e82-b8b1-aa68ee7639a4.jpg?v=1716625436',
    href: '/collections/writing-instruments', alt: () => t('home.camp.3.alt') },
  { src: 'https://apolostationey.com/cdn/shop/files/Banner01_copy_8c08478a-9a56-4abe-9e36-7c9b0db0fe39.jpg?v=1712202199',
    href: '/products/apolo-note-book-70-gsm-80-pages-single-line', alt: () => t('home.camp.4.alt') },
  { src: 'https://apolostationey.com/cdn/shop/files/Frame6_31224a9a-62a1-4344-8c9f-5df402a9231d.jpg?v=1679561427',
    href: '/products/apolo-sticky-note', alt: () => t('home.camp.5.alt') }
];
const sized = (src, w) => src + '&width=' + w;

/* The five big categories as exercise books. Cover colours are the pastels
   APOLO prints its own covers in; each cover's illustration panel shows one
   real product. The Books cover carries the drawing book whose cover is a
   house — the one the film just drew. The sharpener photo shows three; the
   crop keeps the magenta one (the same crop the film uses). */
const COVERS = {
  'books':               { h: 'copy-of-apolo-drawing-book-55-gsm-80-pages-12-pcs', cover: '#F5A9CB', ink: '#6E1846' },
  'writing-instruments': { h: 'apolo-color-pencil-36-colors',                     cover: '#A7B7EF', ink: '#1F2C6B' },
  'desk-accessories':    { h: 'copy-of-office-stapler-a191b',                     cover: '#F6B26E', ink: '#6A3407' },
  'stationery-supplies': { h: 'apolo-pencil-sharpener-a-210',                     cover: '#F3D762', ink: '#5B4A05', c: [0.329, 0.226, 0.378] },
  'copy-paper':          { h: 'copy-of-apolo-color-paper-70-gsm-a4-500-sheets',   cover: '#9FD8BF', ink: '#14513A' }
};

/* The school list: single-variant essentials, so a tick is a real add. */
const LIST = [
  'apolo-exercise-book-55-gsm-80-pages-single-line',
  'copy-of-apolo-drawing-book-55-gsm-80-pages-12-pcs',
  'apolo-pencil-a-221c-2b',
  'eraser-a-150',
  'apolo-color-pencil-36-colors',
  'apolo-oil-pastel-a-242-12-colors',
  'geometry-ruler-set',
  'correction-pen-a-107-color-copy'
];

export function campHTML() {
  return CAMPAIGNS.map(c => `
  <a class="camp__slide" href="${c.href}">
    <img src="${sized(c.src, 900)}" srcset="${sized(c.src, 600)} 600w, ${sized(c.src, 900)} 900w, ${sized(c.src, 1400)} 1400w"
         sizes="(max-width:700px) 86vw, 640px" alt="${esc(c.alt())}" width="870" height="494" loading="lazy" decoding="async">
  </a>`).join('');
}

export function booksHTML(c) {
  return c.collections.filter(col => COVERS[col.handle]).map((col, i) => {
    const f = COVERS[col.handle];
    const p = c.byHandle.get(f.h) || col.items[0];
    const im = p && p.images[0] && (f.c ? { ...p.images[0], c: f.c } : p.images[0]);
    return `
    <a class="book" href="/collections/${col.handle}" style="--cover:${f.cover};--cink:${f.ink};--i:${i};--d:${Math.abs(i - 2)}">
      <span class="book__pages" aria-hidden="true"></span>
      <span class="book__face">
        <span class="book__spine" aria-hidden="true"></span>
        <span class="book__top">
          <img src="${LOGO}" alt="" width="200" height="105">
          <span class="book__series my" lang="my">${isMy ? esc(col.short) : col.my}</span>
        </span>
        <span class="book__art" aria-hidden="true">${photo(im, { w: 260 })}</span>
        <span class="book__label">
          <span class="book__row"><em>${t('home.book.subject')}</em><b>${esc(colShort(col))}</b></span>
          <span class="book__row"><em>${t('home.book.items')}</em><b>${col.items.length}</b></span>
        </span>
        <span class="sr-only">${t('home.book.sr', { title: esc(colTitle(col)), n: col.items.length })}</span>
      </span>
    </a>`;
  }).join('');
}

export function indexHTML(c) {
  return c.collections.filter(col => !COVERS[col.handle]).map(col => `
    <li><a href="/collections/${col.handle}">
      <span class="index__t">${esc(colTitle(col))}</span>
      ${isMy ? '<span class="index__my" aria-hidden="true"></span>' : `<span class="index__my my" lang="my">${col.my}</span>`}
      <span class="index__b">${esc(colBlurb(col))}</span>
      <span class="index__n">${col.items.length}</span>
      ${ICON.arrow}
    </a></li>`).join('');
}

/* ---- the school list ---- */
export const listItems = c => LIST.map(h => c.byHandle.get(h)).filter(p => p && p.variants.length === 1 && p.available);

export function listRowsHTML(items, inCart = () => 0) {
  return items.map(p => {
    const v = p.variants[0], n = inCart(v.id);
    return `
      <li class="row${n ? ' is-ticked' : ''}">
        <button type="button" class="row__tick" data-tick="${v.id}" aria-pressed="${!!n}"
                aria-label="${esc(n ? t('home.list.remove.aria', { title: shortTitle(p) }) : t('home.list.add.aria', { title: shortTitle(p) }))}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>
        </button>
        <a class="row__img" href="${p.url}" tabindex="-1" aria-hidden="true">${photo(p.images[0], { w: 64 })}</a>
        <a class="row__t" href="${p.url}">${esc(shortTitle(p))}</a>
        <span class="row__p">${n > 1 ? `<small>${n} ×</small> ` : ''}${money(v.price)}</span>
      </li>`;
  }).join('');
}

export function listFootHTML(items, inCart = () => 0) {
  const todo = items.filter(p => !inCart(p.variants[0].id));
  const sum = todo.reduce((s, p) => s + p.variants[0].price, 0);
  return todo.length
    ? `<button type="button" class="btn btn--brand" data-add-all>${t('home.list.addall', { price: money(sum) })}</button>
         <span class="list__note">${todo.length === items.length ? t('home.list.count', { n: items.length }) : t('home.list.todo', { n: todo.length })}</span>`
    : `<span class="list__done">${t('home.list.done')}</span>
         <button type="button" class="btn btn--ink" data-open="cart">${t('home.list.viewcart')}</button>`;
}

/* ---- a shelf of one category ---- */
export function shelfHTML(col, { kicker = '', titleKey = '' } = {}) {
  const id = 'rail-' + col.handle;
  return `
      <div class="wrap">
        <div class="sec-head sec-head--row">
          <div>
            <p class="kicker my" lang="my">${isMy ? esc(col.short) : (kicker || col.my)}</p>
            <h2 id="${id}-t">${titleKey ? t(titleKey) : esc(colTitle(col))}</h2>
          </div>
          <div class="sec-head__end">
            ${col.items.length > 6 ? `<a class="link-arrow" href="/collections/${col.handle}">${t('home.shelf.all', { n: col.items.length })} ${ICON.arrow}</a>` : ''}
            <div class="rail-ctl" data-for="${id}">
              <button type="button" class="tool tool--line" data-dir="-1" aria-label="${t('home.shelf.back')}"></button>
              <button type="button" class="tool tool--line" data-dir="1" aria-label="${t('home.shelf.forward')}"></button>
            </div>
          </div>
        </div>
      </div>
      <div class="rail" id="${id}" tabindex="0" aria-label="${esc(t('home.shelf.aria', { title: colTitle(col) }))}">
        ${col.items.slice(0, 12).map(p => card(p)).join('')}
        ${col.items.length > 12 ? `<a class="rail__more" href="/collections/${col.handle}">
          <span>${t('home.shelf.more', { n: col.items.length, name: esc(colTitle(col).toLowerCase()) })}</span>${ICON.arrow}
        </a>` : ''}
      </div>`;
}
