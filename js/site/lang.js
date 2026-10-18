/* ==========================================================================
   APOLO — the language switch
   One pill that shows the language you would switch TO ("မြန်မာ" while the
   page is English, "English" while it is Burmese): that is how most sites in
   Myanmar do it, and it never needs explaining. Each label is set in its own
   language whatever the page language is.

     langSwitch()  → button markup, drop it in a header or menu
     wireLang()    → one click listener for every switch on the page
   ========================================================================== */

import { lang, setLang, t } from '../i18n.js';

const GLOBE = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/>' +
  '<path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/></svg>';

export function langSwitch(extra = '') {
  const to = lang === 'my' ? 'en' : 'my';
  return `<button type="button" class="lang${extra ? ' ' + extra : ''}" data-lang="${to}" lang="${to}"
    aria-label="${to === 'my' ? t('lang.to_my') : t('lang.to_en')}">${GLOBE}<span>${to === 'my' ? 'မြန်မာ' : 'English'}</span></button>`;
}

let wired = false;
export function wireLang() {
  if (wired) return; wired = true;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (b) setLang(b.dataset.lang);
  });
}
