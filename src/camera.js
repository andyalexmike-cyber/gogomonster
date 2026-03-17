/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */
import { CONFIG } from './config.js';
import { CAMERA_STATE, PARTICIPANT_STATE } from './const.js';

export class Camera {
    constructor(uiContainer) {
        this.uiContainer = uiContainer;
        this.state = CAMERA_STATE.IDLE; // 'idle', 'zooming', 'tracking', 'panning', 'zooming-out'
        this._target = null; // Internal target
        this.targetPriority = 0; // Priority of the current target
        this.timer = 0; // ms
        this.currentRequest = { target: null, priority: 0, reason: "" }; // The highest priority zoom request per tick
        this.zoomCooldownTimer = 0; // Cooldown timer for zooming before 70%
        this.lockTargetIndex = -1; // -1: inactive, 0~: index of targetWinners
        this.pendingZoomRequest = null; // Next camera request to switch to after zooming out
        this.isSeventyPercentLockActive = false;
        this.minHoldTimer = 0;
        this.lastFrameRequest = { target: null, priority: 0, reason: "" }; // Track previous frame's winner

    }

    get target() {
        return this._target;
    }

    set target(value) {
        if (this._target !== value) {
            const wasSpotlightActive = this._target && this._target.element.classList.contains("camera-focus");
            if (this._target) this._target.element.classList.remove("camera-focus");
            this._target = value;
            if (wasSpotlightActive && this._target) this._target.element.classList.add("camera-focus");
        }
    }

    reset(isHardReset) {
        this.state = CAMERA_STATE.IDLE;
        this.target = null;
        this.targetPriority = 0;
        this.timer = 0;
        this.zoomCooldownTimer = 0;

        this.minHoldTimer = 0;
        this.lastFrameRequest = { target: null, priority: 0, reason: "" };

        if (isHardReset) {
            this.lockTargetIndex = -1;
            this.isSeventyPercentLockActive = false;
            this.uiContainer.style.transition = "none";
        } else {
            this.uiContainer.style.transition = `transform ${CONFIG.ZOOM_OUT_DURATION / 1000}s ease-in-out`;
        }
        this.uiContainer.style.transform = "translate(0px, 0px) scale(1)";
        this._hideSpotlight();
    }

    requestZoom(target, priority, reason) {
        if (priority > this.currentRequest.priority) {
            this.currentRequest = { target, priority, reason };
        }
    }

