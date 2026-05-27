// Generates and replaces the "До и после" block on all 6 service pages.
// Run: node apply_before_after.js
const fs = require('fs');
const path = require('path');

const ICONS = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="15" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>',
  trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  pkg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
  battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.91 5.49L4.5 10.5l5.59 2.01L12 18l1.91-5.49L19.5 10.5l-5.59-2.01z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/></svg>',
};

const icon = (name) => `<span class="ba-metric-icon" aria-hidden="true">${ICONS[name] || ICONS.target}</span>`;

function renderBlock({ subtitle, pairs, summary }) {
  const rows = pairs.map(p => `
                    <div class="ba-row">
                        <div class="ba-metric">
                            ${icon(p.icon)}
                            <span class="ba-metric-name">${p.metric}</span>
                        </div>
                        <div class="ba-compare">
                            <div class="ba-side ba-before">
                                <div class="ba-side-label">Было</div>
                                <div class="ba-side-value">${p.beforeValue}</div>
                                <div class="ba-side-desc">${p.beforeDesc}</div>
                            </div>
                            <div class="ba-delta" aria-hidden="true">
                                <div class="ba-delta-value">${p.deltaValue}</div>
                                <div class="ba-delta-label">${p.deltaLabel}</div>
                            </div>
                            <div class="ba-side ba-after">
                                <div class="ba-side-label">Стало</div>
                                <div class="ba-side-value">${p.afterValue}</div>
                                <div class="ba-side-desc">${p.afterDesc}</div>
                            </div>
                        </div>
                    </div>`).join('');

  return `<div class="detail-block ba-block stats-animate-container" style="border-radius: var(--radius-lg);">
                    <div class="ba-header">
                        <h2>До и после</h2>
                        <p class="ba-subtitle">${subtitle}</p>
                    </div>
                    <div class="ba-grid">${rows}
                    </div>
                    <div class="ba-summary" role="group" aria-label="Общая продуктивность">
                        <div>
                            <div class="ba-summary-title">${summary.title}</div>
                            <div class="ba-summary-name">${summary.name}</div>
                        </div>
                        <div class="ba-progress">
                            <div class="ba-progress-track">
                                <div class="ba-progress-fill" data-fill="${summary.fillTo}"></div>
                            </div>
                            <div class="ba-progress-marks">
                                <span>Было&nbsp;<strong>${summary.fromLabel}</strong></span>
                                <span>Стало&nbsp;<strong>${summary.toLabel}</strong></span>
                            </div>
                        </div>
                        <div class="ba-summary-delta">
                            <div class="ba-summary-delta-value">${summary.deltaValue}</div>
                            <div class="ba-summary-delta-label">${summary.deltaLabel}</div>
                        </div>
                    </div>
                </div>`;
}

