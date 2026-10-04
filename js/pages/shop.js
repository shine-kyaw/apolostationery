/* ==========================================================================
   APOLO — shop: /shop, /collections/:handle and /search?q=
   One page, three entry points. Filter and sort state lives in the query
   string, so a filtered view can be shared, bookmarked and survives Back.
   ========================================================================== */

import { mountChrome, ICON } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { catalog, search, SORTS, esc, money } from '../store/catalog.js';

mountChrome();
wireQuickAdd();

const $ = s => document.querySelector(s);
const PAGE = 24;

/* Vendors as a person would name them. "Apolo Stationery Myanmar" is the
   same brand under a second Shopify vendor name. */
const brandOf = p => /^apolo/i.test(p.vendor) ? 'APOLO' : p.vendor;
const BANDS = [
  { id: 'u2',  label: `Under ${money(2000)}`,              test: p => p.min < 2000 },
  { id: '2-10', label: `${money(2000)} – ${money(10000)}`,  test: p => p.min >= 2000 && p.min < 10000 },
  { id: '10-30', label: `${money(10000)} – ${money(30000)}`, test: p => p.min >= 10000 && p.min < 30000 },
  { id: 'o30', label: `${money(30000)} and over`,           test: p => p.min >= 30000 }
];

const path = location.pathname.replace(/\/$/, '');
const params = new URLSearchParams(location.search);
const mode = path === '/search' ? 'search' : path.startsWith('/collections/') ? 'collection' : 'all';
const handle = mode === 'collection' ? decodeURIComponent(path.split('/')[2]) : null;

const state = {
  sort: SORTS[params.get('sort')] ? params.get('sort') : 'featured',
  brands: new Set((params.get('brand') || '').split(',').filter(Boolean)),
  band: params.get('price') || '',
  q: params.get('q') || '',
  shown: PAGE
};

