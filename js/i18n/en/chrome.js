/* chrome — English. See docs/TRANSLATING.md.
   Header, menus, search, cart drawer, toast, footer (js/site/chrome.js) and
   product cards (js/site/card.js, keys `card.`). Values that contain HTML are
   inserted as markup; keep the tags in the Burmese. */
export default {
  /* ---- header ---- */
  'chrome.logo.aria': 'APOLO Stationery — home',
  'chrome.nav.aria': 'Main',
  'chrome.nav.shop': 'Shop all',
  'chrome.nav.categories': 'Categories',
  'chrome.nav.all': 'See every product',
  'chrome.nav.delivery': 'Delivery & returns',
  'chrome.nav.contact': 'Contact',
  'chrome.hdr.support': 'Free support',
  'chrome.hdr.search': 'Search products',
  'chrome.hdr.cart': 'Cart',
  'chrome.hdr.menu': 'Menu',

  /* ---- search dialog ---- */
  'chrome.search.products': 'Search products',
  'chrome.search.placeholder': 'Search pens, exercise books, A4 paper…',
  'chrome.search.close': 'Close search',
  'chrome.search.browse': 'Browse a category',
  'chrome.search.none': 'No results for “{term}”. Try a word like <em>pen</em>, <em>A4</em> or <em>exercise book</em>, or call <a href="tel:{tel}">{phone}</a>.',
  'chrome.search.all_one': 'See all {n} result',
  'chrome.search.all_many': 'See all {n} results',

  /* ---- cart drawer ---- */
  'chrome.cart.title': 'Your cart',
  'chrome.cart.close': 'Close cart',
  'chrome.cart.aria_one': 'Cart, {n} item',
  'chrome.cart.aria_many': 'Cart, {n} items',
  'chrome.cart.error': 'The catalogue could not be loaded. Please refresh the page.',
  'chrome.cart.empty.title': 'Your cart is empty.',
  'chrome.cart.empty.sub': 'Find what you need in the shop.',
  'chrome.cart.empty.cta': 'Browse the shop',
  'chrome.cart.soldout': 'Sold out — not included at checkout',
  'chrome.cart.remove': 'Remove',
  'chrome.cart.each': '{price} each',
  'chrome.cart.qty_of': 'Quantity of {title}',
  'chrome.cart.subtotal': 'Subtotal',
  'chrome.cart.note': 'Delivery cost is shown at checkout. You can pay on arrival or by bank transfer.',
  'chrome.cart.checkout': 'Checkout',
  'chrome.cart.phone': 'Or order by phone',
  'chrome.cart.fine': 'You will finish your order on APOLO’s store, apolostationey.com.',

  /* ---- quantity stepper (cart and product page) ---- */
  'chrome.step.dec': 'Decrease',
  'chrome.step.qty': 'Quantity',
  'chrome.step.inc': 'Increase',

  /* ---- mobile menu ---- */
  'chrome.menu.title': 'Menu',
  'chrome.menu.close': 'Close menu',
  'chrome.menu.logo_alt': 'APOLO — home',
  'chrome.menu.aria': 'Mobile',
  'chrome.menu.shop': 'Shop all products',
  'chrome.menu.categories': 'Categories',
  'chrome.menu.help': 'Help',
  'chrome.menu.delivery': 'Delivery & returns',
  'chrome.menu.contact': 'Contact & showroom',
  'chrome.menu.call': 'Call {phone}',

  /* ---- footer ---- */
  'chrome.ftr.p1.title': 'Door-to-door delivery',
  'chrome.ftr.p1.sub': 'Yangon 3–5 days · other cities 5–12',
  'chrome.ftr.p2.title': 'Cash on delivery',
  'chrome.ftr.p2.sub': 'Or prepaid banking, KBZPay',
  'chrome.ftr.p3.title': '100% quality guarantee',
  'chrome.ftr.p3.sub': 'Money back: return within 14 days',
  'chrome.ftr.p4.title': 'Free support',
  'chrome.ftr.logo_alt': 'APOLO Stationery Myanmar',
  'chrome.ftr.blurb': 'Exercise books, pens, pencils and paper for schools and offices in Myanmar.',
  'chrome.ftr.facebook': 'APOLO on Facebook',
  'chrome.ftr.instagram': 'APOLO on Instagram',
  'chrome.ftr.shop': 'Shop',
  'chrome.ftr.all': 'All products',
  'chrome.ftr.help': 'Help',
  'chrome.ftr.delivery': 'Delivery times',
  'chrome.ftr.payment': 'Payment',
  'chrome.ftr.returns': 'Returns',
  'chrome.ftr.contact': 'Contact us',
  'chrome.ftr.showroom': 'Showroom & factory',
  'chrome.ftr.address': '{address}, Myanmar',
  'chrome.ftr.copy': '© {year} Deco Land Co., Ltd. · APOLO Stationery Myanmar',
  'chrome.ftr.synced': 'Prices in Myanmar kyat · catalogue updated <span id="ftrSynced">—</span>',

  /* the street address; CONTACT.address in chrome.js stays English for other uses */
  'chrome.address': 'No. 3-C, Ward (9), U Tun Nyo Street, Hlaing Thar Yar Industrial Zone (6), Hlaing Thar Yar Township, Yangon',

  /* ---- product card (js/site/card.js) ---- */
  'card.sale': 'Sale',
  'card.soldout': 'Sold out',
  'card.colours': '{n} colours',
  'card.options': '{n} options',
  'card.add_aria': 'Add {title} to cart',
  'card.choose_aria': 'Choose options for {title}',
  'card.added': '<b>Added</b> {title}',
  'card.view_cart': 'View cart ({n})',
  'chrome.hdr.search_ph': 'Search products…'
};
