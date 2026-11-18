/* Redlib returns Reddit's oEmbed markup, but Reddit's widget cannot enhance a
 * Redlib URL. Rebuild that fallback as a local link card: no remote content,
 * no empty author line and no dependency on embed.reddit.com. */
(function () {
    var spanish = /^es\b/i.test(document.documentElement.lang || '');
    var labels = {
        action: spanish ? 'Ver en Redlib' : 'View on Redlib'
    };

    var element = function (tag, className, text) {
        var node = document.createElement(tag);
        node.className = className;
        if (text) {
            node.textContent = text;
        }
        return node;
    };

    document.querySelectorAll('.kg-embed-card blockquote.reddit-embed-bq').forEach(function (quote) {
        var postLink = quote.querySelector('a[href]');
        if (!postLink || !/(^|\.)redlib\./i.test(postLink.hostname)) {
            return;
        }

        var card = quote.closest('.kg-embed-card');
        var subredditLink = Array.prototype.find.call(quote.querySelectorAll('a[href]'), function (link) {
            return /\/r\/[^/]+\/?$/.test(link.pathname);
        });
        var subreddit = subredditLink ? subredditLink.textContent.trim().replace(/^r\//, '') : '';
        if (!subreddit) {
            var match = postLink.pathname.match(/^\/r\/([^/]+)/);
            subreddit = match ? match[1] : '';
        }

        var aside = element('aside', 'cn-redlib-card');
        var link = element('a', 'cn-redlib-card-link');
        link.href = postLink.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        var meta = element('div', 'cn-redlib-card-meta');
        var community = element('div', 'cn-redlib-card-community');
        community.appendChild(element('span', 'cn-redlib-card-mark', 'r/'));
        if (subreddit) {
            community.appendChild(element('span', 'cn-redlib-card-subreddit', 'r/' + subreddit));
        }
        meta.appendChild(community);
        meta.appendChild(element('span', 'cn-redlib-card-source', postLink.hostname));

        link.appendChild(meta);
        link.appendChild(element('span', 'cn-redlib-card-title', postLink.textContent.trim()));

        var footer = element('span', 'cn-redlib-card-footer');
        footer.appendChild(element('span', 'cn-redlib-card-action', labels.action));
        var arrow = element('span', 'cn-redlib-card-arrow');
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
        arrow.appendChild(svg);
        footer.appendChild(arrow);
        link.appendChild(footer);
        aside.appendChild(link);

        quote.replaceWith(aside);
        if (card) {
            card.classList.add('cn-redlib-embed');
            card.querySelectorAll('script').forEach(function (script) {
                script.remove();
            });
        }
    });
})();
