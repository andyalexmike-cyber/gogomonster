/**
 * Debug Overlay for diagnosing zoom stutter during races.
 * Activated by adding #debug to the URL.
 *
 * Monitors (per the dev guide):
 * - Viewport state (scroll, innerWidth/Height)
 * - Zoom transform & transition on #main-ui-container
 * - Camera state machine (state, target, priority, timer)
 * - Cached vs current viewport diff
 * - Frame timing (tick interval jitter, rAF gaps)
 *
 * Logs only on change. Full log kept in array; copyable in 2000-char chunks.
 */

const COPY_CHUNK_SIZE = 2000;

export class DebugOverlay {
    constructor(camera, mainUiContainer) {
        this._camera = camera;
        this._container = mainUiContainer;
        this._leaderboard = document.getElementById('live-leaderboard');
        this._logs = [];
        this._prev = {};
        this._rafId = null;
        this._el = null;
        this._logEl = null;
        this._copyBtnsEl = null;
        this._lastTickTime = 0;
        this._visible = false;
        this._tickTimings = []; // recent tick deltas for jitter analysis
    }

    /** Call once after DOMContentLoaded. Only builds UI if #debug is in the URL. */
    init() {
        if (!window.location.hash.includes('debug')) return;
        this._buildUI();
        this._visible = true;
        this._startLoop();
    }

