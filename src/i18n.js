/**
 * Internationalization (i18n) module for Go-Go! Duck Roulette
 */

import { SPEECH_LINES_KO, SPEECH_LINES_EN } from './translations/speech.js';

const STORAGE_KEY = 'duckRaceLanguage';

const translations = {
    ko: {
        // SEO
        'seo.title': '오리 경주 추첨 게임 - 달려라! 오리 레이스 뽑기 | Go-Go! Duck Roulette',
        'seo.description': '오리 경주 추첨 게임! 오리들이 달리기 레이스를 펼치는 랜덤 뽑기 룰렛입니다. 커피 내기, 이벤트 당첨자 선정, 발표 순서 정하기 등에 활용해 보세요!',
        'seo.keywords': '오리 경주, 오리 레이스, 오리 달리기, 오리 룰렛, 오리 경주 추첨 게임, 오리 레이스 뽑기, 오리 달리기 뽑기, 오리 경주 게임, 오리 레이스 게임, 오리 달리기 게임, 오리레이스, 오리경주게임, 오리달리기 게임, duck roulette, 랜덤 추첨, 순위 추첨, 뽑기, 커피 내기, 커피내기 달리기, 발표 순서, 제비뽑기, 이벤트 당첨자',
        'seo.appName': '오리 경주 추첨 게임 - Go-Go! Duck Roulette',

        // Setup screen
        'subtitle': '오리 경주 추첨 게임',
        'description.line1': '예측불가 오리들의 대환장 달리기 레이스!',
        'description.line2': '오리 경주로 펼치는 랜덤 순위 추첨 뽑기 게임입니다.',
        'description.line3': '커피 내기, 이벤트 당첨자 선정, 발표 순서 정하기 등에 활용해 보세요!',
        'label.participants': '참가자 목록 (쉼표(,)로 구분)',
        'hint.whitespace': '쉼표 좌우의 공백은 자동으로 제거됩니다.',
        'label.drawMode': '추첨 모드',
        'label.drawRank': '몇 등까지?',
        'option.front': '앞에서',
        'option.back': '뒤에서',
        'btn.ready': '준비!',
        'btn.start': '출발!',
        'btn.shareResults': '결과 공유',
        'btn.reset': '다시하기',
        'btn.buyCoffee': '☕ 개발자 커피 사주기',
        'link.feedback': '의견 보내기',
        'watermark': 'https://hyojun.me/gogoduck<br>에서 즐겨보세요!',
        'text.raceFinish': '경기 끝!',
        'text.results': '결과',
        'tooltip.facebook': '페이스북에 공유',
        'tooltip.twitter': '트위터에 공유',
        'tooltip.instagram': '인스타그램에 공유',
        'tooltip.copyLink': '링크 복사',
        'alert.copyLinkDone': '링크 복사 완료!',

        // Dynamic text
        'rank.only': (n) => `${n}등만`,
        'rank.upto': (n) => `${n}등까지`,
        'rank.suffix': (n) => `(${n}등)`,
        'rank.display': (n) => `${n}등`,
        'result.frontWin': (rankText) => `🎉 앞에서 ${rankText} 당첨! 🎉`,
        'result.backWin': (rankText) => `🎉 뒤에서 ${rankText} 당첨! 🎉`,
        'result.noWinners': '당첨자가 없습니다.',
        'error.noParticipants': '참가자를 1명 이상 입력해주세요!',
        'placeholder.example': (list) => `예) ${list}`,
        'share.title': 'Go-Go! Duck Roulette - 달려라! 오리 룰렛',
        'share.instagram': '링크가 복사되었습니다! 인스타그램에서 공유해보세요.',
        'share.linkCopied': '링크 복사 완료!',
        'share.linkFailed': '링크 복사에 실패했습니다.',
        'share.noTarget': '결과 영역을 찾을 수 없습니다.',
        'share.imageFailed': '결과 이미지 생성에 실패했습니다.',
        'share.text': '경주 추첨 결과를 확인해 보세요!\n\nGo-Go! Duck Roulette 바로가기:\nhttps://hyojun.me/gogoduck',
        'share.downloadAlert': '결과 이미지를 다운로드합니다. 친구와 공유해보세요!',
        'share.captureFailed': '결과 이미지를 캡처하거나 공유하는 데 실패했습니다.',
        'share.downloadStart': '이미지 복사 실패! 다운로드를 시작합니다.',
        'default.participants': '물만난 오리, 카페인충전 오리, 얼렁뚱땅 오리, 뒤뚱뒤뚱 오리, 일단고고 오리',
    },
    en: {
        // Setup screen
        'subtitle': 'Duck Race Lottery Game',
        'description.line1': 'An unpredictable, chaotic duck racing showdown!',
        'description.line2': 'A random lottery game powered by duck races.',
        'description.line3': 'Use it for coffee bets, event winners, presentation order, and more!',

        // SEO
        'seo.title': 'Go-Go! Duck Roulette - Random Duck Race Lottery Game',
        'seo.description': 'A random lottery game powered by duck races! Watch unpredictable ducks race and pick winners. Great for coffee bets, event draws, presentation order, and more!',
        'seo.keywords': 'duck race, duck roulette, random lottery, duck racing game, random picker, random draw, team picker, coffee bet, event winner, presentation order',
        'seo.appName': 'Go-Go! Duck Roulette',

        'label.participants': 'Participant list (separated by commas)',
        'hint.whitespace': 'Spaces around commas are automatically removed.',
        'label.drawMode': 'Draw mode',
        'label.drawRank': 'How many winners?',
        'option.front': 'From front',
        'option.back': 'From back',
        'btn.ready': 'Ready!',
        'btn.start': 'Go!',
        'btn.shareResults': 'Share Results',
        'btn.reset': 'Play Again',
        'btn.buyCoffee': '☕ Buy Dev a Coffee',
        'link.feedback': 'Send Feedback',
        'watermark': 'https://hyojun.me/gogoduck<br>Try it out!',
        'text.raceFinish': 'Race Over!',
        'text.results': 'Results',
        'tooltip.facebook': 'Share on Facebook',
        'tooltip.twitter': 'Share on Twitter',
        'tooltip.instagram': 'Share on Instagram',
        'tooltip.copyLink': 'Copy link',
        'alert.copyLinkDone': 'Link copied!',

        // Dynamic text
        'rank.only': (n) => `#${n} only`,
        'rank.upto': (n) => `Up to #${n}`,
        'rank.suffix': (n) => `(#${n})`,
        'rank.display': (n) => `#${n}`,
        'result.frontWin': (rankText) => `🎉 ${rankText} from the front! 🎉`,
        'result.backWin': (rankText) => `🎉 ${rankText} from the back! 🎉`,
        'result.noWinners': 'No winners.',
        'error.noParticipants': 'Please enter at least 1 participant!',
        'placeholder.example': (list) => `e.g.) ${list}`,
        'share.title': 'Go-Go! Duck Roulette',
        'share.instagram': 'Link copied! Share it on Instagram.',
        'share.linkCopied': 'Link copied!',
        'share.linkFailed': 'Failed to copy link.',
        'share.noTarget': 'Could not find result area.',
        'share.imageFailed': 'Failed to generate result image.',
        'share.text': 'Check out the race results!\n\nGo-Go! Duck Roulette:\nhttps://hyojun.me/gogoduck',
        'share.downloadAlert': 'Downloading result image. Share it with friends!',
        'share.captureFailed': 'Failed to capture or share results.',
        'share.downloadStart': 'Image copy failed! Starting download.',
        'default.participants': 'Splashy Duck, Caffeinated Duck, Clumsy Duck, Waddling Duck, YOLO Duck',
    },
};

