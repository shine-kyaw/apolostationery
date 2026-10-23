/* ==========================================================================
   APOLO — build
   --------------------------------------------------------------------------
   Turns the source pages into the site Vercel serves, in dist/:

   • every page, built ahead of time in English and in Burmese — header,
     footer, products, prices, filters — so a visitor (and Google, and the
     Facebook/Viber link preview) gets a finished page, not an empty shell
     that fills itself in. The browser scripts then only wire it up.
       dist/en/…   dist/my/…   (vercel.json picks one per request from the
       apolo_lang cookie or ?lang=, see the rewrites there)
   • one page per product (/products/<slug>) and per category, each with its
     own title, description, canonical and language links, share-preview
     tags and structured data (schema.org Product, BreadcrumbList)
   • scripts bundled and minified per language (an English page doesn't ship
     the Burmese text), styles merged and minified, all under content-hashed
     names in /assets so browsers can keep them for a year
   • sitemap.xml, robots.txt, the icon set and the web manifest
   • nothing else: docs/, tools/ and _research/ are no longer published

     node tools/build.mjs            → dist/
     SITE_URL=https://… node tools/build.mjs   (canonical domain; default below)

   Vercel runs this on every push (vercel.json: buildCommand). It reads only
   files in this repository; the catalogue is data/catalog.json as synced.
   ========================================================================== */

import { build as esbuild, transform } from 'esbuild';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://apolostationery-mm.vercel.app').replace(/\/$/, '');
const LANGS = ['en', 'my'];
const LOCALE = { en: 'en_US', my: 'my_MM' };
const t0 = Date.now();

const src = (...p) => join(ROOT, ...p);
const read = p => readFile(src(p), 'utf8').then(s => s.replace(/\r\n/g, '\n'));
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 10);
async function put(path, body) {
  await mkdir(dirname(join(OUT, path)), { recursive: true });
  await writeFile(join(OUT, path), body);
}
const mod = p => import(pathToFileURL(src(p)).href);

/* the site's own modules — the same code the browser runs */
const i18n = await mod('js/i18n.js');
const store = await mod('js/store/catalog.js');
const { slugs } = await mod('js/store/names.js');
const { chromeHTML, CONTACT } = await mod('js/site/chrome.js');
const pv = await mod('js/views/product.js');
const sv = await mod('js/views/shop.js');
const hv = await mod('js/views/home.js');
const { t } = i18n;
const { esc } = store;

await rm(OUT, { recursive: true, force: true });

/* ---------- data, under versioned names ---------- */
const rawCatalog = await read('data/catalog.json');
const rawMy = await read('data/catalog.my.json').catch(() => '{}');
const DATA = {
  catalog: `/data/catalog.${hash(rawCatalog)}.json`,
  catalogMy: `/data/catalog.my.${hash(rawMy)}.json`
};
await put(DATA.catalog, rawCatalog);
await put(DATA.catalogMy, rawMy);
/* unversioned copies for anything that still asks for the old names */
await put('/data/catalog.json', rawCatalog);
await put('/data/catalog.my.json', rawMy);
const synced = JSON.parse(rawCatalog).synced;

