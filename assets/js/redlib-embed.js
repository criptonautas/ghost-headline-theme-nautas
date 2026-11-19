/* Reddit and Redlib links use one local card: oEmbed fallbacks, Ghost bookmark
 * oneboxes and ordinary article links. No third-party widget is required. */
(function () {
    var spanish = /^es\b/i.test(document.documentElement.lang || '');
    var isReddit = function (link) {
        return /(^|\.)reddit\.com$/i.test(link.hostname);
    };
    var isRedlib = function (link) {
        return /(^|\.)(redlib|rd)\./i.test(link.hostname);
    };
    var supported = function (link) {
        return isReddit(link) || isRedlib(link);
    };
    var isBareUrl = function (link) {
        try {
            var text = new URL(link.textContent.trim());
            return text.href.replace(/\/$/, '') === link.href.replace(/\/$/, '');
        } catch (error) {
            return false;
        }
    };

    var element = function (tag, className, text) {
        var node = document.createElement(tag);
        node.className = className;
        if (text) {
            node.textContent = text;
        }
        return node;
    };

    var arrow = function () {
        var container = element('span', 'cn-redlib-card-arrow');
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 256 256');
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        [
            'M184,80V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H176A8,8,0,0,1,184,80Z',
            'M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z'
        ].forEach(function (data, index) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', data);
            if (index === 0) {
                path.setAttribute('opacity', '0.2');
            }
            svg.appendChild(path);
        });
        container.appendChild(svg);
        return container;
    };

    var render = function (postLink, title) {
        var service = isReddit(postLink) ? 'Reddit' : 'Redlib';
        var match = postLink.pathname.match(/^\/r\/([^/]+)/);
        var subreddit = match ? match[1] : '';
        var link = element('a', 'cn-redlib-card-link');
        link.href = postLink.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        var meta = element('span', 'cn-redlib-card-meta');
        var community = element('span', 'cn-redlib-card-community');
        community.appendChild(element('span', 'cn-redlib-card-mark', 'r/'));
        if (subreddit) {
            community.appendChild(element('span', 'cn-redlib-card-subreddit', subreddit));
        }
        meta.appendChild(community);
        meta.appendChild(element('span', 'cn-redlib-card-source', postLink.hostname));
        link.appendChild(meta);
        link.appendChild(element('span', 'cn-redlib-card-title', title || postLink.href));

        var footer = element('span', 'cn-redlib-card-footer');
        footer.appendChild(element('span', 'cn-redlib-card-action', (spanish ? 'Ver en ' : 'View on ') + service));
        footer.appendChild(arrow());
        link.appendChild(footer);
        return link;
    };

    // Reddit's oEmbed fallback is also what Ghost returns for Redlib /embed URLs.
    document.querySelectorAll('.kg-embed-card blockquote.reddit-embed-bq').forEach(function (quote) {
        var postLink = Array.prototype.find.call(quote.querySelectorAll('a[href]'), supported);
        if (!postLink) {
            return;
        }
        var card = quote.closest('.kg-embed-card');
        var aside = element('aside', 'cn-redlib-card');
        aside.appendChild(render(postLink, postLink.textContent.trim()));
        quote.replaceWith(aside);
        if (card) {
            card.classList.add('cn-redlib-embed');
            card.querySelectorAll('script').forEach(function (script) {
                script.remove();
            });
        }
    });

    // Classic Ghost onebox: replace the whole bookmark, not only its anchor.
    document.querySelectorAll('.gh-content .kg-bookmark-card').forEach(function (bookmark) {
        var postLink = bookmark.querySelector('a.kg-bookmark-container[href]');
        if (!postLink || !supported(postLink)) {
            return;
        }
        var title = bookmark.querySelector('.kg-bookmark-title');
        var aside = element('aside', 'cn-redlib-card');
        aside.appendChild(render(postLink, title ? title.textContent.trim() : postLink.href));
        (bookmark.closest('.kg-card') || bookmark).replaceWith(aside);
    });

    // Only bare URLs become cards; descriptive inline links remain ordinary links.
    document.querySelectorAll('.gh-content a[href]').forEach(function (postLink) {
        if (!supported(postLink) || !isBareUrl(postLink) || postLink.closest('.cn-redlib-card, .kg-embed-card, .kg-bookmark-card')) {
            return;
        }
        var title = postLink.textContent.trim();
        var card = render(postLink, title && title !== '/' ? title : postLink.href);
        postLink.replaceWith(card);
    });
})();
