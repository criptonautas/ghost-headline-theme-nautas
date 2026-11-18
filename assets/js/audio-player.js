(function () {
    var init = function () {
        var template = document.getElementById('cn-audio-player');
        var card = document.querySelector('.gh-content .kg-audio-card');
        var audio = card && card.querySelector('audio');

        if (!template || !audio) {
            return;
        }

        var player = template.content.firstElementChild.cloneNode(true);
        var launcher = player.querySelector('.cn-audio-launcher');
        var play = player.querySelector('.cn-audio-play-main');
        var seek = player.querySelector('.cn-audio-seek');
        var rate = player.querySelector('.cn-audio-rate');
        var source = card.querySelector('.kg-audio-title');
        var marker = document.createComment('audio-player');
        var sidebar = document.getElementById('sidebar-toc');
        var desktop = window.matchMedia('(min-width: 992px)');
        var rates = [1, 1.25, 1.5, 2];
        var playedFor = 0;
        var playbackStarted = 0;

        player.querySelector('.cn-audio-source').textContent = source ? source.textContent.trim().replace(/^(por|by)\s+/i, '').replace(/voz desde IA/ig, 'voz IA') : '';
        card.parentNode.insertBefore(marker, card);
        card.replaceWith(player);
        player.appendChild(audio);

        var open = function (on, focus) {
            on = !desktop.matches && on;
            player.classList.toggle('is-open', on);
            document.body.classList.toggle('cn-audio-open', on);
            launcher.setAttribute('aria-expanded', String(on));
            if (focus) {
                (on ? player.querySelector('.cn-audio-close') : launcher).focus({preventScroll: true});
            }
        };

        var place = function () {
            open(false);
            if (desktop.matches && sidebar && sidebar.isConnected && !sidebar.classList.contains('is-toc-empty')) {
                sidebar.prepend(player);
            } else if (marker.parentNode) {
                marker.parentNode.insertBefore(player, marker.nextSibling);
            }
        };

        var time = function (seconds) {
            if (!Number.isFinite(seconds)) {
                return '0:00';
            }
            return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
        };

        var update = function () {
            var duration = Number.isFinite(audio.duration) ? audio.duration : 0;
            seek.max = String(duration);
            seek.value = String(audio.currentTime);
            player.querySelector('[data-current]').textContent = time(audio.currentTime);
            player.querySelectorAll('[data-duration]').forEach(function (node) {
                node.textContent = node.closest('.cn-audio-launcher-title') ? '· ' + time(duration) : time(duration);
            });
        };

        var sync = function () {
            if (playbackStarted) {
                playedFor += Date.now() - playbackStarted;
                playbackStarted = 0;
            }
            if (!audio.paused && !audio.ended && audio.readyState >= 3) {
                playbackStarted = Date.now();
            }
            if (playedFor >= 5000) {
                player.classList.add('has-played');
            }
            player.classList.toggle('is-playing', !audio.paused && !audio.ended);
            play.setAttribute('aria-label', play.getAttribute(audio.paused ? 'data-label-play' : 'data-label-pause'));
            update();
        };

        launcher.addEventListener('click', function () {
            open(true, true);
        });
        player.querySelector('.cn-audio-close').addEventListener('click', function () {
            open(false, true);
        });
        play.addEventListener('click', function () {
            if (audio.paused) {
                audio.play().catch(sync);
            } else {
                audio.pause();
            }
        });
        player.querySelectorAll('[data-skip]').forEach(function (button) {
            button.addEventListener('click', function () {
                audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + Number(button.dataset.skip)));
                update();
            });
        });
        seek.addEventListener('input', function () {
            audio.currentTime = Number(seek.value);
            update();
        });
        rate.addEventListener('click', function () {
            var next = (rates.indexOf(audio.playbackRate) + 1) % rates.length;
            audio.playbackRate = rates[next];
            rate.textContent = String(audio.playbackRate).replace('.', ',') + '×';
            rate.setAttribute('aria-label', rate.dataset.label + ': ' + rate.textContent);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && player.classList.contains('is-open')) {
                open(false, true);
            }
        });
        ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'playing', 'waiting', 'pause', 'ended'].forEach(function (event) {
            audio.addEventListener(event, sync);
        });

        desktop.addEventListener('change', place);
        place();
        sync();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