/* ---------- redirects for products whose address changed ---------- */
{
  const products = JSON.parse(rawCatalog).products;
  const moved = [...slugs(products)].filter(([h, s]) => h !== s);
  const cfgText = await read('vercel.json');
  const cfg = JSON.parse(cfgText);
  const want = moved.map(([h, s]) => ({ source: `/products/${h}`, destination: `/products/${s}`, permanent: true }));
  const have = new Set(cfg.redirects.map(r => r.source + '→' + r.destination));
  const missing = want.filter(r => !have.has(r.source + '→' + r.destination));
  if (missing.length) {
    if (process.env.VERCEL) throw new Error(`vercel.json lacks ${missing.length} product redirect(s); run node tools/build.mjs locally and commit vercel.json`);
    cfg.redirects = [...cfg.redirects.filter(r => !/^\/products\//.test(r.source)), ...want];
    await writeFile(src('vercel.json'), JSON.stringify(cfg, null, 2) + '\n');
    console.log(`  vercel.json: product redirects updated (${want.length}) — commit it`);
  }
}

/* ---------- scripts: one bundle set per language ---------- */
const ENTRIES = { home: 'js/pages/home.js', hero: 'js/hero.js', shop: 'js/pages/shop.js', product: 'js/pages/product.js', info: 'js/pages/info.js' };
/* the English bundle leaves the Burmese table out (and the other way round
   keeps English, which is the fallback for any line not yet translated) */
const without = table => ({
  name: 'drop-' + table,
  setup(b) {
    b.onResolve({ filter: new RegExp(`^\\./i18n/${table}\\.js$`) }, () => ({ path: table, namespace: 'empty' }));
    b.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: 'export default {}', loader: 'js' }));
  }
});
const JS = {};
for (const lang of [...LANGS, 'any']) {
  const r = await esbuild({
    absWorkingDir: ROOT, entryPoints: ENTRIES, bundle: true, splitting: true, format: 'esm',
    minify: true, target: ['es2020', 'safari15'], legalComments: 'none', metafile: true, write: true,
    outdir: join(OUT, 'assets', lang), entryNames: '[name]-[hash]', chunkNames: 'c-[hash]',
    plugins: lang === 'en' ? [without('my')] : []
  });
  /* entry → its file and every chunk it imports, for <link rel=modulepreload> */
  const outs = r.metafile.outputs;
  const web = f => '/' + f.replace(/\\/g, '/').replace(/^dist\//, '');
  const deps = (f, seen = new Set()) => {
    for (const i of outs[f].imports) if (i.kind === 'import-statement' && !seen.has(i.path)) { seen.add(i.path); deps(i.path, seen); }
    return seen;
  };
  JS[lang] = {};
  for (const [f, o] of Object.entries(outs)) {
    if (!o.entryPoint) continue;
    const name = Object.entries(ENTRIES).find(([, p]) => o.entryPoint.replace(/\\/g, '/').endsWith(p))[0];
    JS[lang][name] = { file: web(f), preload: [...deps(f)].map(web) };
  }
}

/* ---------- styles ---------- */
const css = async (files, name) => {
  const { code } = await transform((await Promise.all(files.map(read))).join('\n'), { loader: 'css', minify: true, target: ['safari15'] });
  const path = `/assets/${name}-${hash(code)}.css`;
  await put(path, code);
  return path;
};
const CSS = { site: await css(['css/base.css', 'css/site.css'], 'site'), film: await css(['css/apolo.css'], 'film') };
const BOOT = (await transform(await read('js/i18n-boot.js'), { loader: 'js', minify: true })).code.trim();

/* ---------- web fonts ----------
   Google's font stylesheet is put straight into each page instead of being
   linked: one less request that holds up the first paint, and the font files
   each language leads with are preloaded, so Padauk lands sooner (the
   fallbacks it replaces are width-matched in css/base.css). If Google can't
   be reached during the build, pages keep the plain <link>. */
const FONT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const FONTS = new Map();
const LEAD = { en: [['Poppins', 400, 'latin'], ['Poppins', 800, 'latin']],
               my: [['Padauk', 400, 'myanmar'], ['Padauk', 700, 'myanmar'], ['Poppins', 400, 'latin']] };
for (const tpl of ['index.html', 'shop.html']) {
  const href = (await read(tpl)).match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)">/)[1].replace(/&amp;/g, '&');
  if (FONTS.has(href)) continue;
  try {
    const r = await fetch(href, { headers: { 'user-agent': FONT_UA }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    const faces = [...text.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face\s*\{([^}]+)\}/g)].map(([, subset, body]) => ({
      subset, family: body.match(/font-family:\s*'([^']+)'/)[1], weight: +body.match(/font-weight:\s*(\d+)/)[1],
      url: body.match(/url\(([^)]+\.woff2)\)/)[1]
    }));
    FONTS.set(href, { css: (await transform(text, { loader: 'css', minify: true })).code.trim(), faces });
  } catch (e) {
    console.warn(`  ! web fonts not inlined (${e.message}); pages link Google's stylesheet instead`);
  }
}
function fontsFor(html, lang) {
  return html.replace(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)">/, (m, href) => {
    const f = FONTS.get(href.replace(/&amp;/g, '&'));
    if (!f) return m;
    const pre = LEAD[lang].map(([fam, wt, sub]) => f.faces.find(x => x.family === fam && x.weight === wt && x.subset === sub))
      .filter(Boolean).map(x => `<link rel="preload" as="font" type="font/woff2" href="${x.url}" crossorigin>`);
    return pre.join('\n') + `\n<style>${f.css}</style>`;
  }).replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, '');
}

