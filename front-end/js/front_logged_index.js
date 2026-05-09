import { mainPageFunctionsHandler, profileFunctionsHandler } from "./functions.js";
const mainPageFunctions = new mainPageFunctionsHandler();
const profileFn = new profileFunctionsHandler();

// ============================================================
// LANGUAGE / THEME
// ============================================================
function getSavedLocale() { return localStorage.getItem('topspots_locale') || 'en'; }
function setSavedLocale(l) { localStorage.setItem('topspots_locale', l); applyNavLanguage(l); }

const NAV_MAP = {
    en: { dashboard:'Dashboard', nearby:'Nearby', shopping:'Shopping', settings:'Settings', profile:'Profile', logout:'Sign out' },
    uk: { dashboard:'Dashboard', nearby:'Nearby', shopping:'Shopping', settings:'Settings', profile:'Profile', logout:'Sign out' },
    de: { dashboard:'Dashboard', nearby:'Nearby', shopping:'Shopping', settings:'Settings', profile:'Profile', logout:'Sign out' },
    pl: { dashboard:'Dashboard', nearby:'Nearby', shopping:'Shopping', settings:'Settings', profile:'Profile', logout:'Sign out' }
};

function applyNavLanguage(locale) {
    const d = NAV_MAP[locale] || NAV_MAP.en;
    document.querySelectorAll('[data-page]').forEach(btn => {
        const k = btn.getAttribute('data-page');
        if (!d[k]) return;
        const ic = btn.querySelector('i');
        btn.innerHTML = ic ? ic.outerHTML + ' ' + d[k] : d[k];
    });
    const sel = document.getElementById('loggedLanguageSelect');
    if (sel) sel.value = locale;
}

function applyLoggedTheme(theme) {
    const light = theme === 'light';
    document.body.classList.toggle('light-theme', light);
    const btn = document.getElementById('loggedThemeToggle');
    if (btn) btn.innerHTML = light ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('topspots_theme_logged', theme);
}

function initLoggedControls() {
    const sel = document.getElementById('loggedLanguageSelect');
    if (sel) sel.addEventListener('change', () => setSavedLocale(sel.value));
    document.getElementById('loggedThemeToggle')?.addEventListener('click', () => {
        applyLoggedTheme(document.body.classList.contains('light-theme') ? 'dark' : 'light');
    });
    applyNavLanguage(getSavedLocale());
    applyLoggedTheme(localStorage.getItem('topspots_theme_logged') || 'dark');
}

// ============================================================
// STORAGE / SECURITY
// ============================================================
const ALLOWED_KEYS = ['shopping_city','shopping_type','topspots_avatar','topspots_session','topspots_token','topspots_user'];

function sanitize(v) { return typeof v === 'string' ? v.replace(/[<>"'`;\/]/g, '') : ''; }
function safeSet(type, key, value) {
    if (!ALLOWED_KEYS.includes(key)) return;
    try { (type==='session'?sessionStorage:localStorage).setItem(key, sanitize(String(value))); } catch(_){}
}
function safeGet(type, key) {
    if (!ALLOWED_KEYS.includes(key)) return null;
    try { return sanitize((type==='session'?sessionStorage:localStorage).getItem(key)||''); } catch(_){ return null; }
}
function safeRemove(type, key) { try { (type==='session'?sessionStorage:localStorage).removeItem(key); } catch(_){} }

// ============================================================
// RATE LIMIT
// ============================================================
const RL = { windowStart: Date.now(), count: 0, blockedUntil: 0 };
const MAX_RPM = 30, WINDOW = 60000;

function checkRateLimit(action) {
    const now = Date.now();
    if (now < RL.blockedUntil) { showToast('Too many requests — please wait.','warning'); return false; }
    if (now - RL.windowStart > WINDOW) { RL.windowStart = now; RL.count = 0; }
    RL.count++;
    if (RL.count > MAX_RPM) { RL.blockedUntil = now + WINDOW; showToast('Rate limit reached. Try again in 60s.','warning'); return false; }
    return true;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type='info') {
    let t = document.querySelector('.shop-toast');
    if (!t) { t = document.createElement('div'); t.className='shop-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = `shop-toast ${type}`;
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ============================================================
// IMAGE FALLBACK
// ============================================================
const NO_PHOTO = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<rect width="100%" height="100%" fill="#0e1425"/>' +
    '<text x="50%" y="50%" text-anchor="middle" fill="#c9a84c" ' +
    'font-family="sans-serif" font-size="60" opacity="0.25">🏪</text></svg>'
)}`;

function attachImageFallbacks(root) {
    if (!root) return;
    root.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => {
            if (img.dataset.fb) return;
            img.dataset.fb = '1';
            img.src = NO_PHOTO;
        });
    });
}

const modernPlaceholder = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" style="stop-color:#090d18"/>' +
    '<stop offset="100%" style="stop-color:#0e1425"/>' +
    '</linearGradient></defs>' +
    '<rect width="800" height="600" fill="url(#g)"/>' +
    '<text x="50%" y="50%" text-anchor="middle" fill="#c9a84c" font-family="sans-serif" font-size="80" opacity="0.3">📍</text>' +
    '</svg>'
)}`;

function cardLoaderHTML() {
    return `<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.05));display:flex;align-items:center;justify-content:center;border-radius:12px;">
        <div style="width:40px;height:40px;border:3px solid rgba(201,168,76,.2);border-top-color:#c9a84c;border-radius:50%;animation:spin 1s linear infinite;"></div>
    </div>`;
}

// ============================================================
// BURGER MENU
// ============================================================
(function() {
    const burger  = document.getElementById('burgerBtn');
    const menu    = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (!burger || !menu) return;

    function open()  {
        burger.classList.add('active'); menu.classList.add('open');
        overlay.classList.add('visible'); document.body.style.overflow = 'hidden';
        burger.setAttribute('aria-expanded','true'); menu.setAttribute('aria-hidden','false');
    }
    function close() {
        burger.classList.remove('active'); menu.classList.remove('open');
        overlay.classList.remove('visible'); document.body.style.overflow = '';
        burger.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true');
    }

    burger.addEventListener('click', () => burger.classList.contains('active') ? close() : open());
    overlay.addEventListener('click', close);
    document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !burger.contains(e.target) && menu.classList.contains('open')) close();
    });
    document.querySelectorAll('.mobile-nav-item').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-item').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); close();
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// Header logout
document.getElementById('headerLogoutBtn')?.addEventListener('click', async function() {
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    this.disabled = true;
    await mainPageFunctions.logOut();
});






// ============================================================
// AI WIDGET — ФРОНТ (правильно получает гео и отправляет)
// ============================================================

// ── Получить координаты через Google Geolocation ──────────────
async function getUserGeo() {
    return new Promise(resolve => {
        if (!navigator.geolocation) {
            resolve({ lat: null, lon: null });
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            pos => {
                resolve({ 
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                });
            },
            err => {
                console.warn('[GEO] Error:', err.message);
                resolve({ lat: null, lon: null });
            },
            { timeout: 5000, maximumAge: 600000 }
        );
    });
}

// ── ВСЕ ОСТАЛЬНОЕ ЖИДКОМ ЯК РАНЬШЕ ──────────────────────────
const AIChatDB = (() => {
    const DB_NAME  = 'topspots_ai_v3';
    const SESSIONS = 'sessions';
    const MESSAGES = 'messages';
    let db = null;

    async function open() {
        if (db) return db;
        return new Promise((res, rej) => {
            const r = indexedDB.open(DB_NAME, 1);
            r.onupgradeneeded = e => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(SESSIONS))
                    d.createObjectStore(SESSIONS, { keyPath: 'id' });
                if (!d.objectStoreNames.contains(MESSAGES)) {
                    const m = d.createObjectStore(MESSAGES, { keyPath: 'id', autoIncrement: true });
                    m.createIndex('session_id', 'session_id');
                }
            };
            r.onsuccess = e => { db = e.target.result; res(db); };
            r.onerror   = () => rej(r.error);
        });
    }

    async function getSessions() {
        await open();
        return new Promise(res => {
            const req = db.transaction(SESSIONS, 'readonly').objectStore(SESSIONS).getAll();
            req.onsuccess = () => res((req.result || []).sort((a, b) => b.created_at - a.created_at));
            req.onerror   = () => res([]);
        });
    }
    async function createSession(title = 'New chat') {
        await open();
        const id = Date.now().toString();
        return new Promise(res => {
            const tx = db.transaction(SESSIONS, 'readwrite');
            tx.objectStore(SESSIONS).put({ id, title, created_at: Date.now() });
            tx.oncomplete = () => res(id);
            tx.onerror    = () => res(id);
        });
    }
    async function updateSessionTitle(id, title) {
        await open();
        return new Promise(res => {
            const tx  = db.transaction(SESSIONS, 'readwrite');
            const req = tx.objectStore(SESSIONS).get(id);
            req.onsuccess = () => {
                if (req.result) tx.objectStore(SESSIONS).put({ ...req.result, title });
                tx.oncomplete = () => res(true);
            };
            req.onerror = () => res(false);
        });
    }
    async function deleteSession(id) {
        await open();
        const msgs = await getMessages(id);
        return new Promise(res => {
            const tx = db.transaction([SESSIONS, MESSAGES], 'readwrite');
            tx.objectStore(SESSIONS).delete(id);
            msgs.forEach(m => tx.objectStore(MESSAGES).delete(m.id));
            tx.oncomplete = () => res(true);
            tx.onerror    = () => res(false);
        });
    }
    async function getMessages(sessionId) {
        await open();
        return new Promise(res => {
            const idx = db.transaction(MESSAGES, 'readonly')
                          .objectStore(MESSAGES).index('session_id');
            const req = idx.getAll(sessionId);
            req.onsuccess = () => res((req.result || []).sort((a, b) => a.id - b.id));
            req.onerror   = () => res([]);
        });
    }
    async function addMessage(sessionId, role, content) {
        await open();
        return new Promise(res => {
            const tx = db.transaction(MESSAGES, 'readwrite');
            tx.objectStore(MESSAGES).add({ session_id: sessionId, role, content, ts: Date.now() });
            tx.oncomplete = () => res(true);
            tx.onerror    = () => res(false);
        });
    }

    return { getSessions, createSession, updateSessionTitle, deleteSession, getMessages, addMessage };
})();

const AI_SUGGESTIONS = [
    '☕ Best coffee spots nearby',
    '🍕 Top pizza places',
    '🏨 Hotels with best reviews',
    '🍔 Burgers close to me',
    '🎭 What to see this weekend',
    '🌮 Best street food around',
    '🍣 Top sushi restaurants',
    '🏛️ Museums worth visiting',
    '🌿 Cozy spots to work from',
    '🍷 Wine bars in my area',
];

function mountAIWidget() {
    if (document.getElementById('ai-launcher')) return;

    const chipsHTML = [...AI_SUGGESTIONS, ...AI_SUGGESTIONS]
        .map(s => `<button class="hint-chip" data-text="${s}">${s}</button>`)
        .join('');

    const welcomeChipsHTML = AI_SUGGESTIONS.slice(0, 5)
        .map(s => `<button class="welcome-suggestion-btn" data-text="${s}">${s}</button>`)
        .join('');

    const root = document.createElement('div');
    root.id = 'ai-global-root';
    root.innerHTML = `
        <button id="ai-launcher" class="ai-launcher" aria-label="Open AI">
            <i class="fas fa-robot"></i>
            <span class="ai-launcher-pulse"></span>
        </button>

        <div id="ai-backdrop" class="ai-backdrop"></div>

        <div id="ai-widget-container" class="ai-widget" role="dialog" aria-modal="true">
            <aside id="aiSidebar" class="ai-sidebar">
                <div class="sidebar-header">
                    <span class="sidebar-logo">🌍 Top Spots AI</span>
                    <button id="sidebarToggle" class="sidebar-toggle" title="Toggle">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </div>
                <button id="newChatBtn" class="new-chat-btn">
                    <i class="fas fa-plus"></i><span>New chat</span>
                </button>
                <div id="sessionList" class="session-list"></div>
                <div class="sidebar-footer">
                    <div class="location-badge">
                        <i class="fas fa-map-marker-alt"></i>
                        <span id="locationText">your area</span>
                    </div>
                </div>
            </aside>

            <main class="ai-main">
                <div class="ai-header">
                    <button id="mobileSidebarBtn" class="mobile-sidebar-btn" title="Menu">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="ai-header-info">
                        <div class="ai-status-dot"></div>
                        <span id="currentChatTitle">New chat</span>
                    </div>
                    <div class="ai-controls">
                        <button id="clearChatBtn" title="Clear chat">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button id="minimizeChat" class="ai-close-btn" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div id="aiBody" class="ai-body">
                    <div id="chatWindow" class="chat-messages" style="display:none;"></div>
                    <div id="welcomeScreen" class="welcome-screen">
                        <div class="welcome-glow"></div>
                        <div class="welcome-icon">🌍</div>
                        <h2 class="welcome-title">Your Travel Concierge</h2>
                        <p class="welcome-sub">Ask me about restaurants, hotels, attractions and hidden gems around you</p>
                        <div class="welcome-suggestions">${welcomeChipsHTML}</div>
                    </div>
                </div>

                <div class="ai-footer">
                    <div class="input-hints-track">
                        <div id="hintsInner" class="input-hints-inner">${chipsHTML}</div>
                    </div>
                    <div class="input-row">
                        <div class="input-wrapper">
                            <input type="text" id="chatInput" placeholder="Ask anything..." autocomplete="off" maxlength="500">
                            <button id="sendBtn" aria-label="Send">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                        </div>
                    </div>
                    <p class="ai-disclaimer">AI can make mistakes · <span id="aiModelBadge">ready</span></p>
                </div>
            </main>
        </div>
    `;

    document.body.appendChild(root);
    initAIChat();
}

