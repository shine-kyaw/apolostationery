/* ==========================================================================
   APOLO — product framing
   --------------------------------------------------------------------------
   Every APOLO product photo is a 1500px supplier sheet: the product floats in
   the middle with a corner logo, a spec badge and a faint watermark around
   it. A pen ends up as a sliver on a big white square. This measures where
   the product actually is in each photo (the "ink", ignoring the corner
   chrome and the pale watermark) and stores a square crop around it, so cards
   can show every product large and consistently framed — the same thing the
   film does by hand for its fourteen objects.

     node tools/measure-images.mjs           measures photos not measured yet
     node tools/measure-images.mjs --all     re-measures everything

   Needs a Chromium browser (Edge ships with Windows) and puppeteer-core:
     npm i --no-save puppeteer-core
   Writes data/crops.json and folds the crops into data/catalog.json. The sync
   script folds them in too, so a later sync keeps them.
   ========================================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'
].filter(Boolean);

const CATALOG = new URL('../data/catalog.json', import.meta.url);
const CROPS   = new URL('../data/crops.json', import.meta.url);
const CDN = 'https://cdn.shopify.com/s/files/1/0580/6443/7401/';

const { default: puppeteer } = await import('puppeteer-core').catch(() => {
  console.error('puppeteer-core is missing: npm i --no-save puppeteer-core'); process.exit(1);
});
const executablePath = BROWSERS.find(p => existsSync(p));
if (!executablePath) { console.error('No Chrome/Edge found; set CHROME_PATH'); process.exit(1); }

const catalog = JSON.parse(await readFile(CATALOG, 'utf8'));
const crops = existsSync(CROPS) ? JSON.parse(await readFile(CROPS, 'utf8')) : {};
const all = process.argv.includes('--all');

const key = src => src.split('?')[0];
const srcs = [...new Set(catalog.products.flatMap(p => p.images.map(i => i.src)))]
  .filter(s => all || !(key(s) in crops));
console.log(`measuring ${srcs.length} photo${srcs.length === 1 ? '' : 's'}…`);

const browser = await puppeteer.launch({ executablePath, headless: true });
const page = await browser.newPage();
await page.goto('about:blank');

/* Runs in the browser: returns [x, y, side] as fractions of the photo, or 0
   when the photo is already full-bleed artwork and should not be cropped. */
const measure = async url => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = new OffscreenCanvas(W, H), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const cols = new Uint32Array(W), rows = new Uint32Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const fx = x / W, fy = y / H;
    /* supplier chrome: APOLO logo top-right, spec badge bottom-left */
    if ((fx > 0.80 && fy < 0.15) || (fx < 0.30 && fy > 0.82)) continue;
    const i = (y * W + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 24) continue;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
    const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
    /* the mint watermark is pale and barely saturated: not product */
    if (lum < 222 || mx - mn > 55) { cols[x]++; rows[y]++; }
  }
  const span = (arr, n, min) => {
    let a = 0, b = n - 1;
    while (a < n && arr[a] < min) a++;
    while (b > a && arr[b] < min) b--;
    return a < b ? [a / n, (b + 1) / n] : null;
  };
  const sx = span(cols, W, Math.max(2, H * 0.004)), sy = span(rows, H, Math.max(2, W * 0.004));
  if (!sx || !sy) return 0;
  const bw = sx[1] - sx[0], bh = sy[1] - sy[0];
  let side = Math.max(bw, bh) * 1.16;                 // breathing room round the product
  side = Math.max(side, 0.30);                         // never zoom past ~3.3×
  if (side >= 0.9) return 0;                           // full-bleed artwork: leave it
  const cx = (sx[0] + sx[1]) / 2, cy = (sy[0] + sy[1]) / 2;
  const x = Math.min(Math.max(cx - side / 2, 0), 1 - side);
  const y = Math.min(Math.max(cy - side / 2, 0), 1 - side);
  return [+x.toFixed(4), +y.toFixed(4), +side.toFixed(4)];
};

let n = 0;
for (const src of srcs) {
  const url = CDN + src + (src.includes('?') ? '&' : '?') + 'width=500';
  try { crops[key(src)] = await page.evaluate(measure, url); }
  catch (e) { console.warn(`  ! ${src}: ${e.message}`); }
  if (++n % 25 === 0) console.log(`  ${n}/${srcs.length}`);
}
await browser.close();

await writeFile(CROPS, JSON.stringify(crops, null, 0).replace(/\],/g, '],\n'));
for (const p of catalog.products) for (const im of p.images) {
  const c = crops[key(im.src)];
  if (c) im.c = c; else delete im.c;
}
await writeFile(CATALOG, JSON.stringify(catalog));
const cropped = Object.values(crops).filter(Boolean).length;
console.log(`✓ ${Object.keys(crops).length} photos measured, ${cropped} framed → data/crops.json, data/catalog.json`);
