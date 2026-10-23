/* ==========================================================================
   APOLO — product page: /products/:slug[?variant=<id>]
   The markup is js/views/product.js. On the live site the page arrives
   already built (tools/build.mjs) and this only wires it up; without a build
   it draws the page itself from the catalogue.
   ========================================================================== */

import { mountChrome, ICON, openDialog } from '../site/chrome.js';
import { wireQuickAdd } from '../site/card.js';
import { wireRails } from '../site/rail.js';
import { catalog, optVal } from '../store/catalog.js';
import { cart } from '../store/cart.js';
import { t } from '../i18n.js';
import { productHTML, relatedHTML, crumbsHTML, missingHTML, stagePhoto, priceHTML, stockText, firstVariant, metaDescription } from '../views/product.js';

mountChrome();
wireQuickAdd();

const $ = (s, r = document) => r.querySelector(s);
const SHOP = 'https://apolostationey.com';
const key = decodeURIComponent(location.pathname.split('/')[2] || '');

catalog().then(c => {
  /* the clean address, or the store's own handle for links made before it */
  const p = c.bySlug.get(key) || c.byHandle.get(key);
  if (!p) return missing();
  if (key !== p.slug) history.replaceState(null, '', p.url + location.search);

  const want = +new URLSearchParams(location.search).get('variant');
  let v = firstVariant(p, want);
  let qty = 1;

  const box = $('#product');
  const built = box.dataset.built === p.handle;
  if (!built) {
    document.title = t('product.title', { name: p.name });
    document.querySelector('meta[name=description]').setAttribute('content', metaDescription(p));
    $('#crumbs').insertAdjacentHTML('beforeend', crumbsHTML(p));
    box.innerHTML = productHTML(p, v);
  }
  box.removeAttribute('aria-busy');

  /* ---- gallery ---- */
  const stage = $('#stageImg'), stageIn = $('#stageIn');
  let shown = +stageIn.dataset.shown;
  const show = i => {
    if (!p.images[i] || i === shown) return;
    shown = i;
    stage.classList.add('is-swap');
    setTimeout(() => { stageIn.innerHTML = stagePhoto(p, i); stage.classList.remove('is-swap'); }, 160);
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
    $('#price').innerHTML = priceHTML(v);
    const stock = $('#stock');
    stock.textContent = stockText(v);
    stock.classList.toggle('is-out', !v.available);
    $('#add').disabled = !v.available;
    $('#add').innerHTML = v.available ? `${ICON.bag} ${t('product.add')}` : t('product.sold_out');
    setNow();
    show(v.image >= 0 ? v.image : 0);
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
  const sec = $('#related');
  if (!built) {
    const html = relatedHTML(c, p);
    if (html) { sec.innerHTML = html; sec.hidden = false; }
  }
  if (!sec.hidden) wireRails(sec);
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  /* a built page is still readable and its "Buy now" link still works */
  if (!$('#product').dataset.built) $('#product').innerHTML = `<p class="err">${t('product.err')}</p>`;
});

function missing() {
  document.title = t('product.title.missing');
  $('#product').innerHTML = missingHTML();
}