/* ---------- static files ---------- */
await cp(src('img'), join(OUT, 'img'), { recursive: true });
await cp(src('img/favicon.ico'), join(OUT, 'favicon.ico'));

/* ==========================================================================
   HTML
   ========================================================================== */

/* Find one element by a regex for its start tag; return where its content
   starts and ends (matching nested tags of the same name). */
function el(html, startRe, from = 0) {
  const re = new RegExp(startRe.source, startRe.flags.includes('g') ? startRe.flags : startRe.flags + 'g');
  re.lastIndex = from;
  const m = re.exec(html);
  if (!m) return null;
  const tag = m[0].match(/^<([a-z0-9]+)/i)[1];
  const open = m.index, inner = m.index + m[0].length;
  const scan = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  scan.lastIndex = inner;
  let depth = 1, s;
  while ((s = scan.exec(html))) {
    if (s[1]) { if (--depth === 0) return { open, inner, close: s.index, end: scan.lastIndex, tagText: m[0] }; }
    else depth++;
  }
  throw new Error('unclosed <' + tag + '>');
}
const byId = id => new RegExp(`<[a-z0-9]+\\b[^>]*\\bid="${id}"[^>]*>`, 'i');
function inner(html, re, content, tagFn) {
  const e = el(html, re);
  if (!e) throw new Error('not found: ' + re);
  const tag = tagFn ? tagFn(e.tagText) : e.tagText;
  return html.slice(0, e.open) + tag + content + html.slice(e.close);
}
const attrEsc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function setAttr(tag, name, value) {
  const re = new RegExp(`\\s${name}(="[^"]*")?(?=[\\s>/])`);
  const a = value === false ? '' : value === true ? ` ${name}` : ` ${name}="${attrEsc(value)}"`;
  return re.test(tag) ? tag.replace(re, a) : tag.replace(/\s*\/?>$/, m => a + m);
}

/* the same work js/i18n.js applyStatic() does in the browser */
function translate(html) {
  html = html.replace(/<[a-z0-9]+\b[^>]*\bdata-i18n-attr="([^"]+)"[^>]*>/gi, (tag, spec) => {
    for (const pair of spec.split(';')) {
      const [a, k] = pair.split(':').map(x => x.trim());
      if (a && k) tag = setAttr(tag, a, t(k));
    }
    return tag;
  });
  const re = /<[a-z0-9]+\b[^>]*\bdata-i18n(-html)?="([^"]+)"[^>]*>/gi;
  for (let pos = 0; ;) {
    re.lastIndex = pos;
    const m = re.exec(html);
    if (!m) break;
    const e = el(html, /<[a-z0-9]+\b[^>]*>/i, m.index);
    const val = m[1] ? t(m[2]) : esc(t(m[2]));
    html = html.slice(0, e.inner) + val + html.slice(e.close);
    pos = e.inner + val.length;
  }
  return html;
}

const url = (lang, path) => SITE + path + (lang === 'my' ? (path.includes('?') ? '&' : '?') + 'lang=my' : '');
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const ORG = {
  '@type': 'Organization', '@id': SITE + '/#org', name: 'APOLO Stationery Myanmar', url: SITE + '/',
  logo: SITE + '/img/icon-512.png', telephone: '+95 9 777 271 999', email: CONTACT.email,
  address: { '@type': 'PostalAddress', streetAddress: 'No. 3-C, Ward (9), U Tun Nyo Street, Hlaing Thar Yar Industrial Zone (6)',
             addressLocality: 'Hlaing Thar Yar Township, Yangon', addressCountry: 'MM' },
  sameAs: [CONTACT.facebook, CONTACT.instagram]
};
const crumbsLD = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) });

/**
 * Finish a page: language and data on <html>, the head (title, description,
 * canonical, hreflang, share tags, structured data, icons), styles and
 * scripts swapped for the bundles, the boot script inlined.
 */
