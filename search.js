/**
 * Умный поиск услуг по «боли» клиента (services.html).
 *
 * Идея: посетитель не выбирает категорию — он вбивает свою задачу своими
 * словами («менеджеры сливают заявки», «контроль звонков», «спарсить цены»),
 * а мы находим нужную услугу через нечёткое совпадение (опечатки, частичные
 * слова) по её названию, «невидимым» формулировкам-болям и категории.
 *
 * Данные: window.SVC_INDEX (search-index.js) — массив
 *   { c, n, cat, url, price, q, d? } , где
 *   n   — название услуги/запроса, cat — категория,
 *   q   — «боли»/синонимы через « | » (невидимые поисковые формулировки),
 *   url — ссылка вида "uslugi-*.html#s-<cat>-<n>" (открывает категорию и
 *         подсвечивает нужную подуслугу через :target),
 *   d   — описание (только у записей-фраз): название РОДИТЕЛЬСКОЙ подуслуги.
 * Две сущности в индексе: 165 подуслуг (без d) и 1650 записей-фраз (с d) —
 *   у фразы n = сам клиентский запрос, d = тема родительской подуслуги, а
 *   cat/url/price унаследованы от родителя (клик ведёт в ту же подуслугу).
 *
 * Движок: Fuse.js (fuse.min.js, локально). Живая выдача top-8 по мере ввода.
 *
 * Доступность (WAI-ARIA APG «combobox»): input role=combobox с aria-expanded и
 * aria-activedescendant; список role=listbox, пункты role=option. DOM-фокус
 * всегда на input, активный пункт помечается aria-activedescendant (каретка не
 * теряется). Клавиши: ↓/↑ — перемещение, Enter — переход, Escape — закрыть.
 * Число результатов озвучивается через aria-live регион #svcStatus.
 */
(function () {
  'use strict';

  var input = document.getElementById('svcSearch');
  var box = document.getElementById('svcResults');
  var status = document.getElementById('svcStatus');
  if (!input || !box || !window.Fuse || !Array.isArray(window.SVC_INDEX)) return;

  var MAX = 8;           // сколько подсказок показываем максимум
  var OPT_ID = 'svc-opt-'; // префикс id пунктов (для aria-activedescendant)
  var items = [];        // текущие результаты (объекты услуг)
  var active = -1;       // индекс активного пункта (-1 = ничего не выбрано)

  // Вес: имя услуги важнее, «боли» чуть ниже, категория — фоном.
  // ignoreLocation + minMatchCharLength=2 — матч в любом месте длинной строки q.
  var fuse = new Fuse(window.SVC_INDEX, {
    keys: [
      { name: 'n', weight: 0.5 },
      { name: 'q', weight: 0.4 },
      { name: 'cat', weight: 0.2 }
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true
  });

  /** Безопасный вывод текста в HTML. */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Закрыть выдачу и сбросить состояние combobox. */
  function hide() {
    box.hidden = true;
    box.innerHTML = '';
    items = [];
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  /** Отрисовать результаты (или «ничего не найдено») + озвучить количество. */
  function render(list) {
    items = list;
    active = -1;
    if (!list.length) {
      box.innerHTML =
        '<div class="svc-res-empty">Ничего не нашлось. ' +
        'Опишите задачу другими словами или ' +
        '<a href="index.html#contact">напишите мне напрямую</a>.</div>';
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      input.removeAttribute('aria-activedescendant');
      if (status) status.textContent = 'Ничего не нашлось';
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      // Строка описания только у записей-фраз (d = тема родительской подуслуги);
      // у самих подуслуг d нет → карточка выглядит как раньше.
      var descHtml = it.d ? '<span class="svc-res-desc">' + esc(it.d) + '</span>' : '';
      html +=
        '<a class="svc-res" id="' + OPT_ID + i + '" role="option" aria-selected="false" href="' + esc(it.url) + '">' +
          '<span class="svc-res-name">' + esc(it.n) + '</span>' +
          descHtml +
          '<span class="svc-res-meta">' +
            '<span class="svc-res-cat">' + esc(it.cat) + '</span>' +
            '<span class="svc-res-price">' + esc(it.price) + '</span>' +
          '</span>' +
        '</a>';
    }
    box.innerHTML = html;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.removeAttribute('aria-activedescendant');
    if (status) status.textContent = 'Найдено услуг: ' + list.length;
  }

  /** Подсветить пункт по индексу (клавиатурная навигация, aria-activedescendant). */
  function setActive(i) {
    var opts = box.querySelectorAll('.svc-res');
    if (!opts.length) return;
    if (active > -1 && opts[active]) {
      opts[active].classList.remove('is-active');
      opts[active].setAttribute('aria-selected', 'false');
    }
    active = (i + opts.length) % opts.length; // зациклить
    var el = opts[active];
    el.classList.add('is-active');
    el.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  }

  /** Поиск по текущему запросу. */
  function run() {
    var q = input.value.trim();
    if (q.length < 2) { hide(); return; }
    render(fuse.search(q, { limit: MAX }).map(function (r) { return r.item; }));
  }

  // Живой поиск по мере ввода.
  input.addEventListener('input', run);
  input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });

  // Клавиатура combobox: ↓/↑ — перемещение, Enter — переход, Escape — закрыть.
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { hide(); return; }
    if (box.hidden || !items.length) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && input.value.trim().length >= 2) run();
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter' && active > -1 && items[active]) {
      e.preventDefault();
      window.location.href = items[active].url;
    }
  });

  // Клик вне поля/списка — закрыть.
  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && e.target !== input) hide();
  });
})();
