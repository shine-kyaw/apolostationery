/* ==========================================================================
   APOLO — catalogue sync
   --------------------------------------------------------------------------
   Pulls the live catalogue from APOLO's Shopify store and writes one compact,
   sanitised snapshot to data/catalog.json. The site reads only that file.

   Why a snapshot and not a live fetch: the store's /products.json does not
   send CORS headers, so a browser on another domain cannot read it. Running
   this script is how prices, stock and new products reach the site.

     node tools/sync-catalog.mjs

   Then commit data/catalog.json and push. Nothing else needs to change.
   ========================================================================== */

import { writeFile } from 'node:fs/promises';

const SHOP = 'https://apolostationey.com';
const CDN  = 'https://cdn.shopify.com/s/files/1/0580/6443/7401/';
const OUT  = new URL('../data/catalog.json', import.meta.url);

/* Collections the site shows, in menu order, with the Burmese names and the
   one-line descriptions the store itself does not carry. A collection that is
   missing here is skipped, so an empty or internal Shopify collection never
   turns up as a dead category. */
const COLLECTIONS = [
  { handle: 'books',               short: 'Books',     my: 'စာအုပ်',          blurb: 'Exercise, note, drawing and hard-cover books' },
  { handle: 'writing-instruments', short: 'Writing',   my: 'ရေးသားရန်',        blurb: 'Pens, pencils, markers, crayons and pastels' },
  { handle: 'desk-accessories',    short: 'Desk',      my: 'စားပွဲသုံး',        blurb: 'Staplers, clips, glue, tape and cutters' },
  { handle: 'stationery-supplies', short: 'Supplies',  my: 'ကိရိယာများ',       blurb: 'Rulers, sharpeners, lamination and OHP film' },
  { handle: 'copy-paper',          short: 'Paper',     my: 'စက္ကူ',            blurb: 'Copy and colour paper by the ream' },
  { handle: 'file-folders',        short: 'Files',     my: 'ဖိုင်တွဲ',          blurb: 'Clear files, box files and folders' },
  { handle: 'envelopes',           short: 'Envelopes', my: 'စာအိတ်',          blurb: 'Wallet and document envelopes' },
  { handle: 'ledgers',             short: 'Ledgers',   my: 'စာရင်းစာအုပ်',     blurb: 'Daily, cash and account books' },
  { handle: 'vouchers',            short: 'Vouchers',  my: 'ဘောက်ချာ',        blurb: 'Invoice, cash and receipt vouchers' }
];

/* Products that are live in the store but sit in no collection. Placed by
   product type first, then by these title keywords, so they stay findable
   from a category page instead of only from search. */
const BY_TYPE = {
  'Books': 'books', 'Writing Instruments': 'writing-instruments',
  'Desk Accessories': 'desk-accessories', 'Stationery Supplies': 'stationery-supplies',
  'Copy Paper': 'copy-paper', 'Color Copy Paper': 'copy-paper',
  'File Folders': 'file-folders', 'Envelopes': 'envelopes',
  'Ledgers': 'ledgers', 'Vouchers': 'vouchers'
};
const BY_WORD = [
  [/ledger/i, 'ledgers'], [/voucher/i, 'vouchers'], [/envelope/i, 'envelopes'],
  [/file|folder/i, 'file-folders'], [/copy paper/i, 'copy-paper'],
  [/book/i, 'books'], [/pen|pencil|marker|crayon|pastel/i, 'writing-instruments'],
  [/clip|key ring|stapler|tape|glue/i, 'desk-accessories']
];

const get = async path => {
  const r = await fetch(SHOP + path, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
  return r.json();
};

async function all(path) {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const { products } = await get(`${path}?limit=250&page=${page}`);
    out.push(...products);
    if (products.length < 250) break;
  }
  return out;
}

/* Strip a CDN URL down to its path under the store's file root. The client
   re-adds the root and asks Shopify for a resized derivative (&width=). */
const path = src => src.replace(/^https?:/, 'https:').replace(CDN, '');

/* Product descriptions are hand-pasted into Shopify and arrive with Facebook
   images whose signed URLs expired years ago, editor <meta> tags and inline
   styles. Keep structure only; drop every attribute and every image. */
const KEEP = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i',
                      'table', 'thead', 'tbody', 'tr', 'th', 'td']);
function clean(html = '') {
  let s = (html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (m, tag) => {
      tag = tag.toLowerCase();
      if (!KEEP.has(tag)) return tag === 'div' ? (m[1] === '/' ? '' : '<br>') : '';
      return m[1] === '/' ? `</${tag}>` : `<${tag}>`;
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/<p>\s*(<br>\s*)*<\/p>/g, '')
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .replace(/^(\s*<br>)+|(<br>\s*)+$/g, '')
    .trim();
  return s;
}

const kyat = s => Math.round(parseFloat(s || '0'));

function slim(p) {
  const images = p.images.map(i => ({ src: path(i.src), w: i.width, h: i.height }));
  const index = new Map(p.images.map((i, n) => [i.id, n]));
  const options = p.options
    .filter(o => !(o.name === 'Title' && o.values.length === 1 && o.values[0] === 'Default Title'))
    .map(o => ({ name: o.name, values: o.values }));
  return {
    id: p.id,
    handle: p.handle,
    title: p.title.replace(/\s+/g, ' ').trim(),
    vendor: p.vendor,
    type: p.product_type,
    tags: p.tags,
    created: p.created_at.slice(0, 10),
    body: clean(p.body_html),
    images,
    options,
    variants: p.variants.map(v => ({
      id: v.id,
      title: v.title === 'Default Title' ? '' : v.title,
      o: [v.option1, v.option2, v.option3].filter(x => x != null),
      price: kyat(v.price),
      compare: v.compare_at_price ? kyat(v.compare_at_price) : 0,
      available: v.available,
      image: v.featured_image ? (index.get(v.featured_image.id) ?? 0) : -1
    }))
  };
}

const products = (await all('/products.json')).map(slim);
const byHandle = new Map(products.map(p => [p.handle, p]));
const { collections: shopCols } = await get('/collections.json?limit=250');

const collections = [];
const placed = new Set();
for (const meta of COLLECTIONS) {
  const sc = shopCols.find(c => c.handle === meta.handle);
  if (!sc) { console.warn(`! collection ${meta.handle} not found — skipped`); continue; }
  const members = (await all(`/collections/${meta.handle}/products.json`))
    .map(p => p.handle).filter(h => byHandle.has(h));
  members.forEach(h => placed.add(h));
  collections.push({
    handle: meta.handle, title: sc.title, short: meta.short, my: meta.my, blurb: meta.blurb,
    image: sc.image ? path(sc.image.src) : '',
    products: members
  });
}

for (const p of products) {
  if (placed.has(p.handle)) continue;
  const h = BY_TYPE[p.type] || (BY_WORD.find(([re]) => re.test(p.title)) || [])[1];
  const col = collections.find(c => c.handle === h);
  if (col) { col.products.push(p.handle); console.log(`  placed "${p.title}" → ${h}`); }
  else console.warn(`! "${p.title}" is in no collection; it will appear in Shop all and search only`);
}

const catalog = {
  synced: new Date().toISOString().slice(0, 10),
  shop: SHOP,
  cdn: CDN,
  collections: collections.filter(c => c.products.length),
  products
};

await writeFile(OUT, JSON.stringify(catalog));
const kb = (JSON.stringify(catalog).length / 1024).toFixed(0);
console.log(`✓ ${products.length} products, ${catalog.collections.length} collections → data/catalog.json (${kb} KB)`);
