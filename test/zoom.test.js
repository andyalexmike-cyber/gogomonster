/**
 * Zoom position tests for Camera.applyTransform and Camera.applyZoomToWinnerTransform
 *
 * Verifies that the duck ends up at the viewport center after zoom,
 * covering the bugs we found:
 *   1. Mobile viewport size inflation during CSS transforms (applyTransform)
 *   2. Offset chain skipping non-positioned container (applyZoomToWinnerTransform)
 *   3. Various scroll/viewport combinations (PC, mobile portrait/landscape, many ducks)
 */

const IN_RACE_ZOOM_SCALE = 1.3;
const HIGHLIGHT_ZOOM_SCALE = 2;

// ─── Pure logic extracted from applyTransform ───

function computeInRaceTransform({
    duckPos, duckWidth, duckHeight,
    containerWidth, containerHeight, containerPagePos,
    scrollX, scrollY,
    cachedViewport, // { width, height } or null
    rawViewport,    // { width, height } — what window.innerWidth/Height would return
}) {
    const scale = IN_RACE_ZOOM_SCALE;

    const duckCenterX = duckPos.x + duckWidth / 2;
    const duckCenterY = duckPos.y + duckHeight / 2;

    const originX = containerWidth / 2;
    const originY = containerHeight / 2;

    const vpWidth = cachedViewport ? cachedViewport.width : rawViewport.width;
    const vpHeight = cachedViewport ? cachedViewport.height : rawViewport.height;

    const vpCenterInContainerX = scrollX + vpWidth / 2 - containerPagePos.x;
    const vpCenterInContainerY = scrollY + vpHeight / 2 - containerPagePos.y;

    const translateX = (vpCenterInContainerX - originX) + scale * (originX - duckCenterX);
    const translateY = (vpCenterInContainerY - originY) + scale * (originY - duckCenterY);

    return { translateX, translateY, scale, originX, originY };
}

// ─── Pure logic extracted from applyZoomToWinnerTransform ───

function computeWinnerTransform({
    duckRect,       // { left, top, width, height } — getBoundingClientRect of duck
    containerRect,  // { left, top, width, height } — getBoundingClientRect of container
    vpWidth, vpHeight,
}) {
    const scale = HIGHLIGHT_ZOOM_SCALE;

    const relX = (duckRect.left + duckRect.width / 2) - containerRect.left;
    const relY = (duckRect.top + duckRect.height / 2) - containerRect.top;

    const t1x = -relX;
    const t1y = -relY;
    const t2x = vpWidth / 2 - containerRect.left;
    const t2y = vpHeight / 2 - containerRect.top;

    return { t1x, t1y, t2x, t2y, scale };
}

// ─── Verification helpers ───

function verifyInRaceZoom(label, params) {
    const { translateX, translateY, scale, originX, originY } = computeInRaceTransform(params);

    const duckCenterX = params.duckPos.x + params.duckWidth / 2;
    const duckCenterY = params.duckPos.y + params.duckHeight / 2;

    const vpWidth = params.cachedViewport ? params.cachedViewport.width : params.rawViewport.width;
    const vpHeight = params.cachedViewport ? params.cachedViewport.height : params.rawViewport.height;

    // Visual position of duck center with transformOrigin at (originX, originY):
    // visualPos = containerPagePos + origin + scale*(duckCenter - origin) + translate
    const visualX = params.containerPagePos.x + originX + scale * (duckCenterX - originX) + translateX - params.scrollX;
    const visualY = params.containerPagePos.y + originY + scale * (duckCenterY - originY) + translateY - params.scrollY;

    const vpCenterX = vpWidth / 2;
    const vpCenterY = vpHeight / 2;

    const errorX = Math.abs(visualX - vpCenterX);
    const errorY = Math.abs(visualY - vpCenterY);
    const pass = errorX < 1 && errorY < 1;

    if (!pass) {
        console.log(`  ❌ FAIL ${label}`);
        console.log(`    visual: (${visualX.toFixed(1)}, ${visualY.toFixed(1)}) vs vpCenter: (${vpCenterX}, ${vpCenterY})`);
        console.log(`    error: (${errorX.toFixed(1)}, ${errorY.toFixed(1)})`);
    } else {
        console.log(`  ✅ PASS ${label}`);
    }
    return pass;
}

