/* ==========================================================================
   APOLO — home page, below the film
   The magenta flood, the categories as a fan of exercise books, the school
   list, one shelf, the posters. All built from the catalogue. The film
   (hero.js) and this file never talk to each other: either can fail without
   taking the other down.
   ========================================================================== */

import { mountChrome, ICON, openDialog, toast } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { catalog, photo, esc, money, shortTitle } from '../store/catalog.js';
import { cart } from '../store/cart.js';
import { wireRails } from '../site/rail.js';

mountChrome({ home: true });
wireQuickAdd();

const LOGO = '/img/apolo-logo.png';

/* APOLO's own homepage campaign artwork, each pointed at what it advertises. */
const CAMPAIGNS = [
  { src: 'https://apolostationey.com/cdn/shop/files/Apolo1_copy.jpg?v=1716622025',
    href: '/shop', alt: 'School Season Sale — APOLO pens, highlighters, rulers and correction pens' },
  { src: 'https://apolostationey.com/cdn/shop/files/WSL.jpg?v=1718168729',
    href: '/products/apolo-exercise-book-55-gsm-80-pages-single-line', alt: 'New APOLO exercise book covers with the APOLO rabbit' },
  { src: 'https://apolostationey.com/cdn/shop/files/Apolo6_c7e3e1ed-9e93-4e82-b8b1-aa68ee7639a4.jpg?v=1716625436',
    href: '/collections/writing-instruments', alt: 'APOLO — let’s draw: sketch books, crayons, colour pens and oil pastels' },
  { src: 'https://apolostationey.com/cdn/shop/files/Banner01_copy_8c08478a-9a56-4abe-9e36-7c9b0db0fe39.jpg?v=1712202199',
    href: '/products/apolo-note-book-70-gsm-80-pages-single-line', alt: 'The best quality APOLO note books in pink, blue and orange' },
  { src: 'https://apolostationey.com/cdn/shop/files/Frame6_31224a9a-62a1-4344-8c9f-5df402a9231d.jpg?v=1679561427',
    href: '/products/apolo-sticky-note', alt: 'APOLO sticky notes in pastel colours, five sizes' }
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

/* ---- posters (no catalogue needed) ---- */
document.getElementById('campRail').innerHTML = CAMPAIGNS.map(c => `
  <a class="camp__slide" href="${c.href}">
    <img src="${sized(c.src, 900)}" srcset="${sized(c.src, 600)} 600w, ${sized(c.src, 900)} 900w, ${sized(c.src, 1400)} 1400w"
         sizes="(max-width:700px) 86vw, 640px" alt="${esc(c.alt)}" width="870" height="494" loading="lazy" decoding="async">
  </a>`).join('');

catalog().then(c => {
  document.querySelectorAll('[data-count-products]').forEach(el => { el.textContent = c.products.length; });

  /* ---- the exercise books ---- */
  const big = c.collections.filter(col => COVERS[col.handle]);
  const small = c.collections.filter(col => !COVERS[col.handle]);

  document.getElementById('books').innerHTML = big.map((col, i) => {
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
          <span class="book__series my" lang="my">${col.my}</span>
        </span>
        <span class="book__art" aria-hidden="true">${photo(im, { w: 260 })}</span>
        <span class="book__label">
          <span class="book__row"><em>Subject</em><b>${esc(col.short)}</b></span>
          <span class="book__row"><em>Items</em><b>${col.items.length}</b></span>
        </span>
        <span class="sr-only">${esc(col.title)}, ${col.items.length} products</span>
      </span>
    </a>`;
  }).join('');

  document.getElementById('index').innerHTML = small.map(col => `
    <li><a href="/collections/${col.handle}">
      <span class="index__t">${esc(col.title)}</span>
      <span class="index__my my" lang="my">${col.my}</span>
      <span class="index__b">${esc(col.blurb)}</span>
      <span class="index__n">${col.items.length}</span>
      ${ICON.arrow}
    </a></li>`).join('');

  /* ---- the school list ---- */
  const items = LIST.map(h => c.byHandle.get(h)).filter(p => p && p.variants.length === 1 && p.available);
  const rows = document.getElementById('listRows'), foot = document.getElementById('listFoot');
  const inCart = id => cart.lines.find(l => l.id === id)?.qty || 0;

  const renderList = () => {
    rows.innerHTML = items.map(p => {
      const v = p.variants[0], n = inCart(v.id);
      return `
      <li class="row${n ? ' is-ticked' : ''}">
        <button type="button" class="row__tick" data-tick="${v.id}" aria-pressed="${!!n}"
                aria-label="${n ? 'Remove' : 'Add'} ${esc(shortTitle(p))} ${n ? 'from' : 'to'} cart">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>
        </button>
        <a class="row__img" href="/products/${p.handle}" tabindex="-1" aria-hidden="true">${photo(p.images[0], { w: 64 })}</a>
        <a class="row__t" href="/products/${p.handle}">${esc(shortTitle(p))}</a>
        <span class="row__p">${n > 1 ? `<small>${n} ×</small> ` : ''}${money(v.price)}</span>
      </li>`;
    }).join('');
    const todo = items.filter(p => !inCart(p.variants[0].id));
    const sum = todo.reduce((s, p) => s + p.variants[0].price, 0);
    foot.innerHTML = todo.length
      ? `<button type="button" class="btn btn--brand" data-add-all>Add the whole list &mdash; ${money(sum)}</button>
         <span class="list__note">${todo.length === items.length ? `${items.length} items` : `${todo.length} not in your cart yet`}</span>`
      : `<span class="list__done">Everything on the list is in your cart.</span>
         <button type="button" class="btn btn--ink" data-open="cart">View cart</button>`;
  };
  rows.addEventListener('click', e => {
    const b = e.target.closest('[data-tick]'); if (!b) return;
    const id = +b.dataset.tick;
    if (inCart(id)) cart.remove(id);
    else {
      cart.add(id, 1);
      const p = c.byVariant.get(id).product;
      toast(`<span><b>Added</b> ${esc(shortTitle(p))}</span>
             <button type="button" class="toast__go" data-open="cart">View cart (${cart.count})</button>`);
    }
  });
  foot.addEventListener('click', e => {
    if (!e.target.closest('[data-add-all]')) return;
    for (const p of items) if (!inCart(p.variants[0].id)) cart.add(p.variants[0].id, 1);
    openDialog('cart');
  });
  addEventListener('cart:change', renderList);
  renderList();

  /* ---- shelf ---- */
  for (const el of document.querySelectorAll('[data-shelf]')) {
    const col = c.byCollection.get(el.dataset.shelf);
    if (!col) { el.remove(); continue; }
    const id = 'rail-' + col.handle;
    el.setAttribute('aria-labelledby', id + '-t');
    el.innerHTML = `
      <div class="wrap">
        <div class="sec-head sec-head--row">
          <div>
            <p class="kicker my" lang="my">${el.dataset.kicker || col.my}</p>
            <h2 id="${id}-t">${el.dataset.title || esc(col.title)}</h2>
          </div>
          <div class="sec-head__end">
            <a class="link-arrow" href="/collections/${col.handle}">See all ${col.items.length} ${ICON.arrow}</a>
            <div class="rail-ctl" data-for="${id}">
              <button type="button" class="tool tool--line" data-dir="-1" aria-label="Scroll back"></button>
              <button type="button" class="tool tool--line" data-dir="1" aria-label="Scroll forward"></button>
            </div>
          </div>
        </div>
      </div>
      <div class="rail" id="${id}" tabindex="0" aria-label="${esc(col.title)}, scroll sideways">
        ${col.items.slice(0, 12).map(p => card(p)).join('')}
        <a class="rail__more" href="/collections/${col.handle}">
          <span>All ${col.items.length}<br>${esc(col.title.toLowerCase())}</span>${ICON.arrow}
        </a>
      </div>`;
  }
  wireRails();
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  document.getElementById('books').innerHTML =
    '<p class="err wrap">The catalogue didn’t load. <a href="/shop">Try the shop page</a> or call 09 777 271 999.</p>';
});

wireRails();
