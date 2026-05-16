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
/// Формат: title — название трека без артиста; artist — артист; description — что сделано; genre — pop/rock/rap/hard; src — путь к mp3.
/// Если появятся обложки к аудио, добавляй поле cover: 'assets/img/covers/name.jpg'.
const TRACKS = [
  { title: 'Русалка',                  artist: 'Bjørndalen',   description: 'Дозапись гитар, пост-продакшн, сведение и мастеринг.', genre: 'rock',      duration: 0, src: 'assets/audio/RUSALKA master 3.mp3' },
  { title: 'Drama (YFRO remix)',     artist: 'Malina Scar',  description: 'Ремикс, играл на вечеринках Blesk Party.',             genre: 'pop/hard',  duration: 0, src: 'assets/audio/malina drama re,ix.mp3',     cover: 'assets/img/covers/drama.jpg' },
  { title: 'Чёрт',                    artist: 'Ada Metanoia', description: 'Продакшн, запись, сведение и мастеринг.',              genre: 'rock',      duration: 0, src: 'assets/audio/chert sozidania svod-master2.mp3', cover: 'assets/img/covers/ada.jpg' },
  { title: 'Суперпоколение',           artist: 'NAGNIBEDA',    description: 'Продакшн, сведение и мастеринг. Синтвэйв.',            genre: 'pop',       duration: 0, src: 'assets/audio/80S MASTER 5.mp3' },
  { title: 'SUNRISE — MINUS',        artist: 'KNIFERS',      description: 'Инструментал. Поп, экспериментальная музыка.',         genre: 'pop',       duration: 0, src: 'assets/audio/karinaaaa vst2 minus.mp3' },
  { title: 'SUNRISE — VOX',          artist: 'KNIFERS',      description: 'Полная версия с вокалом.',                             genre: 'pop',       duration: 0, src: 'assets/audio/karinaaaa vst2 wvox.mp3' },
  { title: 'Атом',                     artist: 'NAGNIBEDA',    description: 'Клубный трек. Продакшн, сведение, мастеринг.',         genre: 'pop',       duration: 0, src: 'assets/audio/ngbd atoms master3.mp3', cover: 'assets/img/covers/atom.jpg' },
  { title: 'pomnish',                artist: 'Eraunica',     description: 'Пост-продакшн, сведение и мастеринг.',                 genre: 'pop',       duration: 0, src: 'assets/audio/p3.3 master.mp3' },
  { title: 'Корридор Затмений',         artist: 'UNTITLED',     description: 'Альтернативный хип-хоп. Запись, сведение, мастеринг.', genre: 'rap',       duration: 0, src: 'assets/audio/korridor zatm 2 beta degrade 2.mp3' },
  { title: 'Track 1',                artist: 'SAVA*',        description: 'Хайперпоп. Сведение и мастеринг.',                     genre: 'hard',      duration: 0, src: 'assets/audio/sava hofa.mp3',     cover: 'assets/img/covers/sava.jpg' },
  { title: 'Track 2',                artist: 'SAVA*',        description: 'Хайперпоп. Сведение и мастеринг.',                     genre: 'hard',      duration: 0, src: 'assets/audio/sava 120 1.3.mp3',  cover: 'assets/img/covers/sava.jpg' },
  { title: 'Track 3',                artist: 'SAVA*',        description: 'Хайперпоп. Сведение и мастеринг.',                     genre: 'hard',      duration: 0, src: 'assets/audio/sava 130 master2.mp3', cover: 'assets/img/covers/sava.jpg' },
  { title: 'GRUN',                   artist: 'NAGNIBEDA',    description: 'Поп / габбер. Продакшн.',                              genre: 'pop/hard',  duration: 0, src: 'assets/audio/BBSHKN_7.mp3' },
  { title: 'FACE',                   artist: 'JESSIE',       description: 'Панк-рок / инди. Продакшн, запись, сведение.',         genre: 'rock',      duration: 0, src: 'assets/audio/JESSIE FACE PROJECT MIXING SUPER FINAL 1488 777 AZINo три TOPORA .mp3' , cover: 'assets/img/covers/face.JPG' },
  { title: 'Terrorist Win',          artist: 'BAZOOQA',      description: 'Трэп / трэп-метал. Сведение и мастеринг.',             genre: 'rap/rock',  duration: 0, src: 'assets/audio/TERRACT BASOOQA.mp3' , cover: 'assets/img/covers/bazooqa.png' },
  { title: 'Stars',                  artist: 'NAGNIBEDA',    description: 'Евроденс / поп. Продакшн, сведение, мастеринг.',       genre: 'pop',       duration: 0, src: 'assets/audio/peremaster STARS.mp3' },
  { title: '.WAV',                   artist: 'YFRO',         description: 'Тёмное медленное техно. Продакшн.',                    genre: 'hard',      duration: 0, src: 'assets/audio/gessa1.mp3' , cover: 'assets/img/covers/COVER1_1.2.6.png' },
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
    title: 'Святая деменция',
    description: 'Документальный фильм. Главный приз конкурса «Страна DOC». Музыка, звук на площадке, саунд-дизайн, пост-продакшн. Релиз — начало 2027.',
    src: 'https://drive.google.com/file/d/1Y7wJaufB59effi1XzFh9UNeAyVkh1IPs/preview'
  },

  /// ПРИМЕР ПРОЕКТА: КРЕТ — все видео под одним ярлыком.
  {
    type: 'project',
    title: 'КРЕТ',
    description: 'Крупный саунд-дизайнерский проект для оффлайн-форума концерна КРЕТ (Ростех). 100+ звуковых оформлений стендов.',
    /// ДЛЯ ОБЛОЖКИ ПРОЕКТА — раскомментируй и укажи путь:
    // cover: 'assets/img/projects/kret.jpg',
    items: [
      {
        title: 'Главное видео проекта',
        description: 'Было показано на аудиторию свыше 600 человек в зале с мощностью звука выше 15кВт. Ниже вы можете посмотреть любительскую съемку этого и других моментов с этого форума.',
        src: 'https://drive.google.com/file/d/1C3Wn6jXE8p7wWb6i0MlpSF6Ec4JlgPgq/preview'
      },
      {
        title: 'Лого-стенд',
        description: 'Часть проекта КРЕТ.',
        src: 'https://drive.google.com/file/d/1qd3n-1AJAQv03qNlHosnMpuyBLIA8D-r/preview'
      },
      {
        title: '"Цифровые Дюны" стенд',
        description: 'Часть проекта КРЕТ.',
        src: 'https://drive.google.com/file/d/1rng_IaxFeDBTtYv1pW92uMqp_6HHsUhh/preview'
      },
      {
        title: 'Стенд "Волны в цифре"',
        description: 'Часть проекта КРЕТ.',
        src: 'https://drive.google.com/file/d/1MdM7kmbyRG4tONPIfB4n8eS5wVL1HXwm/preview'
      },
      {
        title: 'Стенд "Цифровой город"',
        description: 'Часть проекта КРЕТ.',
        src: 'https://drive.google.com/file/d/1zQPvnjBKkM_2tKC0PPAYDYE1MTnBQO9j/preview'
      }
      /// Добавляй сюда новые видео проекта КРЕТ (объекты с title/description/src).
    ]
  },

  {
    type: 'video',
    title: 'Звуковое оформление оффлайн-стенда ФНС',
    description: 'Саунд-дизайн, написание музыки и обработка голоса нейронного диктора.',
    src: 'https://drive.google.com/file/d/1yu-FwCS_PVaTyF1qBLXqlAwKJqf2gd8q/preview'
  },
  {
    type: 'video',
    title: 'NAGNIBEDA — On the Beach',
    description: 'Оператор, монтажёр, саунд-продюсер, инженер сведения и мастеринга. Под ключ.',
    src: 'https://www.youtube.com/embed/Rs-6wfCMsQ0'
  },
  {
    type: 'video',
    title: 'Катя Джесси — Ай',
    description: 'Монтаж, цветокор, гитара.',
    src: 'https://www.youtube.com/embed/4u3Mgcn9Hio'
  }
  /// ДОБАВЛЯЙ СЮДА НОВЫЕ ВИДЕО ИЛИ ПРОЕКТЫ.
];

