# APOLO — the store around the film

The hero film (see [HANDOFF.md](HANDOFF.md)) is the first screen of the home
page. Everything below it, and every other page, is the store: the same
catalogue, categories, product pages, cart and checkout as apolostationey.com,
rebuilt on this site in the film's paper / graphite / magenta language.

## Pages and routes

| URL | File | What it is |
|---|---|---|
| `/` | `index.html` | The film, then categories, shelves, campaigns, showroom |
| `/shop` | `shop.html` | Every product, with brand + price filters and sort |
| `/collections/:handle` | `shop.html` | One category (same handles as Shopify) |
| `/search?q=` | `shop.html` | Search results |
| `/products/:handle` | `product.html` | Product page (`?variant=<id>` selects a variant) |
| `/pages/contact` | `contact.html` | Phones, Facebook, Instagram, email, showroom |
| `/pages/terms-conditions` | `terms.html` | Delivery times, payment, returns |
| anything else | `404.html` | |

URLs deliberately match the Shopify store's, so links that already point at
`apolostationey.com/products/...` work if you swap the domain. The rewrites live
in `vercel.json`; `tools/serve.mjs` reads the same file, so local and live
behave the same.

## Where the data comes from

`data/catalog.json` is a snapshot of the live Shopify catalogue — products,
variants, prices, images, categories and the Burmese category names. The store
reads only that file. Shopify's `/products.json` sends no CORS headers, so the
browser can't read it live from this domain; the snapshot is the workaround.

**To pick up new products or price changes:**

```bash
node tools/sync-catalog.mjs
```

Then commit `data/catalog.json` and push. The footer shows the date of the last
sync. Category names, Burmese labels and blurbs are set at the top of the sync
script (`COLLECTIONS`). Products that are live but sit in no Shopify collection
are placed by type or title keyword (`BY_TYPE`, `BY_WORD`) so none go missing.

Product images are loaded from Shopify's CDN at the size each slot needs
(`&width=`), never the 1500px masters.

## Cart and checkout

The cart is kept in the visitor's browser (`localStorage`, key
`apolo.cart.v1`) and stays in sync across tabs. **Checkout** sends the cart
to APOLO's own Shopify checkout via a cart permalink:

```
https://apolostationey.com/cart/<variantId>:<qty>,<variantId>:<qty>
```

So orders, payment (cash on delivery / bank transfer), stock and delivery all
stay in the Shopify admin the APOLO team already uses. **Buy now** on a product
page does the same for a single line. If Shopify ever changes a variant ID, the
next catalogue sync picks it up.

## Code map

```
css/base.css        tokens (colours, radii, shadows), reset — shared by everything
css/site.css        the store: header, footer, dialogs, cards, shelves, pages
css/apolo.css       the film only (home page)

js/store/catalog.js loads + indexes the catalogue; money, images, search, sort
js/store/cart.js    cart state + checkout URL
js/site/chrome.js   header, category menu, search, cart drawer, mobile menu, footer
js/site/card.js     the product card + quick add
js/site/rail.js     sideways shelves
js/pages/*.js       one entry per page type

js/hero.js, engine.js, assets.js, audio.js — the film (unchanged in behaviour)
```

The film and the store never import each other. If the film fails, the store
still renders; if the catalogue fails, the film still plays.

### Home page header
Over the film the header has no logo and no bar — the film ends with the logo
resolving on the page it drew, and a second logo pinned above it the whole way
would spend that moment in advance. Once the film has scrolled past, the header
turns solid and the logo appears in it.

## Run it locally

```bash
node tools/serve.mjs
```

Then open http://localhost:8123. ES modules and absolute paths mean `file://`
does not work.

## Known gaps

- Pages are rendered in the browser from the catalogue, so a crawler that runs
  no JavaScript sees empty product pages. Google renders JS and will index them;
  if SEO becomes a priority, pre-render product pages in the sync script.
- Delivery fees are not shown before checkout; Shopify calculates them there.
- Customer accounts and order history live on the Shopify store and are not
  rebuilt here.
