# Translating the APOLO site (English ⇄ Burmese)

The site has a language switch in the header (and the mobile menu and footer).
A visitor's choice is remembered; with no choice, a browser set to Burmese gets
Burmese. Any URL accepts `?lang=my` or `?lang=en` — handy for sending someone a
link in a specific language, e.g. `https://apolostationery-mm.vercel.app/?lang=my`.

## For proofreaders

Open **[TRANSLATIONS.md](TRANSLATIONS.md)** — one table, *Key | English | Burmese*.
To fix a line, find its key in the Burmese file for that area and edit it:

| Area | English | Burmese |
|---|---|---|
| shared (categories, prices, sort orders, colours) | `js/i18n/en/common.js` | `js/i18n/my/common.js` |
| header, menus, search, cart, footer, product cards | `en/chrome.js` | `my/chrome.js` |
| home page | `en/home.js` | `my/home.js` |
| shop, category and search pages | `en/shop.js` | `my/shop.js` |
| product page | `en/product.js` | `my/product.js` |
| contact, delivery & returns, 404 | `en/info.js` | `my/info.js` |

Rules when editing a line:
- Keep `{curly}` words exactly as they are — the site fills in a number or a price there.
- Keep HTML tags (`<a href="…">`, `<strong>`) and translate only the words between them.
- Never change a key (the part before the colon).
- After editing, run `node tools/check-i18n.mjs` — it fails if a key is missing or a `{placeholder}` is lost.
- Then `node tools/check-i18n.mjs --table` refreshes TRANSLATIONS.md.

### Product names and descriptions
The 155 product names and descriptions come from the store in English. Their
Burmese versions are in `data/catalog.my.json` — **machine-drafted, please
proofread** (the names first: they show on every card). Each entry keeps the
English (`_en`) beside it for reference, keyed by the product's Shopify handle:

```json
{
  "apolo-color-pencil-36-colors": {
    "title": "APOLO အရောင်ခဲတံ (အရောင် ၃၆)",
    "body": "<p>…</p>"
  }
}
```
Any product not listed keeps its English name. Search finds products by either name.
Model codes, sizes and brand names stay in Latin (`A-221C`, `80 GSM`, `Paper One`).
After editing, rebuild (`node tools/build.mjs`) — the Burmese pages are built
with these names baked in.

Names the drafts were least sure of: Highlighter (ဟိုင်းလိုက်တာ / ဟိုက်လိုက်တာ —
pick one spelling), Correction Pen, Lecture Book, Lamination Pouch Film, Staples
Pin, Exercise Signature Book, Push Pins, Envelope Wallet / Salary / Pocket.
Note that the store's own English description of "Stock Ledger" describes a
company share register (it looks copied from the web); the Burmese follows it,
and the Shopify text should probably be rewritten.

## For developers

- `t('key')`, `t('key', { n: 3 })` in JavaScript; `data-i18n="key"`,
  `data-i18n-html="key"` (text with links) and `data-i18n-attr="aria-label:key"`
  in static HTML. `tr('key', fallback)` is for words the catalogue gives us.
- **English (`js/i18n/en/*.js`) is the source of truth**; every key must exist in
  both languages. A missing Burmese key falls back to English on the page, and
  fails `tools/check-i18n.mjs`.
- Key names start with the area: `chrome.`, `card.`, `home.`, `film.`, `shop.`,
  `product.`, `info.`; shared ones are `cat.`, `sort.`, `price.`, `lang.`.
- Switching language reloads the page (cart, scroll position and filters in the
  URL all survive). `js/i18n-boot.js` runs in `<head>` so Burmese pages never
  flash English.
- Burmese typography is `html[lang="my"]` in `css/base.css`: no letter-spacing
  (it pulls marks off their letters), taller line-height. Don't set
  `letter-spacing` or a tight `line-height` on text that will be translated
  without checking it in Burmese.
- Prices: `price.fmt` — `K48,200` in English, `48,200 ကျပ်` in Burmese. Digits stay
  Arabic everywhere, as on the APOLO store.

## House style for the Burmese

- Polite written register (ပါ / ပါသည်) for sentences; short noun-style labels for
  buttons and menus (ကြည့်ရန်, ထည့်မည်).