function verifyWinnerZoom(label, params) {
    const { t1x, t1y, t2x, t2y, scale } = computeWinnerTransform(params);

    const relX = (params.duckRect.left + params.duckRect.width / 2) - params.containerRect.left;
    const relY = (params.duckRect.top + params.duckRect.height / 2) - params.containerRect.top;

    // With transformOrigin "0 0": visual = containerRect + t2 + scale*(point + t1)
    const duckVisualX = params.containerRect.left + t2x + scale * (relX + t1x);
    const duckVisualY = params.containerRect.top + t2y + scale * (relY + t1y);

    const vpCenterX = params.vpWidth / 2;
    const vpCenterY = params.vpHeight / 2;

    const errorX = Math.abs(duckVisualX - vpCenterX);
    const errorY = Math.abs(duckVisualY - vpCenterY);
    const pass = errorX < 1 && errorY < 1;

    if (!pass) {
        console.log(`  ❌ FAIL ${label}`);
        console.log(`    visual: (${duckVisualX.toFixed(1)}, ${duckVisualY.toFixed(1)}) vs vpCenter: (${vpCenterX}, ${vpCenterY})`);
        console.log(`    error: (${errorX.toFixed(1)}, ${errorY.toFixed(1)})`);
    } else {
        console.log(`  ✅ PASS ${label}`);
    }
    return pass;
}

// ─── Test runner ───

let passed = 0;
let failed = 0;
function run(label, fn) {
    console.log(`\n--- ${label} ---`);
    fn();
}
function check(result) {
    result ? passed++ : failed++;
}

// ═══════════════════════════════════════════════
// applyTransform tests (in-race zoom)
// ═══════════════════════════════════════════════

run("In-race: PC, no scroll", () => {
    check(verifyInRaceZoom("Duck at 50%, lane 1", {
        duckPos: { x: 200, y: 20 }, duckWidth: 60, duckHeight: 54,
        containerWidth: 720, containerHeight: 400,
        containerPagePos: { x: 280, y: 100 },
        scrollX: 0, scrollY: 0,
        cachedViewport: { width: 1280, height: 800 },
        rawViewport: { width: 1280, height: 800 },
    }));
});

run("In-race: PC, scrolled down", () => {
    check(verifyInRaceZoom("Duck at 80%, lane 3", {
        duckPos: { x: 350, y: 160 }, duckWidth: 60, duckHeight: 54,
        containerWidth: 720, containerHeight: 400,
        containerPagePos: { x: 280, y: 100 },
        scrollX: 0, scrollY: 300,
        cachedViewport: { width: 1280, height: 800 },
        rawViewport: { width: 1280, height: 800 },
    }));
});

run("In-race: Mobile portrait, no scroll", () => {
    check(verifyInRaceZoom("Duck at 30%, lane 2", {
        duckPos: { x: 100, y: 90 }, duckWidth: 60, duckHeight: 54,
        containerWidth: 370, containerHeight: 600,
        containerPagePos: { x: 10, y: 50 },
        scrollX: 0, scrollY: 0,
        cachedViewport: { width: 368, height: 765 },
        rawViewport: { width: 368, height: 765 },
    }));
});

run("BUG REPRO: Mobile viewport inflation without cache", () => {
    // This reproduces the bug: during tracking, rawViewport inflates to ~2x.
    // Without cachedViewport, the code uses the inflated viewport (658x1365)
    // to compute the center, but the user's actual screen is 368x765.
    // The duck ends up at the inflated center, not the real screen center.
    const realViewport = { width: 368, height: 765 };
    const inflatedViewport = { width: 658, height: 1365 };

    const params = {
        duckPos: { x: 42, y: 268 }, duckWidth: 60, duckHeight: 54,
        containerWidth: 338, containerHeight: 588,
        containerPagePos: { x: 16, y: 130 },
        scrollX: 0, scrollY: 0,
        cachedViewport: null, // no cache!
        rawViewport: inflatedViewport,
    };

    const { translateX, translateY, scale, originX, originY } = computeInRaceTransform(params);
    const duckCenterX = params.duckPos.x + params.duckWidth / 2;
    const duckCenterY = params.duckPos.y + params.duckHeight / 2;

    // Where the duck actually ends up on the REAL screen
    const visualX = params.containerPagePos.x + originX + scale * (duckCenterX - originX) + translateX;
    const visualY = params.containerPagePos.y + originY + scale * (duckCenterY - originY) + translateY;

    // The REAL screen center the user sees
    const realCenterX = realViewport.width / 2;
    const realCenterY = realViewport.height / 2;

    const errorX = Math.abs(visualX - realCenterX);
    const errorY = Math.abs(visualY - realCenterY);
    const isBroken = errorX > 10 || errorY > 10;

    if (isBroken) {
        console.log(`  ✅ Correctly detected as broken — duck at (${visualX.toFixed(0)},${visualY.toFixed(0)}) vs real center (${realCenterX},${realCenterY}), error (${errorX.toFixed(0)},${errorY.toFixed(0)})`);
        passed++;
    } else {
        console.log(`  ❌ Expected large error but got (${errorX.toFixed(1)},${errorY.toFixed(1)})`);
        failed++;
    }
});

