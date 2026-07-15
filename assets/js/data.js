/**
 * Данные сайта: треки, видео, прайс-лист, текст "о себе".
 * Всё хранится в одном месте, чтобы не дублировать разметку.
 */

/// ============================================================
/// АУДИО-АТМОСФЕРА САЙТА
/// ============================================================
///
/// При заходе на сайт:
///   1) проигрывается одноразовой intro-эффект (boot-sound);
///   2) после его окончания включается зацикленная фоновая петля (ambient-loop);
///   3) любой запущенный трек / видео выключает фоновую петлю.
///
/// КУДА КЛАСТЬ ФАЙЛЫ:
///   — assets/audio/sfx/boot.mp3       — интро-эффект (любой короткий стингер до ~1.5 с)
///   — assets/audio/sfx/ambient.mp3    — зацикленный луп до 3 секунд
///                                       (важно: файл должен быть заранее чисто зациклен в DAW:
///                                       первый сэмпл == фаза последнего + 1, иначе будет щелчок)
///
/// ЧТОБЫ ОТКЛЮЧИТЬ АМБИЕНТ — поставь enabled: false.
/// ЧТОБЫ ОТКЛЮЧИТЬ ИНТРО   — поставь intro.enabled: false.
const AUDIO_AMBIENCE = {
    intro: {
        enabled: true,
        src:     'assets/audio/sfx/boot.mp3',
        volume:  0.6,
    },
    loop: {
        enabled: true,
        src:     'assets/audio/sfx/ambient.mp3',
        volume:  0.25,
        /// Задержка перед включением лупа после intro (мс).
        /// Если intro.enabled = false — луп стартует сразу.
        delayAfterIntroMs: 100,
    },
};

