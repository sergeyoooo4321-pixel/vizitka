/**
 * Cloudflare Worker — безопасный прокси для Ollama Cloud API
 *
 * Защита:
 * - API-ключ хранится в секретах Worker, не отдаётся клиенту
 * - Проверка Origin (только venchakov.com)
 * - Rate limiting по IP (20 запросов/мин)
 * - Валидация тела запроса (модель, длина сообщений, кол-во)
 * - CORS только для разрешённых доменов
 */

const ALLOWED_ORIGINS = [
  'https://venchakov.com',
  'https://www.venchakov.com',
  'https://sergeyoooo4321-pixel.github.io',
];

const ALLOWED_MODELS = ['gemma3:4b'];
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_PER_MINUTE = 20;
const RATE_LIMIT_GLOBAL_PER_MINUTE = 200;

// Простой in-memory rate limiter (сбрасывается при cold start)
const ipRequests = new Map();
let globalCount = 0;
let lastReset = Date.now();

function resetIfNeeded() {
  const now = Date.now();
  if (now - lastReset > 60000) {
    ipRequests.clear();
    globalCount = 0;
    lastReset = now;
  }
}

function checkRateLimit(ip) {
  resetIfNeeded();
  globalCount++;
  if (globalCount > RATE_LIMIT_GLOBAL_PER_MINUTE) {
    return false;
  }
  const count = (ipRequests.get(ip) || 0) + 1;
  ipRequests.set(ip, count);
  return count <= RATE_LIMIT_PER_MINUTE;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => origin === allowed);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonError(message, status, origin) {
  const headers = {
    'Content-Type': 'application/json',
    ...((origin && isAllowedOrigin(origin)) ? corsHeaders(origin) : {}),
  };
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Некорректное тело запроса';
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    return 'Недопустимая модель';
  }

  if (!Array.isArray(body.messages)) {
    return 'messages должен быть массивом';
  }

  if (body.messages.length > MAX_MESSAGES) {
    return `Слишком много сообщений (макс ${MAX_MESSAGES})`;
  }

  for (const msg of body.messages) {
    if (!msg.role || !msg.content) {
      return 'Некорректный формат сообщения';
    }
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      return 'Недопустимая роль сообщения';
    }
    if (typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_LENGTH) {
      return `Сообщение слишком длинное (макс ${MAX_MESSAGE_LENGTH} символов)`;
    }
  }

  return null;
}

/**
 * Проверяет, является ли строка http(s)-ссылкой.
 * Намеренно грубо: достаточно префикса, чтобы отделить ссылки от текста описания.
 * @param {string} str
 * @returns {boolean}
 */
function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

/**
 * Вытаскивает 11-символьный ID видео из разных форм YouTube-ссылок.
 * Поддержка: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, youtube.com/embed/ID.
 * @param {string} url
 * @returns {string|null} ID видео или null, если это не YouTube-ссылка
 */
function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/**
 * Отправляет текстовое сообщение через Telegram Bot API.
 * Токен берётся ТОЛЬКО из секретов (env.BOT_TOKEN). Сбой доставки не должен ронять вебхук.
 * @param {object} env — окружение Worker с секретом BOT_TOKEN
 * @param {number|string} chatId — id чата получателя
 * @param {string} text — текст сообщения
 */
