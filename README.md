# venchakov.com — сайт-визитка Сергея Венчакова

Личный сайт исполнителя: разработка ИИ-агентов, Telegram/WhatsApp-ботов и автоматизация бизнеса под ключ.

## Что это и как устроено

Чистая статика без сборки и фреймворков: HTML + CSS + немного JS (анимации, меню, слайдер). Хостится на GitHub Pages, домен `venchakov.com` (файл `CNAME`). Деплой = пуш в ветку `main`.

### Структура

| Блок | Файлы |
|---|---|
| Главная | `index.html` |
| Услуги | `services.html` + 6 страниц `service-*.html` |
| Кейсы и отзывы | `reviews.html`, `case-*.html`, `project-openclaw.html` |
| Блог | `blog.html` (индекс) + 30 статей в `blog/`, стили `blog.css` |
| Контакты | `contacts.html` |
| Стили/скрипты | `style.css` (дизайн-токены в `:root`), `script.js` |
| SEO / ИИ-агенты | `sitemap.xml`, `robots.txt`, `feed.xml` (RSS блога), `llms.txt` |
| Чат-виджет (бэкенд) | `cloudflare-worker/` — прокси к Ollama Cloud (виджет к страницам пока не подключён) |

### SEO и машиночитаемость

- На каждой странице: title/description, canonical, Open Graph, Twitter Card, JSON-LD (Person, ProfessionalService, Service+offers, BlogPosting, Review, BreadcrumbList, FAQPage).
- `llms.txt` — выжимка о сайте для ИИ-агентов; `feed.xml` — RSS блога.
- Подключены Яндекс.Метрика и Яндекс.Вебмастер (сайт подтверждён, sitemap отправлен).

### Правила правок

1. Меняешь `style.css` — подними версию cache-bust `?v=...` в `<link rel="stylesheet">` на всех страницах.
2. Новая страница обязана повторять единый `<head>`: CSP-строку, код Метрики, canonical, JSON-LD.
3. Новая статья блога: файл `blog/{slug}.html` по образцу существующих + карточка в `blog.html` + записи в `sitemap.xml` и `feed.xml`.
