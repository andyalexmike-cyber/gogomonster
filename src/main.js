/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */
import './style.css';
import './tailwind.css';
import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { STORAGE_KEYS, PARTICIPANT_STATE } from './const.js';

document.addEventListener("DOMContentLoaded", () => {
    // --- Initialization ---
    const ui = new UI();

    // Preload assets immediately
    ui.preloadAssets();

    const camera = new Camera(ui.mainUiContainer);
    const game = new Game(ui, camera);

    // --- Global Share Functions (attached to window for HTML access) ---

    window.shareFacebook = function () {
        ui.shareFacebook();
    };

    window.shareTwitter = function () {
        ui.shareTwitter();
    };

    window.shareInstagram = function () {
        ui.shareInstagram();
    };

    window.copyLink = function (urlToCopy = null) {
        ui.copyLink(urlToCopy);
    };

    window.toggleCredits = function () {
        ui.toggleCredits();
    };

    // --- Event Listeners ---

    ui.setupEventListeners({
        onStart: setupRace,
        onRaceStart: () => {
            game.startRaceLoop();
            ui.scheduleLeaderboard(3000);
        },
        onReset: resetGame,
        onParticipantsChange: () => {
            saveSettingsToLocalStorage();
            updateDrawRankLabel();
        },
        onDrawSettingsChange: () => {
            updateDrawRankLabel();
            saveSettingsToLocalStorage();
        },
    });

    // --- Helper Functions ---

    function loadSettingsFromLocalStorage() {
        const savedParticipants = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
        const savedDrawDirection = localStorage.getItem(STORAGE_KEYS.DRAW_DIRECTION);
        const savedDrawRank = localStorage.getItem(STORAGE_KEYS.DRAW_RANK);

        if (savedParticipants !== null) {
            ui.setParticipantsInput(savedParticipants);
            if (savedParticipants === "") {
                ui.setParticipantsPlaceholder("예) " + CONFIG.DEFAULT_PARTICIPANT_LIST);
            }
        } else {
            ui.setParticipantsInput(CONFIG.DEFAULT_PARTICIPANT_LIST);
            localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, CONFIG.DEFAULT_PARTICIPANT_LIST);
        }

        if (savedDrawDirection) {
            ui.setDrawDirection(savedDrawDirection);
        }

        updateDrawRankLabel();
    }

    function saveSettingsToLocalStorage() {
        const currentValue = ui.getParticipantsInput();
        localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, currentValue);
        localStorage.setItem(STORAGE_KEYS.DRAW_DIRECTION, ui.getDrawDirection());
        localStorage.setItem(STORAGE_KEYS.DRAW_RANK, ui.getDrawRank());

        if (currentValue === "") {
            ui.setParticipantsPlaceholder("예) " + CONFIG.DEFAULT_PARTICIPANT_LIST);
        }
    }

    function updateDrawRankLabel() {
        const names = parseParticipants();
        const total = names.length > 0 ? names.length : 0;
        const previousValue = ui.getDrawRank();

        ui.updateDrawRankOptions(total, previousValue);

        // Restore saved rank if valid
        if (isNaN(previousValue)) {
            const savedDrawRank = localStorage.getItem(STORAGE_KEYS.DRAW_RANK);
            let valueToSelect = 1;
            if (savedDrawRank) {
                const savedRankNum = parseInt(savedDrawRank, 10);
                if (savedRankNum > 0 && savedRankNum <= total) {
                    valueToSelect = savedRankNum;
                } else if (savedRankNum > total) {
                    valueToSelect = total;
                }
            }
            ui.setDrawRank(valueToSelect);
        }
    }

    function parseParticipants() {
        const rawText = ui.getParticipantsInput();
        return rawText.split(",").map(name => name.trim()).filter(name => name.length > 0);
    }

    function getRandomColor() {
        return `hsl(${Math.random() * 360}, 70%, 75%)`;
    }

    function getRandomDarkColor() {
        const saturation = 40 + Math.random() * 15;
        const lightness = 30 + Math.random() * 15;
        return `hsl(${Math.random() * 360}, ${saturation}%, ${lightness}%)`;
    }

    // --- Core Logic ---

    function setupRace() {
        const drawDirection = ui.getDrawDirection();
        const names = parseParticipants();

        if (names.length === 0) {
            ui.showInputError("참가자를 1명 이상 입력해주세요!");
            return;
        }
        ui.clearInputError("예) " + CONFIG.DEFAULT_PARTICIPANT_LIST);

        if (typeof gtag === "function") {
            gtag("event", "setup_complete_race_ready", {
                participant_count: names.length,
                draw_direction: drawDirection,
                draw_rank: ui.getDrawRank(),
            });
        }

        ui.stopTitleDuckAnimation();
        ui.showRaceScreen();
        ui.clearRaceTrack();

        // Reset Speech Pools
        ui.resetSpeechPools();

        const participantsData = [];

        for (const name of names) {
            const fallProb = parseFloat((Math.random() * (CONFIG.PROBABILITIES.FALL_MAX - CONFIG.PROBABILITIES.FALL_MIN) + CONFIG.PROBABILITIES.FALL_MIN).toFixed(4));
            const boostProb = parseFloat((Math.random() * (CONFIG.PROBABILITIES.BOOST_MAX - CONFIG.PROBABILITIES.BOOST_MIN) + CONFIG.PROBABILITIES.BOOST_MIN).toFixed(4));
            const flyProb = parseFloat((Math.random() * CONFIG.PROBABILITIES.FLY_MAX).toFixed(4));
            const color = getRandomColor();
            const nameColor = getRandomDarkColor();

            const elements = ui.createParticipantElement(name, color, nameColor);

            participantsData.push({
                name: name,
                color: color,
                nameColor: nameColor,
                ...elements,
                speechTimer: null,
                currentRank: 0,
                previousRank: 0,
                fallProb: fallProb,
                boostProb: boostProb,
                flyProb: flyProb,
                boostCount: CONFIG.LIMITS.BOOST_INITIAL,
                flyCount: CONFIG.LIMITS.FLY_INITIAL,
                fallCount: CONFIG.LIMITS.FALL_LIMIT,
                boostProb: CONFIG.PROBABILITIES.BOOST_MAX,
                state: PARTICIPANT_STATE.RUNNING,
                position: 0,
                finishTime: 0,
                fallTimer: 0,
                graceTimer: 0,
                timeSinceLastFallCheck: 0,
                isBoosting: false,
                boostTimer: 0,
                isFlying: false,
                flyTimer: 0,
                superBoosterCount: CONFIG.LIMITS.SUPER_BOOSTER,
                distractionCount: CONFIG.LIMITS.DISTRACTION,
                confusionCount: CONFIG.LIMITS.CONFUSION,
                isSuperBoosting: false,
                isDistracted: false,
                isConfused: false,
                superBoosterTimer: 0,
                distractionTimer: 0,
                confusionTimer: 0,
            });
        }

        game.setupRace(participantsData, drawDirection, ui.getDrawRank());
        updateDrawRankLabel();
        ui.showRealStartOverlay();
    }


    function resetGame() {
        if (typeof gtag === "function") gtag("event", "return_to_setup");

        game.stopRaceLoop();
        ui.hideLeaderboard();
        ui.startTitleDuckAnimation();
        ui.showSetupScreen();
        ui.stopBGM();
        loadSettingsFromLocalStorage();
    }

    // --- App Start ---
    loadSettingsFromLocalStorage();
    ui.startTitleDuckAnimation();
});
