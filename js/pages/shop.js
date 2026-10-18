/* ==========================================================================
   APOLO — shop: /shop, /collections/:handle and /search?q=
   One page, three entry points. Filter and sort state lives in the query
   string, so a filtered view can be shared, bookmarked and survives Back.
   ========================================================================== */

import { mountChrome, ICON } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { catalog, search, SORTS, esc, money, colTitle, colBlurb } from '../store/catalog.js';
import { t, isMy } from '../i18n.js';

mountChrome();
wireQuickAdd();

const $ = s => document.querySelector(s);
const PAGE = 24;

/* Vendors as a person would name them. "Apolo Stationery Myanmar" is the
   same brand under a second Shopify vendor name. */
const brandOf = p => /^apolo/i.test(p.vendor) ? 'APOLO' : p.vendor;
const BANDS = [
  { id: 'u2',  label: t('shop.band.under', { price: money(2000) }),              test: p => p.min < 2000 },
  { id: '2-10', label: t('shop.band.range', { a: money(2000), b: money(10000) }),  test: p => p.min >= 2000 && p.min < 10000 },
  { id: '10-30', label: t('shop.band.range', { a: money(10000), b: money(30000) }), test: p => p.min >= 10000 && p.min < 30000 },
  { id: 'o30', label: t('shop.band.over', { price: money(30000) }),           test: p => p.min >= 30000 }
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
    base = col.items; title = colTitle(col); crumb = colTitle(col);
    document.title = t('shop.title.collection', { title: colTitle(col) });
    setMeta(t('shop.meta.collection', { blurb: colBlurb(col), n: col.items.length }));
    head(`${!isMy && col.my ? `<p class="kicker my" lang="my">${col.my}</p>` : ''}
          <h1 class="page-h1">${esc(colTitle(col))}</h1>
          <p class="shop__sub">${t('shop.sub.collection', { blurb: esc(colBlurb(col)) })}</p>`);
  } else if (mode === 'search') {
    base = state.q ? search(c, state.q) : [];
    title = t('shop.crumb.search'); crumb = t('shop.crumb.search');
    document.title = state.q ? t('shop.title.search_q', { q: state.q }) : t('shop.title.search');
    head(`<p class="kicker">${t('shop.search.kicker')}</p>
          <h1 class="page-h1">${state.q ? t('shop.search.results', { q: esc(state.q) }) : t('shop.search.heading')}</h1>
          <form class="search-form" action="/search" role="search">
            <label class="sr-only" for="q2">${t('shop.search.label')}</label>
            <input id="q2" name="q" type="search" value="${esc(state.q)}" placeholder="${esc(t('shop.search.placeholder'))}">
            <button class="btn btn--ink">${t('shop.search.btn')}</button>
          </form>`);
  } else {
    base = c.featured; title = t('shop.crumb.shop'); crumb = t('shop.crumb.all');
    head(`<p class="kicker">${t('shop.kicker.catalogue')}</p>
          <h1 class="page-h1">${t('shop.all.heading')}</h1>
          <p class="shop__sub">${t('shop.all.sub', { n: c.products.length, c: c.collections.length })}</p>`);
  }

  $('#crumbs').insertAdjacentHTML('beforeend', mode === 'all'
    ? `<li><span aria-current="page">${crumb}</span></li>`
    : `<li><a href="/shop">${t('shop.crumb.shop')}</a></li><li><span aria-current="page">${esc(crumb)}</span></li>`);

  $('#tabs').innerHTML =
    `<a href="/shop" ${mode === 'all' ? 'aria-current="page"' : ''}>${t('shop.tab.all')} <small>${c.products.length}</small></a>` +
    c.collections.map(x => `<a href="/collections/${x.handle}" ${x === col ? 'aria-current="page"' : ''}>
       ${esc(colTitle(x))} <small>${x.items.length}</small></a>`).join('');
  $('#tabs [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  /* relevance is the useful order for a search */
  $('#sort').innerHTML = Object.entries(SORTS).map(([k, s]) =>
    `<option value="${k}" ${k === state.sort ? 'selected' : ''}>${k === 'featured' && mode === 'search' ? t('sort.match') : s.label}</option>`).join('');
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; state.shown = PAGE; update(); });

  const brands = [...new Set(base.map(brandOf))].sort((a, b) => a === 'APOLO' ? -1 : b === 'APOLO' ? 1 : a.localeCompare(b));
  const filters = $('#filters');

  const renderFilters = () => {
    /* counts are for the other filter held constant, so a box never offers a dead end */
    const byBand  = base.filter(p => !state.brands.size || state.brands.has(brandOf(p)));
    const byBrand = base.filter(p => !state.band || BANDS.find(b => b.id === state.band).test(p));
    filters.innerHTML = `
      ${brands.length > 1 ? `<fieldset><legend>${t('shop.filter.brand')}</legend>${brands.map(b => {
        const n = byBrand.filter(p => brandOf(p) === b).length;
        return `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${state.brands.has(b) ? 'checked' : ''} ${n ? '' : 'disabled'}>
                <span>${esc(b)}</span><small>${n}</small></label>`;
      }).join('')}</fieldset>` : ''}
      <fieldset><legend>${t('shop.filter.price')}</legend>
        <label class="check"><input type="radio" name="price" value="" ${state.band ? '' : 'checked'}><span>${t('shop.filter.any_price')}</span></label>
        ${BANDS.map(b => {
          const n = byBand.filter(b.test).length;
          return `<label class="check"><input type="radio" name="price" value="${b.id}" ${state.band === b.id ? 'checked' : ''} ${n ? '' : 'disabled'}>
                  <span>${b.label}</span><small>${n}</small></label>`;
        }).join('')}
      </fieldset>
      ${state.brands.size || state.band ? '<button type="button" class="filters__clear" id="clear">' + t('shop.filter.clear') + '</button>' : ''}`;
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
          ? (state.q ? t('shop.none.search', { q: esc(state.q) }) : t('shop.none.type'))
          : t('shop.none.filters')}</b></p>
        <p>${mode === 'search' ? t('shop.none.hint_search') : t('shop.none.hint_filters')}</p>
        <a class="btn btn--ghost" href="/shop">${t('shop.none.browse')}</a></div>`;
    } else {
      grid.innerHTML = list.slice(0, state.shown).map((p, i) => card(p, { eager: i < 8 })).join('');
    }
    $('#more').hidden = list.length <= state.shown;
    $('#moreBtn').textContent = t('shop.more', { n: list.length - state.shown });
    $('#count').textContent = (list.length === 1 ? t('shop.count.one', { n: list.length }) : t('shop.count.many', { n: list.length }));
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
  $('#grid').innerHTML = `<p class="err">${t('shop.error.load')}</p>`;
});

function head(html) { $('#shopHead').innerHTML = html; }
function setMeta(text) { document.querySelector('meta[name=description]').setAttribute('content', text); }

function notFound(c) {
  document.title = t('shop.title.notfound');
  head(`<p class="kicker">${t('shop.notfound.kicker')}</p><h1 class="page-h1">${t('shop.notfound.heading')}</h1>
        <p class="shop__sub">${t('shop.notfound.sub')}</p>`);
  $('#crumbs').insertAdjacentHTML('beforeend', `<li><a href="/shop">${t('shop.crumb.shop')}</a></li>`);
  $('#tabs').innerHTML = c.collections.map(x => `<a href="/collections/${x.handle}">${esc(colTitle(x))} <small>${x.items.length}</small></a>`).join('');
  document.querySelector('.bar').hidden = true;
  $('#filters').hidden = true;
}
