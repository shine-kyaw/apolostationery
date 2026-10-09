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

### Product framing

APOLO's photos are supplier sheets: the product small in the middle of a
1500px square, with a corner logo, a spec badge and a pale watermark.
`tools/measure-images.mjs` opens every photo in a headless browser, finds where
the product actually is (ignoring the chrome and the watermark) and stores a
square crop in `data/crops.json`. Cards, search, cart and the product page then
show the product large and consistently framed; full-bleed artwork (the magenta
exercise-book tiles) is left uncropped. After a sync brings in new products:

```bash
npm i --no-save --no-package-lock puppeteer-core
node tools/measure-images.mjs
```

It only measures photos it hasn't seen. Uses Edge or Chrome (`CHROME_PATH` to
point at another). New photos simply show uncropped until it is run.

### Shop order

"Featured" on /shop opens with a hand-picked list of APOLO's strongest products
(`FEATURED` in `js/store/catalog.js`), then deals the rest out one category at a
time. Category pages keep the order set in Shopify.

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
Over the film the header has no bar, so the page reads as one sheet of paper;
it turns solid once the film has scrolled past.

### CSS gotcha
The film's CSS uses generic class names (`.line`, `.eyebrow`, `.brand`, `.cta`)
and its drawing is an `aria-hidden` SVG. Store icons are styled through
`svg.i` only — a broad `svg[aria-hidden]` rule once shrank the whole drawing to
20px and the film played as a pencil over a blank page.

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
