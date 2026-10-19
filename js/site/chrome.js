/* ==========================================================================
   APOLO — site chrome
   The header, footer, search, cart drawer and mobile menu every page shares.
   Pages carry two empty landmarks (<header id="hdr">, <footer id="ftr">) and
   call mountChrome(); the markup lives here once instead of six times.
   ========================================================================== */

import { catalog, money, photo, esc, search, shortTitle, priceLabel, variantImage, colTitle, optVal } from '../store/catalog.js';
import { cart } from '../store/cart.js';
import { t, isMy } from '../i18n.js';
import { langSwitch, wireLang } from './lang.js';

export const LOGO = '/img/apolo-logo.png';
export const CONTACT = {
  phone: '+959777271999', phoneLabel: '09 777 271 999',
  phone2: '+959777271888', phone2Label: '09 777 271 888',
  email: 'marketing@decolandgroup.com',
  address: 'No. 3-C, Ward (9), U Tun Nyo Street, Hlaing Thar Yar Industrial Zone (6), Hlaing Thar Yar Township, Yangon',
  map: 'https://www.google.com/maps/search/?api=1&query=' +
       encodeURIComponent('U Tun Nyo Street, Hlaing Thar Yar Industrial Zone 6, Yangon'),
  facebook: 'https://www.facebook.com/apolostio',
  instagram: 'https://www.instagram.com/apolo_stationery/'
};

const $ = (s, r = document) => r.querySelector(s);

export const ICON = {
  search: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
  bag:    '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  close:  '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu:   '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h11"/></svg>',
  chev:   '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>',
  arrow:  '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-6 6 6-6 6"/></svg>',
  phone:  '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.3 6.3l1.4-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg>',
  truck:  '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9.5h4l3 3.5v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
  cash:   '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/></svg>',
  shield: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>',
  pin:    '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  mail:   '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>',
  fb:     '<svg class="i fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21z"/></svg>',
  ig:     '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" class="fill"/></svg>',
  minus:  '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
  plus:   '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>'
};

/* ========================================================================== */

