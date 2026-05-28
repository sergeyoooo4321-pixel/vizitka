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
