/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */
export const CONFIG = {
    // --- Game Constants ---
    // 게임 루프의 틱 레이트 (ms). 50ms는 초당 20프레임에 해당합니다.
    TICK_RATE: 50,

    // 기믹(추락, 부스터 등) 발동 조건을 체크하는 간격 (ms).
    GIMMICK_CHECK_INTERVAL: 250,

    // 기본 경주 소요 시간 (ms).
    BASE_RACE_TIME: 20000,

    // 결승선 위치 (%). 100%가 아닌 105%로 설정하여 결승선을 확실히 통과하도록 함.
    FINISH_LINE_POS: 105,

    // 1ms당 기본 이동 속도 (%/ms).
    BASE_SPEED_PER_MS: 105 / 20000,

    // --- Camera Constants ---
    // 70% 지점 도달 전, 줌 아웃 후 다음 줌까지의 쿨타임 (ms).
    ZOOM_COOLDOWN_DURATION: 1000,

    // 경주 중 줌 인 했을 때의 확대 배율.
    IN_RACE_ZOOM_SCALE: 1.3,

    // 결과 화면에서 우승자를 강조할 때의 확대 배율.
    HIGHLIGHT_ZOOM_SCALE: 2,

    // 경주 중 줌 인에 걸리는 시간 (ms).
    ZOOM_DURATION: 300,

    // 경주 중 줌 아웃에 걸리는 시간 (ms).
    ZOOM_OUT_DURATION: 200,

    // 결과 화면에서 우승자 강조 줌 인에 걸리는 시간 (ms).
    HIGHLIGHT_ZOOM_DURATION: 400,

    // 결과 화면에서 우승자 강조 줌 아웃에 걸리는 시간 (ms).
    HIGHLIGHT_ZOOM_OUT_DURATION: 400,

    // 우선순위가 높은(110 이상) 타겟을 트래킹하는 지속 시간 (ms).
    LONG_TRACK_DURATION: 2000,

    // 일반적인 타겟을 트래킹하는 지속 시간 (ms).
    SHORT_TRACK_DURATION: 1500,

    // 줌 상태를 유지해야 하는 최소 시간 (ms). 이 시간 동안은 더 높은 우선순위 요청이 와도 전환되지 않음(패닝 제외).
    MIN_ZOOM_HOLD_DURATION: 1300,

    // 패닝 후 대상을 유지해야 하는 최소 시간 (ms).
    MIN_PAN_HOLD_DURATION: 1700,

    CAMERA_ZOOM: {
        // 슈퍼 부스터 발동 시 카메라 우선순위.
        SUPER_BOOSTER: 85,

        // 딴짓하기 발동 시 카메라 우선순위.
        DISTRACTION: 70,

        // 혼란 발동 시 카메라 우선순위.
        CONFUSION: 73,

        FLY: {
            // 타겟 우승자가 날기 사용 시 카메라 우선순위.
            TARGET_MID: 55,
            // 상위권(Top 5)이 날기 사용 시 카메라 우선순위.
            TOP_RANK: 35,
        },
        FALL: {
            // 타겟 우승자가 넘어졌을 때(상위권) 카메라 우선순위.
            TARGET_TOP_RANK: 60,
            // 타겟 우승자가 넘어졌을 때(중위권) 카메라 우선순위.
            TARGET_MID: 50,
            // 상위권(Top 5)이 넘어졌을 때 카메라 우선순위.
            TOP_RANK: 30,
        },
        BOOST: {
            // 타겟 우승자가 부스트 사용 시 카메라 우선순위.
            TARGET_MID: 55,
            // 상위권(Top 5)이 부스트 사용 시 카메라 우선순위.
            TOP_RANK: 35,
        },
        OVERTAKE: {
            // 타겟 우승자가 선두를 추월할 때 카메라 우선순위.
            TARGET_LEAD_MID: 75,
            // 상위권(Top 5) 내에서 추월 발생 시 카메라 우선순위.
            TOP_RANK: 70,
        },
        // 70% 지점 이후 선두 고정 카메라 우선순위. 가장 높게 설정되어 있음.
        LOCK_70_PERCENT: 120,
    },

    // --- Balance Constants ---
    PROBABILITIES: {
        // 슈퍼 부스터 발동 확률
        SUPER_BOOSTER: 0.02,
        // 딴짓하기 발동 확률
        DISTRACTION: 0.1,
        // 혼란 발동 확률
        CONFUSION: 0.06,
        // 넘어짐 최소 확률
        FALL_MIN: 0.05,
        // 넘어짐 최대 확률
        FALL_MAX: 0.15,
        // 부스트 최소 확률
        BOOST_MIN: 0.02,
        // 부스트 최대 확률
        BOOST_MAX: 0.10,
        // 날기 최소 확률
        FLY_MIN: 0.02,
        // 날기 최대 확률
        FLY_MAX: 0.10,
    },
    DURATIONS: {
        // 슈퍼 부스터 지속 시간 (ms).
        SUPER_BOOSTER: 3200,
        // 딴짓하기 지속 시간 (ms).
        DISTRACTION: 2000,
        // 혼란 지속 시간 (ms).
        CONFUSION: 1800,
        // 날기 지속 시간 (ms).
        FLY: 2000,
        // 넘어짐 지속 시간 (ms).
        FALL: 2000,
        // 부스트 지속 시간 (ms).
        BOOST: 2000,
        // 슈퍼 부스터 종료 후 회복(무적) 시간 (ms).
        GRACE_SUPER_BOOSTER: 1000,
        // 일반 상태 회복(넘어짐/부스트 등 종료 후) 시간 (ms).
        GRACE_RECOVER: 500,
        // 부스트 종료 후 회복 시간 (ms).
        GRACE_BOOST: 900,
    },
    COOLDOWNS: {
        // 슈퍼 부스터 재사용 대기 시간 (ms).
        SUPER_BOOSTER: 2000,
    },
    LIMITS: {
        // 오리당 슈퍼 부스터 사용 가능 횟수.
        SUPER_BOOSTER: 1,
        // 오리당 딴짓하기 사용 가능 횟수.
        DISTRACTION: 1,
        // 오리당 혼란 사용 가능 횟수.
        CONFUSION: 1,
        // 오리당 부스트 초기 소지 횟수.
        BOOST_INITIAL: 3,
        // 오리당 날기 초기 소지 횟수.
        FLY_INITIAL: 1,
        // 오리당 넘어짐 최대 횟수.
        FALL_LIMIT: 5,
    },
    GLOBAL_LIMITS: {
        // 전체 경기에서 슈퍼 부스터 발동 가능한 총 횟수.
        SUPER_BOOSTER: 1,
        // 전체 경기에서 딴짓하기 발동 가능한 총 횟수 (999 = 사실상 무제한).
        DISTRACTION: 999,
        // 전체 경기에서 혼란 발동 가능한 총 횟수 (999 = 사실상 무제한).
        CONFUSION: 999,
    },
    MULTIPLIERS: {
        // 슈퍼 부스터 시 속도 배율.
        SUPER_BOOSTER: 2.3,
        // 딴짓하기 시 속도 배율 (느려짐).
        DISTRACTION: 0.2,
        // 혼란 시 속도 배율 (뒤로 감).
        CONFUSION: -0.8,
        // 날기 시 속도 배율.
        FLY: 2.0,
        // 부스트 시 속도 배율.
        BOOST: 1.5,
        // 일반 이동 시 속도 배율.
        NORMAL: 1.0,
    },

    // --- Assets ---
    ASSETS: {
        WALKING: `${__webpack_public_path__}assets/walking.gif`,
        RUNNING: `${__webpack_public_path__}assets/running.gif`,
        IDLE: `${__webpack_public_path__}assets/idle.gif`,
        JUMPING: `${__webpack_public_path__}assets/jumping.gif`,
    },

    // --- Logic Thresholds ---
    THRESHOLDS: {
        // 슈퍼 부스터 발동 조건: 선두가 이 위치(%) 이상일 때.
        SUPER_BOOSTER_LEADER_POS: 70,
        // 슈퍼 부스터 발동 조건: 본인이 이 위치(%) 이상일 때.
        SUPER_BOOSTER_MIN_POS: 30,
        // 딴짓하기 발동 조건: 본인이 이 위치(%) 이상일 때.
        DISTRACTION_MIN_POS: 70,
        // 혼란 발동 조건: 본인이 이 위치(%) 이상일 때.
        CONFUSION_MIN_POS: 50,
        // 혼란 발동 조건: 본인이 이 위치(%) 이하일 때.
        CONFUSION_MAX_POS: 99,

        // 날기 발동 조건: 본인이 이 위치(%) 이상일 때 (카메라 줌 조건에도 사용).
        FLY_MIN_POS: 40,
        // 날기 카메라 줌 조건: 상위 몇 등까지 줌 해줄지.
        FLY_TOP_RANK: 5,
        // 넘어짐 카메라 줌 조건: 상위 몇 등까지 줌 해줄지.
        FALL_TOP_RANK: 3,
        // 넘어짐 카메라 줌 조건: 본인이 이 위치(%) 이상일 때.
        FALL_MIN_POS: 30,
        // 넘어짐 카메라 줌 조건: 본인이 이 위치(%) 이상일 때 (중위권 타겟).
        FALL_MID_POS: 40,
        // 부스트 카메라 줌 조건: 본인이 이 위치(%) 이상일 때.
        BOOST_MIN_POS: 40,
        // 부스트 카메라 줌 조건: 상위 몇 등까지 줌 해줄지.
        BOOST_TOP_RANK: 5,
        // 추월 카메라 줌 조건: 타겟 우승자가 선두를 추월할 때 위치(%) 조건.
        OVERTAKE_LEAD_POS: 40,
        // 추월 카메라 줌 조건: 상위권 추월 시 위치(%) 조건.
        OVERTAKE_TOP_POS: 30,
        // 추월 카메라 줌 조건: 상위 몇 등까지 추월 줌 해줄지.
        OVERTAKE_TOP_RANK: 5,
        // 카메라 락 발동 위치(%).
        LOCK_POS: 70,
    },

    // --- Defaults ---
    // 기본 참가자 목록 (i18n에서 관리).
    DEFAULT_PARTICIPANT_LIST: "물만난 오리, 카페인충전 오리, 얼렁뚱땅 오리, 뒤뚱뒤뚱 오리, 일단고고 오리",
};