export function mountChrome({ home = false } = {}) {
  const hdr = $('#hdr'), ftr = $('#ftr');
  hdr.className = 'hdr' + (home ? ' hdr--film' : '');
  hdr.innerHTML = headerHTML();
  ftr.className = 'ftr';
  ftr.innerHTML = footerHTML();
  document.body.insertAdjacentHTML('beforeend', dialogsHTML());

  wireLang();
  wireDialogs();
  wireMega();
  wireSearch();
  wireCart();
  if (home) wireFilmHeader(hdr);

  catalog().then(c => {
    fillCategories(c);
    /* -u-nu-latn: keep Arabic digits in Burmese, like the rest of the site */
    $('#ftrSynced').textContent = new Date(c.synced + 'T00:00:00')
      .toLocaleDateString(isMy ? 'my-MM-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }).catch(err => console.error('[apolo] catalogue failed to load', err));
}

/* ---------- markup ---------- */

function headerHTML() {
  return `
  <div class="hdr__in">
    <a class="hdr__logo" href="/" aria-label="${t('chrome.logo.aria')}">
      <img src="${LOGO}" alt="APOLO" width="200" height="105">
    </a>
    <nav class="hdr__nav" aria-label="${t('chrome.nav.aria')}">
      <a href="/shop">${t('chrome.nav.shop')}</a>
      <div class="hdr__cats">
        <button type="button" class="hdr__catbtn" aria-expanded="false" aria-controls="mega">
          ${t('chrome.nav.categories')} ${ICON.chev}
        </button>
        <div class="mega" id="mega" hidden>
          <div class="mega__in">
            <ul class="mega__list" data-cats></ul>
            <a class="mega__all" href="/shop">${t('chrome.nav.all')} ${ICON.arrow}</a>
          </div>
        </div>
      </div>
      <a href="/pages/terms-conditions">${esc(t('chrome.nav.delivery'))}</a>
      <a href="/pages/contact">${t('chrome.nav.contact')}</a>
    </nav>
    <div class="hdr__tools">
      <a class="hdr__call" href="tel:${CONTACT.phone}">${ICON.phone}<span><small>${t('chrome.hdr.support')}</small>${CONTACT.phoneLabel}</span></a>
      ${langSwitch()}
      <button type="button" class="searchbar" data-open="search" aria-label="${t('chrome.hdr.search')}">${ICON.search}<span>${t('chrome.hdr.search_ph')}</span></button>
      <button type="button" class="tool tool--search" data-open="search" aria-label="${t('chrome.hdr.search')}">${ICON.search}</button>
      <button type="button" class="tool tool--cart" data-open="cart" aria-label="${t('chrome.hdr.cart')}">
        ${ICON.bag}<span class="badge" data-count hidden>0</span>
      </button>
      <button type="button" class="tool tool--menu" data-open="menu" aria-label="${t('chrome.hdr.menu')}">${ICON.menu}</button>
    </div>
  </div>`;
}

function footerHTML() {
  return `
  <div class="ftr__promise">
    <ul class="promise">
      <li>${ICON.truck}<div><b>${t('chrome.ftr.p1.title')}</b><span>${t('chrome.ftr.p1.sub')}</span></div></li>
      <li>${ICON.cash}<div><b>${t('chrome.ftr.p2.title')}</b><span>${t('chrome.ftr.p2.sub')}</span></div></li>
      <li>${ICON.shield}<div><b>${t('chrome.ftr.p3.title')}</b><span>${t('chrome.ftr.p3.sub')}</span></div></li>
      <li>${ICON.phone}<div><b>${t('chrome.ftr.p4.title')}</b><span><a href="tel:${CONTACT.phone}">${CONTACT.phoneLabel}</a></span></div></li>
    </ul>
  </div>
  <div class="ftr__main">
    <div class="ftr__brand">
      <img src="${LOGO}" alt="${t('chrome.ftr.logo_alt')}" width="200" height="105" loading="lazy">
      <p>${t('chrome.ftr.blurb')}</p>
      ${isMy ? '' : '<p class="my" lang="my">အပိုလိုစာရေးကိရိယာ</p>'}
      <div class="ftr__social">
        <a href="${CONTACT.facebook}" target="_blank" rel="noopener" aria-label="${t('chrome.ftr.facebook')}">${ICON.fb}</a>
        <a href="${CONTACT.instagram}" target="_blank" rel="noopener" aria-label="${t('chrome.ftr.instagram')}">${ICON.ig}</a>
      </div>
      ${langSwitch()}
    </div>
    <nav class="ftr__col" aria-label="${t('chrome.ftr.shop')}">
      <h2>${t('chrome.ftr.shop')}</h2>
      <ul data-cats-ftr><li><a href="/shop">${t('chrome.ftr.all')}</a></li></ul>
    </nav>
    <nav class="ftr__col" aria-label="${t('chrome.ftr.help')}">
      <h2>${t('chrome.ftr.help')}</h2>
      <ul>
        <li><a href="/pages/terms-conditions#delivery">${t('chrome.ftr.delivery')}</a></li>
        <li><a href="/pages/terms-conditions#payment">${t('chrome.ftr.payment')}</a></li>
        <li><a href="/pages/terms-conditions#returns">${t('chrome.ftr.returns')}</a></li>
        <li><a href="/pages/contact">${t('chrome.ftr.contact')}</a></li>
      </ul>
    </nav>
    <div class="ftr__col">
      <h2>${esc(t('chrome.ftr.showroom'))}</h2>
      <address>${t('chrome.ftr.address', { address: t('chrome.address') })}</address>
      <p><a href="tel:${CONTACT.phone}">${CONTACT.phoneLabel}</a> · <a href="tel:${CONTACT.phone2}">${CONTACT.phone2Label}</a><br>
         <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>
    </div>
  </div>
  <div class="ftr__base">
    <span>${t('chrome.ftr.copy', { year: new Date().getFullYear() })}</span>
    <span>${t('chrome.ftr.synced')}</span>
  </div>`;
}

function dialogsHTML() {
  return `
  <dialog class="sheet-d sheet-d--search" id="searchD" aria-label="${t('chrome.search.products')}">
    <form class="srch" action="/search" role="search">
      <label class="sr-only" for="srchQ">${t('chrome.search.products')}</label>
      ${ICON.search}
      <input id="srchQ" name="q" type="search" autocomplete="off" spellcheck="false"
             placeholder="${t('chrome.search.placeholder')}">
      <button type="button" class="tool" data-close aria-label="${t('chrome.search.close')}">${ICON.close}</button>
    </form>
    <div class="srch__body" id="srchBody" aria-live="polite"></div>
  </dialog>

  <dialog class="sheet-d sheet-d--side" id="cartD" aria-labelledby="cartTitle">
    <div class="drawer">
      <div class="drawer__head">
        <h2 id="cartTitle">${t('chrome.cart.title')} <span data-count-text></span></h2>
        <button type="button" class="tool" data-close aria-label="${t('chrome.cart.close')}">${ICON.close}</button>
      </div>
      <div class="drawer__body" id="cartBody"></div>
      <div class="drawer__foot" id="cartFoot"></div>
    </div>
  </dialog>

  <dialog class="sheet-d sheet-d--side sheet-d--left" id="menuD" aria-label="${t('chrome.menu.title')}">
    <div class="drawer menu">
      <div class="drawer__head">
        <a href="/" class="menu__logo"><img src="${LOGO}" alt="${t('chrome.menu.logo_alt')}" width="200" height="105"></a>
        <button type="button" class="tool" data-close aria-label="${t('chrome.menu.close')}">${ICON.close}</button>
      </div>
      <nav class="drawer__body menu__body" aria-label="${t('chrome.menu.aria')}">
        <a class="menu__big" href="/shop">${t('chrome.menu.shop')}</a>
        <p class="menu__label">${t('chrome.menu.categories')}</p>
        <ul class="menu__cats" data-cats-menu></ul>
        <p class="menu__label">${t('chrome.menu.help')}</p>
        <a class="menu__link" href="/pages/terms-conditions">${esc(t('chrome.menu.delivery'))}</a>
        <a class="menu__link" href="/pages/contact">${esc(t('chrome.menu.contact'))}</a>
      </nav>
      <div class="drawer__foot">
        ${langSwitch('lang--block')}
        <a class="btn btn--ghost btn--block" href="tel:${CONTACT.phone}">${ICON.phone} ${t('chrome.menu.call', { phone: CONTACT.phoneLabel })}</a>
      </div>
    </div>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>`;
}

/* ---------- dialogs ---------- */

const DIALOGS = { search: 'searchD', cart: 'cartD', menu: 'menuD' };

export function openDialog(name) {
  const d = document.getElementById(DIALOGS[name]);
  if (!d || d.open) return;
  for (const id of Object.values(DIALOGS)) { const o = document.getElementById(id); if (o.open) close(o); }
  /* a toast saying "View cart (1)" is stale the moment the cart opens */
  const t = document.getElementById('toast');
  if (t && !t.hidden) { clearTimeout(toastT); t.classList.remove('is-on'); t.hidden = true; }
  d.showModal();
  document.documentElement.classList.add('is-locked');
  d.dispatchEvent(new Event('opened'));
}

function close(d) {
  d.classList.add('is-closing');
  const done = () => { d.classList.remove('is-closing'); d.close(); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
  else setTimeout(done, 220);
}

function wireDialogs() {
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); openDialog(opener.dataset.open); return; }
    const closer = e.target.closest('[data-close]');
    if (closer) { close(closer.closest('dialog')); return; }
  });
  for (const id of Object.values(DIALOGS)) {
    const d = document.getElementById(id);
    /* a click on the backdrop lands on the <dialog> itself */
    d.addEventListener('click', e => { if (e.target === d) close(d); });
    d.addEventListener('cancel', e => { e.preventDefault(); close(d); });
    d.addEventListener('close', () => {
      if (!Object.values(DIALOGS).some(i => document.getElementById(i).open))
        document.documentElement.classList.remove('is-locked');
    });
  }
  /* "/" focuses search, the way most catalogues do */
  addEventListener('keydown', e => {
    if (e.key === '/' && !e.target.closest('input,textarea,select,[contenteditable]')) {
      e.preventDefault(); openDialog('search');
    }
  });
}