function finish(html, { lang, path, title, desc, image, type = 'website', jsonld = [], noindex = false, entries, film = false, built = true }) {
  const bundle = JS[built ? lang : 'any'];
  html = html.replace(/<html[^>]*>/, `<html lang="${lang}"${built ? ` data-lang="${lang}"` : ''} data-catalog="${DATA.catalog}" data-catalog-my="${DATA.catalogMy}">`);
  if (title) html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  else title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/)[1].replace(/&amp;/g, '&');
  html = html.replace(/<meta name="description"[^>]*>/, m => desc != null ? setAttr(m.replace(/\sdata-i18n-attr="[^"]*"/, ''), 'content', desc) : m.replace(/\sdata-i18n-attr="[^"]*"/, ''));
  if (desc == null) desc = (html.match(/<meta name="description"[^>]*content="([^"]*)"/) || [])[1] || '';
  else desc = esc(desc);
  html = html.replace(/<title[^>]*>/, '<title>');

  const img = image || `${SITE}/img/og-${lang}.jpg`;
  const head = [
    noindex ? '<meta name="robots" content="noindex">' : '',
    built ? `<link rel="canonical" href="${url(lang, path)}">` : '',
    built ? LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${url(l, path)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${url('en', path)}">` : '',
    `<meta property="og:site_name" content="APOLO Stationery Myanmar">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${attrEsc(title.replace(/&amp;/g, '&'))}">`,
    `<meta property="og:description" content="${desc}">`,
    built ? `<meta property="og:url" content="${url(lang, path)}">` : '',
    `<meta property="og:image" content="${attrEsc(img)}">`,
    `<meta property="og:locale" content="${LOCALE[lang]}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="32x32" href="/img/icon-32.png">`,
    `<link rel="apple-touch-icon" href="/img/icon-180.png"><link rel="manifest" href="/site.webmanifest">`,
    ...[...new Set(entries.flatMap(e => bundle[e].preload))].map(p => `<link rel="modulepreload" href="${p}">`),
    ...jsonld.map(ld)
  ].filter(Boolean).join('\n');

  html = html
    .replace('<script src="/js/i18n-boot.js"></script>', `<script>${BOOT}</script>`)
    .replace(/<link rel="icon" href="\/img\/apolo-logo\.png">\n?/, '')
    .replace(/<link rel="preload" as="fetch" href="\/data\/catalog\.json"/, `<link rel="preload" as="fetch" href="${DATA.catalog}"`)
    .replace(/<link rel="stylesheet" href="\/css\/base\.css">\n?<link rel="stylesheet" href="\/css\/site\.css">/,
      `<link rel="stylesheet" href="${CSS.site}">` + (film ? `\n<link rel="stylesheet" href="${CSS.film}">` : ''))
    .replace(/<link rel="stylesheet" href="\/css\/apolo\.css">\n?/, '')
    .replace(/<script type="module" src="\/js\/(?:pages\/)?(\w+)\.js"><\/script>/g, (m, name) => `<script type="module" src="${bundle[name].file}"></script>`)
    .replace('</head>', head + '\n</head>')
    .replace('</body>', '<script defer src="/_vercel/insights/script.js"></script>\n</body>');
  if (/\/(css|js)\/[\w/-]+\.(css|js)"/.test(html.replace(/https:\/\/[^"]+/g, ''))) throw new Error(`unbundled asset left in ${path}`);
  return fontsFor(html, lang);
}

const TPL = {
  home: await read('index.html'), shop: await read('shop.html'), product: await read('product.html'),
  contact: await read('contact.html'), terms: await read('terms.html'), lost: await read('404.html')
};
const withChrome = (html, c, opts) => {
  const ch = chromeHTML(c, opts);
  return html.replace('<header id="hdr"></header>', ch.header).replace('<footer id="ftr"></footer>', ch.footer);
};
const appendCrumbs = (html, items) => { const e = el(html, byId('crumbs')); return html.slice(0, e.close) + items + html.slice(e.close); };
const count = { pages: 0 };
const sitemap = [];
const addUrl = (path, prio) => sitemap.push({ path, prio });

