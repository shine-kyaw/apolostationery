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
| `/products/:slug` | `product.html` | Product page (`?variant=<id>` selects a variant) |
| `/pages/contact` | `contact.html` | Phones, Facebook, Instagram, email, showroom |
| `/pages/terms-conditions` | `terms.html` | Delivery times, payment, returns |
| anything else | `404.html` | |

URLs match the Shopify store's, so links that already point at
`apolostationey.com/products/...` work if you swap the domain — except the
listings Shopify named `copy-of-…` when they were duplicated, whose handles
describe a different product (`copy-of-office-stapler-a191b` is the A191C).
Those get an address from their own name (`js/store/names.js`), and
`vercel.json` redirects the old ones; the build keeps that list current.

## How the site is built and served

`node tools/build.mjs` (Vercel runs it on every push) turns the source pages
into `dist/`:

- **Every page is built ahead of time, in English and in Burmese** —
  `dist/en/…` and `dist/my/…`: header, footer, product details, prices,
  related products, category grids with their filters, the home page's
  sections. A visitor (and Google, and a Facebook/Viber link preview) gets a
  finished page instead of an empty one that fills itself in; the page scripts
  then only wire it up. The markup comes from `js/views/*.js`, the same code
  the browser runs, so the two can't drift apart.
- **One page per product and per category** with its own title, description,
  canonical link, `hreflang` links between the two languages, share-preview
  tags (`og:`) and structured data (schema.org `Product` with its price in
  MMK, stock and the 14-day return policy; `BreadcrumbList`; `ItemList` on
  categories; `Organization` + `WebSite` with search on the home page). No
  ratings or reviews are marked up — there are none to mark up.
