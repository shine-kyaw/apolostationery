/* ==========================================================================
   APOLO — product names and web addresses
   Pure functions over the catalogue data, shared by the browser
   (js/store/catalog.js) and the build (tools/build.mjs), so a name or a URL is
   worked out one way only.
   ========================================================================== */

/* Model codes and units that are written in capitals on purpose */
const KEEP_CAPS = new Set(['APOLO', 'GSM', 'OHP', 'PCS', 'PVC', 'CD', 'KIDS', 'MM', 'CM']);

const squash = s => String(s).toLowerCase().replace(/[^a-z0-9.]+/g, '');

/** The name a shopper reads. The store's title, minus the bracketed list of
    choices the colour/size picker already shows ("(Blue/Black/Red)",
    "(18mm) (9mm)"), and with shouted words ("APOLO PENCIL SHARPENER") set in
    title case. The full title is still what search matches. */
export function displayName(p) {
  let t = p.title;
  const values = new Set(p.options.flatMap(o => o.values.map(squash)));
  if (values.size) {
    /* one bracket holding a slash list of the choices */
    t = t.replace(/\s*\(([^()]+\/[^()]+)\)/g, (m, inner) => {
      const parts = inner.split('/').map(squash).filter(Boolean);
      return parts.length > 1 && parts.every(x => values.has(x) || values.has(x.replace(/s$/, ''))) ? '' : m;
    });
    /* or a run of brackets that are each one of the choices: "(2 Layers) (3 Layers)" */
    t = t.replace(/(?:\s*\([^()]+\)){2,}/g, run => {
      const parts = [...run.matchAll(/\(([^()]+)\)/g)].map(m => squash(m[1]));
      return parts.every(x => values.has(x)) ? '' : run;
    });
  }
  if (!/[a-z]/.test(t.replace(/APOLO/g, ''))) {
    t = t.replace(/\b([A-Z])([A-Z]+)\b/g, (w, a, b) => KEEP_CAPS.has(w) ? w : a + b.toLowerCase());
  }
  return t.replace(/\s+/g, ' ').trim();
}

const slugify = s => s.toLowerCase()
  .replace(/["'’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80).replace(/-+$/, '');

/** Each product's address on this site. Shopify's handle, except the ones
    Shopify named "copy-of-…" when a listing was duplicated: those get an
    address from their own name. Deterministic for a given catalogue, so the
    build, the browser and the redirect list always agree.
    Returns Map(handle → slug). */
export function slugs(products) {
  const taken = new Set(products.filter(p => !/^copy-of-/.test(p.handle)).map(p => p.handle));
  const out = new Map();
  for (const p of products) {
    if (!/^copy-of-/.test(p.handle)) { out.set(p.handle, p.handle); continue; }
    const base = slugify(displayName(p)) || p.handle.replace(/^copy-of-/, '');
    let s = base;
    for (let n = 2; taken.has(s); n++) s = `${base}-${n}`;
    taken.add(s);
    out.set(p.handle, s);
  }
  return out;
}
