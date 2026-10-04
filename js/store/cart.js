/* ==========================================================================
   APOLO — cart
   Lines are { id: variantId, qty } kept in localStorage, so a cart survives
   reloads and stays in step across tabs. Prices are never stored here; they
   are always read from the catalogue, so a re-sync can't leave a stale total.

   Checkout hands the lines to APOLO's own Shopify checkout through a cart
   permalink (/cart/<variant>:<qty>,…). That is a real order in the store the
   APOLO team already runs — cash on delivery, their delivery, their stock —
   not a form that goes nowhere.
   ========================================================================== */

const KEY = 'apolo.cart.v1';
const SHOP = 'https://apolostationey.com';
const MAX_QTY = 99;

let lines = read();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter(l => l && l.id && l.qty > 0) : [];
  } catch { return []; }
}

function write(detail = {}) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode: cart lives for this page */ }
  dispatchEvent(new CustomEvent('cart:change', { detail }));
}

/* another tab changed it */
addEventListener('storage', e => { if (e.key === KEY) { lines = read(); dispatchEvent(new CustomEvent('cart:change')); } });

export const cart = {
  get lines() { return lines.slice(); },
  get count() { return lines.reduce((n, l) => n + l.qty, 0); },

  add(id, qty = 1) {
    const l = lines.find(x => x.id === id);
    if (l) l.qty = Math.min(MAX_QTY, l.qty + qty);
    else lines.push({ id, qty: Math.min(MAX_QTY, qty) });
    write({ added: id, qty });
  },
  set(id, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, qty | 0));
    lines = qty ? lines.map(l => l.id === id ? { ...l, qty } : l) : lines.filter(l => l.id !== id);
    write();
  },
  remove(id) { lines = lines.filter(l => l.id !== id); write(); },
  clear() { lines = []; write(); },

  /** Lines joined to the catalogue. Drops anything the catalogue no longer sells. */
  resolve(c) {
    return lines.map(l => {
      const hit = c.byVariant.get(l.id);
      return hit && { ...l, ...hit, total: hit.variant.price * l.qty };
    }).filter(Boolean);
  },

  checkoutUrl(c) {
    const items = this.resolve(c).filter(l => l.variant.available);
    return items.length ? `${SHOP}/cart/${items.map(l => `${l.id}:${l.qty}`).join(',')}` : null;
  }
};