/* ---------- categories menu ---------- */

function wireMega() {
  const btn = $('.hdr__catbtn'), mega = $('#mega'), wrap = $('.hdr__cats');
  let t = 0;
  const set = open => {
    clearTimeout(t);
    btn.setAttribute('aria-expanded', String(open));
    if (open) { mega.hidden = false; requestAnimationFrame(() => mega.classList.add('is-open')); }
    else { mega.classList.remove('is-open'); t = setTimeout(() => { mega.hidden = true; }, 200); }
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  if (matchMedia('(hover: hover)').matches) {
    wrap.addEventListener('pointerenter', () => set(true));
    wrap.addEventListener('pointerleave', () => { t = setTimeout(() => set(false), 160); });
  }
  wrap.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mega.hidden) { set(false); btn.focus(); } });
}

function fillCategories(c) {
  const here = location.pathname.replace(/\/$/, '');
  $('[data-cats]').innerHTML = c.collections.map((col, i) => `
    <li><a href="/collections/${col.handle}" ${here === '/collections/' + col.handle ? 'aria-current="page"' : ''}>
      <span class="mega__n">${String(i + 1).padStart(2, '0')}</span>
      <span class="mega__t">${esc(colTitle(col))}</span>
      ${isMy ? '' : `<span class="mega__my my" lang="my">${col.my}</span>`}
      <span class="mega__c">${col.items.length}</span>
    </a></li>`).join('');
  $('[data-cats-menu]').innerHTML = c.collections.map(col => `
    <li><a href="/collections/${col.handle}">
      <span>${esc(colTitle(col))}</span>${isMy ? '' : `<span class="my" lang="my">${col.my}</span>`}<em>${col.items.length}</em>
    </a></li>`).join('');
  $('[data-cats-ftr]').insertAdjacentHTML('beforeend', c.collections.map(col =>
    `<li><a href="/collections/${col.handle}">${esc(colTitle(col))}</a></li>`).join(''));
}