function initAIChat() {
    const launcher         = document.getElementById('ai-launcher');
    const widget           = document.getElementById('ai-widget-container');
    const backdrop         = document.getElementById('ai-backdrop');
    const chatWindow       = document.getElementById('chatWindow');
    const welcomeScreen    = document.getElementById('welcomeScreen');
    const input            = document.getElementById('chatInput');
    const sendBtn          = document.getElementById('sendBtn');
    const clearBtn         = document.getElementById('clearChatBtn');
    const newChatBtn       = document.getElementById('newChatBtn');
    const sessionList      = document.getElementById('sessionList');
    const sidebar          = document.getElementById('aiSidebar');
    const sidebarToggle    = document.getElementById('sidebarToggle');
    const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
    const modelBadge       = document.getElementById('aiModelBadge');
    const locationText     = document.getElementById('locationText');
    const currentTitle     = document.getElementById('currentChatTitle');

    if (!launcher || !widget) return;

    let isOpen        = false;
    let lastTs        = 0;
    let currentSessId = null;
    let userGeo       = null;
    let initialized   = false;

    const isMobile = () => window.innerWidth <= 768;

    // Получить гео при инициализации
    getUserGeo().then(geo => {
        userGeo = geo;
        console.log('[GEO] Got coords:', geo);
    });

    // Подсказки
    document.getElementById('hintsInner')?.querySelectorAll('.hint-chip').forEach(chip => {
        chip.onclick = () => {
            input.value = chip.dataset.text.replace(/^[^\w]+/, '').trim();
            hideWelcome();
            handleSend();
        };
    });
    welcomeScreen?.querySelectorAll('.welcome-suggestion-btn').forEach(btn => {
        btn.onclick = () => {
            input.value = btn.dataset.text.replace(/^[^\w]+/, '').trim();
            hideWelcome();
            handleSend();
        };
    });

    function showWelcome() {
        welcomeScreen.style.display = 'flex';
        chatWindow.style.display    = 'none';
    }
    function hideWelcome() {
        welcomeScreen.style.display = 'none';
        chatWindow.style.display    = 'flex';
    }

    // ── SIDEBAR TOGGLE ──
    function toggleSidebar() {
        if (isMobile()) {
            sidebar.classList.toggle('open');
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                icon.className = sidebar.classList.contains('open') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        } else {
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                icon.className = sidebar.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        }
    }

    sidebarToggle.onclick = e => {
        e.stopPropagation();
        toggleSidebar();
    };

    mobileSidebarBtn.onclick = e => {
        e.stopPropagation();
        if (!sidebar.classList.contains('open')) {
            sidebar.classList.add('open');
            const icon = sidebarToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-chevron-right';
        }
    };

    function openWidget() {
        isOpen = true;
        widget.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => input.focus(), 400);
    }

    function closeWidget() {
        isOpen = false;
        widget.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
        if (isMobile() && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }

    backdrop.onclick = () => {
        if (isMobile() && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            const icon = sidebarToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-chevron-left';
        } else {
            closeWidget();
        }
    };

    launcher.onclick = async () => {
        if (isOpen) { closeWidget(); return; }
        openWidget();
        await initOnFirstOpen();
    };

    document.getElementById('minimizeChat').onclick = e => {
        e.stopPropagation();
        closeWidget();
    };

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen) closeWidget();
    });

    async function renderSessions() {
        const sessions = await AIChatDB.getSessions();
        if (!sessions.length) {
            sessionList.innerHTML = '<div class="no-sessions">No previous chats</div>';
            return;
        }
        sessionList.innerHTML = sessions.map(s => `
            <div class="session-item ${s.id === currentSessId ? 'active' : ''}" data-id="${s.id}">
                <i class="fas fa-comment-alt session-icon"></i>
                <span class="session-title">${s.title}</span>
                <button class="session-delete" data-id="${s.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`).join('');

        sessionList.querySelectorAll('.session-item').forEach(el => {
            el.onclick = e => {
                if (e.target.closest('.session-delete')) return;
                loadSession(el.dataset.id);
                if (isMobile() && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            };
        });
        sessionList.querySelectorAll('.session-delete').forEach(btn => {
            btn.onclick = async e => {
                e.stopPropagation();
                await AIChatDB.deleteSession(btn.dataset.id);
                if (currentSessId === btn.dataset.id) await startNewChat();
                else await renderSessions();
            };
        });
    }

    async function loadSession(id) {
        currentSessId = id;
        chatWindow.innerHTML = '';
        const messages = await AIChatDB.getMessages(id);

        if (!messages.length) {
            showWelcome();
        } else {
            hideWelcome();
            messages.forEach(m => appendMsg(m.content, m.role === 'user' ? 'user-msg' : 'bot-msg', false));
            setTimeout(() => { chatWindow.scrollTop = chatWindow.scrollHeight; }, 50);
        }

        const sessions = await AIChatDB.getSessions();
        const sess = sessions.find(s => s.id === id);
        if (sess && currentTitle) currentTitle.textContent = sess.title;
        await renderSessions();
    }

    async function startNewChat() {
        const id = await AIChatDB.createSession('New chat');
        if (currentTitle) currentTitle.textContent = 'New chat';
        await loadSession(id);
    }

    newChatBtn.onclick = startNewChat;

    function addTypingBubble() {
        const node = document.createElement('div');
        node.className = 'msg bot-msg typing-bubble';
        node.id = 'typingBubble';
        node.innerHTML = `
            <div class="msg-avatar"><i class="fas fa-robot"></i></div>
            <div class="msg-bubble">
                <div class="msg-text">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>`;
        chatWindow.appendChild(node);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return node;
    }

    function appendMsg(text, cls = 'bot-msg', streaming = false) {
        const node = document.createElement('div');
        node.className = `msg ${cls}`;

        if (cls === 'bot-msg') {
            node.innerHTML = `
                <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                <div class="msg-bubble"><div class="msg-text"></div></div>`;
            const t = node.querySelector('.msg-text');
            chatWindow.appendChild(node);

            if (streaming) {
                let i = 0;
                (function typeChar() {
                    if (i >= text.length) return;
                    t.textContent += text[i++];
                    chatWindow.scrollTop = chatWindow.scrollHeight;
                    const ch    = text[i - 1];
                    const delay = /[.!?]/.test(ch) ? 58 : /[,;:]/.test(ch) ? 28 : 14;
                    setTimeout(typeChar, delay);
                })();
            } else {
                t.textContent = text;
            }
        } else {
            const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            node.innerHTML = `<div class="msg-bubble user-bubble"><div class="msg-text">${safe}</div></div>`;
            chatWindow.appendChild(node);
        }

        chatWindow.scrollTop = chatWindow.scrollHeight;
        return node;
    }

    function showError(msg) {
        const node = document.createElement('div');
        node.className = 'msg bot-msg';
        node.innerHTML = `
            <div class="msg-avatar" style="background:rgba(239,68,68,.15)">
                <i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:11px"></i>
            </div>
            <div class="msg-bubble">
                <div class="msg-text" style="color:#ef4444">${msg}</div>
            </div>`;
        chatWindow.appendChild(node);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function handleSend() {
        const msg = input.value.trim();
        if (!msg || Date.now() - lastTs < 600) return;
        lastTs = Date.now();

        if (!currentSessId) currentSessId = await AIChatDB.createSession('New chat');

        hideWelcome();
        appendMsg(msg, 'user-msg', false);
        input.value      = '';
        sendBtn.disabled = true;

        await AIChatDB.addMessage(currentSessId, 'user', msg);

        const msgs = await AIChatDB.getMessages(currentSessId);
        if (msgs.length === 1) {
            const title = msg.length > 38 ? msg.slice(0, 35) + '…' : msg;
            await AIChatDB.updateSessionTitle(currentSessId, title);
            if (currentTitle) currentTitle.textContent = title;
            await renderSessions();
        }

        const recentMsgs = msgs.slice(-10)
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');

        const bubble = addTypingBubble();
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            
            // ✅ ОТПРАВЛЯЕМ ГЕО В CONTEXT ДЛЯ БЕКЕНДА
            const response = await fetch('/chat/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: msg,
                    context: {
                        userCity: null,  // На бекенде он сам определит если нужно
                        latitude: userGeo?.lat || null,
                        longitude: userGeo?.lon || null,
                        recentMessages: recentMsgs || null,
                    }
                })
            });

            bubble.remove();

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                if      (response.status === 503) showError('⚠️ AI overloaded. Try in a moment.');
                else if (response.status === 429) showError('⏱️ Too many requests. Wait a bit.');
                else if (response.status === 401) showError('🔐 Please log in to use AI chat.');
                else showError(err.error || '😅 Something went wrong. Try again.');
                sendBtn.disabled = false;
                return;
            }

            const data = await response.json();
            appendMsg(data.reply, 'bot-msg', true);
            await AIChatDB.addMessage(currentSessId, 'assistant', data.reply);

            const MODEL_LABELS = {
                openai: '⚡ GPT-4o', groq: '🚀 Groq',
                together: '🤝 Together', huggingface: '🤗 HF'
            };
            if (modelBadge && data.model) {
                modelBadge.textContent = MODEL_LABELS[data.model] || data.model;
            }

        } catch (err) {
            bubble.remove();
            showError('🔌 Connection error. Check internet.');
        }

        sendBtn.disabled = false;
    }

    sendBtn.onclick = handleSend;
    input.onkeydown = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    clearBtn.onclick = async () => {
        if (!currentSessId || !confirm('Clear this chat?')) return;
        await AIChatDB.deleteSession(currentSessId);
        await startNewChat();
    };

    async function initOnFirstOpen() {
        if (initialized) return;
        initialized = true;
        const sessions = await AIChatDB.getSessions();
        if (sessions.length) {
            await loadSession(sessions[0].id);
        } else {
            await startNewChat();
            showWelcome();
        }
    }
}




// ============================================================
// SUGGESTIONS PORTAL
// ============================================================
function mountSuggestionsPortal() {
    if (document.getElementById('search-suggestions-portal')) return;
    const p = document.createElement('ul');
    p.id = 'search-suggestions-portal'; p.className = 'suggestions-portal';
    document.body.appendChild(p);
    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#search-suggestions-portal') && !e.target.closest('.search-section'))
            p.classList.remove('active');
    });
}
function hidePortal() { document.getElementById('search-suggestions-portal')?.classList.remove('active'); }