    update(tickDuration, leadDuck, targetWinners, isRaceZoomEnabled) {
        // Reset current request at the start of update (handled by caller usually, but good to be safe or managed here if we move the reset here)
        // Actually, the caller (Game) resets currentRequest before checking logic. 
        // But since we moved state here, we should handle the reset of currentRequest at the end of the tick or start.
        // Let's assume the Game class calls `resetRequest()` at the start of the tick.

        const leadPosition = leadDuck ? leadDuck.position : 0;

        if (this.zoomCooldownTimer > 0) {
            this.zoomCooldownTimer -= tickDuration;
        }

        if (this.state === CAMERA_STATE.IDLE) {
            if (this.pendingZoomRequest) {
                this.currentRequest = this.pendingZoomRequest;
                this.pendingZoomRequest = null;
            }

            if (!isRaceZoomEnabled) return;
            if (leadPosition < 70 && this.zoomCooldownTimer > 0) return;
            if (this.currentRequest.priority === 0) return;

            this.target = this.currentRequest.target;
            this.targetPriority = this.currentRequest.priority;
            this.state = CAMERA_STATE.ZOOMING;
            this.timer = CONFIG.ZOOM_DURATION;
            this.uiContainer.style.transition = `transform ${CONFIG.ZOOM_DURATION / 1000}s ease-in-out`;
            this.applyTransform();
            this._showSpotlight();
            return;
        }

        if (this.state === CAMERA_STATE.ZOOMING || this.state === CAMERA_STATE.TRACKING) {
            const newRequestIsHigher = this.currentRequest.priority > this.targetPriority;
            const is70PercentSwitch = this.isSeventyPercentLockActive &&
                this.currentRequest.priority === this.targetPriority &&
                this.currentRequest.target !== this.target;

            // Optimization: If target is same, just update priority and timer, don't switch state (avoid phantom panning)
            if (newRequestIsHigher && this.currentRequest.target === this.target) {
                this.targetPriority = this.currentRequest.priority;
                // If we are tracking, we might want to extend the timer if priority is high enough
                if (this.state === CAMERA_STATE.TRACKING && this.targetPriority >= 110) {
                    this.timer = Math.max(this.timer, CONFIG.LONG_TRACK_DURATION);
                }
                return;
            }

            // Only check for switch if we are tracking (stable) and hold time has passed
            if (this.state === CAMERA_STATE.TRACKING) {
                if (this.minHoldTimer > 0) {
                    this.minHoldTimer -= tickDuration;
                }

                if ((newRequestIsHigher || is70PercentSwitch) && this.minHoldTimer <= 0) {
                    if (this.isSeventyPercentLockActive) {
                        // Special case for 70% lock override return or switch
                        // If we are overriding, we might want to pan back if possible, 
                        // but the requirement says "zoom in 200ms maintain -> move zoom"
                        // If we are just switching targets, we can pan.

                        this.target = this.currentRequest.target;
                        this.targetPriority = this.currentRequest.priority;
                        this.state = CAMERA_STATE.PANNING;
                        this.timer = 500;
                        this.uiContainer.style.transition = `transform 0.5s ease-in-out`;
                        this.applyTransform();
                    } else {
                        this.target = this.currentRequest.target;
                        this.targetPriority = this.currentRequest.priority;
                        this.state = CAMERA_STATE.PANNING;
                        this.timer = 500;
                        this.uiContainer.style.transition = `transform 0.5s ease-in-out`;
                        this.applyTransform();
                    }
                    return;
                } else if (newRequestIsHigher || is70PercentSwitch) {
                }
            }

            if (this.state === CAMERA_STATE.ZOOMING) {
                this.timer -= tickDuration;
                if (this.timer <= 0) {
                    this.state = CAMERA_STATE.TRACKING;
                    this.timer = this.targetPriority >= 110 ? CONFIG.LONG_TRACK_DURATION : CONFIG.SHORT_TRACK_DURATION;
                    this.minHoldTimer = CONFIG.MIN_ZOOM_HOLD_DURATION;
                    this.uiContainer.style.transition = "none";
                }
                // Do not allow switching while zooming
                this.applyTransform();
                return;
            }

            if (this.state === CAMERA_STATE.TRACKING) {
                // Refresh timer if we are still targeting the same thing with high priority
                if (this.currentRequest.target === this.target && this.currentRequest.priority >= this.targetPriority) {
                    this.timer = Math.max(this.timer, this.targetPriority >= 110 ? CONFIG.LONG_TRACK_DURATION : CONFIG.SHORT_TRACK_DURATION);
                }

                this.timer -= tickDuration;

                if ((this.target.state === PARTICIPANT_STATE.FINISHED || this.target.state === PARTICIPANT_STATE.STOPPED) && this.minHoldTimer <= 0) {

                    let nextTarget = null;
                    if (this.isSeventyPercentLockActive) {
                        nextTarget = targetWinners.find(
                            (p) => p.state !== PARTICIPANT_STATE.FINISHED && p.state !== PARTICIPANT_STATE.STOPPED,
                        );
                    }

                    if (nextTarget) {
                        this.target = nextTarget;
                        this.targetPriority = 120;
                        this.state = CAMERA_STATE.PANNING;
                        this.timer = 500;
                        this.uiContainer.style.transition = `transform 0.5s ease-in-out`;
                        this.applyTransform();
                    } else {
                        this.isSeventyPercentLockActive = false;
                        this.lockTargetIndex = -1;
                        this.state = CAMERA_STATE.ZOOMING_OUT;
                        this.timer = CONFIG.ZOOM_OUT_DURATION;
                        this.uiContainer.style.transition = `transform ${CONFIG.ZOOM_OUT_DURATION / 1000}s ease-in-out`;
                        this.uiContainer.style.transform = "translate(0px, 0px) scale(1)";
                        this._hideSpotlight();
                    }
                } else if (this.timer <= 0) {
                    this.state = CAMERA_STATE.ZOOMING_OUT;
                    this.timer = CONFIG.ZOOM_OUT_DURATION;
                    this.uiContainer.style.transition = `transform ${CONFIG.ZOOM_OUT_DURATION / 1000}s ease-in-out`;
                    this.uiContainer.style.transform = "translate(0px, 0px) scale(1)";
                    this._hideSpotlight();
                }
            }
            this.applyTransform();
            return;
        } else if (this.state === CAMERA_STATE.PANNING) {
            this.timer -= tickDuration;
            if (this.timer <= 0) {
                this.state = CAMERA_STATE.TRACKING;
                this.timer = this.targetPriority >= 110 ? CONFIG.LONG_TRACK_DURATION : CONFIG.SHORT_TRACK_DURATION;
                this.minHoldTimer = CONFIG.MIN_PAN_HOLD_DURATION;
                this.uiContainer.style.transition = "none";
            }
            return;
        }
        if (this.state === CAMERA_STATE.ZOOMING_OUT) {
            this.timer -= tickDuration;

            if (this.currentRequest.priority >= 120) {
                // If we are zooming out and a high priority request comes in, 
                // we generally want to finish zooming out to reset, OR we could intercept.
                // But for stability, let's finish zooming out unless it's critical.
                // Actually, if we are zooming out, we are usually resetting.
                // Let's stick to the plan: prevent switching during transitions.
                // So we do NOTHING here and let it finish zooming out.
            }

            if (this.timer <= 0) {
                if (!this.isSeventyPercentLockActive) {
                    this.lockTargetIndex = -1;
                }
                this.reset(false);
                if (leadPosition < 70) {
                    this.zoomCooldownTimer = CONFIG.ZOOM_COOLDOWN_DURATION;
                }
            }
            return;
        }
    }