/// ДОБАВЛЯТЬ НОВЫЕ АУДИО ЗДЕСЬ:
/// Формат: title — название трека без артиста; artist — артист; description — что сделано; year — год выпуска (число, опционально); genre — pop/rock/rap/hard; src — путь к mp3.
/// Если появятся обложки к аудио, добавляй поле cover: 'assets/img/covers/name.jpg'.
/// Ячейки без года отображаются как «—» и при сортировке уезжают в конец списка.
///
/// ПОМЕТКА «NEW» (новинка): добавь в объект трека поле  isNew: true  — рядом с названием
/// появится жёлтый праздничный бейдж «NEW» в стиле spy-OS (с пульсацией).
/// Чтобы убрать бейдж — удали поле или поставь  isNew: false.
///
/// ИНТЕРНАЦИОНАЛИЗАЦИЯ (ЭТАП 3):
///   Текстовые поля можно задать в двух видах:
///     1) Простая строка (legacy) — одинаково в обоих языках:  title: '.WAV'
///     2) Объект { ru, en } — разный текст:  title: { ru: 'Чёрт', en: 'Devil' }
///   Для языка, которого нет в объекте, используется RU как fallback.
///   Названия артистов, использующих латиницу, можно оставлять строкой.
const TRACKS = [
  { title: { ru: 'Выставка',                en: 'Exhibition' },
    artist: { ru: 'Гроза Бардак',           en: 'Groza Bardak' },
    description: { ru: 'Подготовка к записи, запись. Сведение, гибридно-аналоговый мастеринг.',
                   en: 'Pre-production, recording. Mixing and hybrid analog mastering.' },
    genre: 'rock', duration: 0, year: 2026, src: 'assets/audio/EXIB MASTER5.1.mp3', cover: 'assets/img/covers/groza.jpg', isNew: true },

  { title: { ru: 'Русалка',                  en: 'Rusalka' },
    artist: 'Bjørndalen',
    description: { ru: 'Дозапись гитар, пост-продакшн, сведение и мастеринг.',
                   en: 'Additional guitar tracking, post-production, mixing and mastering.' },
    genre: 'rock', duration: 0, year: 2025, src: 'assets/audio/RUSALKA master 3.mp3' },

  { title: 'Drama (YFRO remix)',
    artist: 'Malina Scar',
    description: { ru: 'Ремикс, играл на вечеринках Blesk Party.',
                   en: 'Remix, played at Blesk Party events.' },
    genre: 'pop/hard', duration: 0, year: 2022, src: 'assets/audio/malina drama re,ix.mp3', cover: 'assets/img/covers/drama.jpg' },

  { title: { ru: 'Чёрт',                     en: 'Chyort' },
    artist: 'Ada Metanoia',
    description: { ru: 'Продакшн, запись, сведение и мастеринг.',
                   en: 'Production, recording, mixing and mastering.' },
    genre: 'rock', duration: 0, year: 2024, src: 'assets/audio/chert sozidania svod-master2.mp3', cover: 'assets/img/covers/ada.jpg' },

  { title: { ru: 'Суперпоколение',            en: 'Supergeneration' },
    artist: 'NAGNIBEDA',
    description: { ru: 'Продакшн, сведение и мастеринг. Синтвэйв.',
                   en: 'Production, mixing and mastering. Synthwave.' },
    genre: 'pop', duration: 0, year: 2025, src: 'assets/audio/80S MASTER 5.mp3' },

  { title: 'SUNRISE — MINUS',
    artist: 'KNIFERS',
    description: { ru: 'Инструментал. Поп, экспериментальная музыка.',
                   en: 'Instrumental. Pop, experimental music.' },
    genre: 'pop', duration: 0, year: 2025, src: 'assets/audio/karinaaaa vst2 minus.mp3' },

  { title: 'SUNRISE — VOX',
    artist: 'KNIFERS',
    description: { ru: 'Полная версия с вокалом.',
                   en: 'Full version with vocals.' },
    genre: 'pop', duration: 0, year: 2025, src: 'assets/audio/karinaaaa vst2 wvox.mp3' },

  { title: { ru: 'Атом',                       en: 'Atom' },
    artist: 'NAGNIBEDA',
    description: { ru: 'Клубный трек. Продакшн, сведение, мастеринг.',
                   en: 'Club track. Production, mixing, mastering.' },
    genre: 'pop', duration: 0, year: 2025, src: 'assets/audio/ngbd atoms master3.mp3', cover: 'assets/img/covers/atom.jpg' },

  { title: 'pomnish',
    artist: 'Eraunica',
    description: { ru: 'Пост-продакшн, сведение и мастеринг.',
                   en: 'Post-production, mixing and mastering.' },
    genre: 'pop', duration: 0, year: 2024, src: 'assets/audio/p3.3 master.mp3' },

  { title: { ru: 'Корридор Затмений',           en: 'Eclipse Corridor' },
    artist: 'UNTITLED',
    description: { ru: 'Альтернативный хип-хоп. Запись, сведение, мастеринг.',
                   en: 'Alternative hip-hop. Recording, mixing, mastering.' },
    genre: 'rap', duration: 0, year: 2024, src: 'assets/audio/korridor zatm 2 beta degrade 2.mp3' },

  { title: 'Track 1', artist: 'SAVA*',
    description: { ru: 'Хайперпоп. Сведение и мастеринг.', en: 'Hyperpop. Mixing and mastering.' },
    genre: 'hard', duration: 0, year: 2022, src: 'assets/audio/sava hofa.mp3', cover: 'assets/img/covers/sava.jpg' },

  { title: 'Track 2', artist: 'SAVA*',
    description: { ru: 'Хайперпоп. Сведение и мастеринг.', en: 'Hyperpop. Mixing and mastering.' },
    genre: 'hard', duration: 0, year: 2022, src: 'assets/audio/sava 120 1.3.mp3', cover: 'assets/img/covers/sava.jpg' },

  { title: 'Track 3', artist: 'SAVA*',
    description: { ru: 'Хайперпоп. Сведение и мастеринг.', en: 'Hyperpop. Mixing and mastering.' },
    genre: 'hard', duration: 0, year: 2022, src: 'assets/audio/sava 130 master2.mp3', cover: 'assets/img/covers/sava.jpg' },

  { title: 'GRUN', artist: 'NAGNIBEDA',
    description: { ru: 'Поп / габбер. Продакшн.', en: 'Pop / gabber. Production.' },
    genre: 'pop/hard', duration: 0, year: 2025, src: 'assets/audio/BBSHKN_7.mp3' },

  { title: 'FACE', artist: 'JESSIE',
    description: { ru: 'Панк-рок / инди. Продакшн, запись, сведение.', en: 'Punk-rock / indie. Production, recording, mixing.' },
    genre: 'rock', duration: 0, year: 2020, src: 'assets/audio/JESSIE FACE PROJECT MIXING SUPER FINAL 1488 777 AZINo три TOPORA .mp3', cover: 'assets/img/covers/face.JPG' },

  { title: 'Terrorist Win', artist: 'BAZOOQA',
    description: { ru: 'Трэп / трэп-метал. Сведение и мастеринг.', en: 'Trap / trap-metal. Mixing and mastering.' },
    genre: 'rap/rock', duration: 0, year: 2021, src: 'assets/audio/TERRACT BASOOQA.mp3', cover: 'assets/img/covers/bazooqa.png' },

  { title: 'Stars', artist: 'NAGNIBEDA',
    description: { ru: 'Евроденс / поп. Продакшн, сведение, мастеринг.', en: 'Eurodance / pop. Production, mixing, mastering.' },
    genre: 'pop', duration: 0, year: 2025, src: 'assets/audio/peremaster STARS.mp3' },

  { title: '.WAV', artist: 'YFRO',
    description: { ru: 'Тёмное медленное техно. Продакшн.', en: 'Dark slow techno. Production.' },
    genre: 'hard', duration: 0, year: 2025, src: 'assets/audio/gessa1.mp3', cover: 'assets/img/covers/COVER1_1.2.6.png' },
  // ПРИМЕР новинки (раскомментируй и заполни под свой релиз):
  // { title: { ru: 'Свежак', en: 'Fresh' }, artist: 'YFRO', description: { ru: 'Свежий релиз.', en: 'Fresh release.' }, genre: 'hard', duration: 0, year: 2025, src: 'assets/audio/new.mp3', isNew: true },
];

