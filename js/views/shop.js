/* ==========================================================================
   APOLO — shop, category and search markup
   Pure: data in, HTML out, shared by js/pages/shop.js and tools/build.mjs.
   ========================================================================== */

import { card } from '../site/card.js';
import { SORTS, esc, money, colTitle, colBlurb } from '../store/catalog.js';
import { t, isMy } from '../i18n.js';

export const PAGE = 24;

/* Vendors as a person would name them. "Apolo Stationery Myanmar" is the
   same brand under a second Shopify vendor name. */
export const brandOf = p => /^apolo/i.test(p.vendor) ? 'APOLO' : p.vendor;

/* labels are read when asked, so they are in the page's language */
export const bands = () => [
  { id: 'u2',    label: t('shop.band.under', { price: money(2000) }),               test: p => p.min < 2000 },
  { id: '2-10',  label: t('shop.band.range', { a: money(2000), b: money(10000) }),  test: p => p.min >= 2000 && p.min < 10000 },
  { id: '10-30', label: t('shop.band.range', { a: money(10000), b: money(30000) }), test: p => p.min >= 10000 && p.min < 30000 },
  { id: 'o30',   label: t('shop.band.over', { price: money(30000) }),               test: p => p.min >= 30000 }
];

export function headHTML(mode, { c, col, q = '' }) {
  if (mode === 'collection') return `${!isMy && col.my ? `<p class="kicker my" lang="my">${col.my}</p>` : ''}
          <h1 class="page-h1">${esc(colTitle(col))}</h1>
          <p class="shop__sub">${t('shop.sub.collection', { blurb: esc(colBlurb(col)) })}</p>`;
  if (mode === 'search') return `<p class="kicker">${t('shop.search.kicker')}</p>
          <h1 class="page-h1">${q ? t('shop.search.results', { q: esc(q) }) : t('shop.search.heading')}</h1>
          <form class="search-form" action="/search" role="search">
            <label class="sr-only" for="q2">${t('shop.search.label')}</label>
            <input id="q2" name="q" type="search" value="${esc(q)}" placeholder="${esc(t('shop.search.placeholder'))}">
            <button class="btn btn--ink">${t('shop.search.btn')}</button>
          </form>`;
  return `<p class="kicker">${t('shop.kicker.catalogue')}</p>
          <h1 class="page-h1">${t('shop.all.heading')}</h1>
          <p class="shop__sub">${t('shop.all.sub', { n: c.products.length, c: c.collections.length })}</p>`;
}

export function crumbsHTML(mode, col) {
  if (mode === 'all') return `<li><span aria-current="page">${t('shop.crumb.all')}</span></li>`;
  const crumb = mode === 'collection' ? colTitle(col) : t('shop.crumb.search');
  return `<li><a href="/shop">${t('shop.crumb.shop')}</a></li><li><span aria-current="page">${esc(crumb)}</span></li>`;
}

export function tabsHTML(c, col, mode) {
  return `<a href="/shop" ${mode === 'all' ? 'aria-current="page"' : ''}>${t('shop.tab.all')} <small>${c.products.length}</small></a>` +
    c.collections.map(x => `<a href="/collections/${x.handle}" ${x === col ? 'aria-current="page"' : ''}>
       ${esc(colTitle(x))} <small>${x.items.length}</small></a>`).join('');
}

/* relevance is the useful order for a search */
export function sortHTML(state, mode) {
  return Object.entries(SORTS).map(([k, s]) =>
    `<option value="${k}" ${k === state.sort ? 'selected' : ''}>${k === 'featured' && mode === 'search' ? t('sort.match') : s.label}</option>`).join('');
}

export function filtersHTML(base, state) {
  const B = bands();
  const brands = [...new Set(base.map(brandOf))].sort((a, b) => a === 'APOLO' ? -1 : b === 'APOLO' ? 1 : a.localeCompare(b));
  /* counts are for the other filter held constant, so a box never offers a dead end */
  const byBand  = base.filter(p => !state.brands.size || state.brands.has(brandOf(p)));
  const byBrand = base.filter(p => !state.band || B.find(b => b.id === state.band).test(p));
  return `
      ${brands.length > 1 ? `<fieldset><legend>${t('shop.filter.brand')}</legend>${brands.map(b => {
        const n = byBrand.filter(p => brandOf(p) === b).length;
        return `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${state.brands.has(b) ? 'checked' : ''} ${n ? '' : 'disabled'}>
                <span>${esc(b)}</span><small>${n}</small></label>`;
      }).join('')}</fieldset>` : ''}
      <fieldset><legend>${t('shop.filter.price')}</legend>
        <label class="check"><input type="radio" name="price" value="" ${state.band ? '' : 'checked'}><span>${t('shop.filter.any_price')}</span></label>
        ${B.map(b => {
          const n = byBand.filter(b.test).length;
          return `<label class="check"><input type="radio" name="price" value="${b.id}" ${state.band === b.id ? 'checked' : ''} ${n ? '' : 'disabled'}>
                  <span>${b.label}</span><small>${n}</small></label>`;
        }).join('')}
      </fieldset>
      ${state.brands.size || state.band ? '<button type="button" class="filters__clear" id="clear">' + t('shop.filter.clear') + '</button>' : ''}`;
}

/** The products a view shows, filtered and sorted. */
export function listFor(base, state) {
  const B = bands();
  let list = base.filter(p =>
    (!state.brands.size || state.brands.has(brandOf(p))) &&
    (!state.band || B.find(b => b.id === state.band).test(p)));
  const sort = SORTS[state.sort].fn;
  if (sort) list = list.slice().sort(sort);
  return list;
}

export function gridHTML(list, state, mode, base) {
  if (!list.length) return `<div class="none" style="grid-column:1/-1">
        <div class="blank__page" aria-hidden="true"></div>
        <p><b>${mode === 'search' && !base.length
          ? (state.q ? t('shop.none.search', { q: esc(state.q) }) : t('shop.none.type'))
          : t('shop.none.filters')}</b></p>
        <p>${mode === 'search' ? t('shop.none.hint_search') : t('shop.none.hint_filters')}</p>
        <a class="btn btn--ghost" href="/shop">${t('shop.none.browse')}</a></div>`;
  return list.slice(0, state.shown).map((p, i) => card(p, { eager: i < 8 })).join('');
}

export const countText = n => n === 1 ? t('shop.count.one', { n }) : t('shop.count.many', { n });
export const moreText = n => t('shop.more', { n });

/** The state a page starts in with nothing in its URL. */
export const freshState = (q = '') => ({ sort: 'featured', brands: new Set(), band: '', q, shown: PAGE });
