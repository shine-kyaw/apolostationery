/* ==========================================================================
   APOLO — home page, below the film
   Categories, product shelves and campaigns, all built from the catalogue.
   The film (hero.js) and this file never talk to each other: either can fail
   without taking the other down.
   ========================================================================== */

import { mountChrome, ICON } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { catalog, photo, esc } from '../store/catalog.js';
import { wireRails } from '../site/rail.js';

mountChrome({ home: true });
wireQuickAdd();

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

/* The product that stands for each big category, and how it lies on the
   page. The sharpener photo shows three; the crop keeps the magenta one
   (the same crop the film uses). */
const FEATURE = {
  'books':               { h: 'copy-of-apolo-drawing-book-55-gsm-80-pages-12-pcs', r: -6 },
  'writing-instruments': { h: 'apolo-color-pencil-36-colors', r: 9 },
  'desk-accessories':    { h: 'copy-of-office-stapler-a191b', r: -14 },
  'stationery-supplies': { h: 'apolo-pencil-sharpener-a-210', r: 12, c: [0.329, 0.226, 0.378] },
  'copy-paper':          { h: 'copy-of-apolo-color-paper-70-gsm-a4-500-sheets', r: -5 }
};

document.getElementById('campRail').innerHTML = CAMPAIGNS.map((c, i) => `
  <a class="camp__slide" href="${c.href}">
    <img src="${sized(c.src, 900)}" srcset="${sized(c.src, 600)} 600w, ${sized(c.src, 900)} 900w, ${sized(c.src, 1400)} 1400w"
         sizes="(max-width:700px) 86vw, 760px" alt="${esc(c.alt)}" width="870" height="494" loading="lazy" decoding="async">
  </a>`).join('');

catalog().then(c => {
  /* ---- categories ----------------------------------------------------
     The film ends on a desk of real APOLO products; the index continues it.
     The five big categories each get one real product lying on a sheet of
     paper, which lifts when you reach for it. The four smaller ones are
     written into a ruled notebook index underneath. */
  const num = col => String(c.collections.indexOf(col) + 1).padStart(2, '0');
  const big = [], small = [];
  for (const col of c.collections) (FEATURE[col.handle] ? big : small).push(col);

  document.getElementById('cats').innerHTML = `
    <div class="desk">${big.map(col => {
      const f = FEATURE[col.handle];
      const p = c.byHandle.get(f.h) || col.items[0];
      const im = p && p.images[0] && (f.c ? { ...p.images[0], c: f.c } : p.images[0]);
      return `
      <a class="tile tile--${col.handle}" href="/collections/${col.handle}" style="--r:${f.r}deg">
        <span class="tile__txt">
          <span class="tile__i">${num(col)}</span>
          <span class="tile__t">${esc(col.title)}</span>
          <span class="tile__my my" lang="my">${col.my}</span>
          <span class="tile__b">${esc(col.blurb)}</span>
        </span>
        <span class="tile__go">${col.items.length} products ${ICON.arrow}</span>
        <span class="tile__obj" aria-hidden="true"><span class="tile__ph">${photo(im, { w: 420 })}</span></span>
      </a>`;
    }).join('')}</div>
    <ol class="index" aria-label="More categories">${small.map(col => `
      <li><a href="/collections/${col.handle}">
        <span class="index__i">${num(col)}</span>
        <span class="index__t">${esc(col.title)}</span>
        <span class="index__my my" lang="my">${col.my}</span>
        <span class="index__b">${esc(col.blurb)}</span>
        <span class="index__n">${col.items.length}</span>
        ${ICON.arrow}
      </a></li>`).join('')}</ol>`;

  /* ---- shelves ---- */
  for (const el of document.querySelectorAll('[data-shelf]')) {
    const col = c.byCollection.get(el.dataset.shelf);
    if (!col) { el.remove(); continue; }
    const id = 'rail-' + col.handle;
    el.setAttribute('aria-labelledby', id + '-t');
    el.innerHTML = `
      <div class="wrap">
        <div class="sec-head sec-head--row">
          <div>
            <p class="eyebrow"><span>${el.dataset.n}</span> <span class="my" lang="my">${col.my}</span></p>
            <h2 id="${id}-t">${esc(col.title)}</h2>
          </div>
          <div class="sec-head__end">
            <a class="link-arrow" href="/collections/${col.handle}">See all ${col.items.length} ${ICON.arrow}</a>
            <div class="rail-ctl" data-for="${id}">
              <button type="button" class="tool tool--line" data-dir="-1" aria-label="Scroll ${esc(col.title)} back"></button>
              <button type="button" class="tool tool--line" data-dir="1" aria-label="Scroll ${esc(col.title)} forward"></button>
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
  document.getElementById('cats').innerHTML =
    '<p class="err">The catalogue didn’t load. <a href="/shop">Try the shop page</a> or call 09 777 271 999.</p>';
});

wireRails();