/// БЛОК ВИДЕО
/// Два вида элементов в одном массиве VIDEOS:
///
/// ПРЕВЬЮ (обложка):
///   — Для YouTube (src вида youtube.com/embed/ID или youtu.be/ID) — обложка подхватывается АВТОМАТИЧЕСКИ из img.youtube.com.
///   — Для Google Drive / Vimeo / других — укажи явно поле  preview: 'assets/img/video-covers/xxx.jpg'  (или любой другой URL).
///
///   1) ОДИНОЧНОЕ ВИДЕО — type: 'video'.
///      { type: 'video', title: 'Название', description: 'Описание', src: 'https://...embed', preview: 'assets/img/video-covers/x.jpg' }
///
///   2) ПРОЕКТ (папка видео) — type: 'project'.
///      { type: 'project', title: 'Название', description: 'Короткое описание',
///        cover: 'assets/img/...jpg',     // необязательно: обложка проекта
///        items: [                        // видео внутри проекта
///          { title: 'Стенд 1', description: '...', src: 'https://...embed' },
///          ...
///        ]
///      }
///
/// Ссылки src — embed/preview (Google Drive /preview, YouTube /embed/...).
/// description показывается как краткое под плиткой и как полное под плеером в модалке.
const VIDEOS = [
  {
    type: 'video',
    title: { ru: 'Святая деменция',                    en: 'Holy Dementia' },
    description: { ru: 'Документальный фильм. Главный приз конкурса «Страна DOC». Музыка, звук на площадке, саунд-дизайн, пост-продакшн. Релиз — начало 2027.',
                   en: 'Documentary film. Grand prize of the “Strana DOC” competition. Music, on-set sound, sound design, post-production. Release — early 2027.' },
    src: 'https://drive.google.com/file/d/1Y7wJaufB59effi1XzFh9UNeAyVkh1IPs/preview'
  },

  /// ПРИМЕР ПРОЕКТА: КРЕТ — все видео под одним ярлыком.
  {
    type: 'project',
    title: { ru: 'КРЕТ',                                en: 'KRET' },
    description: { ru: 'Крупный саунд-дизайнерский проект для оффлайн-форума концерна КРЕТ (Ростех). 100+ звуковых оформлений стендов.',
                   en: 'Large-scale sound design project for the offline forum of KRET (Rostec subsidiary). 100+ sound treatments for exhibition stands.' },
    /// ДЛЯ ОБЛОЖКИ ПРОЕКТА — раскомментируй и укажи путь:
    // cover: 'assets/img/projects/kret.jpg',
    items: [
      {
        title: { ru: 'Главное видео проекта',          en: 'Project main video' },
        description: { ru: 'Было показано на аудиторию свыше 600 человек в зале с мощностью звука выше 15кВт. Ниже вы можете посмотреть любительскую съемку этого и других моментов с этого форума.',
                       en: 'Shown to an audience of 600+ people in a hall with sound system above 15 kW. Below you can see amateur footage of this and other moments from the forum.' },
        src: 'https://drive.google.com/file/d/1C3Wn6jXE8p7wWb6i0MlpSF6Ec4JlgPgq/preview'
      },
      {
        title: { ru: 'Лого-стенд',                      en: 'Logo stand' },
        description: { ru: 'Часть проекта КРЕТ.', en: 'Part of the KRET project.' },
        src: 'https://drive.google.com/file/d/1qd3n-1AJAQv03qNlHosnMpuyBLIA8D-r/preview'
      },
      {
        title: { ru: 'Стенд «Цифровые Дюны»',          en: '“Digital Dunes” stand' },
        description: { ru: 'Часть проекта КРЕТ.', en: 'Part of the KRET project.' },
        src: 'https://drive.google.com/file/d/1rng_IaxFeDBTtYv1pW92uMqp_6HHsUhh/preview'
      },
      {
        title: { ru: 'Стенд «Волны в цифре»',          en: '“Waves in Digital” stand' },
        description: { ru: 'Часть проекта КРЕТ.', en: 'Part of the KRET project.' },
        src: 'https://drive.google.com/file/d/1MdM7kmbyRG4tONPIfB4n8eS5wVL1HXwm/preview'
      },
      {
        title: { ru: 'Стенд «Цифровой город»',          en: '“Digital City” stand' },
        description: { ru: 'Часть проекта КРЕТ.', en: 'Part of the KRET project.' },
        src: 'https://drive.google.com/file/d/1zQPvnjBKkM_2tKC0PPAYDYE1MTnBQO9j/preview'
      }
      /// Добавляй сюда новые видео проекта КРЕТ (объекты с title/description/src).
    ]
  },

  {
    type: 'video',
    title: { ru: 'Звуковое оформление оффлайн-стенда ФНС',
            en: 'Sound design for the Russian Federal Tax Service offline stand' },
    description: { ru: 'Саунд-дизайн, написание музыки и обработка голоса нейронного диктора.',
                   en: 'Sound design, music composition and processing of an AI voice-over.' },
    src: 'https://drive.google.com/file/d/1ePgL5T8jxoFLj395fHkobb7zQFVVRBBM/view?usp=sharing'
  },
  {
    type: 'video',
    title: 'NAGNIBEDA — On the Beach',
    description: { ru: 'Оператор, монтажёр, саунд-продюсер, инженер сведения и мастеринга. Под ключ.',
                   en: 'DOP, editor, sound producer, mixing and mastering engineer. Turn-key delivery.' },
    src: 'https://www.youtube.com/embed/Rs-6wfCMsQ0'
  },
  {
    type: 'video',
    title: { ru: 'Катя Джесси — Ай',                      en: 'Katya Jessie — Ai' },
    description: { ru: 'Монтаж, цветокор, гитара.', en: 'Editing, colour grading, guitar.' },
    src: 'https://www.youtube.com/embed/4u3Mgcn9Hio'
  }
  /// ДОБАВЛЯЙ СЮДА НОВЫЕ ВИДЕО ИЛИ ПРОЕКТЫ.
];

