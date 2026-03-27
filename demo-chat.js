/**
 * Общий движок чата для демо-страниц.
 * Конфигурация задаётся через window.DEMO_CONFIG перед подключением скрипта.
 *
 * window.DEMO_CONFIG = {
 *   systemPrompt: '...',
 *   greeting: '...',
 *   quickMessages: ['...', '...']
 * }
 */

(function () {
  'use strict';

  const API_URL = 'https://venchakov-api-proxy.venchakov.workers.dev/chat';
  const MODEL = 'gemma3:4b';

  const config = window.DEMO_CONFIG;
  if (!config) {
    console.error('DEMO_CONFIG не задан');
    return;
  }

  const messages = [];
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const quickRow = document.getElementById('quickRow');
  let loading = false;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function addBubble(role, text) {
    const row = document.createElement('div');
    row.className = 'msg-row' + (role === 'user' ? ' user' : '');
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    bubble.textContent = text;
    row.appendChild(bubble);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'msg-row';
    row.id = 'typing';
    row.innerHTML = '<div class="bubble ai typing"><span class="dot">&#9679;</span><span class="dot">&#9679;</span><span class="dot">&#9679;</span></div>';
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typing');
    if (el) el.remove();
  }

  function updateSendBtn() {
    sendBtn.disabled = !input.value.trim() || loading;
  }

  // Приветствие
  addBubble('ai', config.greeting);
  messages.push({ role: 'assistant', content: config.greeting });

  // Быстрые кнопки
  if (quickRow && config.quickMessages) {
    config.quickMessages.forEach(function (text) {
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.textContent = text;
      btn.addEventListener('click', function () { send(text); });
      quickRow.appendChild(btn);
    });
  }

  async function send(text) {
    if (!text || !text.trim() || loading) return;
    text = text.trim();

    // Ограничение длины сообщения (клиентская валидация)
    if (text.length > 1500) {
      addBubble('ai', 'Сообщение слишком длинное. Попробуйте короче.');
      return;
    }

    loading = true;
    sendBtn.disabled = true;
    input.disabled = true;
    if (quickRow) quickRow.style.display = 'none';

    addBubble('user', text);
    messages.push({ role: 'user', content: text });
    input.value = '';
    showTyping();

    try {
      const apiMessages = [
        { role: 'system', content: config.systemPrompt },
        ...messages.map(function (m) { return { role: m.role, content: m.content }; })
      ];

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: apiMessages, stream: false })
      });

      if (res.status === 429) {
        hideTyping();
        addBubble('ai', 'Слишком много запросов. Подождите минуту и попробуйте снова.');
        return;
      }

      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }

      const data = await res.json();
      var reply = data.message?.content || 'Произошла ошибка.';
      hideTyping();
      addBubble('ai', reply);
      messages.push({ role: 'assistant', content: reply });
    } catch (e) {
      hideTyping();
      addBubble('ai', 'Связь прервалась. Попробуйте обновить страницу.');
    } finally {
      loading = false;
      input.disabled = false;
      input.focus();
      updateSendBtn();
    }
  }

  // Глобальная функция для обратной совместимости
  window.send = send;

  input.addEventListener('input', updateSendBtn);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') send(input.value);
  });
  sendBtn.addEventListener('click', function () { send(input.value); });
})();