// ============================================================
// PAGES
// ============================================================
const pages = {

// ─── DASHBOARD ───────────────────────────────────────────────
dashboard: `
<div class="dashboard-wrapper fade-in">
    <div class="hero-section" style="background:linear-gradient(135deg,rgba(201,168,76,0.08) 0%,rgba(5,8,15,1) 50%,rgba(31,212,200,0.06) 100%);padding:80px 40px;border-radius:40px;margin-bottom:50px;position:relative;overflow:hidden;border:1px solid rgba(201,168,76,0.12);box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,#1fd4c8,transparent);opacity:.6;"></div>
        <div style="position:relative;z-index:2;">
            <h1 id="dashboardGreeting" style="font-weight:800;margin-bottom:15px;color:#f0ece4;font-size:clamp(26px,5vw,48px);font-family:'Outfit',sans-serif;">Hello! 👋</h1>
            <p style="font-size:clamp(15px,2vw,20px);opacity:0.6;color:#a8a199;">Ready to discover new places today?</p>
        </div>
        <div style="position:absolute;top:-50px;right:-50px;width:300px;height:300px;background:rgba(201,168,76,0.06);filter:blur(80px);border-radius:50%;"></div>
        <div style="position:absolute;bottom:-30px;left:10%;width:200px;height:200px;background:rgba(31,212,200,0.05);filter:blur(60px);border-radius:50%;"></div>
    </div>

  

  

    <div class="main-options-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:44px;">
    
      <div class="option-card tilt-card" data-page="shopping" style="background:rgba(255,255,255,0.025);padding:36px;border-radius:36px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;">
            <div style="background:rgba(12, 53, 51, 0.1);border:1px solid rgba(31,212,200,0.2);
            min-width:64px;height:64px;border-radius:20px;display:flex;align-items:center;
            justify-content:center;font-size:26px;color:#1fd4c8;"><i class="fas fa-shopping-bag"></i></div>
            <div><h3 style="margin:0;font-size:20px;color:#f0ece4;font-weight:800;
            font-family:'Outfit',sans-serif;">Shopping</h3><p style="margin:5px 0 0;font-size:13px;
            color:#6b6560;">Places around you</p></div>
        </div>
        <div class="option-card tilt-card" data-page="profile" style="background:rgba(255,255,255,0.025);padding:36px;border-radius:36px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;">
            <div style="background:rgba(193, 47, 47, 0.12);border:1px solid rgba(198, 67, 37, 0.2);
            min-width:64px;height:64px;border-radius:20px;display:flex;align-items:center;
            justify-content:center;font-size:26px;color:#e8c97a;"><i class="fas fa-user"></i></div>
            <div><h3 style="margin:0;font-size:20px;color:#f0ece4;font-weight:800;
            font-family:'Outfit',sans-serif;">Profile</h3><p style="margin:5px 0 0;
            font-size:13px;color:#6b6560;">Account management</p></div>
        </div>
    
    




    
    <div class="option-card tilt-card" data-page="nearby" style="background:rgba(255,255,255,0.025);padding:36px;border-radius:36px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;">
            <div style="background:rgba(31,212,200,0.1);border:1px solid rgba(31,212,200,0.2);min-width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#1fd4c8;"><i class="fas fa-location-dot"></i></div>
            <div><h3 style="margin:0;font-size:20px;color:#f0ece4;font-weight:800;font-family:'Outfit',sans-serif;">Nearby</h3><p style="margin:5px 0 0;font-size:13px;color:#6b6560;">Places around you</p></div>
        </div>
        <div class="option-card tilt-card" data-page="settings" style="background:rgba(255,255,255,0.025);padding:36px;border-radius:36px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;">
            <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.2);min-width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#e8c97a;"><i class="fas fa-sliders-h"></i></div>
            <div><h3 style="margin:0;font-size:20px;color:#f0ece4;font-weight:800;font-family:'Outfit',sans-serif;">Settings</h3><p style="margin:5px 0 0;font-size:13px;color:#6b6560;">Account management</p></div>
        </div>
    </div>

    <div class="search-wrapper">
        <div class="search-bar">
            <div class="search-section">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                <input type="text" id="searchInput" placeholder="Search Menu" autocomplete="off"/>
            </div>
            <button class="search-button" id="mainSearchBtn">Search</button>
            <div class="search-categories">
                <div class="search-category-list-own">
                    <span class="search-category" data-type="restaurant">🍽️ Restaurants</span>
                    <span class="search-category" data-type="cafe">☕ Cafes</span>
                    <span class="search-category" data-type="lodging">🏨 Hotels</span>
                    <span class="search-category" data-type="museum">🏛️ Museums</span>
                    <span class="search-category" data-type="shopping_mall">🛍️ Malls</span>
                    <span class="search-category" data-type="park">🌳 Parks</span>
                </div>
            </div>
        </div>
    </div>

    <div class="scroll-container-wrapper">
        <button class="scroll-button left" id="scrollLeft" aria-label="Back">&#10094;</button>
        <div class="scroll-container" id="cityContainer"></div>
        <button class="scroll-button right" id="scrollRight" aria-label="Forward">&#10095;</button>
        <div class="progress-bar-container">
            <div class="progress-line-track"><div class="progress-line-thumb" id="scrollThumb"></div></div>
        </div>
    </div>

    <h2 style="margin:44px 0 28px;font-size:26px;font-weight:800;color:#f0ece4;font-family:'Outfit',sans-serif;letter-spacing:-.3px;">Categories</h2>
    <div class="grid-container" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:50px;">
        <div class="cat-card" data-category="restaurant" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:rgba(255,107,74,0.12);border:1px solid rgba(255,107,74,0.2);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#ff6b4a;"><i class="fas fa-utensils"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Restaurants</span>
        </div>
        <div class="cat-card" data-category="lodging" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.2);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#e8c97a;"><i class="fas fa-hotel"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Hotels</span>
        </div>
        <div class="cat-card" data-category="park" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:rgba(31,212,200,0.1);border:1px solid rgba(31,212,200,0.18);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#1fd4c8;"><i class="fas fa-tree"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Parks</span>
        </div>
        <div class="cat-card" data-category="museum" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.2);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#a78bfa;"><i class="fas fa-landmark"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Museums</span>
        </div>
        <div class="cat-card" data-category="cafe" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.18);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#c9a84c;"><i class="fas fa-mug-hot"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Cafes</span>
        </div>
        <div class="cat-card" data-category="shopping_mall" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
            <div style="background:rgba(255,107,74,0.1);border:1px solid rgba(255,107,74,0.18);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#ff6b4a;"><i class="fas fa-shopping-bag"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Stores</span>
        </div>
    </div>
</div>`,

// ─── NEARBY ──────────────────────────────────────────────────
nearby: `
<div class="dashboard-wrapper fade-in">
    <header class="settings-hero">
        <div class="hero-bg-glow"></div>
        <div class="hero-content">
            <div class="badge-premium"><i class="fas fa-satellite-dish"></i> Live Radar</div>
            <h1 class="glitch-text">Nearby Locations</h1>
            <div class="hero-separator"></div>
            <p id="nearbyStatus">Enable location access to see interesting places around you</p>
        </div>
    </header>
    <div class="nearby-container">
        <aside class="nearby-sidebar">
            <div class="filter-glass-card">
                <div class="card-head">
                    <i class="fas fa-sliders-h" style="color:#c9a84c;font-size:18px;"></i>
                    <h3>Radar Settings</h3>
                </div>
                <div class="range-group">
                    <div class="range-info"><span>Search Radius</span><b id="radiusVal">12 km</b></div>
                    <input type="range" id="nearbyRadius" min="1" max="30" value="12" class="modern-slider">
                </div>
                <div class="category-chips">
                    <button class="chip active" data-type="tourist_attraction">🏛️ Landmarks</button>
                    <button class="chip" data-type="park">🌳 Parks</button>
                    <button class="chip" data-type="shopping_mall">🛍️ Malls</button>
                    <button class="chip" data-type="museum">🏺 Museums</button>
                    <button class="chip" data-type="restaurant">🍽️ Restaurants</button>
                    <button class="chip" data-type="cafe">☕ Cafes</button>
                    <button class="chip" data-type="lodging">🏨 Hotels</button>
                    <button class="chip" data-type="supermarket">🛒 Supermarkets</button>
                    <button class="chip" data-type="pharmacy">💊 Pharmacy</button>
                    <button class="chip" data-type="gym">🏋️ Gyms</button>
                    <button class="chip" data-type="gas_station">⛽ Gas Stations</button>
                    <button class="chip" data-type="bank">🏦 Banks</button>
                </div>
                <button id="startNearbySearch" class="glow-btn">
                    <i class="fas fa-crosshairs"></i> Manual Search
                </button>
            </div>
        </aside>
        <main class="nearby-results">
            <div id="nearbyGrid" class="places-grid-v2"></div>
        </main>
    </div>
</div>`,

// ─── SHOPPING ────────────────────────────────────────────────
shopping: () => {
    const savedCity = safeGet('session','shopping_city') || '';
    const savedType = safeGet('session','shopping_type') || '';
    return `
    <div class="shop-page">
        <div class="shop-hero">
            <div class="shop-hero-glow"></div>
            <h1 class="shop-title">
                <span class="shop-title-top">TOP</span>
                <span class="shop-title-bot">STORES</span>
            </h1>
            <p class="shop-sub">Best places worldwide — ratings, photos, directions</p>
        </div>

        <div class="shop-search-block">
            <div class="shop-input-wrap">
                <i class="fas fa-city shop-input-icon"></i>
                <input id="shopCityInput" class="shop-input" type="text"
                    placeholder="City — London, Paris, New York..."
                    value="${savedCity}" autocomplete="off"/>
                <div id="shopCitySuggestions" class="shop-suggestions"></div>
            </div>
            <div class="shop-types-grid">
                ${[
                    {key:'supermarket',        icon:'fa-shopping-cart', label:'Supermarket'},
                    {key:'clothing',           icon:'fa-tshirt',        label:'Clothing'},
                    {key:'electronics',        icon:'fa-laptop',        label:'Electronics'},
                    {key:'pharmacy',           icon:'fa-pills',         label:'Pharmacy'},
                    {key:'shopping_mall',      icon:'fa-store',         label:'Mall'},
                    {key:'furniture',          icon:'fa-couch',         label:'Furniture'},
                    {key:'sport',              icon:'fa-dumbbell',      label:'Sports'},
                    {key:'building_materials', icon:'fa-hammer',        label:'Hardware'},
                    {key:'books',              icon:'fa-book',          label:'Books'},
                    {key:'market',             icon:'fa-leaf',          label:'Market'},
                ].map(t=>`
                    <button class="shop-type-btn ${savedType===t.key?'active':''}" data-type="${t.key}">
                        <i class="fas ${t.icon}"></i>
                        <span>${t.label}</span>
                    </button>`).join('')}
            </div>
            <button id="shopSearchBtn" class="shop-search-btn">
                <i class="fas fa-search"></i> Find Stores
            </button>
        </div>

        <div id="shopResultsSection" class="shop-section" style="display:none;">
            <div class="shop-section-head">
                <span class="shop-section-badge"><i class="fas fa-fire"></i> Results</span>
                <span id="shopResultsMeta" class="shop-meta"></span>
            </div>
            <div id="shopResultsGrid" class="shop-grid"></div>
        </div>

        <div id="shopLoader" class="shop-loader" style="display:none;">
            <div class="shop-spinner"></div>
            <p>Searching the best places...</p>
        </div>

        <div id="shopEmpty" class="shop-empty" style="display:none;">
            <i class="fas fa-store-slash"></i>
            <p>Nothing found. Try a different city or category.</p>
        </div>

      <div id="shopDailyTop" class="shop-daily-top" style="display:none;">
    <div class="daily-top-head">
        <div class="daily-top-title">
            <span class="daily-top-fire">🔥</span>
            <h2 class="daily-top-city">Top Stores Near You</h2>
            <span class="daily-top-badge">TOP 6</span>
        </div>
    </div>
    <div class="daily-top-slider-wrap">
        <button class="dts-btn dts-prev" id="dtsPrev">&#10094;</button>
        <div class="daily-top-board">
            <div class="board-pin tl"></div><div class="board-pin tr"></div>
            <div class="board-pin bl"></div><div class="board-pin br"></div>
            <div class="daily-top-grid" id="dailyTopGrid"></div>
        </div>
        <button class="dts-btn dts-next" id="dtsNext">&#10095;</button>
    </div>
    <div class="dts-indicators" id="dtsIndicators"></div>
</div>
    </div>`;
},

// ─── PROFILE ─────────────────────────────────────────────────
profile: `
<div class="profile-page-wrapper fade-in">
    <div class="profile-card">
        <div class="profile-banner"></div>
        <div class="profile-main-content">
            <div class="profile-info-header">
                <div class="profile-avatar-container" style="position:relative;">
                    <input type="file" id="avatarFileInput" accept="image/jpeg,image/png,image/webp" style="display:none">
                    <div class="avatar-circle" id="avatarCircle" style="cursor:pointer;position:relative;overflow:hidden;">
                        <i class="fas fa-user" id="avatarIcon"></i>
                        <img id="avatarImg" src="" alt="avatar" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;top:0;left:0;">
                        <div id="avatarHover" style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);border-radius:50%;align-items:center;justify-content:center;flex-direction:column;gap:4px;z-index:2;">
                            <i class="fas fa-camera" style="color:#fff;font-size:20px;"></i>
                            <span style="color:#fff;font-size:10px;font-weight:600;">Change</span>
                        </div>
                    </div>
                     <button id="deleteAvatarBtn" style="display:none;position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,0.85);border:none;cursor:pointer;z-index:3;align-items:center;justify-content:center;padding:0;">
        <i class="fas fa-times" style="color:#fff;font-size:10px;"></i>
    </button>
                    <div id="avatarStatus" style="position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);font-size:11px;white-space:nowrap;font-weight:600;"></div>
                </div>
                <div class="profile-titles">
                    <h1 class="profile-name" id="profileName">...</h1>
                    <p class="profile-location"><i class="fas fa-map-marker-alt" style="color:#c9a84c;"></i> <span id="profileLocationText">—</span></p>
                </div>
                <button class="edit-profile-btn" id="editProfileBtn"><i class="fas fa-edit"></i> Edit</button>
            </div>

            <div class="profile-stats-grid">
                <div class="stat-box purple">
                    <div class="stat-icon"><i class="fas fa-map-marked-alt"></i></div>
                    <div class="stat-text"><p>Visited</p><span id="statVisited">—</span></div>
                </div>
                <div class="stat-box blue">
                    <div class="stat-icon"><i class="fas fa-envelope"></i></div>
                    <div class="stat-text"><p>Email</p><span id="statEmail" style="font-size:12px;word-break:break-all;">—</span></div>
                </div>
                <div class="stat-box green">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-text"><p>Member since</p><span id="statSince">—</span></div>
                </div>
            </div>

            <div class="profile-contacts">
                <div class="contact-item"><i class="far fa-envelope"></i> <span id="contactEmail">—</span></div>
                <div class="contact-item" id="googleBadge" style="display:none;"><i class="fab fa-google" style="color:#ea4335;"></i> <span>Google Connected</span></div>
            </div>

            <hr class="profile-divider">

            <div style="display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:24px;">
                <button class="profile-tab-btn active" data-tab="about"><i class="fas fa-user" style="margin-right:6px;font-size:12px;"></i>About</button>
                <button class="profile-tab-btn" data-tab="stats"><i class="fas fa-chart-bar" style="margin-right:6px;font-size:12px;"></i>Statistics</button>
            </div>

            <div id="tab-about" class="profile-tab-content">
                <div id="profileViewMode" class="profile-about">
                    <h3>About me</h3>
                    <p id="profileBioText" style="color:#6b6560;font-style:italic;">—</p>
                </div>
                <div id="profileEditMode" style="display:none;padding:24px;background:rgba(255,255,255,0.025);border:1px solid rgba(201,168,76,0.12);border-radius:24px;margin-top:16px;">
                    <h3 style="margin-bottom:20px;color:#f0ece4;">Edit Profile</h3>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div>
                            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#6b6560;display:block;margin-bottom:8px;">Name</label>
                            <input type="text" id="editUsername" maxlength="50" placeholder="Your name" style="width:100%;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#6b6560;display:block;margin-bottom:8px;">City</label>
                            <input type="text" id="editLocation" maxlength="100" placeholder="e.g. London, UK" style="width:100%;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                        </div>
                        <div style="position:relative;">
                            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#6b6560;display:block;margin-bottom:8px;">About yourself <span style="color:#3d3935;">(max 300)</span></label>
                            <textarea id="editBio" maxlength="300" rows="4" placeholder="Tell something about yourself..." style="width:100%;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;resize:vertical;box-sizing:border-box;"></textarea>
                            <span id="bioCounter" style="position:absolute;bottom:10px;right:14px;font-size:11px;color:#3d3935;">0/300</span>
                        </div>
                        <div id="editAnswer" style="font-size:13px;min-height:18px;"></div>
                        <div style="display:flex;gap:10px;">
                            <button id="saveProfileBtn" style="padding:11px 24px;background:linear-gradient(135deg,#c9a84c,#e8c97a);border:none;border-radius:14px;color:#05080f;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;"><i class="fas fa-check"></i> Save</button>
                            <button id="cancelEditBtn" style="padding:11px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:#6b6560;font-size:13px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;"><i class="fas fa-times"></i> Cancel</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="tab-stats" class="profile-tab-content" style="display:none;">
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:12px 18px;margin-bottom:18px;">
                    <h4 style="color:#f0ece4;margin:0 0 12px;font-size:14px;font-family:'Outfit',sans-serif;">Recent searches</h4>
                    <ul id="profileSearchHistory" style="list-style:none;padding:0;margin:0;max-height:180px;overflow:auto;"></ul>
                </div>
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:12px 18px;margin-bottom:18px;">
                    <h4 style="color:#f0ece4;margin:0 0 12px;font-size:14px;font-family:'Outfit',sans-serif;">Top search categories</h4>
                    <ul id="profileSearchCategorySummary" style="list-style:none;padding:0;margin:0;"></ul>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:28px;">
                    <div class="kpi-card"><div class="kpi-icon" style="background:rgba(201,168,76,0.12);color:#e8c97a;"><i class="fas fa-map-marked-alt"></i></div><div class="kpi-body"><span class="kpi-val" id="statsVisited">0</span><span class="kpi-label">Places visited</span></div></div>
                    <div class="kpi-card"><div class="kpi-icon" style="background:rgba(31,212,200,0.12);color:#1fd4c8;"><i class="fas fa-calendar-alt"></i></div><div class="kpi-body"><span class="kpi-val" id="statsMemberSince" style="font-size:18px;">—</span><span class="kpi-label">Member since</span></div></div>
                    <div class="kpi-card"><div class="kpi-icon" style="background:rgba(167,139,250,0.12);color:#a78bfa;"><i class="fas fa-map-marker-alt"></i></div><div class="kpi-body"><span class="kpi-val" id="statsLocation" style="font-size:18px;">—</span><span class="kpi-label">City</span></div></div>
                    <div class="kpi-card"><div class="kpi-icon" style="background:rgba(201,168,76,0.12);color:#c9a84c;"><i class="fas fa-star"></i></div><div class="kpi-body"><span class="kpi-val" id="statsRating">—</span><span class="kpi-label">Rating</span></div></div>
                </div>
                <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:22px;margin-bottom:18px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                        <h4 style="color:#f0ece4;margin:0;font-size:15px;font-family:'Outfit',sans-serif;">Monthly Activity</h4>
                        <div style="display:flex;gap:6px;" id="periodTabsContainer"></div>
                    </div>
                    <div style="position:relative;height:160px;"><canvas id="profileBarChart"></canvas></div>
                </div>
                <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:22px;margin-bottom:18px;">
                    <h4 style="color:#f0ece4;margin:0 0 18px;font-size:15px;font-family:'Outfit',sans-serif;">Place categories</h4>
                    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
                        <div style="position:relative;width:140px;height:140px;flex-shrink:0;">
                            <canvas id="profileDonutChart"></canvas>
                            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
                                <span id="donutTotal" style="font-size:22px;font-weight:800;color:#f0ece4;font-family:'Space Mono',monospace;">0</span>
                                <span style="display:block;font-size:10px;color:#3d3935;">total</span>
                            </div>
                        </div>
                        <div id="profileDonutLegend" style="flex:1;min-width:120px;"></div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:22px;margin-bottom:18px;">
                    <h4 style="color:#f0ece4;margin:0 0 18px;font-size:15px;font-family:'Outfit',sans-serif;">Top queries</h4>
                    <div id="profileCityBars"></div>
                </div>
            </div>
        </div>
    </div>
</div>`,

// ─── SETTINGS ────────────────────────────────────────────────
settings: `
<div class="dashboard-wrapper fade-in">
    <header class="settings-hero">
        <div class="hero-bg-glow"></div>
        <div class="hero-content">
            <div class="badge-premium">System v2.4</div>
            <h1 class="glitch-text">Settings</h1>
            <div class="hero-separator"></div>
            <p>Central account management panel. <span>Personalize your Top Spots experience.</span></p>
        </div>
    </header>
    <div class="settings-grid">
        <section class="settings-card">
            <div class="card-head"><div class="icon-box purple"><i class="fas fa-cog"></i></div><h3>Personalization</h3></div>
            <div class="card-body">
                <div class="setting-item"><div class="info"><span class="label">Save search history</span><span class="sub-label">Quickly return to recent queries</span></div><label class="ios-switch"><input type="checkbox" id="toggle_notifications_email"><span class="ios-slider"></span></label></div>
                <div class="setting-item"><div class="info"><span class="label">Show top locations</span><span class="sub-label">Display popular places on the dashboard</span></div><label class="ios-switch"><input type="checkbox" id="toggle_notifications_push"><span class="ios-slider"></span></label></div>
                <div class="setting-item"><div class="info"><span class="label">Auto-show nearby</span><span class="sub-label">Load nearby places automatically on map view</span></div><label class="ios-switch"><input type="checkbox" id="toggle_notifications_nearby"><span class="ios-slider"></span></label></div>
            </div>
        </section>
        <section class="settings-card">
            <div class="card-head"><div class="icon-box blue"><i class="fas fa-map-marker-alt"></i></div><h3>Privacy</h3></div>
            <div class="card-body">
                <div class="setting-item"><div class="info"><span class="label">Save visited places</span><span class="sub-label">Automatically save places you browse</span></div><label class="ios-switch"><input type="checkbox" id="toggle_privacy_public"><span class="ios-slider"></span></label></div>
                <div class="setting-item"><div class="info"><span class="label">Share location</span><span class="sub-label">Use your location for nearby search</span></div><label class="ios-switch"><input type="checkbox" id="toggle_privacy_location"><span class="ios-slider"></span></label></div>
            </div>
        </section>
        <section class="settings-card full-width">
            <div class="card-head"><div class="icon-box orange"><i class="fas fa-key"></i></div><h3>Account Actions</h3></div>
            <div class="action-grid">
                <div class="action-box"><div class="action-text"><h4>Change Password</h4><p>Update your password for security</p></div><button class="action-btn" id="openChangePasswordBtn">Update</button></div>
                <div class="action-box"><div class="action-text"><h4>Account Email</h4><p id="settingsEmail" style="word-break:break-all;">—</p></div></div>

                <div class="action-box danger-zone"><div class="action-text"><h4 class="text-danger">Delete Account</h4><p>This will permanently delete your data</p></div><button class="action-btn danger" id="deleteAccountBtn">Delete</button></div>
            </div>
            <form id="changePasswordForm" style="display:none;margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
                <h4 style="color:#f0ece4;margin-bottom:6px;" id="passwordFormTitle">Change Password</h4>
                <p id="passwordFormHint" style="font-size:12px;color:#6b6560;margin-bottom:16px;min-height:16px;"></p>
                <div style="display:flex;flex-direction:column;gap:10px;max-width:420px;">
                    <div id="currentPasswordWrap">
                        <input type="password" id="currentPasswordInput" placeholder="Current password" autocomplete="current-password" style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                    </div>
                    <input type="password" id="newPasswordInput" placeholder="New password (min. 8 characters)" autocomplete="new-password" style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                    <input type="password" id="confirmPasswordInput" placeholder="Confirm new password" autocomplete="new-password" style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                    <div id="passwordChangeAnswer" style="font-size:13px;min-height:18px;"></div>
                    <div style="display:flex;gap:10px;">
                        <button type="button" id="confirmChangePasswordBtn" style="padding:11px 24px;background:linear-gradient(135deg,#c9a84c,#e8c97a);border:none;border-radius:14px;color:#05080f;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;"><i class="fas fa-check"></i> Save</button>
                        <button type="button" id="cancelChangePasswordBtn" style="padding:11px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:#6b6560;font-size:13px;cursor:pointer;font-family:'Outfit',sans-serif;"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </div>
            </form>
            <div id="deleteConfirmBlock" style="display:none;margin-top:20px;padding:20px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:18px;">
                <p style="color:#f87171;margin-bottom:14px;font-size:14px;"><i class="fas fa-exclamation-triangle"></i> Are you sure? This action is <strong>irreversible</strong>.</p>
                <div style="display:flex;gap:10px;">
                    <button class="action-btn danger" id="confirmDeleteBtn">Yes, Delete</button>
                    <button type="button" style="padding:10px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#6b6560;font-size:13px;cursor:pointer;" id="cancelDeleteBtn">Cancel</button>
                </div>
            </div>
        </section>
    </div>
</div>`,

}; // end pages