for (const lang of LANGS) {
  i18n.useLang(lang);
  const c = store.index(JSON.parse(rawCatalog), lang === 'my' ? JSON.parse(rawMy) : {});
  const page = async (path, file, html) => { await put(`/${lang}/${file}.html`, html); count.pages++; };
  const first = lang === LANGS[0];

  /* ---- home ---- */
  {
    let h = translate(TPL.home);
    h = withChrome(h, c, { home: true, here: '/' });
    h = inner(h, byId('books'), hv.booksHTML(c));
    h = inner(h, byId('index'), hv.indexHTML(c));
    h = inner(h, byId('campRail'), hv.campHTML());
    const items = hv.listItems(c);
    h = inner(h, byId('listRows'), hv.listRowsHTML(items));
    h = inner(h, byId('listFoot'), hv.listFootHTML(items));
    h = h.replace(/<b data-count-products>\d*<\/b>/g, `<b data-count-products>${c.products.length}</b>`);
    for (let e, from = 0; (e = el(h, /<section\b[^>]*\bdata-shelf="[^"]+"[^>]*>/i, from));) {
      const tag = e.tagText, handle = tag.match(/data-shelf="([^"]+)"/)[1];
      const col = c.byCollection.get(handle);
      if (!col) { h = h.slice(0, e.open) + h.slice(e.end); from = e.open; continue; }
      const html = hv.shelfHTML(col, { kicker: (tag.match(/data-kicker="([^"]*)"/) || [])[1], titleKey: (tag.match(/data-title-key="([^"]*)"/) || [])[1] });
      const open = setAttr(tag, 'aria-labelledby', `rail-${col.handle}-t`);
      h = h.slice(0, e.open) + open + html + h.slice(e.close);
      from = e.open + open.length + html.length;
    }
    h = finish(h, { lang, path: '/', entries: ['hero', 'home'], film: true,
      jsonld: [{ '@context': 'https://schema.org', '@graph': [ORG, {
        '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'APOLO Stationery Myanmar', publisher: { '@id': SITE + '/#org' },
        inLanguage: lang, potentialAction: { '@type': 'SearchAction', target: SITE + '/search?q={q}', 'query-input': 'required name=q' } }] }] });
    await page('/', 'home', h);
    if (first) addUrl('/', '1.0');
  }

  /* ---- shop, categories, search ---- */
  const shopPage = (mode, { col = null, q = '' } = {}) => {
    const base = mode === 'collection' ? col.items : mode === 'search' ? [] : c.featured;
    const state = sv.freshState(q);
    const list = sv.listFor(base, state);
    let h = translate(TPL.shop);
    h = withChrome(h, c, { here: mode === 'collection' ? '/collections/' + col.handle : '' });
    h = inner(h, byId('shopHead'), sv.headHTML(mode, { c, col, q }));
    /* a search page's crumbs depend on the query: the browser adds them */
    if (mode !== 'search') h = appendCrumbs(h, sv.crumbsHTML(mode, col));
    h = inner(h, byId('tabs'), sv.tabsHTML(c, col, mode));
    h = inner(h, byId('sort'), sv.sortHTML(state, mode));
    if (mode === 'search') {
      h = inner(h, byId('grid'), '', tag => setAttr(tag, 'aria-busy', 'true'));
      return h;
    }
    h = inner(h, byId('filters'), sv.filtersHTML(base, state));
    h = inner(h, byId('grid'), sv.gridHTML(list, state, mode, base), tag => setAttr(tag, 'data-built', mode === 'collection' ? col.handle : mode));
    h = inner(h, byId('count'), esc(sv.countText(list.length)));
    if (list.length > state.shown) {
      h = h.replace(/<div class="more" id="more" hidden>/, '<div class="more" id="more">');
      h = inner(h, byId('moreBtn'), esc(sv.moreText(list.length - state.shown)));
    }
    return h;
  };
  {
    const h = finish(shopPage('all'), { lang, path: '/shop', entries: ['shop'],
      jsonld: [crumbsLD([[t('shop.crumb.home'), '/'], [t('shop.crumb.all'), '/shop']])] });
    await page('/shop', 'shop', h);
    if (first) addUrl('/shop', '0.9');
  }
  {
    const h = finish(shopPage('search'), { lang, path: '/search', title: t('shop.title.search'), entries: ['shop'], noindex: true });
    await page('/search', 'search', h);
  }
  for (const col of c.collections) {
    const path = '/collections/' + col.handle;
    const h = finish(shopPage('collection', { col }), { lang, path, entries: ['shop'],
      title: t('shop.title.collection', { title: store.colTitle(col) }),
      desc: t('shop.meta.collection', { blurb: store.colBlurb(col), n: col.items.length }),
      jsonld: [crumbsLD([[t('shop.crumb.home'), '/'], [t('shop.crumb.shop'), '/shop'], [store.colTitle(col), path]]),
        { '@context': 'https://schema.org', '@type': 'ItemList', name: store.colTitle(col), numberOfItems: col.items.length,
          itemListElement: col.items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + p.url })) }] });
    await page(path, path.slice(1), h);
    if (first) addUrl(path, '0.8');
  }

  /* ---- products ---- */
  for (const p of c.products) {
    const v = pv.firstVariant(p);
    const col = p.collections[0];
    let h = translate(TPL.product);
    h = withChrome(h, c, {});
    h = appendCrumbs(h, pv.crumbsHTML(p));
    h = inner(h, byId('product'), pv.productHTML(p, v), tag => setAttr(setAttr(tag, 'aria-busy', false), 'data-built', p.handle));
    const rel = pv.relatedHTML(c, p);
    if (rel) h = inner(h, byId('related'), rel, tag => setAttr(tag, 'hidden', false));

    const plain = pv.plainText(p.body);
    const desc = pv.metaDescription(p);
    const images = p.images.slice(0, 6).map(im => store.img(im.src, 1200));
    const prices = p.variants.map(x => x.price);
    const inStock = p.variants.some(x => x.available) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const offer = p.variants.length === 1 || Math.min(...prices) === Math.max(...prices)
      ? { '@type': 'Offer', price: String(prices[0]), priceCurrency: 'MMK', availability: inStock, url: SITE + p.url,
          itemCondition: 'https://schema.org/NewCondition', seller: { '@id': SITE + '/#org' },
          hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'MM',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 14 } }
      : { '@type': 'AggregateOffer', lowPrice: String(Math.min(...prices)), highPrice: String(Math.max(...prices)),
          offerCount: p.variants.length, priceCurrency: 'MMK', availability: inStock };
    h = finish(h, { lang, path: p.url, entries: ['product'], type: 'product', desc, image: images[0],
      title: t('product.title', { name: p.name }),
      jsonld: [
        { '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: images, description: plain.slice(0, 500) || p.name,
          brand: { '@type': 'Brand', name: /^apolo/i.test(p.vendor) ? 'APOLO' : p.vendor }, category: col ? store.colTitle(col) : undefined,
          url: SITE + p.url, offers: offer },
        crumbsLD([[t('product.crumbs.home'), '/'], [t('product.crumbs.shop'), '/shop'],
          ...(col ? [[store.colTitle(col), '/collections/' + col.handle]] : []), [store.shortTitle(p), p.url]])
      ] })
      .replace('</head>', `<meta property="product:price:amount" content="${p.min}"><meta property="product:price:currency" content="MMK">\n</head>`);
    await page(p.url, p.url.slice(1), h);
    if (first) addUrl(p.url, '0.7');
  }

  /* ---- contact, delivery & returns ---- */
  for (const [tpl, path] of [['contact', '/pages/contact'], ['terms', '/pages/terms-conditions']]) {
    const h = finish(withChrome(translate(TPL[tpl]), c, {}), { lang, path, entries: ['info'] });
    await page(path, path.slice(1), h);
    if (first) addUrl(path, '0.5');
  }
}