/// ОБНОВЛЯТЬ ПРАЙС ЗДЕСЬ:
/// Пример: { service: 'Сведение трека', unit: 'трек', price: 'от 15000 ₽', note: 'Описание услуги' }
const PRICES = [
  // ПОЛЯ:
  //   image   — путь к SVG-картинке из папки assets/img/prices/
  //   service — название услуги ({ ru, en })
  //   desc    — краткое описание услуги ({ ru, en })
  //   price   — цена строкой ({ ru, en } — валюта в EN остаётся в ₽, но подпись в стиле "from / up to").

  { image: 'assets/img/prices/DEMO.svg',
    service: { ru: 'Демо', en: 'Demo' },
    desc:    { ru: 'Короткий демо-трек (до 1 мин) для оценки стиля и подхода.',
               en: 'Short demo track (up to 1 min) to evaluate the style and approach.' },
    price:   { ru: 'от 5 000 ₽', en: 'from 5,000 ₽' } },

  { image: 'assets/img/prices/FULL.svg',
    service: { ru: 'Полный продакшн песни', en: 'Full song production' },
    desc:    { ru: 'Включает обсуждение идей, темы и саунд-дизайна трека, начальную работу с текстом, голосовые демо вокалов и всё необходимое для предпродакшна. Запись вокала, если она возможна территориально. Аранжировка, включая синтетические и живые инструменты, сведение и мастеринг при желании артиста.',
               en: 'Includes idea, theme and sound-design discussions, initial lyric work, vocal demos and everything required for pre-production. Vocal recording where geographically possible. Arrangement with synthetic and live instruments, mixing and mastering on request.' },
    price:   { ru: 'от 15 000 до 100 000 ₽', en: 'from 15,000 to 100,000 ₽' } },

  { image: 'assets/img/prices/LISTEN.svg',
    service: { ru: 'Консультация', en: 'Consultation' },
    desc:    { ru: 'Возможны многие сценарии. Консультация по арранжировке, сведению, идейному наполнению, саунд-дизайну. Обратная связь по всем вопросам, связанным с продакшном музыки. Технические вопросы в том числе.',
               en: 'Many scenarios possible. Consultation on arrangement, mixing, conceptual content, sound design. Feedback on any production-related question, technical questions included.' },
    price:   { ru: '3 000 ₽', en: '3,000 ₽' } },

  { image: 'assets/img/prices/MASTER.svg',
    service: { ru: 'Мастеринг', en: 'Mastering' },
    desc:    { ru: 'Мастеринг трека по референсу.', en: 'Track mastering using a reference.' },
    price:   { ru: 'от 3 000 до 5 000 ₽', en: 'from 3,000 to 5,000 ₽' } },

  { image: 'assets/img/prices/PROD.svg',
    service: { ru: 'Со-продакшн, пост-продакшн, дозапись', en: 'Co-production, post-production, overdubs' },
    desc:    { ru: 'Часто бывает так, что в треке не хватает элемента. Сильной мелодии, подходящей структуры, гитарной подложки и прочего. Эта опция здесь, так как такое встречается часто.',
               en: 'Often something is missing in a track: a strong melody, a fitting structure, a guitar bed. This option exists because it happens often.' },
    price:   { ru: 'от 3 000 до 20 000 ₽', en: 'from 3,000 to 20,000 ₽' } },

  { image: 'assets/img/prices/TEMPANI.svg',
    service: { ru: 'Сведение', en: 'Mixing' },
    desc:    { ru: 'Сведение музыкального материала с вокалом. Использование референсов и обсуждение звучания с заказчиком обязательны.',
               en: 'Mixing of music with vocals. Reference tracks and a sound discussion with the client are required.' },
    price:   { ru: 'от 8 000 до 25 000 ₽', en: 'from 8,000 to 25,000 ₽' } },

  { image: 'assets/img/prices/VOCAL PROD.svg',
    service: { ru: 'Вокальный продакшн', en: 'Vocal production' },
    desc:    { ru: 'В музыке с вокалом вопреки разным мнениям действительно важнее всего, собственно, вокал. У него множество характеристик и особенностей, которые можно покрутить и продумать. Интонация, характер, тембр, эмоция — этот список далеко не полный. Мы раскроем весь потенциал конкретной песни или альбома, который зависит от голоса артиста.',
               en: 'In music with vocals, despite various opinions, the vocal itself is what matters most. It has many traits to be shaped: intonation, character, timbre, emotion, and many more. We unlock the full potential of a song or an album that depends on the artist’s voice.' },
    price:   { ru: 'от 3 000 до 35 000 ₽', en: 'from 3,000 to 35,000 ₽' } },
];

