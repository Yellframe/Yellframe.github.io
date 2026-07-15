/**
 * i18n-ядро сайта YFRO.OS
 * --------------------------------------------------------------
 * • Источник правды — объект `I18N_STRINGS` (ru + en).
 * • Доступ к строке: `t('dock.music.label')`.
 * • Старт: getInitialLang() = URL ?lang=  →  localStorage  →  navigator.language  →  fallback 'ru'.
 * • applyI18n() обходит элементы с атрибутами:
 *      data-i18n          — заменяет textContent;
 *      data-i18n-attr     — JSON-карта: { "title": "ключ", "aria-label": "ключ" };
 *      data-i18n-html     — заменяет innerHTML (для строк с разметкой).
 *   Также обновляет:
 *      <html lang>, <title>, <meta name="description">.
 *
 * Подключать в HTML ДО data.js и app.js — чтобы вызовы t() были доступны на рендере.
 * --------------------------------------------------------------
 */
(function (global) {
    'use strict';

    /** Ключ хранения языка в localStorage. */
    const STORAGE_KEY = 'yfro.lang';
    /** Поддерживаемые языки. Первый — fallback. */
    const SUPPORTED = ['ru', 'en'];
    const FALLBACK_LANG = 'ru';

    // -----------------------------------------------------------------
    // СЛОВАРЬ. Этап 1 — каркас: шапка, dock, переключатель языка, окна,
    // термин-лог, футер, видео-модалка, project-popup, cover-popup, плеер.
    // Контентные массивы (TRACKS, ABOUT_*, MANIFEST_HTML, PRICES, REVIEWS,
    // VIDEOS) — переведём в следующем этапе.
    // -----------------------------------------------------------------
    const I18N_STRINGS = {
        ru: {
            meta: {
                title:       'Kenny Lee | Композитор, Саунд-дизайнер',
                description: 'YFRO — композитор, саунд-дизайнер и продюсер из СПб. Музыка, саунд-дизайн и пост-продакшн для релизов, клипов, фильмов и брендов.',
            },
            header: {
                eyebrow:   '· ЗВУК С ХАРАКТЕРОМ ·',
                tagline1:  'Звучи уверенно.',
                tagline2:  'Звучи уникально.',
                tagline3:  'Звучи потрясающе.',
                recReady:  'REC READY',
                machineName: 'ЕФРЕМ ЛЯЛИН',   // тот же веб-шрифт Cairo Pixel, что и Kenny Lee
                machineMode: 'font',
                machineMultiline: 'true',            // RU-имя раскладывается на две строки
            },
            lang: {
                label: 'ЯЗЫК СИСТЕМЫ',
                aria:  'Переключение языка',
                ruAria: 'Русский',
                enAria: 'English',
            },
            dock: {
                ariaMenu:        'Главное меню',
                hint:            '// SELECT MODULE //',
                back:            '◂ MENU',
                backAria:        'Вернуться в меню',
                music:           { label: 'Музыка',   caption: 'tracks.dat',  aria: 'Открыть музыку' },
                video:           { label: 'Видео',    caption: 'clips.bin',   aria: 'Открыть видео' },
                prices:          { label: 'Прайс',    caption: 'price.cfg',   aria: 'Открыть прайс' },
                about:           { label: 'О себе',   caption: 'about.txt',   aria: 'Открыть «О себе»' },
                manifest:        { label: 'Манифест', caption: 'manifest.md', aria: 'Открыть манифест' },
                reviews:         { label: 'Отзывы',   caption: 'feedback.log',aria: 'Открыть отзывы' },
            },
            termLog: {
                boot: 'booting yellframe.os ...',
            },
            window: {
                ariaMin:   'Свернуть',
                ariaClose: 'Закрыть',
                audio:     '📁 Список музыкальных композиций',
                video:     '🎬 Видео клипы',
                prices:    '💲 Прайс-лист',
                manifest:  '☻ Манифест',
                reviews:   '☷ Отзывы',
                about:     'ℹ О себе',
            },
            filters: {
                all:   'Все',
                pop:   'Pop / Electronica',
                rock:  'Rock / Metal',
                rap:   'Rap / Hip-Hop',
                hard:  'Hard Electronica',
                searchPlaceholder: 'Поиск...',
                empty: 'Ничего не найдено',
            },
            tracks: {
                colArtist:      'Артист',
                colTitle:       'Название',
                colDescription: 'Описание',
                colYear:        'Год',
                colGenre:       'Жанр',
                colDuration:    'Длительность',
                expandAria:     'Развернуть описание',
                badgeNew:       'NEW',
                badgeNewAria:   'Новинка',
                yearEmpty:      '—',
            },
            project: {
                close:    'Закрыть проект',
                fallbackTitle: 'Проект',
                empty:    'В проекте пока нет видео.',
                badge:    'PROJECT',
                videoBadge: 'VIDEO',
            },
            prices: {
                empty: 'Прайс-лист скоро появится. Для индивидуальных запросов — пишите в Telegram.',
            },
            reviews: {
                empty:    'Отзывы скоро появятся.',
                prevAria: 'Предыдущий отзыв',
                nextAria: 'Следующий отзыв',
                dotAria:  'Отзыв',
            },
            about: {
                modeBrief:    'VKLAD: ВЫЖИМКА',
                modeFull:     'VKLAD: ДОСЬЕ',
                modesAria:    'Режимы',
                mediaEmpty:   '// MEDIA SLOT //',
                dossierEmpty: '// DOSSIER — EMPTY //',
                galleryLabel: '// GALLERY',
                galleryAria:  'Фото-галерея',
                photoPrev:    'Предыдущее фото',
                photoNext:    'Следующее фото',
                photoAria:    'Фото',
            },
            search: {
                empty: 'Ничего не найдено',
            },
            player: {
                prev:        'Предыдущий',
                playPause:   'Воспроизведение / пауза',
                next:        'Следующий',
                hide:        'Скрыть плеер',
                showCover:   'Показать обложку',
            },
            footer: {
                copyright: '© 2025 Kenny Lee. Все права защищены.',
            },
        },
        en: {
            meta: {
                title:       'Kenny Lee | Composer, Sound Designer',
                description: 'YFRO — composer, sound designer and producer from St. Petersburg. Music, sound design and post-production for releases, music videos, films and brands.',
            },
            header: {
                eyebrow:   '· SOUND WITH CHARACTER ·',
                tagline1:  'Sound confident.',
                tagline2:  'Sound unique.',
                tagline3:  'Sound stunning.',
                recReady:  'REC READY',
                machineName: 'Kenny Lee',
                machineMode: 'font',
                machineMultiline: 'false',
            },
            lang: {
                label: 'SYSTEM LANGUAGE',
                aria:  'Language switcher',
                ruAria: 'Russian',
                enAria: 'English',
            },
            dock: {
                ariaMenu:        'Main menu',
                hint:            '// SELECT MODULE //',
                back:            '◂ MENU',
                backAria:        'Back to menu',
                music:           { label: 'Music',     caption: 'tracks.dat',  aria: 'Open music' },
                video:           { label: 'Videos',    caption: 'clips.bin',   aria: 'Open videos' },
                prices:          { label: 'Pricing',   caption: 'price.cfg',   aria: 'Open pricing' },
                about:           { label: 'About',     caption: 'about.txt',   aria: 'Open About' },
                manifest:        { label: 'Manifesto', caption: 'manifest.md', aria: 'Open manifesto' },
                reviews:         { label: 'Reviews',   caption: 'feedback.log',aria: 'Open reviews' },
            },
            termLog: {
                boot: 'booting yellframe.os ...',
            },
            window: {
                ariaMin:   'Minimize',
                ariaClose: 'Close',
                audio:     '📁 Track listing',
                video:     '🎬 Videos',
                prices:    '💲 Pricing',
                manifest:  '☻ Manifesto',
                reviews:   '☷ Reviews',
                about:     'ℹ About',
            },
            filters: {
                all:   'All',
                pop:   'Pop / Electronica',
                rock:  'Rock / Metal',
                rap:   'Rap / Hip-Hop',
                hard:  'Hard Electronica',
                searchPlaceholder: 'Search...',
                empty: 'Nothing found',
            },
            tracks: {
                colArtist:      'Artist',
                colTitle:       'Title',
                colDescription: 'Description',
                colYear:        'Year',
                colGenre:       'Genre',
                colDuration:    'Duration',
                expandAria:     'Expand description',
                badgeNew:       'NEW',
                badgeNewAria:   'New release',
                yearEmpty:      '—',
            },
            project: {
                close:    'Close project',
                fallbackTitle: 'Project',
                empty:    'No videos in this project yet.',
                badge:    'PROJECT',
                videoBadge: 'VIDEO',
            },
            prices: {
                empty: 'Pricing will be available soon. For custom requests — message me on Telegram.',
            },
            reviews: {
                empty:    'Reviews coming soon.',
                prevAria: 'Previous review',
                nextAria: 'Next review',
                dotAria:  'Review',
            },
            about: {
                modeBrief:    'TAB: SUMMARY',
                modeFull:     'TAB: DOSSIER',
                modesAria:    'Modes',
                mediaEmpty:   '// MEDIA SLOT //',
                dossierEmpty: '// DOSSIER — EMPTY //',
                galleryLabel: '// GALLERY',
                galleryAria:  'Photo gallery',
                photoPrev:    'Previous photo',
                photoNext:    'Next photo',
                photoAria:    'Photo',
            },
            search: {
                empty: 'Nothing found',
            },
            player: {
                prev:        'Previous',
                playPause:   'Play / pause',
                next:        'Next',
                hide:        'Hide player',
                showCover:   'Show cover',
            },
            footer: {
                copyright: '© 2025 Kenny Lee. All rights reserved.',
            },
        },
    };

    // -----------------------------------------------------------------
    // Внутренние утилиты.
    // -----------------------------------------------------------------

    /** Чтение `?lang=` из URL без ломки на серверах без URLSearchParams. */
    function readLangFromUrl() {
        try {
            const p = new URLSearchParams(global.location.search);
            const v = (p.get('lang') || '').toLowerCase();
            return SUPPORTED.indexOf(v) !== -1 ? v : '';
        } catch (_) { return ''; }
    }

    /** Чтение языка из localStorage (без падения, если приватный режим). */
    function readLangFromStorage() {
        try {
            const v = (global.localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
            return SUPPORTED.indexOf(v) !== -1 ? v : '';
        } catch (_) { return ''; }
    }

    /** Угадывание языка по navigator.language(s). */
    function readLangFromBrowser() {
        const langs = (global.navigator.languages && global.navigator.languages.length)
            ? global.navigator.languages
            : [global.navigator.language || ''];
        for (let i = 0; i < langs.length; i++) {
            const code = (langs[i] || '').toLowerCase().slice(0, 2);
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        // Любой не-русский язык трактуем как 'en'.
        const primary = (langs[0] || '').toLowerCase().slice(0, 2);
        return primary && primary !== 'ru' ? 'en' : '';
    }

    /** Итоговый выбор языка при первом заходе. */
    function getInitialLang() {
        return readLangFromUrl()
            || readLangFromStorage()
            || readLangFromBrowser()
            || FALLBACK_LANG;
    }

    /** Сохранить язык. */
    function persistLang(lang) {
        try { global.localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    }

    /** Достать строку по точечному пути: `t('dock.music.label')`. Возвращает ключ как fallback. */
    function t(path, lang) {
        const useLang = lang || I18N.current;
        const dicts = [I18N_STRINGS[useLang], I18N_STRINGS[FALLBACK_LANG]];
        for (let d = 0; d < dicts.length; d++) {
            const root = dicts[d];
            if (!root) continue;
            const parts = String(path || '').split('.');
            let cur = root;
            let ok = true;
            for (let i = 0; i < parts.length; i++) {
                if (cur && Object.prototype.hasOwnProperty.call(cur, parts[i])) {
                    cur = cur[parts[i]];
                } else { ok = false; break; }
            }
            if (ok && typeof cur === 'string') return cur;
        }
        // Ключ не найден — возвращаем сам путь, чтобы в UI было видно «дыру».
        return path;
    }

    /**
     * Локализация контентных полей из data.js.
     * Принимает:
     *   - строку (легаси) — возвращает без изменений;
     *   - объект { ru, en } — выбирает текущий язык, fallback на RU.
     *   - null/undefined — возвращает ''.
     * Использование: localize(track.description), localize(MANIFEST_HTML), и т.д.
     */
    function localize(value, lang) {
        if (value == null) return '';
        if (typeof value === 'string') return value;
        const useLang = lang || I18N.current;
        if (typeof value === 'object') {
            if (typeof value[useLang] === 'string')        return value[useLang];
            if (typeof value[FALLBACK_LANG] === 'string')  return value[FALLBACK_LANG];
            // Любое строковое поле как крайний fallback.
            for (const k of Object.keys(value)) {
                if (typeof value[k] === 'string') return value[k];
            }
        }
        return '';
    }

    /** Применить переводы ко всему документу. */
    function applyI18n() {
        // 1) Текстовые узлы.
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            el.textContent = t(key);
        });
        // 2) innerHTML (для строк с разметкой типа MANIFEST_HTML).
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (!key) return;
            el.innerHTML = t(key);
        });
        // 3) Атрибуты (title, aria-label, placeholder и т.п.).
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            let map;
            try { map = JSON.parse(el.getAttribute('data-i18n-attr')); } catch (_) { return; }
            Object.keys(map).forEach(attr => {
                el.setAttribute(attr, t(map[attr]));
            });
        });
        // 4) <html lang>, <title>, <meta name="description">.
        document.documentElement.setAttribute('lang', I18N.current);
        const titleStr = t('meta.title');
        if (titleStr) document.title = titleStr;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', t('meta.description'));
        // 5) Перерисовать переключатель в шапке.
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === I18N.current;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        // 6) Имя в шапке (Kenny Lee / ЕФРЕМ ЛЯЛИН) — детерминированно по текущему языку.
        // Функция экспортирована из app.js в window (app.js обёрнут в IIFE). Устраняет flip-flop имени.
        if (typeof global.renderPixelName === 'function') {
            try { global.renderPixelName(); } catch (_) { /* noop */ }
        }
    }

    /**
     * Переключение языка в рантайме.
     * @param {'ru'|'en'} lang
     * @param {{reload?: boolean, updateUrl?: boolean}} opts
     *        reload    — жёсткая перезагрузка с ?lang= (legacy, по умолчанию false).
     *        updateUrl — обновить ?lang= в адресной строке без перезагрузки (по умолчанию true).
     */
    function setLang(lang, opts) {
        opts = opts || {};
        if (SUPPORTED.indexOf(lang) === -1) return;
        persistLang(lang);
        I18N.current = lang;

        if (opts.reload) {
            const url = new URL(global.location.href);
            url.searchParams.set('lang', lang);
            global.location.href = url.toString();
            return;
        }

        // In-place переключение: обновляем URL без reload, чтобы можно было поделиться ссылкой.
        const shouldUpdateUrl = opts.updateUrl !== false;
        if (shouldUpdateUrl && global.history && typeof global.history.replaceState === 'function') {
            try {
                const url = new URL(global.location.href);
                url.searchParams.set('lang', lang);
                global.history.replaceState(null, '', url.toString());
            } catch (_) { /* noop */ }
        }

        applyI18n();
        // Если рендер-функции уже доступны (экспортированы из app.js в window) — перерисуем динамику.
        // applyI18n() уже вызвал renderPixelName; остальные — контентные блоки.
        try {
            if (typeof global.renderTracksTable === 'function') global.renderTracksTable();
            if (typeof global.renderVideos       === 'function') global.renderVideos();
            if (typeof global.renderPrices       === 'function') global.renderPrices();
            if (typeof global.renderManifest     === 'function') global.renderManifest();
            if (typeof global.renderReviews      === 'function') global.renderReviews();
            if (typeof global.renderAbout        === 'function') global.renderAbout();
            if (typeof global.buildTracksHeader  === 'function') global.buildTracksHeader();
        } catch (_) { /* noop */ }
    }

    // -----------------------------------------------------------------
    // Публичный объект I18N.
    // -----------------------------------------------------------------
    const I18N = {
        current: getInitialLang(),
        supported: SUPPORTED.slice(),
        t: t,
        applyI18n: applyI18n,
        setLang: setLang,
        persistLang: persistLang,
        strings: I18N_STRINGS,
    };

    // Сохраняем выбранный язык сразу — чтобы при следующем визите не определять заново.
    persistLang(I18N.current);

    // Глобальные удобные алиасы (используются в HTML и в app.js).
    I18N.localize = localize;
    global.I18N = I18N;
    global.t    = function (path) { return t(path, I18N.current); };
    global.tr   = localize; // короткий алиас для data.js: tr(track.description)

    // Авто-применение перевода после готовности DOM.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyI18n, { once: true });
    } else {
        applyI18n();
    }

})(window);
