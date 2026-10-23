/* ==========================================================================
   Local preview server.

     node tools/build.mjs && node tools/serve.mjs   → the built site (dist/),
         routed the way vercel.json routes it on Vercel: redirects, then
         files, then the language rewrites (?lang= and the apolo_lang cookie)
     node tools/serve.mjs --src                     → the source files, unbuilt;
         every page draws itself in the browser (quick to edit and reload)

     node tools/serve.mjs 8080                      → another port
   ES modules and absolute paths mean the site cannot be opened from file://.
   ========================================================================== */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const SRC = process.argv.includes('--src');
const ROOT = SRC ? REPO : join(REPO, 'dist');
const PORT = +(process.argv.find(a => /^\d+$/.test(a)) || process.env.PORT || 8123);
const config = JSON.parse(await readFile(join(REPO, 'vercel.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.md': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json'
};

/* the subset of Vercel's path syntax vercel.json uses:
   :name  :name*  :name(regex)  and plain (regex) groups */
function compile(source) {
  let i = 0;
  const re = source.replace(/:(\w+)(\((?:[^()]|\([^()]*\))*\))?(\*)?|\((?:[^()]|\([^()]*\))*\)|[.]/g, (m, name, group, star) => {
    if (m === '.') return '\\.';
    if (!name) return m;
    return `(?<${name}>${group ? group.slice(1, -1) : star ? '.*' : '[^/]+'})`;
  });
  return new RegExp('^' + re + '$');
}
const fill = (dest, groups) => dest.replace(/:(\w+)\*?/g, (m, k) => groups?.[k] ?? '');
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map(c => c.split('=').map(decodeURIComponent)));
const hasAll = (has = [], req, url) => has.every(h =>
  h.type === 'query' ? url.searchParams.get(h.key) === h.value :
  h.type === 'cookie' ? cookies(req)[h.key] === h.value : false);

const LEGACY = [ /* --src: the rewrites the unbuilt pages need */
  ['/search', '/shop'], ['/collections/:h', '/shop'], ['/products/:h', '/product'],
  ['/pages/contact', '/contact'], ['/pages/terms-conditions', '/terms']
].map(([s, destination]) => ({ re: compile(s), destination }));
const rewrites = SRC ? LEGACY : (config.rewrites || []).map(r => ({ ...r, re: compile(r.source) }));
const redirects = (config.redirects || []).filter(r => !SRC || !/^\/(en|my)\//.test(r.source)).map(r => ({ ...r, re: compile(r.source) }));

async function file(p) {
  try { const s = await stat(p); return s.isFile() ? p : null; } catch { return null; }
}
async function find(path) {
  const safe = normalize(join(ROOT, path === '/' ? '/index.html' : path));
  if (!safe.startsWith(normalize(ROOT))) return null;
  return await file(safe) || await file(safe + '.html');   // cleanUrls
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = decodeURIComponent(url.pathname).replace(/(.)\/+$/, '$1');

  for (const r of redirects) {
    const m = path.match(r.re);
    if (!m) continue;
    const to = new URL(fill(r.destination, m.groups), 'http://x');
    for (const [k, v] of url.searchParams) if (!to.searchParams.has(k)) to.searchParams.set(k, v);
    res.writeHead(r.permanent ? 308 : 307, { location: to.pathname + to.search }); return res.end();
  }

  let hit = await find(path);
  if (!hit) for (const r of rewrites) {
    const m = path.match(r.re);
    if (!m || !hasAll(r.has, req, url)) continue;
    hit = await find(fill(r.destination, m.groups));
    break;
  }
  if (!hit) {
    const body = await readFile(join(ROOT, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(body);
  }
  res.writeHead(200, { 'content-type': TYPES[extname(hit)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(await readFile(hit));
}).listen(PORT, () => console.log(`APOLO preview (${SRC ? 'source files' : 'built site'}) → http://localhost:${PORT}`));
