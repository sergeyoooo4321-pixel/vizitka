import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Ты — ИИ-администратор салона красоты "Luxe Beauty". Твоя задача: консультировать клиентов, помогать с выбором услуг и записывать на приём.

ИНФОРМАЦИЯ О САЛОНЕ:
- Название: Luxe Beauty
- Адрес: ул. Тверская, 15, Москва
- Режим работы: Пн-Сб 9:00–21:00, Вс 10:00–18:00
- Телефон: +7 (999) 123-45-67

УСЛУГИ И ЦЕНЫ:
- Стрижка женская — от 2500₽ (60 мин)
- Стрижка мужская — от 1500₽ (30 мин)
- Окрашивание — от 5000₽ (120 мин)
- Маникюр классический — 1800₽ (60 мин)
- Маникюр с покрытием гель-лак — 2500₽ (90 мин)
- Педикюр — 2200₽ (60 мин)
- Укладка — от 2000₽ (45 мин)
- Брови (коррекция + окрашивание) — 1500₽ (30 мин)
- Ресницы (наращивание) — от 3500₽ (120 мин)
- Уход за лицом (чистка) — от 4000₽ (90 мин)

МАСТЕРА:
- Анна — стрижки, окрашивание, укладки
- Мария — маникюр, педикюр
- Елена — брови, ресницы
- Ольга — уход за лицом

СВОБОДНЫЕ СЛОТЫ (ближайшие):
- Сегодня: 14:00, 16:30, 18:00
- Завтра: 10:00, 11:30, 13:00, 15:00, 17:00
- Послезавтра: 9:00, 12:00, 14:30, 16:00

ПРАВИЛА ПОВЕДЕНИЯ:
1. Будь вежливой, дружелюбной и профессиональной
2. Всегда предлагай конкретные слоты для записи
3. Уточняй имя клиента и телефон для записи
4. Если клиент сомневается — мягко помогай с выбором
5. Отвечай коротко и по делу, не больше 2-3 предложений
6. Используй эмодзи умеренно
7. Если спрашивают то, чего ты не знаешь — скажи, что уточнишь у администратора и перезвонишь`;

const QUICK_MESSAGES = [
  "Какие услуги есть?",
  "Хочу записаться на стрижку",
  "Свободное время на завтра?",
  "Сколько стоит маникюр?",
];

export default function AIAdminDemo() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Добро пожаловать в Luxe Beauty! ✨ Я ваш ИИ-администратор. Помогу выбрать услугу, подскажу цены и запишу на удобное время. Чем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

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
        data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "Извините, произошла ошибка. Попробуйте ещё раз.";

      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Связь прервалась. Попробуйте обновить страницу." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>💆‍♀️</div>
            <div>
              <div style={styles.headerTitle}>Luxe Beauty</div>
              <div style={styles.headerSub}>ИИ-администратор • Онлайн</div>
            </div>
          </div>
          <div style={styles.badge}>DEMO</div>
        </div>

        {/* Chat */}
        <div style={styles.chat} ref={chatRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.msgRow,
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.aiBubble),
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={styles.msgRow}>
              <div style={{ ...styles.bubble, ...styles.aiBubble }}>
                <span style={styles.dots}>
                  <span style={styles.dot}>●</span>
                  <span style={{ ...styles.dot, animationDelay: "0.2s" }}>●</span>
                  <span style={{ ...styles.dot, animationDelay: "0.4s" }}>●</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick */}
        {messages.length <= 2 && (
          <div style={styles.quickRow}>
            {QUICK_MESSAGES.map((q, i) => (
              <button key={i} style={styles.quickBtn} onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Напишите сообщение..."
            disabled={loading}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: input.trim() && !loading ? 1 : 0.4,
            }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Manrope:wght@400;500;600;700&display=swap');
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#FBF9F6",
    fontFamily: "'Manrope', sans-serif",
    padding: "16px",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: 480,
    height: "85vh",
    maxHeight: 700,
    background: "#111111",
    borderRadius: 20,
    border: "1px solid #222",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #1a1a1a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  headerTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  headerSub: { fontSize: 12, color: "#666", marginTop: 2 },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#FFFFFF",
    background: "#c8ff00",
    padding: "4px 10px",
    borderRadius: 20,
    letterSpacing: 1,
    fontFamily: "'JetBrains Mono', monospace",
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msgRow: { display: "flex" },
  bubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  aiBubble: {
    background: "#1a1a1a",
    color: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    background: "#c8ff00",
    color: "#FFFFFF",
    borderBottomRightRadius: 4,
    fontWeight: 500,
  },
  dots: { display: "flex", gap: 4 },
  dot: {
    animation: "blink 1s infinite",
    color: "#555",
    fontSize: 10,
  },
  quickRow: {
    padding: "8px 16px 4px",
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  quickBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#c8ff00",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  inputRow: {
    padding: "12px 16px 16px",
    borderTop: "1px solid #1a1a1a",
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    outline: "none",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#c8ff00",
    color: "#FFFFFF",
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
  },
};