    _showSpotlight() {
        if (this.target) this.target.element.classList.add("camera-focus");
    }

    _hideSpotlight() {
        if (this._target) this._target.element.classList.remove("camera-focus");
    }

    /**
     * Get element's untransformed position relative to the container using offsetLeft/offsetTop chain.
     * These properties are not affected by CSS transforms, avoiding feedback loops.
     */
    _getPositionInContainer(element) {
        let x = 0, y = 0;
        let el = element;
        while (el && el !== this.uiContainer) {
            x += el.offsetLeft;
            y += el.offsetTop;
            el = el.offsetParent;
        }
        return { x, y };
    }

    /**
     * Get element's untransformed position on the page using offsetLeft/offsetTop chain.
     */
    _getPagePosition(element) {
        let x = 0, y = 0;
        let el = element;
        while (el) {
            x += el.offsetLeft;
            y += el.offsetTop;
            el = el.offsetParent;
        }
        return { x, y };
    }

    applyTransform() {
        if (!this.target) return;

        const scale = CONFIG.IN_RACE_ZOOM_SCALE;

        // Use offset properties (unaffected by CSS transforms) to get untransformed positions
        const duckPos = this._getPositionInContainer(this.target.element);
        const duckCenterX = duckPos.x + this.target.element.offsetWidth / 2;
        const duckCenterY = duckPos.y + this.target.element.offsetHeight / 2;

        // Transform origin (default: 50% 50% = center of element)
        const originX = this.uiContainer.offsetWidth / 2;
        const originY = this.uiContainer.offsetHeight / 2;

        // Container's untransformed page position
        const containerPos = this._getPagePosition(this.uiContainer);

        // Viewport center in container's untransformed coordinate system
        const vpCenterInContainerX = window.scrollX + window.innerWidth / 2 - containerPos.x;
        const vpCenterInContainerY = window.scrollY + window.innerHeight / 2 - containerPos.y;

        // Correct translation: accounts for both scale and scroll position
        // Visual position of point P = origin + scale*(P - origin) + translate
        // Solving for translate to place duck at viewport center:
        const translateX = (vpCenterInContainerX - originX) + scale * (originX - duckCenterX);
        const translateY = (vpCenterInContainerY - originY) + scale * (originY - duckCenterY);

        this.uiContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    applyZoomToWinnerTransform(participant) {
        if (!participant) return;

        this.uiContainer.style.transformOrigin = "0 0";

        const scale = CONFIG.HIGHLIGHT_ZOOM_SCALE;

        // Use offset properties for untransformed positions
        const duckPos = this._getPositionInContainer(participant.element);
        const duckCenterX = duckPos.x + participant.element.offsetWidth / 2;
        const duckCenterY = duckPos.y + participant.element.offsetHeight / 2;

        // Container's untransformed page position
        const containerPos = this._getPagePosition(this.uiContainer);

        // Viewport center in container's untransformed coordinate system
        const vpCenterInContainerX = window.scrollX + window.innerWidth / 2 - containerPos.x;
        const vpCenterInContainerY = window.scrollY + window.innerHeight / 2 - containerPos.y;

        const t1x = -duckCenterX;
        const t1y = -duckCenterY;
        const t2x = vpCenterInContainerX;
        const t2y = vpCenterInContainerY;

        this.uiContainer.style.transform = `translate(${t2x}px, ${t2y}px) scale(${scale}) translate(${t1x}px, ${t1y}px)`;
    }

    resetRequest() {
        // Check for changes before resetting
        const current = this.currentRequest;
        const last = this.lastFrameRequest;

        const isTargetChanged = current.target !== last.target;
        const isPriorityChanged = current.priority !== last.priority;
        const isReasonChanged = current.reason !== last.reason;

        this.lastFrameRequest = { ...this.currentRequest };
        this.currentRequest = { target: null, priority: 0, reason: "" };
    }
}