/* ---------- the header over the film ----------
   On the home page the header floats over the film with no bar, so the page
   reads as one sheet of paper; it turns solid once the film has scrolled by. */
function wireFilmHeader(hdr) {
  const film = $('#film');
  if (!film) return;
  let solid = null;
  const check = () => {
    const still = document.documentElement.classList.contains('is-still');
    const s = still || film.getBoundingClientRect().bottom <= innerHeight + 2;
    if (s !== solid) { hdr.classList.toggle('is-solid', s); solid = s; }
  };
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check, { passive: true });
  check();
}

/* ---------- search ---------- */

function wireSearch() {
  const d = $('#searchD'), q = $('#srchQ'), body = $('#srchBody');
  let c = null;
  d.addEventListener('opened', () => {
    q.focus(); q.select();
    catalog().then(x => { c = x; render(); });
  });
  const render = () => {
    if (!c) return;
    const term = q.value.trim();
    if (!term) {
      body.innerHTML = `<p class="srch__label">${t('chrome.search.browse')}</p>
        <ul class="srch__chips">${c.collections.map(col =>
          `<li><a href="/collections/${col.handle}">${esc(colTitle(col))}</a></li>`).join('')}</ul>`;
      return;
    }
    const hits = search(c, term);
    if (!hits.length) {
      body.innerHTML = `<p class="srch__none">${t('chrome.search.none',
        { term: esc(term), tel: CONTACT.phone, phone: CONTACT.phoneLabel })}</p>`;
      return;
    }
    body.innerHTML = `
      <ul class="srch__list">${hits.slice(0, 7).map(p => {
        const im = variantImage(p);
        return `<li><a href="/products/${p.handle}">
          <span class="srch__img">${photo(im, { w: 60 })}</span>
          <span class="srch__t">${esc(shortTitle(p))}<small>${esc(p.collections[0] ? colTitle(p.collections[0]) : p.vendor)}</small></span>
          <span class="srch__p">${priceLabel(p)}</span></a></li>`;
      }).join('')}</ul>
      <a class="srch__all" href="/search?q=${encodeURIComponent(term)}">${hits.length === 1 ? t('chrome.search.all_one', { n: hits.length }) : t('chrome.search.all_many', { n: hits.length })} ${ICON.arrow}</a>`;
  };
  q.addEventListener('input', render);
}

/* ---------- cart drawer ---------- */

