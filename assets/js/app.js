/* ============================================================
   Yellframe portfolio — основной скрипт
   Зависит от data.js (TRACKS, VIDEOS, PRICES, ABOUT_HTML).
   ============================================================ */
(() => {
'use strict';

// ---------- Тема ----------
const THEME_KEY = 'yfro-theme';
const ROOT = document.documentElement;
function applyTheme(t) {
    if (t === 'light') ROOT.setAttribute('data-theme', 'light');
    else ROOT.removeAttribute('data-theme');
    localStorage.setItem(THEME_KEY, t);
}
function toggleTheme() {
    applyTheme(ROOT.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}

// ---------- Утилиты ----------
const fmtTime = (sec) => {
    if (!isFinite(sec)) return '—:—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ============================================================
// Аудио-атмосфера — Web Audio API (intro + бесшовный фоновой луп)
// ============================================================
// Архитектура:
//   — Общий AudioContext (создаётся по первому user-gesture — иначе браузер его не разрешит).
//   — Префетч обоих файлов: fetch → arrayBuffer → decodeAudioData → AudioBuffer.
//   — intro и loop играются как AudioBufferSourceNode → GainNode → destination.
//   — loop стартует после intro (по таймеру в терминах AudioContext.currentTime — без setTimeout-джиттера).
//   — stop() с fade-out через GainNode — без щелчков.
// Преимущество: AudioBufferSourceNode.loop = true — sample-accurate, без разрывов между итерациями.
const ambience = {
    ctx:        null,
    masterGain: null,
    introBuf:   null,
    loopBuf:    null,
    loopSrc:    null,    // живой BufferSource лупа (одноразовый, пересоздаётся при start)
    loopGain:   null,
    introGain:  null,
    cfg:        null,
    started:    false,
    killed:     false,

    /// Время fade-out в секундах (чтобы stop не щёлкал).
    FADE_OUT_S: 0.35,

    init() {
        const cfg = (typeof AUDIO_AMBIENCE !== 'undefined') ? AUDIO_AMBIENCE : null;
        if (!cfg) return;
        this.cfg = cfg;
        // ПРИМЕЧАНИЕ: раньше здесь была подписка на глобальные pointerdown/click — но хром ругается,
        // если они срабатывают не от прямого жеста (напр. при синтетическом click).
        // Теперь unlock вызывается явно из обработчика клика по GO — 100% доверенный user-gesture.
    },

    /// Публичный API: зовётся из обработчика клика/тапа по GO. Не async — весь AudioContext путь синхронный.
    unlock() { this._unlockSync(); },

    // СИНХРОННЫЙ unlock: создаём AudioContext в самом первом тике user-gesture.
    // Дальнейшая логика уходит в _bootstrapAudio (асинхронный, но ctx уже разблокирован).
    _unlockSync() {
        if (this.started || this.killed) return;
        this.started = true;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) { console.warn('[ambience] Web Audio API unavailable'); return; }
            this.ctx = new AC();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 1;
            this.masterGain.connect(this.ctx.destination);
            // Синхронный resume() — вызываем сразу, без await (обещание просто разрешится позже).
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(e => console.warn('[ambience] ctx.resume failed:', e));
            }
            console.info('[ambience] AudioContext ready, state =', this.ctx.state);
        } catch (e) {
            console.warn('[ambience] AudioContext init failed:', e);
            return;
        }
        // Продолжаем асинхронно: загружаем буферы и играем intro+loop.
        this._bootstrapAudio();
    },

    async _bootstrapAudio() {
        // Буферы грузятся параллельно + логирование ошибок (пропущенных файлов и т.д.).
        const tasks = [];
        if (this.cfg.intro?.enabled && this.cfg.intro.src) {
            tasks.push(
                this._loadBuffer(this.cfg.intro.src)
                    .then(b => { this.introBuf = b; console.info('[ambience] intro loaded:', this.cfg.intro.src); })
                    .catch(err => console.warn('[ambience] intro load failed:', this.cfg.intro.src, err))
            );
        }
        if (this.cfg.loop?.enabled && this.cfg.loop.src) {
            tasks.push(
                this._loadBuffer(this.cfg.loop.src)
                    .then(b => { this.loopBuf = b; console.info('[ambience] loop loaded:', this.cfg.loop.src); })
                    .catch(err => console.warn('[ambience] loop load failed:', this.cfg.loop.src, err))
            );
        }
        await Promise.allSettled(tasks);
        if (this.killed) return;

        this._playIntroThenLoop();
    },

    async _loadBuffer(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
        const arr = await res.arrayBuffer();
        return await this.ctx.decodeAudioData(arr);
    },

    _playIntroThenLoop() {
        const introVol = this.cfg.intro?.volume ?? 0.6;
        const loopVol  = this.cfg.loop?.volume  ?? 0.25;
        const delayMs  = this.cfg.loop?.delayAfterIntroMs ?? 0;

        // Старт intro (если есть).
        let loopStartAt = this.ctx.currentTime;
        if (this.introBuf) {
            this.introGain = this.ctx.createGain();
            this.introGain.gain.value = introVol;
            this.introGain.connect(this.masterGain);

            const src = this.ctx.createBufferSource();
            src.buffer = this.introBuf;
            src.connect(this.introGain);
            src.start(loopStartAt);

            loopStartAt += this.introBuf.duration + delayMs / 1000;
        }

        // Старт бесшовного лупа — точно по расписанию после intro.
        if (this.loopBuf) {
            this.loopGain = this.ctx.createGain();
            this.loopGain.gain.value = loopVol;
            this.loopGain.connect(this.masterGain);

            const src = this.ctx.createBufferSource();
            src.buffer = this.loopBuf;
            src.loop   = true;
            src.connect(this.loopGain);
            src.start(loopStartAt);
            this.loopSrc = src;
        }
    },

    /// Останавливает фон навсегда — вызываем, когда юзер запускает трек/видео.
    /// Fade-out через GainNode — без щелчка на резком обрыве фазы.
    stop() {
        if (this.killed) return;
        this.killed = true;
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const g   = this.masterGain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + this.FADE_OUT_S);
        // После fade-out останавливаем source-ноды — освобождаем ресурсы.
        setTimeout(() => {
            try { this.loopSrc && this.loopSrc.stop(); } catch (_) {}
            this.loopSrc = null;
        }, this.FADE_OUT_S * 1000 + 50);
    },
};

// ============================================================
// Окна (перетаскивание + сворачивание)
// ============================================================
/**
 * При drag/resize окно переводится в absolute-позиционирование относительно .desktop.
 * .desktop растягивается по мере перемещения вниз/вправо — холст растёт.
 */
function detachWindow(win) {
    const desktop = win.parentElement;
    if (!desktop || win.dataset.detached) return;
    const winRect = win.getBoundingClientRect();
    const dRect   = desktop.getBoundingClientRect();
    win.style.position = 'absolute';
    win.style.left   = (winRect.left - dRect.left) + 'px';
    win.style.top    = (winRect.top  - dRect.top)  + 'px';
    win.style.width  = winRect.width  + 'px';
    win.style.height = winRect.height + 'px';
    win.dataset.detached = '1';
    syncDesktopHeight(desktop);
}

function syncDesktopHeight(desktop) {
    if (!desktop) return;
    // Учитываем только detached-окна (absolute): flex стек и без этого корректен.
    let maxBottom = 0;
    $$('.window', desktop).forEach(w => {
        if (!w.dataset.detached) return;
        if (w.style.display === 'none') return;
        const top    = parseFloat(w.style.top)    || 0;
        const height = parseFloat(w.style.height) || w.offsetHeight;
        maxBottom = Math.max(maxBottom, top + height);
    });
    desktop.style.minHeight = maxBottom ? (maxBottom + 24) + 'px' : '';
}

