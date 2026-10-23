/* ==========================================================================
   APOLO — home page, below the film
   The magenta flood, the categories as a fan of exercise books, the offers,
   the school list, one shelf, the posters. The markup is js/views/home.js; a
   page built ahead of time arrives with all of it in place. The film (hero.js)
   and this file never talk to each other: either can fail without taking the
   other down.
   ========================================================================== */

import { mountChrome, openDialog, toast } from '../site/chrome.js';
import { wireQuickAdd } from '../site/card.js';
import { catalog, esc, shortTitle } from '../store/catalog.js';
import { t } from '../i18n.js';
import { cart } from '../store/cart.js';
import { wireRails } from '../site/rail.js';
import { campHTML, booksHTML, indexHTML, listItems, listRowsHTML, listFootHTML, shelfHTML } from '../views/home.js';

mountChrome({ home: true });
wireQuickAdd();

const $ = id => document.getElementById(id);
const built = !!document.documentElement.dataset.lang;

/* ---- posters (no catalogue needed) ---- */
if (!$('campRail').children.length) $('campRail').innerHTML = campHTML();

catalog().then(c => {
  if (!built) {
    document.querySelectorAll('[data-count-products]').forEach(el => { el.textContent = c.products.length; });
    $('books').innerHTML = booksHTML(c);
    $('index').innerHTML = indexHTML(c);
    for (const el of document.querySelectorAll('[data-shelf]')) {
      const col = c.byCollection.get(el.dataset.shelf);
      if (!col) { el.remove(); continue; }
      el.setAttribute('aria-labelledby', `rail-${col.handle}-t`);
      el.innerHTML = shelfHTML(col, { kicker: el.dataset.kicker, titleKey: el.dataset.titleKey });
    }
  }

  /* ---- the school list: ticks follow the cart, so it is always redrawn ---- */
  const items = listItems(c);
  const rows = $('listRows'), foot = $('listFoot');
  const inCart = id => cart.lines.find(l => l.id === id)?.qty || 0;
  const renderList = () => {
    rows.innerHTML = listRowsHTML(items, inCart);
    foot.innerHTML = listFootHTML(items, inCart);
  };
  rows.addEventListener('click', e => {
    const b = e.target.closest('[data-tick]'); if (!b) return;
    const id = +b.dataset.tick;
    if (inCart(id)) cart.remove(id);
    else {
      cart.add(id, 1);
      const p = c.byVariant.get(id).product;
      toast(`${t('home.toast.added', { title: esc(shortTitle(p)) })}
             <button type="button" class="toast__go" data-open="cart">${t('home.toast.view', { n: cart.count })}</button>`);
    }
  });
  foot.addEventListener('click', e => {
    if (!e.target.closest('[data-add-all]')) return;
    for (const p of items) if (!inCart(p.variants[0].id)) cart.add(p.variants[0].id, 1);
    openDialog('cart');
  });
  addEventListener('cart:change', renderList);
  if (!built || cart.count) renderList();

  wireRails();
}).catch(err => {
  console.error('[apolo] catalogue failed', err);
  if (!built) $('books').innerHTML = `<p class="err wrap">${t('home.err')}</p>`;
});

wireRails();
