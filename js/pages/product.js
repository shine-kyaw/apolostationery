/* ==========================================================================
   APOLO — product page: /products/:handle[?variant=<id>]
   ========================================================================== */

import { mountChrome, ICON, CONTACT, stepper, openDialog } from '../site/chrome.js';
import { card, wireQuickAdd } from '../site/card.js';
import { wireRails } from '../site/rail.js';
import { catalog, img, srcset, esc, money, shortTitle, related, variantImage } from '../store/catalog.js';
import { cart } from '../store/cart.js';

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

  document.title = `${p.title} — APOLO Stationery Myanmar`;
  const plain = p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  document.querySelector('meta[name=description]').setAttribute('content',
    (plain ? plain.slice(0, 140) + (plain.length > 140 ? '…' : '') + ' ' : '') + 'Door-to-door delivery and cash on delivery across Myanmar.');

  if (col) $('#crumbs').insertAdjacentHTML('beforeend', `<li><a href="/collections/${col.handle}">${esc(col.title)}</a></li>`);
  $('#crumbs').insertAdjacentHTML('beforeend', `<li><span aria-current="page">${esc(shortTitle(p))}</span></li>`);

  const box = $('#product');
  box.removeAttribute('aria-busy');
  box.innerHTML = `
  <div class="pdp">
    <div class="gallery">
      <div class="stage-img is-in" id="stageImg" role="img" aria-label="${esc(p.title)}">
        <img id="mainImg" alt="" width="900" height="900" fetchpriority="high">
      </div>
      ${p.images.length > 1 ? `<div class="thumbs" id="thumbs" aria-label="Product images">${p.images.map((im, i) => `
        <button type="button" data-i="${i}" aria-label="Show image ${i + 1} of ${p.images.length}">
          <img src="${img(im.src, 160)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    </div>

    <div class="buy" id="buy" tabindex="-1">
      <div class="buy__meta">
        ${col ? `<a href="/collections/${col.handle}">${esc(col.title)}</a><span class="my" lang="my">${col.my}</span>` : ''}
        ${!/^apolo/i.test(p.vendor) ? `<span>${esc(p.vendor)}</span>` : ''}
      </div>
      <h1>${esc(p.title)}</h1>
      <div class="buy__price" id="price" aria-live="polite"></div>

      ${p.options.map((o, oi) => `
        <fieldset class="opt" data-oi="${oi}">
          <legend>${esc(o.name)} <span data-sel></span></legend>
          <div class="pills">${o.values.map(val => {
            const sw = /colou?r/i.test(o.name) ? swatch(val) : null;
            return `<label class="pill"><input type="radio" name="o${oi}" value="${esc(val)}">
                    <span>${sw ? `<i style="--sw:${sw}"></i>` : ''}${esc(val)}</span></label>`;
          }).join('')}</div>
        </fieldset>`).join('')}

      <p class="buy__stock" id="stock"></p>

      <div class="buy__dock">
        <div class="buy__row">
          <div class="step step--lg" id="qty" role="group" aria-label="Quantity">${stepper(1, 'Quantity').replace(/^<div[^>]*>|<\/div>$/g, '')}</div>
          <button type="button" class="btn btn--brand" id="add">${ICON.bag} Add to cart</button>
          <a class="btn btn--ghost buy__now" data-now href="#">Buy now</a>
        </div>
      </div>
      <a class="btn btn--ghost btn--block buy__now-m" data-now href="#">Buy now &mdash; straight to checkout</a>

      <ul class="assure">
        <li>${ICON.truck}<div><b>Door-to-door delivery.</b> <span>Yangon in 3–5 days, Mandalay and Naypyitaw 3–6, other cities 5–12.</span></div></li>
        <li>${ICON.cash}<div><b>Cash on delivery</b> <span>or prepaid bank transfer.</span></div></li>
        <li>${ICON.phone}<div><b>Prefer to talk?</b> <span>Order by phone on</span> <a href="tel:${CONTACT.phone}">${CONTACT.phoneLabel}</a></div></li>
      </ul>

      <div class="details">
        ${p.body ? `<details open><summary>Description ${ICON.chev}</summary><div class="rich">${p.body}</div></details>` : ''}
        <details ${p.body ? '' : 'open'}><summary>Details ${ICON.chev}</summary>
          <dl class="spec">
            <dt>Brand</dt><dd>${esc(/^apolo/i.test(p.vendor) ? 'APOLO' : p.vendor)}</dd>
            ${col ? `<dt>Category</dt><dd><a href="/collections/${col.handle}">${esc(col.title)}</a></dd>` : ''}
            ${p.type ? `<dt>Type</dt><dd>${esc(p.type)}</dd>` : ''}
            ${p.options.map(o => `<dt>${esc(o.name)}</dt><dd>${o.values.map(esc).join(', ')}</dd>`).join('')}
          </dl>
        </details>
        <details><summary>Delivery &amp; returns ${ICON.chev}</summary>
          <div class="rich"><p>Damaged, defective, incorrect or incomplete at delivery? Request a return within 14 days. Returned
            items must be unused and in their original packaging. <a href="/pages/terms-conditions">Full delivery and returns terms</a>.</p></div>
        </details>
      </div>
    </div>
  </div>`;

  /* ---- gallery ---- */
  const stage = $('#stageImg'), main = $('#mainImg');
  let shown = -1;
  const show = (i, instant = false) => {
    const im = p.images[i] || p.images[0];
    if (!im || i === shown) return;
    shown = i;
    const set = () => {
      main.src = img(im.src, 900);
      main.srcset = srcset(im.src, [600, 900, 1200, 1500]);
      main.sizes = '(max-width:900px) 92vw, 600px';
      stage.classList.remove('is-swap');
    };
    if (instant || !main.src) set();
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
      $('[data-sel]', fs).textContent = v.o[oi] || '';
    });
    $('#price').innerHTML = `${money(v.price)}${v.compare > v.price ? ` <s>${money(v.compare)}</s>` : ''}`;
    const stock = $('#stock');
    stock.textContent = v ? (v.available ? 'In stock — ready to deliver' : 'Sold out') : 'Unavailable';
    stock.classList.toggle('is-out', !v.available);
    $('#add').disabled = !v.available;
    $('#add').innerHTML = v.available ? `${ICON.bag} Add to cart` : 'Sold out';
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
        <div><p class="eyebrow"><span>+</span> ${col ? `More in ${esc(col.title)}` : 'You may also need'}</p>
             <h2>On the same desk</h2></div>
        <div class="sec-head__end">
          ${col ? `<a class="link-arrow" href="/collections/${col.handle}">See all ${col.items.length} ${ICON.arrow}</a>` : ''}
          <div class="rail-ctl" data-for="relRail">
            <button type="button" class="tool tool--line" data-dir="-1" aria-label="Scroll back"></button>
            <button type="button" class="tool tool--line" data-dir="1" aria-label="Scroll forward"></button>
          </div>
        </div>
      </div></div>
      <div class="rail" id="relRail" tabindex="0" aria-label="Related products, scroll sideways">${rel.map(x => card(x)).join('')}</div>`;
    wireRails(sec);
  }
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  $('#product').innerHTML = '<p class="err">This product didn’t load. Please refresh, or call <a href="tel:+959777271999">09 777 271 999</a> to order.</p>';
});

function missing(c) {
  document.title = 'Product not found — APOLO Stationery Myanmar';
  $('#product').innerHTML = `
    <div class="lost">
      <div class="blank__page" aria-hidden="true"></div>
      <h1>This product isn’t in the catalogue</h1>
      <p>It may have sold out for good or been renamed. Search for it, or browse its category.</p>
      <div class="visit__cta">
        <button type="button" class="btn btn--ink" data-open="search">${ICON.search} Search</button>
        <a class="btn btn--ghost" href="/shop">Browse the shop</a>
      </div>
    </div>`;
}