catalog().then(c => {
  const col = handle ? c.byCollection.get(handle) : null;
  let base, title, crumb;

  if (mode === 'collection' && !col) return notFound(c);

  if (mode === 'collection') {
    base = col.items; title = col.title; crumb = col.title;
    document.title = `${col.title} — APOLO Stationery Myanmar`;
    setMeta(`${col.blurb}. ${col.items.length} APOLO products with door-to-door delivery and cash on delivery across Myanmar.`);
    head(`<p class="eyebrow"><span>${String(c.collections.indexOf(col) + 1).padStart(2, '0')}</span>
             <span class="my" lang="my">${col.my}</span></p>
          <h1 class="page-h1">${esc(col.title)}</h1>
          <p class="shop__sub">${esc(col.blurb)}.</p>`);
  } else if (mode === 'search') {
    base = state.q ? search(c, state.q) : [];
    title = 'Search'; crumb = 'Search';
    document.title = (state.q ? `“${state.q}” — ` : '') + 'Search — APOLO Stationery Myanmar';
    head(`<p class="eyebrow"><span>${ICON.search}</span> Search</p>
          <h1 class="page-h1">${state.q ? `Results for <em>“${esc(state.q)}”</em>` : 'Search the catalogue'}</h1>
          <form class="search-form" action="/search" role="search">
            <label class="sr-only" for="q2">Search products</label>
            <input id="q2" name="q" type="search" value="${esc(state.q)}" placeholder="Pens, exercise books, A4 paper…">
            <button class="btn btn--ink">Search</button>
          </form>`);
    /* relevance is the useful order for a search */
    SORTS.featured.label = 'Best match';
  } else {
    base = c.products; title = 'Shop'; crumb = 'Shop all';
    head(`<p class="eyebrow"><span>06</span> The catalogue</p>
          <h1 class="page-h1">Every APOLO <em>product</em></h1>
          <p class="shop__sub">${c.products.length} products across ${c.collections.length} categories &mdash; exercise books and
             pens to files, ledgers and copy paper by the ream.</p>`);
  }

  $('#crumbs').insertAdjacentHTML('beforeend', mode === 'all'
    ? `<li><span aria-current="page">${crumb}</span></li>`
    : `<li><a href="/shop">Shop</a></li><li><span aria-current="page">${esc(crumb)}</span></li>`);

  $('#tabs').innerHTML =
    `<a href="/shop" ${mode === 'all' ? 'aria-current="page"' : ''}>All <small>${c.products.length}</small></a>` +
    c.collections.map(x => `<a href="/collections/${x.handle}" ${x === col ? 'aria-current="page"' : ''}>
       ${esc(x.title)} <small>${x.items.length}</small></a>`).join('');
  $('#tabs [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  $('#sort').innerHTML = Object.entries(SORTS).map(([k, s]) =>
    `<option value="${k}" ${k === state.sort ? 'selected' : ''}>${s.label}</option>`).join('');
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; state.shown = PAGE; update(); });

  const brands = [...new Set(base.map(brandOf))].sort((a, b) => a === 'APOLO' ? -1 : b === 'APOLO' ? 1 : a.localeCompare(b));
  const filters = $('#filters');

  const renderFilters = () => {
    /* counts are for the other filter held constant, so a box never offers a dead end */
    const byBand  = base.filter(p => !state.brands.size || state.brands.has(brandOf(p)));
    const byBrand = base.filter(p => !state.band || BANDS.find(b => b.id === state.band).test(p));
    filters.innerHTML = `
      ${brands.length > 1 ? `<fieldset><legend>Brand</legend>${brands.map(b => {
        const n = byBrand.filter(p => brandOf(p) === b).length;
        return `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${state.brands.has(b) ? 'checked' : ''} ${n ? '' : 'disabled'}>
                <span>${esc(b)}</span><small>${n}</small></label>`;
      }).join('')}</fieldset>` : ''}
      <fieldset><legend>Price</legend>
        <label class="check"><input type="radio" name="price" value="" ${state.band ? '' : 'checked'}><span>Any price</span></label>
        ${BANDS.map(b => {
          const n = byBand.filter(b.test).length;
          return `<label class="check"><input type="radio" name="price" value="${b.id}" ${state.band === b.id ? 'checked' : ''} ${n ? '' : 'disabled'}>
                  <span>${b.label}</span><small>${n}</small></label>`;
        }).join('')}
      </fieldset>
      ${state.brands.size || state.band ? '<button type="button" class="filters__clear" id="clear">Clear filters</button>' : ''}`;
  };

  filters.addEventListener('change', e => {
    if (e.target.name === 'brand') e.target.checked ? state.brands.add(e.target.value) : state.brands.delete(e.target.value);
    if (e.target.name === 'price') state.band = e.target.value;
    state.shown = PAGE; update();
  });
  filters.addEventListener('click', e => {
    if (e.target.id === 'clear') { state.brands.clear(); state.band = ''; state.shown = PAGE; update(); }
  });
  $('#filterBtn').addEventListener('click', e => {
    const open = filters.classList.toggle('is-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  $('#moreBtn').addEventListener('click', () => {
    const from = state.shown; state.shown += PAGE; update(false);
    $('#grid').children[from]?.querySelector('a')?.focus({ preventScroll: true });
  });

  function update(syncUrl = true) {
    let list = base.filter(p =>
      (!state.brands.size || state.brands.has(brandOf(p))) &&
      (!state.band || BANDS.find(b => b.id === state.band).test(p)));
    const sort = SORTS[state.sort].fn;
    if (sort) list = list.slice().sort(sort);

    const grid = $('#grid');
    if (!list.length) {
      grid.innerHTML = `<div class="none" style="grid-column:1/-1">
        <div class="blank__page" aria-hidden="true"></div>
        <p><b>${mode === 'search' && !base.length
          ? (state.q ? `Nothing matches “${esc(state.q)}”.` : 'Type something to search for.')
          : 'No products match these filters.'}</b></p>
        <p>${mode === 'search' ? 'Try a product type, like <em>pen</em>, <em>A4</em> or <em>exercise book</em>.' : 'Try removing a filter.'}</p>
        <a class="btn btn--ghost" href="/shop">Browse everything</a></div>`;
    } else {
      grid.innerHTML = list.slice(0, state.shown).map((p, i) => card(p, { eager: i < 8 })).join('');
    }
    $('#more').hidden = list.length <= state.shown;
    $('#moreBtn').textContent = `Show more (${list.length - state.shown} left)`;
    $('#count').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
    renderFilters();

    if (syncUrl) {
      const q = new URLSearchParams();
      if (state.q) q.set('q', state.q);
      if (state.sort !== 'featured') q.set('sort', state.sort);
      if (state.brands.size) q.set('brand', [...state.brands].join(','));
      if (state.band) q.set('price', state.band);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
  }
  update();
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  $('#grid').innerHTML = '<p class="err">The catalogue didn’t load. Please refresh, or call <a href="tel:+959777271999">09 777 271 999</a> to order.</p>';
});

function head(html) { $('#shopHead').innerHTML = html; }
function setMeta(text) { document.querySelector('meta[name=description]').setAttribute('content', text); }

function notFound(c) {
  document.title = 'Category not found — APOLO Stationery Myanmar';
  head(`<p class="eyebrow"><span>404</span> Not found</p><h1 class="page-h1">That category doesn’t exist</h1>
        <p class="shop__sub">It may have been renamed. Every category is below.</p>`);
  $('#crumbs').insertAdjacentHTML('beforeend', '<li><a href="/shop">Shop</a></li>');
  $('#tabs').innerHTML = c.collections.map(x => `<a href="/collections/${x.handle}">${esc(x.title)} <small>${x.items.length}</small></a>`).join('');
  document.querySelector('.bar').hidden = true;
  $('#filters').hidden = true;
}
