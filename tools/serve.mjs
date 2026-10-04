/* ==========================================================================
   Local preview server — mirrors the rewrites in vercel.json so /shop,
   /collections/:handle and /products/:handle work exactly as they do live.
   ES modules and absolute paths mean the site cannot be opened from file://.

     node tools/serve.mjs            → http://localhost:8123
     node tools/serve.mjs 8080
   ========================================================================== */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = +(process.argv[2] || process.env.PORT || 8123);
const config = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.md': 'text/plain; charset=utf-8'
};

/* "/collections/:handle" → /^\/collections\/[^/]+$/ */
const toRe = src => new RegExp('^' + src.replace(/:[a-z]+/gi, '[^/]+') + '$');
const rewrites  = (config.rewrites  || []).map(r => [toRe(r.source), r.destination]);
const redirects = (config.redirects || []).map(r => [toRe(r.source), r.destination]);

async function file(p) {
  try { const s = await stat(p); return s.isFile() ? p : null; } catch { return null; }
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';

  for (const [re, to] of redirects) if (re.test(path)) {
    res.writeHead(302, { location: to }); return res.end();
  }
  for (const [re, to] of rewrites) if (re.test(path)) { path = to; break; }
  if (path === '/') path = '/index.html';

  const safe = normalize(join(ROOT, path));
  if (!safe.startsWith(normalize(ROOT))) { res.writeHead(403); return res.end(); }

  /* cleanUrls: /contact → contact.html */
  const hit = await file(safe) || await file(safe + '.html');
  if (!hit) {
    const body = await readFile(join(ROOT, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(body);
  }
  res.writeHead(200, { 'content-type': TYPES[extname(hit)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(await readFile(hit));
}).listen(PORT, () => console.log(`APOLO preview → http://localhost:${PORT}`));