// ============================================================
// PAGE ANIMATION + TILT
// ============================================================
function animatePageIn(el) {
    el.style.opacity='0'; el.style.transform='translateY(18px)'; el.style.transition='none';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
        el.style.transition='opacity .38s cubic-bezier(.4,0,.2,1),transform .38s cubic-bezier(.4,0,.2,1)';
        el.style.opacity='1'; el.style.transform='translateY(0)';
    }));
}

function initTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r=card.getBoundingClientRect(), x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
            card.style.transform=`perspective(600px) rotateX(${(-y/r.height)*8}deg) rotateY(${(x/r.width)*8}deg) translateY(-5px) scale(1.02)`;
        });
        card.addEventListener('mouseleave',()=>{card.style.transition='transform .5s cubic-bezier(.4,0,.2,1)';card.style.transform='';});
        card.addEventListener('mouseenter',()=>{card.style.transition='transform .1s ease';});
    });
}

// ============================================================
// DASHBOARD
// ============================================================
let currentCategory = 'restaurant';
let debounceTimer, isInitialLoad = false;

const defaultCities = [
    { name:"London",    place_id:"ChIJdd4hrwug2EcRmSrV3Vo6llI", photo:"../img/def-sity_img/london.png",    rating:4.9 },
    { name:"Dubai",     place_id:"ChIJRcbZaklDXz4RYlEphFBu5r0", photo:"../img/def-sity_img/dubai.png",   rating:4.7 },
    { name:"New York",  place_id:"ChIJOwg_06VPwokRYv534QaPC8g", photo:"../img/def-sity_img/new-york.png",      rating:4.8 },
    { name:"Tokyo",     place_id:"ChIJ51cu8IcbXWARiRtXIothAS4", photo:"../img/def-sity_img/tokyo.png",    rating:4.9 },
    { name:"Barcelona", place_id:"ChIJ5TCOcRaYpBIRCmZHTz37sEQ", photo:"../img/def-sity_img/barcelone.png",rating:4.8 },
    { name:"Rome",      place_id:"ChIJu46S-ZZhLxMROG5lkwZ3D7k", photo:"../img/def-sity_img/rome.png",    rating:4.8 },
    { name:"Amsterdam", place_id:"ChIJVXealLU_xkcRja_At0z9AGY", photo:"../img/def-sity_img/amsterdam.png", rating:4.8 },
];

function filterResults(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(i=>i.rating==null||Number(i.rating)>=4.0)
               .sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0))
               .slice(0,60);
}

function showSearchLoader() {
    let l=document.getElementById('search-loader');
    if (!l) {
        l=document.createElement('div'); l.id='search-loader';
        l.innerHTML='<span class="search-spinner"></span>';
        const w=document.querySelector('.search-wrapper')||document.getElementById('searchInput')?.parentElement;
        if (w){w.style.position='relative';w.appendChild(l);}
    }
    l.style.display='flex';
}
function hideSearchLoader() { const l=document.getElementById('search-loader'); if(l)l.style.display='none'; }