/* ---- not found: one page for both languages, translated in the browser ---- */
i18n.useLang('en');
await put('/404.html', finish(TPL.lost, { lang: 'en', path: '/404', entries: ['info'], noindex: true, built: false }));

/* ---------- sitemap, robots, manifest ---------- */
await put('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap.map(({ path, prio }) => LANGS.map(l => `<url><loc>${esc(url(l, path))}</loc><lastmod>${synced}</lastmod><priority>${prio}</priority>${
  LANGS.map(a => `<xhtml:link rel="alternate" hreflang="${a}" href="${esc(url(a, path))}"/>`).join('')
}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(url('en', path))}"/></url>`).join('\n')).join('\n')}
</urlset>
`);
await put('/robots.txt', `User-agent: *\nAllow: /\nDisallow: /search\n\nSitemap: ${SITE}/sitemap.xml\n`);
await put('/site.webmanifest', JSON.stringify({
  name: 'APOLO Stationery Myanmar', short_name: 'APOLO', start_url: '/', display: 'browser',
  background_color: '#EDE6D9', theme_color: '#EC008C',
  icons: [{ src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' }]
}, null, 2));

console.log(`✓ ${count.pages} pages (${LANGS.join(' + ')}), ${sitemap.length * LANGS.length} sitemap URLs → dist/ in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