/// ОБНОВЛЯТЬ МАНИФЕСТ ЗДЕСЬ:
/// Объект { ru, en } — HTML на обоих языках. При рендере выбирается текущий язык.
const MANIFEST_HTML = {
  ru: `
  <p><strong>Я не делаю звук «как у всех».</strong> Я собираю аудио-сцену так, чтобы в ней было узнаваемое лицо: ритм, воздух, грязь, красота и нерв.</p>
  <p>Музыка, саунд-дизайн и пост-продакшн должны работать как система: усиливать образ, держать внимание и оставаться в памяти после первого контакта.</p>
  <p>Мой подход — не полировать до стерильности, а найти характер. Звук должен быть уверенным, уникальным и потрясающим.</p>
  `,
  en: `
  <p><strong>I don’t make sound “like everyone else does”.</strong> I build an audio scene so it has a recognisable face: rhythm, air, grit, beauty and nerve.</p>
  <p>Music, sound design and post-production should work as a system: amplify the image, hold attention and stay with the listener after the first contact.</p>
  <p>My approach is not to polish things into sterility, but to find character. Sound has to be confident, unique and stunning.</p>
  `,
};

/// ДОБАВЛЯТЬ ОТЗЫВЫ И КАРТИНКИ К НИМ ЗДЕСЬ:
///
/// ШАБЛОН:
///   {
///     name:  'Имя клиента',          // Обязательно: кто оставил отзыв.
///     role:  'Проект / роль',          // Обязательно: контекст (название релиза, видео, роль в команде).
///     text:  'Сам текст отзыва.',     // Обязательно.
///     image: 'assets/img/reviews/avatar.jpg', // Необязательно: портрет/лого/скрин.
///   }
///
/// КАРТИНКИ:
/// — Клади в папку assets/img/reviews/. Они автоматически приводятся к квадратному кадру (object-fit: cover) в CSS.
/// — Рекомендуемый размер исходника: квадрат 600×600 .jpg/.webp, качество ~85.
/// — Если картинки нет — просто не указывай поле image (будет показан лого-placeholder).
///
/// КАРУСЕЛЬ:
/// — Отзывы перелистываются автоматически каждые 5 секунд (слева направо), а также кнопками ‹ / › и по точкам-индикаторам.
/// — При наведении на отзыв автопрокрутка временно приостановлена.
const REVIEWS = [
  {
    name: { ru: '«KRET» — проект Ростеха', en: '“KRET” — Rostec project' },
    role: { ru: 'Саунд-дизайнер, тех. консультант по звуку', en: 'Sound designer, technical sound consultant' },
    text: { ru: 'Масштабный проект дочерней компании Ростеха. Длительность чистого материала с саунд-дизайном — около часа. На форуме находилось около 600 человек, главное видео было показано в банкетном зале. Материалы во вкладке «Видео».',
            en: 'Large-scale project for a Rostec subsidiary. About an hour of clean material with sound design. The forum hosted around 600 people, the main video was shown in the banquet hall. Materials are in the “Videos” tab.' },
    image: 'assets/img/otziv/kret.png'
  },
  {
    name: { ru: 'Федеральная налоговая служба', en: 'Russian Federal Tax Service' },
    role: { ru: 'Саунд-дизайнер', en: 'Sound designer' },
    text: '',
    image: 'assets/img/otziv/fns.png'
  },
  {
    name: { ru: 'Проект «АКВАПОРТ»', en: '“AQUAPORT” project' },
    role: { ru: '3D-отрисовка с подробным саунд-дизайном для офлайн-мероприятия',
            en: '3D rendering with detailed sound design for an offline event' },
    text: { ru: 'Проект, вдохновлённый визуалом и звуком мультфильма «Тайна третьей планеты». Мне были выданы все права на оригинальный саундтрек, с помощью которого получилось воссоздать атмосферу советского футуризма.',
            en: 'A project inspired by the visuals and sound of the Soviet animated film “Mystery of the Third Planet”. I was granted the full rights to the original soundtrack, which helped me recreate the Soviet-futurism atmosphere.' },
    image: 'assets/img/otziv/kosmoport.png'
  },
  {
    name: 'NAGNIBEDA',
    role: { ru: 'Nagnibeda — Суперпоколение', en: 'Nagnibeda — Supergeneration' },
    text: '',
    image: 'assets/img/otziv/supergeneration.png'
  },
  {
    name: 'KNIFERS — Sunset',
    role: { ru: 'Саунд-продюсер, арранжировщик, хук-продюсер', en: 'Sound producer, arranger, hook producer' },
    text: '',
    image: 'assets/img/otziv/sunset.png'
  },
  {
    name: { ru: 'Nagnibeda — Атом', en: 'Nagnibeda — Atom' },
    role: { ru: 'Саунд-продюсер, арранжировщик, инженер записи, инженер сведения и мастеринга',
            en: 'Sound producer, arranger, recording engineer, mixing & mastering engineer' },
    text: '',
    image: 'assets/img/otziv/atom.png'
  },
  // ПРИМЕР (раскомментируй и заполни):
  // {
  //   name:  'Anastasia Doe',
  //   role:  'NAGNIBEDA — альбом «80s Master»',
  //   text:  'Работа была точно в срок, звук как мы хотели. Свел и отпустил мастер без борьбы.',
  //   image: 'assets/img/reviews/anastasia.jpg'
  // },
];