async function updateSliderCards(list, isDefault=false) {
    const c=document.getElementById('cityContainer');
    if (!c) return;
    c.innerHTML='';
    list.slice(0,60).forEach(item=>{
        const card=document.createElement('div');
        card.className='city-card show';
        const name=item.name||item.description||'Place';
        card.innerHTML=`
            <div class="image-wrapper" style="height:185px;overflow:hidden;background:#090d18;position:relative;">
                <div class="loading-spinner" style="position:absolute;width:100%;height:100%;z-index:10;">${cardLoaderHTML()}</div>
                <img src="${modernPlaceholder}" class="city-image" style="width:100%;height:100%;object-fit:cover;opacity:0;">
            </div>
            <div class="city-content">
                <h3 class="city-name"></h3>
                <div class="city-rating">⭐ ${item.rating||'4.5'}</div>
                <button class="map-button">Explore</button>
            </div>`;
        const img=card.querySelector('.city-image');
        const spinner=card.querySelector('.loading-spinner');
        img.onload=()=>{spinner.style.display='none';img.style.opacity='1';};
        img.onerror=()=>{spinner.style.display='none';img.src=NO_PHOTO;img.style.opacity='1';};
        card.querySelector('.city-name').textContent=name.length>40?name.slice(0,37)+'...':name;
        card.onclick=()=>{ window.location.href=`/html/city_page.html?placeId=${item.place_id}&name=${encodeURIComponent(name)}`; };
        c.appendChild(card);
        if (isDefault && item.photo) img.src=item.photo;
        else if (item.photo_url) img.src=item.photo_url;
    });
    syncScrollProgress();
}

async function fetchSuggestions(query) {
    try {
        const r=await fetch('/api/places/autocomplete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:query,category:currentCategory,language:'en'})});
        const d=await r.json();
        return filterResults(d.predictions||[]);
    } catch { return []; }
}

async function loadDashboardCards() {
    if (!isInitialLoad) { isInitialLoad=true; updateSliderCards(defaultCities,true); return; }
    showSearchLoader();
    const results=await fetchSuggestions(`popular ${currentCategory}`);
    hideSearchLoader();
    updateSliderCards(results.length?results:defaultCities,!results.length);
}

function syncScrollProgress() {
    const c=document.getElementById('cityContainer'),th=document.getElementById('scrollThumb');
    if(!c||!th)return;
    const max=c.scrollWidth-c.clientWidth;
    if(max<=0){th.style.width='100%';th.style.transform='translateX(0)';return;}
    const pct=(c.scrollLeft/max)*(100-20);
    th.style.width='20%';th.style.transform=`translateX(${pct}%)`;
}

async function initDashboard() {
    const greeting=document.getElementById('dashboardGreeting');
    if (greeting) profileFn.getProfile().then(p=>{ if(p?.username) greeting.textContent=`Hello, ${p.username}! 👋`; });

    const searchInput=document.getElementById('searchInput');
    const catBtns=document.querySelectorAll('.search-category');
    catBtns.forEach(b=>{ if(b.dataset.type==='restaurant') b.classList.add('active'); });

    await loadDashboardCards();
    initTiltCards();

    const scrollL=document.getElementById('scrollLeft');
    const scrollR=document.getElementById('scrollRight');
    const cc=document.getElementById('cityContainer');

    if(cc){
        cc.classList.add('hide-scrollbar');
        if(!document.getElementById('ts-hide-sb')){
            const s=document.createElement('style');s.id='ts-hide-sb';
            s.textContent='.scroll-container.hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}.scroll-container.hide-scrollbar::-webkit-scrollbar{display:none;}';
            document.head.appendChild(s);
        }
        cc.addEventListener('scroll',syncScrollProgress);
    }
    scrollL?.addEventListener('click',e=>{e.preventDefault();const card=cc?.querySelector('.city-card');const step=card?card.offsetWidth+20:300;cc?.scrollBy({left:-step,behavior:'smooth'});});
    scrollR?.addEventListener('click',e=>{e.preventDefault();const card=cc?.querySelector('.city-card');const step=card?card.offsetWidth+20:300;cc?.scrollBy({left:step,behavior:'smooth'});});
    window.addEventListener('resize',syncScrollProgress);

    document.querySelectorAll('.cat-card').forEach(card=>{
        card.addEventListener('click',e=>{
            e.preventDefault();
            window._pendingNearbyCategory=card.dataset.category;
            navigateTo('nearby');
        });
    });

    catBtns.forEach(btn=>{
        btn.addEventListener('click',async()=>{
            catBtns.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
            currentCategory=btn.dataset.type;
            const q=searchInput?.value.trim();
            if(q&&q.length>=3) searchInput.dispatchEvent(new Event('input'));
            else {
                showSearchLoader();
                const r=await fetchSuggestions(`popular ${currentCategory}`);
                hideSearchLoader();
                updateSliderCards(r.length?r:defaultCities,!r.length);
            }
        });
    });

    if(searchInput){
        searchInput.addEventListener('input',e=>{
            const q=e.target.value.trim();
            clearTimeout(debounceTimer);
            if(!q){hideSearchLoader();updateSliderCards(defaultCities,true);return;}
            if(q.length<3){hideSearchLoader();return;}
            debounceTimer=setTimeout(async()=>{
                if(!checkRateLimit('dashboard-search'))return;
                showSearchLoader();
                try{
                    const r=await fetch('/api/places/autocomplete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:q,category:currentCategory,language:'en'})});
                    const d=await r.json();
                    updateSliderCards(filterResults(d.predictions||[]),false);
                }catch(e){console.error(e);}
                hideSearchLoader();
            },1000);
        });
    }
}
// ============================================================
// NEARBY — backend proxy only, no SDK languageCode bug
// ============================================================
function getCurrentLocation() {
    return new Promise((resolve,reject)=>{
        if(!navigator.geolocation){reject(new Error('Geolocation not supported'));return;}
        navigator.geolocation.getCurrentPosition(
            pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude}),
            err=>{
                const msgs={1:'Please enable location in browser settings',2:'Location service unavailable',3:'Location request timed out'};
                reject(new Error(msgs[err.code]||'Location error'));
            },
            {enableHighAccuracy:true,timeout:10000,maximumAge:0}
        );
    });
}

function renderNearbyCards(places) {
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!places.length) {
        grid.innerHTML = `
            <div style="text-align:center;padding:48px 20px;color:#6b6560;">
                <i class="fas fa-search" style="font-size:40px;margin-bottom:16px;opacity:.5;display:block;"></i>
                <p style="margin:0 0 8px;font-size:15px;color:#a8a199;">No places found in this area</p>
                <p style="margin:0;font-size:13px;">Try a different category or increase the radius</p>
            </div>`;
        return;
    }

    // ── Фільтруємо місця без фото ─────────────────────────────
    const filteredPlaces = places.filter(p => p.photo_url && p.photo_url.trim() !== '');

    if (!filteredPlaces.length) {
        grid.innerHTML = `
            <div style="text-align:center;padding:48px 20px;color:#6b6560;">
                <i class="fas fa-image" style="font-size:40px;margin-bottom:16px;opacity:.5;display:block;"></i>
                <p style="margin:0 0 8px;font-size:15px;color:#a8a199;">No places with photos found</p>
                <p style="margin:0;font-size:13px;">Try a different category or increase the radius</p>
            </div>`;
        return;
    }

    // ── Track (flex slider) ───────────────────────────────────
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;overflow:hidden;border-radius:20px;';

    const track = document.createElement('div');
    track.id = 'nearbySliderTrack';
    track.style.cssText = 'display:flex;transition:transform .4s cubic-bezier(.4,0,.2,1);';

    filteredPlaces.forEach(p => {
        const name    = p.name || p.displayName || 'Unknown';
        const addr    = (p.vicinity || p.formatted_address || 'Address not available')
                            .split(',').slice(0, 2).join(', ');
        const rating  = parseFloat(p.rating) || 0;
        const photo   = p.photo_url || NO_PHOTO;
        const placeId = p.place_id || p.id || '';
        const lat     = p.latitude  || 0;
        const lon     = p.longitude || 0;

        const slide = document.createElement('div');
        slide.style.cssText = 'min-width:100%;box-sizing:border-box;';

        slide.innerHTML = `
        <div class="nearby-card">
            <!-- Фото -->
            <div class="nearby-card-img">
                <img src="${photo}" loading="lazy"
                    onerror="this.src='${NO_PHOTO}'"
                    onload="this.style.opacity=1">
                <div class="nearby-card-img-grad"></div>
                <div class="nearby-card-rating">
                    ${rating > 0 ? `⭐ ${rating.toFixed(1)}` : 'Not rated'}
                </div>
            </div>
            <!-- Контент -->
            <div class="nearby-card-body">
                <h3 class="nearby-card-name">${name}</h3>
                <p class="nearby-card-addr">
                    <i class="fas fa-map-marker-alt"></i>${addr}
                </p>
                <div class="nearby-card-btns">
                    <button class="nearby-btn-primary"
                        onclick="window.location.href='/html/city_page.html?placeId=${placeId}'">
                        <i class="fas fa-arrow-right"></i> Details
                    </button>
                </div>
            </div>
        </div>`;

        track.appendChild(slide);
    });

    wrap.appendChild(track);

    // ── Навігація ─────────────────────────────────────────────
    let cur   = 0;
    const total = filteredPlaces.length;

    const nav = document.createElement('div');
    nav.className = 'nearby-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'nearby-nav-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';

    const counter = document.createElement('span');
    counter.className = 'nearby-nav-counter';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'nearby-nav-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

    nav.append(prevBtn, counter, nextBtn);

    // ── Dots ──────────────────────────────────────────────────
    const dots = document.createElement('div');
    dots.className = 'nearby-dots';
    const maxDots = Math.min(total, 10);
    for (let i = 0; i < maxDots; i++) {
        const d = document.createElement('div');
        d.className = 'nearby-dot' + (i === 0 ? ' active' : '');
        d.onclick = () => go(i);
        dots.appendChild(d);
    }

    function go(idx) {
        cur = Math.max(0, Math.min(idx, total - 1));
        track.style.transform = `translateX(-${cur * 100}%)`;
        counter.textContent = `${cur + 1} / ${total}`;
        prevBtn.style.opacity = cur === 0 ? '0.3' : '1';
        nextBtn.style.opacity = cur === total - 1 ? '0.3' : '1';
        dots.querySelectorAll('.nearby-dot').forEach((d, i) =>
            d.classList.toggle('active', i === cur));
    }

    prevBtn.onclick = () => { if (cur > 0) go(cur - 1); };
    nextBtn.onclick = () => { if (cur < total - 1) go(cur + 1); };

    // Свайп на мобайлі
    let touchX = 0;
    wrap.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', e => {
        const diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) go(cur + (diff > 0 ? 1 : -1));
    }, { passive: true });

    go(0);

    grid.style.cssText = '';
    grid.appendChild(wrap);
    grid.appendChild(nav);
    if (total > 1) grid.appendChild(dots);
}

async function performNearbySearch() {
    if(!checkRateLimit('nearby-search'))return;
    const statusText=document.getElementById('nearbyStatus');
    const radiusInput=document.getElementById('nearbyRadius');
    const activeChip=document.querySelector('.chip.active');
    if(!statusText)return;

    const category=activeChip?activeChip.dataset.type:'tourist_attraction';
    const radius=parseInt(radiusInput?.value||12)*1000;

    try {
        statusText.innerHTML='<i class="fas fa-spinner fa-spin"></i> Getting your location...';
        const {latitude,longitude}=await getCurrentLocation();

        // 1. Try DB cache
        statusText.innerHTML='<i class="fas fa-database"></i> Checking local cache...';
        try {
            const dbRes=await fetch('/api/nearby/get',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({latitude,longitude,radius,category})
            });
            if(dbRes.ok){
                const db=await dbRes.json();
                if(db.results?.length){
                    statusText.textContent=`Found ${db.results.length} places nearby`;
                    renderNearbyCards(db.results);
                    return;
                }
            }
        } catch(e){ console.warn('Cache miss:',e.message); }

        // 2. Backend Google proxy — NO SDK, no languageCode issue
        statusText.innerHTML='<i class="fas fa-satellite"></i> Searching nearby places...';
        const gRes=await fetch('/api/google/nearby',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({latitude,longitude,radius,types:[category],language:'en'})
        });

        if(!gRes.ok){
            const err=await gRes.json().catch(()=>({}));
            throw new Error(err.error||`Server error ${gRes.status}`);
        }

        const gData=await gRes.json();
        const results=gData.places||[];

        if(!results.length){
            statusText.textContent='No places found in this area';
            renderNearbyCards([]);
            return;
        }

        statusText.textContent=`Found ${results.length} places nearby`;
        renderNearbyCards(results);

        // Save to DB async (without photo_url)
        const toSave=results.map(({photo_url:_,...r})=>r);
        fetch('/api/nearby/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({places:toSave})}).catch(()=>{});

    } catch(err){
        console.error('Nearby error:',err.message);
        if(statusText){ statusText.textContent=`Error: ${err.message}`; statusText.style.color='#ff6b4a'; }
        renderNearbyCards([]);
    }
}