function makeDraggable(win) {
    const bar = $('.window-titlebar', win);
    if (!bar) return;
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

    bar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.win-btn')) return;
        dragging = true;
        win.classList.add('dragging');
        detachWindow(win);
        sx = e.clientX; sy = e.clientY;
        ox = parseFloat(win.style.left) || 0;
        oy = parseFloat(win.style.top)  || 0;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        // Без ограничений — окно можно тащить куда угодно (в том числе за пределы десктопа).
        win.style.left = (ox + e.clientX - sx) + 'px';
        win.style.top  = (oy + e.clientY - sy) + 'px';
        syncDesktopHeight(win.parentElement);
    });
    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        win.classList.remove('dragging');
        syncDesktopHeight(win.parentElement);
    });

    // Ручка ресайза
    if (!$('.window-resize', win)) {
        const handle = document.createElement('span');
        handle.className = 'window-resize';
        handle.title = 'Изменить размер';
        win.appendChild(handle);
        let rsz = false, rsx = 0, rsy = 0, rW = 0, rH = 0;
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            rsz = true;
            detachWindow(win);
            rsx = e.clientX; rsy = e.clientY;
            rW = win.offsetWidth;
            rH = win.offsetHeight;
        });
        document.addEventListener('mousemove', (e) => {
            if (!rsz) return;
            win.style.width  = Math.max(280, rW + e.clientX - rsx) + 'px';
            win.style.height = Math.max(160, rH + e.clientY - rsy) + 'px';
            syncDesktopHeight(win.parentElement);
        });
        document.addEventListener('mouseup', () => {
            if (!rsz) return;
            rsz = false;
            syncDesktopHeight(win.parentElement);
        });
    }

    // Кнопки заголовка
    $$('.win-btn', win).forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const desktop = win.parentElement;
            const inDock  = desktop && desktop.classList.contains('dock-mode');
            if (action === 'min') {
                if (win.classList.contains('minimized')) {
                    // Разворачиваем и возвращаем сохранённую высоту
                    win.classList.remove('minimized');
                    if (win.dataset.savedHeight) {
                        win.style.height = win.dataset.savedHeight;
                        delete win.dataset.savedHeight;
                    }
                } else {
                    // Сохраняем текущую высоту, чтобы вернуть при развороте
                    if (win.style.height) win.dataset.savedHeight = win.style.height;
                    win.classList.add('minimized');
                }
                syncDesktopHeight(desktop);
            }
            if (action === 'close' && !inDock) win.style.display = 'none';
        });
    });
}

function buildWindow({ id, title, toolbar = '', body = '' }) {
    const w = document.createElement('section');
    w.className = 'window';
    w.id = id;
    w.innerHTML = `
        <div class="window-titlebar">
            <span class="icon"></span>
            <span class="title">${title}</span>
            <span class="win-btns">
                <button class="win-btn" data-action="min" title="Свернуть">_</button>
                <button class="win-btn" data-action="close" title="Закрыть">×</button>
            </span>
        </div>
        ${toolbar ? `<div class="window-toolbar">${toolbar}</div>` : ''}
        <div class="window-body">${body}</div>
    `;
    return w;
}

// ============================================================
// Таблица треков: сортировка, ресайз колонок, фильтр, поиск
// ============================================================
const COLUMNS = [
    { key: 'artist',      label: 'Артист',     width: 140 },
    { key: 'title',       label: 'Название',   width: 240 },
    { key: 'description', label: 'Описание',   width: 320 },
    { key: 'genre',       label: 'Жанр',       width: 110 },
    { key: 'duration',    label: 'Длительность', width: 110, align: 'right' },
];

let sortState = { key: 'title', dir: 1 };
let activeGenre = 'all';
let searchQuery = '';
// Индексы треков, у которых развернуто описание.
const expandedDescriptions = new Set();

function renderTracksTable() {
    const tbody = $('#tracks-tbody');
    if (!tbody) return;

    let rows = TRACKS.slice();

    if (activeGenre !== 'all') {
        rows = rows.filter(t => t.genre.split('/').includes(activeGenre));
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        rows = rows.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q));
    }

    const { key, dir } = sortState;
    rows.sort((a, b) => {
        const va = a[key], vb = b[key];
        if (typeof va === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), 'ru') * dir;
    });

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="${COLUMNS.length}" class="tracks-empty">Ничего не найдено</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(t => {
        const idx = TRACKS.indexOf(t);
        const cls = (player.currentIndex === idx && !player.audio.paused) ? 'playing' : '';
        const expanded = expandedDescriptions.has(idx);
        const arrow = expanded ? '▲' : '▼';
        const descCls = expanded ? 'desc-cell expanded' : 'desc-cell';
        return `
        <tr class="${cls}" data-idx="${idx}">
            <td>${t.artist}</td>
            <td>${t.title}</td>
            <td class="${descCls}">
                <span class="desc-text">${t.description}</span>
                <button type="button" class="desc-toggle" data-idx="${idx}" aria-expanded="${expanded}" aria-label="Развернуть описание">${arrow}</button>
            </td>
            <td>${t.genre}</td>
            <td style="text-align:right">${fmtTime(t.duration)}</td>
        </tr>`;
    }).join('');

    $$('#tracks-tbody tr').forEach(tr => {
        tr.addEventListener('click', (e) => {
            // Клик по кнопке разворота описания — не запускаем трек.
            if (e.target.closest('.desc-toggle')) return;
            player.playIndex(parseInt(tr.dataset.idx, 10));
        });
    });
    $$('#tracks-tbody .desc-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const i = parseInt(btn.dataset.idx, 10);
            if (expandedDescriptions.has(i)) expandedDescriptions.delete(i);
            else expandedDescriptions.add(i);
            renderTracksTable();
        });
    });
    // Помечаем ячейки, в которых текст реально обрезан (видно «…»).
    // Кнопка «↓» показывается только для .has-overflow или уже развернутых (CSS).
    requestAnimationFrame(updateDescOverflow);
}

function updateDescOverflow() {
    $$('#tracks-tbody td.desc-cell').forEach(td => {
        if (td.classList.contains('expanded')) {
            td.classList.remove('has-overflow');
            return;
        }
        const span = td.querySelector('.desc-text');
        if (!span) return;
        // Сравниваем реальную ширину текста (ячейка под ellipsis) с видимой шириной ячейки.
        const overflow = td.scrollWidth - td.clientWidth > 1;
        td.classList.toggle('has-overflow', overflow);
    });
}