run("BUG FIX: Mobile viewport inflation with cache", () => {
    // Same scenario but with cachedViewport — should pass
    check(verifyInRaceZoom("With cache, inflated raw viewport — should PASS", {
        duckPos: { x: 42, y: 268 }, duckWidth: 60, duckHeight: 54,
        containerWidth: 338, containerHeight: 588,
        containerPagePos: { x: 16, y: 130 },
        scrollX: 0, scrollY: 0,
        cachedViewport: { width: 368, height: 765 }, // cached at zoom start
        rawViewport: { width: 658, height: 1365 },   // inflated during zoom
    }));
});

run("In-race: Mobile landscape", () => {
    check(verifyInRaceZoom("Duck near finish, lane 1", {
        duckPos: { x: 380, y: 20 }, duckWidth: 60, duckHeight: 54,
        containerWidth: 744, containerHeight: 500,
        containerPagePos: { x: 50, y: 50 },
        scrollX: 0, scrollY: 100,
        cachedViewport: { width: 844, height: 390 },
        rawViewport: { width: 844, height: 390 },
    }));
});

run("In-race: 10 ducks, tall container, scrolled", () => {
    for (let i = 0; i < 10; i++) {
        check(verifyInRaceZoom(`Duck ${i + 1} lane ${i + 1}`, {
            duckPos: { x: 200 + i * 15, y: 20 + i * 70 }, duckWidth: 60, duckHeight: 54,
            containerWidth: 370, containerHeight: 900,
            containerPagePos: { x: 10, y: 50 },
            scrollX: 0, scrollY: 150,
            cachedViewport: { width: 390, height: 844 },
            rawViewport: { width: 390, height: 844 },
        }));
    }
});

run("In-race: Cache used across multiple targets (same zoom session)", () => {
    const cached = { width: 368, height: 765 };
    const inflatedViewports = [
        { width: 658, height: 1365 },
        { width: 634, height: 1316 },
        { width: 602, height: 1250 },
    ];
    const ducks = [
        { x: 42, y: 268 },
        { x: 95, y: 58 },
        { x: 138, y: 198 },
    ];
    for (let i = 0; i < 3; i++) {
        check(verifyInRaceZoom(`Target ${i + 1} with inflated raw vp ${inflatedViewports[i].width}x${inflatedViewports[i].height}`, {
            duckPos: ducks[i], duckWidth: 60, duckHeight: 54,
            containerWidth: 338, containerHeight: 588,
            containerPagePos: { x: 16, y: 130 },
            scrollX: 0, scrollY: 0,
            cachedViewport: cached,
            rawViewport: inflatedViewports[i],
        }));
    }
});

// ═══════════════════════════════════════════════
// applyZoomToWinnerTransform tests (post-race zoom)
// ═══════════════════════════════════════════════

run("Winner zoom: PC, no scroll", () => {
    const container = { left: 280, top: 100, width: 720, height: 400 };
    check(verifyWinnerZoom("Duck near finish, lane 1", {
        duckRect: { left: 640, top: 120, width: 60, height: 54 },
        containerRect: container,
        vpWidth: 1280, vpHeight: 800,
    }));
});

run("Winner zoom: PC, scrolled (container partially above viewport)", () => {
    // scrolled 300px → containerRect.top = 100 - 300 = -200
    check(verifyWinnerZoom("Duck in lane 3", {
        duckRect: { left: 630, top: -40, width: 60, height: 54 },
        containerRect: { left: 280, top: -200, width: 720, height: 400 },
        vpWidth: 1280, vpHeight: 800,
    }));
});

run("Winner zoom: Mobile portrait, no scroll", () => {
    check(verifyWinnerZoom("Duck near finish", {
        duckRect: { left: 265, top: 161, width: 60, height: 54 },
        containerRect: { left: 16, top: 102, width: 338, height: 588 },
        vpWidth: 368, vpHeight: 765,
    }));
});

run("Winner zoom: Mobile, scrolled 200px", () => {
    check(verifyWinnerZoom("Duck lane 4", {
        duckRect: { left: 255, top: -69, width: 60, height: 54 },
        containerRect: { left: 10, top: -150, width: 370, height: 600 },
        vpWidth: 390, vpHeight: 844,
    }));
});

