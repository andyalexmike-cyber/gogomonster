/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */
import { CONFIG } from './config.js';
import { PARTICIPANT_STATE, DRAW_DIRECTION } from './const.js';

export class Game {
    constructor(ui, camera) {
        this.ui = ui;
        this.camera = camera;

        // Game State
        this.participants = [];
        this.finishedDucks = [];
        this.gameInterval = null;
        this.targetWinners = [];

        this.drawDirection = DRAW_DIRECTION.FRONT;
        this.drawRank = 1;
        this.isRaceZoomEnabled = false;

        // Special Events Globals
        this.superBoosterCooldown = 0;
        this.globalSuperBoosterCount = 0;
        this.globalDistractionCount = 0;
        this.globalConfusionCount = 0;

        // Camera Lock Override
        this.lockOverrideTimer = 0;

        // Debug overlay (set externally)
        this.debugOverlay = null;
    }

    setupRace(participantsData, drawDirection, drawRank) {
        this.participants = participantsData;
        this.drawDirection = drawDirection;
        this.drawRank = drawRank;
        this.finishedDucks = [];
        this.targetWinners = [];

        // Reset Globals
        this.superBoosterCooldown = 0;
        this.globalSuperBoosterCount = 0;
        this.globalDistractionCount = 0;
        this.globalDistractionCount = 0;
        this.globalConfusionCount = 0;
        this.lockOverrideTimer = 0;

        this.camera.reset(true);
    }