function buildTracksHeader() {
    const thead = $('#tracks-thead');
    thead.innerHTML = '<tr>' + COLUMNS.map((c, i) => `
        <th data-key="${c.key}" style="width:${c.width}px">
            <span class="th-label">${c.label}</span>
            <span class="sort-ind"></span>
            ${i < COLUMNS.length - 1 ? '<span class="col-resizer"></span>' : ''}
        </th>`).join('') + '</tr>';

    // Сортировка
    $$('#tracks-thead th').forEach(th => {
        th.addEventListener('click', (e) => {
            if (e.target.classList.contains('col-resizer')) return;
            const key = th.dataset.key;
            if (sortState.key === key) sortState.dir = -sortState.dir;
            else { sortState.key = key; sortState.dir = 1; }
            updateSortIndicators();
            renderTracksTable();
        });
    });

    // Ресайз
    $$('#tracks-thead .col-resizer').forEach(rz => {
        rz.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const th = rz.parentElement;
            const startX = e.clientX;
            const startW = th.offsetWidth;
            const onMove = (ev) => {
                const w = Math.max(60, startW + ev.clientX - startX);
                th.style.width = w + 'px';
                updateDescOverflow();
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    });

    updateSortIndicators();
}

function updateSortIndicators() {
    $$('#tracks-thead th').forEach(th => {
        const ind = $('.sort-ind', th);
        if (th.dataset.key === sortState.key) {
            th.classList.add('sorted');
            ind.textContent = sortState.dir > 0 ? '▲' : '▼';
        } else {
            th.classList.remove('sorted');
            ind.textContent = '';
        }
    });
}

// Подгружаем длительности треков один раз
function preloadDurations() {
    TRACKS.forEach((t, i) => {
        const a = new Audio();
        a.preload = 'metadata';
        a.src = t.src;
        a.addEventListener('loadedmetadata', () => {
            TRACKS[i].duration = a.duration || 0;
            renderTracksTable();
        });
    });
}

// ============================================================
// Окно с обложкой трека (привязано к окну Музыка)
// ------------------------------------------------------------
// Появляется справа от #win-audio. Закрывается, если:
//  — сменился трек (в playIndex), открывается заново с новой обложкой;
//  — закрыли #win-audio (или он пропал из стека);
//  — фокус перешёл на другое окно (focusWindow).
const DEFAULT_COVER = 'assets/img/logo.png';
let _coverHideTimer = null;
function openCoverFor(track) {
    const pop = $('#cover-pop');
    if (!pop || !track) return;
    // Отменяем отложенное скрытие от предыдущего closeCoverPop — оно может скрыть уже открытый попап.
    if (_coverHideTimer) { clearTimeout(_coverHideTimer); _coverHideTimer = null; }
    const img = $('#cover-pop-img');
    img.src = track.cover || DEFAULT_COVER;
    img.alt = `${track.artist} — ${track.title}`;
    $('#cover-pop-artist').textContent = track.artist || '';
    $('#cover-pop-track').textContent  = track.title  || '';
    $('#cover-pop-title').textContent  = (track.title || 'cover').toLowerCase().replace(/\s+/g, '_') + '.bin';

    pop.hidden = false;
    pop.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => positionCoverPop());
    pop.classList.add('open');
    // Обновим мини-обложку в плеере.
    const plCover    = $('#pl-cover');
    const plCoverImg = $('#pl-cover-img');
    if (plCover && plCoverImg) {
        plCoverImg.src = track.cover || DEFAULT_COVER;
        plCover.hidden = false;
    }
}
function closeCoverPop() {
    const pop = $('#cover-pop');
    if (!pop || pop.hidden) return;
    pop.classList.remove('open');
    pop.setAttribute('aria-hidden', 'true');
    if (_coverHideTimer) clearTimeout(_coverHideTimer);
    _coverHideTimer = setTimeout(() => {
        pop.hidden = true;
        _coverHideTimer = null;
    }, 180);
}
function positionCoverPop() {
    const pop = $('#cover-pop');
    const audio = $('#win-audio');
    if (!pop || !audio) return;
    if (audio.style.display === 'none' || !audio.classList.contains('is-active')) {
        // Аудио не видно — спрячем обложку.
        closeCoverPop();
        return;
    }
    const r = audio.getBoundingClientRect();
    const popW = pop.offsetWidth || 280;
    const margin = 12;
    let left = r.right + margin;
    let top  = r.top;
    // Если справа не влезает — слева.
    if (left + popW > window.innerWidth - 8) {
        left = r.left - popW - margin;
    }
    // Если и там нет места — прикрепляем к правому краю экрана.
    if (left < 8) left = Math.max(8, window.innerWidth - popW - 8);
    pop.style.left = left + 'px';
    pop.style.top  = Math.max(8, top) + 'px';
}

// ============================================================
// Плеер (нижняя панель)
// ============================================================
const player = {
    audio: new Audio(),
    currentIndex: -1,
    bar: null,

    init() {
        this.bar = $('#player-bar');
        const a = this.audio;

        $('#pl-play').addEventListener('click', () => this.toggle());
        $('#pl-prev').addEventListener('click', () => this.step(-1));
        $('#pl-next').addEventListener('click', () => this.step(1));
        $('#pl-close').addEventListener('click', () => this.stop());

        const seek = $('#pl-seek');
        // Ганка input ↔ timeupdate: пока пользователь тянет ползунок, timeupdate перезаписывал seek.value
        // обратно к текущему currentTime, и следующий input возвращал положение назад. Флаг isDragging
        // «вырубает» авто-обновление ползунка на время drag-а.
        let isDragging = false;
        const startDrag = () => { isDragging = true; };
        const endDrag   = () => {
            // Реальная перемотка — только по отпусканию (быстрее + не дёргает audio элемент).
            if (a.duration && isFinite(a.duration)) {
                a.currentTime = (parseFloat(seek.value) / 100) * a.duration;
            }
            isDragging = false;
        };
        seek.addEventListener('pointerdown', startDrag);
        seek.addEventListener('mousedown',  startDrag);
        seek.addEventListener('touchstart', startDrag, { passive: true });
        seek.addEventListener('pointerup',   endDrag);
        seek.addEventListener('mouseup',     endDrag);
        seek.addEventListener('touchend',    endDrag);
        seek.addEventListener('change',      endDrag);
        // Обновляем отображаемое время в процессе движения — без реальной перемотки.
        seek.addEventListener('input', () => {
            if (!a.duration) return;
            $('#pl-cur').textContent = fmtTime((parseFloat(seek.value) / 100) * a.duration);
        });
        // Клик-мимо-thumb (тап по треку) — браузер сам изменяет seek.value и стреляет change — уже обработано endDrag.

        $('#pl-vol').addEventListener('input', (e) => {
            a.volume = parseFloat(e.target.value);
        });
        a.volume = 0.7;

        a.addEventListener('timeupdate', () => {
            if (!a.duration) return;
            if (!isDragging) seek.value = (a.currentTime / a.duration) * 100;
            $('#pl-cur').textContent = fmtTime(a.currentTime);
            $('#pl-dur').textContent = fmtTime(a.duration);
        });
        a.addEventListener('ended', () => this.step(1));
        a.addEventListener('play',  () => { $('#pl-play').textContent = '❚❚'; renderTracksTable(); });
        a.addEventListener('pause', () => { $('#pl-play').textContent = '▶';  renderTracksTable(); });
    },

    playIndex(i) {
        if (i < 0 || i >= TRACKS.length) return;
        // Пользователь запустил своё аудио — глушим фоновую петлю.
        ambience.stop();
        const t = TRACKS[i];
        this.currentIndex = i;
        this.audio.src = t.src;
        this.audio.play().catch(err => console.warn('play failed', err));
        $('#pl-title').textContent = t.title;
        $('#pl-artist').textContent = t.artist;
        this.bar.classList.add('visible');
        // Обложка: обновляем содержимое, не закрывая попап — иначе будет рисоваться мигание при переключении треков.
        openCoverFor(t);
        if (typeof logEvent === 'function') logEvent(`play ${t.artist} — ${t.title} ... streaming`);
    },

    toggle() {
        if (this.currentIndex < 0) return this.playIndex(0);
        if (this.audio.paused) this.audio.play(); else this.audio.pause();
    },

    step(delta) {
        if (this.currentIndex < 0) return;
        const next = (this.currentIndex + delta + TRACKS.length) % TRACKS.length;
        this.playIndex(next);
    },

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.bar.classList.remove('visible');
        closeCoverPop();
        const plCover = $('#pl-cover');
        if (plCover) plCover.hidden = true;
        renderTracksTable();
    },
};

// ============================================================
// Видео: индивидуальные ролики + проекты-папки
// ------------------------------------------------------------
// Карточка («широкая рамка»): сверху — title (пиксельный шрифт имени) и короткое описание,
// ниже — превью (16:9). Наведение — неон-свечение в цвете --glow.
// type: 'project' — открывает мини-попап со списком вложенных видео.
// type: 'video'   — открывает полноэкранную модалку (iframe + полное описание под плеером).
function renderVideos() {
    const root = $('#videos-grid');
    if (!root) return;
    root.innerHTML = VIDEOS.map((v, i) => buildVideoCard(v, i)).join('');
    $$('.video-card', root).forEach(card => {
        card.addEventListener('click', (e) => {
            const idx = parseInt(card.dataset.idx, 10);
            const item = VIDEOS[idx];
            if (!item) return;
            if (item.type === 'project') openProjectPop(item, card, e);
            else openVideoModal(item);
        });
    });
}

/// Извлекает URL превью из адреса embed-видео или из поля preview в данных.
/// YouTube: youtu.be/ID, youtube.com/embed/ID, youtube.com/watch?v=ID  → img.youtube.com/vi/ID/hqdefault.jpg
/// Vimeo, Google Drive: автоматически нет (нужен API или вход), ждём явный v.preview = '...'.
function extractVideoPreview(v) {
    if (v.preview) return v.preview;
    const src = v.src || '';
    const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|v\/))([A-Za-z0-9_-]{6,})/);
    if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
    return null;
}