/// ОБНОВЛЯТЬ ПУНКТ "О СЕБЕ" ЗДЕСЬ.
///
/// Блок «О себе» работает в двух режимах в стиле spy-OS:
///   - ABOUT_BRIEF — «ВЫЖИМКА» (короткое резюме на 1 экран).
///   - ABOUT_FULL  — «ДОСЬЕ» (развёрнутая хроника).
/// Переключаются вкладками «VKLAD» в самом окне.
///
/// ДЛЯ МЕДИА:
///   ABOUT_PORTRAIT  — квадратное фото для выжимки (рекоменд. 600×600 .jpg/.webp).
///   ABOUT_TIMELINE  — блоки «досье». Каждый элемент может иметь фото (image)
///                    или видео (video). Тип определяется автоматически.
///
/// Схемы элементов ABOUT_TIMELINE:
///   { year: '2013',                            // Обязательно: ярлык-метка.
///     title: 'Название этапа',          // Обязательно: заголовок.
///     text:  'HTML описание.',           // Обязательно: основной текст (можно использовать <strong>, <em>).
///     image: 'assets/img/about/2013.jpg',     // Опционально: фото (желательно одна ориентация).
///     caption: 'Подпись под медиа.',  // Опционально.
///   }
///   Или вместо image: video: 'assets/video/2013.mp4'   // mp4 — играется встроенным <video controls>.
///   Или video: 'https://www.youtube.com/embed/...' / 'https://drive.google.com/file/d/.../preview' — iframe.
///
/// РАЗМЕРЫ МЕДИА:
/// Картинки приводятся к рамке 16:9 через object-fit: cover, видео — исходные пропорции в ячейке.
/// Рекомендуемые размеры: фото — 1280×720 .jpg/.webp; личное видео — .mp4 H.264 720p (до ~10 МБ).

