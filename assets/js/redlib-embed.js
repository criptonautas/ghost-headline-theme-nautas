/* Reddit/Redlib oEmbeds, bookmarks and bare URLs share one local card
 * (partials/redlib-card.hbs). Descriptive inline links stay ordinary links.
 * nginx normally rewrites Reddit to our instance; redlibURL also guarantees
 * that every card links to Redlib, never to Reddit or a third-party widget. */
(function () {
    var HOST = 'rd.criptonautas.co';
    var template = document.getElementById('cn-redlib-card');
    if (!template) {
        return;
    }

    var redlibURL = function (value) {
        try {
            var url = new URL(value);
            if (url.hostname !== HOST && !/(^|\.)reddit\.com$/i.test(url.hostname)) {
                return null;
            }
            url.protocol = 'https:';
            url.hostname = HOST;
            url.port = '';
            return url;
        } catch (error) {
            return null;
        }
    };

    var sameURL = function (a, b) {
        return a.href.replace(/\/$/, '') === b.href.replace(/\/$/, '');
    };

    var path = function (url) {
        try {
            return decodeURIComponent(url.pathname);
        } catch (error) {
            return url.pathname;
        }
    };

    var render = function (url, title) {
        var route = path(url);
        var who = route.match(/^\/(r|u|user)\/([^/]+)/);
        var slug = route.match(/^\/r\/[^/]+\/comments\/[^/]+\/([^/]+)/);
        var mark = who ? (who[1] === 'r' ? 'r/' : 'u/') : '';
        var card = template.content.firstElementChild.cloneNode(true);

        card.querySelector('a').href = url.href;
        card.querySelector('.cn-redlib-card-mark').textContent = mark || 'r/';
        card.querySelector('.cn-redlib-card-subreddit').textContent = who ? who[2] : '';
        card.querySelector('.cn-redlib-card-source').textContent = HOST;
        card.querySelector('.cn-redlib-card-title').textContent = title || (slug ? slug[1].replace(/_/g, ' ') : who ? mark + who[2] : url.href);
        return card;
    };

    // Redlib returns Reddit's oEmbed fallback. Replace the whole card so its
    // widget script cannot survive, including when wrapped in an HTML card.
    document.querySelectorAll('.gh-content .kg-embed-card').forEach(function (embed) {
        var quote = embed.querySelector('blockquote.reddit-embed-bq');
        var link = quote && Array.prototype.find.call(quote.querySelectorAll('a[href]'), function (candidate) {
            return redlibURL(candidate.href);
        });
        var url = link && redlibURL(link.href);
        if (url) {
            (embed.closest('.kg-html-card') || embed).replaceWith(render(url, link.textContent.trim()));
        }
    });

    document.querySelectorAll('.gh-content .kg-bookmark-card').forEach(function (bookmark) {
        var link = bookmark.querySelector('a.kg-bookmark-container[href]');
        var url = link && redlibURL(link.href);
        if (url) {
            var title = bookmark.querySelector('.kg-bookmark-title');
            (bookmark.closest('.kg-card') || bookmark).replaceWith(render(url, title && title.textContent.trim()));
        }
    });

    // Only a bare URL alone in its paragraph becomes a card. Compare both
    // sides after canonicalising to Redlib: nginx may rewrite only one of them.
    document.querySelectorAll('.gh-content p > a[href]').forEach(function (link) {
        var text = link.textContent.trim();
        var paragraph = link.parentElement;
        var url = redlibURL(link.href);
        var textURL = redlibURL(text);
        if (!url || !textURL || !sameURL(url, textURL) || paragraph.textContent.trim() !== text) {
            return;
        }
        paragraph.replaceWith(render(url, ''));
    });
})();