    startRaceLoop() {
        this.isRaceZoomEnabled = false;
        setTimeout(() => {
            this.isRaceZoomEnabled = true;
        }, 900);

        this.camera.reset(true);
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.updateRace(), CONFIG.TICK_RATE);
    }

    stopRaceLoop() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }

    updateRace() {
        if (this.debugOverlay) this.debugOverlay.recordTick();

        const tickDuration = CONFIG.TICK_RATE;

        this.camera.resetRequest();

        if (this.superBoosterCooldown > 0) {
            this.superBoosterCooldown -= tickDuration;
        }

        if (this.lockOverrideTimer > 0) {
            this.lockOverrideTimer -= tickDuration;
            if (this.lockOverrideTimer <= 0) {
                // Force camera to accept the next lock request (priority 120)
                // by resetting the current priority which would be 121
                this.camera.targetPriority = 0;
            }
        }

        // LOOP 1: Physics and State Updates
        for (const p of this.participants) {
            if (p.state === PARTICIPANT_STATE.FINISHED || p.state === PARTICIPANT_STATE.STOPPED) continue;

            this.updateParticipantState(p, tickDuration);
            this.checkGimmicks(p, tickDuration);
            this.updateParticipantPosition(p, tickDuration);
            this.checkFinish(p);

            // Update UI for this participant (position, sprite, etc.)
            this.ui.updateParticipantVisuals(p);
        }

        // Rank Calculation
        this.updateRanks();
        this.updateTargetWinners();

        // LOOP 2: Camera Events & UI Rank Updates
        for (const p of this.participants) {
            this.ui.updateRankVisuals(p, this.drawDirection, this.drawRank, this.participants.length);
            this.checkCameraEvents(p);
            this.checkActiveGimmicks(p);
        }

        // Update Live Leaderboard
        this.ui.updateLeaderboard(this.participants, this.drawDirection, this.drawRank);

        // 70% Lock Logic
        this.checkSeventyPercentLock();

        // Update Camera
        const leadDuck = this.participants.length > 0 ? [...this.participants].sort((a, b) => this.compareParticipants(a, b))[0] : null;
        this.camera.update(tickDuration, leadDuck, this.targetWinners, this.isRaceZoomEnabled);

        // Check Race End
        this.checkRaceEnd();
    }

    updateParticipantState(p, tickDuration) {
        // Flying
        if (p.isFlying) {
            p.flyTimer -= tickDuration;
            if (p.flyTimer <= 0) {
                p.isFlying = false;
                this.ui.removeParticipantClass(p, "flying", "boosting");
                p.state = PARTICIPANT_STATE.RECOVERING;
                if (p.state !== PARTICIPANT_STATE.FALLING) {
                    p.spriteElement.src = p.isBoosting ? CONFIG.ASSETS.RUNNING : CONFIG.ASSETS.WALKING;
                }
            }
        }
        // Boosting
        if (p.isBoosting) {
            p.boostTimer -= tickDuration;
            if (p.boostTimer <= 0) {
                p.isBoosting = false;
                this.ui.removeParticipantClass(p, "boosting");
                if (p.state !== PARTICIPANT_STATE.FALLING) {
                    p.state = PARTICIPANT_STATE.RECOVERING;
                    p.graceTimer = CONFIG.DURATIONS.GRACE_RECOVER;
                    p.spriteElement.src = CONFIG.ASSETS.WALKING;
                }
            }
        }
        // Super Boosting
        if (p.isSuperBoosting) {
            p.superBoosterTimer -= tickDuration;
            if (p.superBoosterTimer <= 0) {
                p.isSuperBoosting = false;
                this.ui.removeParticipantClass(p, "super-boosting");
                p.state = PARTICIPANT_STATE.RECOVERING;
                p.graceTimer = CONFIG.DURATIONS.GRACE_RECOVER;
                p.spriteElement.src = CONFIG.ASSETS.WALKING;
            }
        }
        // Distracted
        if (p.isDistracted) {
            p.distractionTimer -= tickDuration;
            if (p.distractionTimer <= 0) {
                p.isDistracted = false;
                this.ui.removeParticipantClass(p, "distracted");
                if (!p.isFlying && !p.isBoosting && !p.isSuperBoosting && p.state !== PARTICIPANT_STATE.FALLING) {
                    p.spriteElement.src = CONFIG.ASSETS.WALKING;
                }
            }
        }
        // Confused
        if (p.isConfused) {
            p.confusionTimer -= tickDuration;
            if (p.confusionTimer <= 0) {
                this.endConfusion(p);
            }
            if (p.position < 10) {
                this.endConfusion(p);
            }
        }
        // Falling / Recovering
        if (p.state === PARTICIPANT_STATE.FALLING) {
            p.fallTimer -= tickDuration;
            if (p.fallTimer <= 0) {
                p.state = PARTICIPANT_STATE.RECOVERING;
                p.graceTimer = CONFIG.DURATIONS.GRACE_RECOVER;
                this.ui.removeParticipantClass(p, "falling");
                p.spriteElement.src = CONFIG.ASSETS.WALKING;
            }
        } else if (p.state === PARTICIPANT_STATE.RECOVERING) {
            p.graceTimer -= tickDuration;
            if (p.graceTimer <= 0) {
                p.state = PARTICIPANT_STATE.RUNNING;
                p.spriteElement.src = p.isBoosting && !p.isFlying ? CONFIG.ASSETS.RUNNING : CONFIG.ASSETS.WALKING;
            }
        }
    }

    endConfusion(p) {
        p.isConfused = false;
        p.confusionTimer = 0;
        this.ui.removeParticipantClass(p, "confused");
        if (!p.isFlying && !p.isBoosting && !p.isSuperBoosting && p.state !== PARTICIPANT_STATE.FALLING) {
            p.spriteElement.src = CONFIG.ASSETS.WALKING;
        }
        this.ui.showSpeech(p, "confusionEnd", 500);
    }

    checkGimmicks(p, tickDuration) {
        if (p.state === PARTICIPANT_STATE.FALLING) return;

        p.timeSinceLastFallCheck += tickDuration;
        if (p.timeSinceLastFallCheck >= CONFIG.GIMMICK_CHECK_INTERVAL) {
            p.timeSinceLastFallCheck = 0;

            const isTargetWinner = this.targetWinners.some(t => t.name === p.name);
            const isBusy = p.isFlying || p.isBoosting || p.isSuperBoosting || p.isDistracted || p.isConfused || p.state === PARTICIPANT_STATE.FALLING || p.state === PARTICIPANT_STATE.RECOVERING;

            let willSuperBoost = false, willDistract = false, willConfuse = false, willFly = false, willFall = false, willBoost = false;

            if (!isBusy) {
                // Randomize probabilities for this check
                const fallProb = Math.random() * (CONFIG.PROBABILITIES.FALL_MAX - CONFIG.PROBABILITIES.FALL_MIN) + CONFIG.PROBABILITIES.FALL_MIN;
                const boostProb = Math.random() * (CONFIG.PROBABILITIES.BOOST_MAX - CONFIG.PROBABILITIES.BOOST_MIN) + CONFIG.PROBABILITIES.BOOST_MIN;
                const flyProb = Math.random() * (CONFIG.PROBABILITIES.FLY_MAX - CONFIG.PROBABILITIES.FLY_MIN) + CONFIG.PROBABILITIES.FLY_MIN;

                if (p.superBoosterCount > 0 && this.globalSuperBoosterCount < CONFIG.GLOBAL_LIMITS.SUPER_BOOSTER && this.superBoosterCooldown <= 0 && this.canTriggerSuperBooster(p)) {
                    willSuperBoost = Math.random() < CONFIG.PROBABILITIES.SUPER_BOOSTER;
                }
                if (!willSuperBoost && p.distractionCount > 0 && this.canTriggerDistraction(p)) {
                    willDistract = Math.random() < CONFIG.PROBABILITIES.DISTRACTION;
                }
                if (!willSuperBoost && !willDistract && p.confusionCount > 0 && this.canTriggerConfusion(p)) {
                    willConfuse = Math.random() < CONFIG.PROBABILITIES.CONFUSION;
                }
                if (!willSuperBoost && !willDistract && !willConfuse && p.flyCount > 0) {
                    willFly = Math.random() < flyProb;
                }
                if (!willFly && !willSuperBoost && !willDistract && !willConfuse && p.fallCount > 0) {
                    willFall = Math.random() < fallProb;
                }
                if (!willFly && !willSuperBoost && !willDistract && !willConfuse && p.state === PARTICIPANT_STATE.RUNNING && p.boostCount > 0) {
                    willBoost = Math.random() < boostProb;
                }
            } else if (p.isBoosting && !p.isFlying && !p.isSuperBoosting && p.state !== PARTICIPANT_STATE.FALLING && p.state !== PARTICIPANT_STATE.RECOVERING && p.fallCount > 0) {
                const fallProb = Math.random() * (CONFIG.PROBABILITIES.FALL_MAX - CONFIG.PROBABILITIES.FALL_MIN) + CONFIG.PROBABILITIES.FALL_MIN;
                willFall = Math.random() < fallProb;
            }

            // Apply Effects
            if (willSuperBoost) {
                this.applySuperBoost(p);
            } else if (willDistract) {
                this.applyDistraction(p);
            } else if (willConfuse) {
                this.applyConfusion(p);
            } else if (willFly) {
                this.applyFly(p, isTargetWinner);
            } else if (willFall && !willBoost) {
                this.applyFall(p, isTargetWinner);
            } else if (willBoost) {
                this.applyBoost(p, isTargetWinner);
            }
        }
    }

    applySuperBoost(p) {
        p.isSuperBoosting = true;
        p.superBoosterTimer = CONFIG.DURATIONS.SUPER_BOOSTER;
        p.superBoosterCount--;
        this.globalSuperBoosterCount++;
        this.superBoosterCooldown = CONFIG.COOLDOWNS.SUPER_BOOSTER;
        this.ui.addParticipantClass(p, "super-boosting");
        p.state = PARTICIPANT_STATE.RUNNING;
        p.fallTimer = 0;
        p.graceTimer = CONFIG.DURATIONS.GRACE_SUPER_BOOSTER;
        this.ui.removeParticipantClass(p, "falling");
        p.spriteElement.src = CONFIG.ASSETS.RUNNING;
        this.ui.showSpeech(p, "superBoosting", CONFIG.DURATIONS.SUPER_BOOSTER);

        if (this.camera.isSeventyPercentLockActive) {
            this.lockOverrideTimer = 1000;
            // Priority 121 to override the 70% lock (120)
            this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT + 1, "Super Booster Activated (Override)!");
        } else {
            this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.SUPER_BOOSTER, "Super Booster Activated!");
        }
    }

    applyDistraction(p) {
        p.isDistracted = true;
        p.distractionTimer = CONFIG.DURATIONS.DISTRACTION;
        p.distractionCount--;
        this.globalDistractionCount++;
        this.ui.addParticipantClass(p, "distracted");
        this.ui.removeParticipantClass(p, "boosting", "super-boosting", "flying");
        p.spriteElement.src = CONFIG.ASSETS.WALKING;
        this.ui.showSpeech(p, "distraction", CONFIG.DURATIONS.DISTRACTION);

        if (this.camera.isSeventyPercentLockActive) {
            this.lockOverrideTimer = 1000;
            this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT + 1, "Distracted Duck (Override)");
        } else {
            this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.DISTRACTION, "Distracted Duck");
        }
    }

    applyConfusion(p) {
        p.isConfused = true;
        p.confusionTimer = CONFIG.DURATIONS.CONFUSION;
        p.confusionCount--;
        this.globalConfusionCount++;
        this.ui.addParticipantClass(p, "confused");
        this.ui.removeParticipantClass(p, "boosting", "super-boosting", "flying");
        p.spriteElement.src = CONFIG.ASSETS.WALKING;
        this.ui.showSpeech(p, "confusion", CONFIG.DURATIONS.CONFUSION);

        if (this.camera.isSeventyPercentLockActive) {
            this.lockOverrideTimer = 1000;
            this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT + 1, "Confused Duck (Override)");
        } else {
            this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.CONFUSION, "Confused Duck");
        }
    }

    applyFly(p, isTargetWinner) {
        p.isFlying = true;
        p.flyTimer = CONFIG.DURATIONS.FLY;
        p.flyCount--;
        this.ui.addParticipantClass(p, "flying");
        p.isBoosting = false;
        p.boostTimer = 0;
        p.state = PARTICIPANT_STATE.RUNNING;
        p.fallTimer = 0;
        p.graceTimer = 0;
        this.ui.removeParticipantClass(p, "falling");
        p.spriteElement.src = CONFIG.ASSETS.JUMPING;
        this.ui.showSpeech(p, "flying", CONFIG.DURATIONS.FLY);
        if (!this.camera.isSeventyPercentLockActive) {
            if (isTargetWinner && p.position > CONFIG.THRESHOLDS.FLY_MIN_POS) this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.FLY.TARGET_MID, "Target Fly Mid");
            else if (p.currentRank <= CONFIG.THRESHOLDS.FLY_TOP_RANK) this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.FLY.TOP_RANK, "Top 5 Fly");
        }
    }

    applyFall(p, isTargetWinner) {
        p.state = PARTICIPANT_STATE.FALLING;
        p.fallTimer = CONFIG.DURATIONS.FALL;
        p.fallCount--;
        this.ui.addParticipantClass(p, "falling");
        p.spriteElement.src = CONFIG.ASSETS.IDLE;
        this.ui.showSpeech(p, "resting", CONFIG.DURATIONS.FALL);
        if (!this.camera.isSeventyPercentLockActive) {
            if (isTargetWinner) {
                if (p.currentRank <= CONFIG.THRESHOLDS.FALL_TOP_RANK && p.position > CONFIG.THRESHOLDS.FALL_MIN_POS) this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.FALL.TARGET_TOP_RANK, "Target Top Rank Fall");
                else if (p.position > CONFIG.THRESHOLDS.FALL_MID_POS) this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.FALL.TARGET_MID, "Target Fall Mid");
            } else if (p.currentRank <= 5) {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.FALL.TOP_RANK, "Top 5 Fall");
            }
        }
    }

    applyBoost(p, isTargetWinner) {
        p.isBoosting = true;
        p.boostTimer = CONFIG.DURATIONS.BOOST;
        p.boostCount--;
        p.boostProb = Math.max(0, p.boostProb - 1);
        this.ui.addParticipantClass(p, "boosting");
        p.state = PARTICIPANT_STATE.RECOVERING;
        p.graceTimer = CONFIG.DURATIONS.GRACE_BOOST;
        p.spriteElement.src = CONFIG.ASSETS.RUNNING;
        this.ui.showSpeech(p, "boosting", 1500);
        if (!this.camera.isSeventyPercentLockActive) {
            if (isTargetWinner && p.position > CONFIG.THRESHOLDS.BOOST_MIN_POS) this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.BOOST.TARGET_MID, "Target Boost Mid");
            else if (p.currentRank <= CONFIG.THRESHOLDS.BOOST_TOP_RANK) this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.BOOST.TOP_RANK, "Top 5 Boost");
        }
    }

    updateParticipantPosition(p, tickDuration) {
        if (p.state === PARTICIPANT_STATE.FALLING) return;

        let multiplier = CONFIG.MULTIPLIERS.NORMAL;
        if (p.isSuperBoosting) multiplier = CONFIG.MULTIPLIERS.SUPER_BOOSTER;
        else if (p.isDistracted) multiplier = CONFIG.MULTIPLIERS.DISTRACTION;
        else if (p.isConfused) multiplier = CONFIG.MULTIPLIERS.CONFUSION;
        else if (p.isFlying) multiplier = CONFIG.MULTIPLIERS.FLY;
        else if (p.isBoosting) multiplier = CONFIG.MULTIPLIERS.BOOST;

        p.position += CONFIG.BASE_SPEED_PER_MS * tickDuration * multiplier;
        if (p.position < 0) p.position = 0;
    }

    checkFinish(p) {
        if (p.position >= CONFIG.FINISH_LINE_POS && p.state !== PARTICIPANT_STATE.FINISHED) {
            p.state = PARTICIPANT_STATE.FINISHED;
            p.finishTime = Date.now();
            p.position = CONFIG.FINISH_LINE_POS;

            this.finishedDucks.push(p);
            p.currentRank = this.finishedDucks.length;

            this.ui.handleFinish(p); // Visuals for finish
        }
    }

    compareParticipants(a, b) {
        // 1. Finished ducks always ahead of non-finished
        if (a.state === PARTICIPANT_STATE.FINISHED && b.state !== PARTICIPANT_STATE.FINISHED) return -1;
        if (a.state !== PARTICIPANT_STATE.FINISHED && b.state === PARTICIPANT_STATE.FINISHED) return 1;

        // 2. If both finished, sort by finish order (index in finishedDucks)
        if (a.state === PARTICIPANT_STATE.FINISHED && b.state === PARTICIPANT_STATE.FINISHED) {
            return this.finishedDucks.indexOf(a) - this.finishedDucks.indexOf(b);
        }

        // 3. If neither finished, sort by position (higher is better)
        return b.position - a.position;
    }

    updateRanks() {
        const rankedList = [...this.participants].sort((a, b) => this.compareParticipants(a, b));
        rankedList.forEach((p, index) => {
            p.previousRank = p.currentRank;
            p.currentRank = index + 1;
        });
    }

    updateTargetWinners() {
        const total = this.participants.length;
        const sortedParticipants = [...this.participants].sort((a, b) => this.compareParticipants(a, b));

        if (this.drawDirection === DRAW_DIRECTION.FRONT) {
            this.targetWinners = sortedParticipants.slice(0, this.drawRank);
        } else {
            // For "back", we want the last N ranks.
            // Since sortedParticipants is 1st..Last, we take the end of the array.
            // However, we need to be careful: "Back" winners are those with the *highest* rank numbers (worst performance).
            // But the user might expect "Back" winners to be determined by who is *currently* last.
            // The original logic was:
            // const firstLoserRank = total - this.drawRank + 1;
            // this.targetWinners = this.participants.filter(p => p.currentRank >= firstLoserRank)...

            // Let's stick to the rank-based logic which is robust now that ranks are correct.
            const firstLoserRank = total - this.drawRank + 1;
            this.targetWinners = this.participants
                .filter(p => p.currentRank >= firstLoserRank)
                .sort((a, b) => a.currentRank - b.currentRank);
        }
    }

    checkCameraEvents(p) {
        if (!this.camera.isSeventyPercentLockActive && p.state !== PARTICIPANT_STATE.FINISHED && p.state !== PARTICIPANT_STATE.STOPPED) {
            if (p.previousRank > p.currentRank) { // Overtake
                const isTargetWinner = this.targetWinners.some(t => t.name === p.name);
                const isTargetLead = isTargetWinner && this.targetWinners.length > 0 && this.targetWinners[0].name === p.name;

                if (isTargetLead && p.position > CONFIG.THRESHOLDS.OVERTAKE_LEAD_POS) {
                    this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.OVERTAKE.TARGET_LEAD_MID, "Target Overtake Lead Mid");
                } else if (p.currentRank <= CONFIG.THRESHOLDS.OVERTAKE_TOP_RANK && p.position > CONFIG.THRESHOLDS.OVERTAKE_TOP_POS) {
                    this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.OVERTAKE.TOP_RANK, "Top 5 Overtake");
                }
            }
        }
    }

    checkSeventyPercentLock() {
        if (this.lockOverrideTimer > 0) return;

        // Find the first target winner that hasn't finished yet
        const activeTarget = this.targetWinners.find(p => p.state !== PARTICIPANT_STATE.FINISHED && p.state !== PARTICIPANT_STATE.STOPPED);

        if (!this.camera.isSeventyPercentLockActive && activeTarget && activeTarget.position >= CONFIG.THRESHOLDS.LOCK_POS) {
            this.camera.isSeventyPercentLockActive = true;
            this.camera.lockTargetIndex = this.targetWinners.indexOf(activeTarget);
            this.camera.requestZoom(activeTarget, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT, "Target 70% Lock Start");
        } else if (this.camera.isSeventyPercentLockActive) {
            if (activeTarget) {
                this.camera.requestZoom(activeTarget, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT, "Target 70% Lock Active");
            } else {
                // All targets finished, release lock (Camera handles this too, but good to stop requesting)
                this.camera.isSeventyPercentLockActive = false;
            }
        }
    }

    checkRaceEnd() {
        let shouldEnd = false;
        const total = this.participants.length;
        const finishedCount = this.finishedDucks.length;
        const unfinishedCount = total - finishedCount;

        if (this.drawDirection === DRAW_DIRECTION.FRONT) {
            if (finishedCount >= this.drawRank) shouldEnd = true;
        } else {
            if (unfinishedCount <= 1) shouldEnd = true;
        }
        if (finishedCount === total) shouldEnd = true;

        if (shouldEnd) {
            this.stopRaceLoop();
            this.camera.reset(true);
            this.ui.hideLeaderboard();

            for (const p of this.participants) {
                if (p.state !== PARTICIPANT_STATE.FINISHED) {
                    p.state = PARTICIPANT_STATE.STOPPED;
                    p.spriteElement.src = CONFIG.ASSETS.WALKING;
                    this.ui.resetRankVisuals(p);
                }
                this.ui.removeParticipantClass(p, "boosting", "flying");
            }

            setTimeout(() => this.ui.showResults(this.finishedDucks, this.participants, this.drawDirection, this.drawRank, this.camera), 500);
        }
    }

    // Helper Predicates
    canTriggerSuperBooster(duck) {
        const leaderPosition = Math.max(...this.participants.map(p => p.position));
        if (leaderPosition < CONFIG.THRESHOLDS.SUPER_BOOSTER_LEADER_POS) return false;
        if (duck.position < CONFIG.THRESHOLDS.SUPER_BOOSTER_MIN_POS) return false;

        if (this.drawDirection === DRAW_DIRECTION.FRONT) {
            if (this.finishedDucks.length >= this.drawRank) return false;
            return duck.currentRank > this.drawRank;
        } else {
            const remaining = this.participants.length - this.finishedDucks.length;
            if (remaining < this.drawRank) return false;
            const cutoff = this.participants.length - this.drawRank;
            return duck.currentRank > cutoff;
        }
    }

    canTriggerDistraction(duck) {
        if (duck.position < CONFIG.THRESHOLDS.DISTRACTION_MIN_POS) return false;
        if (this.drawDirection === "front") {
            return duck.currentRank <= this.drawRank;
        } else {
            const cutoff = this.participants.length - this.drawRank;
            return duck.currentRank <= cutoff;
        }
    }

    canTriggerConfusion(duck) {
        if (duck.position < CONFIG.THRESHOLDS.CONFUSION_MIN_POS || duck.position > CONFIG.THRESHOLDS.CONFUSION_MAX_POS) return false;
        if (duck.position < CONFIG.THRESHOLDS.CONFUSION_MIN_POS || duck.position > CONFIG.THRESHOLDS.CONFUSION_MAX_POS) return false;

        if (this.drawDirection === DRAW_DIRECTION.FRONT) {
            if (duck.currentRank > this.drawRank) return false;
        } else {
            if (duck.currentRank > this.drawRank) return false;
        }
        return true;
    }

    checkActiveGimmicks(p) {
        if (p.state === PARTICIPANT_STATE.FINISHED || p.state === PARTICIPANT_STATE.STOPPED) return;

        if (p.isSuperBoosting) {
            if (this.camera.isSeventyPercentLockActive) {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT + 1, "Super Booster (Override)");
            } else {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.SUPER_BOOSTER, "Super Booster");
            }
        } else if (p.isDistracted) {
            if (this.camera.isSeventyPercentLockActive) {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT + 1, "Distracted Duck (Override)");
            } else {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.DISTRACTION, "Distracted Duck");
            }
        } else if (p.isConfused) {
            if (this.camera.isSeventyPercentLockActive) {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.LOCK_70_PERCENT + 1, "Confused Duck (Override)");
            } else {
                this.camera.requestZoom(p, CONFIG.CAMERA_ZOOM.CONFUSION, "Confused Duck");
            }
        }
    }
}
