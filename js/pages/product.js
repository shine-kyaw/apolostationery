/* ==========================================================================
   APOLO — product page: /products/:handle[?variant=<id>]
   ========================================================================== */

import { mountChrome, ICON, CONTACT, stepper, openDialog } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { wireRails } from '../site/rail.js';
import { catalog, photo, esc, money, shortTitle, related, colTitle, optName, optVal } from '../store/catalog.js';
import { cart } from '../store/cart.js';
import { t, isMy } from '../i18n.js';

mountChrome();
wireQuickAdd();

const $ = (s, r = document) => r.querySelector(s);
const SHOP = 'https://apolostationey.com';
const handle = decodeURIComponent(location.pathname.split('/')[2] || '');

/* Option values the store uses for colour, so a pill can carry a dot of it. */
const SWATCH = {
  blue: '#2F5BC8', black: '#1C1B20', red: '#D7263D', pink: '#F06BA8', yellow: '#F7D046',
  green: '#3BAA5C', orange: '#F28C28', purple: '#8E5BC9', violet: '#8E5BC9', white: '#FFFFFF',
  grey: '#9A9A9A', gray: '#9A9A9A', brown: '#8A5A3B', gold: '#C9A44C', silver: '#C5C8CC',
  ivory: '#F4EEDC', turquoise: '#33C1C1', saffron: '#F4A300', cream: '#F3E9CF', 'rose gold': '#D9A08E',
  lemon: '#F5EB6B', taro: '#B9A3D8', parrot: '#4CC552',
  'cyber green': '#7BE04A', 'cyber pink': '#FF5FB0', 'cyber yellow': '#FFE83A', 'cyber orange': '#FF9A2E'
};
const swatch = v => SWATCH[v.toLowerCase().trim()] || SWATCH[v.toLowerCase().split(/\s+/).pop()];

