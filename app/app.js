/*
 * venchakov Mini App — логика ленты.
 * Тянет ленту с бэкенда (Cloudflare Worker), при любой ошибке падает на локальный сэмпл.
 * Замороженный контракт данных: { items:[{id,type,videoId,title,desc,material,thumb,tag,addedAt}] }
 */

// ЗАМЕНИ на URL своего Cloudflare Worker (тот же, что в connect-src CSP в index.html):
const API_BASE = 'https://YOUR-WORKER-SUBDOMAIN.workers.dev';

// ---- Telegram SDK: готовность + разворот на весь экран (безопасно, если SDK нет) ----
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

/** Открыть внешнюю ссылку через Telegram, а вне Telegram — обычным окном. */
function openLink(url) {
  if (!url) return;
  if (tg) tg.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

// ---- Состояние ленты ----
let allItems = [];      // все карточки (отсортированы, новые сверху)
let activeTag = 'Все';  // активный чип-фильтр
let query = '';         // строка поиска (в нижнем регистре)

const feedEl = document.getElementById('feed');
const chipsEl = document.getElementById('chips');
const searchEl = document.getElementById('search');

/** Экранирование текста, чтобы данные из фида не ломали разметку (XSS-защита). */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Загрузка ленты. Сначала пробуем боевой API; если API_BASE ещё плейсхолдер
 * или запрос упал/вернул не то — берём локальный ./feed.sample.json.
 */
async function loadFeed() {
  const isPlaceholder = API_BASE.includes('YOUR-WORKER-SUBDOMAIN');
  if (!isPlaceholder) {
    try {
      const r = await fetch(API_BASE + '/feed');
      if (r.ok) {
        const data = await r.json();
        if (data && Array.isArray(data.items)) return data.items;
      }
    } catch (e) { /* тихо падаем на сэмпл ниже */ }
  }
  // Fallback, чтобы страница работала до подключения бэкенда
  try {
    const r = await fetch('./feed.sample.json');
    const data = await r.json();
    return (data && Array.isArray(data.items)) ? data.items : [];
  } catch (e) { return []; }
}

/** Собрать уникальные категории из tag карточек: «Все» + всё остальное по порядку появления. */
function buildTags(items) {
  const tags = ['Все'];
  for (const it of items) {
    const t = (it.tag || '').trim();
    if (t && t !== 'Все' && !tags.includes(t)) tags.push(t);
  }
  return tags;
}

/** Отрисовать чипы-фильтры. */
function renderChips(tags) {
  chipsEl.innerHTML = '';
  for (const t of tags) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (t === activeTag ? ' is-active' : '');
    b.textContent = t;
    b.addEventListener('click', () => {
      activeTag = t;
      renderChips(tags);
      renderFeed();
    });
    chipsEl.appendChild(b);
  }
}

/** Применить фильтр по чипу и поиску. */
function visibleItems() {
  return allItems.filter(it => {
    const okTag = activeTag === 'Все' || (it.tag || '') === activeTag;
    if (!okTag) return false;
    if (!query) return true;
    const hay = ((it.title || '') + ' ' + (it.desc || '')).toLowerCase();
    return hay.includes(query);
  });
}

/** Отрисовать ленту карточек (или заглушку, если пусто). */
function renderFeed() {
  const items = visibleItems();
  feedEl.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = allItems.length ? 'Ничего не найдено' : 'Пока пусто';
    feedEl.appendChild(empty);
    return;
  }

  for (const it of items) {
    const card = document.createElement('article');
    card.className = 'card';

    // Иконка play для плейсхолдера, если картинка не загрузится
    const playSvg = '<svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    card.innerHTML =
      '<div class="card-thumb">' +
        '<img loading="lazy" alt="" src="' + esc(it.thumb) + '">' +
        '<div class="ph">' + playSvg + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<h2 class="card-title">' + esc(it.title) + '</h2>' +
        (it.desc ? '<p class="card-desc">' + esc(it.desc) + '</p>' : '') +
        (it.tag ? '<span class="card-tag">' + esc(it.tag) + '</span>' : '') +
      '</div>';

    // onerror картинки → показать плейсхолдер
    const img = card.querySelector('img');
    img.addEventListener('error', () => card.querySelector('.card-thumb').classList.add('is-broken'));

    // тап по карточке → открыть материалы
    card.addEventListener('click', () => openLink(it.material));

    feedEl.appendChild(card);
  }
}

// ---- Живой поиск ----
searchEl.addEventListener('input', () => {
  query = searchEl.value.trim().toLowerCase();
  renderFeed();
});

// ---- Hero-кнопка: скролл к ленте ----
document.getElementById('heroScroll').addEventListener('click', () => {
  feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---- Нижнее меню: «Услуги»/«Сайт» открывают внешние ссылки, «Главная» = лента ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const link = tab.getAttribute('data-link');
    if (link) { openLink(link); return; }
    // «Главная» — вернуть к началу ленты
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ---- Старт ----
(async function init() {
  const items = await loadFeed();
  // Сортировка по addedAt по убыванию (новые сверху)
  allItems = items.slice().sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  renderChips(buildTags(allItems));
  renderFeed();
})();