async function tgSend(env, chatId, text) {
  if (!chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    /* игнорируем — вебхук всё равно должен ответить 200 */
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    // Healthcheck
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ────────────────────────────────────────────────────────────────
    // Лента мини-аппки (бот-лента). Роуты добавлены ДО логики /chat.
    // ────────────────────────────────────────────────────────────────

    // GET /feed — публичная лента для мини-аппки. Читается из KV, отдаётся всем.
    // Данные не секретны, поэтому чужому Origin отдаём без CORS (не блокируем).
    if (url.pathname === '/feed') {
      const feedCors = isAllowedOrigin(origin)
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          }
        : {};

      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: feedCors });
      }
      if (request.method !== 'GET') {
        return jsonError('Method not allowed', 405, origin);
      }

      // Читаем массив ленты из KV (null → пустой список)
      const items = (await env.FEED_KV.get('feed', 'json')) || [];
      return new Response(JSON.stringify({ items }), {
        headers: { 'Content-Type': 'application/json', ...feedCors },
      });
    }

    // POST /tg-webhook — вебхук Telegram. Владелец шлёт 2 ссылки → карточка в ленту.
    if (url.pathname === '/tg-webhook' && request.method === 'POST') {
      // Секрет вебхука отсекает чужие запросы к этому роуту (Telegram шлёт его в заголовке).
      if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
        return new Response('Forbidden', { status: 403 });
      }

      // Хелпер: Телеграму всегда отвечаем 200 {ok:true}, чтобы он не ретраил апдейт.
      const ok = () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });

      let update;
      try {
        update = await request.json();
      } catch {
        return ok();
      }

      const message = update && update.message;
      const text = message && message.text;
      // Нет сообщения или текста (стикер, фото и т.п.) — молча подтверждаем.
      if (!message || !text) {
        return ok();
      }

      const chatId = message.chat && message.chat.id;

      // Авторизация: пишем в ленту только по команде владельца (ADMIN_ID из секретов).
      if (String(message.from && message.from.id) !== String(env.ADMIN_ID)) {
        await tgSend(env, chatId, 'Этот бот только для владельца.');
        return ok();
      }

      // Разбор текста: строки → убираем пустые. Ссылки отдельно, остальное — описание.
      const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
      const urls = lines.filter(isUrl);
      const descLines = lines.filter((l) => !isUrl(l));

      // Нужны минимум 2 ссылки: ролик и материалы.
      if (urls.length < 2) {
        await tgSend(
          env,
          chatId,
          'Формат:\n1-я строка — ссылка на ролик\n2-я строка — ссылка на материалы\n3+ строки — описание (необязательно)'
        );
        return ok();
      }

      const video = urls[0];
      const material = urls[1];
      const desc = descLines.join('\n');
      const addedAt = Date.now();

      let item;
      const ytId = extractYouTubeId(video);
      if (ytId) {
        // YouTube: тянем название через публичный oEmbed (без ключа). При ошибке — запасное.
        let title = 'Видео';
        try {
          const oe = await fetch(
            'https://www.youtube.com/oembed?url=' + encodeURIComponent(video) + '&format=json'
          );
          if (oe.ok) {
            const data = await oe.json();
            if (data && data.title) title = data.title;
          }
        } catch {
          /* oEmbed недоступен — оставляем title = 'Видео' */
        }

        item = {
          id: ytId,
          type: 'youtube',
          videoId: ytId,
          title,
          desc: desc || '',
          material,
          thumb: 'https://i.ytimg.com/vi/' + ytId + '/hqdefault.jpg',
          tag: 'Все',
          addedAt,
        };
      } else {
        // Не YouTube: video-ссылку считаем картинкой/материалом (без videoId).
        item = {
          id: 'c' + addedAt,
          type: 'custom',
          title: descLines[0] || 'Материал',
          desc: desc || '',
          material,
          thumb: video,
          tag: 'Все',
          addedAt,
        };
      }

      // Читаем текущую ленту, добавляем новую карточку в начало, сохраняем обратно.
      const arr = (await env.FEED_KV.get('feed', 'json')) || [];
      arr.unshift(item);
      await env.FEED_KV.put('feed', JSON.stringify(arr));

      await tgSend(env, chatId, 'Добавлено ✅: ' + item.title);
      return ok();
    }

    // Только /chat эндпоинт
    if (url.pathname !== '/chat') {
      return jsonError('Not found', 404, origin);
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Только POST
    if (request.method !== 'POST') {
      return jsonError('Method not allowed', 405, origin);
    }

    // Проверка Origin
    if (!isAllowedOrigin(origin)) {
      return jsonError('Forbidden', 403, origin);
    }

    // Rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Слишком много запросов. Попробуйте через минуту.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          ...corsHeaders(origin),
        },
      });
    }

    // Парсинг и валидация тела
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('Некорректный JSON', 400, origin);
    }

    const validationError = validateBody(body);
    if (validationError) {
      return jsonError(validationError, 400, origin);
    }

    // Собираем чистый запрос (только разрешённые поля)
    const cleanBody = {
      model: body.model,
      messages: body.messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
    };

    // Проксируем к Ollama Cloud
    try {
      const ollamaResponse = await fetch('https://ollama.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OLLAMA_API_KEY}`,
        },
        body: JSON.stringify(cleanBody),
      });

      const responseData = await ollamaResponse.text();

      return new Response(responseData, {
        status: ollamaResponse.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    } catch {
      return jsonError('Ошибка сервера', 502, origin);
    }
  },
};
