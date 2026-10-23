/* ==========================================================================
   APOLO — shop: /shop, /collections/:handle and /search?q=
   One page, three entry points. Filter and sort state lives in the query
   string, so a filtered view can be shared, bookmarked and survives Back.
   The markup is js/views/shop.js; a page built ahead of time arrives with its
   first screen of products already in place and is only wired up here.
   ========================================================================== */

import { mountChrome } from '../site/chrome.js';
import { wireQuickAdd } from '../site/card.js';
import { catalog, search, SORTS, esc, colTitle, colBlurb } from '../store/catalog.js';
import { t } from '../i18n.js';
import { PAGE, headHTML, crumbsHTML, tabsHTML, sortHTML, filtersHTML, listFor, gridHTML, countText, moreText } from '../views/shop.js';

mountChrome();
wireQuickAdd();

const $ = s => document.querySelector(s);

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
  if (mode === 'collection' && !col) return notFound(c);

  const base = mode === 'collection' ? col.items : mode === 'search' ? (state.q ? search(c, state.q) : []) : c.featured;
  /* built pages already show the plain view: heading, tabs and first products */
  const built = $('#grid').dataset.built === (mode === 'collection' ? handle : mode);

  if (!built) {
    if (mode === 'collection') {
      document.title = t('shop.title.collection', { title: colTitle(col) });
      setMeta(t('shop.meta.collection', { blurb: colBlurb(col), n: col.items.length }));
    } else if (mode === 'search') {
      document.title = state.q ? t('shop.title.search_q', { q: state.q }) : t('shop.title.search');
    }
    $('#shopHead').innerHTML = headHTML(mode, { c, col, q: state.q }) +
      (base.loose ? `<p class="shop__loose">${t('chrome.search.loose', { term: esc(state.q) })}</p>` : '');
    $('#crumbs').insertAdjacentHTML('beforeend', crumbsHTML(mode, col));
    $('#tabs').innerHTML = tabsHTML(c, col, mode);
  }
  /* bring the current category's tab into view, without moving the page */
  const tab = $('#tabs [aria-current]'), strip = $('#tabs');
  if (tab) strip.scrollLeft = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;

  $('#sort').innerHTML = sortHTML(state, mode);
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; state.shown = PAGE; update(); });

  const filters = $('#filters');
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

  function update(syncUrl = true, draw = true) {
    const list = listFor(base, state);
    if (draw) $('#grid').innerHTML = gridHTML(list, state, mode, base);
    $('#more').hidden = list.length <= state.shown;
    $('#moreBtn').textContent = moreText(list.length - state.shown);
    $('#count').textContent = countText(list.length);
    filters.innerHTML = filtersHTML(base, state);

    if (syncUrl) {
      const q = new URLSearchParams();
      if (state.q) q.set('q', state.q);
      if (state.sort !== 'featured') q.set('sort', state.sort);
      if (state.brands.size) q.set('brand', [...state.brands].join(','));
      if (state.band) q.set('price', state.band);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
  }
  /* a built grid is already right unless the URL asks for a filter or sort */
  const plain = state.sort === 'featured' && !state.brands.size && !state.band;
  update(true, !(built && plain));
  $('#grid').removeAttribute('aria-busy');
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  if (!$('#grid').dataset.built) $('#grid').innerHTML = `<p class="err">${t('shop.error.load')}</p>`;
});

function setMeta(text) { document.querySelector('meta[name=description]').setAttribute('content', text); }

function notFound(c) {
  document.title = t('shop.title.notfound');
  $('#shopHead').innerHTML = `<p class="kicker">${t('shop.notfound.kicker')}</p><h1 class="page-h1">${t('shop.notfound.heading')}</h1>
        <p class="shop__sub">${t('shop.notfound.sub')}</p>`;
  $('#crumbs').insertAdjacentHTML('beforeend', `<li><a href="/shop">${t('shop.crumb.shop')}</a></li>`);
  $('#tabs').innerHTML = tabsHTML(c, null, 'none');
  document.querySelector('.bar').hidden = true;
  $('#filters').hidden = true;
  $('#grid').removeAttribute('aria-busy');
}