/// ОБНОВЛЯТЬ ПРАЙС ЗДЕСЬ:
/// Пример: { service: 'Сведение трека', unit: 'трек', price: 'от 15000 ₽', note: 'Описание услуги' }
const PRICES = [
  // ====== ПРИМЕР ЗАПОЛНЕННОГО ПРАЙСА ======
  // Скопируй объект { ... } и заполни по аналогии для каждой услуги.
  // Поля:
  //   image:   — путь к SVG-картинке из папки assets/img/prices/
  //   service: — название услуги
  //   desc:    — краткое описание услуги
  //   price:   — цена (строка)

  { image: 'assets/img/prices/DEMO.svg',       service: 'Демо',       desc: 'Короткий демо-трек (до 1 мин) для оценки стиля и подхода.', price: 'от 5 000 ₽' },

  // ====== ДАЛЕЕ — ЗАПОЛНИ ПО АНАЛОГИИ ======
  { image: 'assets/img/prices/FULL.svg',       service: 'Полный продакшн песни.',             desc: 'Включает в себя обсуждение идей, темы и саунд-дизайна трека, начальную работу с текстом, голосовые демо вокалов и все что необходимо для предпродакшна. Запись вокала, если она возможна территориально. Аранжировка, включая синтетические и живые инструменты, сведение и мастеринг при желании артиста.', price: 'от 18000 до 85000 ₽' },
  { image: 'assets/img/prices/LISTEN.svg',     service: '???',             desc: '???', price: '???' },
  { image: 'assets/img/prices/MASTER.svg',     service: '???',             desc: '???', price: '???' },
  { image: 'assets/img/prices/PROD.svg',       service: '???',             desc: '???', price: '???' },
  { image: 'assets/img/prices/TEMPANI.svg',    service: '???',             desc: '???', price: '???' },
  { image: 'assets/img/prices/VOCAL PROD.svg', service: '???',             desc: '???', price: '???' },
];