const ABOUT_PORTRAIT = {
  /// ПОЛОЖИ своё фото в assets/img/about/portrait.jpg и укажи путь ниже.
  src: 'assets/img/666_1.7.1.png',
  alt:     { ru: 'Кенни Ли', en: 'Kenny Lee' },
  caption: 'YFRO · SOUND//STUDIO-RECORDING//VISION'
};

/// КАРУСЕЛЬ ФОТО ВО ВКЛАДКЕ «О СЕБЕ» (режим «ВЫЖИМКА»).
///
/// ФАЙЛЫ клади в  assets/img/carousel/.
/// ФОРМАТ ЭЛЕМЕНТА:
///   { src: 'assets/img/carousel/file.jpg', caption: 'Описание кадра' }
/// caption — опционально (подпись в стиле spy-OS).
const ABOUT_CAROUSEL = [
  { src: 'assets/img/carousel/_MG_9549.jpg',                  caption: 'STUDIO // SPB' },
  { src: 'assets/img/carousel/_MG_9645.jpg',                  caption: 'SESSION 02' },
  { src: 'assets/img/carousel/IMG_20260626_141400_366.jpg',                  caption: 'STUDIO // GIG' },
  { src: 'assets/img/carousel/photo_2024-03-29_23-42-00.jpg', caption: 'BACKSTAGE // 2024' },
  { src: 'assets/img/carousel/4_2.11.1.jpg',                  caption: 'STAGE // FORUM' },
  { src: 'assets/img/carousel/photo_2023-06-19_10-08-40-transformed.jpeg',                 caption: 'PHOTO // PASSPORT' },
  { src: 'assets/img/carousel/-2147483648_-212107.jpg',       caption: 'FIELD // RECORD' },
  { src: 'assets/img/carousel/-2147483648_-212109.jpg',       caption: 'FIELD // RECORD' },
  { src: 'assets/img/carousel/-2147483648_-212111.jpg',       caption: 'FIELD // RECORD' },
  { src: 'assets/img/carousel/photo_2023-08-17_08-33-48.jpg',       caption: 'REST // GIG' },
  { src: 'assets/img/carousel/photo_2023-08-09_10-40-20.png',       caption: 'REALITY // PRODUCTION' },
];

const ABOUT_BRIEF = {
  ru: `
  <p class="about-lead"><strong>Ефрем Лялин</strong> — композитор, саунд-дизайнер, мультиинструменталист и продюсер из СПб.</p>
  <ul class="about-stats">
    <li><span class="about-stat-num">20</span><span class="about-stat-lbl">лет в музыке</span></li>
    <li><span class="about-stat-num">10</span><span class="about-stat-lbl">лет продюсирования</span></li>
    <li><span class="about-stat-num">100+</span><span class="about-stat-lbl">релизов и проектов</span></li>
  </ul>
  <p>Работаю с музыкой, саунд-дизайном и пост-продакшном для музыки, брендов, клипов и фильмов.
     В работе использую Ableton, Kontakt, UVI, Sound Particles, внешний pre-amp, синтезатор Casio, 4 гитары, бас-гитару, при необходимости играю и записываю живые барабаны.
     Собираю звук как лицо проекта: ритм, воздух, грязь, красоту и нерв.</p>
  <p class="about-tags">
    <span>Продакшн</span>
    <span>Сведение</span>
    <span>Мастеринг</span>
    <span>Саунд-дизайн</span>
    <span>Кино</span>
    <span>Преподавание</span>
  </p>
  `,
  en: `
  <p class="about-lead"><strong>Efrem Lyalin</strong> — composer, sound designer, multi-instrumentalist and producer from St. Petersburg.</p>
  <ul class="about-stats">
    <li><span class="about-stat-num">20</span><span class="about-stat-lbl">years in music</span></li>
    <li><span class="about-stat-num">10</span><span class="about-stat-lbl">years producing</span></li>
    <li><span class="about-stat-num">100+</span><span class="about-stat-lbl">releases and projects</span></li>
  </ul>
  <p>I work with music, sound design and post-production for music, brands, music videos and films.
     My toolset: Ableton, Kontakt, UVI, Sound Particles, an external pre-amp, a Casio synth, four guitars, a bass guitar; if needed I play and record live drums.
     I build sound like the face of the project: rhythm, air, grit, beauty and nerve.</p>
  <p class="about-tags">
    <span>Production</span>
    <span>Mixing</span>
    <span>Mastering</span>
    <span>Sound design</span>
    <span>Film</span>
    <span>Teaching</span>
  </p>
  `,
};

