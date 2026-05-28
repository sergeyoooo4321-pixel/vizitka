import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Ты — ИИ-менеджер по продажам компании "TechFlow Solutions", которая продаёт CRM-системы для малого и среднего бизнеса. Твоя задача: квалифицировать лида, выявить потребность, ответить на возражения и довести до заявки.

ПРОДУКТ:
- TechFlow CRM — облачная CRM-система
- Тариф "Старт" — 1 990₽/мес (до 3 пользователей, базовый функционал)
- Тариф "Бизнес" — 4 990₽/мес (до 10 пользователей, аналитика, интеграции)
- Тариф "Про" — 9 990₽/мес (безлимит пользователей, API, выделенный менеджер)
- Бесплатный пробный период — 14 дней
- Интеграции: Telegram, WhatsApp, 1С, Битрикс, email, телефония

КЛЮЧЕВЫЕ ПРЕИМУЩЕСТВА:
- Внедрение за 1 день (не нужен программист)
- Все заявки в одном окне (соцсети, мессенджеры, почта)
- Автоматические воронки и напоминания
- Аналитика: конверсия, средний чек, LTV
- 24/7 поддержка

СКРИПТ ПРОДАЖИ:
1. Поприветствуй, уточни откуда узнал
2. Спроси: какой бизнес, сколько сотрудников, как сейчас ведут клиентов
3. Найди боль (теряют заявки, нет аналитики, хаос в Excel)
4. Предложи подходящий тариф
5. Обработай возражения (дорого → посчитай экономию, сложно → внедрение за 1 день, подумаю → предложи бесплатный тест)
6. Закрой на действие: бесплатный тест или созвон с менеджером

ПРАВИЛА:
1. Отвечай коротко, 2-3 предложения максимум
2. Задавай по одному вопросу за раз
3. Не дави — помогай принять решение
4. Если клиент не готов — предложи бесплатный тест без обязательств
5. Будь уверенным, но дружелюбным`;

const QUICK_MESSAGES = [
  "Расскажите о CRM",
  "Сколько стоит?",
  "У нас 5 менеджеров, что подойдёт?",
  "Есть бесплатный тест?",
];

export default function AISalesDemo() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Привет! 👋 Я менеджер TechFlow CRM. Помогу подобрать решение под ваш бизнес. Расскажите, чем занимаетесь и как сейчас ведёте клиентскую базу?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const assistantText =
        data.content?.filter((b) => b.type === "text").map((b) => b.text).join("\n") ||
        "Произошла ошибка. Попробуйте ещё раз.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Связь прервалась. Обновите страницу." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.avatar}>🚀</div>
            <div>
              <div style={s.headerTitle}>TechFlow Sales</div>
              <div style={s.headerSub}>ИИ-отдел продаж • Онлайн</div>
            </div>
          </div>
          <div style={s.badge}>DEMO</div>
        </div>

        <div style={s.chat} ref={chatRef}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...s.msgRow, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ ...s.bubble, ...(msg.role === "user" ? s.userBubble : s.aiBubble) }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={s.msgRow}>
              <div style={{ ...s.bubble, ...s.aiBubble }}>
                <span style={s.dots}>
                  <span style={s.dot}>●</span>
                  <span style={{ ...s.dot, animationDelay: "0.2s" }}>●</span>
                  <span style={{ ...s.dot, animationDelay: "0.4s" }}>●</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 2 && (
          <div style={s.quickRow}>
            {QUICK_MESSAGES.map((q, i) => (
              <button key={i} style={s.quickBtn} onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>
        )}

        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Напишите сообщение..."
            disabled={loading}
          />
          <button
            style={{ ...s.sendBtn, opacity: input.trim() && !loading ? 1 : 0.4 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >↑</button>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Manrope:wght@400;500;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

const accent = "#00d4ff";
const s = {
  wrapper: { width: "100%", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FBF9F6", fontFamily: "'Manrope',sans-serif", padding: 16, boxSizing: "border-box" },
  container: { width: "100%", maxWidth: 480, height: "85vh", maxHeight: 700, background: "#111", borderRadius: 20, border: "1px solid #222", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "16px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 12, background: "#0d2a33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  headerTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  headerSub: { fontSize: 12, color: "#666", marginTop: 2 },
  badge: { fontSize: 10, fontWeight: 700, color: "#FFFFFF", background: accent, padding: "4px 10px", borderRadius: 20, letterSpacing: 1, fontFamily: "'JetBrains Mono',monospace" },
  chat: { flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 8 },
  msgRow: { display: "flex" },
  bubble: { maxWidth: "80%", padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  aiBubble: { background: "#1a1a1a", color: "#e0e0e0", borderBottomLeftRadius: 4 },
  userBubble: { background: accent, color: "#FFFFFF", borderBottomRightRadius: 4, fontWeight: 500 },
  dots: { display: "flex", gap: 4 },
  dot: { animation: "blink 1s infinite", color: "#555", fontSize: 10 },
  quickRow: { padding: "8px 16px 4px", display: "flex", flexWrap: "wrap", gap: 6 },
  quickBtn: { background: "transparent", border: `1px solid #333`, color: accent, padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "'Manrope',sans-serif", whiteSpace: "nowrap" },
  inputRow: { padding: "12px 16px 16px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 8 },
  input: { flex: 1, background: "#1a1a1a", border: "1px solid #222", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "'Manrope',sans-serif", outline: "none" },
  sendBtn: { width: 42, height: 42, borderRadius: 12, background: accent, color: "#FFFFFF", border: "none", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};