- Sentences end with ။ ; lists use ၊ .
- Arabic digits (0–9). Keep 100% as `100%`.
- Keep in Latin: **APOLO**, product names and model codes (A-221C, 80 GSM, A4),
  Facebook, Instagram, KBZPay and bank names as the banks write them, phone numbers.
- The brand's Burmese line is **အပိုလို စာရေးကိရိယာ**; "ဆွဲမယ်" (let's draw) is APOLO's
  own campaign word and stays as is.
- Don't claim anything the English doesn't. The service facts (delivery times,
  payment, returns, support hours) come from APOLO's own store and are listed in
  `docs/STORE.md`.

## Glossary (use these words everywhere)

| English | Burmese |
|---|---|
| Stationery | စာရေးကိရိယာ |
| Shop all (products) | ကုန်ပစ္စည်းအားလုံး |
| Products | ကုန်ပစ္စည်းများ |
| Categories | အမျိုးအစားများ |
| Search | ရှာဖွေရန် |
| Cart | ဈေးခြင်း |
| Add to cart | ဈေးခြင်းထဲ ထည့်မည် |
| Buy now | ယခုပဲ ဝယ်မည် |
| Checkout | ငွေရှင်းရန် |
| Subtotal | စုစုပေါင်း |
| Remove | ဖယ်ရှားရန် |
| Quantity | အရေအတွက် |
| In stock | ကုန်ပစ္စည်းရှိသည် |
| Sold out | ကုန်သွားပါပြီ |
| Sale | လျှော့စျေး |
| See all / View all | အားလုံးကြည့်ရန် |
| Filter | စစ်ထုတ်ရန် |
| Sort by | စီစဉ်ရန် |
| Brand | ကုန်အမှတ်တံဆိပ် |
| Price | ဈေးနှုန်း |
| Colour / colours | အရောင် / အရောင်များ |
| Options | ရွေးချယ်စရာများ |
| Description | ဖော်ပြချက် |
| Details | အသေးစိတ် |
| Related products | ဆက်စပ်ကုန်ပစ္စည်းများ |
| Contact | ဆက်သွယ်ရန် |
| Delivery & returns | ပို့ဆောင်ရေးနှင့် ပြန်ပို့ရေး |
| Terms & conditions | စည်းကမ်းချက်များ |
| Door-to-door delivery | အိမ်တိုင်ရာရောက် ပို့ဆောင်ပေးခြင်း |
| Delivery times | ပို့ဆောင်ချိန် |
| days | ရက် |
| Cash on delivery | ပစ္စည်းရောက်မှ ငွေချေခြင်း |
| Prepaid banking | ကြိုတင်ငွေလွှဲခြင်း |
| 100% quality guarantee | အရည်အသွေး 100% အာမခံ |
| Money-back guarantee | ငွေပြန်အမ်း အာမခံ |
| Return (a product) | ပြန်ပို့ခြင်း |
| Free support | အခမဲ့ အကူအညီ |
| Help & support | အကူအညီနှင့် ဝန်ဆောင်မှု |
| Call | ဖုန်းခေါ်ရန် |
| Message us | မက်ဆေ့ချ်ပို့ရန် |
| Showroom | ရှိုးခန်း |
| Factory | စက်ရုံ |
| Address | လိပ်စာ |
| Phone | ဖုန်း |
| Email | အီးမေးလ် |
| Open in Google Maps | Google Maps တွင်ကြည့်ရန် |
| Yangon | ရန်ကုန် |
| Mandalay | မန္တလေး |
| Naypyitaw | နေပြည်တော် |
| Taunggyi | တောင်ကြီး |
| Mawlamyine | မော်လမြိုင် |
| Pathein | ပုသိမ် |
| Bago | ပဲခူး |
| Pyin Oo Lwin | ပြင်ဦးလွင် |
| Other cities | အခြားမြို့များ |
| Hlaing Thar Yar | လှိုင်သာယာ |
| Exercise book | ကျောင်းသုံးစာအုပ် |
| Note book | မှတ်စုစာအုပ် |
| Drawing book | ပုံဆွဲစာအုပ် |
| Pen / Pencil | ဘောပင် / ခဲတံ |
| Copy paper | ကော်ပီစက္ကူ |
| School | ကျောင်း |
| Office | ရုံး |
