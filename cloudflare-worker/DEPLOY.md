# Деплой бота-ленты (Cloudflare Worker + Telegram + мини-аппка)

Пошагово, команды можно копировать как есть. Все команды — из папки `cloudflare-worker`.
Нужен установленный `wrangler` (Cloudflare CLI) и вход в аккаунт (`wrangler login`).

---

## 1. Ротировать токен бота

Если старый токен где-то светился — сбросьте его:

1. Откройте [@BotFather](https://t.me/BotFather) → команда `/revoke` → выберите бота.
2. Получите НОВЫЙ токен вида `123456789:AA....` — он понадобится в шаге 5.

Если бота ещё нет — `/newbot` и следуйте подсказкам.

## 2. Узнать свой Telegram ID

Напишите [@userinfobot](https://t.me/userinfobot) — он пришлёт ваш числовой `Id`.
Это значение пойдёт в секрет `ADMIN_ID` (только вы сможете добавлять карточки).

## 3. Придумать WEBHOOK_SECRET

Любая случайная строка (буквы/цифры, без пробелов), например сгенерировать:

```bash
openssl rand -hex 16
```

Запомните её — она нужна в шагах 5 и 7.

## 4. Создать KV namespace и вписать id

```bash
wrangler kv namespace create FEED_KV
```

В выводе будет строка с `id = "..."`. Скопируйте этот id и вставьте его
в `wrangler.toml` вместо плейсхолдера `<KV_NAMESPACE_ID>`.

## 5. Загрузить секреты (в код/toml их НЕ пишем)

```bash
wrangler secret put BOT_TOKEN
wrangler secret put ADMIN_ID
wrangler secret put WEBHOOK_SECRET
```

Каждая команда спросит значение — вставьте соответственно:
токен из шага 1, ваш id из шага 2, секрет из шага 3.

(Секрет `OLLAMA_API_KEY` для чат-виджета ставится так же, если ещё не стоит.)

## 6. Задеплоить воркер

```bash
wrangler deploy
```

Запомните URL воркера из вывода, например `https://venchakov-api-proxy.<subdomain>.workers.dev`.

## 7. Поставить вебхук Telegram

Подставьте свой `<TOKEN>`, `<worker-url>` и `<WEBHOOK_SECRET>`:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker-url>/tg-webhook&secret_token=<WEBHOOK_SECRET>"
```

Ответ `{"ok":true,...}` — вебхук установлен.

## 8. Привязать мини-аппку в BotFather

1. [@BotFather](https://t.me/BotFather) → `/newapp` (или кнопка Menu Button).
2. Выберите бота, задайте название/иконку.
3. В поле URL укажите: `https://venchakov.com/app/`.

## 9. Прописать домен воркера во фронтенде

В файлах `app/app.js` и в CSP внутри `app/index.html` замените плейсхолдер
`YOUR-WORKER-SUBDOMAIN.workers.dev` на реальный домен воркера из шага 6.

## 10. Проверка end-to-end

1. Напишите боту два сообщения-строки:
   ```
   https://youtu.be/dQw4w9WgXcQ
   https://example.com/materials
   Короткое описание (необязательно)
   ```
2. Бот ответит `Добавлено ✅: <название>`.
3. Откройте мини-аппку через бота — новая карточка должна быть первой в ленте.

---

### Формат сообщения владельца

- строка 1 — ссылка на ролик (YouTube или любая другая);
- строка 2 — ссылка на материалы;
- строки 3+ — описание (необязательно).

Если ссылок меньше двух — бот пришлёт подсказку по формату.
Название YouTube-ролика подтягивается автоматически; для не-YouTube ссылок
название берётся из первой строки описания (или «Материал»).