function buildVideoCard(v, i) {
    const isProject = v.type === 'project';
    const badge = isProject
        ? `<span class="video-badge">PROJECT · ${(v.items || []).length}</span>`
        : `<span class="video-badge">VIDEO</span>`;
    // Для проекта — берём v.cover/v.preview, либо первое вложенное видео в проекте.
    let preview = v.preview || v.cover;
    if (!preview && isProject && v.items && v.items[0]) preview = extractVideoPreview(v.items[0]);
    if (!preview && !isProject) preview = extractVideoPreview(v);
    const previewHtml = preview
        ? `<img class="video-card-preview" src="${preview}" alt="" loading="lazy">`
        : '';
    return `
        <article class="video-card${isProject ? ' is-project' : ''}${preview ? ' has-preview' : ''}" data-idx="${i}">
            <header class="video-card-head">
                <h3 class="video-card-title">${v.title}</h3>
                <p  class="video-card-desc">${v.description || ''}</p>
            </header>
            <div class="video-card-frame">
                ${previewHtml}
                ${badge}
                <span class="play-icon" aria-hidden="true">▶</span>
            </div>
        </article>
    `;
}

// ---------- Полноэкранная модалка с плеером и с описанием под ним ----------
function openVideoModal(v) {
    if (!v || !v.src) return;
    // Пользователь открыл видео — глушим фоновую петлю.
    ambience.stop();
    const m = $('#video-modal');
    const sep = v.src.includes('?') ? '&' : '?';
    $('#video-modal iframe').src = v.src + sep + 'autoplay=1';
    $('#video-modal-title').textContent = v.title || '';
    $('#video-modal-desc').textContent  = v.description || '';
    m.classList.add('active');
    // Окно выбора видео проекта (#project-pop) НЕ закрываем — пользователь может вернуться к списку после просмотра.
}
function closeVideoModal() {
    const m = $('#video-modal');
    m.classList.remove('active');
    $('#video-modal iframe').src = '';
}

// ---------- Окно «Проект» (подпапка) ----------
// Отдельный модальный слой по центру экрана. Полное описание проекта + сетка карточек
// вложенных видео (вариант .video-card). Клик вне фрейма / × / Esc — закрывает подпапку.
// Основное окно видео при этом остаётся.
function openProjectPop(project, card, evt) {
    if (evt) evt.stopPropagation();
    const pop = $('#project-pop');
    if (!pop) return;
    $('#project-pop-title').textContent = project.title || 'Проект';
    $('#project-pop-desc').textContent  = project.description || '';
    const body = $('#project-pop-body');
    body.innerHTML = (project.items || []).map((it, j) => `
        <article class="video-card project-sub-card" data-idx="${j}">
            <header class="video-card-head">
                <h3 class="video-card-title">${it.title}</h3>
                <p  class="video-card-desc">${it.description || ''}</p>
            </header>
            <div class="video-card-frame">
                <span class="video-badge">VIDEO</span>
                <span class="play-icon" aria-hidden="true">▶</span>
            </div>
        </article>
    `).join('') || '<div class="project-empty">В проекте пока нет видео.</div>';

    $$('.project-sub-card', body).forEach(c => {
        c.addEventListener('click', () => {
            const j = parseInt(c.dataset.idx, 10);
            const it = (project.items || [])[j];
            if (it) openVideoModal(it);
        });
    });

    pop.hidden = false;
    pop.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => pop.classList.add('open'));
    document.body.classList.add('no-scroll');
}

function closeProjectPop() {
    const pop = $('#project-pop');
    if (!pop || pop.hidden) return;
    pop.classList.remove('open');
    pop.setAttribute('aria-hidden', 'true');
    setTimeout(() => { pop.hidden = true; }, 200);
    document.body.classList.remove('no-scroll');
}

// Клик по фону окна-проекта (не по рамке .project-modal-frame) — закрыть.
document.addEventListener('click', (e) => {
    const pop = $('#project-pop');
    if (!pop || pop.hidden) return;
    if (e.target === pop) closeProjectPop();
});

// ============================================================
// Прайс-лист
// ============================================================
function renderPrices() {
    const root = $('#prices-body');
    if (!PRICES.length) {
        root.innerHTML = `<div class="price-empty">Прайс-лист скоро появится. Для индивидуальных запросов — пишите в Telegram.</div>`;
        return;
    }
    root.innerHTML = `
        <ul class="prices-list">
            ${PRICES.map((p, i) => `
            <li class="price-item" style="animation-delay:${i * 0.07}s">
                <img class="price-icon" src="${p.image}" alt="${p.service}">
                <div class="price-info">
                    <span class="price-idx" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
                    <h3 class="price-name">${p.service}</h3>
                    <p class="price-desc">${p.desc || ''}</p>
                </div>
                <span class="price-value">${p.price}</span>
            </li>`).join('')}
        </ul>`;
}

// ============================================================
// Манифест / Отзывы / About
// ============================================================
function renderManifest() {
    const root = $('#manifest-body');
    if (root) root.innerHTML = MANIFEST_HTML;
}

// Отзывы: карусель с автопрокруткой в стиле spy-OS.
const REVIEW_AUTOPLAY_MS = 5000; /// Интервал автопрокрутки (по умолчанию 5 с).
const REVIEW_DEFAULT_IMG = 'assets/img/logo.png';
let _reviewsTimer = null;
let _reviewsIndex = 0;

function renderReviews() {
    const root = $('#reviews-body');
    if (!root) return;
    if (!REVIEWS.length) {
        root.innerHTML = `<div class="reviews-empty">Отзывы скоро появятся.</div>`;
        return;
    }

    const slides = REVIEWS.map((r, i) => `
        <article class="review-slide" data-i="${i}" aria-hidden="${i === 0 ? 'false' : 'true'}">
            <div class="review-frame">
                <img class="review-img" src="${r.image || REVIEW_DEFAULT_IMG}" alt="${(r.name || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="review-copy">
                <h3 class="review-name">${r.name || ''}</h3>
                <p class="review-role">${r.role || ''}</p>
                <p class="review-text">${r.text || ''}</p>
            </div>
        </article>
    `).join('');

    const dots = REVIEWS.map((_, i) => `
        <button class="review-dot${i === 0 ? ' active' : ''}" data-i="${i}" type="button" aria-label="Отзыв ${i + 1}"></button>
    `).join('');

    root.innerHTML = `
        <div class="reviews-carousel" id="reviews-carousel">
            <button class="review-nav prev" type="button" aria-label="Предыдущий отзыв">‹</button>
            <div class="reviews-track">${slides}</div>
            <button class="review-nav next" type="button" aria-label="Следующий отзыв">›</button>
            <div class="review-dots" role="tablist">${dots}</div>
            <div class="review-progress" aria-hidden="true"><span></span></div>
        </div>`;

    bindReviewsCarousel();
}