let currentLang = 'ko';

/**
 * Detect language from URL path.
 *   /gogoduck/en/ → 'en'
 *   /gogoduck/ko/ or /gogoduck/ → 'ko'
 * Fallback: localStorage > browser locale > 'ko'
 */
function detectLanguage() {
    const path = window.location.pathname;

    // URL path takes highest priority
    if (/\/en\/?$/i.test(path)) return 'en';
    if (/\/ko\/?$/i.test(path)) return 'ko';

    // Root path: check localStorage, then browser locale
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'ko' || saved === 'en')) {
        return saved;
    }

    const browserLang = navigator.language || navigator.languages?.[0] || '';
    if (browserLang.startsWith('ko')) {
        return 'ko';
    }

    return 'en';
}

/**
 * Get the base path (everything before /en/ or /ko/)
 */
function getBasePath() {
    const path = window.location.pathname;
    return path.replace(/\/(en|ko)\/?$/, '/');
}

/**
 * Initialize i18n system
 */
export function initI18n() {
    currentLang = detectLanguage();
    localStorage.setItem(STORAGE_KEY, currentLang);
    applyTranslations();
    updateHtmlLang();
}

/**
 * Get current language
 */
export function getLang() {
    return currentLang;
}

/**
 * Navigate to the URL for the given language
 */
export function switchLang(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    localStorage.setItem(STORAGE_KEY, lang);
    const basePath = getBasePath();
    // /gogoduck/ = ko (default), /gogoduck/en/ = en
    const newPath = lang === 'ko' ? basePath : basePath + 'en/';
    window.location.href = newPath;
}

/**
 * Set language in-place (without navigation, for internal use)
 */
export function setLang(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    updateHtmlLang();
}

/**
 * Get translation for a key. If the value is a function, call it with args.
 */
export function t(key, ...args) {
    const val = translations[currentLang]?.[key] ?? translations['en']?.[key] ?? key;
    if (typeof val === 'function') {
        return val(...args);
    }
    return val;
}

/**
 * Get speech lines for the current language
 */
export function getSpeechLines() {
    return currentLang === 'ko' ? SPEECH_LINES_KO : SPEECH_LINES_EN;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = translations[currentLang]?.[key];
        if (val && typeof val === 'string') {
            el.textContent = val;
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const val = translations[currentLang]?.[key];
        if (val && typeof val === 'string') {
            el.innerHTML = val;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const val = translations[currentLang]?.[key];
        if (val && typeof val === 'string') {
            el.title = val;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = translations[currentLang]?.[key];
        if (val && typeof val === 'string') {
            el.placeholder = val;
        }
    });

    updateMetaTags();
}

function updateMetaTags() {
    const title = t('seo.title');
    const description = t('seo.description');
    const keywords = t('seo.keywords');
    const appName = t('seo.appName');

    document.title = title;

    const setMeta = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[name="keywords"]', keywords);
    setMeta('meta[name="application-name"]', appName);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
}

function updateHtmlLang() {
    document.documentElement.lang = currentLang;
}
