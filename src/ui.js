/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */
import html2canvas from 'html2canvas';
import { CONFIG, SPEECH_LINES } from './config.js';
import { PARTICIPANT_STATE, DRAW_DIRECTION } from './const.js';

export class UI {
    constructor() {
        // DOM Elements
        this.mainUiContainer = document.getElementById("main-ui-container");
        this.setupScreen = document.getElementById("setup-screen");
        this.raceScreen = document.getElementById("race-screen");
        this.resultsModalOverlay = document.getElementById("results-modal-overlay");
        this.resultsModal = document.getElementById("results-modal");
        this.participantsInput = document.getElementById("participants-input");
        this.startBtn = document.getElementById("start-btn");
        this.resetBtn = document.getElementById("reset-btn");
        this.shareResultsBtn = document.getElementById("share-results-btn");
        this.realStartOverlay = document.getElementById("real-start-overlay");
        this.realStartBtn = document.getElementById("real-start-btn");
        this.drawDirectionSelect = document.getElementById("draw-direction-select");
        this.drawRankSelect = document.getElementById("draw-rank-select");
        this.raceTitle = document.getElementById("race-title");
        this.countdownOverlay = document.getElementById("countdown-overlay");
        this.countdownText = document.getElementById("countdown-text");
        this.raceTrack = document.getElementById("race-track");
        this.raceTrackContainer = document.getElementById("race-track-container");
        this.raceFinishOverlay = document.getElementById("race-finish-overlay");
        this.resultsTitle = document.getElementById("results-title");
        this.resultsList = document.getElementById("results-list");
        this.shareButtons = document.getElementById("share-buttons");
        this.creditsDetail = document.getElementById('credits-detail');
        this.toggleCreditsBtn = document.getElementById('toggle-credits-btn');
        this.bgmAudio = document.getElementById("bgm-audio");
        this.winAudio = document.getElementById("win-audio");
        this.clapAudio = document.getElementById("clap-audio");
        this.copyAlert = document.getElementById("copy-alert");

        // BMC Buttons
        this.bmcBtnInitial = document.querySelector("#bmc-button-container a");
        this.bmcBtnResult = document.querySelector("#results-modal a[href*='buymeacoffee']");

        this.availableSpeechLines = {};

        // Share Config
        this.shareUrl = window.location.href.split("?")[0];
        this.shareTitle = "Go-Go! Duck Roulette - 달려라! 오리 룰렛";

        // Animation Intervals
        this.titleDuckAnimInterval = null;
        this.titleDuckSpriteInterval = null;
    }

    // --- Asset Management ---

    async preloadAssets() {
        const promises = Object.keys(CONFIG.ASSETS).map(async (key) => {
            const url = CONFIG.ASSETS[key];
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                CONFIG.ASSETS[key] = objectUrl;

            } catch (error) {
                console.error(`Failed to preload asset: ${url}`, error);
            }
        });

        await Promise.all(promises);

        // Update static images with preloaded blobs
        const titleDuck = document.getElementById("title-duck-sprite");
        if (titleDuck) titleDuck.src = CONFIG.ASSETS.WALKING;

        const resultDuckLeft = document.getElementById("result-duck-left");
        if (resultDuckLeft) resultDuckLeft.src = CONFIG.ASSETS.IDLE;

