/* The other language (assets/css/lang-offer.css): when the reader's browser
 * prefers Spanish on the English site or the reverse, and the page has a
 * translation, a small dismissable note links to it. No redirect, no request:
 * the translation's address is the page's own hreflang link. Closed once, it
 * stays closed in that browser.
 */
(function () {
    var KEY = 'cn-lang-offer-closed';
    var TEXT = {
        es: {go: 'leer esta página en español', close: 'cerrar'},
        en: {go: 'read this page in English', close: 'close'}
    };
    var site = (document.documentElement.lang || '').slice(0, 2);
    var wanted = (navigator.languages || [navigator.language || '']).map(function (lang) {
        return lang.slice(0, 2).toLowerCase();
    }).filter(function (lang) {
        return TEXT[lang];
    })[0];
    var link = wanted && wanted !== site && document.querySelector('link[rel="alternate"][hreflang="' + wanted + '"]');

    try {
        if (!link || localStorage.getItem(KEY)) return;
    } catch (e) {
        return;
    }
    // Just came from the translation: the reader chose this language.
    if (document.referrer && new URL(document.referrer).host === new URL(link.href).host) return;

    var note = document.createElement('div');
    note.className = 'cn-lang-offer';
    note.lang = wanted;
    var go = document.createElement('a');
    go.href = link.href;
    go.hreflang = wanted;
    go.textContent = TEXT[wanted].go + ' →';
    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', TEXT[wanted].close);
    close.textContent = '×';
    close.addEventListener('click', function () {
        try {
            localStorage.setItem(KEY, '1');
        } catch (e) {}
        note.remove();
    });
    note.append(go, close);
    document.body.append(note);
})();