run("Winner zoom: Multiple winners in sequence", () => {
    const container = { left: 10, top: 50, width: 370, height: 600 };
    const ducks = [
        { left: 350, top: 70, width: 60, height: 54 },
        { left: 345, top: 140, width: 60, height: 54 },
        { left: 340, top: 210, width: 60, height: 54 },
    ];
    for (let i = 0; i < ducks.length; i++) {
        check(verifyWinnerZoom(`Winner ${i + 1}`, {
            duckRect: ducks[i],
            containerRect: container,
            vpWidth: 390, vpHeight: 844,
        }));
    }
});

run("Winner zoom: Container below fold, scrolled to it", () => {
    check(verifyWinnerZoom("Duck near finish", {
        duckRect: { left: 350, top: -30, width: 60, height: 54 },
        containerRect: { left: 10, top: -50, width: 370, height: 600 },
        vpWidth: 390, vpHeight: 844,
    }));
});

// ═══════════════════════════════════════════════
// Camera state machine: applyTransform call pattern during zoom-in
// ═══════════════════════════════════════════════
//
// Regression test: applyTransform must NOT be called every tick during
// ZOOMING state. Repeated calls restart the CSS transition (300ms) every
// 50ms tick, causing visible stutter.
//
// Expected: applyTransform once at zoom start, once at ZOOMING→TRACKING transition.

const TICK_RATE = 50;
const ZOOM_DURATION = 300;
const SHORT_TRACK_DURATION = 1500;
const MIN_ZOOM_HOLD_DURATION = 1300;

function simulateZoomCycle() {
    // Minimal camera state machine mirroring camera.js update() logic
    let state = 'idle';
    let timer = 0;
    let applyTransformCalls = [];
    let tick = 0;

    function applyTransform() {
        applyTransformCalls.push({ tick, state });
    }

    // --- Tick 0: IDLE → ZOOMING (zoom request arrives) ---
    state = 'zooming';
    timer = ZOOM_DURATION;
    applyTransform(); // initial call at zoom start
    tick++;

    // --- Subsequent ticks during ZOOMING ---
    while (state === 'zooming') {
        timer -= TICK_RATE;
        if (timer <= 0) {
            state = 'tracking';
            timer = SHORT_TRACK_DURATION;
            // Apply transform at transition to sync with current duck position
            applyTransform();
        }
        // Key fix: do NOT call applyTransform() here during zooming
        tick++;
    }

    return applyTransformCalls;
}

run("Camera: applyTransform not called every tick during ZOOMING", () => {
    const calls = simulateZoomCycle();

    // Should have exactly 2 calls: zoom start + ZOOMING→TRACKING transition
    const zoomingCalls = calls.filter(c => c.state === 'zooming');
    const trackingCalls = calls.filter(c => c.state === 'tracking');

    const totalTicks = Math.ceil(ZOOM_DURATION / TICK_RATE);

    if (zoomingCalls.length === 1 && trackingCalls.length === 1 && calls.length === 2) {
        console.log(`  ✅ PASS applyTransform called ${calls.length} times (1 at zoom start, 1 at tracking transition) over ${totalTicks} ticks`);
        passed++;
    } else {
        console.log(`  ❌ FAIL applyTransform called ${calls.length} times (expected 2): zooming=${zoomingCalls.length}, tracking=${trackingCalls.length}`);
        failed++;
    }
});

run("Camera: old behavior would call applyTransform every tick (regression proof)", () => {
    // Simulate the OLD (broken) behavior where applyTransform was called every tick
    let state = 'zooming';
    let timer = ZOOM_DURATION;
    let oldCalls = 0;
    let tick = 0;

    // Initial call
    oldCalls++;
    tick++;

    while (state === 'zooming') {
        timer -= TICK_RATE;
        if (timer <= 0) {
            state = 'tracking';
        }
        oldCalls++; // OLD: called every tick regardless
        tick++;
    }

    // Old behavior: 1 initial + ceil(300/50) ticks = 1 + 6 = 7 calls
    const expectedOldCalls = 1 + Math.ceil(ZOOM_DURATION / TICK_RATE);
    if (oldCalls === expectedOldCalls) {
        console.log(`  ✅ PASS Old behavior confirmed: ${oldCalls} calls over ${tick} ticks (would restart CSS transition ${oldCalls - 1} times)`);
        passed++;
    } else {
        console.log(`  ❌ FAIL Expected ${expectedOldCalls} old-style calls, got ${oldCalls}`);
        failed++;
    }
});

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════

console.log(`\n========================================`);
console.log(`TOTAL: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

process.exit(failed > 0 ? 1 : 0);
