/* The community's Kuno of the day (partials/kuno-bar.hbs, assets/css/kuno-bar.css).
 * The forum's /tag/{tag}.json lists the fundraisers; discourse-kuno-nautas adds
 * monero_campaign to each topic. The list is kept an hour in this browser, so
 * browsing the site costs one request. Everyone sees the same fundraiser on a
 * given UTC day; closed, it stays closed until the next one. The lang bar, when
 * it shows, goes first and this one waits for another day.
 */
(function () {
    var template = document.getElementById('cn-kuno-bar');
    var ORIGIN = (document.documentElement.getAttribute('data-discourse') || '').replace(/\/+$/, '');
    var tag = template && template.getAttribute('data-tag').trim();

    if (!tag || !ORIGIN || !window.fetch) {
        return;
    }

    var CACHE = 'cn-kuno-cache';
    var CLOSED = 'cn-kuno-closed';
    var day = Math.floor(Date.now() / 86400000);
    var lang = document.documentElement.lang || 'es';
    var store = function (key, value) {
        try {
            if (value === undefined) {
                return localStorage.getItem(key);
            }
            localStorage.setItem(key, value);
        } catch (e) {}
        return null;
    };

    if (store(CLOSED) === String(day)) {
        return;
    }

    var load = function () {
        var cached = null;
        try {
            cached = JSON.parse(store(CACHE));
        } catch (e) {}
        if (cached && cached.tag === tag && Date.now() - cached.at < 3600000) {
            return Promise.resolve(cached.topics);
        }
        return fetch(ORIGIN + '/tag/' + encodeURIComponent(tag) + '.json', {
            credentials: 'omit',
            // The forum serves its translation of the titles in the site's language.
            headers: {Accept: 'application/json', 'Accept-Language': lang}
        }).then(function (response) {
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response.json();
        }).then(function (data) {
            var topics = (data.topic_list && data.topic_list.topics || []).filter(function (topic) {
                return topic.monero_campaign && topic.monero_campaign.status === 'active';
            }).map(function (topic) {
                return {id: topic.id, slug: topic.slug, title: topic.title, goal: topic.monero_campaign.goal, raised: topic.monero_campaign.raised};
            });
            store(CACHE, JSON.stringify({tag: tag, at: Date.now(), topics: topics}));
            return topics;
        });
    };

    var render = function (topics) {
        // Sorted by id, as the forum's banner: a reply reorders the list, not the pick.
        topics.sort(function (a, b) {
            return a.id - b.id;
        });
        var item = topics[day % topics.length];

        if (!item || document.querySelector('.cn-lang-offer')) {
            return;
        }

        var bar = template.content.firstElementChild.cloneNode(true);
        var link = bar.querySelector('.cn-kuno-link');
        var number = new Intl.NumberFormat(lang, {maximumFractionDigits: 4});
        var goal = Number(item.goal) || 0;
        var percent = goal ? Math.min(100, Math.round((Number(item.raised) || 0) / goal * 100)) : 0;
        var figures = bar.querySelector('.cn-kuno-figures');
        var track = bar.querySelector('.cn-kuno-track');
        var dialog = bar.querySelector('dialog');
        var copy = dialog.querySelector('.gh-monero-tip-copy');

        link.href = ORIGIN + '/t/' + item.slug + '/' + item.id;
        bar.querySelector('.cn-kuno-title').textContent = item.title;
        if (goal) {
            figures.textContent = number.format(item.raised || 0) + ' ' + figures.getAttribute('data-of') + ' ' + number.format(goal) + ' XMR';
            track.setAttribute('aria-valuenow', String(percent));
            track.setAttribute('aria-label', figures.textContent);
            track.style.setProperty('--cn-kuno-progress', percent + '%');
        } else {
            figures.remove();
            track.remove();
        }

        bar.querySelector('.cn-kuno-close').addEventListener('click', function () {
            store(CLOSED, String(day));
            bar.remove();
        });

        // The address is asked for on the click, not on every page.
        bar.querySelector('.cn-kuno-donate').addEventListener('click', function () {
            fetch(ORIGIN + '/kuno-nautas/campaigns/' + item.id + '/donate.json', {
                credentials: 'omit',
                headers: {Accept: 'application/json'}
            }).then(function (response) {
                if (!response.ok) {
                    throw new Error(response.status);
                }
                return response.json();
            }).then(function (tip) {
                dialog.querySelector('.gh-monero-tip-address').value = tip.address;
                dialog.querySelector('.gh-monero-tip-qr').src = tip.qr;
                dialog.querySelector('.gh-monero-tip-wallet').href = tip.uri;
                dialog.showModal();
            }).catch(function () {
                // No address to show: the fundraiser's topic has the forum's own button.
                location.href = link.href;
            });
        });

        copy.addEventListener('click', function () {
            var input = dialog.querySelector('.gh-monero-tip-address');
            input.select();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(input.value).then(function () {
                    copy.textContent = copy.getAttribute('data-copied');
                }, function () {});
            }
        });

        // First in .gh-site, as the lang bar: above the header on desktop, under
        // the fixed bar below 992px.
        (document.querySelector('.gh-site') || document.body).prepend(bar);
    };

    load().then(render).catch(function () {});
})();
