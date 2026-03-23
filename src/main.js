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
import { DebugOverlay } from './debug-overlay.js';
import { initI18n, t, getLang, setLang, switchLang } from './i18n.js';

document.addEventListener("DOMContentLoaded", () => {
    // --- Initialization ---
    initI18n();
    const ui = new UI();

    // Preload assets immediately
    ui.preloadAssets();

    const camera = new Camera(ui.mainUiContainer);
    const game = new Game(ui, camera);

    // Debug overlay (activate with #debug in URL)
    const debugOverlay = new DebugOverlay(camera, ui.mainUiContainer);
    debugOverlay.init();
    game.debugOverlay = debugOverlay;

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

    // --- Language Toggle ---
    const langBtnEn = document.getElementById("lang-btn-en");
    const langBtnKo = document.getElementById("lang-btn-ko");

    function updateLangButtons() {
        const lang = getLang();
        if (lang === 'en') {
            langBtnEn.className = "px-2 py-1 transition-colors bg-cyan-500 text-white font-bold";
            langBtnKo.className = "px-2 py-1 transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100";
        } else {
            langBtnKo.className = "px-2 py-1 transition-colors bg-cyan-500 text-white font-bold";
            langBtnEn.className = "px-2 py-1 transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100";
        }
    }
    updateLangButtons();

    langBtnEn.addEventListener("click", () => switchLang('en'));
    langBtnKo.addEventListener("click", () => switchLang('ko'));

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
                ui.setParticipantsPlaceholder(t('placeholder.example', t('default.participants')));
            }
        } else {
            const defaultList = t('default.participants');
            ui.setParticipantsInput(defaultList);
            localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, defaultList);
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
            ui.setParticipantsPlaceholder(t('placeholder.example', t('default.participants')));
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
            ui.showInputError(t('error.noParticipants'));
            return;
        }
        ui.clearInputError(t('placeholder.example', t('default.participants')));

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
