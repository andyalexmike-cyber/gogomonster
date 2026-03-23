# Fixed UI & Camera Zoom Development Guide

이 문서는 gogoduck 프로젝트에서 카메라 줌(transform)과 관계없이 화면에 고정되어야 하는 UI 요소를 개발할 때의 가이드입니다.

## 핵심 아키텍처

### 줌 동작 원리

카메라 줌은 `#main-ui-container`에 CSS transform을 적용하는 방식입니다:

```
main-ui-container.style.transform = `translate(${x}px, ${y}px) scale(1.3)`;
```

이 transform은 `#main-ui-container` 내부의 모든 자식 요소에 영향을 줍니다.

### 모바일 뷰포트 팽창 문제

모바일 브라우저에서 CSS `transform: scale()`이 적용되면 `window.innerWidth`와 `window.innerHeight`가 실제 뷰포트보다 크게 보고됩니다.

```
실제 뷰포트:  825 x 822
팽창된 값:   1259 x 1182  (scale(1.3) 적용 중)
```

이 문제는 카메라(`_cachedViewport`)와 리더보드(`_cachedLbViewport`) 모두에서 동일하게 발생하며, 줌 시작 전에 뷰포트 크기를 캐싱하여 해결합니다.

## 화면 고정 UI 추가 가이드

화면에 고정된 위치/크기로 표시되어야 하는 UI 요소(리더보드, 타이머, 알림 등)를 추가할 때 따라야 하는 규칙입니다.

### 1. HTML 배치: transform 영향 밖에 두기

`#main-ui-container` 안에 넣으면 줌 transform의 영향을 받습니다. 반드시 body 직속에 배치하세요:

```html
<!-- (O) body 직속 — transform 영향 없음 -->
<body>
  <div id="main-ui-container">...</div>
  <div id="viewport-center-anchor"></div>
  <div id="my-fixed-element"></div>  <!-- 여기 -->
</body>

<!-- (X) container 내부 — 줌과 함께 이동/확대됨 -->
<div id="main-ui-container">
  <div id="my-fixed-element"></div>  <!-- 줌 영향 받음 -->
</div>
```

### 2. CSS: `position: fixed`와 `!important`

`position: fixed`를 사용하되, 다른 스타일에 의해 덮어씌워지지 않도록 `!important`를 적극 사용합니다:

```css
#my-fixed-element {
  position: fixed !important;
  z-index: 9999 !important;
  transform: none !important;  /* 조상의 transform 상속 차단 */
}
```

### 3. 위치 계산: CSS `bottom` 대신 JS `top` 사용

모바일에서 뷰포트 팽창 시 CSS `bottom` 값이 팽창된 뷰포트 기준으로 계산됩니다:

```
실제 화면 하단: 822px
CSS bottom: 16px 기준: 1182 - 16 = 1166px (실제 화면 밖!)
```

해결법: 줌 시작 전에 뷰포트 크기를 캐싱하고, JS로 `top` 값을 직접 설정합니다:

```javascript
// 줌 시작 전 (레이스 시작 시) 캐싱
this._cachedViewport = {
  width: window.innerWidth,
  height: window.innerHeight
};

// 위치 계산 시 캐시된 값 사용
function positionElement(element, cachedViewport) {
  const elementHeight = element.offsetHeight;
  const top = cachedViewport.height - elementHeight - 16; // 16px margin
  element.style.top = `${top}px`;
  element.style.left = "16px";
}
```

### 4. 캐싱 타이밍

뷰포트 크기 캐싱은 반드시 줌(transform)이 적용되기 전에 해야 합니다:

```
레이스 시작 (카운트다운 전)  →  뷰포트 캐싱  →  카운트다운  →  레이스 루프 + 줌
```

카메라에서는 `Camera.update()`의 `IDLE → ZOOMING` 전환 시점에 캐싱하고, 리더보드에서는 `scheduleLeaderboard()` 호출 시점에 캐싱합니다.

### 5. 크기 변동 대응

고정 UI의 내부 콘텐츠가 동적으로 변하면(예: 리더보드 행 수 변경), 매 업데이트마다 위치를 재계산해야 합니다:

```javascript
updateMyFixedUI() {
  // 내용 업데이트 ...

  // 높이가 변했을 수 있으므로 위치 재계산
  this._positionMyElement();
}
```

## 줌과 함께 동작하는 UI 패턴

### 패턴 A: 줌 무관 고정 UI (리더보드, 타이머 등)

- body 직속 배치
- `position: fixed` + 캐시 기반 JS 포지셔닝
- 위 가이드 전체 적용

### 패턴 B: 줌 중심점 고정 UI (카운트다운, 시작 버튼 등)

기존 `#viewport-center-anchor` 패턴 사용:

```javascript
_positionAnchorAtViewportCenter(anchor) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  anchor.style.left = cx + 'px';
  anchor.style.top = cy + 'px';
  anchor.style.transform = 'translate(-50%, -50%)';
}
```

이 패턴은 줌 전에 한번만 위치를 설정하며, `#viewport-center-anchor`는 body 직속입니다.

### 패턴 C: 줌과 함께 움직이는 UI (오리 이름표, 말풍선 등)

`#main-ui-container` 내부에 배치하여 줌과 함께 자연스럽게 확대/이동됩니다.

## 디버깅 가이드

모바일에서 고정 UI가 예상대로 동작하지 않을 때, 아래 정보를 실시간 로깅하면 문제를 빠르게 파악할 수 있습니다.
이 항목들은 `src/debug-overlay.js`의 디버그 오버레이에 구현되어 있으며, URL에 `#debug`를 추가하면 확인할 수 있습니다.

### 필수 로깅 항목

