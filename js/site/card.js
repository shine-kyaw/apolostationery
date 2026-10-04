/* ==========================================================================
   APOLO — product card
   One card, used by the home shelves, the shop grid and "related". A product
   with a single variant can go straight into the cart from the card; one with
   colours or sizes opens its page, because guessing the variant for someone
   is how wrong orders happen.
   ========================================================================== */

import { img, srcset, esc, money, priceLabel, shortTitle, catalog } from '../store/catalog.js';
import { cart } from '../store/cart.js';
import { ICON, toast, openDialog } from './chrome.js';

export function card(p, { eager = false } = {}) {
  const a = p.images[0], b = p.images[1];
  const one = p.variants.length === 1;
  const v = p.variants[0];
  const opt = p.options[0];
  const sale = p.variants.some(x => x.compare > x.price);
  const swatches = opt && /colou?r/i.test(opt.name) ? opt.values.length : 0;

  return `
  <article class="card${p.available ? '' : ' is-out'}">
    <a class="card__link" href="/products/${p.handle}">
      <span class="card__img">
        ${a ? `<img src="${img(a.src, 450)}" srcset="${srcset(a.src)}" sizes="(max-width:600px) 46vw, (max-width:1100px) 30vw, 280px"
                  alt="${esc(p.title)}" width="450" height="450" ${eager ? '' : 'loading="lazy"'} decoding="async">` : ''}
        ${b ? `<img class="card__alt" src="${img(b.src, 450)}" alt="" width="450" height="450" loading="lazy" decoding="async">` : ''}
        ${sale ? '<span class="tag tag--sale">Sale</span>' : ''}
        ${p.available ? '' : '<span class="tag">Sold out</span>'}
      </span>
      <span class="card__meta">${esc(p.collections[0]?.title || p.type || p.vendor)}${
        p.vendor && !/^apolo/i.test(p.vendor) ? ` · ${esc(p.vendor)}` : ''}</span>
      <h3 class="card__t">${esc(shortTitle(p))}</h3>
      <span class="card__p">${priceLabel(p)}${sale && one ? ` <s>${money(v.compare)}</s>` : ''}</span>
      ${p.variants.length > 1 ? `<span class="card__v">${swatches ? `${swatches} colours` : `${p.variants.length} options`}</span>` : ''}
    </a>
    ${p.available ? (one
      ? `<button type="button" class="card__add" data-add="${v.id}" aria-label="Add ${esc(shortTitle(p))} to cart">${ICON.plus}</button>`
      : `<a class="card__add" href="/products/${p.handle}" aria-label="Choose options for ${esc(shortTitle(p))}" tabindex="-1">${ICON.arrow}</a>`)
      : ''}
  </article>`;
}

/* One delegated listener for every quick-add button on the page. */
let wired = false;
export function wireQuickAdd() {
  if (wired) return; wired = true;
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const id = +btn.dataset.add;
    cart.add(id, 1);
    btn.classList.remove('is-done'); void btn.offsetWidth; btn.classList.add('is-done');
    const c = await catalog();
    const hit = c.byVariant.get(id);
    toast(`<span><b>Added</b> ${esc(shortTitle(hit.product))}</span>
           <button type="button" class="toast__go" data-open="cart">View cart (${cart.count})</button>`);
  });
}

export { openDialog };