function bindReviewsCarousel() {
    const car = $('#reviews-carousel');
    if (!car) return;
    _reviewsIndex = 0;

    const go = (next, dir) => {
        const slides = $$('.review-slide', car);
        const total  = slides.length;
        if (!total) return;
        const cur = _reviewsIndex % total;
        const nxt = ((next % total) + total) % total;
        if (nxt === cur) return;
        const direction = dir != null ? dir : (nxt > cur || (cur === total - 1 && nxt === 0) ? 1 : -1);
        const curEl = slides[cur];
        const nxtEl = slides[nxt];
        // Ставим классы spy-OS-перехода.
        curEl.classList.remove('active');
        curEl.classList.add(direction > 0 ? 'leave-left' : 'leave-right');
        nxtEl.classList.remove('leave-left', 'leave-right');
        nxtEl.classList.add('active', direction > 0 ? 'enter-right' : 'enter-left');
        slides.forEach(s => s.setAttribute('aria-hidden', s === nxtEl ? 'false' : 'true'));
        // Чистим служебные классы после анимации.
        const onEnd = () => {
            curEl.classList.remove('leave-left', 'leave-right');
            nxtEl.classList.remove('enter-left', 'enter-right');
            nxtEl.removeEventListener('animationend', onEnd);
        };
        nxtEl.addEventListener('animationend', onEnd);
        // Точки.
        $$('.review-dot', car).forEach((d, i) => d.classList.toggle('active', i === nxt));
        _reviewsIndex = nxt;
        restartProgress();
    };

    const restartProgress = () => {
        const bar = $('.review-progress span', car);
        if (!bar) return;
        bar.style.animation = 'none';
        // Рефлоу для рестарта.
        // eslint-disable-next-line no-unused-expressions
        bar.offsetWidth;
        bar.style.animation = `review-progress ${REVIEW_AUTOPLAY_MS}ms linear`;
    };

    const start = () => {
        stop();
        if (REVIEWS.length < 2) return;
        restartProgress();
        _reviewsTimer = setInterval(() => go(_reviewsIndex + 1, 1), REVIEW_AUTOPLAY_MS);
    };
    const stop = () => {
        if (_reviewsTimer) { clearInterval(_reviewsTimer); _reviewsTimer = null; }
    };

    $('.review-nav.prev', car).addEventListener('click', () => { go(_reviewsIndex - 1, -1); start(); });
    $('.review-nav.next', car).addEventListener('click', () => { go(_reviewsIndex + 1, 1);  start(); });
    $$('.review-dot', car).forEach(d => {
        d.addEventListener('click', () => { go(parseInt(d.dataset.i, 10)); start(); });
    });
    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', start);

    start();
}

// О себе: два режима в стиле spy-OS — «VKLAD: ВЫЖИМКА» и «VKLAD: ДОСЬЕ».
// Режим хранится в localStorage, чтобы было «похоже на реальный интерфейс».
const ABOUT_MODE_KEY = 'yfro:about-mode';
function renderAbout() {
    const root = $('#about-body');
    if (!root) return;

    // Бриф с портретом.
    const briefHTML = `
        <div class="about-brief">
            <figure class="about-portrait">
                <img src="${ABOUT_PORTRAIT.src}" alt="${(ABOUT_PORTRAIT.alt || '').replace(/"/g, '&quot;')}">
                <figcaption>${ABOUT_PORTRAIT.caption || ''}</figcaption>
            </figure>
            <div class="about-brief-text">${ABOUT_BRIEF}</div>
        </div>`;

    // Досье — хронологические этапы. Четные/нечетные строки отражаются зеркально (слева/справа).
    const fullItems = ABOUT_TIMELINE.map((it, i) => {
        const media = renderAboutMedia(it);
        const hasMedia = !!media;
        return `
            <article class="about-row${hasMedia ? '' : ' no-media'}${i % 2 ? ' alt' : ''}">
                <div class="about-meta">
                    <span class="about-year">${it.year || ''}</span>
                    <h3 class="about-title">${it.title || ''}</h3>
                    <div class="about-text">${it.text || ''}</div>
                </div>
                <div class="about-media" aria-hidden="${hasMedia ? 'false' : 'true'}">
                    ${media || '<div class="about-media-empty">// MEDIA SLOT //</div>'}
                    ${it.caption ? `<figcaption class="about-caption">${it.caption}</figcaption>` : ''}
                </div>
            </article>`;
    }).join('');
    const fullHTML = `<div class="about-full">${fullItems || '<p class="about-empty">// DOSSIER — EMPTY //</p>'}</div>`;

    root.innerHTML = `
        <div class="about-tabs" role="tablist" aria-label="Режимы">
            <button class="about-tab" data-mode="brief" role="tab" type="button">
                <span class="about-tab-mark" aria-hidden="true">[·]</span> VKLAD: ВЫЖИМКА
            </button>
            <button class="about-tab" data-mode="full" role="tab" type="button">
                <span class="about-tab-mark" aria-hidden="true">[···]</span> VKLAD: ДОСЬЕ
            </button>
        </div>
        <section class="about-pane about-pane-brief" data-mode="brief">${briefHTML}</section>
        <section class="about-pane about-pane-full"  data-mode="full">${fullHTML}</section>
    `;

    const setMode = (mode) => {
        $$('.about-tab', root).forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        $$('.about-pane', root).forEach(p => p.classList.toggle('active', p.dataset.mode === mode));
        try { localStorage.setItem(ABOUT_MODE_KEY, mode); } catch (_) {}
    };
    $$('.about-tab', root).forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    setMode(localStorage.getItem(ABOUT_MODE_KEY) || 'brief');
}

