/* chat_widget.js
   Клієнтська логіка для чат-бота.
   Використовує POST /chat/assistant
*/

(() => {
  // --- Конфіг ---
  const ENDPOINT = "/chat/assistant"; // роут бекенду (чи /api/chat/assistant залежно від роутера)
  const THROTTLE_MS = 1200; // мінімальний інтервал між відправками
  const TAG_REQUEST_PREFIX = "TAGS: дай короткі коми-розділені теги для цього тексту:";

  // --- Елементи ---
  const chatWindow = document.getElementById("chatWindow");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const suggestions = document.getElementById("aiSuggestions");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const themeToggle = document.getElementById("themeToggle");
  const aiStatus = document.getElementById("aiStatus");
  const cacheInfo = document.getElementById("cacheInfo");
  const minimizeBtn = document.getElementById("minimizeChat");

  if (!chatWindow || !input || !sendBtn) {
    console.warn("Chat: елементи не знайдені — переконайся, що HTML вставлено.");
    return;
  }

  // --- Local cache: localStorage (simple) ---
  const CACHE_KEY = "topspots_chat_cache_v1";
  let localCache = {};
  try {
    localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch (e) { localCache = {}; }

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(localCache)); } catch {}
  }

  // --- Throttle (simple) ---
  let lastSentTs = 0;
  function canSend() {
    return Date.now() - lastSentTs > THROTTLE_MS;
  }

  // --- UI helpers ---
  function appendMessageNode(text, cls = "bot-msg", meta = {}) {
    const node = document.createElement("div");
    node.className = `msg ${cls}`;
    if (meta.html) node.innerHTML = meta.html;
    else node.textContent = text;
    if (cls === "bot-msg") node.setAttribute("aria-label", "Відповідь бота");
    if (cls === "user-msg") node.setAttribute("aria-label", "Ваше повідомлення");
    chatWindow.appendChild(node);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return node;
  }

  function showTypingBubble() {
    const typ = appendMessageNode("Пишу відповідь…", "bot-msg typing");
    return typ;
  }

  function setStatus(text, color) {
    if (!aiStatus) return;
    aiStatus.textContent = text;
    aiStatus.style.color = color || "";
  }

  // --- send to backend ---
  async function postMessageToServer(message) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=>"");
        throw new Error(`Server ${res.status} ${txt}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Chat request error:", err);
      throw err;
    }
  }

  // --- handle send ---
  async function handleSend() {
    const message = input.value.trim();
    if (!message) return;
    if (!canSend()) {
      // швидкий захист від спаму
      setStatus("Занадто швидко — почекай", "orange");
      setTimeout(()=>setStatus("Онлайн", ""), 1200);
      return;
    }
    lastSentTs = Date.now();

    // UI
    appendMessageNode(message, "user-msg");
    input.value = "";
    setStatus("Пишу…", "lightgreen");

    // Cache lookup (local)
    if (localCache[message]) {
      console.log("Local cache HIT");
      const reply = localCache[message];
      appendMessageNode(reply, "bot-msg");
      setStatus("Онлайн", "");
      return;
    }

    // typing bubble
    const typing = showTypingBubble();

    try {
      const { reply } = await postMessageToServer(message);
      typing.remove();
      appendMessageNode(reply, "bot-msg");
      // save to local cache
      localCache[message] = reply;
      saveCache();
      setStatus("Онлайн", "");
      // авто-теги: додатковий запит (делегуємо бекенду /openai — коштує токенів)
    } catch (err) {
      typing.remove();
      appendMessageNode("Сталася помилка. Спробуйте пізніше.", "bot-msg");
      setStatus("Помилка", "red");
    }
  }



  function showTags(csv) {
    const wrap = document.createElement("div");
    wrap.className = "msg bot-msg";
    wrap.style.flexDirection = "column";
    wrap.innerHTML = `<strong>Теги:</strong> <span style="opacity:.92; margin-top:6px">${csv}</span>`;
    chatWindow.appendChild(wrap);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // --- suggestions click ---
  if (suggestions) {
    suggestions.addEventListener("click", (e) => {
      if (e.target.classList.contains("suggestion")) {
        input.value = e.target.textContent;
        input.focus();
        // auto send
        handleSend();
      }
    });
  }

  // === buttons ===
  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  clearChatBtn?.addEventListener("click", () => {
    localCache = {};
    saveCache();
    chatWindow.innerHTML = "";
    setStatus("Кеш очищено", "orange");
    setTimeout(()=>setStatus("Онлайн",""), 1000);
  });

  // theme toggle
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    themeToggle.textContent = document.body.classList.contains("light-theme") ? "🌞" : "🌙";
  });

  minimizeBtn?.addEventListener("click", () => {
    const body = document.getElementById("aiBody");
    if (!body) return;
    if (body.style.display === "none") { body.style.display = ""; minimizeBtn.textContent = "—"; }
    else { body.style.display = "none"; minimizeBtn.textContent = "+"; }
  });

  // show cache info
  cacheInfo && (cacheInfo.textContent = `локальний кеш: ${Object.keys(localCache).length} записів`);

  // friendly welcome
  appendMessageNode("Привіт! Я AI-помічник Top-Spots..", "bot-msg");
})();