function initNearbyPage() {
    const radiusInput=document.getElementById('nearbyRadius');
    const chips=document.querySelectorAll('.chip');
    const startBtn=document.getElementById('startNearbySearch');

    if(window._pendingNearbyCategory){
        chips.forEach(c=>c.classList.remove('active'));
        document.querySelector(`.chip[data-type="${window._pendingNearbyCategory}"]`)?.classList.add('active');
        window._pendingNearbyCategory=null;
    }

    chips.forEach(chip=>{
        chip.addEventListener('click',()=>{
            if(chip.classList.contains('active'))return;
            chips.forEach(c=>c.classList.remove('active')); chip.classList.add('active');
            performNearbySearch();
        });
    });

    if(radiusInput){
        radiusInput.oninput=()=>{ const v=document.getElementById('radiusVal'); if(v) v.textContent=radiusInput.value+' km'; };
        radiusInput.onchange=()=>performNearbySearch();
    }

    startBtn?.addEventListener('click',performNearbySearch);
    setTimeout(()=>performNearbySearch(),500);
}

// ============================================================
// SHOPPING PAGE - DEBUG VERSION
// ============================================================

async function initShoppingPage() {
    console.log('[SHOPPING] ✅ initShoppingPage() called');
    
    let selectedType = safeGet('session', 'shopping_type') || '';
    console.log('[SHOPPING] Saved type:', selectedType);

    // ── Shop Type Selection ───────────────────────────────────
    const typeBtns = document.querySelectorAll('.shop-type-btn');
    console.log('[SHOPPING] Found', typeBtns.length, 'shop type buttons');
    
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shop-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
            console.log('[SHOPPING] Selected type:', selectedType);
            safeSet('session', 'shopping_type', selectedType);
        });
    });

    // ── Search Button ─────────────────────────────────────────
    const searchBtn = document.getElementById('shopSearchBtn');
    console.log('[SHOPPING] Search button:', searchBtn ? '✓ found' : '✗ NOT FOUND');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            console.log('[SHOPPING] Search button clicked');
            if (!checkRateLimit('shop-search')) {
                console.warn('[SHOPPING] Rate limit exceeded');
                return;
            }
            const city = document.getElementById('shopCityInput').value.trim();
            if (!city) { 
                document.getElementById('shopCityInput').focus(); 
                showToast('Enter a city name', 'warning'); 
                return; 
            }
            if (!selectedType) { 
                showToast('Please select a store type ☝️', 'warning'); 
                return; 
            }
            console.log('[SHOPPING] Searching:', city, selectedType);
            safeSet('session', 'shopping_city', city);
            searchShops(city, selectedType);
        });
    }

    const cityInput = document.getElementById('shopCityInput');
    if (cityInput) {
        cityInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') searchBtn?.click();
        });
    }

    // ── Daily Top Loader ──────────────────────────────────────
    console.log('[SHOPPING] Calling loadDailyTop()...');
    loadDailyTop();

    // ── Restore Previous Search ───────────────────────────────
    const savedCity = safeGet('session', 'shopping_city');
    console.log('[SHOPPING] Saved city:', savedCity);
    if (savedCity && selectedType) {
        console.log('[SHOPPING] Restoring previous search');
        searchShops(savedCity, selectedType);
    }
}

async function loadDailyTop() {
    const section = document.getElementById('shopDailyTop');
    if (!section) return;

    section.style.display = 'block';
    section.innerHTML = `
        <style>
            @keyframes dtPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%       { opacity: 0.5; transform: scale(0.92); }
            }
            @keyframes dtSlideUp {
                from { opacity: 0; transform: translateY(18px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes dtDot {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                40%           { transform: scale(1);   opacity: 1; }
            }
            .dt-loader-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                gap: 20px;
                animation: dtSlideUp .4s ease both;
            }
            .dt-loader-icon { font-size: 42px; animation: dtPulse 1.8s ease-in-out infinite; }
            .dt-loader-title { font-size: 18px; font-weight: 700; color: #c9a84c; text-align: center; letter-spacing: .3px; }
            .dt-loader-sub { font-size: 13px; color: rgba(255,255,255,.4); text-align: center; max-width: 260px; line-height: 1.5; }
            .dt-loader-dots { display: flex; gap: 6px; }
            .dt-loader-dots span { width: 8px; height: 8px; border-radius: 50%; background: #c9a84c; display: inline-block; }
            .dt-loader-dots span:nth-child(1) { animation: dtDot 1.2s ease infinite 0s; }
            .dt-loader-dots span:nth-child(2) { animation: dtDot 1.2s ease infinite .2s; }
            .dt-loader-dots span:nth-child(3) { animation: dtDot 1.2s ease infinite .4s; }
        </style>
        <div class="dt-loader-wrap">
            <div class="dt-loader-icon">📍</div>
            <div class="dt-loader-title">Шукаємо найкраще поруч із вами</div>
            <div class="dt-loader-sub">Визначаємо ваше місцезнаходження та підбираємо топ місця міста</div>
            <div class="dt-loader-dots"><span></span><span></span><span></span></div>
        </div>
    `;

  const restoreSection = () => {
    section.innerHTML = `
        <div class="section-header" style="
            display:flex;
            align-items:center;
            gap:12px;
            margin-bottom:24px;
            padding:0 4px;
        ">
            <span style="font-size:28px;">🔥</span>
            <h2 class="daily-top-city" style="
                font-size:clamp(16px,3vw,22px);
                font-weight:700;
                color:#c9a84c;
                margin:0;
                flex:1;
            "></h2>
            <span class="daily-top-badge" style="
                background:transparent;
                border:1.5px solid #c9a84c;
                color:#c9a84c;
                font-size:11px;
                font-weight:700;
                padding:3px 10px;
                border-radius:20px;
                letter-spacing:.5px;
            "></span>
        </div>
        <div style="position:relative;display:flex;align-items:center;gap:8px;">
            <button id="dtsPrev" style="
                position:absolute;left:-20px;z-index:10;
                width:44px;height:44px;border-radius:50%;
                background:rgba(201,168,76,.15);
                border:1.5px solid rgba(201,168,76,.3);
                color:#c9a84c;font-size:16px;cursor:pointer;
                display:flex;align-items:center;justify-content:center;
                transition:all .2s;flex-shrink:0;
            "><i class="fas fa-chevron-left"></i></button>

            <div id="dailyTopGrid" style="flex:1;min-width:0;"></div>

            <button id="dtsNext" style="
                position:absolute;right:-20px;z-index:10;
                width:44px;height:44px;border-radius:50%;
                background:rgba(201,168,76,.15);
                border:1.5px solid rgba(201,168,76,.3);
                color:#c9a84c;font-size:16px;cursor:pointer;
                display:flex;align-items:center;justify-content:center;
                transition:all .2s;flex-shrink:0;
            "><i class="fas fa-chevron-right"></i></button>
        </div>
        <div style="
            display:flex;align-items:center;justify-content:center;
            gap:8px;margin-top:20px;
        ">
            <button id="dtsPrevMob" style="
                width:36px;height:36px;border-radius:50%;
                background:rgba(201,168,76,.1);
                border:1px solid rgba(201,168,76,.2);
                color:#c9a84c;font-size:13px;cursor:pointer;
                display:none;align-items:center;justify-content:center;
            "><i class="fas fa-chevron-left"></i></button>
            <div id="dtsIndicators" style="display:flex;gap:6px;align-items:center;"></div>
            <button id="dtsNextMob" style="
                width:36px;height:36px;border-radius:50%;
                background:rgba(201,168,76,.1);
                border:1px solid rgba(201,168,76,.2);
                color:#c9a84c;font-size:13px;cursor:pointer;
                display:none;align-items:center;justify-content:center;
            "><i class="fas fa-chevron-right"></i></button>
        </div>
    `;

};

    const doLoad = async (latitude = null, longitude = null) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            const res = await fetch('/api/daily-top', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ latitude, longitude })
            });

            if (!res.ok) { section.style.display = 'none'; return; }

            const data = await res.json();
            const filtered = (data.top || []).filter(p => p.photo_url && p.photo_url.trim() !== '');
            if (!filtered.length) { section.style.display = 'none'; return; }

            restoreSection();

            const titleEl = section.querySelector('.daily-top-city');
            if (titleEl) {
                titleEl.textContent = data.city
                    ? `🔥 Top in ${data.city} · last 48h`
                    : '🔥 Trending Now · last 48h';
            }

            const badgeEl = section.querySelector('.daily-top-badge');
            if (badgeEl) badgeEl.textContent = `TOP ${filtered.length}`;

            renderDailyTop(filtered);
        } catch (err) {
            console.error('[DailyTop]', err);
            section.style.display = 'none';
        }
    };

    if (!navigator.geolocation) {
        section.style.display = 'none';
        return;
    }

    const cachedLat = sessionStorage.getItem('userLat');
    const cachedLon = sessionStorage.getItem('userLon');
    if (cachedLat && cachedLon) {
        console.log('[DailyTop] Using cached coords');
        await doLoad(parseFloat(cachedLat), parseFloat(cachedLon));
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            sessionStorage.setItem('userLat', lat);
            sessionStorage.setItem('userLon', lon);
            await doLoad(lat, lon);
        },
        err => {
            console.warn('[DailyTop] Geolocation failed:', err.message);
            section.style.display = 'none';
        },
        {
            timeout: 15000,
            maximumAge: 3600000,
            enableHighAccuracy: false
        }
    );
}