// Рендер одного медиа-блока: фото | локальное video | YouTube/Drive iframe.
function renderAboutMedia(item) {
    if (item.image) {
        const alt = (item.title || '').replace(/"/g, '&quot;');
        return `<img class="about-img" src="${item.image}" alt="${alt}" loading="lazy">`;
    }
    if (item.video) {
        const v = item.video;
        const isEmbed = /youtube\.com|youtu\.be|drive\.google\.com|vimeo\.com/.test(v);
        if (isEmbed) {
            return `<div class="about-vid-frame"><iframe src="${v}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
        }
        return `<div class="about-vid-frame"><video src="${v}" controls preload="metadata" playsinline></video></div>`;
    }
    return '';
}

// ============================================================
// Жанры
// ============================================================
function bindGenreFilters() {
    $$('.genre-filters button').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.genre-filters button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeGenre = btn.dataset.genre;
            renderTracksTable();
        });
    });
    $('#tracks-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderTracksTable();
    });
}

// ============================================================
// 8-bit имя в шапке (увеличенные начальные буквы)
// ============================================================
// Заглавные буквы: 7 ширина × 9 высота. Пропорции классического пиксельного шрифта.
const PIXEL_LETTERS_BIG = {
    'Е': [
        '1111111',
        '1111111',
        '1100000',
        '1100000',
        '1111110',
        '1100000',
        '1100000',
        '1111111',
        '1111111',
    ],
    'Л': [
        '0111110',
        '0111110',
        '0110110',
        '0110110',
        '0110110',
        '0110110',
        '0110110',
        '1100011',
        '1100011',
    ],
};

// Обычные буквы: каноническая кириллица 5×7 (стиль DOS / IBM). Читаемые и пропорциональные.
const PIXEL_LETTERS_SMALL = {
    'Е': [
        '11111',
        '10000',
        '10000',
        '11110',
        '10000',
        '10000',
        '11111',
    ],
    'Ф': [
        '01110',
        '10101',
        '10101',
        '10101',
        '01110',
        '00100',
        '00100',
    ],
    'Р': [
        '11110',
        '10001',
        '10001',
        '11110',
        '10000',
        '10000',
        '10000',
    ],
    'М': [
        '10001',
        '11011',
        '10101',
        '10101',
        '10001',
        '10001',
        '10001',
    ],
    'Л': [
        '01110',
        '01010',
        '01010',
        '01010',
        '01010',
        '01010',
        '10001',
    ],
    'Я': [
        '01111',
        '10001',
        '10001',
        '01111',
        '00101',
        '01001',
        '10001',
    ],
    'И': [
        '10001',
        '10011',
        '10101',
        '11001',
        '10001',
        '10001',
        '10001',
    ],
    'Н': [
        '10001',
        '10001',
        '10001',
        '11111',
        '10001',
        '10001',
        '10001',
    ],
};
const SPACE_WIDTH = 3;
const BIT_ON = '1';

function renderPixelName() {
    const name = $('.machine-name');
    if (!name) return;
    // Если выбран веб-шрифт — пропускаем пиксельный рендер (текст выводится напрямую).
    if (name.dataset.mode === 'font') return;

    const text = (name.dataset.pixelName || '').toUpperCase();
    const parts = [];
    let isWordStart = true; // Первая буква слова = большая.

    for (const char of text) {
        if (char === ' ') {
            parts.push(`<span class="machine-letter space" style="--letter-cols:${SPACE_WIDTH};--letter-rows:7"></span>`);
            isWordStart = true;
            continue;
        }

        const isBig = isWordStart;
        const dict = isBig ? PIXEL_LETTERS_BIG : PIXEL_LETTERS_SMALL;
        // Если заглавной версии нет — падаем на обычную (сохраняем isBig=true для масштаба).
        const matrix = dict[char] || PIXEL_LETTERS_SMALL[char] || PIXEL_LETTERS_SMALL['Н'];
        const cols = matrix[0].length;
        const rows = matrix.length;
        const pixels = matrix.flatMap((row, rowIdx) =>
            row.split('').map(bit =>
                `<span class="machine-pixel${bit === BIT_ON ? '' : ' off'}" style="--row:${rowIdx}"></span>`
            )
        ).join('');
        const cls = `machine-letter${isBig ? ' big' : ''}`;
        parts.push(`<span class="${cls}" style="--letter-cols:${cols};--letter-rows:${rows}">${pixels}</span>`);
        isWordStart = false;
    }

    name.innerHTML = parts.join('');
}

// ============================================================
// App-Dock: launcher «шпионской OS»
// ============================================================
// Базовые размеры окон при открытии (px). Рандомизируются в пределах ±jitter.
const WIN_BASE_SIZES = {
    'win-audio':    { w: 1000, h: 600, jitterW: 120, jitterH: 80 },
    'win-video':    { w: 900,  h: 560, jitterW: 120, jitterH: 80 },
'win-prices':   { w: 99999, h: 460, jitterW: 0,   jitterH: 60 },
    'win-about':    { w: 760,  h: 540, jitterW: 100, jitterH: 80 },
    'win-manifest': { w: 720,  h: 460, jitterW: 90,  jitterH: 70 },
    'win-reviews':  { w: 760,  h: 520, jitterW: 100, jitterH: 80 },
};
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Глобальный трекер курсора — окна появляются вокруг него.
const lastMouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => { lastMouse.x = e.clientX; lastMouse.y = e.clientY; }, { passive: true });
document.addEventListener('click',     (e) => { lastMouse.x = e.clientX; lastMouse.y = e.clientY; }, true);

// Счётчик focus-порядка — окно в фокусе получает высокий z-index (как в OS).
let zIndexCounter = 100;
function focusWindow(win) {
    if (!win) return;
    zIndexCounter += 1;
    win.style.zIndex = String(zIndexCounter);
    // Актуализируем stack-top / stack-dim по DOM-порядку z-index.
    const desktop = win.parentElement;
    if (!desktop) return;
    const actives = $$('.desktop > .window.is-active');
    actives.forEach(w => w.classList.remove('stack-top', 'stack-dim'));
    win.classList.add('stack-top');
    actives.filter(w => w !== win).forEach(w => w.classList.add('stack-dim'));
    // Если фокус ушёл не на окно Музыка — прячем обложку.
    if (win.id !== 'win-audio') {
        if (typeof closeCoverPop === 'function') closeCoverPop();
    }
}

function initAppDock() {
    const desktop = $('.desktop');
    const dock    = $('#app-dock');
    const back    = $('#dock-back');
    if (!desktop || !dock || !back) return;

    desktop.classList.add('dock-mode');

    const resetWindowGeometry = (win) => {
        win.style.position = '';
        win.style.left = '';
        win.style.top  = '';
        win.style.width  = '';
        win.style.height = '';
        win.style.zIndex = '';
        delete win.dataset.detached;
    };

    /** Размещает окно в районе курсора с рандомизацией размера и сдвига. */
    const placeNearMouse = (win) => {
        const cfg = WIN_BASE_SIZES[win.id] || { w: 720, h: 500, jitterW: 80, jitterH: 60 };
        const dRect = desktop.getBoundingClientRect();
        // Рандомный размер в пределах ±jitter (но не больше 90% вьюпорта).
        const w = clamp(cfg.w + rand(-cfg.jitterW, cfg.jitterW), 320, Math.min(dRect.width,  window.innerWidth  * 0.95));
        const h = clamp(cfg.h + rand(-cfg.jitterH, cfg.jitterH), 200, Math.min(window.innerHeight * 0.85, 900));
        // Целимся в курсор (окно ~центром на курсоре), но слегка смещаем влево-вверх +- рандом.
        const targetClientX = lastMouse.x || (window.innerWidth  / 2);
        const targetClientY = lastMouse.y || (window.innerHeight / 2);
        // Перевод в координаты внутри .desktop. Без клампа — окно может вылезать за границы.
        const left = targetClientX - dRect.left - w * (0.35 + Math.random() * 0.3) + rand(-40, 40);
        const top  = targetClientY - dRect.top  - h * (0.10 + Math.random() * 0.2) + rand(-30, 30);

        win.style.position = 'absolute';
        win.style.left   = left + 'px';
        win.style.top    = top  + 'px';
        win.style.width  = w + 'px';
        win.style.height = h + 'px';
        win.dataset.detached = '1';
    };

    /** Обновляет stack-top / stack-dim по текущему z-index. */
    const refreshStack = () => {
        const actives = $$('.desktop > .window.is-active');
        if (!actives.length) return;
        const top = actives.reduce((a, b) =>
            (parseInt(b.style.zIndex || '0', 10) > parseInt(a.style.zIndex || '0', 10)) ? b : a, actives[0]);
        actives.forEach(w => w.classList.remove('stack-top', 'stack-dim'));
        top.classList.add('stack-top');
        actives.filter(w => w !== top).forEach(w => w.classList.add('stack-dim'));
    };

    // Мобильный столбик: при открытии модуля он встаёт первым (CSS flex order с убывающими в порядке открытия).
    // .desktop при этом остаётся grid на десктопе, но grid-auto-flow по «1fr-столбику» на мобиле тоже уважает order.
    let _moduleOpenSeq = window.__moduleOpenSeq || 0;
    const bringWindowToTopOfColumn = (win) => {
        _moduleOpenSeq -= 1;
        window.__moduleOpenSeq = _moduleOpenSeq;
        win.style.order = String(_moduleOpenSeq);
    };

    const openModule = (winId) => {
        const win = document.getElementById(winId);
        if (!win) return;
        dock.classList.add('has-active');
        back.classList.add('visible');
        bringWindowToTopOfColumn(win);

        // Окно уже открыт — просто фокусируем (поднимаем поверх всех).
        if (win.classList.contains('is-active') && !win.classList.contains('is-closing')) {
            win.classList.remove('minimized');
            focusWindow(win);
            logEvent(`focus ${winId} ... ok`);
            return;
        }
        win.classList.remove('is-hidden', 'is-visible', 'is-closing', 'minimized');
        win.style.display = '';
        // Размещаем рядом с курсором с рандомным размером.
        placeNearMouse(win);
        // Перезапускаем анимацию открытия.
        win.classList.remove('is-active');
        // eslint-disable-next-line no-unused-expressions
        win.offsetWidth;
        win.classList.add('is-active');
        focusWindow(win);
        logEvent(`launch ${winId} ... mounted`);
        requestAnimationFrame(() => {
            // Прокручиваем к окну, если оно выходит за видимый экран.
            const r = win.getBoundingClientRect();
            if (r.bottom > window.innerHeight - 16 || r.top < 16) {
                win.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            syncDesktopHeight(desktop);
        });
    };

    const closeModule = (target) => {
        const win = target || $('.desktop > .window.stack-top') || $('.desktop > .window.is-active');
        if (!win) {
            dock.classList.remove('has-active');
            back.classList.remove('visible');
            return;
        }
        win.classList.remove('is-active', 'stack-top', 'stack-dim');
        win.classList.add('is-closing');
        // Если закрывается окно Музыка — спрячем обложку.
        if (win.id === 'win-audio' && typeof closeCoverPop === 'function') closeCoverPop();
        let finished = false;
        const onEnd = () => {
            if (finished) return;
            finished = true;
            win.classList.remove('is-closing');
            resetWindowGeometry(win);
            win.removeEventListener('animationend', onEnd);
            refreshStack();
            const remaining = $$('.desktop > .window.is-active').length;
            if (!remaining) {
                dock.classList.remove('has-active');
                back.classList.remove('visible');
                desktop.style.minHeight = '';
                dock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                syncDesktopHeight(desktop);
            }
        };
        win.addEventListener('animationend', onEnd);
        // Fallback: если анимация отключена (мобильный / reduced-motion) — закрываем сразу.
        const cs = getComputedStyle(win);
        if (!cs.animationName || cs.animationName === 'none' || parseFloat(cs.animationDuration) === 0) {
            onEnd();
        } else {
            // Страховочный таймер на случай, если animationend не прилетит (перебивается другими стилями).
            setTimeout(onEnd, 700);
        }
        logEvent(`shutdown ${win.id} ... ok`);
    };

    $$('.dock-btn').forEach(btn => {
        btn.addEventListener('click', () => openModule(btn.dataset.target));
    });
    back.addEventListener('click', () => closeModule());

    // Клик по любому окну — фокус (поднять наверх z-index).
    desktop.addEventListener('mousedown', (e) => {
        const win = e.target.closest('.window.is-active');
        if (!win) return;
        if (e.target.closest('.win-btn')) return;
        if (win.classList.contains('minimized') && e.target.closest('.window-titlebar')) {
            // Клик по свёрнутому — развернём (обработка в win-btn min, здесь лишь фокус).
        }
        focusWindow(win);
    }, true);

    // Кнопка «закрыть» в титулбаре и большая мобильная кнопка внизу (окна модулей на рабочем столе).
    $$('.desktop > .window').forEach(w => {
        const close = $('.win-btn[data-action="close"]', w);
        if (close) {
            close.addEventListener('click', () => {
                if (desktop.classList.contains('dock-mode')) closeModule(w);
            });
        }
        // Мобильная кнопка «CLOSE ×» в конце окна (видна только на узких экранах через CSS).
        if (!$('.win-close-mobile', w)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'win-close-mobile';
            btn.innerHTML = '× ЗАКРЫТЬ МОДУЛЬ';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (desktop.classList.contains('dock-mode')) closeModule(w);
            });
            w.appendChild(btn);
        }
    });

    // ESC — закрывает верхний модуль.
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (desktop.classList.contains('dock-mode') && $('.desktop > .window.is-active')) {
            closeModule();
        }
    });
}

// ============================================================
// Matrix-rain по краям страницы
// ============================================================
const RAIN_GLYPHS = '01АБВГДЕЖЗИКЛМНОABCDEFGHJKLMNPQRSTUVWXYZ#$@%&*+-/=<>{}[]';
const RAIN_COLORS = ['#00fff0', '#ff2bd6', '#ffb000', '#b8ff3a'];
const RAIN_FONT_SIZE = 14;
const RAIN_FPS = 14;

function initRain(canvasId) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ctx = c.getContext('2d');
    let cols = 0, drops = [], colors = [];

    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        c.width  = c.offsetWidth  * dpr;
        c.height = c.offsetHeight * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        cols = Math.max(1, Math.floor(c.offsetWidth / RAIN_FONT_SIZE));
        drops  = Array.from({ length: cols }, () => Math.random() * c.offsetHeight / RAIN_FONT_SIZE);
        colors = Array.from({ length: cols }, () => RAIN_COLORS[(Math.random() * RAIN_COLORS.length) | 0]);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const step = (ts) => {
        if (ts - last >= 1000 / RAIN_FPS) {
            last = ts;
            // Шлейф — полупрозрачный фон
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight);
            ctx.font = `${RAIN_FONT_SIZE}px Consolas, "Courier New", monospace`;
            for (let i = 0; i < cols; i++) {
                const ch = RAIN_GLYPHS[(Math.random() * RAIN_GLYPHS.length) | 0];
                const x = i * RAIN_FONT_SIZE;
                const y = drops[i] * RAIN_FONT_SIZE;
                ctx.fillStyle = colors[i];
                ctx.fillText(ch, x, y);
                if (y > c.offsetHeight && Math.random() > 0.97) {
                    drops[i] = 0;
                    colors[i] = RAIN_COLORS[(Math.random() * RAIN_COLORS.length) | 0];
                }
                drops[i] += 0.6 + Math.random() * 0.4;
            }
        }
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ============================================================
// Терминальный лог-бар
// ============================================================
const logQueue = [];
let logBusy = false;
const LOG_TYPE_DELAY = 22;
const LOG_HOLD_DELAY = 1400;

function logEvent(msg) {
    if (!msg) return;
    logQueue.push(String(msg));
    pumpLog();
}

function pumpLog() {
    if (logBusy) return;
    const el = $('#term-line');
    if (!el) return;
    const next = logQueue.shift();
    if (!next) return;
    logBusy = true;
    el.textContent = '';
    let i = 0;
    const type = () => {
        if (i <= next.length) {
            el.textContent = next.slice(0, i++);
            setTimeout(type, LOG_TYPE_DELAY);
        } else {
            setTimeout(() => { logBusy = false; pumpLog(); }, LOG_HOLD_DELAY);
        }
    };
    type();
}

function initTermLog() {
    logEvent('boot yellframe.os v1.0 ... ok');
    logEvent(`load tracks.dat (${(typeof TRACKS !== 'undefined' ? TRACKS.length : 0)} entries) ... ok`);
    logEvent('init player.engine ... ready');
    logEvent('mount ui.windows ... ok');
    logEvent('listening for input_');
}

// ============================================================
// Шейдер-шлейф у курсора (компактный, лёгкий)
// ============================================================
/// Шейдер шлейфа у курсора — матричный зелёный, живёт дольше, радиус больше.
/// Параметры легко тюнить в TRAIL_CFG ниже.
const TRAIL_CFG = {
    color:      '0, 240, 70',  // Матричный зелёный (rgb).
    maxPoints:  140,            // Длиннее хвост — больше точек.
    fade:       0.99,          // Чем ближе к 1, тем дольше живёт точка (0.93 — было раньше).
    radiusBase: 14,             // Минимальный радиус головы шлейфа.
    radiusGrow: 66,             // Насколько «раздувается» хвост по мере жизни.
    alpha:      0.60,           // Начальная яркость.
    coreAlpha:  0.99,           // Яркое ядро («холодный» свет в центре).
};
function initTrail() {
    const c = $('#trail-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    // На тач-устройствах радиус и длину хвоста уменьшим — иначе съедает батарею и перекрывает UI.
    const cfg = isCoarse
        ? { ...TRAIL_CFG, maxPoints: 70, radiusBase: 8, radiusGrow: 36, fade: 0.94, alpha: 0.4 }
        : TRAIL_CFG;

    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        c.width  = window.innerWidth  * dpr;
        c.height = window.innerHeight * dpr;
        c.style.width  = window.innerWidth  + 'px';
        c.style.height = window.innerHeight + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const trail = [];
    const push = (x, y) => {
        // Добавляем несколько промежуточных точек между предыдущей и текущей — хвост без разрывов даже при быстром движении.
        const last = trail[trail.length - 1];
        if (last) {
            const dx = x - last.x, dy = y - last.y;
            const dist = Math.hypot(dx, dy);
            const steps = Math.min(8, Math.floor(dist / 12));
            for (let s = 1; s < steps; s++) {
                trail.push({ x: last.x + dx * s / steps, y: last.y + dy * s / steps, life: 1 });
            }
        }
        trail.push({ x, y, life: 1 });
        while (trail.length > cfg.maxPoints) trail.shift();
    };

    window.addEventListener('mousemove', (e) => push(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
        const t = e.touches[0]; if (!t) return;
        push(t.clientX, t.clientY);
    }, { passive: true });

    const draw = () => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        // «Additive» смешивание — хвост светится, а не рисует плоские кружки.
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            p.life *= cfg.fade;
            if (p.life < 0.015) continue;
            const r = cfg.radiusBase + (1 - p.life) * cfg.radiusGrow;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            g.addColorStop(0,   `rgba(${cfg.color}, ${cfg.coreAlpha * p.life})`);
            g.addColorStop(0.4, `rgba(${cfg.color}, ${cfg.alpha    * p.life})`);
            g.addColorStop(1,   `rgba(${cfg.color}, 0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        while (trail.length && trail[0].life < 0.015) trail.shift();
        requestAnimationFrame(draw);
    };
    draw();
}

// ============================================================
// Плеер — горячие клавиши
// ============================================================
function initPlayerHotkeys() {
    const SEEK_STEP = 5;        // ←/→ — ±5 секунд
    const VOLUME_STEP = 0.05;   // ↑/↓ — ±5% громкости
    document.addEventListener('keydown', (e) => {
        // Не перехватываем ввод в поля
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const a = player.audio;
        const vol = $('#pl-vol');

        switch (e.key) {
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                player.toggle();
                break;
            case 'ArrowLeft':
                if (player.currentIndex < 0) return;
                e.preventDefault();
                if (e.shiftKey) { player.step(-1); }
                else if (a.duration) { a.currentTime = Math.max(0, a.currentTime - SEEK_STEP); }
                break;
            case 'ArrowRight':
                if (player.currentIndex < 0) return;
                e.preventDefault();
                if (e.shiftKey) { player.step(1); }
                else if (a.duration) { a.currentTime = Math.min(a.duration, a.currentTime + SEEK_STEP); }
                break;
            case 'ArrowUp':
                e.preventDefault();
                a.volume = Math.min(1, a.volume + VOLUME_STEP);
                if (vol) vol.value = a.volume;
                logEvent(`volume = ${(a.volume * 100) | 0}%`);
                break;
            case 'ArrowDown':
                e.preventDefault();
                a.volume = Math.max(0, a.volume - VOLUME_STEP);
                if (vol) vol.value = a.volume;
                logEvent(`volume = ${(a.volume * 100) | 0}%`);
                break;
            default: break;
        }
    });
}

// ============================================================
// Boot-screen: кнопка GO + 3-фазная анимация «развёртки» интерфейса.
// Тайминги совпадают с CSS-анимациями (.phase-1/2/3 в main.css).
// ============================================================
// Тайминги синхронизированы с CSS и со звуком boot.mp3 (~2.5–3.0с):
//   Phase 1 (0–2с):     сжатие кнопки в точку + выход линий (delay 0.7s + dur 1s = 1.7s)
//   Phase 2 (2–2.5с):  рамка раскрывает сайт (фон гаснет, линии «твердеют»)
//   Phase 3 (2.5–2.9с): финальные разъезжающиеся балки — доигрывает хвост boot.mp3
const BOOT_PHASE_1_MS = 2000;
const BOOT_PHASE_2_MS = 500;
const BOOT_PHASE_3_MS = 400;

function initBootScreen() {
    const screen = $('#boot-screen');
    const btn    = $('#boot-go');
    if (!screen || !btn) return;

    // prefers-reduced-motion — выкидываем overlay сразу.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        screen.classList.add('done');
        document.body.classList.remove('is-booting');
        document.body.classList.add('boot-reveal');
        return;
    }

    let triggered = false;
    const startSequence = () => {
        if (triggered) return;
        triggered = true;

        // РАЗБЛОКИРОВКА АУДИО: этот вызов находится внутри обработчика click по GO,
        // что является 100% валидным user-gesture для Chrome/Safari/Firefox.
        if (typeof ambience !== 'undefined' && ambience.unlock) ambience.unlock();

        // Фаза 1: сжатие кнопки + расхождение линий.
        screen.classList.add('phase-1');
        if (typeof logEvent === 'function') logEvent('boot.sequence ... init');

        setTimeout(() => {
            // Фаза 2: линии «твердеют» в рамку.
            screen.classList.add('phase-2');
        }, BOOT_PHASE_1_MS);

        setTimeout(() => {
            // Фаза 3: балки разъезжаются, сайт проявляется.
            screen.classList.add('phase-3');
            document.body.classList.add('boot-reveal');
            document.body.classList.remove('is-booting');
        }, BOOT_PHASE_1_MS + BOOT_PHASE_2_MS);

        setTimeout(() => {
            screen.classList.add('done');
        }, BOOT_PHASE_1_MS + BOOT_PHASE_2_MS + BOOT_PHASE_3_MS);
    };

    btn.addEventListener('click', startSequence);
    // Enter / Space — тоже запускает (кнопка autofocus).
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startSequence(); }
    });
}

