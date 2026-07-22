/**
 * Умный поиск услуг по «боли» клиента (services.html).
 *
 * Идея: посетитель не выбирает категорию — он вбивает свою задачу своими
 * словами («менеджеры сливают заявки», «контроль звонков», «спарсить цены»),
 * а мы находим нужную услугу через нечёткое совпадение (опечатки, частичные
 * слова) по её названию, «невидимым» формулировкам-болям и категории.
 *
 * Данные: window.SVC_INDEX (search-index.js) — массив
 *   { c, n, cat, url, price, q } , где
 *   n   — название услуги, cat — категория,
 *   q   — «боли»/синонимы через « | » (невидимые поисковые формулировки),
 *   url — ссылка вида "uslugi-*.html#s-<cat>-<n>" (открывает категорию и
 *         подсвечивает нужную подуслугу через :target).
 *
 * Движок: Fuse.js (fuse.min.js, локально). Живая выдача top-8 по мере ввода.
 */
(function () {
  'use strict';

  var input = document.getElementById('svcSearch');
  var box = document.getElementById('svcResults');
  if (!input || !box || !window.Fuse || !Array.isArray(window.SVC_INDEX)) return;

  var MAX = 8; // сколько подсказок показываем максимум

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

  /** Спрятать выдачу. */
  function hide() { box.hidden = true; box.innerHTML = ''; }

  /** Отрисовать список результатов (или «ничего не найдено»). */
  function render(items) {
    if (!items.length) {
      box.innerHTML =
        '<div class="svc-res-empty">Ничего не нашлось. ' +
        'Опишите задачу другими словами или ' +
        '<a href="index.html#contact">напишите мне напрямую</a>.</div>';
      box.hidden = false;
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html +=
        '<a class="svc-res" href="' + esc(it.url) + '">' +
          '<span class="svc-res-name">' + esc(it.n) + '</span>' +
          '<span class="svc-res-meta">' +
            '<span class="svc-res-cat">' + esc(it.cat) + '</span>' +
            '<span class="svc-res-price">' + esc(it.price) + '</span>' +
          '</span>' +
        '</a>';
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  /** Поиск по текущему запросу. */
  function run() {
    var q = input.value.trim();
    if (q.length < 2) { hide(); return; }
    var res = fuse.search(q, { limit: MAX }).map(function (r) { return r.item; });
    render(res);
  }

  // Живой поиск по мере ввода.
  input.addEventListener('input', run);
  input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });

  // Esc — закрыть; клик вне поля — закрыть.
  input.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && e.target !== input) hide();
  });
})();