- **Scripts are bundled and minified per language** with esbuild (an English
  page doesn't ship the Burmese text), styles merged and minified, all under
  content-hashed names in `/assets`, cached for a year. Google's font
  stylesheet is inlined and the font files each language needs first are
  preloaded.
- `sitemap.xml` (both languages), `robots.txt`, `favicon.ico`, the icon set
  (from APOLO's own store icon) and `site.webmanifest`. Share images:
  `img/og-en.jpg`, `img/og-my.jpg`.
- Only the site is published: `docs/`, `tools/` and `_research/` are not.

**Which language a visitor gets.** The address is the same in both languages;
`vercel.json` sends `dist/my/…` when the URL has `?lang=my` or the visitor's
`apolo_lang` cookie says `my`, otherwise `dist/en/…`. The language switch
sets that cookie (and `localStorage`) and reloads. `js/i18n-boot.js`, inlined
in every page's `<head>`, sends a Burmese-browser visitor on a first visit to
the Burmese copy once, and tidies `?lang=` out of the address.

**Locally:**

```bash
npm ci                                  # once: installs esbuild
node tools/build.mjs && node tools/serve.mjs     # the built site, routed like Vercel
node tools/serve.mjs --src              # the source pages, unbuilt (draw themselves)
```

`tools/serve.mjs` reads `vercel.json` (redirects, then files, then the
language rewrites with their cookie/query conditions), so local and live
route the same. Set `SITE_URL` when building for another domain (canonical
links, sitemap); the default is https://apolostationery-mm.vercel.app.

**Visitor numbers.** Every page loads Vercel Web Analytics
(`/_vercel/insights/script.js`; no cookies). It starts counting once
Analytics is switched on for the project in the Vercel dashboard; until then
that one request returns 404 and nothing else happens.

## Where the data comes from

`data/catalog.json` is a snapshot of the live Shopify catalogue — products,
variants, prices, images, categories and the Burmese category names. The store
reads only that file. Shopify's `/products.json` sends no CORS headers, so the
browser can't read it live from this domain; the snapshot is the workaround.

**It refreshes itself every morning.** `.github/workflows/sync-catalog.yml`
runs at 05:00 Yangon time (and on demand from the repository's Actions tab):
it pulls the catalogue, frames new photos, checks the site still builds and
commits `data/` only if something actually changed — that commit is the
deploy. The footer shows the date of the last change.

To refresh by hand:

```bash
node tools/sync-catalog.mjs
```

Then commit `data/catalog.json` and push.

The sync also tidies the names typed into Shopify (`cleanTitle`: "Practic",
doubled quote marks, spacing, "GSM") and leaves out listings with no price.
On the site a name drops the bracketed list of choices the colour/size picker
already shows ("Gel Pen A-101 (Blue/Black/Red)" → "Gel Pen A-101");
`displayName` in `js/store/names.js`. Category names, Burmese labels and blurbs are set at the top of the sync
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

### Search

`js/store/search.js`. Built for how people type into a stationery shop's box:
misspellings ("pensil", "sharpner", "exersize book" — edit-distance matching
against the catalogue's own words), British spelling ("colour"), home words
("rubber" → eraser, "crayon" → oil pastel, "biro"), one word for two
("notebook"), plurals, Burmese digits, and **Burmese** — each product carries
the Burmese words for what it is (ဘောပင်, ခဲတံ, ကော်ပီစက္ကူ …, the `BURMESE` list)
plus its Burmese name and category. A hit in the name counts most, then the
category, then tags and options; a name that starts with what was typed ranks
first. If no product has every word, the closest are shown with a note
("Nothing matches every word of …").

### Product details

The store's descriptions are thin, but its names carry the facts people
compare on. The product page's **Details** lists them — paper weight, pages,
sheets, size, ruling, columns, colours, pencil grade, ply, thickness, pieces
per pack, model code — read off the product's own name (`specs()` in
`js/views/product.js`), never invented, and left out when an option already
covers it.

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

js/store/catalog.js loads + indexes the catalogue; money, images, sort, related
js/store/search.js  product search (spelling, synonyms, Burmese)
js/store/names.js   display names and product addresses (shared with the build)
js/store/cart.js    cart state + checkout URL
js/site/chrome.js   header, category menu, search, cart drawer, mobile menu, footer
js/site/card.js     the product card + quick add (second photo loads on hover only)
js/site/rail.js     sideways shelves
js/views/*.js       page markup, pure functions — used by the browser and the build
js/pages/*.js       one entry per page type: draw (if not built) and wire up

tools/build.mjs     the build (see above)      tools/serve.mjs   local server
tools/sync-catalog.mjs, measure-images.mjs   the catalogue and its photo framing

js/hero.js, engine.js, assets.js, audio.js — the film (unchanged in behaviour)
```

The film and the store never import each other. If the film fails, the store
still renders; if the catalogue fails, the film still plays.

### Home page, below the film
The film holds APOLO magenta back and lands it on the logo; the page below
floods with it ("Fill the page."). Then the store is built from the thing
APOLO makes — the exercise book:

- **Categories are exercise-book covers** (`COVERS` in js/pages/home.js): the
  pastel cover colours APOLO prints, the logo, an illustration panel with one
  real product, and the cover label every Myanmar school book has, filled in
  by hand. The four smaller categories are a ruled index underneath.
- **The school list** (`LIST`): single-variant essentials on a ruled page. A
  tick adds that item to the cart; "Add the whole list" adds the rest.
- One product shelf, the store's own posters, the showroom.

Handwriting (Kalam, ballpoint blue `--biro`) is used only where a person
would really write by hand: the cover labels, the ticks, counts.

### Two languages (English / Burmese)
A globe pill in the header (also in the mobile menu and footer) switches the
whole site; the choice is remembered, and a browser set to Burmese opens in
Burmese. `?lang=my` / `?lang=en` on any URL forces one. All text lives in one
table per language (`js/i18n/en/*.js`, `js/i18n/my/*.js`); `js/i18n.js` reads
it, `js/i18n-boot.js` sets the language before first paint, Burmese typography
is `html[lang="my"]` in `css/base.css`. Product names and descriptions come from
Shopify in English; their Burmese versions are in `data/catalog.my.json` (all
155, machine-drafted, waiting for a native proofread — see TRANSLATING.md).
Colour and cover-design names are `val.*` lines in `js/i18n/my/common.js`. Full guide, glossary and the proofreading table:
[TRANSLATING.md](TRANSLATING.md), [TRANSLATIONS.md](TRANSLATIONS.md). After
editing any text: `node tools/check-i18n.mjs`.

### What the site says about APOLO (and where it comes from)
Every service claim is taken from APOLO's own store (apolostationey.com), not
written by us: **door-to-door delivery**; delivery times by city (Yangon 3–5
days … other cities 5–12); **cash on delivery or prepaid banking** (KBZPay, KBZ,
CB, AYA, UAB, Yoma Bank, from the store's footer image); **100% quality
guarantee** with returns requested within 14 days; **free support** by phone
and Facebook (9 AM–5 PM is stated for Facebook/live chat, not for phone). Shown
in the hero's trust line, the "Ordering from APOLO" section on the home page,
product pages, the footer strip and the terms page. If the store's Terms page
changes, update `#service` in index.html and terms.html together. Do not add
claims the store doesn't make (e.g. where products are made, nationwide
delivery).

### Home page header
Over the film the header has no bar, so the page reads as one sheet of paper;
it turns solid once the film has scrolled past.

### CSS gotcha
The film's CSS uses generic class names (`.line`, `.eyebrow`, `.brand`, `.cta`)
and its drawing is an `aria-hidden` SVG. Store icons are styled through
`svg.i` only — a broad `svg[aria-hidden]` rule once shrank the whole drawing to
20px and the film played as a pencil over a blank page.

## Known gaps

- No customer reviews or ratings: there is no source for real ones yet (a
  Shopify review app, or reviews APOLO collects). None are invented.
- Product photos are supplier sheets (watermark, badges, marketing artwork with
  numbers baked in); only better photography fixes that.
- Checkout happens on the Shopify store's own domain, apolostationey.com
  (spelled that way).
- Delivery fees are not shown before checkout; Shopify calculates them there.
- Customer accounts and order history live on the Shopify store and are not
  rebuilt here.
