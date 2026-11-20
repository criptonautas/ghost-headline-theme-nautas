/* Redlib links (partials/redlib-card.hbs). nginx rewrites reddit.com to our
 * instance, so Reddit links arrive here as Redlib ones. Only a bare Redlib URL
 * alone in its paragraph becomes a card; Reddit/Redlib embeds and bookmarks
 * become a plain link, never a card or Reddit's widget. */
(function () {
    var HOST = 'rd.criptonautas.co';
    var template = document.getElementById('cn-redlib-card');
    var supported = function (link) {
        return link.hostname === HOST || /(^|\.)reddit\.com$/i.test(link.hostname);
    };

    var plain = function (card, href, title) {
        var p = document.createElement('p');
        var a = document.createElement('a');
        a.href = href;
        a.textContent = title || href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        p.appendChild(a);
        card.replaceWith(p);
    };

    document.querySelectorAll('.gh-content .kg-embed-card').forEach(function (embed) {
        var quote = embed.querySelector('blockquote.reddit-embed-bq');
        var link = quote && Array.prototype.find.call(quote.querySelectorAll('a[href]'), supported);
        if (link) {
            plain(embed.closest('.kg-html-card') || embed, link.href, link.textContent.trim());
        }
    });

    document.querySelectorAll('.gh-content .kg-bookmark-card').forEach(function (bookmark) {
        var link = bookmark.querySelector('a.kg-bookmark-container[href]');
        if (link && supported(link)) {
            var title = bookmark.querySelector('.kg-bookmark-title');
            plain(bookmark.closest('.kg-card') || bookmark, link.href, title && title.textContent.trim());
        }
    });

    if (!template) {
        return;
    }

    document.querySelectorAll('.gh-content p > a[href]').forEach(function (link) {
        var text = link.textContent.trim();
        var paragraph = link.parentElement;
        if (link.hostname !== HOST || paragraph.textContent.trim() !== text) {
            return;
        }
        try {
            if (new URL(text).href.replace(/\/$/, '') !== link.href.replace(/\/$/, '')) {
                return;
            }
        } catch (error) {
            return;
        }

        // /r/sub/comments/id/some_title, /user/name, /u/name.
        var path = decodeURIComponent(link.pathname);
        var who = path.match(/^\/(r|u|user)\/([^/]+)/);
        var slug = path.match(/^\/r\/[^/]+\/comments\/[^/]+\/([^/]+)/);
        var mark = who ? (who[1] === 'r' ? 'r/' : 'u/') : '';
        var card = template.content.firstElementChild.cloneNode(true);
        var anchor = card.querySelector('a');

        anchor.href = link.href;
        card.querySelector('.cn-redlib-card-mark').textContent = mark || 'r/';
        card.querySelector('.cn-redlib-card-subreddit').textContent = who ? who[2] : '';
        card.querySelector('.cn-redlib-card-source').textContent = link.hostname;
        card.querySelector('.cn-redlib-card-title').textContent = slug ? slug[1].replace(/_/g, ' ') : who ? mark + who[2] : link.href;
        paragraph.replaceWith(card);
    });
})();