catalog().then(c => {
  const p = c.byHandle.get(handle);
  if (!p) return missing(c);

  const want = +new URLSearchParams(location.search).get('variant');
  let v = p.variants.find(x => x.id === want) || p.variants.find(x => x.available) || p.variants[0];
  let qty = 1;
  const col = p.collections[0];

  document.title = t('product.title', { name: p.title });
  const plain = p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  document.querySelector('meta[name=description]').setAttribute('content',
    (plain ? plain.slice(0, 140) + (plain.length > 140 ? '…' : '') + ' ' : '') + t('product.meta.tail'));

  if (col) $('#crumbs').insertAdjacentHTML('beforeend', `<li><a href="/collections/${col.handle}">${esc(colTitle(col))}</a></li>`);
  $('#crumbs').insertAdjacentHTML('beforeend', `<li><span aria-current="page">${esc(shortTitle(p))}</span></li>`);

  const box = $('#product');
  box.removeAttribute('aria-busy');
  box.innerHTML = `
  <div class="pdp">
    <div class="gallery">
      <div class="stage-img is-in" id="stageImg" role="img" aria-label="${esc(p.title)}">
        <div class="stage-img__in" id="stageIn"></div>
      </div>
      ${p.images.length > 1 ? `<div class="thumbs" id="thumbs" aria-label="${esc(t('product.gallery.label'))}">${p.images.map((im, i) => `
        <button type="button" data-i="${i}" aria-label="${esc(t('product.gallery.show', { i: i + 1, n: p.images.length }))}">
          ${photo(im, { w: 70 })}</button>`).join('')}</div>` : ''}
    </div>

    <div class="buy" id="buy" tabindex="-1">
      <div class="buy__meta">
        ${col ? `<a href="/collections/${col.handle}">${esc(colTitle(col))}</a>${isMy ? '' : `<span class="my" lang="my">${col.my}</span>`}` : ''}
        ${!/^apolo/i.test(p.vendor) ? `<span>${esc(p.vendor)}</span>` : ''}
      </div>
      <h1>${esc(p.title)}</h1>
      <div class="buy__price" id="price" aria-live="polite"></div>

      ${p.options.map((o, oi) => `
        <fieldset class="opt" data-oi="${oi}">
          <legend>${esc(optName(o.name))} <span data-sel></span></legend>
          <div class="pills">${o.values.map(val => {
            const sw = /colou?r/i.test(o.name) ? swatch(val) : null;
            return `<label class="pill"><input type="radio" name="o${oi}" value="${esc(val)}">
                    <span>${sw ? `<i style="--sw:${sw}"></i>` : ''}${esc(optVal(val))}</span></label>`;
          }).join('')}</div>
        </fieldset>`).join('')}

      <p class="buy__stock" id="stock"></p>

      <div class="buy__dock">
        <div class="buy__row">
          <div class="step step--lg" id="qty" role="group" aria-label="${esc(t('product.qty'))}">${stepper(1, t('product.qty')).replace(/^<div[^>]*>|<\/div>$/g, '')}</div>
          <button type="button" class="btn btn--brand" id="add">${ICON.bag} ${t('product.add')}</button>
          <a class="btn btn--ghost buy__now" data-now href="#">${t('product.buy_now')}</a>
        </div>
      </div>
      <a class="btn btn--ghost btn--block buy__now-m" data-now href="#">${t('product.buy_now_m')}</a>

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
            ${p.type ? `<dt>${t('product.spec.type')}</dt><dd>${esc(p.type)}</dd>` : ''}
            ${p.options.map(o => `<dt>${esc(optName(o.name))}</dt><dd>${o.values.map(val => esc(optVal(val))).join(', ')}</dd>`).join('')}
          </dl>
        </details>
        <details><summary>${esc(t('product.returns'))} ${ICON.chev}</summary>
          <div class="rich"><p>${t('product.returns.text')}</p></div>
        </details>
      </div>
    </div>
  </div>`;

  /* ---- gallery ---- */
  const stage = $('#stageImg'), stageIn = $('#stageIn');
  let shown = -1;
  const show = (i, instant = false) => {
    const im = p.images[i] || p.images[0];
    if (!im || i === shown) return;
    shown = i;
    /* framed like the cards, but looser — the product page keeps some of
       the photo around the product */
    const set = () => {
      stageIn.innerHTML = photo(im, { w: 620, sizes: '(max-width:900px) 92vw, 620px', air: 1.22, lazy: false, high: true });
      stage.classList.remove('is-swap');
    };
    if (instant || !stageIn.firstChild) set();
    else { stage.classList.add('is-swap'); setTimeout(set, 160); }
    document.querySelectorAll('#thumbs button').forEach(b => b.setAttribute('aria-current', String(+b.dataset.i === i)));
  };
  $('#thumbs')?.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });

  /* Magnifier: the photo follows the pointer at 2×, the way you'd lean in
     to read the label on a box. Fine pointers only. */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      stage.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    stage.addEventListener('click', () => stage.classList.toggle('is-zoom'));
    stage.addEventListener('pointerleave', () => stage.classList.remove('is-zoom'));
  }

  /* "Buy now" skips our cart and opens APOLO's checkout with just this line */
  function setNow() {
    document.querySelectorAll('[data-now]').forEach(a => {
      a.href = `${SHOP}/cart/${v.id}:${qty}`;
      if (v.available) a.removeAttribute('aria-disabled'); else a.setAttribute('aria-disabled', 'true');
    });
  }

  /* ---- variants ---- */
  const pick = () => {
    const chosen = p.options.map((_, oi) => $(`input[name=o${oi}]:checked`)?.value);
    return p.variants.find(x => x.o.every((val, i) => val === chosen[i]));
  };
  const sync = () => {
    p.options.forEach((o, oi) => {
      const fs = $(`fieldset[data-oi="${oi}"]`);
      fs.querySelectorAll('input').forEach(inp => {
        inp.checked = inp.value === v.o[oi];
        /* is this value buyable with the other options as they are? */
        const ok = p.variants.some(x => x.available && x.o[oi] === inp.value &&
          x.o.every((val, j) => j === oi || val === v.o[j]));
        inp.closest('.pill').classList.toggle('is-na', !ok);
      });
      $('[data-sel]', fs).textContent = optVal(v.o[oi] || '');
    });
    $('#price').innerHTML = `${money(v.price)}${v.compare > v.price ? ` <s>${money(v.compare)}</s>` : ''}`;
    const stock = $('#stock');
    stock.textContent = v ? (v.available ? t('product.stock.in') : t('product.sold_out')) : t('product.stock.unavailable');
    stock.classList.toggle('is-out', !v.available);
    $('#add').disabled = !v.available;
    $('#add').innerHTML = v.available ? `${ICON.bag} ${t('product.add')}` : t('product.sold_out');
    setNow();
    const vi = v.image >= 0 ? v.image : 0;
    show(vi, shown === -1);
    if (p.variants.length > 1) history.replaceState(null, '', `${location.pathname}?variant=${v.id}`);
  };
  $('#buy').addEventListener('change', e => {
    if (!e.target.matches('.opt input')) return;
    v = pick() || p.variants.find(x => x.o.includes(e.target.value)) || v;
    sync();
  });

  /* ---- quantity ---- */
  const qIn = $('#qty input');
  const setQty = n => { qty = Math.max(1, Math.min(99, n | 0 || 1)); qIn.value = qty; setNow(); };
  $('#qty').addEventListener('click', e => {
    if (e.target.closest('[data-dec]')) setQty(qty - 1);
    if (e.target.closest('[data-inc]')) setQty(qty + 1);
  });
  qIn.addEventListener('change', () => setQty(+qIn.value));
  qIn.min = 1;

  $('#add').addEventListener('click', () => {
    if (!v.available) return;
    cart.add(v.id, qty);
    document.querySelectorAll('.badge').forEach(b => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    openDialog('cart');
  });

  sync();

  /* ---- related ---- */
  const rel = related(c, p, 10);
  if (rel.length) {
    const sec = $('#related');
    sec.hidden = false;
    sec.innerHTML = `
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
    wireRails(sec);
  }
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  $('#product').innerHTML = `<p class="err">${t('product.err')}</p>`;
});

function missing(c) {
  document.title = t('product.title.missing');
  $('#product').innerHTML = `
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
