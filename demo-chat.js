/**
 * Скриптовый движок чата для демо-страниц.
 * Конфигурация задаётся через window.DEMO_CONFIG перед подключением скрипта.
 *
 * window.DEMO_CONFIG = {
 *   greeting: '...',
 *   quickMessages: ['...'],
 *   responses: { 'вопрос': 'ответ', ... },
 *   fallback: '...'
 * }
 */

(function () {
  'use strict';

  var TG_LINK = 'https://t.me/cvvjesuss';
  var config = window.DEMO_CONFIG;
  if (!config) return;

  var chat = document.getElementById('chat');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('sendBtn');
  var quickRow = document.getElementById('quickRow');
  var loading = false;

  var FALLBACKS = [
    'Это демо-версия с ограниченным набором сценариев. В полной версии я обрабатываю любые запросы. Чтобы подключить — напишите: ' + TG_LINK,
    'В демо доступны только основные сценарии. Попробуйте нажать одну из кнопок выше или напишите мне в Telegram для полной версии: ' + TG_LINK,
    'Хороший вопрос! Но в демо я могу показать только базовые возможности. Полная версия работает без ограничений — подключить: ' + TG_LINK
  ];
  var fallbackIndex = 0;
  var userMessageCount = 0;
  var ctaShown = false;

  function getNextFallback() {
    var msg = FALLBACKS[fallbackIndex % FALLBACKS.length];
    fallbackIndex++;
    return msg;
  }

  function addCtaBanner() {
    if (ctaShown) return;
    ctaShown = true;
    var banner = document.createElement('div');
    banner.className = 'demo-cta-banner';
    banner.style.cssText = 'background:rgba(205,255,0,0.08);border:1px solid rgba(205,255,0,0.2);border-radius:12px;padding:14px 18px;text-align:center;font-size:13px;color:#999;margin:12px 0';
    banner.innerHTML = 'Понравилось? В полной версии я работаю без ограничений.' +
      '<a href="' + TG_LINK + '" target="_blank" style="color:#CDFF00;text-decoration:none;font-weight:600;display:block;margin-top:6px">Подключить →</a>';
    chat.appendChild(banner);
    chat.scrollTop = chat.scrollHeight;
  }

  function addBubble(role, text) {
    var row = document.createElement('div');
    row.className = 'msg-row' + (role === 'user' ? ' user' : '');
    var bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    if (role === 'ai' && text.indexOf(TG_LINK) !== -1) {
      bubble.innerHTML = text.replace(TG_LINK, '<a href="' + TG_LINK + '" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">' + TG_LINK + '</a>');
    } else {
      bubble.textContent = text;
    }
    row.appendChild(bubble);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function showTyping() {
    var row = document.createElement('div');
    row.className = 'msg-row';
    row.id = 'typing';
    row.innerHTML = '<div class="bubble ai typing"><span class="dot">&#9679;</span><span class="dot">&#9679;</span><span class="dot">&#9679;</span></div>';
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('typing');
    if (el) el.remove();
  }

  function updateSendBtn() {
    sendBtn.disabled = !input.value.trim() || loading;
  }

  function findResponse(text) {
    var lower = text.toLowerCase().trim();
    // Точное совпадение
    for (var key in config.responses) {
      if (lower === key.toLowerCase()) return config.responses[key];
    }
    // Частичное совпадение
    for (var key2 in config.responses) {
      var words = key2.toLowerCase().split(' ');
      var matched = 0;
      for (var i = 0; i < words.length; i++) {
        if (lower.indexOf(words[i]) !== -1) matched++;
      }
      if (matched >= Math.ceil(words.length * 0.6)) return config.responses[key2];
    }
    return null;
  }

  // Приветствие
  addBubble('ai', config.greeting);

  // Подсказка после приветствия
  setTimeout(function () {
    addBubble('ai', 'Попробуйте нажать на одну из кнопок ниже или задайте свой вопрос \uD83D\uDC47');
  }, 1500);

  // Быстрые кнопки
  if (quickRow && config.quickMessages) {
    config.quickMessages.forEach(function (text) {
      var btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.textContent = text;
      btn.addEventListener('click', function () { send(text); });
      quickRow.appendChild(btn);
    });
  }

  function send(text) {
    if (!text || !text.trim() || loading) return;
    text = text.trim();
    loading = true;
    sendBtn.disabled = true;
    input.disabled = true;
    if (quickRow) quickRow.style.display = 'none';

    addBubble('user', text);
    userMessageCount++;
    input.value = '';
    showTyping();

    var delay = 600 + Math.random() * 800;
    setTimeout(function () {
      hideTyping();
      var reply = findResponse(text) || getNextFallback();
      addBubble('ai', reply);
      if (userMessageCount >= 3) addCtaBanner();
      loading = false;
      input.disabled = false;
      input.focus();
      updateSendBtn();
    }, delay);
  }

  window.send = send;

  input.addEventListener('input', updateSendBtn);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') send(input.value);
  });
  sendBtn.addEventListener('click', function () { send(input.value); });
})();
