/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */

export const PARTICIPANT_STATE = {
    RUNNING: "running",
    STOPPED: "stopped",
    FINISHED: "finished",
    RECOVERING: "recovering",
    FALLING: "falling",
};

export const DRAW_DIRECTION = {
    FRONT: "front",
    BACK: "back",
};

export const STORAGE_KEYS = {
    PARTICIPANTS: "duckRaceParticipants",
    DRAW_DIRECTION: "duckRaceDrawDirection",
    DRAW_RANK: "duckRaceDrawRank",
    LANGUAGE: "duckRaceLanguage",
};

export const CAMERA_STATE = {
    IDLE: "idle",
    ZOOMING: "zooming",
    TRACKING: "tracking",
    PANNING: "panning",
    ZOOMING_OUT: "zooming-out",
};
