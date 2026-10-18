/* Runs in <head>, before anything paints. Works out the language the same way
   js/i18n.js does and sets <html lang> so Burmese pages open in Burmese
   typography, and — for Burmese only, since the static HTML is English —
   keeps the page invisible for the fraction of a second before the text is
   swapped, so nobody sees English flash. A timer releases it regardless. */
(function () {
  try {
    var q = new URLSearchParams(location.search).get('lang');
    var saved = null;
    try { saved = localStorage.getItem('apolo.lang'); } catch (e) {}
    var pref = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    var l = (q === 'my' || q === 'en') ? q : (saved === 'my' || saved === 'en') ? saved : (/^(my|mya|bur)\b/i.test(pref) ? 'my' : 'en');
    var de = document.documentElement;
    de.lang = l;
    if (l === 'my') {
      de.classList.add('i18n-wait');
      setTimeout(function () { de.classList.remove('i18n-wait'); }, 2500);
    }
  } catch (e) {}
})();