function wireCart() {
  const body = $('#cartBody'), foot = $('#cartFoot');
  const badges = () => {
    const n = cart.count;
    document.querySelectorAll('[data-count]').forEach(b => { b.textContent = n; b.hidden = !n; });
    document.querySelectorAll('[data-count-text]').forEach(b => { b.textContent = n ? `(${n})` : ''; });
    document.querySelectorAll('.tool--cart').forEach(b => b.setAttribute('aria-label',
      n === 1 ? t('chrome.cart.aria_one', { n }) : t('chrome.cart.aria_many', { n })));
  };

  const render = async () => {
    badges();
    const c = await catalog().catch(() => null);
    if (!c) { body.innerHTML = `<p class="drawer__empty">${t('chrome.cart.error')}</p>`; return; }
    const lines = cart.resolve(c);
    if (!lines.length) {
      body.innerHTML = `
        <div class="blank">
          <div class="blank__page" aria-hidden="true"></div>
          <p class="blank__t">${t('chrome.cart.empty.title')}</p>
          <p class="blank__s">${t('chrome.cart.empty.sub')}</p>
          <a class="btn btn--ink" href="/shop">${t('chrome.cart.empty.cta')}</a>
        </div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = `<ul class="cart-lines">${lines.map(l => {
      const im = variantImage(l.product, l.variant);
      return `<li class="ci" data-id="${l.id}">
        <a class="ci__img" href="/products/${l.product.handle}${l.product.variants.length > 1 ? '?variant=' + l.id : ''}" tabindex="-1">
          ${photo(im, { w: 80 })}</a>
        <div class="ci__info">
          <a class="ci__t" href="/products/${l.product.handle}${l.product.variants.length > 1 ? '?variant=' + l.id : ''}">${esc(shortTitle(l.product))}</a>
          ${l.variant.title ? `<span class="ci__v">${esc(isMy && l.variant.o?.length ? l.variant.o.map(optVal).join(' / ') : l.variant.title)}</span>` : ''}
          ${l.variant.available ? '' : `<span class="ci__out">${t('chrome.cart.soldout')}</span>`}
          <div class="ci__row">
            ${stepper(l.qty, t('chrome.cart.qty_of', { title: shortTitle(l.product) }))}
            <button type="button" class="ci__rm" data-rm>${t('chrome.cart.remove')}</button>
          </div>
        </div>
        <span class="ci__p">${money(l.total)}${l.qty > 1 ? `<small>${t('chrome.cart.each', { price: money(l.variant.price) })}</small>` : ''}</span>
      </li>`;
    }).join('')}</ul>`;

    const sub = lines.filter(l => l.variant.available).reduce((s, l) => s + l.total, 0);
    const url = cart.checkoutUrl(c);
    foot.innerHTML = `
      <div class="sum"><span>${t('chrome.cart.subtotal')}</span><b>${money(sub)}</b></div>
      <p class="sum__note">${t('chrome.cart.note')}</p>
      ${url ? `<a class="btn btn--brand btn--block" href="${url}">${t('chrome.cart.checkout')} ${ICON.arrow}</a>` : ''}
      <a class="btn btn--ghost btn--block" href="tel:${CONTACT.phone}">${ICON.phone} ${t('chrome.cart.phone')}</a>
      <p class="sum__fine">${t('chrome.cart.fine')}</p>`;
  };

  body.addEventListener('click', e => {
    const li = e.target.closest('.ci'); if (!li) return;
    const id = +li.dataset.id;
    const cur = cart.lines.find(l => l.id === id)?.qty || 0;
    if (e.target.closest('[data-rm]')) cart.remove(id);
    else if (e.target.closest('[data-dec]')) cart.set(id, cur - 1);
    else if (e.target.closest('[data-inc]')) cart.set(id, cur + 1);
  });
  body.addEventListener('change', e => {
    const li = e.target.closest('.ci'); if (!li || !e.target.matches('input')) return;
    cart.set(+li.dataset.id, +e.target.value || 0);
  });

  addEventListener('cart:change', render);
  render();
}

/** − [n] + — shared by the cart and the product page */
export function stepper(qty, label) {
  return `<div class="step" role="group" aria-label="${esc(label)}">
    <button type="button" data-dec aria-label="${t('chrome.step.dec')}">${ICON.minus}</button>
    <input type="number" inputmode="numeric" min="0" max="99" value="${qty}" aria-label="${t('chrome.step.qty')}">
    <button type="button" data-inc aria-label="${t('chrome.step.inc')}">${ICON.plus}</button>
  </div>`;
}

/* ---------- toast ---------- */

let toastT = 0;
export function toast(html) {
  const t = $('#toast');
  t.innerHTML = html;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('is-on'));
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => { t.hidden = true; }, 300); }, 3600);
}
