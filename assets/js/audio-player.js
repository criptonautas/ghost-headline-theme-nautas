(function () {
    var init = function () {
        var template = document.getElementById('cn-audio-player');
        // Only the reading the TTS workflow adds (its Bunny folder): any other
        // audio card in the post stays Ghost's own.
        var audio = document.querySelector('.gh-content .kg-audio-card audio[src*="/blog-tts/"]');
        var card = audio && audio.closest('.kg-audio-card');

        if (!template || !card) {
            return;
        }

        var player = template.content.firstElementChild.cloneNode(true);
        var box = player.querySelector('.cn-audio-card');
        var play = player.querySelector('.cn-audio-play');
        var seek = player.querySelector('.cn-audio-seek');
        var rate = player.querySelector('.cn-audio-rate');
        var marker = document.createComment('audio-player');
        var sidebar = document.getElementById('sidebar-toc');
        var desktop = window.matchMedia('(min-width: 992px)');
        var rates = [1, 1.25, 1.5, 2];
        var playedFor = 0;
        var playbackStarted = 0;

        // Ghost's card already knows the length in seconds: shown before the file's metadata loads.
        var known = Number((card.querySelector('.kg-audio-duration') || {}).textContent) || 0;

        card.parentNode.insertBefore(marker, card);
        card.replaceWith(player);
        player.appendChild(audio);

        // Phones: playing docks the card to the bottom of the screen; its place
        // in the text keeps its height, so nothing below moves.
        var open = function (on, focus) {
            on = !desktop.matches && on;
            player.style.minHeight = on ? player.offsetHeight + 'px' : '';
            player.classList.toggle('is-open', on);
            document.body.classList.toggle('cn-audio-open', on);
            document.body.style.setProperty('--cn-audio-panel-height', on ? box.offsetHeight + 'px' : '');
            if (focus) {
                (on ? player.querySelector('.cn-audio-close') : play).focus({preventScroll: true});
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
            var duration = Number.isFinite(audio.duration) ? audio.duration : known;
            seek.max = String(duration);
            seek.value = String(audio.currentTime);
            player.querySelector('[data-current]').textContent = time(audio.currentTime);
            // Blank until the file's length is known, never a misleading 0:00.
            player.querySelector('[data-duration]').textContent = duration ? time(duration) : '';
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

        player.querySelector('.cn-audio-close').addEventListener('click', function () {
            open(false, true);
        });
        play.addEventListener('click', function () {
            if (audio.paused) {
                if (!player.classList.contains('is-open')) {
                    open(true, true);
                }
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
            rate.textContent = audio.playbackRate.toLocaleString(document.documentElement.lang) + '×';
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

        // Lock screen, headphones and the OS media controls.
        if ('mediaSession' in navigator && window.MediaMetadata) {
            var image = document.querySelector('meta[property="og:image"]');
            var heading = document.querySelector('h1');
            navigator.mediaSession.metadata = new MediaMetadata({
                title: heading ? heading.textContent.trim() : document.title,
                artist: player.querySelector('.cn-audio-description').textContent,
                artwork: image ? [{src: image.content}] : []
            });
            [['play', function () {
                audio.play().catch(sync);
            }], ['pause', function () {
                audio.pause();
            }], ['seekbackward', function () {
                audio.currentTime = Math.max(0, audio.currentTime - 15);
            }], ['seekforward', function () {
                audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
            }], ['seekto', function (details) {
                audio.currentTime = details.seekTime;
            }]].forEach(function (pair) {
                try {
                    navigator.mediaSession.setActionHandler(pair[0], pair[1]);
                } catch (e) {}
            });
        }

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
