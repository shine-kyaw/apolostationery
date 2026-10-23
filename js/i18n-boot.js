/* Runs in <head>, before anything paints.
   On the live site every page is built in both languages and the server
   sends the copy the apolo_lang cookie (or ?lang=) asks for; the page says
   which it is in <html data-lang>. This keeps the visitor's choice, the
   cookie and that copy in step: a first visit from a Burmese browser, or a
   choice saved before the cookie existed, fetches the right copy once.
   Without a build (local preview of the source files) it works out the
   language and, for Burmese, keeps the English HTML hidden for the moment
   before js/i18n.js swaps the text. */
(function () {
  try {
    var de = document.documentElement, ok = { my: 1, en: 1 };
    var q = new URLSearchParams(location.search).get('lang');
    var saved = null;
    try { saved = localStorage.getItem('apolo.lang'); } catch (e) {}
    /* the cookie is a saved choice too (storage can be cleared on its own) */
    if (!ok[saved]) { var m = document.cookie.match(/(?:^|; )apolo_lang=(my|en)/); saved = m && m[1]; }
    var pref = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    var l = ok[q] ? q : ok[saved] ? saved : (/^(my|mya|bur)\b/i.test(pref) ? 'my' : 'en');
    var built = de.getAttribute('data-lang');
    var cookie = function (v) {
      document.cookie = 'apolo_lang=' + v + '; path=/; max-age=31536000; samesite=lax';
      return document.cookie.indexOf('apolo_lang=' + v) > -1;
    };

    if (built) {
      if (ok[q]) {
        /* a shared ?lang= link: remember it, then tidy the address */
        var kept = false;
        try { localStorage.setItem('apolo.lang', q); kept = true; } catch (e) {}
        if (cookie(q) && kept) {
          var u = new URL(location.href); u.searchParams.delete('lang');
          history.replaceState(null, '', u.pathname + u.search + u.hash);
        }
        return;
      }
      if (l !== built) {
        /* the other language's copy is wanted: ask for it once per page */
        var mark = 'apolo.langfix', here = location.pathname;
        if (sessionStorage.getItem(mark) === here) return;
        sessionStorage.setItem(mark, here);
        de.classList.add('i18n-wait');
        if (cookie(l)) location.replace(location.href);
        else { var v = new URL(location.href); v.searchParams.set('lang', l); location.replace(v.href); }
      }
      return;
    }

    de.lang = l;
    if (l === 'my') {
      de.classList.add('i18n-wait');
      setTimeout(function () { de.classList.remove('i18n-wait'); }, 2500);
    }
  } catch (e) {}
})();
