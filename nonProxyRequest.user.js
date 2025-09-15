// @moseni on pikidiary made the original!!!! go check it out!111! - https://moseni.wtf/js/byteplayer
// this version is so that it doesn't spam the proxy so yea
//////////////////////////////////////////////////////////////////////////
// ==UserScript==
// @name         byteplayer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  uses moseni's design and shit for the audio player on pikidiary
// @author       @squirrel
// @match        https://pikidiary.lol/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    // audio variables
    const metronome1 = new Audio("https://moseni.wtf//js/byteplayer/sfx/metronome.ogg");
    const metronome2 = new Audio("https://moseni.wtf//js/byteplayer/sfx/metronome2.ogg");
    const metronome_click = new Audio("https://moseni.wtf//js/byteplayer/sfx/metronome_click.ogg");

    // css 
    const theCss = `
        .moseni-swag-playr {
            position: relative;
            overflow: hidden;
            height: 64px;
            min-width: 220px;
            display: inline-flex;
            background-color: #00000030;
            box-shadow: 1px 1px #00000050;
            user-select: none;
            font-family: Ellipsis, Cyrillic, "ＭＳ Pゴシック", "MS PGothic", sans-serif;
            color: white;
            margin: 4px 0;
        }

        .moseni-swag-playr #cover {
            display: inline-flex;
            width: 64px;
            height: 64px;
            position: relative;
            z-index: 3;
        }

        .moseni-swag-playr #cover-img {
            filter: drop-shadow(0px 0px 10px #000000b0);
            width: 64px;
            height: 64px;
        }

        .moseni-swag-playr .cover-blur {
            position: absolute;
            left: 64px;
            right: 0;
            top: 0;
            bottom: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.5;
            filter: blur(24px);
            overflow: hidden;
        }

        .moseni-swag-playr .cover-blur img#blur-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(1.12);
            display: block;
        }

        .moseni-swag-playr .play-icon {
            position: absolute;
            font-size: 2em;
            color: white;
            text-shadow: 1px 1px 3px black;
            opacity: 0;
            font-family: initial;
            z-index: 9;
            user-select: none;
            transition: opacity 0.3s ease;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
        }

        .moseni-swag-playr .play-icon:hover {
            opacity: 0.8;
        }

        .moseni-swag-playr .info {
            align-items: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 9;
            flex: 1;
            margin-inline: 6px;
        }

        .moseni-swag-playr .time {
            opacity: 0.6;
            font-size: 11px;
            align-self: baseline;
            text-shadow: 1px 1px black;
        }

        .moseni-swag-playr .progress {
            display: flex;
            width: 100%;
            height: 4px;
            background: #ffffff8c;
            box-shadow: 1px 1px #00000075;
            cursor: pointer;
        }

        .moseni-swag-playr .progress-fill {
            background-color: #dfdfdf;
            width: 0%;
            height: 4px;
            transition: width 0.1s linear;
        }

        .moseni-swag-playr .metadata {
            align-self: self-start;
            margin-bottom: 2px;
            text-align: left;
            width: 100%;
        }

        .moseni-swag-playr .metadata>div {
            text-shadow: 1px 1px black;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .moseni-swag-playr #songTitle {
            font-size: 12px;
            max-width: 150px;
        }

        .moseni-swag-playr #songArtist {
            font-size: 11px;
            opacity: 0.5;
            max-width: 150px;
        }

        .moseni-swag-playr .timeBeat {
            display: flex;
            align-self: baseline;
            gap: 6px;
            align-items: center;
            width: 100%;
            justify-content: space-between;
        }

        .moseni-swag-playr .timeBeat>div {
            margin-bottom: 2px;
        }

        .moseni-swag-playr #beats {
            gap: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .moseni-swag-playr #beats .beat-dot {
            outline: solid 1px gray;
            display: inline-flex;
            width: 4px;
            height: 4px;
            cursor: pointer;
            transition: transform 0.1s ease, filter 0.1s ease;
        }

        .moseni-swag-playr #beats .beat-dot.active {
            background: gray;
        }

        .moseni-swag-playr #beats .beat-dot:hover {
            filter: drop-shadow(0px 0px 4px gray);
        }

        .moseni-swag-playr #beats .beat-dot:active {
            transform: scale(1.3);
        }
    `;
    const style = document.createElement('style');
    style.textContent = theCss;
    document.head.appendChild(style);
    // format
    function formatTime(sec) {
        if (!isFinite(sec) || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    // ramp config
    const CONFIG = {
        SLOW_MS: 250,
        MIN_RATE: 0.5,
        PRESERVE_PITCH: false,
        VOLUME_FADE: true,
    };

    // preserve pitch
    function setPreservePitch(audio, enabled) {
        try {
            audio.preservesPitch = !!enabled;
            audio.playbackPreservesPitch = !!enabled;
            audio.mozPreservesPitch = !!enabled;
            audio.webkitPreservesPitch = !!enabled;
        } catch (e) { }
    }

    // create the new player
    function createIt(audioElement) {
        const audioSrc = audioElement.src;
        // the html for the player
        const theHtml = `
            <div class="moseni-swag-playr">
                <div id="cover">
                    <div>
                        <img src="https://moseni.wtf/imagems/media_player/qblock.png" id="cover-img">
                    </div>
                    <div class="play-icon" id="playIcon">▶</div>
                </div>
                
                <div class="cover-blur" aria-hidden="true">
                    <img src="https://moseni.wtf/imagems/media_player/qblock.png" id="blur-img" alt="">
                </div>
        
                <div class="info">
                    <div class="metadata">
                        <div id="songTitle">Audio File</div>
                        <div id="songArtist">Click the lucky block.</div>
                    </div>
                    <div class="timeBeat">
                        <div class="time">0:00</div>
                        <div id="beats"></div>
                    </div>
                    <div class="progress">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                <audio preload="metadata" style="display: none;"></audio>
            </div>
`;

        // just a bunch of variables for it
        const playerContainer = document.createElement('div');
        playerContainer.innerHTML = theHtml;
        const player = playerContainer.firstElementChild;
        const theAudioFromPickle = player.querySelector('audio');
        const playIcon = player.querySelector('#playIcon');
        const timeEl = player.querySelector('.time');
        const progressFill = player.querySelector('.progress-fill');
        const progressEl = player.querySelector('.progress');
        const beatsContainer = player.querySelector('#beats');
        theAudioFromPickle.src = audioSrc;

        // ramp and metronome stuff
        let isRamping = false;
        let rampRAF = null;
        let savedVolume = 1;
        let bpmEnabled = false;
        let beatDuration = 0;
        let beatsPerMeasure = 4;
        let lastTriggeredBeat = -1;
        let hoverMetronome = false;
        let rafBeatId = null;
        let isPlaying = false;
        // bpm
        const DEFAULT_BPM = 120;
        const DEFAULT_TIME_SIG = "4/4";

        // creat ethe beat elements
        function createBeatElements(count = 4) {
            beatsPerMeasure = Math.max(1, Math.floor(count) || 4);
            beatsContainer.innerHTML = '';
            for (let i = 0; i < beatsPerMeasure; i++) {
                const dot = document.createElement('div');
                dot.className = 'beat-dot';
                dot.setAttribute('data-beat', String(i + 1));
                dot.addEventListener('click', (ev) => {
                    playMetronomeClick();
                    ev.stopPropagation();
                });
                dot.addEventListener('touchstart', (ev) => {
                    playMetronomeClick();
                    ev.preventDefault();
                    ev.stopPropagation();
                }, {
                    passive: false
                });
                beatsContainer.appendChild(dot);
            }
        }

        // play the click
        function playMetronomeClick() {
            try {
                const clickClone = metronome_click.cloneNode();
                clickClone.currentTime = 0;
                clickClone.play().catch(() => { });
            } catch (e) { }
        }

        // update by ti,me
        function updateBeatUIByTime(currentTimeSec) {
            if (!(beatDuration > 0)) return;
            const globalBeatIndex = Math.floor(currentTimeSec / beatDuration);
            const beatInMeasure = ((globalBeatIndex % beatsPerMeasure) + beatsPerMeasure) % beatsPerMeasure + 1;
            beatsContainer.classList.add('beat-flash');
            setTimeout(() => {
                beatsContainer.classList.remove('beat-flash');
            }, 120);
            const dots = Array.from(beatsContainer.querySelectorAll('.beat-dot'));
            if (dots.length === 0) return;
            const fillCount = Math.max(0, Math.min(dots.length, beatInMeasure));
            dots.forEach((d, i) => {
                if (i < fillCount) d.classList.add('active');
                else d.classList.remove('active');
            });
        }

        // trigger beat click
        function triggerBeatClick(globalBeatIndex) {
            if (!hoverMetronome) return;
            const beatInMeasure = ((globalBeatIndex % beatsPerMeasure) + beatsPerMeasure) % beatsPerMeasure + 1;
            const click = beatInMeasure === 1 ? metronome1 : metronome2;
            try {
                click.currentTime = 0;
                click.play().catch(() => { });
            } catch (e) { }
        }

        // beat lop[]
        function beatLoop() {
            rafBeatId = null;
            if (!bpmEnabled || !isPlaying) {
                rafBeatId = requestAnimationFrame(beatLoop);
                return;
            }
            const current = theAudioFromPickle.currentTime;
            if (!isFinite(current) || !(beatDuration > 0)) {
                rafBeatId = requestAnimationFrame(beatLoop);
                return;
            }
            updateBeatUIByTime(current);
            const currentBeatIndex = Math.floor(current / beatDuration);
            const delta = currentBeatIndex - lastTriggeredBeat;
            if (delta === 1 && isPlaying) {
                triggerBeatClick(currentBeatIndex);
                lastTriggeredBeat = currentBeatIndex;
            } else if (delta > 1) {
                lastTriggeredBeat = currentBeatIndex;
            } else if (delta < 0) {
                lastTriggeredBeat = currentBeatIndex;
            }
            rafBeatId = requestAnimationFrame(beatLoop);
        }

        // start bpm effect
        function startBpmEffect(bpm, timeSig = "4/4") {
            if (!bpm || bpm <= 0) return;
            const num = parseInt(String(timeSig).split("/")[0], 10) || 4;
            beatsPerMeasure = num;
            beatDuration = 60 / bpm;
            createBeatElements(beatsPerMeasure);
            const startIdx = isFinite(theAudioFromPickle.currentTime) ? Math.floor(theAudioFromPickle.currentTime / beatDuration) : 0;
            lastTriggeredBeat = startIdx - 1;
            bpmEnabled = true;
            if (rafBeatId !== null) cancelAnimationFrame(rafBeatId);
            rafBeatId = requestAnimationFrame(beatLoop);
        }
        // evenet listeners
        beatsContainer.addEventListener("mouseenter", () => {
            hoverMetronome = true;
        });
        beatsContainer.addEventListener("mouseleave", () => {
            hoverMetronome = false;
        });
        theAudioFromPickle.addEventListener('loadedmetadata', () => {
            timeEl.textContent = "0:00";
            startBpmEffect(DEFAULT_BPM, DEFAULT_TIME_SIG);
        });
        theAudioFromPickle.addEventListener('timeupdate', () => {
            const current = theAudioFromPickle.currentTime || 0;
            const duration = theAudioFromPickle.duration || 1;
            timeEl.textContent = formatTime(current);
            progressFill.style.width = (current / duration) * 100 + "%";
        });
        theAudioFromPickle.addEventListener('play', () => {
            isPlaying = true;
            playIcon.textContent = "❚❚";
            if (rafBeatId !== null) cancelAnimationFrame(rafBeatId);
            rafBeatId = requestAnimationFrame(beatLoop);
        });
        theAudioFromPickle.addEventListener('pause', () => {
            isPlaying = false;
            playIcon.textContent = "▶";
        });

        // ramp but down and pausing
        function rampDownAndPause(duration = CONFIG.SLOW_MS, minRate = CONFIG.MIN_RATE) {
            cancelAnimationFrame(rampRAF);
            const start = performance.now();
            const fromRate = theAudioFromPickle.playbackRate || 1;
            const fromVol = theAudioFromPickle.volume;
            savedVolume = fromVol;
            return new Promise((resolve) => {
                function step(now) {
                    const t = Math.min(1, (now - start) / duration);
                    const rate = fromRate + (minRate - fromRate) * t;
                    theAudioFromPickle.playbackRate = Math.max(rate, minRate);
                    if (CONFIG.VOLUME_FADE) {
                        const vol = fromVol + (0 - fromVol) * t;
                        theAudioFromPickle.volume = Math.max(0, vol);
                    }
                    if (t < 1) {
                        rampRAF = requestAnimationFrame(step);
                    } else {
                        rampRAF = null;
                        theAudioFromPickle.pause();
                        theAudioFromPickle.playbackRate = 1;
                        resolve();
                    }
                }
                rampRAF = requestAnimationFrame(step);
            });
        }

        // ramp but up and playing
        function rampUpAndPlay(duration = CONFIG.SLOW_MS, startRate = CONFIG.MIN_RATE) {
            cancelAnimationFrame(rampRAF);
            const start = performance.now();
            const targetVol = savedVolume;
            theAudioFromPickle.playbackRate = startRate;
            if (CONFIG.VOLUME_FADE) theAudioFromPickle.volume = 0;
            const playPromise = theAudioFromPickle.play().catch(() => { });
            return new Promise((resolve) => {
                playPromise.finally(() => {
                    function step(now) {
                        const t = Math.min(1, (now - start) / duration);
                        const rate = startRate + (1 - startRate) * t;
                        theAudioFromPickle.playbackRate = rate;
                        if (CONFIG.VOLUME_FADE) {
                            theAudioFromPickle.volume = targetVol * t;
                        }
                        if (t < 1) {
                            rampRAF = requestAnimationFrame(step);
                        } else {
                            rampRAF = null;
                            theAudioFromPickle.playbackRate = 1;
                            if (CONFIG.VOLUME_FADE) theAudioFromPickle.volume = targetVol;
                            resolve();
                        }
                    }
                    rampRAF = requestAnimationFrame(step);
                });
            });
        }
        // cover
        const cover = player.querySelector('#cover');
        cover.addEventListener("click", async () => { // event listener for cover to play and all dat for like ramp
            if (isRamping) return;
            isRamping = true;
            try {
                if (!isPlaying) {
                    setPreservePitch(theAudioFromPickle, false);
                    await rampUpAndPlay(CONFIG.SLOW_MS, CONFIG.MIN_RATE);
                    setPreservePitch(theAudioFromPickle, CONFIG.PRESERVE_PITCH);
                    isPlaying = true;
                    playIcon.textContent = "❚❚";
                } else {
                    setPreservePitch(theAudioFromPickle, false);
                    await rampDownAndPause(CONFIG.SLOW_MS, CONFIG.MIN_RATE);
                    setPreservePitch(theAudioFromPickle, CONFIG.PRESERVE_PITCH);
                    isPlaying = false;
                    playIcon.textContent = "▶";
                }
            } finally {
                isRamping = false;
            }
        });
        progressEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = progressEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const duration = theAudioFromPickle.duration;
            if (duration && isFinite(duration)) {
                theAudioFromPickle.currentTime = percentage * duration;
            }
        });
        player.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        return player;
    }

    // replace all the audio stuff with our brand new swag ine
    function replaceShits() {
        const audioContainers = document.querySelectorAll('.media-audio:not(.replacedd)');
        audioContainers.forEach(container => {
            const audioElement = container.querySelector('audio');
            if (!audioElement || !audioElement.src) return;
            container.classList.add('replacedd');
            const customPlayer = createIt(audioElement);
            const mediaItem = container.closest('.media-item');
            if (mediaItem) {
                mediaItem.parentNode.replaceChild(customPlayer, mediaItem);
            }
        });
    }

    // init
    function init() {
        replaceShits();
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.querySelector && node.querySelector('.media-audio')) {
                            shouldCheck = true;
                        }
                    }
                });
            });
            if (shouldCheck) {
                setTimeout(replaceShits, 100);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