const DATA = {
  'service-openclaw.html': {
    subtitle: 'Что меняется в первый месяц после того, как OpenClaw и Hermes встают в ваш контур и берут на себя рутину.',
    pairs: [
      { icon: 'clock', metric: 'Скорость ответа клиенту',
        beforeValue: '≈ 2 часа', beforeDesc: 'клиент успевает остыть и уходит к конкуренту',
        deltaValue: '×160', deltaLabel: 'быстрее',
        afterValue: '45 секунд', afterDesc: 'отвечаем раньше всех на рынке — пока интерес горячий' },
      { icon: 'timer', metric: 'Время на рутину у менеджеров',
        beforeValue: '4 часа в день', beforeDesc: 'копипаст, статусы, ручные отчёты',
        deltaValue: '−94%', deltaLabel: 'рутины',
        afterValue: '15 мин в день', afterDesc: '+22 часа в неделю на каждого продавать вживую' },
      { icon: 'alert', metric: 'Ошибки переноса данных в CRM',
        beforeValue: '12%', beforeDesc: 'сделок «теряются» в воронке из‑за человеческого фактора',
        deltaValue: '−100%', deltaLabel: 'ошибок',
        afterValue: '0%', afterDesc: 'данные идут чисто через API — ни одна сделка не падает' },
      { icon: 'shield', metric: 'Доступность поддержки',
        beforeValue: '8 / 5', beforeDesc: 'ночью и в выходные клиент остаётся без ответа',
        deltaValue: '+128 ч', deltaLabel: 'в неделю',
        afterValue: '24 / 7', afterDesc: 'продаём и закрываем заявки, пока команда спит' },
      { icon: 'coins', metric: 'Стоимость обработки одной заявки',
        beforeValue: 'фикс‑оклад', beforeDesc: 'плюс перекуры, отпуска и больничные оператора',
        deltaValue: '−80%', deltaLabel: 'к costs',
        afterValue: 'копейки API', afterDesc: 'себестоимость касания падает в разы — окупается за недели' },
      { icon: 'trending', metric: 'Общая продуктивность команды',
        beforeValue: '10%', beforeDesc: 'реального полезного КПД на человека',
        deltaValue: '×5.5', deltaLabel: 'к выработке',
        afterValue: '55%', afterDesc: 'те же люди закрывают в 5 раз больше задач без переработок' },
    ],
    summary: {
      title: 'Итог: продуктивность команды',
      name: 'Те же сотрудники — в 5,5 раз больше закрытых задач без увеличения ФОТ',
      fromLabel: '10%', toLabel: '55%', fillTo: 55,
      deltaValue: '×5.5', deltaLabel: 'к выручке отдела'
    }
  },
  'service-custom-ai.html': {
    subtitle: 'Когда ИИ‑агент пишется под вашу бизнес‑логику, а не подгоняется из шаблона, цифры меняются драматично.',
    pairs: [
      { icon: 'chart', metric: 'Скоринг и аналитика проекта',
        beforeValue: '3–5 дней', beforeDesc: 'работа целой команды аналитиков и менеджеров',
        deltaValue: '×40', deltaLabel: 'быстрее',
        afterValue: '2 часа', afterDesc: 'кастомный ИИ выдаёт готовый дашборд с выводами' },
      { icon: 'target', metric: 'Покрытие задач под ваш регламент',
        beforeValue: '~30%', beforeDesc: 'готовые шаблоны не закрывают и половины ваших кейсов',
        deltaValue: '+233%', deltaLabel: 'к покрытию',
        afterValue: '100%', afterDesc: 'алгоритм описывает каждый шаг вашей реальной работы' },
      { icon: 'users', metric: 'Зависимость от ключевых сотрудников',
        beforeValue: 'критическая', beforeDesc: 'уход одного человека стопорит целое направление',
        deltaValue: '0', deltaLabel: 'риска',
        afterValue: 'нулевая', afterDesc: 'вся экспертиза зашита в модель и принадлежит вам' },
      { icon: 'rocket', metric: 'Стоимость масштабирования функции',
        beforeValue: '+120k ₽/мес', beforeDesc: 'найм нового сотрудника, обучение, расширение ФОТ',
        deltaValue: '−100%', deltaLabel: 'к ФОТ',
        afterValue: '+1 ИИ‑поток', afterDesc: 'запуск за минуты, дополнительных сотрудников не нужно' },
      { icon: 'check', metric: 'Точность выполнения инструкций',
        beforeValue: '70–80%', beforeDesc: 'люди устают, отвлекаются, забывают шаги',
        deltaValue: '×100', deltaLabel: 'к стабильности',
        afterValue: '99,9%', afterDesc: 'алгоритм не пропустит пункт ни ночью, ни в пятницу' },
      { icon: 'trending', metric: 'Продуктивность направления',
        beforeValue: '20%', beforeDesc: 'половина времени уходит на согласования и переключения',
        deltaValue: '×4', deltaLabel: 'к выработке',
        afterValue: '80%', afterDesc: 'направление работает без простоев и узких мест' },
    ],
    summary: {
      title: 'Итог: эффективность направления',
      name: 'Кастомный ИИ‑агент превращает направление в полноценный авто‑конвейер',
      fromLabel: '20%', toLabel: '80%', fillTo: 80,
      deltaValue: '×4', deltaLabel: 'к выработке отдела'
    }
  },
  'service-bots.html': {
    subtitle: 'Типовые цифры с проектов после запуска бота с ИИ‑сценарием и подключённой оплатой внутри мессенджера.',
    pairs: [
      { icon: 'zap', metric: 'Скорость ответа клиенту в чате',
        beforeValue: '15–30 минут', beforeDesc: 'пока менеджер увидит — клиент уже у конкурента',
        deltaValue: '×400', deltaLabel: 'быстрее',
        afterValue: '3 секунды', afterDesc: 'ловим горячий момент и ведём по сценарию продажи' },
      { icon: 'trending', metric: 'Конверсия из заявки в оплату',
        beforeValue: 'базовая', beforeDesc: 'просадка из‑за пауз и потери контекста переписки',
        deltaValue: '+45%', deltaLabel: 'к выручке',
        afterValue: '+45% оплат', afterDesc: 'тот же поток заявок приносит почти в 1,5 раза больше денег' },
      { icon: 'msg', metric: 'Нагрузка на службу поддержки',
        beforeValue: '100% руками', beforeDesc: 'команда тонет в типовых однотипных вопросах',
        deltaValue: '−60%', deltaLabel: 'тикетов',
        afterValue: 'только сложные', afterDesc: 'живые менеджеры работают только с прибыльными кейсами' },
      { icon: 'card', metric: 'Приём оплат и выдача чеков',
        beforeValue: 'руками', beforeDesc: 'менеджер сверяет переводы и шлёт реквизиты',
        deltaValue: '0 мин', deltaLabel: 'оператора',
        afterValue: 'эквайринг в чате', afterDesc: 'оплата в один тап, чек улетает клиенту мгновенно' },
      { icon: 'tag', metric: 'Сегментация и сбор базы',
        beforeValue: 'хаос', beforeDesc: 'блокноты, экселька и потерянные контакты',
        deltaValue: '100%', deltaLabel: 'базы размечено',
        afterValue: 'автотеги', afterDesc: 'каждый клиент сегментирован под точечные офферы и рассылки' },
      { icon: 'trending', metric: 'Продуктивность продаж через чат',
        beforeValue: '15%', beforeDesc: 'теряем большую часть лидов на длинных паузах',
        deltaValue: '×4.3', deltaLabel: 'к выработке',
        afterValue: '65%', afterDesc: 'мессенджер превращается в полноценный отдел продаж 24/7' },
    ],
    summary: {
      title: 'Итог: продажи в мессенджерах',
      name: 'Мессенджер становится главным каналом продаж — без увеличения штата',
      fromLabel: '15%', toLabel: '65%', fillTo: 65,
      deltaValue: '×4.3', deltaLabel: 'к продажам в чате'
    }
  },
  'service-marketplaces.html': {
    subtitle: 'Что меняется в кабинете селлера Wildberries/Ozon в первый месяц после подключения ИИ‑агентов.',
    pairs: [
      { icon: 'clock', metric: 'Время на отзывы и вопросы',
        beforeValue: '3–5 часов в день', beforeDesc: 'выгорает любой селлер — а это каждый день, без выходных',
        deltaValue: '+1 200 ч', deltaLabel: 'в год вам',
        afterValue: '0 минут', afterDesc: 'ИИ отвечает быстрее и вежливее любого менеджера' },
      { icon: 'search', metric: 'SEO‑обновление карточек',
        beforeValue: '1 раз в месяц', beforeDesc: 'тексты устаревают, карточка падает в выдаче',
        deltaValue: '×16', deltaLabel: 'чаще',
        afterValue: '4 раза в неделю', afterDesc: 'подстройка под трендовые запросы и сезонный спрос' },
      { icon: 'chart', metric: 'Контроль цен конкурентов',
        beforeValue: '1 проверка в день', beforeDesc: 'упускаем буст и теряем место в топе',
        deltaValue: '×96', deltaLabel: 'чаще',
        afterValue: 'каждые 15 мин', afterDesc: 'автокоррекция цены — всегда лучшее предложение в категории' },
      { icon: 'pkg', metric: 'Упущенная выгода на остатках',
        beforeValue: '−15% прибыли', beforeDesc: 'регулярно «улетаем» в out‑of‑stock в самый пик',
        deltaValue: '+15%', deltaLabel: 'к чистой',
        afterValue: 'точный прогноз', afterDesc: 'товар всегда в наличии — ни одной упущенной продажи' },
      { icon: 'star', metric: 'Рейтинг и место в выдаче',
        beforeValue: 'проседает', beforeDesc: 'долгие ответы и негатив сбрасывают карточку',
        deltaValue: '+25–40%', deltaLabel: 'к выручке',
        afterValue: 'стабильно в топе', afterDesc: 'рейтинг растёт, карточка не вылетает из первой страницы' },
      { icon: 'trending', metric: 'Продуктивность ведения магазина',
        beforeValue: '15%', beforeDesc: 'почти всё время уходит на рутину, а не на рост',
        deltaValue: '×5', deltaLabel: 'к выработке',
        afterValue: '75%', afterDesc: 'фокус на закупки и масштабирование, рутину закрывает ИИ' },
    ],
    summary: {
      title: 'Итог: эффективность магазина',
      name: 'Магазин работает 24/7 без вас — а вы фокусируетесь на масштабировании',
      fromLabel: '15%', toLabel: '75%', fillTo: 75,
      deltaValue: '×5', deltaLabel: 'к выручке кабинета'
    }
  },
  'service-content.html': {
    subtitle: 'Что меняется в контент‑маркетинге, когда производство берёт на себя ИИ‑конвейер, а не команда людей.',
    pairs: [
      { icon: 'film', metric: 'Объём выпускаемого контента',
        beforeValue: '2–3 в неделю', beforeDesc: 'каждое видео — это спринт сценариста и монтажёра',
        deltaValue: '×140', deltaLabel: 'к объёму',
        afterValue: '20–50 в день', afterDesc: 'промышленный конвейер — заливаем алгоритмы массой' },
      { icon: 'coins', metric: 'Себестоимость одной единицы',
        beforeValue: '≈ 5 000 ₽', beforeDesc: 'сценарист + оператор + монтажёр + правки',
        deltaValue: '−99%', deltaLabel: 'к costs',
        afterValue: '≈ 30 ₽', afterDesc: 'только копеечные подписки на ИИ‑инструменты' },
      { icon: 'timer', metric: 'Время владельца на соцсети',
        beforeValue: '20 ч / неделю', beforeDesc: 'идеи, съёмки, контроль, согласования — без конца',
        deltaValue: '+80 ч', deltaLabel: 'в месяц вам',
        afterValue: '0 часов', afterDesc: 'публикации идут на полном автопилоте, день за днём' },
      { icon: 'sparkles', metric: 'Охваты и органический трафик',
        beforeValue: 'минимум', beforeDesc: 'алгоритмы «забывают» канал из‑за редких публикаций',
        deltaValue: '×10–100', deltaLabel: 'к охватам',
        afterValue: 'кратный рост', afterDesc: 'плотная регулярность → каналы зашиваются в рекомендации' },
      { icon: 'battery', metric: 'Риск выгорания контент‑команды',
        beforeValue: '100%', beforeDesc: 'идеи и силы заканчиваются за 1–2 месяца',
        deltaValue: '∞', deltaLabel: 'идей',
        afterValue: '0%', afterDesc: 'нейросеть генерирует темы и сценарии бесконечно' },
      { icon: 'trending', metric: 'Продуктивность контент‑маркетинга',
        beforeValue: '10%', beforeDesc: 'выходит мало, охваты копеечные, ROI околонулевой',
        deltaValue: '×9', deltaLabel: 'к выработке',
        afterValue: '90%', afterDesc: 'контент работает на бренд и лидген каждый день' },
    ],
    summary: {
      title: 'Итог: контент‑маркетинг',
      name: 'Контент‑конвейер генерирует бесплатный органический трафик 365 дней в году',
      fromLabel: '10%', toLabel: '90%', fillTo: 90,
      deltaValue: '×9', deltaLabel: 'к выработке канала'
    }
  },
  'service-custom-dev.html': {
    subtitle: 'Что меняется, когда софт пишется под вашу бизнес‑модель, а не вы ломаете регламенты под чужие CRM/ERP.',
    pairs: [
      { icon: 'settings', metric: 'Совместимость с бизнес‑процессами',
        beforeValue: 'ломаем регламент', beforeDesc: 'подстраиваемся под ограничения готовых CRM и ERP',
        deltaValue: '100%', deltaLabel: 'покрытия',
        afterValue: 'софт под вас', afterDesc: 'программа повторяет ваши уникальные шаги до запятой' },
      { icon: 'hand', metric: 'Доля ручного труда',
        beforeValue: '5 источников', beforeDesc: 'сотрудники руками сводят данные в один отчёт',
        deltaValue: '−100%', deltaLabel: 'к ручке',
        afterValue: '0 ручной работы', afterDesc: 'сбор и склейка данных автоматически по расписанию' },
      { icon: 'file', metric: 'Скорость управленческой аналитики',
        beforeValue: 'дни и недели', beforeDesc: 'к моменту готовности отчёт уже неактуален',
        deltaValue: '×500', deltaLabel: 'быстрее',
        afterValue: '1 клик', afterDesc: 'точные данные в реальном времени для решений' },
      { icon: 'bug', metric: 'Ошибки человеческого фактора',
        beforeValue: 'регулярно', beforeDesc: 'опечатки, усталость, потеря денег на ровном месте',
        deltaValue: '−100%', deltaLabel: 'потерь',
        afterValue: '0', afterDesc: 'технических ошибок и срывов в работе процессов' },
      { icon: 'card', metric: 'Расходы на иностранный софт',
        beforeValue: '50–300k ₽/мес', beforeDesc: 'подписки, которые могут заблокировать в любой момент',
        deltaValue: '−100%', deltaLabel: 'к подпискам',
        afterValue: '0 ₽/мес', afterDesc: 'собственное ПО — без ежемесячных платежей и санкций' },
      { icon: 'trending', metric: 'Эффективность работы отдела',
        beforeValue: '20%', beforeDesc: 'большую часть времени сотрудники чинят процессы, а не работают',
        deltaValue: '×4.25', deltaLabel: 'к выработке',
        afterValue: '85%', afterDesc: 'инструменты помогают, а не мешают — отдел работает на максимум' },
    ],
    summary: {
      title: 'Итог: эффективность отдела',
      name: 'Софт под вашу бизнес‑модель — нематериальный актив, который окупается годами',
      fromLabel: '20%', toLabel: '85%', fillTo: 85,
      deltaValue: '×4.25', deltaLabel: 'к выработке отдела'
    }
  },
};

const ROOT = __dirname;
const OLD_BLOCK_RE = /<div class="detail-block stats-animate-container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;
const CLOSE_TAIL = `
            </div>
        </div>
    </section>`;

let updated = 0;
for (const [file, data] of Object.entries(DATA)) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    console.warn('skip (no file):', file);
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');
  if (!OLD_BLOCK_RE.test(src)) {
    console.warn('no match:', file);
    continue;
  }
  const block = renderBlock(data);
  const next = src.replace(OLD_BLOCK_RE, block + CLOSE_TAIL);
  fs.writeFileSync(full, next, 'utf8');
  console.log('updated:', file);
  updated++;
}
console.log(`\nDone. Files updated: ${updated}/${Object.keys(DATA).length}`);