/// ДОБАВЛЯЙ ЭТАПЫ «ДОСЬЕ» СЮДА.
/// image и video — опциональны. Если оба пустые — ячейка останется пустой (под будущее медиа).
const ABOUT_TIMELINE = [
  {
    year:  { ru: 'ДЕТСТВО', en: 'CHILDHOOD' },
    title: { ru: 'Скрипка, туба, барабаны', en: 'Violin, tuba, drums' },
    text:  { ru: 'Я был разработан и выпущен в релиз в 1997 году. В 6 лет был отправлен обучаться струнному инструменту — скрипка. По прошествии 6 лет был переведён в духовой класс — туба. Также в 13 лет начал осваивать ударные — выступил с выпускным классом школы с метал-кавером Lady Gaga — Pokerface. В итоге сформировалась группа с экстремально-метальным направлением Grindcore / Post-hardcore.',
             en: 'Designed and shipped to release in 1997. At 6 I was sent to study a string instrument — violin. Six years later I switched to the brass class — tuba. At 13 I started drums and performed Lady Gaga — Pokerface metal cover with my graduating class. Eventually a band took shape, leaning into extreme metal: Grindcore / Post-hardcore.' },
  },
  {
    year:  '2013',
    title: "Cassandra's Complex / Psychic Deviation",
    text:  { ru: 'Обновление прошивки возымело успех. Я начал играть в нескольких группах одновременно, в разных ветвях метала. Много концертов, репетиций и записей. Параллельно — джем-команда в духе Psychedelic / Space Rock.',
             en: 'Firmware update worked. I started playing in several bands at once, across different branches of metal. Lots of gigs, rehearsals and recordings. In parallel — a jam band in the Psychedelic / Space Rock vein.' },
  },
  {
    year:  '2016',
    title: { ru: 'Армия. Оркестр Главного Штаба', en: 'Army. General Staff Orchestra' },
    text:  { ru: 'Туба и барабаны в составе оркестра. В свободное время — лоу-фай и джаз-биты на компьютере.',
             en: 'Tuba and drums in the orchestra. In free time — lo-fi and jazz beats on a laptop.' },
  },
  {
    year:  '2017–2018',
    title: 'Free Sadness / OVERRATED',
    text:  { ru: 'Другие жанры — Dark Pop, Southern Rock / Screamo. Первый серьёзный опыт сведения собственных записанных ударных.',
             en: 'Different genres — Dark Pop, Southern Rock / Screamo. The first serious experience mixing my own drum tracks.' },
  },
  {
    year:  '2019',
    title: { ru: 'Преподавание + MARAK', en: 'Teaching + MARAK' },
    text:  { ru: 'Преподавание барабанов, фриланс-задачи. Группа MARAK (Black Metal / Blackened Hardcore).',
             en: 'Teaching drums, freelance gigs. Band MARAK (Black Metal / Blackened Hardcore).' },
  },
  {
    year:  '2021',
    title: { ru: 'Студии A80 и TO99', en: 'A80 and TO99 studios' },
    text:  { ru: 'Работа с «Ой, Прости», BAZOOQA, Malina Scar, Эрнесто Заткнитесь. Курсы операторского мастерства, режиссуры, монтажа.',
             en: 'Worked with “Oy, Prosti”, BAZOOQA, Malina Scar, Ernesto Zatknites. Cinematography, directing and editing courses.' },
  },
  {
    year:  '2022',
    title: 'NAGNIBEDA, BLESK, STRUNA',
    text:  { ru: 'Продюсирование, преподавание. Переезд в Казахстан, преподавание в школе STRUNA (Шымкент).',
             en: 'Production, teaching. Move to Kazakhstan, teaching at STRUNA school (Shymkent).' },
  },
  {
    year:  '2023–2024',
    title: { ru: 'YFRO · релиз «DEMO»', en: 'YFRO · “DEMO” release' },
    text:  { ru: 'Личный проект YFRO. 32 трека — концептуальный саунд-дизайн как портфолио.',
             en: 'Personal project YFRO. 32 tracks — conceptual sound design as a portfolio.' },
  },
  {
    year:  { ru: 'СЕЙЧАС', en: 'NOW' },
    title: { ru: 'СПб. Студия, нейросети, плагины', en: 'St. Petersburg. Studio, neural nets, plug-ins' },
    text:  { ru: 'Полный продюсерский цикл: продакшн, сведение, мастеринг. Новая домашняя студия, исследование нейросетей, разработка аудио-плагинов.',
             en: 'Full producer cycle: production, mixing, mastering. New home studio, exploring neural networks, developing audio plug-ins.' },
  },
  /// Добавляй сюда новые этапы. Пример с медиа:
  // {
  //   year: '202X',
  //   title: 'Событие',
  //   text:  'Описание.',
  //   image: 'assets/img/about/event.jpg', // или video: 'assets/video/event.mp4'
  //   caption: 'Подпись под медиа.'
  // },
];