// ============================================================
// Bootstrap
// ============================================================
function bootstrap() {
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
    initBootScreen();   // overlay с кнопкой GO + spy-OS развёртка
    ambience.init();    // intro стартует по первому user-gesture (это будет клик по GO).

    // Окна делаем перетаскиваемыми
    $$('.desktop > .window').forEach(makeDraggable);

    buildTracksHeader();
    bindGenreFilters();
    renderVideos();
    renderPrices();
    renderManifest();
    renderReviews();
    renderAbout();

    player.init();
    renderTracksTable();
    preloadDurations();

    renderPixelName();
    initAppDock();
    initRain('rain-left');
    initRain('rain-right');
    initTermLog();

    // Видео-модалка
    $('#video-modal .close-btn').addEventListener('click', closeVideoModal);
    $('#video-modal').addEventListener('click', (e) => {
        if (e.target.id === 'video-modal') closeVideoModal();
    });
    // Закрытие project-popup кнопкой ×
    const projClose = $('.project-modal-close');
    if (projClose) projClose.addEventListener('click', (e) => { e.stopPropagation(); closeProjectPop(); });
    document.addEventListener('keydown', (e) => {
        // Esc: сначала закрываем видеомодалку (верхний слой). Если её не было — закрываем окно проекта.
        if (e.key === 'Escape') {
            const m = $('#video-modal');
            if (m && m.classList.contains('active')) closeVideoModal();
            else closeProjectPop();
        }
    });

    initTrail();
    initPlayerHotkeys();

    // Cover-popup: кнопка ×, мини-обложка в плеере, репозиции при изменениях.
    const coverClose = $('#cover-pop-close');
    if (coverClose) coverClose.addEventListener('click', (e) => { e.stopPropagation(); closeCoverPop(); });
    const plCoverBtn = $('#pl-cover');
    if (plCoverBtn) plCoverBtn.addEventListener('click', () => {
        const t = TRACKS[player.currentIndex];
        if (!t) return;
        // Если обложка уже открыта — закроем, иначе откроем.
        const pop = $('#cover-pop');
        if (pop && !pop.hidden) closeCoverPop();
        else openCoverFor(t);
    });
    window.addEventListener('resize', positionCoverPop);
    window.addEventListener('resize', updateDescOverflow);
    window.addEventListener('scroll', positionCoverPop, true);
    const winAudioEl = $('#win-audio');
    if (winAudioEl && 'MutationObserver' in window) {
        new MutationObserver(positionCoverPop).observe(winAudioEl, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    // Клик по обложке фокусирует Музыку, чтобы focus не уходил на другое окно и обложка не закрывалась.
    const coverPop = $('#cover-pop');
    if (coverPop) coverPop.addEventListener('mousedown', () => {
        const audio = $('#win-audio');
        if (audio && audio.classList.contains('is-active')) focusWindow(audio);
    });
    // На мобильном — тап по обложке закрывает её (кроме кнопки ×, которая и так закрывает).
    if (coverPop) coverPop.addEventListener('click', (e) => {
        if (e.target.closest('.win-btn')) return;
        if (window.matchMedia('(max-width: 700px)').matches) closeCoverPop();
    });

    // Логирование интеракций в терминал
    document.addEventListener('click', (e) => {
        const winBtn = e.target.closest('.win-btn');
        if (winBtn) {
            const win = winBtn.closest('.window');
            const action = winBtn.dataset.action;
            logEvent(`window.${action} ${win?.id || '?'} ... ok`);
        }
        const genre = e.target.closest('.genre-filters button');
        if (genre) logEvent(`filter.genre = ${genre.dataset.genre} ... applied`);
        const tile = e.target.closest('.video-tile');
        if (tile) logEvent(`video.open ... loading_`);
    });
}

document.addEventListener('DOMContentLoaded', bootstrap);
})();
