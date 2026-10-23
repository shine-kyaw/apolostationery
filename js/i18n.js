/* ==========================================================================
   APOLO — language (English / Burmese)
   --------------------------------------------------------------------------
   One table per language (js/i18n/en.js, js/i18n/my.js), one function to read
   it, one switch. A visitor's choice is remembered in localStorage; with no
   choice yet, a browser set to Burmese gets Burmese. `?lang=my` / `?lang=en`
   on any URL forces a language (and remembers it) — handy for sharing a link.

   Switching reloads the page. The live site is built ahead of time in both
   languages (tools/build.mjs): the server picks the Burmese or English copy
   of a page from the apolo_lang cookie or ?lang=, and the page says which one
   it is (<html data-lang>). Scroll position, the cart and filters in the URL
   all survive the reload.

     t('key')                 text, falls back to English, then to the key
     t('key', { n: 3 })       "{n} products" → "3 products"
     tr('opt.color', 'Color') text if translated, else the fallback you give
     data-i18n="key"          on an element in static HTML: sets its text
     data-i18n-html="key"     same, for text with links/markup in it
     data-i18n-attr="aria-label:key; content:key2"   sets attributes

   See docs/TRANSLATING.md for how to edit the tables.
   ========================================================================== */

import EN from './i18n/en.js';
import MY from './i18n/my.js';

export const LANGS = { en: 'English', my: 'မြန်မာ' };
const STORE = 'apolo.lang';
const COOKIE = 'apolo_lang';
const BROWSER = typeof document !== 'undefined';

function read(k) { try { return localStorage.getItem(k); } catch { return null; } }
function write(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
/* the server reads the cookie to choose which built copy of a page to send */
function cookie(v) {
  try { document.cookie = `${COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`; } catch { return false; }
  return document.cookie.includes(`${COOKIE}=${v}`);
}

/* The language the page is in. A built page states it; otherwise the same
   rules as js/i18n-boot.js, which runs in <head> so the first paint is right. */
function detect() {
  if (!BROWSER) return 'en';
  const built = document.documentElement.dataset.lang;
  if (built in LANGS) return built;
  const asked = new URLSearchParams(location.search).get('lang');
  if (asked in LANGS) { if (write(STORE, asked)) stripParam(); return asked; }
  const saved = read(STORE);
  if (saved in LANGS) return saved;
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  return /^(my|mya|bur)\b/i.test(prefs[0] || '') ? 'my' : 'en';
}
function stripParam() {
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  history.replaceState(null, '', u.pathname + u.search + u.hash);
}

export let lang = detect();
export let isMy = lang === 'my';
if (BROWSER) document.documentElement.lang = lang;

let table = isMy ? MY : EN;

/** The build renders both languages in one process. Exports are live
    bindings, so every module reading `lang`/`isMy` follows this. */
export function useLang(next) {
  lang = next in LANGS ? next : 'en';
  isMy = lang === 'my';
  table = isMy ? MY : EN;
}
const warned = new Set();

export function t(key, vars) {
  let s = table[key];
  if (s == null) {
    s = EN[key];
    if (s == null) {
      if (!warned.has(key)) { warned.add(key); console.warn('[i18n] missing key', key); }
      return key;
    }
  }
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

/** Translated text if this language has it, otherwise `fallback` (used for
    catalogue words like option names that are English in the data). */
export function tr(key, fallback) { return table[key] ?? fallback; }

/** Is there a translation for this key in the current language? */
export const has = key => table[key] != null;

/** Change language and reload. If the browser won't store the choice, carry
    it in the URL instead so the switch still works. */
export function setLang(next) {
  if (!(next in LANGS) || next === lang) return;
  const u = new URL(location.href);
  const stored = write(STORE, next), sent = cookie(next);
  if (stored && sent) u.searchParams.delete('lang');
  else u.searchParams.set('lang', next);
  /* the same address (only the cookie changed) needs a reload; assigning it
     would start one load and then a second, throwing the first away */
  if (u.href === location.href) location.reload();
  else location.href = u.pathname + u.search + u.hash;
}

/** Translate everything marked up in static HTML. */
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-attr]'))
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map(x => x.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  document.documentElement.classList.remove('i18n-wait');
}

if (BROWSER) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => applyStatic());
  else applyStatic();
}