/// ОБНОВЛЯТЬ МАНИФЕСТ ЗДЕСЬ:
const MANIFEST_HTML = `
  <p><strong>Я не делаю звук «как у всех».</strong> Я собираю аудио-сцену так, чтобы в ней было узнаваемое лицо: ритм, воздух, грязь, красота и нерв.</p>
  <p>Музыка, саунд-дизайн и пост-продакшн должны работать как система: усиливать образ, держать внимание и оставаться в памяти после первого контакта.</p>
  <p>Мой подход — не полировать до стерильности, а найти характер. Звук должен быть уверенным, уникальным и потрясающим.</p>
`;

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
    name: 'Имя клиента',
    role: 'Проект / релиз / видео',
    text: 'Здесь будет отзыв о работе, звучании, процессе и результате.',
    image: 'assets/img/logo.png'
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
  src: 'assets/img/logo.png',
  alt: 'Ефрем Лялин',
  caption: 'YFRO · SPB STUDIO'
};

const ABOUT_BRIEF = `
  <p class="about-lead"><strong>Ефрем Лялин</strong> — композитор, саунд-дизайнер и продюсер из СПб.</p>
  <ul class="about-stats">
    <li><span class="about-stat-num">20</span><span class="about-stat-lbl">лет в музыке</span></li>
    <li><span class="about-stat-num">10</span><span class="about-stat-lbl">лет продюсирования</span></li>
    <li><span class="about-stat-num">100+</span><span class="about-stat-lbl">релизов и проектов</span></li>
  </ul>
  <p>Работаю с музыкой, саунд-дизайном и пост-продакшном для релизов, клипов, фильмов и брендов.
     Собираю звук как лицо проекта: ритм, воздух, грязь, красоту и нерв.</p>
  <p class="about-tags">
    <span>Продакшн</span>
    <span>Сведение</span>
    <span>Мастеринг</span>
    <span>Саунд-дизайн</span>
    <span>Кино</span>
    <span>Преподавание</span>
  </p>
`;

/// ДОБАВЛЯЙ ЭТАПЫ «ДОСЬЕ» СЮДА.
/// image и video — опциональны. Если оба пустые — ячейка останется пустой (под будущее медиа).
const ABOUT_TIMELINE = [
  {
    year: 'ДЕТСТВО',
    title: 'Скрипка, туба, барабаны',
    text:  'С 6 лет — скрипка, затем туба и барабаны в музыкальной школе. В 13 лет — выпускной со старшеклассниками, дальше — экстремальный grindcore.',
    /// ПРИМЕР ДОБАВЛЕНИЯ ФОТО:
    // image: 'assets/img/about/childhood.jpg',
    // caption: 'Первый коллектив, 200X.'
  },
  {
    year: '2013',
    title: 'Cassandra\'s Complex / Psychic Deviation',
    text:  'Барабаны и бас в тяжёлых жанрах металла. Много концертов, репетиций и записей. Параллельно — джем-команда в духе Psychedelic / Space Rock.',
  },
  {
    year: '2016',
    title: 'Армия. Оркестр Главного Штаба',
    text:  'Туба и барабаны в составе оркестра. В свободное время — лоу-фай и джаз-биты на компьютере.',
    /// ПРИМЕР ДОБАВЛЕНИЯ ВИДЕО (mp4 из вашей папки assets/video/):
    // video: 'assets/video/army.mp4'
  },
  {
    year: '2017–2018',
    title: 'Free Sadness / OVERRATED',
    text:  'Другие жанры — Dark Pop, Southern Rock / Screamo. Первый серьёзный опыт сведения собственных барабан-партий.',
  },
  {
    year: '2019',
    title: 'Преподавание + MARAK',
    text:  'Преподавание барабанов, фриланс-задачи. Группа MARAK (Black Metal / Blackened Hardcore).',
  },
  {
    year: '2021',
    title: 'Студии A80 и TO99',
    text:  'Работа с «Ой, Прости», BAZOOQA, Malina Scar, Эрнесто Заткнитесь. Курсы операторского мастерства, режиссуры, монтажа.',
  },
  {
    year: '2022',
    title: 'NAGNIBEDA, BLESK, STRUNA',
    text:  'Продюсирование, преподавание. Переезд в Казахстан, школа STRUNA (Шымкент).',
  },
  {
    year: '2023–2024',
    title: 'YFRO · релиз «DEMO»',
    text:  'Личный проект YFRO. 32 трека — концептуальный саунд-дизайн как портфолио.',
  },
  {
    year: 'СЕЙЧАС',
    title: 'СПб. Студия, нейросети, плагины',
    text:  'Полный продюсерский цикл: продакшн, сведение, мастеринг. Новая домашняя студия, исследование нейросетей, разработка аудио-плагинов.',
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