function renderDailyTop(places) {
    const grid = document.getElementById('dailyTopGrid');
    if (!grid) return;

    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];

    function getPerPage() {
        const w = window.innerWidth;
        if (w >= 1024) return 3;
        if (w >= 768)  return 2;
        return 1;
    }

    function buildCard(place, i) {
        const photo    = place.photo_url;
        const rating   = place.rating ? parseFloat(place.rating).toFixed(1) : '—';
        const url      = `/html/city_page.html?placeId=${place.place_id}&name=${encodeURIComponent(place.name || '')}`;
        const addr     = (place.address || '').split(',').slice(0, 2).join(', ').trim();
        const category = (place.category || '').replace(/_/g, ' ');

        return `
        <div class="daily-card" style="animation-delay:${i * 0.08}s">
            <div class="daily-card-rank">${medals[i] || `#${i + 1}`}</div>
            <div class="daily-card-img-wrap">
                <img src="${photo}"
                    alt="${(place.name || '').replace(/"/g,'&quot;')}"
                    loading="lazy"
                    onerror="this.closest('.daily-card').style.display='none'"
                    style="width:100%;height:100%;object-fit:cover;"/>
                <div class="daily-card-overlay"></div>
                ${category ? `<div class="daily-card-category">${category}</div>` : ''}
            </div>
            <div class="daily-card-body">
                <h3 class="daily-card-name">${place.name || 'Unknown'}</h3>
                <div class="daily-card-rating">
                    <i class="fas fa-star"></i> ${rating}
                </div>
                <p class="daily-card-addr"><i class="fas fa-map-marker-alt"></i> ${addr || '—'}</p>
                <a href="${url}" class="daily-card-btn"><i class="fas fa-arrow-right"></i> Open</a>
            </div>
        </div>`;
    }

    function chunkArray(arr, size) {
        const pages = [];
        for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
        return pages;
    }

    let currentPage = 0;
    let autoTimer   = null;

    function init() {
        const perPage = getPerPage();
        const pages   = chunkArray(places, perPage);
        const total   = pages.length;

        const pagesHTML = pages.map((pagePlaces, pi) => {
            const cols = pagePlaces.length === 1 ? 1 : pagePlaces.length === 2 ? 2 : perPage;
            return `
            <div class="dts-page" style="
                display:grid;
                grid-template-columns:repeat(${cols}, 1fr);
                gap:${window.innerWidth >= 1024 ? '24px' : window.innerWidth >= 768 ? '18px' : '16px'};
                flex-shrink:0;
                width:100%;
            ">
                ${pagePlaces.map((p, i) => buildCard(p, pi * perPage + i)).join('')}
            </div>`;
        }).join('');

        grid.innerHTML = `
            <div class="dts-viewport" style="overflow:hidden;width:100%;position:relative;">
                <div class="dts-track" style="
                    display:flex;
                    width:100%;
                    transition:transform 0.6s cubic-bezier(0.34,1.2,0.64,1);
                ">
                    ${pagesHTML}
                </div>
            </div>`;

        const track   = grid.querySelector('.dts-track');
        const dotsEl  = document.getElementById('dtsIndicators');
        const prevBtn = document.getElementById('dtsPrev');
        const nextBtn = document.getElementById('dtsNext');

        function goTo(idx) {
            currentPage = ((idx % total) + total) % total;
            track.style.transform = `translateX(${-currentPage * 100}%)`;
            if (dotsEl) {
                [...dotsEl.querySelectorAll('span')].forEach((d, i) => {
                    d.style.background = i === currentPage ? '#c9a84c' : 'rgba(255,255,255,.2)';
                    d.style.transform  = i === currentPage ? 'scale(1.3)' : 'scale(1)';
                });
            }
            if (prevBtn) prevBtn.style.opacity = total <= 1 ? '0' : currentPage === 0 ? '0.35' : '1';
            if (nextBtn) nextBtn.style.opacity = total <= 1 ? '0' : currentPage === total - 1 ? '0.35' : '1';
        }

        if (dotsEl) {
            dotsEl.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('span');
                dot.style.cssText = `
                    display:inline-block;width:10px;height:10px;
                    border-radius:50%;margin:0 4px;cursor:pointer;
                    transition:background .3s,transform .3s;
                    background:${i === 0 ? '#c9a84c' : 'rgba(255,255,255,.2)'};
                    transform:${i === 0 ? 'scale(1.3)' : 'scale(1)'};`;
                dot.onclick = () => { goTo(i); restartAuto(); };
                dotsEl.appendChild(dot);
            }
        }

        prevBtn?.addEventListener('click', () => { goTo(currentPage - 1); restartAuto(); });
        nextBtn?.addEventListener('click', () => { goTo(currentPage + 1); restartAuto(); });
        document.getElementById('dtsPrevMob')?.addEventListener('click', () => { goTo(currentPage - 1); restartAuto(); });
        document.getElementById('dtsNextMob')?.addEventListener('click', () => { goTo(currentPage + 1); restartAuto(); });

        function startAuto() {
            if (total <= 1) return;
            autoTimer = setInterval(() => goTo(currentPage + 1), 6000);
        }
        function restartAuto() { clearInterval(autoTimer); startAuto(); }

        let touchStartX = 0;
        const viewport = grid.querySelector('.dts-viewport');
        viewport.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        viewport.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { goTo(currentPage + (diff > 0 ? 1 : -1)); restartAuto(); }
        }, { passive: true });

        goTo(0);
        startAuto();
    }

    init();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { clearInterval(autoTimer); currentPage = 0; init(); }, 300);
    });
}
// ── Shop Search ───────────────────────────────────────────────
async function searchShops(city, type) {
    const loader = document.getElementById('shopLoader');
    const resultsSection = document.getElementById('shopResultsSection');
    const resultsGrid = document.getElementById('shopResultsGrid');
    const meta = document.getElementById('shopResultsMeta');
    const emptyEl = document.getElementById('shopEmpty');

    loader.style.display = 'flex';
    resultsSection.style.display = 'none';
    emptyEl.style.display = 'none';
    resultsGrid.innerHTML = '';

    try {
        const res = await fetch('/api/shopping/search', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, type, language: 'en' })
        });
        const data = await res.json();
        loader.style.display = 'none';

        if (!data.results?.length) {
            emptyEl.style.display = 'flex';
            return;
        }

        meta.textContent = `${data.results.length} stores · ${data.source === 'database' ? '📦 cached' : '🌐 Google'}`;
        resultsSection.style.display = 'block';
        resultsGrid.innerHTML = data.results.map(s => buildShopCard(s, city)).join('');
        attachImageFallbacks(resultsGrid);
        resultsGrid.querySelectorAll('.shop-card').forEach((card, i) => {
            card.style.animationDelay = `${i * .07}s`;
            card.classList.add('card-appear');
        });
    } catch (err) {
        loader.style.display = 'none';
        emptyEl.style.display = 'flex';
        console.error('[SHOPPING]', err);
    }
}

function buildShopCard(shop, city = '') {
    const rating = shop.rating ? parseFloat(shop.rating).toFixed(1) : '—';
    const stars = shop.rating ? '★'.repeat(Math.round(shop.rating)) + '☆'.repeat(5 - Math.round(shop.rating)) : '';
    const photo = shop.photo_url || NO_PHOTO;
    const url = `/html/city_page.html?placeId=${shop.place_id}&name=${encodeURIComponent(shop.query_name || '')}`;
    return `
    <div class="shop-card" data-id="${shop.place_id}" data-city="${city}">
        <div class="shop-card-img-wrap">
            <img class="shop-card-img" src="${photo}" loading="lazy"
                alt="${(shop.query_name || '').replace(/"/g, '&quot;')}"/>
            <div class="shop-card-overlay"></div>
            ${shop.save_count > 0 ? `<div class="shop-popular-badge"><i class="fas fa-fire"></i> ${shop.save_count}</div>` : ''}
        </div>
        <div class="shop-card-body">
            <h3 class="shop-card-name">${shop.query_name || 'Unknown'}</h3>
            ${rating !== '—' ? `<div class="shop-card-rating"><span class="shop-stars">${stars}</span><span class="shop-rating-num">${rating}</span></div>` : ''}
            <p class="shop-card-addr"><i class="fas fa-map-marker-alt"></i> ${shop.full_name || '—'}</p>
            <a class="shop-route-btn" href="${url}"><i class="fas fa-info-circle"></i> Details</a>
        </div>
    </div>`;
}
// ============================================================
// PROFILE
// ============================================================
const AVATAR_KEY='topspots_avatar';
function saveAvatar(url){try{safeSet('session',AVATAR_KEY,url);}catch(_){}}
function getAvatar(){try{return safeGet('session',AVATAR_KEY);}catch(_){return null;}}

async function initProfilePage(){
    const profile=await profileFn.getProfile();
    if(!profile)return;

    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v||'—';};
    set('profileName',profile.username);
    set('profileLocationText',profile.location||'Not specified');
    set('profileBioText',profile.bio||'Tell something about yourself...');
    set('statVisited',profile.places_visited);
    set('statEmail',profile.email);
    set('statSince',profile.member_since);
    set('contactEmail',profile.email);
    if(profile.has_google){const b=document.getElementById('googleBadge');if(b)b.style.display='flex';}

    const deleteAvatarBtn=document.getElementById('deleteAvatarBtn');

    function applyAvatar(url){
        const img=document.getElementById('avatarImg'),icon=document.getElementById('avatarIcon');
        if(!img||!icon)return;
        if(!url){
            img.style.display='none';
            icon.style.display='block';
            // ховаємо кнопку delete якщо аватара нема
            if(deleteAvatarBtn)deleteAvatarBtn.style.display='none';
            return;
        }
        img.onerror=()=>{
            img.style.display='none';
            icon.style.display='block';
            if(deleteAvatarBtn)deleteAvatarBtn.style.display='none';
        };
        img.src=url;
        img.style.display='block';
        icon.style.display='none';
        // показуємо кнопку delete якщо аватар є
        if(deleteAvatarBtn)deleteAvatarBtn.style.display='flex';
        saveAvatar(url);
    }

    const cached=getAvatar();
    if(cached)applyAvatar(cached);
    if(profile.avatar_url)applyAvatar(profile.avatar_url);

    const circle=document.getElementById('avatarCircle');
    const hoverLayer=document.getElementById('avatarHover');
    const fileInput=document.getElementById('avatarFileInput');
    const status=document.getElementById('avatarStatus');

    if(circle&&hoverLayer){
        circle.addEventListener('mouseenter',()=>hoverLayer.style.display='flex');
        circle.addEventListener('mouseleave',()=>hoverLayer.style.display='none');
        circle.addEventListener('click',()=>fileInput?.click());
    }

    if(fileInput){
        fileInput.addEventListener('change',async e=>{
            const file=e.target.files[0];if(!file)return;
            const reader=new FileReader();
            reader.onload=ev=>applyAvatar(ev.target.result);
            reader.readAsDataURL(file);
            if(status){status.textContent='Uploading...';status.style.color='#a8a199';}
            const result=await profileFn.uploadAvatar(file);
            if(status){
                if(result.status===200){
                    status.textContent='✓ Saved';status.style.color='#1fd4c8';
                    if(result.data?.avatar_url)saveAvatar(result.data.avatar_url);
                    setTimeout(()=>status.textContent='',2500);
                } else {status.textContent='✗ Error';status.style.color='#ef4444';}
            }
            fileInput.value='';
        });
    }

    // ── Delete avatar ──
    if(deleteAvatarBtn){
        deleteAvatarBtn.addEventListener('click',async e=>{
            e.stopPropagation(); // щоб не тригернуло fileInput через circle
            if(!confirm('Remove your avatar?'))return;
            if(status){status.textContent='Removing...';status.style.color='#a8a199';}
            const result=await profileFn.deleteAvatar();
            if(result.status===200){
                localStorage.removeItem('topspots_avatar');
                applyAvatar(null); // скидає на іконку і ховає кнопку
                if(status){status.textContent='✓ Removed';status.style.color='#1fd4c8';setTimeout(()=>status.textContent='',2500);}
            } else {
                if(status){status.textContent='✗ Error';status.style.color='#ef4444';}
            }
        });
    }

    // ── Tabs ──
    const tabBtns=document.querySelectorAll('.profile-tab-btn');
    tabBtns.forEach(btn=>{
        btn.addEventListener('click',()=>{
            tabBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
            document.querySelectorAll('.profile-tab-content').forEach(c=>c.style.display='none');
            const tab=document.getElementById(`tab-${btn.dataset.tab}`);
            if(tab)tab.style.display='block';
            if(btn.dataset.tab==='stats')initProfileStats(profile);
        });
    });

    // ── Edit mode ──
    const editBtn=document.getElementById('editProfileBtn');
    const viewMode=document.getElementById('profileViewMode');
    const editMode=document.getElementById('profileEditMode');
    const cancelBtn=document.getElementById('cancelEditBtn');
    const saveBtn=document.getElementById('saveProfileBtn');
    const bioEl=document.getElementById('editBio');
    const counter=document.getElementById('bioCounter');
    const answer=document.getElementById('editAnswer');

    editBtn?.addEventListener('click',e=>{
        e.stopPropagation();
        tabBtns.forEach(b=>b.classList.remove('active'));
        document.querySelector('.profile-tab-btn[data-tab="about"]')?.classList.add('active');
        document.querySelectorAll('.profile-tab-content').forEach(c=>c.style.display='none');
        document.getElementById('tab-about').style.display='block';
        document.getElementById('editUsername').value=profile.username||'';
        document.getElementById('editLocation').value=profile.location||'';
        if(bioEl){bioEl.value=profile.bio||'';if(counter)counter.textContent=`${bioEl.value.length}/300`;}
        viewMode.style.display='none';editMode.style.display='block';editBtn.style.display='none';
    });

    bioEl?.addEventListener('input',()=>{if(counter)counter.textContent=`${bioEl.value.length}/300`;});
    cancelBtn?.addEventListener('click',()=>{viewMode.style.display='block';editMode.style.display='none';editBtn.style.display='';if(answer)answer.innerHTML='';});

    saveBtn?.addEventListener('click',async()=>{
        const newName=document.getElementById('editUsername')?.value?.trim();
        const newLoc=document.getElementById('editLocation')?.value?.trim();
        const newBio=bioEl?.value?.trim();
        if(!newName){if(answer)answer.innerHTML='<span style="color:#ef4444;">Name cannot be empty</span>';return;}
        saveBtn.disabled=true;
        const result=await profileFn.updateProfile({username:newName,location:newLoc,bio:newBio});
        saveBtn.disabled=false;
        if(result.status===200){
            profile.username=result.data.username;profile.location=result.data.location;profile.bio=result.data.bio;
            set('profileName',profile.username);
            set('profileLocationText',profile.location||'Not specified');
            set('profileBioText',profile.bio||'Tell something about yourself...');
            viewMode.style.display='block';editMode.style.display='none';editBtn.style.display='';
            if(answer)answer.innerHTML='';
        } else if(result.status===409){
            if(answer)answer.innerHTML='<span style="color:#ef4444;">This name is already taken</span>';
        } else {
            if(answer)answer.innerHTML='<span style="color:#ef4444;">Server error</span>';
        }
    });
}

let statsInited=false;

function initProfileStats(profile){
    if(statsInited)return;
    statsInited=true;

    const searchRows=Array.isArray(profile?.search_stats)?profile.search_stats:[];
    const catRows=Array.isArray(profile?.search_summary)?profile.search_summary:[];

    const histEl=document.getElementById('profileSearchHistory');
    if(histEl){
        if(!searchRows.length){histEl.innerHTML='<li style="padding:12px 0;color:#a8a199;font-size:13px;">No search history</li>';}
        else histEl.innerHTML=searchRows.slice(0,20).map(e=>{
            const date=e.created_at?new Date(e.created_at).toLocaleString('en-GB',{hour12:false}):'—';
            return `<li style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                <strong style="color:#f0ece4;">${e.query_text||'Query'}</strong><br>
                <span style="opacity:.75;font-size:12px;">${e.category||'General'} · ${e.source==='google'?'🌐 Google':'💾 Cache'} · ${e.results_count??'—'} results</span><br>
                <span style="opacity:.65;font-size:11px;">${date}</span>
            </li>`;
        }).join('');
    }

    const catEl=document.getElementById('profileSearchCategorySummary');
    if(catEl){
        if(!catRows.length){catEl.innerHTML='<li style="padding:12px 0;color:#a8a199;font-size:13px;">No category data</li>';}
        else catEl.innerHTML=catRows.map(e=>`
            <li style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;gap:12px;">
                <span style="color:#f0ece4;">${e.category||'Other'}</span>
                <span style="color:#a8a199;">${Number(e.searches||0)} times</span>
                <span style="color:#6b6560;font-size:11px;">avg ${e.avg_results!=null?Number(e.avg_results).toFixed(1):'—'}</span>
            </li>`).join('');
    }

    const total=catRows.reduce((s,i)=>s+Number(i.searches||0),0);
    const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    const visited=profile?.places_visited||0;
    const visitedEl=document.getElementById('statsVisited');
    if(visitedEl&&visited>0){let s=0;const iv=setInterval(()=>{s++;visitedEl.textContent=Math.min(Math.round(visited*s/40),visited);if(s>=40)clearInterval(iv);},20);}
    else if(visitedEl)visitedEl.textContent='0';
    setText('statsMemberSince',profile?.member_since||'—');
    const loc=profile?.location||'—';
    setText('statsLocation',loc.length>14?loc.split(',')[0]:loc);
    setText('statsRating',total>0?(3.5+Math.min(1.5,total*.05)).toFixed(1):'—');
    setText('donutTotal',total);

    // Bar chart
    const countByYear={};
    const months=['J','F','M','A','M','J','J','A','S','O','N','D'];
    searchRows.forEach(e=>{
        if(!e.created_at)return;
        const d=new Date(e.created_at);if(isNaN(d))return;
        const yr=String(d.getFullYear()),mi=d.getMonth();
        if(!countByYear[yr])countByYear[yr]=Array(12).fill(0);
        countByYear[yr][mi]++;
    });
    const years=Object.keys(countByYear).sort((a,b)=>b-a);
    if(!years.length){const yr=String(new Date().getFullYear());countByYear[yr]=Array(12).fill(0);years.push(yr);}

    const barCanvas=document.getElementById('profileBarChart');
    if(barCanvas){
        const ctx=barCanvas.getContext('2d'),dpr=window.devicePixelRatio||1;
        const W=barCanvas.offsetWidth||400,H=160;
        barCanvas.width=W*dpr;barCanvas.height=H*dpr;
        ctx.setTransform(1,0,0,1,0,0);ctx.scale(dpr,dpr);

        function drawBar(data){
            const max=Math.max(...data,1)*1.15;
            const pL=32,pR=12,pT=14,pB=28,cW=W-pL-pR,cH=H-pT-pB;
            const bW=(cW/data.length)*.55,gap=(cW/data.length)*.45;
            const t0=performance.now();
            function frame(now){
                const prog=Math.min((now-t0)/800,1),ease=1-Math.pow(1-prog,3);
                ctx.clearRect(0,0,W,H);
                ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1;
                for(let g=0;g<=4;g++){const y=pT+cH-(g/4)*cH;ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();}
                data.forEach((v,i)=>{
                    const x=pL+i*(cW/data.length)+gap/2,bH=(v/max)*cH*ease,y=pT+cH-bH;
                    const gr=ctx.createLinearGradient(x,y,x,pT+cH);
                    gr.addColorStop(0,'#c9a84c');gr.addColorStop(1,'rgba(201,168,76,0.1)');
                    ctx.fillStyle=gr;
                    const r=Math.min(4,bW/2);
                    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+bW-r,y);
                    ctx.quadraticCurveTo(x+bW,y,x+bW,y+r);ctx.lineTo(x+bW,pT+cH);
                    ctx.lineTo(x,pT+cH);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();
                    if(v>0){ctx.fillStyle='rgba(201,168,76,.8)';ctx.font='9px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText(v,x+bW/2,y-4);}
                    ctx.fillStyle='rgba(168,161,153,.5)';ctx.font='10px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText(months[i],x+bW/2,H-6);
                });
                if(prog<1)requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }

        const container=document.getElementById('periodTabsContainer');
        if(container){
            container.innerHTML=years.map((y,i)=>`<button class="period-tab${i===0?' active':''}" data-period="${y}">${y}</button>`).join('');
            container.querySelectorAll('.period-tab').forEach(tab=>{
                tab.addEventListener('click',()=>{
                    container.querySelectorAll('.period-tab').forEach(x=>x.classList.remove('active'));
                    tab.classList.add('active');
                    drawBar(countByYear[tab.dataset.period]||Array(12).fill(0));
                });
            });
        }
        drawBar(countByYear[years[0]]||Array(12).fill(0));
    }

    // Donut chart
    const donutCanvas=document.getElementById('profileDonutChart');
    if(donutCanvas){
        const ctx=donutCanvas.getContext('2d'),dpr=window.devicePixelRatio||1,sz=140;
        donutCanvas.width=sz*dpr;donutCanvas.height=sz*dpr;
        ctx.setTransform(1,0,0,1,0,0);ctx.scale(dpr,dpr);
        const colors=['#ff6b4a','#1fd4c8','#a78bfa','#c9a84c','#e8c97a'];
        const segs=catRows.map((e,i)=>({label:e.category||'Other',value:Number(e.searches||0),color:colors[i%colors.length]})).filter(s=>s.value>0);
        const tot=segs.reduce((s,i)=>s+i.value,0)||1;
        const cx=sz/2,cy=sz/2,oR=sz/2-6,iR=sz/2-28;
        const t0=performance.now();
        function frame(now){
            const prog=Math.min((now-t0)/900,1),ease=1-Math.pow(1-prog,3);
            ctx.clearRect(0,0,sz,sz);
            if(!segs.length){
                ctx.beginPath();ctx.arc(cx,cy,oR,0,Math.PI*2);ctx.arc(cx,cy,iR,0,Math.PI*2,true);
                ctx.fillStyle='rgba(255,255,255,.05)';ctx.fill();
            } else {
                let start=-Math.PI/2;
                segs.forEach(seg=>{
                    const sl=(seg.value/tot)*2*Math.PI*ease;
                    ctx.beginPath();ctx.moveTo(cx+iR*Math.cos(start),cy+iR*Math.sin(start));
                    ctx.arc(cx,cy,oR,start,start+sl);ctx.arc(cx,cy,iR,start+sl,start,true);
                    ctx.closePath();ctx.fillStyle=seg.color;ctx.fill();start+=sl;
                });
            }
            if(prog<1)requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        const legend=document.getElementById('profileDonutLegend');
        if(legend){
            if(!segs.length)legend.innerHTML='<div style="color:#a8a199;font-size:13px;">No category stats</div>';
            else legend.innerHTML=segs.map(seg=>`
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="width:10px;height:10px;border-radius:3px;background:${seg.color};flex-shrink:0;"></span>
                    <span style="font-size:12px;color:#a8a199;flex:1;">${seg.label}</span>
                    <span style="font-size:12px;color:#f0ece4;font-weight:600;">${((seg.value/tot)*100).toFixed(0)}%</span>
                </div>`).join('');
        }
    }

    // Top queries bars
    const cityEl=document.getElementById('profileCityBars');
    if(cityEl){
        const counts=searchRows.reduce((acc,e)=>{const k=e.query_text||'Unknown';acc[k]=(acc[k]||0)+1;return acc;},{});
        const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5)
            .map(([n,c],i)=>({name:n,count:c,color:['#c9a84c','#1fd4c8','#a78bfa','#ff6b4a','#e8c97a'][i]}));
        if(!top.length){cityEl.innerHTML='<div style="color:#a8a199;font-size:13px;padding:12px 0;">No top queries yet.</div>';}
        else{
            const mx=top[0].count||1;
            cityEl.innerHTML='';
            top.forEach((item,i)=>{
                const row=document.createElement('div');
                row.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:10px;';
                row.innerHTML=`
                    <span style="width:70px;font-size:12px;color:#a8a199;flex-shrink:0;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.name}">${item.name}</span>
                    <div style="flex:1;background:rgba(255,255,255,.04);border-radius:6px;height:8px;overflow:hidden;">
                        <div style="width:0%;height:100%;border-radius:6px;background:${item.color};transition:width .9s ease ${i*80}ms;"></div>
                    </div>
                    <span style="width:24px;font-size:12px;color:#f0ece4;font-weight:600;">${item.count}</span>`;
                cityEl.appendChild(row);
                setTimeout(()=>row.querySelector('div>div').style.width=`${(item.count/mx)*100}%`,100);
            });
        }
    }
}

// ============================================================
// SETTINGS
// ============================================================
async function initSettingsPage(){
    const profile=await profileFn.getProfile();
    const settings=await profileFn.getSettings()||{};
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v??'—';};

    set('settingsEmail',profile?.email||'—');
    set('passwordFormTitle',profile?.provider==='google'?'Change Password / Google':'Change Password');
    set('passwordFormHint',profile?.provider==='google'
        ?'Google accounts can set a new password without the old one.'
        :'Enter your current and new passwords to change.');

    const toggle=(id,v)=>{const el=document.getElementById(id);if(el)el.checked=!!v;};
    toggle('toggle_notifications_email',settings.notifications_email);
    toggle('toggle_notifications_push',settings.notifications_push);
    toggle('toggle_notifications_nearby',settings.notifications_nearby);
    toggle('toggle_privacy_public',settings.privacy_public);
    toggle('toggle_privacy_location',settings.privacy_location);

    ['toggle_notifications_email','toggle_notifications_push','toggle_notifications_nearby','toggle_privacy_public','toggle_privacy_location'].forEach(id=>{
        const el=document.getElementById(id);if(!el)return;
        el.addEventListener('change',async()=>{
            const ok=await profileFn.updateSetting(id.replace('toggle_',''),el.checked);
            if(!ok)showToast('Failed to save setting','error');
        });
    });

    document.getElementById('deleteAccountBtn')?.addEventListener('click',()=>{
        document.getElementById('deleteConfirmBlock').style.display='block';
    });
    document.getElementById('cancelDeleteBtn')?.addEventListener('click',()=>{
        document.getElementById('deleteConfirmBlock').style.display='none';
    });
    document.getElementById('confirmDeleteBtn')?.addEventListener('click',async function(){
        this.disabled=true;this.textContent='Deleting...';
        await profileFn.deleteAccount();
        this.disabled=false;this.textContent='Yes, Delete';
    });

    const form=document.getElementById('changePasswordForm');
    const openBtn=document.getElementById('openChangePasswordBtn');
    const cancelBtn=document.getElementById('cancelChangePasswordBtn');
    const confirmBtn=document.getElementById('confirmChangePasswordBtn');

    if(profile?.provider==='google'){
        const w=document.getElementById('currentPasswordWrap');if(w)w.style.display='none';
    }

    openBtn?.addEventListener('click',()=>{form.style.display='block';openBtn.disabled=true;});
    cancelBtn?.addEventListener('click',()=>{
        form.style.display='none';openBtn.disabled=false;
        ['currentPasswordInput','newPasswordInput','confirmPasswordInput'].forEach(id=>{
            const el=document.getElementById(id);if(el)el.value='';
        });
    });
    confirmBtn?.addEventListener('click',async()=>{
        const cur=document.getElementById('currentPasswordInput')?.value.trim();
        const nw=document.getElementById('newPasswordInput')?.value.trim();
        const conf=document.getElementById('confirmPasswordInput')?.value.trim();
        const ans=document.getElementById('passwordChangeAnswer');
        if(!nw||nw.length<8){if(ans)ans.textContent='Password must be at least 8 characters.';return;}
        if(nw!==conf){if(ans)ans.textContent='Passwords do not match.';return;}
        confirmBtn.disabled=true;if(ans)ans.textContent='Saving...';
        const result=await profileFn.changePassword(cur,nw);
        confirmBtn.disabled=false;
        if(result.status===200){if(ans)ans.textContent='Password updated.';form.style.display='none';openBtn.disabled=false;}
        else{if(ans)ans.textContent=result.data?.message||'Failed to change password.';}
    });


}

// ============================================================
// NAVIGATION
// ============================================================
const updateActiveMenu=key=>{
    document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active-nav',el.getAttribute('data-page')===key));
    document.querySelectorAll('.mobile-nav-item').forEach(el=>el.classList.toggle('active',el.getAttribute('data-page')===key));
};

const bindNav=()=>{
    document.querySelectorAll('[data-page]').forEach(btn=>{
        btn.onclick=e=>{e.preventDefault();navigateTo(btn.getAttribute('data-page'));};
    });
};

const navigateTo=(key,push=true)=>{
    if(!pages[key])return;
    hidePortal();
    if(key!=='profile') statsInited=false;

    const content=typeof pages[key]==='function'?pages[key]():pages[key];
    mainPageFunctions.loadPageContent(content);

    const main=document.getElementById('main-page-content');
    if(main)animatePageIn(main);
    if(push)window.history.pushState({page:key},'',`#${key}`);
    updateActiveMenu(key);
    bindNav();
    window.scrollTo({top:0,behavior:'smooth'});

    if(key==='dashboard')initDashboard();
    else if(key==='shopping')initShoppingPage();
    else if(key==='nearby')initNearbyPage();
    else if(key==='profile')initProfilePage();
    else if(key==='settings')initSettingsPage();
};

window.onpopstate=e=>navigateTo(e.state?.page||'dashboard',false);

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded',()=>{
    mountAIWidget();
    mountSuggestionsPortal();
    initLoggedControls();
    navigateTo(window.location.hash.replace('#','')||'dashboard',false);
});