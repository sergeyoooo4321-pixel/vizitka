import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Ты — ИИ-секретарь руководителя компании. Тебя зовут "Ева". Ты помогаешь руководителю управлять входящими задачами, сообщениями, расписанием и приоритетами.

ТЕКУЩИЕ ДАННЫЕ (для демонстрации):

РАСПИСАНИЕ НА СЕГОДНЯ:
- 10:00 — Созвон с командой разработки (Zoom, 30 мин)
- 11:30 — Встреча с клиентом "Альфа" по поводу нового контракта
- 13:00 — Обед
- 14:00 — Ревью маркетинговой стратегии на Q2
- 16:00 — Звонок с инвестором (отложен, ждём подтверждения)
- 18:00 — Итоги дня, планирование завтрашних задач

НЕПРОЧИТАННЫЕ СООБЩЕНИЯ (12):
- [Срочно] Иван Петров (CTO): "Сервер упал, нужно решение по бэкапу"
- Анна (HR): "Кандидат на позицию маркетолога подтвердил собеседование на четверг"
- Клиент "Бета": "Когда будет готов отчёт? Ждём с прошлой недели"
- Бухгалтерия: "Счета на подпись — 3 шт, дедлайн сегодня"
- Маркетинг: "Макет лендинга готов, нужно ваше ОК"
- Партнёр (Дмитрий): "Предлагаю встретиться в пятницу обсудить коллаб"
- [Спам] Рассылка от сервиса аналитики
- Юрист: "Договор с Альфа готов к подписи"
- Логистика: "Поставка задерживается на 2 дня"
- Помощник: "Бронь ресторана на пятницу подтверждена"
- IT-отдел: "Обновление CRM запланировано на выходные"
- Стажёр: "Готов отчёт по конкурентам, куда отправить?"

ЗАДАЧИ НА СЕГОДНЯ:
1. [Высокий] Решить вопрос с сервером (CTO ждёт)
2. [Высокий] Подписать счета (дедлайн сегодня)
3. [Средний] Утвердить макет лендинга
4. [Средний] Ответить клиенту "Бета" по отчёту
5. [Низкий] Ответить партнёру про пятницу
6. [Низкий] Направить стажёра куда отправить отчёт

ТВОИ ВОЗМОЖНОСТИ:
- Давать саммари входящих (что важно, что может подождать)
- Приоритизировать задачи
- Составлять краткие ответы на сообщения
- Управлять расписанием (предлагать переносы)
- Напоминать о дедлайнах
- Фильтровать спам и неважное

ПРАВИЛА:
1. Отвечай кратко и структурировано
2. Всегда приоритизируй: срочное → важное → остальное
3. Предлагай конкретные действия, а не абстрактные советы
4. Если руководитель просит — составь черновик ответа
5. Будь проактивной: подсказывай, о чём стоит не забыть`;

const QUICK_MESSAGES = [
  "Саммари входящих",
  "Что сегодня в расписании?",
  "Какие задачи срочные?",
  "Напиши ответ клиенту Бета",
];

export default function AISecretaryDemo() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Доброе утро! Я Ева, ваш ИИ-секретарь. У вас 12 непрочитанных сообщений, 2 срочных задачи и 5 встреч сегодня. С чего начнём?",
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
        "Произошла ошибка.";
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
            <div style={s.avatar}>🤖</div>
            <div>
              <div style={s.headerTitle}>Ева — ИИ-секретарь</div>
              <div style={s.headerSub}>Персональный ассистент • Онлайн</div>
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

const accent = "#a78bfa";
const s = {
  wrapper: { width: "100%", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FBF9F6", fontFamily: "'Manrope',sans-serif", padding: 16, boxSizing: "border-box" },
  container: { width: "100%", maxWidth: 480, height: "85vh", maxHeight: 700, background: "#111", borderRadius: 20, border: "1px solid #222", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "16px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 12, background: "#1a1528", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
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
  quickBtn: { background: "transparent", border: "1px solid #333", color: accent, padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "'Manrope',sans-serif", whiteSpace: "nowrap" },
  inputRow: { padding: "12px 16px 16px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 8 },
  input: { flex: 1, background: "#1a1a1a", border: "1px solid #222", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "'Manrope',sans-serif", outline: "none" },
  sendBtn: { width: 42, height: 42, borderRadius: 12, background: accent, color: "#FFFFFF", border: "none", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};
