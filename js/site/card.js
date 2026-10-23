/* ==========================================================================
   APOLO — product card
   One card, used by the home shelves, the shop grid and "related". A product
   with a single variant can go straight into the cart from the card; one with
   colours or sizes opens its page, because guessing the variant for someone
   is how wrong orders happen.
   ========================================================================== */

import { photo, esc, money, priceLabel, shortTitle, catalog, colTitle } from '../store/catalog.js';
import { cart } from '../store/cart.js';
import { t } from '../i18n.js';
import { ICON, toast, openDialog } from './chrome.js';

const SIZES = '(max-width:600px) 46vw, (max-width:1100px) 30vw, 280px';

export function card(p, { eager = false } = {}) {
  const a = p.images[0], b = p.images[1];
  const one = p.variants.length === 1;
  const v = p.variants[0];
  const opt = p.options[0];
  const sale = p.variants.some(x => x.compare > x.price);
  const swatches = opt && /colou?r/i.test(opt.name) ? opt.values.length : 0;

  return `
  <article class="card${p.available ? '' : ' is-out'}">
    <a class="card__link" href="${p.url}">
      <span class="card__img">
        ${photo(a, { w: 300, sizes: SIZES, alt: p.name, lazy: !eager })}
        ${b ? photo(b, { w: 300, sizes: SIZES, cls: 'card__alt', defer: true }) : ''}
        ${sale ? `<span class="tag tag--sale">${t('card.sale')}</span>` : ''}
        ${p.available ? '' : `<span class="tag">${t('card.soldout')}</span>`}
      </span>
      <span class="card__meta">${esc(p.collections[0] ? colTitle(p.collections[0]) : p.type || p.vendor)}${
        p.vendor && !/^apolo/i.test(p.vendor) ? ` · ${esc(p.vendor)}` : ''}</span>
      <h3 class="card__t">${esc(shortTitle(p))}</h3>
      <span class="card__p">${priceLabel(p)}${sale && one ? ` <s>${money(v.compare)}</s>` : ''}</span>
      ${p.variants.length > 1 ? `<span class="card__v">${swatches ? t('card.colours', { n: swatches }) : t('card.options', { n: p.variants.length })}</span>` : ''}
    </a>
    ${p.available ? (one
      ? `<button type="button" class="card__add" data-add="${v.id}" aria-label="${esc(t('card.add_aria', { title: shortTitle(p) }))}">${ICON.plus}</button>`
      : `<a class="card__add" href="${p.url}" aria-label="${esc(t('card.choose_aria', { title: shortTitle(p) }))}" tabindex="-1">${ICON.arrow}</a>`)
      : ''}
  </article>`;
}

/* One delegated listener for every quick-add button on the page, and one for
   the second photo: it is fetched the first time a mouse rests on the card
   (a phone never hovers, so never downloads it) and fades in once it is in. */
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
    toast(`<span>${t('card.added', { title: esc(shortTitle(hit.product)) })}</span>
           <button type="button" class="toast__go" data-open="cart">${t('card.view_cart', { n: cart.count })}</button>`);
  });
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const alt = e.target.closest?.('.card')?.querySelector('img.card__alt[data-src]');
    if (!alt) return;
    alt.addEventListener('load', () => alt.parentElement.classList.add('has-alt'), { once: true });
    alt.srcset = alt.dataset.srcset; alt.src = alt.dataset.src;
    alt.removeAttribute('data-src');
  });
}

export { openDialog };