#### 1. 뷰포트 상태 (변경 시마다)

```javascript
`SCROLL scroll:(${window.scrollX},${window.scrollY}) vp:(${window.innerWidth}x${window.innerHeight})`
```

- 줌 중 `innerWidth/Height`가 팽창하는지 확인
- 스크롤 위치가 예상치 않게 변하는지 확인

#### 2. 줌 Transform 상태 (변경 시마다)

```javascript
const tf = mainContainer.style.transform;
const tr = mainContainer.style.transition;
`ZOOM tf:${tf} tr:${tr}`
```

- transform 값이 적용/해제되는 타이밍 확인
- transition 설정이 올바른지 확인

#### 3. 고정 UI 요소의 computed style

```javascript
const cs = window.getComputedStyle(element);
`UI pos:${cs.position} d:${cs.display} z:${cs.zIndex} top:${cs.top} left:${cs.left}`
```

- `position`이 `fixed`인지 확인
- `display`가 `none`으로 숨겨져 있지 않은지 확인
- `z-index`가 충분히 높은지 확인

#### 4. 고정 UI의 실제 렌더링 위치 (getBoundingClientRect)

```javascript
const rect = element.getBoundingClientRect();
`UI-RECT (${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)}x${Math.round(rect.height)})`
```

- `top`이 뷰포트 높이보다 큰 값이면 화면 밖으로 밀려남
- `width/height`가 0이면 요소가 렌더링되지 않음

#### 5. 조상 transform 감지

```javascript
let el = element.parentElement;
while (el && el !== document.body) {
  const elTf = window.getComputedStyle(el).transform;
  if (elTf && elTf !== 'none') {
    // 이 조상이 fixed 포지셔닝을 깨뜨림!
    log(`ANCESTOR-TF ${el.id || el.tagName}: ${elTf}`);
  }
  el = el.parentElement;
}
```

- `position: fixed`는 transform이 있는 조상 내부에서 `position: absolute`처럼 동작함
- 이 검사로 의도치 않은 containing block을 찾을 수 있음

#### 6. 캐시된 뷰포트 vs 현재 뷰포트

```javascript
`VP cached:(${cached.width}x${cached.height}) current:(${window.innerWidth}x${window.innerHeight}) diff:(${window.innerWidth - cached.width},${window.innerHeight - cached.height})`
```

- diff가 크면 뷰포트 팽창이 발생 중
- 캐시가 null이면 캐싱 타이밍 문제

### 디버그 오버레이 사용법

`src/debug-overlay.js`에 구현된 실시간 디버그 오버레이를 사용하여 모바일에서도 로그를 확인할 수 있습니다.

#### 활성화

URL에 `#debug` 해시를 추가합니다:
```
http://localhost:9000#debug
```

일반 사용자에게는 노출되지 않으며, `#debug`가 없으면 UI 생성/rAF 루프/로그 수집이 모두 비활성화되어 성능 영향이 없습니다.

#### 로그 태그

| 태그 | 내용 | 조건 |
|------|------|------|
| `SCROLL` | 스크롤 위치, 뷰포트 크기 | 카메라 활성 상태(zooming/tracking/panning)에서만 기록 |
| `ZOOM` | `#main-ui-container`의 transform, transition 값 | 변경 시 |
| `CAM` | 카메라 상태머신 (state, target, priority, timer, cooldown, 70%락, 현재 요청) | 변경 시 |
| `VP` | 캐시된 뷰포트 vs 현재 뷰포트 차이 | 변경 시 |
| `UI` | 리더보드 computed style (position, display, z-index, top, left) | 변경 시 |
| `UI-RECT` | 리더보드 getBoundingClientRect | 변경 시 (visible일 때만) |
| `ANCESTOR-TF` | 리더보드 조상 중 transform이 있는 요소 감지 | 감지 시 |
| `TICK` | 게임루프 틱 간격 통계 (avg/min/max/jitter) | jitter > 30ms일 때 |
| `FRAME-DROP` | rAF 간격 40ms 초과 | 발생 시 |

#### UI 기능

- **접기/펼치기 (▼/▲)** — 로그 영역을 접어 화면 가림 최소화
- **Copy All** — 전체 로그 클립보드 복사
- **Copy 1/N, 2/N, ...** — 2000자 단위 분할 복사 (디스코드 글자 제한 대응)
- **Clear** — 로그 초기화
- **스크롤** — 위로 스크롤하면 자동 스크롤 멈춤, 맨 아래로 돌아오면 재개

#### 설계 원칙

- `position: fixed; z-index: 99999`로 줌 transform 영향 밖에서 최상위 표시
- `requestAnimationFrame`으로 매 프레임 상태 모니터링
- 변경 시에만 로그 기록 (이전 값과 비교)하여 노이즈 감소
- 전체 로그를 배열에 보관하여 스크롤로 이전 로그 확인 가능

### 체크리스트

새로운 고정 UI 요소를 추가할 때의 검증 항목:

- [ ] HTML 배치가 `#main-ui-container` 바깥(body 직속)인가?
- [ ] `position: fixed !important`와 `transform: none !important`가 설정되어 있는가?
- [ ] 뷰포트 크기를 줌 전에 캐싱하고 있는가?
- [ ] CSS `bottom` 대신 JS로 `top`을 계산하고 있는가?
- [ ] 콘텐츠 크기 변동 시 위치를 재계산하는가?
- [ ] z-index가 줌 stacking context보다 높은가? (9999 이상 권장)
- [ ] 모바일 실기기에서 줌인/줌아웃 중 위치와 크기가 유지되는가?
- [ ] `조상 transform 감지` 디버그로 의도치 않은 containing block이 없는지 확인했는가?
