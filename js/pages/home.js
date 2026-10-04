/* ==========================================================================
   APOLO — home page, below the film
   Categories, product shelves and campaigns, all built from the catalogue.
   The film (hero.js) and this file never talk to each other: either can fail
   without taking the other down.
   ========================================================================== */

import { mountChrome, ICON } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { catalog, img, esc } from '../store/catalog.js';
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

document.getElementById('campRail').innerHTML = CAMPAIGNS.map((c, i) => `
  <a class="camp__slide" href="${c.href}">
    <img src="${sized(c.src, 900)}" srcset="${sized(c.src, 600)} 600w, ${sized(c.src, 900)} 900w, ${sized(c.src, 1400)} 1400w"
         sizes="(max-width:700px) 86vw, 760px" alt="${esc(c.alt)}" width="870" height="494" loading="lazy" decoding="async">
  </a>`).join('');

catalog().then(c => {
  /* ---- categories: APOLO's own illustrated catalogue pages as covers ---- */
  document.getElementById('cats').innerHTML = c.collections.map((col, i) => `
    <a class="cat" href="/collections/${col.handle}">
      <span class="cat__img">${col.image ? `<img src="${img(col.image, 520)}" alt="" loading="lazy" decoding="async" width="520" height="735">` : ''}</span>
      <span class="cat__body">
        <span class="cat__i">${String(i + 1).padStart(2, '0')}</span>
        <span class="cat__t">${esc(col.title)}</span>
        <span class="cat__my my" lang="my">${col.my}</span>
        <span class="cat__b">${esc(col.blurb)}</span>
        <span class="cat__go">${col.items.length} products ${ICON.arrow}</span>
      </span>
    </a>`).join('');

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