    /** Call from the game loop (updateRace) to record tick timing. */
    recordTick() {
        if (!this._visible) return;
        const now = performance.now();
        if (this._lastTickTime > 0) {
            const delta = now - this._lastTickTime;
            this._tickTimings.push(delta);
            if (this._tickTimings.length > 40) this._tickTimings.shift();
        }
        this._lastTickTime = now;
    }

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        if (this._el) this._el.remove();
        this._visible = false;
    }

    // ── UI ──

    _buildUI() {
        this._el = document.createElement('div');
        this._el.id = 'debug-overlay';
        Object.assign(this._el.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            maxHeight: '45vh',
            background: 'rgba(0,0,0,0.82)',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.35',
            zIndex: '99999',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            transform: 'none',
        });

        // Header bar
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderBottom: '1px solid #333',
            flexShrink: '0',
        });

        const title = document.createElement('span');
        title.textContent = 'DEBUG';
        title.style.fontWeight = 'bold';
        title.style.marginRight = 'auto';
        header.appendChild(title);

        // Copy buttons container
        this._copyBtnsEl = document.createElement('span');
        Object.assign(this._copyBtnsEl.style, {
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            overflow: 'hidden',
            maxWidth: '70%',
        });
        header.appendChild(this._copyBtnsEl);

        // Clear button
        const clearBtn = this._makeBtn('Clear', () => {
            this._logs = [];
            this._renderLog();
            this._updateCopyButtons();
        });
        header.appendChild(clearBtn);

        // Toggle (collapse/expand) button
        this._collapsed = false;
        const toggleBtn = this._makeBtn('▼', () => {
            this._collapsed = !this._collapsed;
            this._logEl.style.display = this._collapsed ? 'none' : 'block';
            this._copyBtnsEl.style.display = this._collapsed ? 'none' : 'flex';
            clearBtn.style.display = this._collapsed ? 'none' : '';
            toggleBtn.textContent = this._collapsed ? '▲' : '▼';
        });
        header.appendChild(toggleBtn);

        this._el.appendChild(header);

        // Log area
        this._logEl = document.createElement('pre');
        Object.assign(this._logEl.style, {
            margin: '0',
            padding: '4px 8px',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            flexGrow: '1',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
        });
        this._el.appendChild(this._logEl);

        // Track whether user is scrolling manually (disable auto-scroll)
        this._autoScroll = true;
        this._logEl.addEventListener('scroll', () => {
            const atBottom = this._logEl.scrollTop + this._logEl.clientHeight >= this._logEl.scrollHeight - 5;
            this._autoScroll = atBottom;
        });

        document.body.appendChild(this._el);
    }

    _makeBtn(label, onClick) {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '3px',
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: '11px',
        });
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ── Logging ──

    _log(msg) {
        const ts = performance.now().toFixed(1);
        const line = `[${ts}] ${msg}`;
        this._logs.push(line);
    }

    _renderLog() {
        this._logEl.textContent = this._logs.join('\n');
        if (this._autoScroll) {
            this._logEl.scrollTop = this._logEl.scrollHeight;
        }
    }

    _updateCopyButtons() {
        const fullText = this._logs.join('\n');
        const totalChunks = Math.max(1, Math.ceil(fullText.length / COPY_CHUNK_SIZE));

        // Rebuild only when chunk count or total changes significantly
        // +1 for the "All" button
        if (this._copyBtnsEl.childElementCount === totalChunks + 1) return;
        this._copyBtnsEl.innerHTML = '';

        // "Copy All" button
        const allBtn = this._makeBtn('All', () => {
            const text = this._logs.join('\n');
            this._copyToClipboard(text).then(() => {
                allBtn.textContent = 'Copied!';
                setTimeout(() => { allBtn.textContent = 'All'; }, 1000);
            });
        });
        this._copyBtnsEl.appendChild(allBtn);

        // Per-chunk buttons (2000 chars each)
        for (let i = 0; i < totalChunks; i++) {
            const idx = i;
            const btn = this._makeBtn(`${i + 1}/${totalChunks}`, () => {
                const text = this._logs.join('\n');
                const chunk = text.slice(idx * COPY_CHUNK_SIZE, (idx + 1) * COPY_CHUNK_SIZE);
                this._copyToClipboard(chunk).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = `${idx + 1}/${totalChunks}`; }, 1000);
                });
            });
            this._copyBtnsEl.appendChild(btn);
        }
    }

    _copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return Promise.resolve();
    }

    // ── Monitor loop (rAF) ──

    _startLoop() {
        let lastRafTime = 0;

        const loop = (now) => {
            // rAF gap (detect rendering stutter)
            if (lastRafTime > 0) {
                const rafDelta = now - lastRafTime;
                if (rafDelta > 40) { // > 40ms means dropped below ~25fps
                    this._log(`FRAME-DROP rafGap:${rafDelta.toFixed(1)}ms`);
                }
            }
            lastRafTime = now;

            this._checkViewport();
            this._checkTransform();
            this._checkCameraState();
            this._checkViewportDiff();
            this._checkFixedUI();
            this._checkAncestorTransform();
            this._checkTickJitter();

            this._renderLog();
            this._updateCopyButtons();

            this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
    }

    _changed(key, value) {
        if (this._prev[key] === value) return false;
        this._prev[key] = value;
        return true;
    }

    // ── Checks (only log on change) ──

    _checkViewport() {
        const val = `scroll:(${window.scrollX},${window.scrollY}) vp:(${window.innerWidth}x${window.innerHeight})`;
        if (this._changed('viewport', val)) {
            // Only log when camera is active (zooming/tracking/panning) — idle scroll is noise
            const st = this._camera.state;
            if (st !== 'idle' && st !== 'zooming-out') {
                this._log(`SCROLL ${val}`);
            }
        }
    }

    _checkTransform() {
        const tf = this._container.style.transform || 'none';
        const tr = this._container.style.transition || 'none';
        const val = `tf:${tf} tr:${tr}`;
        if (this._changed('transform', val)) {
            this._log(`ZOOM ${val}`);
        }
    }

    _checkCameraState() {
        const c = this._camera;
        const targetName = c.target ? c.target.name : 'null';
        const reqTarget = c.currentRequest.target ? c.currentRequest.target.name : 'null';
        const val = `st:${c.state} tgt:${targetName} pri:${c.targetPriority} tmr:${Math.round(c.timer)} cd:${Math.round(c.zoomCooldownTimer)} lock70:${c.isSeventyPercentLockActive} req:[${reqTarget},${c.currentRequest.priority},"${c.currentRequest.reason}"]`;
        if (this._changed('camera', val)) {
            this._log(`CAM ${val}`);
        }
    }

    _checkViewportDiff() {
        const cached = this._camera._cachedViewport;
        if (!cached) {
            if (this._changed('vpdiff', 'no-cache')) {
                this._log(`VP no-cache`);
            }
            return;
        }
        const dw = window.innerWidth - cached.width;
        const dh = window.innerHeight - cached.height;
        const val = `cached:(${cached.width}x${cached.height}) current:(${window.innerWidth}x${window.innerHeight}) diff:(${dw},${dh})`;
        if (this._changed('vpdiff', val)) {
            this._log(`VP ${val}`);
        }
    }

    _checkFixedUI() {
        if (!this._leaderboard) return;
        const cs = window.getComputedStyle(this._leaderboard);
        // Computed style check
        const styleVal = `pos:${cs.position} d:${cs.display} z:${cs.zIndex} top:${cs.top} left:${cs.left}`;
        if (this._changed('fixedUI', styleVal)) {
            this._log(`UI ${styleVal}`);
        }
        // Bounding rect check (only when visible)
        if (cs.display !== 'none') {
            const rect = this._leaderboard.getBoundingClientRect();
            const rectVal = `(${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)}x${Math.round(rect.height)})`;
            if (this._changed('fixedUIRect', rectVal)) {
                this._log(`UI-RECT ${rectVal}`);
            }
        }
    }

    _checkAncestorTransform() {
        if (!this._leaderboard) return;
        const transforms = [];
        let el = this._leaderboard.parentElement;
        while (el && el !== document.body) {
            const elTf = window.getComputedStyle(el).transform;
            if (elTf && elTf !== 'none') {
                transforms.push(`${el.id || el.tagName}:${elTf}`);
            }
            el = el.parentElement;
        }
        const val = transforms.length > 0 ? transforms.join(' ') : 'none';
        if (this._changed('ancestorTf', val)) {
            if (transforms.length > 0) {
                this._log(`ANCESTOR-TF ${val}`);
            }
        }
    }

    _checkTickJitter() {
        if (this._tickTimings.length < 5) return;
        const recent = this._tickTimings.slice(-10);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const max = Math.max(...recent);
        const min = Math.min(...recent);
        const jitter = max - min;

        // Only log when jitter is notable (> 30ms spread means some ticks are significantly delayed)
        const val = `avg:${avg.toFixed(0)} min:${min.toFixed(0)} max:${max.toFixed(0)} jitter:${jitter.toFixed(0)}`;
        if (jitter > 30 && this._changed('tickJitter', val)) {
            this._log(`TICK ${val}`);
        }
    }
}