        const resultDuckRight = document.getElementById("result-duck-right");
        if (resultDuckRight) resultDuckRight.src = CONFIG.ASSETS.IDLE;
    }

    // --- Event Listeners Setup ---

    setupEventListeners(callbacks) {
        // Start button
        this.startBtn.addEventListener("click", () => {
            if (typeof gtag === "function") gtag("event", "click_ready");
            if (callbacks.onStart) callbacks.onStart();
        });

        // Real start button (countdown trigger)
        this.realStartBtn.addEventListener("click", () => {
            if (typeof gtag === "function") gtag("event", "click_start");
            this.startCountdown(() => {
                if (callbacks.onRaceStart) callbacks.onRaceStart();
            });
        });

        // Reset button
        this.resetBtn.addEventListener("click", () => {
            if (callbacks.onReset) callbacks.onReset();
        });

        // Share results button
        this.shareResultsBtn.addEventListener("click", () => {
            this.shareResults();
        });

        // Participants input change
        this.participantsInput.addEventListener("input", () => {
            if (callbacks.onParticipantsChange) callbacks.onParticipantsChange();
        });

        // Draw direction change
        this.drawDirectionSelect.addEventListener("change", () => {
            if (callbacks.onDrawSettingsChange) callbacks.onDrawSettingsChange();
        });

        // Draw rank change
        this.drawRankSelect.addEventListener("change", () => {
            if (callbacks.onDrawSettingsChange) callbacks.onDrawSettingsChange();
        });

        // BMC button (initial page)
        if (this.bmcBtnInitial) {
            this.bmcBtnInitial.addEventListener("click", () => {
                if (typeof gtag === "function") gtag("event", "click_bmc_home");
            });
        }

        // BMC button (result modal)
        if (this.bmcBtnResult) {
            this.bmcBtnResult.addEventListener("click", () => {
                if (typeof gtag === "function") gtag("event", "click_bmc_result");
            });
        }

        // GitHub button
        const githubLink = document.getElementById("github-link");
        if (githubLink) {
            githubLink.addEventListener("click", () => {
                if (typeof gtag === "function") gtag("event", "click_github");
            });
        }
    }

    // --- Setup & Input ---

    getParticipantsInput() {
        return this.participantsInput.value;
    }

    setParticipantsInput(value) {
        this.participantsInput.value = value;
    }

    setParticipantsPlaceholder(text) {
        this.participantsInput.placeholder = text;
    }

    getDrawDirection() {
        return this.drawDirectionSelect.value;
    }

    setDrawDirection(value) {
        this.drawDirectionSelect.value = value;
    }

    getDrawRank() {
        return parseInt(this.drawRankSelect.value, 10);
    }

    setDrawRank(value) {
        this.drawRankSelect.value = value;
    }

    updateDrawRankOptions(totalParticipants, previousValue) {
        this.drawRankSelect.innerHTML = "";
        if (totalParticipants > 0) {
            for (let i = 1; i <= totalParticipants; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i === 1 ? "1등만" : `${i}등까지`;
                this.drawRankSelect.appendChild(option);
            }
            if (!isNaN(previousValue)) {
                this.drawRankSelect.value = previousValue > totalParticipants ? totalParticipants : previousValue;
            } else {
                this.drawRankSelect.value = 1;
            }
        } else {
            const option = document.createElement("option");
            option.value = "1";
            option.textContent = "1등만";
            this.drawRankSelect.appendChild(option);
        }
    }

    showInputError(message) {
        this.participantsInput.classList.add("border-red-500");
        this.participantsInput.placeholder = message;
    }

    clearInputError(defaultPlaceholder) {
        this.participantsInput.classList.remove("border-red-500");
        this.participantsInput.placeholder = defaultPlaceholder;
    }

    // --- Screen Transitions ---

    showRaceScreen() {
        this.setupScreen.classList.add("hidden");
        this.raceScreen.classList.remove("hidden");
        this.resultsModal.classList.add("hidden");
        this.resultsModalOverlay.classList.add("hidden");
        if (this.shareButtons) this.shareButtons.classList.add("hidden");

        // Hide BMC button
        const bmcButton = document.getElementById("bmc-button-container");
        if (bmcButton) bmcButton.style.display = "none";

        // Close credits
        if (this.creditsDetail) this.creditsDetail.classList.add('hidden');
        if (this.toggleCreditsBtn) this.toggleCreditsBtn.textContent = 'Show Credits ▼';
    }

    showSetupScreen() {
        this.setupScreen.classList.remove("hidden");
        this.raceScreen.classList.add("hidden");
        this.resultsModal.classList.add("hidden");
        this.resultsModalOverlay.classList.add("hidden");
        if (this.raceFinishOverlay) this.raceFinishOverlay.classList.add("hidden");
        if (this.shareButtons) this.shareButtons.classList.remove("hidden");

        const bmcButton = document.getElementById("bmc-button-container");
        if (bmcButton) bmcButton.style.display = "block";
    }

    _positionAnchorAtViewportCenter(anchor) {
        // Set fixed pixel position once — CSS top:50% shifts on mobile when
        // the address bar hides/shows and changes viewport height
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        anchor.style.left = cx + 'px';
        anchor.style.top = cy + 'px';
        anchor.style.transform = 'translate(-50%, -50%)';
    }

    showRealStartOverlay() {
        // Move button to fixed viewport-center anchor BEFORE showing overlay
        const anchor = document.getElementById("viewport-center-anchor");
        anchor.appendChild(this.realStartBtn);
        this._positionAnchorAtViewportCenter(anchor);
        anchor.classList.add("active");
        this.realStartOverlay.classList.remove("hidden");
    }

    hideRealStartOverlay() {
        this.realStartOverlay.classList.add("hidden");
        // Return button to its original overlay
        const anchor = document.getElementById("viewport-center-anchor");
        anchor.classList.remove("active");
        this.realStartOverlay.appendChild(this.realStartBtn);
    }

    showCountdown(count) {
        this.countdownText.textContent = count;
        if (count === "Start!") {
            this.countdownText.classList.remove("text-7xl");
            this.countdownText.classList.add("text-5xl");
        } else {
            this.countdownText.classList.remove("text-5xl");
            this.countdownText.classList.add("text-7xl");
        }
        // Move countdown text to fixed viewport-center anchor BEFORE showing overlay
        const anchor = document.getElementById("viewport-center-anchor");
        anchor.appendChild(this.countdownText);
        this._positionAnchorAtViewportCenter(anchor);
        anchor.classList.add("active");
        this.countdownOverlay.classList.remove("hidden");
    }

    hideCountdown() {
        this.countdownOverlay.classList.add("hidden");
        // Return countdown text to its original overlay
        const anchor = document.getElementById("viewport-center-anchor");
        anchor.classList.remove("active");
        this.countdownOverlay.appendChild(this.countdownText);
    }

    // --- Race Visuals ---

    clearRaceTrack() {
        this.raceTrack.innerHTML = "";
    }

    createParticipantElement(name, color, nameColor) {
        const lane = document.createElement("div");
        lane.className = "lane";

        const duckContainer = document.createElement("div");
        duckContainer.className = "duck-container";
        duckContainer.style.setProperty("--duck-color", nameColor);

        duckContainer.innerHTML = `
            <div class="booster-effect"></div>
            <img class="duck-sprite" src="${CONFIG.ASSETS.WALKING}" alt="${name} duck">
            <div class="fireworks-container"></div>
            <div class="duck-label">
                <span class="duck-rank-inline"></span><span class="duck-name" style="color: ${nameColor};">${name}</span>
            </div>
            <div class="duck-speech"></div>
        `;

        lane.appendChild(duckContainer);
        this.raceTrack.appendChild(lane);

        return {
            element: duckContainer,
            spriteElement: duckContainer.querySelector(".duck-sprite"),
            rankElement: duckContainer.querySelector(".duck-rank-inline"),
            speechElement: duckContainer.querySelector(".duck-speech"),
            fireworksContainer: duckContainer.querySelector(".fireworks-container"),
        };
    }

    updateParticipantVisuals(p) {
        if (p.state !== PARTICIPANT_STATE.FINISHED && p.state !== PARTICIPANT_STATE.STOPPED) {
            const pixelOffset = (p.position / CONFIG.FINISH_LINE_POS) * 50;
            p.element.style.left = `calc(${p.position}% - ${pixelOffset}px - 15px)`;
        }
    }

    handleFinish(p) {
        p.element.classList.add("near-finish");
        p.element.style.left = `calc(${CONFIG.FINISH_LINE_POS}% - 60px)`;
        p.spriteElement.src = CONFIG.ASSETS.WALKING;
        this.showPermanentSpeech(p, "finishing");

        p.rankElement.textContent = ` (${p.currentRank}등)`;
        this.resetRankVisuals(p);
    }

    triggerFireworks(p) {
        if (p.fireworksContainer) {
            p.fireworksContainer.classList.add("fireworks-active");
            setTimeout(() => {
                if (p.fireworksContainer) p.fireworksContainer.classList.remove("fireworks-active");
            }, 1800);
        }
    }

    updateRankVisuals(p, drawDirection, drawRank, totalParticipants) {
        if (p.rankElement && p.state !== PARTICIPANT_STATE.FINISHED && p.state !== PARTICIPANT_STATE.STOPPED) {
            p.rankElement.textContent = ` (${p.currentRank}등)`;

            const isFrontWinner = drawDirection === DRAW_DIRECTION.FRONT && p.currentRank <= drawRank;
            const isBackWinner = drawDirection === DRAW_DIRECTION.BACK && p.currentRank >= totalParticipants - drawRank + 1;

            if (isFrontWinner || isBackWinner) {
                p.rankElement.classList.add("duck-rank-highlight");
                p.rankElement.style.color = p.color;
                p.rankElement.style.textShadow = `0 0 5px ${p.color}`;
            } else {
                this.resetRankVisuals(p);
            }
        }
    }

    resetRankVisuals(p) {
        p.rankElement.classList.remove("duck-rank-highlight");
        p.rankElement.style.color = "";
        p.rankElement.style.textShadow = "";
    }

    addParticipantClass(p, ...classes) {
        p.element.classList.add(...classes);
    }

    removeParticipantClass(p, ...classes) {
        p.element.classList.remove(...classes);
    }

    // --- Speech Bubbles ---

    showSpeech(participant, key, duration) {
        if (participant.speechTimer) clearTimeout(participant.speechTimer);

        let pool = this.availableSpeechLines[key];
        if (!pool || pool.length === 0) {
            this.availableSpeechLines[key] = [...SPEECH_LINES[key]];
            pool = this.availableSpeechLines[key];
            if (!pool || pool.length === 0) return;
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        const phrase = pool.splice(randomIndex, 1)[0];

        participant.speechElement.textContent = phrase;
        participant.speechElement.style.display = "block";

        participant.speechTimer = setTimeout(() => {
            participant.speechElement.style.display = "none";
            participant.speechTimer = null;
        }, duration);
    }

    showPermanentSpeech(participant, key) {
        if (participant.speechTimer) clearTimeout(participant.speechTimer);
        participant.speechTimer = null;

        let pool = this.availableSpeechLines[key];
        if (!pool || pool.length === 0) {
            this.availableSpeechLines[key] = [...SPEECH_LINES[key]];
            pool = this.availableSpeechLines[key];
            if (!pool || pool.length === 0) return;
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        const phrase = pool.splice(randomIndex, 1)[0];

        participant.speechElement.textContent = phrase;
        participant.speechElement.style.display = "block";
    }

    resetSpeechPools() {
        this.availableSpeechLines = {
            resting: [...SPEECH_LINES.resting],
            boosting: [...SPEECH_LINES.boosting],
            flying: [...SPEECH_LINES.flying],
            finishing: [...SPEECH_LINES.finishing],
            superBoosting: [...SPEECH_LINES.superBoosting],
            distraction: [...SPEECH_LINES.distraction],
            confusion: [...SPEECH_LINES.confusion],
            confusionEnd: [...SPEECH_LINES.confusionEnd],
        };
    }

    // --- Audio ---

    playBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.playbackRate = 1.25;
            this.bgmAudio.volume = 1.0;
            this.bgmAudio.play().catch(err => console.error("BGM playback failed:", err));
        }
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    fadeOutBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            const fadeOutDuration = 1500;
            const fadeOutSteps = 30;
            const stepDuration = fadeOutDuration / fadeOutSteps;
            const volumeStep = this.bgmAudio.volume / fadeOutSteps;

            for (let i = 0; i < fadeOutSteps; i++) {
                setTimeout(() => {
                    this.bgmAudio.volume = Math.max(0, this.bgmAudio.volume - volumeStep);
                    if (i === fadeOutSteps - 1) {
                        this.bgmAudio.pause();
                        this.bgmAudio.volume = 1.0;
                    }
                }, i * stepDuration);
            }
        }
    }

    playWinSound() {
        if (this.winAudio) {
            this.winAudio.currentTime = 0;
            this.winAudio.play().catch(err => console.error("Win sound playback failed:", err));
        }
    }

    playClapSound() {
        if (this.clapAudio) {
            this.clapAudio.currentTime = 0;
            this.clapAudio.play().catch(err => console.error("Clap sound playback failed:", err));
        }
    }

    // --- Results ---

    async showResults(finishedDucks, allParticipants, drawDirection, drawRank, camera) {
        let sortedList = [];
        if (drawDirection === DRAW_DIRECTION.FRONT) {
            sortedList = [...finishedDucks].sort((a, b) => a.finishTime - b.finishTime);
        } else {
            const finishers = [...finishedDucks].sort((a, b) => a.finishTime - b.finishTime);
            const nonFinishers = [...allParticipants].filter(p => p.state !== PARTICIPANT_STATE.FINISHED).sort((a, b) => b.position - a.position);
            sortedList = [...finishers, ...nonFinishers];
            sortedList.forEach((p, index) => { p.currentRank = index + 1; });
        }

        let winners = [];
        let title = "";

        if (drawDirection === DRAW_DIRECTION.FRONT) {
            const rankText = drawRank == 1 ? "1등만" : `${drawRank}등까지`;
            title = `🎉 앞에서 ${rankText} 당첨! 🎉`;
            winners = sortedList.slice(0, drawRank);
        } else {
            const rankText = drawRank == 1 ? "1등만" : `${drawRank}등까지`;
            title = `🎉 뒤에서 ${rankText} 당첨! 🎉`;
            winners = sortedList.slice(-drawRank);
        }

        this.resultsTitle.innerHTML = title;
        if (this.raceFinishOverlay) {
            // Move finish text to fixed viewport-center anchor BEFORE showing overlay
            const finishText = document.getElementById("race-finish-text");
            const anchor = document.getElementById("viewport-center-anchor");
            if (finishText && anchor) {
                anchor.appendChild(finishText);
                this._positionAnchorAtViewportCenter(anchor);
                anchor.classList.add("active");
            }
            this.raceFinishOverlay.classList.remove("hidden");
        }

        this.fadeOutBGM();

        await new Promise(resolve => setTimeout(resolve, 1500));
        if (this.raceFinishOverlay) {
            this.raceFinishOverlay.classList.add("hidden");
            // Return finish text to its original overlay
            const finishText = document.getElementById("race-finish-text");
            const anchor = document.getElementById("viewport-center-anchor");
            if (finishText && anchor) {
                anchor.classList.remove("active");
                this.raceFinishOverlay.appendChild(finishText);
            }
        }

        for (const winner of winners) {
            await this.zoomAndHighlightWinner(winner, camera);
        }

        this.resultsList.innerHTML = "";
        if (winners.length > 0) {
            if (drawDirection === DRAW_DIRECTION.BACK) winners.sort((a, b) => b.currentRank - a.currentRank);
            else winners.sort((a, b) => a.currentRank - b.currentRank);

            winners.forEach(winner => {
                const li = document.createElement("li");
                li.innerHTML = `<strong class="font-bold">${winner.currentRank}등</strong><br><span style="color: ${winner.nameColor};">${winner.name}</span>`;
                this.resultsList.appendChild(li);
                winner.element.classList.add("duck-winner");
            });
        } else {
            this.resultsList.innerHTML = "<li>당첨자가 없습니다.</li>";
        }

        if (this.resultsModal && this.raceTrackContainer) {
            this.resultsModal.style.top = `${this.raceTrackContainer.offsetTop}px`;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });

        this.playClapSound();
        this.resultsModal.classList.remove("hidden");
        this.resultsModalOverlay.classList.remove("hidden");
    }

    async zoomAndHighlightWinner(participant, camera) {
        this.playWinSound();

        // 1. Zoom In
        this.mainUiContainer.style.transition = `transform ${CONFIG.HIGHLIGHT_ZOOM_DURATION / 1000}s ease-in-out`;
        camera.applyZoomToWinnerTransform(participant);

        if (participant.fireworksContainer) {
            participant.fireworksContainer.classList.add("fireworks-active");
            setTimeout(() => {
                if (participant.fireworksContainer) participant.fireworksContainer.classList.remove("fireworks-active");
            }, 1800);
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.HIGHLIGHT_ZOOM_DURATION + 50));

        // 2. Emphasize rank
        if (participant.rankElement) {
            participant.rankElement.style.transition = "all 0.3s ease-in-out";
            participant.rankElement.style.transformOrigin = "right center";
            participant.rankElement.style.transform = "scale(2.5)";
            participant.rankElement.style.fontWeight = "900";
            participant.rankElement.style.color = participant.color;
            participant.rankElement.style.textShadow = `0 0 8px ${participant.color}`;
        }
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. De-emphasize and Zoom Out
        if (participant.rankElement) {
            participant.rankElement.style.transform = "scale(1)";
            participant.rankElement.style.transformOrigin = "";
        }
        this.mainUiContainer.style.transition = `transform ${CONFIG.HIGHLIGHT_ZOOM_OUT_DURATION / 1000}s ease-in-out`;
        this.mainUiContainer.style.transform = "translate(0px, 0px) scale(1)";
        await new Promise(resolve => setTimeout(resolve, CONFIG.HIGHLIGHT_ZOOM_OUT_DURATION + 50));

        this.mainUiContainer.style.transformOrigin = "50% 50%";
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // --- Sharing ---

    shareFacebook() {
        if (typeof gtag === "function") gtag("event", "share_facebook");
        window.open(
            "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(this.shareUrl),
            "_blank",
        );
    }

    shareTwitter() {
        if (typeof gtag === "function") gtag("event", "share_twitter");
        window.open(
            "https://twitter.com/intent/tweet?url=" +
            encodeURIComponent(this.shareUrl) +
            "&text=" +
            encodeURIComponent(this.shareTitle),
            "_blank",
        );
    }

    shareInstagram() {
        if (typeof gtag === "function") gtag("event", "share_instagram");
        this.copyLink();
        this.showNotification("링크가 복사되었습니다! 인스타그램에서 공유해보세요.");
    }

    copyLink(urlToCopy = null) {
        if (typeof gtag === "function") gtag("event", "share_copy_link");
        const url = urlToCopy || this.shareUrl;
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = url;
        tempTextArea.style.position = "absolute";
        tempTextArea.style.left = "-9999px";
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        tempTextArea.setSelectionRange(0, 99999);

        try {
            document.execCommand("copy");
            this.showNotification("링크 복사 완료!");
        } catch (err) {
            console.error("Failed to copy link:", err);
            alert("링크 복사에 실패했습니다.");
        }
        document.body.removeChild(tempTextArea);
    }

    async shareResults() {
        if (typeof gtag === "function") gtag("event", "share_result_image");

        const captureTarget = this.mainUiContainer;
        if (!captureTarget) {
            alert("결과 영역을 찾을 수 없습니다.");
            return;
        }

        // Elements to hide/show
        const bmcButton = document.getElementById("bmc-button-container");
        const resultButtons = document.getElementById("result-buttons-container");
        const feedbackLink = document.getElementById("feedback-link");
        const watermark = document.getElementById("capture-watermark");

        if (watermark) watermark.classList.remove("hidden");
        if (resultButtons) resultButtons.classList.add("hidden");
        if (feedbackLink) feedbackLink.classList.add("hidden");
        if (bmcButton) bmcButton.style.visibility = "hidden";
        if (this.shareButtons) this.shareButtons.style.visibility = "hidden";

        try {
            const canvas = await html2canvas(captureTarget, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });

            if (watermark) watermark.classList.add("hidden");
            if (resultButtons) resultButtons.classList.remove("hidden");
            if (feedbackLink) feedbackLink.classList.remove("hidden");
            if (bmcButton) bmcButton.style.visibility = "visible";
            if (this.shareButtons) this.shareButtons.style.visibility = "visible";

            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (!imageBlob) {
                alert("결과 이미지 생성에 실패했습니다.");
                return;
            }

            const fileName = `Go-Go-Duck-Roulette-Result-${new Date().toISOString().slice(0, 10)}.png`;
            const imageFile = new File([imageBlob], fileName, { type: "image/png" });
            const shareData = {
                files: [imageFile],
                title: "Go-Go! Duck Roulette",
                text: "경주 추첨 결과를 확인해 보세요!\n\nGo-Go! Duck Roulette 바로가기:\nhttps://hyojun.me/gogoduck",
            };

            if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    if (err.name !== "AbortError") {
                        alert("결과 이미지를 다운로드합니다. 친구와 공유해보세요!");
                        this.downloadImage(imageBlob, fileName);
                    }
                }
            } else {
                alert("결과 이미지를 다운로드합니다. 친구와 공유해보세요!");
                this.downloadImage(imageBlob, fileName);
            }
        } catch (err) {
            console.error("Error capturing or sharing results:", err);
            alert("결과 이미지를 캡처하거나 공유하는 데 실패했습니다.");
            if (watermark) watermark.classList.add("hidden");
            if (resultButtons) resultButtons.classList.remove("hidden");
            if (feedbackLink) feedbackLink.classList.remove("hidden");
            if (bmcButton) bmcButton.style.visibility = "visible";
            if (this.shareButtons) this.shareButtons.style.visibility = "visible";
        }
    }

    downloadImage(blob, fileName) {
        // In-app browser workaround
        // WebViews in apps like KakaoTalk, Naver, Instagram etc. often fail to handle blob: downloads.
        // We convert to Data URL as a workaround for both iOS and Android in-app browsers.
        const userAgent = navigator.userAgent;
        const isInApp = /KAKAOTALK|NAVER|LINE|Instagram|FBAV|FBAN|Twitter|DaumApps/i.test(userAgent);

        if (isInApp) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = reader.result;
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
            reader.readAsDataURL(blob);
        } else {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
        this.showNotification("이미지 복사 실패! 다운로드를 시작합니다.");
    }

    showNotification(message, duration = 2500) {
        if (this.copyAlert) {
            const originalText = "링크 복사 완료!";
            this.copyAlert.textContent = message;
            this.copyAlert.classList.remove("opacity-0", "translate-y-2");
            this.copyAlert.classList.add("opacity-100", "translate-y-0");

            setTimeout(() => {
                this.copyAlert.classList.remove("opacity-100", "translate-y-0");
                this.copyAlert.classList.add("opacity-0", "translate-y-2");
                setTimeout(() => {
                    this.copyAlert.textContent = originalText;
                }, 300);
            }, duration);
        }
    }

    toggleCredits() {
        if (this.creditsDetail.classList.contains('hidden')) {
            this.creditsDetail.classList.remove('hidden');
            this.toggleCreditsBtn.textContent = 'Hide Credits ▲';
        } else {
            this.creditsDetail.classList.add('hidden');
            this.toggleCreditsBtn.textContent = 'Show Credits ▼';
        }
    }
    // --- Title Animation ---

    startTitleDuckAnimation() {
        const titleDuck = document.getElementById("title-duck-sprite");
        if (titleDuck) {
            this.stopTitleDuckAnimation();

            const animationKeys = ["WALKING", "RUNNING", "JUMPING"];
            let currentAnimIndex = 0;
            let position = -60;
            const speed = 2;

            const animateTitleDuck = () => {
                const containerWidth = titleDuck.parentElement.offsetWidth;
                position += speed;
                if (position > containerWidth) {
                    position = -60;
                }
                titleDuck.style.left = `${position}px`;
                this.titleDuckAnimInterval = requestAnimationFrame(animateTitleDuck);
            };

            const changeTitleDuckSprite = () => {
                currentAnimIndex = (currentAnimIndex + 1) % animationKeys.length;
                titleDuck.src = CONFIG.ASSETS[animationKeys[currentAnimIndex]];
            };

            titleDuck.src = CONFIG.ASSETS[animationKeys[0]];
            this.titleDuckAnimInterval = requestAnimationFrame(animateTitleDuck);
            this.titleDuckSpriteInterval = setInterval(changeTitleDuckSprite, 3000);
        }
    }

    stopTitleDuckAnimation() {
        if (this.titleDuckAnimInterval) cancelAnimationFrame(this.titleDuckAnimInterval);
        if (this.titleDuckSpriteInterval) clearInterval(this.titleDuckSpriteInterval);
        this.titleDuckAnimInterval = null;
        this.titleDuckSpriteInterval = null;
    }

    // --- Countdown ---

    startCountdown(onComplete) {
        this.hideRealStartOverlay();
        this.playBGM();
        this.showCountdown(3);
        let count = 3;

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.showCountdown(count);
            } else if (count === 0) {
                this.showCountdown("Start!");
            } else {
                clearInterval(countdownInterval);
                this.hideCountdown();
                if (onComplete) onComplete();
            }
        }, 1000);
    }
}
