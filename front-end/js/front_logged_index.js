import { mainPageFunctionsHandler, profileFunctionsHandler } from "./functions.js";
const mainPageFunctions = new mainPageFunctionsHandler();
const profileFn = new profileFunctionsHandler();

// ============================================================
// AI WIDGET — монтується ОДИН РАЗ в <body>
// ============================================================
function mountAIWidget() {
    if (document.getElementById('ai-launcher')) return;
    const root = document.createElement('div');
    root.id = 'ai-global-root';
    root.innerHTML = `
    <button id="ai-launcher" class="ai-launcher" aria-label="Відкрити AI-помічник">
        <i class="fas fa-robot"></i>
        <span class="ai-launcher-pulse"></span>
    </button>
    <div id="ai-widget-container" class="ai-widget" role="dialog" aria-label="AI-помічник">
        <div class="ai-header">
            <div class="ai-info">
                <div class="ai-status-dot"></div>
                <div>
                    <h4 id="aiStatus">Онлайн</h4>
                    <p id="cacheInfo">Завантаження...</p>
                </div>
            </div>
            <div class="ai-controls">
                <button id="clearChatBtn" title="Очистити кеш"><i class="fas fa-trash-alt"></i></button>
                <button id="minimizeChat" title="Згорнути">—</button>
            </div>
        </div>
        <div id="aiBody" class="ai-body">
            <div id="chatWindow" class="chat-messages"></div>
            <div id="aiSuggestions" class="ai-suggestions">
                <span class="suggestion">Найкращі ресторани Києва?</span>
                <span class="suggestion">Покажи готелі поруч</span>
                <span class="suggestion">Що цікавого у Львові?</span>
            </div>
        </div>
        <div class="ai-footer">
            <div class="input-wrapper">
                <input type="text" id="chatInput" placeholder="Запитайте будь-що..." autocomplete="off">
                <button id="sendBtn"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(root);
    initAIChat();
}

// ============================================================
// SUGGESTIONS PORTAL
// ============================================================
function mountSuggestionsPortal() {
    if (document.getElementById('search-suggestions-portal')) return;
    const portal = document.createElement('ul');
    portal.id = 'search-suggestions-portal';
    portal.className = 'suggestions-portal';
    document.body.appendChild(portal);

    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#search-suggestions-portal') && !e.target.closest('.search-section')) {
            portal.classList.remove('active');
        }
    });
}

function showPortal(items, anchorEl, onSelect) {
    const portal = document.getElementById('search-suggestions-portal');
    if (!portal || !items.length) { portal?.classList.remove('active'); return; }
    const rect = anchorEl.getBoundingClientRect();
    portal.style.top   = (rect.bottom + 6) + 'px';
    portal.style.left  = rect.left + 'px';
    portal.style.width = rect.width + 'px';
    portal.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.description || item.name || item;
        li.addEventListener('mousedown', e => { e.preventDefault(); portal.classList.remove('active'); onSelect(item); });
        portal.appendChild(li);
    });
    portal.classList.add('active');
}

function hidePortal() {
    document.getElementById('search-suggestions-portal')?.classList.remove('active');
}

function repositionPortal(anchorEl) {
    const portal = document.getElementById('search-suggestions-portal');
    if (!portal?.classList.contains('active') || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    portal.style.top  = (rect.bottom + 6) + 'px';
    portal.style.left = rect.left + 'px';
    portal.style.width = rect.width + 'px';
}

// ============================================================
// PAGES
// ============================================================
const pages = {

// ─── DASHBOARD ───────────────────────────────────────────────
dashboard: `
<div class="dashboard-wrapper fade-in">
    <div class="hero-section" style="background:linear-gradient(135deg,#701a75 0%,#2e1065 100%);padding:80px 40px;border-radius:40px;margin-bottom:50px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 40px rgba(0,0,0,0.4);">
        <div style="position:relative;z-index:2;">
            <h1 id="dashboardGreeting" style="font-weight:800;margin-bottom:15px;color:#fff;font-size:clamp(26px,5vw,48px);">Привіт! 👋</h1>
            <p style="font-size:clamp(15px,2vw,20px);opacity:0.8;color:#e2e8f0;">Готовий відкрити нові місця сьогодні?</p>
        </div>
        <div style="position:absolute;top:-50px;right:-50px;width:250px;height:250px;background:#c026d3;filter:blur(120px);opacity:0.3;"></div>
        <div class="hero-particles"></div>
    </div>

    <div class="top-cards-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-bottom:50px;">
        <div class="mini-card tilt-card" data-page="favorites" style="background:#1e293b;padding:40px 30px;border-radius:35px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid rgba(255,255,255,0.05);">
            <span style="font-weight:700;font-size:18px;color:#f1f5f9;">Улюблені</span>
            <div style="background:#fb7185;width:60px;height:60px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(251,113,133,0.3);color:white;font-size:24px;"><i class="fas fa-heart"></i></div>
        </div>
        <div class="mini-card tilt-card" data-page="photos" style="background:#1e293b;padding:40px 30px;border-radius:35px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid rgba(255,255,255,0.05);">
            <span style="font-weight:700;font-size:18px;color:#f1f5f9;">Статистика</span>
            <div style="background:#38bdf8;width:60px;height:60px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(56,189,248,0.3);color:white;font-size:24px;"><i class="fas fa-chart-bar"></i></div>
        </div>
        <div class="mini-card tilt-card" style="background:#1e293b;padding:40px 30px;border-radius:35px;display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(255,255,255,0.05);">
            <span style="font-weight:700;font-size:18px;color:#f1f5f9;">Поради</span>
            <div style="background:#a78bfa;width:60px;height:60px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(167,139,250,0.3);color:white;font-size:24px;"><i class="fas fa-magic"></i></div>
        </div>
    </div>

    <div class="main-options-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:50px;">
        <div class="option-card tilt-card" style="background:#1e293b;padding:40px;border-radius:40px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.05);">
            <div style="background:#fbbf24;min-width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:30px;color:white;"><i class="fas fa-chart-line"></i></div>
            <div><h3 style="margin:0;font-size:22px;color:#fff;font-weight:800;">Тренди</h3><p style="margin:5px 0 0;font-size:14px;color:#94a3b8;">Популярне зараз</p></div>
        </div>
        <div class="option-card tilt-card" data-page="nearby" style="background:#1e293b;padding:40px;border-radius:40px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.05);cursor:pointer;">
            <div style="background:#10b981;min-width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:30px;color:white;"><i class="fas fa-location-dot"></i></div>
            <div><h3 style="margin:0;font-size:22px;color:#fff;font-weight:800;">Поруч</h3><p style="margin:5px 0 0;font-size:14px;color:#94a3b8;">Місця неподалік</p></div>
        </div>
    </div>

    <div class="search-wrapper">
        <div class="search-bar">
            <div class="search-section">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                <input type="text" id="searchInput" placeholder="Пошук міст та місць..." autocomplete="off" />
            </div>
            <button class="search-button" id="mainSearchBtn">Шукати</button>
            <div class="search-categories">
                <div class="search-category-list-own">
                    <span class="search-category" data-type="restaurant">🍽️ Ресторани</span>
                    <span class="search-category" data-type="cafe">☕ Кафе</span>
                    <span class="search-category" data-type="lodging">🏨 Готелі</span>
                    <span class="search-category" data-type="museum">🏛️ Музеї</span>
                    <span class="search-category" data-type="shopping_mall">🛍️ ТЦ</span>
                    <span class="search-category" data-type="park">🌳 Парки</span>
                </div>
            </div>
        </div>
    </div>

    <div class="scroll-container-wrapper">
        <button class="scroll-button left" id="scrollLeft">&#10094;</button>
        <div class="scroll-container" id="cityContainer"></div>
        <button class="scroll-button right" id="scrollRight">&#10095;</button>
        <div class="progress-bar-container">
            <div class="progress-line-track"><div class="progress-line-thumb" id="scrollThumb"></div></div>
        </div>
    </div>

    <h2 style="margin:40px 0 30px;font-size:28px;font-weight:800;color:#fff;font-family:'Sora',sans-serif;">Категорії</h2>
    <div class="grid-container" style="display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-bottom:50px;">
        <div class="cat-card" data-category="restaurant" style="background:#1e293b;padding:45px 20px;border-radius:40px;text-align:center;border:1px solid rgba(255,255,255,0.05);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:0.3s;">
            <div style="background:#f43f5e;width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:28px;color:white;"><i class="fas fa-utensils"></i></div>
            <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Sora',sans-serif;">Ресторани</span>
        </div>
        <div class="cat-card" data-category="lodging" style="background:#1e293b;padding:45px 20px;border-radius:40px;text-align:center;border:1px solid rgba(255,255,255,0.05);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:0.3s;">
            <div style="background:#3b82f6;width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:28px;color:white;"><i class="fas fa-hotel"></i></div>
            <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Sora',sans-serif;">Готелі</span>
        </div>
        <div class="cat-card" data-category="park" style="background:#1e293b;padding:45px 20px;border-radius:40px;text-align:center;border:1px solid rgba(255,255,255,0.05);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:0.3s;">
            <div style="background:#10b981;width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:28px;color:white;"><i class="fas fa-tree"></i></div>
            <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Sora',sans-serif;">Парки</span>
        </div>
        <div class="cat-card" data-category="museum" style="background:#1e293b;padding:45px 20px;border-radius:40px;text-align:center;border:1px solid rgba(255,255,255,0.05);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:0.3s;">
            <div style="background:#8b5cf6;width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:28px;color:white;"><i class="fas fa-landmark"></i></div>
            <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Sora',sans-serif;">Музеї</span>
        </div>
        <div class="cat-card" data-category="cafe" style="background:#1e293b;padding:45px 20px;border-radius:40px;text-align:center;border:1px solid rgba(255,255,255,0.05);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:0.3s;">
            <div style="background:#f59e0b;width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:28px;color:white;"><i class="fas fa-mug-hot"></i></div>
            <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Sora',sans-serif;">Кафе</span>
        </div>
        <div class="cat-card" data-category="shopping_mall" style="background:#1e293b;padding:45px 20px;border-radius:40px;text-align:center;border:1px solid rgba(255,255,255,0.05);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:0.3s;">
            <div style="background:#ec4899;width:70px;height:70px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:28px;color:white;"><i class="fas fa-shopping-bag"></i></div>
            <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Sora',sans-serif;">Магазини</span>
        </div>
    </div>
</div>`,

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
                        <div id="avatarHover" style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);border-radius:50%;align-items:center;justify-content:center;flex-direction:column;gap:4px;">
                            <i class="fas fa-camera" style="color:#fff;font-size:20px;"></i>
                            <span style="color:#fff;font-size:10px;font-weight:600;">Змінити</span>
                        </div>
                    </div>
                    <div id="avatarStatus" style="position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);font-size:11px;white-space:nowrap;font-weight:600;"></div>
                </div>
                <div class="profile-titles">
                    <h1 class="profile-name" id="profileName">...</h1>
                    <p class="profile-location"><i class="fas fa-map-marker-alt"></i> <span id="profileLocationText">—</span></p>
                </div>
                <button class="edit-profile-btn" id="editProfileBtn"><i class="fas fa-edit"></i> Редагувати</button>
            </div>

            <div class="profile-stats-grid">
                <div class="stat-box purple">
                    <div class="stat-icon"><i class="fas fa-map-marked-alt"></i></div>
                    <div class="stat-text"><p>Відвідано</p><span id="statVisited">—</span></div>
                </div>
                <div class="stat-box blue">
                    <div class="stat-icon"><i class="fas fa-envelope"></i></div>
                    <div class="stat-text"><p>Email</p><span id="statEmail" style="font-size:12px;word-break:break-all;">—</span></div>
                </div>
                <div class="stat-box green">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-text"><p>Учасник з</p><span id="statSince">—</span></div>
                </div>
            </div>

            <div class="profile-contacts">
                <div class="contact-item"><i class="far fa-envelope"></i> <span id="contactEmail">—</span></div>
                <div class="contact-item" id="googleBadge" style="display:none;"><i class="fab fa-google" style="color:#ea4335;"></i> <span>Підключено Google</span></div>
            </div>

            <hr class="profile-divider">

            <div id="profileViewMode" class="profile-about">
                <h3>Про себе</h3>
                <p id="profileBioText" style="color:#94a3b8;font-style:italic;">—</p>
            </div>

            <div id="profileEditMode" style="display:none;padding:24px;background:rgba(17,24,39,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:20px;margin-top:16px;">
                <h3 style="margin-bottom:20px;color:#f1f5f9;">Редагування профілю</h3>
                <div style="display:flex;flex-direction:column;gap:14px;">
                    <div>
                        <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;display:block;margin-bottom:6px;">Ім'я користувача</label>
                        <input type="text" id="editUsername" maxlength="50" placeholder="Твоє ім'я"
                            style="width:100%;padding:12px 16px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:14px;color:#f1f5f9;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;display:block;margin-bottom:6px;">Місто</label>
                        <input type="text" id="editLocation" maxlength="100" placeholder="Наприклад: Київ, Україна"
                            style="width:100%;padding:12px 16px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:14px;color:#f1f5f9;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div style="position:relative;">
                        <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;display:block;margin-bottom:6px;">Про себе <span style="color:#475569;">(макс. 300)</span></label>
                        <textarea id="editBio" maxlength="300" rows="4" placeholder="Розкажи про себе..."
                            style="width:100%;padding:12px 16px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:14px;color:#f1f5f9;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>
                        <span id="bioCounter" style="position:absolute;bottom:10px;right:12px;font-size:11px;color:#475569;">0/300</span>
                    </div>
                    <div id="editAnswer" style="font-size:13px;min-height:18px;"></div>
                    <div style="display:flex;gap:10px;">
                        <button id="saveProfileBtn" style="padding:10px 22px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-check"></i> Зберегти
                        </button>
                        <button id="cancelEditBtn" style="padding:10px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-times"></i> Скасувати
                        </button>
                    </div>
                </div>
            </div>

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
            <h1 class="glitch-text">Локації поруч</h1>
            <div class="hero-separator"></div>
            <p id="nearbyStatus">Дозвольте доступ до геолокації, щоб побачити цікаві місця навколо</p>
        </div>
    </header>
    <div class="nearby-container">
        <aside class="nearby-sidebar">
            <div class="filter-glass-card">
                <div class="card-head"><i class="fas fa-sliders-h"></i><h3>Налаштування радару</h3></div>
                <div class="range-group">
                    <div class="range-info"><span>Радіус пошуку</span><b id="radiusVal">12 км</b></div>
                    <input type="range" id="nearbyRadius" min="1" max="30" value="12" class="modern-slider">
                </div>
                <div class="category-chips">
                    <button class="chip active" data-type="tourist_attraction">Пам'ятки</button>
                    <button class="chip" data-type="park">Парки</button>
                    <button class="chip" data-type="shopping_mall">ТЦ</button>
                    <button class="chip" data-type="museum">Музеї</button>
                    <button class="chip" data-type="restaurant">Ресторани</button>
                </div>
                <button id="startNearbySearch" class="glow-btn"><i class="fas fa-crosshairs"></i> Сканувати вручну</button>
            </div>
        </aside>
        <main class="nearby-results">
            <div id="nearbyGrid" class="places-grid-v2"><div class="nearby-placeholder"></div></div>
        </main>
    </div>
</div>`,

// ─── STATISTICS ──────────────────────────────────────────────
photos: `
<div class="dashboard-wrapper fade-in" id="stats-page">
    <header class="settings-hero" style="margin-bottom:10px;">
        <div class="hero-bg-glow" style="background:radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%);"></div>
        <div class="hero-content">
            <div class="badge-premium" style="border-color:rgba(16,185,129,0.35);color:#10b981;background:rgba(16,185,129,0.08);"><i class="fas fa-chart-line"></i> Analytics</div>
            <h1 style="font-size:clamp(2rem,5vw,3.2rem);font-weight:800;margin:10px 0;background:linear-gradient(135deg,#fff 30%,#10b981 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-1px;font-family:'Sora',sans-serif;">Моя Статистика</h1>
            <div class="hero-separator" style="background:linear-gradient(90deg,#10b981,transparent);"></div>
            <p style="color:#64748b;font-size:1rem;max-width:480px;">Аналітика твоїх подорожей — графіки активності, хітмапи та інсайти</p>
        </div>
    </header>
    <div class="stats-kpi-row">
        <div class="kpi-card"><div class="kpi-icon" style="background:rgba(16,185,129,0.15);color:#10b981;"><i class="fas fa-map-marked-alt"></i></div><div class="kpi-body"><span class="kpi-val" data-target="124">0</span><span class="kpi-label">Місць відвідано</span></div><div class="kpi-trend up"><i class="fas fa-arrow-up"></i> +12 цього місяця</div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:rgba(56,189,248,0.15);color:#38bdf8;"><i class="fas fa-city"></i></div><div class="kpi-body"><span class="kpi-val" data-target="18">0</span><span class="kpi-label">Міст досліджено</span></div><div class="kpi-trend up"><i class="fas fa-arrow-up"></i> +3 нових</div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:rgba(192,38,211,0.15);color:#c026d3;"><i class="fas fa-camera"></i></div><div class="kpi-body"><span class="kpi-val" data-target="341">0</span><span class="kpi-label">Фотографій</span></div><div class="kpi-trend up"><i class="fas fa-arrow-up"></i> +47 цього тижня</div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:rgba(251,191,36,0.15);color:#fbbf24;"><i class="fas fa-star"></i></div><div class="kpi-body"><span class="kpi-val" data-target="4.8" data-float="true">0</span><span class="kpi-label">Середній рейтинг</span></div><div class="kpi-trend neutral"><i class="fas fa-minus"></i> Стабільно</div></div>
    </div>
    <div class="charts-main-row">
        <div class="chart-card wide">
            <div class="chart-card-head">
                <div><h3 class="chart-title">Активність по місяцях</h3><p class="chart-sub">Кількість відвіданих місць</p></div>
                <div class="chart-period-tabs">
                    <button class="period-tab active" data-period="2024">2024</button>
                    <button class="period-tab" data-period="2023">2023</button>
                </div>
            </div>
            <div class="bar-chart-wrap"><canvas id="barChartCanvas"></canvas></div>
        </div>
        <div class="chart-card narrow">
            <div class="chart-card-head"><div><h3 class="chart-title">Категорії</h3><p class="chart-sub">Розбивка по типам</p></div></div>
            <div class="donut-wrap"><canvas id="donutCanvas"></canvas><div class="donut-center-label"><span class="donut-total">124</span><span class="donut-total-sub">всього</span></div></div>
            <div class="donut-legend" id="donutLegend"></div>
        </div>
    </div>
    <div class="charts-second-row">
        <div class="chart-card heatmap-card">
            <div class="chart-card-head">
                <div><h3 class="chart-title">Теплова карта активності</h3><p class="chart-sub">Дні з відвіданими місцями за рік</p></div>
                <div class="heatmap-legend"><span style="color:#64748b;">менше</span><div class="hm-grad"></div><span style="color:#10b981;">більше</span></div>
            </div>
            <div class="heatmap-grid" id="heatmapGrid"></div>
            <div class="heatmap-months" id="heatmapMonths"></div>
        </div>
        <div class="chart-card cities-card">
            <div class="chart-card-head"><div><h3 class="chart-title">Топ міст</h3><p class="chart-sub">За кількістю відвіданих місць</p></div></div>
            <div class="city-bars" id="cityBars"></div>
        </div>
    </div>
    <h2 class="section-title-ach" style="margin-top:40px;"><i class="fas fa-lightbulb"></i> Інсайти</h2>
    <div class="insights-row">
        <div class="insight-card"><div class="insight-icon" style="color:#f43f5e;"><i class="fas fa-fire"></i></div><div class="insight-body"><h4>Найактивніший день</h4><p>Субота — в цей день ти відвідуєш місця вдвічі частіше</p></div></div>
        <div class="insight-card"><div class="insight-icon" style="color:#38bdf8;"><i class="fas fa-route"></i></div><div class="insight-body"><h4>Середній маршрут</h4><p>3.2 місця за одну поїздку — ти ефективний мандрівник!</p></div></div>
        <div class="insight-card"><div class="insight-icon" style="color:#fbbf24;"><i class="fas fa-crown"></i></div><div class="insight-body"><h4>Улюблена категорія</h4><p>Ресторани складають 38% всіх твоїх відвідувань</p></div></div>
        <div class="insight-card"><div class="insight-icon" style="color:#10b981;"><i class="fas fa-calendar-check"></i></div><div class="insight-body"><h4>Серія активності</h4><p>🔥 14 днів поспіль — твій особистий рекорд!</p></div></div>
    </div>
</div>`,

// ─── SETTINGS ────────────────────────────────────────────────

settings: `
<div class="dashboard-wrapper fade-in">
    <header class="settings-hero">
        <div class="hero-bg-glow"></div>
        <div class="hero-content">
            <div class="badge-premium">Система v2.4</div>
            <h1 class="glitch-text" data-text="Налаштування">Налаштування</h1>
            <div class="hero-separator"></div>
            <p>Центральна панель керування акаунтом. <span>Персоналізуйте свій досвід у Top Spots.</span></p>
        </div>
    </header>
    <div class="settings-grid">

        <section class="settings-card">
            <div class="card-head"><div class="icon-box purple"><i class="fas fa-bell"></i></div><h3>Сповіщення</h3></div>
            <div class="card-body">
                <div class="setting-item">
                    <div class="info"><span class="label">Email сповіщення</span><span class="sub-label">Отримуйте новини про нові локації на пошту</span></div>
                    <label class="ios-switch"><input type="checkbox" id="toggle_notifications_email"><span class="ios-slider"></span></label>
                </div>
                <div class="setting-item">
                    <div class="info"><span class="label">Push сповіщення</span><span class="sub-label">Миттєві повідомлення у браузері</span></div>
                    <label class="ios-switch"><input type="checkbox" id="toggle_notifications_push"><span class="ios-slider"></span></label>
                </div>
                <div class="setting-item">
                    <div class="info"><span class="label">Нові місця поруч</span><span class="sub-label">Сповіщати, коли я біля цікавої пам'ятки</span></div>
                    <label class="ios-switch"><input type="checkbox" id="toggle_notifications_nearby"><span class="ios-slider"></span></label>
                </div>
            </div>
        </section>

        <section class="settings-card">
            <div class="card-head"><div class="icon-box blue"><i class="fas fa-user-shield"></i></div><h3>Конфіденційність</h3></div>
            <div class="card-body">
                <div class="setting-item">
                    <div class="info"><span class="label">Публічний профіль</span><span class="sub-label">Дозволити іншим бачити мій профіль</span></div>
                    <label class="ios-switch"><input type="checkbox" id="toggle_privacy_public"><span class="ios-slider"></span></label>
                </div>
                <div class="setting-item">
                    <div class="info"><span class="label">Показувати локацію</span><span class="sub-label">Ваше місцезнаходження для пошуку поруч</span></div>
                    <label class="ios-switch"><input type="checkbox" id="toggle_privacy_location"><span class="ios-slider"></span></label>
                </div>
            </div>
        </section>

        <section class="settings-card full-width">
            <div class="card-head"><div class="icon-box orange"><i class="fas fa-key"></i></div><h3>Дії з акаунтом</h3></div>
            <div class="action-grid">
                <div class="action-box">
                    <div class="action-text"><h4>Змінити пароль</h4><p>Оновіть пароль для безпеки</p></div>
                    <button class="action-btn" id="openChangePasswordBtn">Оновити</button>
                </div>
                <div class="action-box">
                    <div class="action-text"><h4>Email акаунту</h4><p id="settingsEmail" style="word-break:break-all;">—</p></div>
                </div>
                <div class="action-box">
                    <div class="action-text"><h4>Завантажити дані</h4><p>Отримай копію профілю у форматі JSON</p></div>
                    <button class="action-btn secondary" id="downloadDataBtn"><i class="fas fa-download"></i></button>
                </div>
                <div class="action-box danger-zone">
                    <div class="action-text"><h4 class="text-danger">Видалити акаунт</h4><p>Це призведе до незворотного видалення даних</p></div>
                    <button class="action-btn danger" id="deleteAccountBtn">Видалити</button>
                </div>
            </div>

            <!-- Форма зміни/встановлення пароля -->
            <form id="changePasswordForm" style="display:none;margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);" onsubmit="return false;">
                <h4 style="color:#f1f5f9;margin-bottom:6px;" id="passwordFormTitle">Змінити пароль</h4>
                <p id="passwordFormHint" style="font-size:12px;color:#64748b;margin-bottom:16px;min-height:16px;"></p>
                <div style="display:flex;flex-direction:column;gap:10px;max-width:400px;">
                    <div id="currentPasswordWrap">
                        <input type="password" id="currentPasswordInput" placeholder="Поточний пароль" autocomplete="current-password"
                            style="width:100%;padding:12px 16px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:14px;color:#f1f5f9;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <input type="password" id="newPasswordInput" placeholder="Новий пароль (мін. 8 символів)" autocomplete="new-password"
                        style="width:100%;padding:12px 16px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:14px;color:#f1f5f9;font-family:inherit;box-sizing:border-box;">
                    <input type="password" id="confirmPasswordInput" placeholder="Підтвердь новий пароль" autocomplete="new-password"
                        style="width:100%;padding:12px 16px;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:14px;color:#f1f5f9;font-family:inherit;box-sizing:border-box;">
                    <div id="passwordChangeAnswer" style="font-size:13px;min-height:18px;"></div>
                    <div style="display:flex;gap:10px;">
                        <button type="button" id="confirmChangePasswordBtn"
                            style="padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-check"></i> Зберегти
                        </button>
                        <button type="button" id="cancelChangePasswordBtn"
                            style="padding:10px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#64748b;font-size:13px;cursor:pointer;">
                            <i class="fas fa-times"></i> Скасувати
                        </button>
                    </div>
                </div>
            </form>

            <!-- Підтвердження видалення -->
            <div id="deleteConfirmBlock" style="display:none;margin-top:20px;padding:20px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:16px;">
                <p style="color:#f87171;margin-bottom:14px;font-size:14px;">
                    <i class="fas fa-exclamation-triangle"></i> Ти впевнений? Ця дія <strong>незворотна</strong>.
                </p>
                <div style="display:flex;gap:10px;">
                    <button class="action-btn danger" id="confirmDeleteBtn">Так, видалити</button>
                    <button type="button" style="padding:10px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#64748b;font-size:13px;cursor:pointer;" id="cancelDeleteBtn">
                        Скасувати
                    </button>
                </div>
            </div>
        </section>
    </div>
</div>`,
};

// ============================================================
// PAGE TRANSITION
// ============================================================
function animatePageIn(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.38s cubic-bezier(.4,0,.2,1), transform 0.38s cubic-bezier(.4,0,.2,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    }));
}

// ============================================================
// TILT CARDS
// ============================================================
function initTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            card.style.transform = `perspective(600px) rotateX(${(-y/r.height)*10}deg) rotateY(${(x/r.width)*10}deg) translateY(-6px) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transition = 'transform 0.5s cubic-bezier(.4,0,.2,1)'; card.style.transform = ''; });
        card.addEventListener('mouseenter', () => { card.style.transition = 'transform 0.1s ease'; });
    });
}

// ============================================================
// AI CHAT
// ============================================================
function initAIChat() {
    const launcher    = document.getElementById('ai-launcher');
    const widget      = document.getElementById('ai-widget-container');
    const chatWindow  = document.getElementById('chatWindow');
    const input       = document.getElementById('chatInput');
    const sendBtn     = document.getElementById('sendBtn');
    const clearBtn    = document.getElementById('clearChatBtn');
    const aiStatus    = document.getElementById('aiStatus');
    const cacheInfo   = document.getElementById('cacheInfo');
    const minimizeBtn = document.getElementById('minimizeChat');
    const suggestions = document.getElementById('aiSuggestions');

    if (!launcher || !widget) return;

    const ENDPOINT  = '/chat/assistant';
    const THROTTLE  = 1200;
    const CACHE_KEY = 'topspots_chat_cache_v1';
    let lastTs = 0, cache = {};
    try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch {}

    const updateCacheDisplay = () => { if (cacheInfo) cacheInfo.textContent = `Пам'ять: ${Object.keys(cache).length} відповідей`; };

    function appendMsg(text, cls = 'bot-msg', typing = false) {
        const node = document.createElement('div');
        node.className = `msg ${cls}`;
        if (cls === 'bot-msg') {
            node.innerHTML = '<div class="msg-avatar"><i class="fas fa-robot"></i></div><div class="msg-text"></div>';
            const t = node.querySelector('.msg-text');
            if (typing) {
                let i = 0;
                const iv = setInterval(() => { if (i < text.length) { t.textContent += text[i++]; chatWindow.scrollTop = 9e9; } else clearInterval(iv); }, 22);
            } else { t.textContent = text; }
        } else { node.textContent = text; }
        chatWindow.appendChild(node);
        chatWindow.scrollTop = 9e9;
        return node;
    }

    async function handleSend() {
        const msg = input.value.trim();
        if (!msg) return;
        if (Date.now() - lastTs < THROTTLE) { if (aiStatus) { aiStatus.textContent = 'Зачекайте...'; setTimeout(() => aiStatus.textContent = 'Онлайн', 2000); } return; }
        lastTs = Date.now();
        appendMsg(msg, 'user-msg');
        input.value = '';
        if (cache[msg]) { setTimeout(() => appendMsg(cache[msg], 'bot-msg', true), 600); return; }
        const indicator = appendMsg('AI думає...', 'bot-msg typing');
        try {
            const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
            if (!r.ok) throw new Error('server error');
            const d = await r.json();
            indicator.remove();
            appendMsg(d.reply, 'bot-msg', true);
            cache[msg] = d.reply;
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            updateCacheDisplay();
        } catch { indicator.remove(); appendMsg("Вибачте, сталася помилка з'єднання.", 'bot-msg'); }
    }

    launcher.onclick = () => { widget.classList.toggle('active'); if (widget.classList.contains('active')) input.focus(); };
    minimizeBtn.onclick = e => { e.stopPropagation(); widget.classList.remove('active'); };
    document.addEventListener('click', e => { if (!e.target.closest('#ai-widget-container') && !e.target.closest('#ai-launcher')) widget.classList.remove('active'); });
    sendBtn.onclick = handleSend;
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    clearBtn.onclick = () => {
        if (confirm('Очистити всю історію чату?')) {
            cache = {}; localStorage.removeItem(CACHE_KEY);
            chatWindow.innerHTML = ''; updateCacheDisplay();
            appendMsg("Пам'ять очищена! Чим я можу допомогти?", 'bot-msg', true);
        }
    };
    if (suggestions) suggestions.querySelectorAll('.suggestion').forEach(s => { s.onclick = () => { input.value = s.textContent.trim(); handleSend(); }; });
    updateCacheDisplay();
    if (chatWindow.children.length === 0) setTimeout(() => appendMsg('Привіт! Я AI-помічник Top Spots. Допоможу знайти найкращі місця!', 'bot-msg', true), 800);
}

// ============================================================
// DASHBOARD
// ============================================================
let googleMapsPromise = null;
const modernPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Cdefs%3E%3ClinearGradient id="modernGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981;stop-opacity:1" /%3E%3Cstop offset="50%25" style="stop-color:%233b82f6;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6;stop-opacity:1" /%3E%3C/linearGradient%3E%3Cfilter id="blur"%3E%3CfeGaussianBlur in="SourceGraphic" stdDeviation="15" /%3E%3C/filter%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23modernGrad)" filter="url(%23blur)"/%3E%3Ccircle cx="400" cy="300" r="100" fill="white" opacity="0.15"/%3E%3Ctext x="50%25" y="48%25" text-anchor="middle" fill="white" font-family="system-ui" font-size="100" opacity="0.6"%3E📍%3C/text%3E%3Ctext x="50%25" y="62%25" text-anchor="middle" fill="white" font-family="system-ui" font-size="24" opacity="0.4"%3EЗавантаження...%3C/text%3E%3C/svg%3E';

let currentCategoryTypes = "(cities)";
let debounceTimer;

const defaultCities = [
    { name: "Київ",            place_id: "ChIJBUVa4U7P1EAR_kYBF9IxSXY", photo: "../img/def-sity_img/kyiv.jpg",   rating: 4.9 },
    { name: "Одеса",           place_id: "ChIJ8_S_In_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/odesa.jpg",  rating: 4.8 },
    { name: "Львів",           place_id: "ChIJay7_In_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/lviv.jpg",   rating: 4.9 },
    { name: "Харків",          place_id: "ChIJ9Wv_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/harkiv.jpg", rating: 4.7 },
    { name: "Дніпро",          place_id: "ChIJ76v_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/dnepr.jpg",  rating: 4.6 },
    { name: "Івано-Франківськ",place_id: "ChIJ_6t_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/iv-fr.jpg", rating: 4.8 },
    { name: "Запоріжжя",       place_id: "ChIJsWv_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/zaporoshe.jpg", rating: 4.5 },
    { name: "Вінниця",         place_id: "ChIJpWv_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/vinica.jpg", rating: 4.7 }
];

async function loadGoogleMapsAPI() {
    if (window.google && window.google.maps && window.google.maps.importLibrary) return true;
    if (googleMapsPromise) return googleMapsPromise;
    googleMapsPromise = (async () => {
        try {
            const response = await fetch('/api/google-maps-key');
            const data = await response.json();
            return new Promise((resolve, reject) => {
                if (document.getElementById('google-maps-sdk')) { resolve(true); return; }
                const script = document.createElement('script');
                script.id = 'google-maps-sdk';
                script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&v=weekly&loading=async`;
                script.onload = () => { const check = setInterval(() => { if (window.google?.maps?.importLibrary) { clearInterval(check); resolve(true); } }, 50); };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (err) { googleMapsPromise = null; throw err; }
    })();
    return googleMapsPromise;
}

async function getPlaceDataViaSDK(placeId, fullAddress = "") {
    try {
        await loadGoogleMapsAPI();
        const { Place } = await google.maps.importLibrary("places");
        const place = new Place({ id: placeId, requestedLanguage: 'uk' });
        await place.fetchFields({ fields: ["displayName", "formattedAddress", "photos"] });
        const name  = place.displayName?.text || place.displayName || "Місце";
        const query = fullAddress || place.formattedAddress || name;
        const { places } = await Place.searchByText({ textQuery: `пам'ятки та краєвиди ${query}`, maxResultCount: 1, fields: ["photos"] });
        let photoUrl = null;
        if (places?.[0]?.photos?.[0]) photoUrl = places[0].photos[0].getURI({ maxWidth: 1200 });
        else if (place.photos?.[0])   photoUrl = place.photos[0].getURI({ maxWidth: 1200 });
        return { place_id: placeId, name, photo_url: photoUrl };
    } catch (err) { console.error("SDK Error:", err); return null; }
}

async function updateSliderCards(list, isInitial = false) {
    const container = document.getElementById("cityContainer");
    if (!container) return;
    container.innerHTML = "";
    for (const item of list) {
        const card = document.createElement("div");
        card.className = "city-card show";
        const name = item.name || item.description || "Місце";
        card.innerHTML = `
            <div class="image-wrapper" style="height:180px;overflow:hidden;background:#222;">
                <img src="${modernPlaceholder}" class="city-image" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <div class="city-content">
                <h3 class="city-name"></h3>
                <div class="city-rating">⭐ ${item.rating || '4.5'}</div>
                <button class="map-button">Детальніше</button>
            </div>`;
        card.querySelector(".city-name").textContent = name.length > 40 ? name.substring(0, 37) + "..." : name;
        card.onclick = () => { window.location.href = `/html/city_page.html?placeId=${item.place_id}&name=${encodeURIComponent(name)}`; };
        container.appendChild(card);
        if (isInitial && (item.photo || item.photo_url)) {
            card.querySelector(".city-image").src = item.photo || item.photo_url;
        } else {
            getPlaceDataViaSDK(item.place_id, item.description || name).then(data => {
                if (data?.photo_url) card.querySelector(".city-image").src = data.photo_url;
            });
        }
    }
}

async function initDashboard() {
    // Підвантажити ім'я користувача для привітання
    const greeting = document.getElementById('dashboardGreeting');
    if (greeting) {
        profileFn.getProfile().then(profile => {
            if (profile?.username) greeting.textContent = `Привіт, ${profile.username}! 👋`;
        });
    }

    const searchInput     = document.getElementById("searchInput");
    const categoryButtons = document.querySelectorAll('.search-category');
    const clearBtn        = document.querySelector(".clear-button");

    updateSliderCards(defaultCities, true);

    const wrapper       = document.querySelector(".scroll-container-wrapper");
    const cityContainer = document.getElementById("cityContainer");
    if (wrapper && cityContainer) {
        wrapper.addEventListener("click", (e) => {
            const btn = e.target.closest(".scroll-button");
            if (!btn) return;
            const card = cityContainer.querySelector(".city-card");
            const step = card ? card.offsetWidth + 20 : 300;
            if (btn.classList.contains("left"))  cityContainer.scrollBy({ left: -step, behavior: "smooth" });
            else if (btn.classList.contains("right")) cityContainer.scrollBy({ left: step, behavior: "smooth" });
        });
    }

    categoryButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryTypes = btn.getAttribute('data-type');
            const query = searchInput?.value.trim();
            if (query && query.length >= 3) {
                searchInput.dispatchEvent(new Event('input'));
            } else {
                const resp = await fetch("/api/places/autocomplete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: `популярні ${currentCategoryTypes} Україна`, category: currentCategoryTypes }) });
                const data = await resp.json();
                updateSliderCards(data.predictions || [], false);
            }
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);
            if (clearBtn) clearBtn.style.display = query ? "block" : "none";
            if (query.length < 3) { if (query.length === 0) updateSliderCards(defaultCities, true); return; }
            debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch("/api/places/autocomplete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: query, category: currentCategoryTypes }) });
                    const data = await response.json();
                    updateSliderCards(data.predictions || [], false);
                } catch (err) { console.error("Помилка пошуку:", err); }
            }, 400);
        });
    }
}

// ============================================================
// PROFILE PAGE
// ============================================================
async function initProfilePage() {
    const profile = await profileFn.getProfile();
    if (!profile) { console.log('initProfilePage: failed to load'); return; }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };

    set('profileName',         profile.username);
    set('profileLocationText', profile.location  || 'Не вказано');
    set('profileBioText',      profile.bio       || 'Розкажи про себе...');
    set('statVisited',         profile.places_visited);
    set('statEmail',           profile.email);
    set('statSince',           profile.member_since);
    set('contactEmail',        profile.email);

    if (profile.has_google) {
        const badge = document.getElementById('googleBadge');
        if (badge) badge.style.display = 'flex';
    }

    // Аватар
    if (profile.avatar_url) {
        const img  = document.getElementById('avatarImg');
        const icon = document.getElementById('avatarIcon');
        if (img && icon) { img.src = profile.avatar_url; img.style.display = 'block'; icon.style.display = 'none'; }
    }

    // Hover ефект на аватар
    const circle     = document.getElementById('avatarCircle');
    const hoverLayer = document.getElementById('avatarHover');
    const fileInput  = document.getElementById('avatarFileInput');
    const status     = document.getElementById('avatarStatus');

    if (circle && hoverLayer) {
        circle.addEventListener('mouseenter', () => { hoverLayer.style.display = 'flex'; });
        circle.addEventListener('mouseleave', () => { hoverLayer.style.display = 'none'; });
        circle.addEventListener('click', () => fileInput?.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            // Прев'ю одразу
            const reader = new FileReader();
            reader.onload = ev => {
                const img  = document.getElementById('avatarImg');
                const icon = document.getElementById('avatarIcon');
                if (img && icon) { img.src = ev.target.result; img.style.display = 'block'; icon.style.display = 'none'; }
            };
            reader.readAsDataURL(file);
            if (status) { status.textContent = 'Завантаження...'; status.style.color = '#94a3b8'; }
            const result = await profileFn.uploadAvatar(file);
            if (status) {
                status.textContent = result.status === 200 ? '✓ Збережено' : '✗ Помилка';
                status.style.color  = result.status === 200 ? '#10b981' : '#ef4444';
                if (result.status === 200) setTimeout(() => { status.textContent = ''; }, 2500);
            }
        });
    }

    // Кнопка Редагувати
    const editBtn   = document.getElementById('editProfileBtn');
    const viewMode  = document.getElementById('profileViewMode');
    const editMode  = document.getElementById('profileEditMode');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const saveBtn   = document.getElementById('saveProfileBtn');
    const bioEl     = document.getElementById('editBio');
    const counter   = document.getElementById('bioCounter');
    const answer    = document.getElementById('editAnswer');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            document.getElementById('editUsername').value = profile.username || '';
            document.getElementById('editLocation').value = profile.location || '';
            if (bioEl) { bioEl.value = profile.bio || ''; if (counter) counter.textContent = `${bioEl.value.length}/300`; }
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
            editBtn.style.display  = 'none';
        });
    }

    if (bioEl && counter) bioEl.addEventListener('input', () => { counter.textContent = `${bioEl.value.length}/300`; });

    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        editBtn.style.display  = '';
        if (answer) answer.innerHTML = '';
    });

    if (saveBtn) saveBtn.addEventListener('click', async () => {
        const newUsername = document.getElementById('editUsername')?.value?.trim();
        const newLocation = document.getElementById('editLocation')?.value?.trim();
        const newBio      = bioEl?.value?.trim();
        if (!newUsername) { if (answer) answer.innerHTML = '<span style="color:#ef4444;">Ім\'я не може бути порожнім</span>'; return; }
        saveBtn.disabled = true;
        const result = await profileFn.updateProfile({ username: newUsername, location: newLocation, bio: newBio });
        saveBtn.disabled = false;
        if (result.status === 200) {
            profile.username = result.data.username;
            profile.location = result.data.location;
            profile.bio      = result.data.bio;
            set('profileName',         profile.username);
            set('profileLocationText', profile.location || 'Не вказано');
            set('profileBioText',      profile.bio      || 'Розкажи про себе...');
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            editBtn.style.display  = '';
            if (answer) answer.innerHTML = '';
        } else if (result.status === 409) {
            if (answer) answer.innerHTML = '<span style="color:#ef4444;">Це ім\'я вже зайняте</span>';
        } else {
            if (answer) answer.innerHTML = '<span style="color:#ef4444;">Помилка сервера</span>';
        }
    });
}

// ============================================================
// SETTINGS PAGE
// ============================================================

async function initSettingsPage() {
    const [settings, profile] = await Promise.all([
        profileFn.getSettings(),
        profileFn.getProfile()
    ]);

    // Email
    if (profile) {
        const emailEl = document.getElementById('settingsEmail');
        if (emailEl) emailEl.textContent = profile.email;
    }

    // Toggles
    if (settings) {
        const map = {
            toggle_notifications_email:  settings.notifications_email,
            toggle_notifications_push:   settings.notifications_push,
            toggle_notifications_nearby: settings.notifications_nearby,
            toggle_privacy_public:       settings.privacy_public,
            toggle_privacy_location:     settings.privacy_location,
        };
        Object.entries(map).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.checked = !!val;
        });
    }

    const toggleMap = {
        toggle_notifications_email:  'notifications_email',
        toggle_notifications_push:   'notifications_push',
        toggle_notifications_nearby: 'notifications_nearby',
        toggle_privacy_public:       'privacy_public',
        toggle_privacy_location:     'privacy_location',
    };
    Object.entries(toggleMap).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (!el) return;
        el.addEventListener('change', async () => {
            const ok = await profileFn.updateSetting(key, el.checked);
            if (!ok) el.checked = !el.checked; // відкотити якщо помилка
        });
    });

    // ── Зміна/встановлення пароля ──────────────────────────────
    const openBtn      = document.getElementById('openChangePasswordBtn');
    const passForm     = document.getElementById('changePasswordForm');
    const cancelPass   = document.getElementById('cancelChangePasswordBtn');
    const confirmBtn   = document.getElementById('confirmChangePasswordBtn');
    const passAnswer   = document.getElementById('passwordChangeAnswer');
    const curPassInput = document.getElementById('currentPasswordInput');
    const curPassWrap  = document.getElementById('currentPasswordWrap');
    const passHint     = document.getElementById('passwordFormHint');
    const passTitle    = document.getElementById('passwordFormTitle');

    // Перевіряємо чи є пароль у юзера (для Google-юзерів без пароля)
    let isGoogleOnly = false;

    if (openBtn && passForm) {
        openBtn.addEventListener('click', async () => {
            const isOpen = passForm.style.display !== 'none';
            if (isOpen) {
                passForm.style.display = 'none';
                return;
            }

            passForm.style.display = 'block';

            // Запитуємо статус пароля
            try {
                const res = await fetch('/api/user/password-status', {
                    method: 'GET', credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    isGoogleOnly = data.is_google_only;

                    if (isGoogleOnly) {
                        // Google-юзер без пароля
                        if (curPassWrap)  curPassWrap.style.display = 'none';
                        if (passTitle)    passTitle.textContent = 'Встановити пароль';
                        if (passHint) {
                            passHint.textContent = 'Ти увійшов через Google. Встанови пароль щоб також входити через email.';
                            passHint.style.color = '#38bdf8';
                        }
                    } else {
                        // Звичайний юзер з паролем
                        if (curPassWrap)  curPassWrap.style.display = 'block';
                        if (passTitle)    passTitle.textContent = 'Змінити пароль';
                        if (passHint)     passHint.textContent = '';
                    }
                }
            } catch (e) {
                console.log('password-status error:', e);
            }
        });
    }

    if (cancelPass) {
        cancelPass.addEventListener('click', () => {
            passForm.style.display = 'none';
            ['currentPasswordInput','newPasswordInput','confirmPasswordInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            if (passAnswer) passAnswer.innerHTML = '';
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const cur     = curPassInput?.value || '';
            const newPass = document.getElementById('newPasswordInput')?.value || '';
            const confirm = document.getElementById('confirmPasswordInput')?.value || '';

            // Валідація
            if (!isGoogleOnly && !cur) {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#ef4444;">Введи поточний пароль</span>';
                return;
            }
            if (!newPass || !confirm) {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#ef4444;">Заповни всі поля</span>';
                return;
            }
            if (newPass !== confirm) {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#ef4444;">Паролі не співпадають</span>';
                return;
            }
            if (newPass.length < 8) {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#ef4444;">Мінімум 8 символів</span>';
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Збереження...';

            const result = await profileFn.changePassword(
                isGoogleOnly ? null : cur,
                newPass
            );

            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Зберегти';

            if (result.status === 200) {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#10b981;">✓ Пароль збережено!</span>';
                // Якщо це був Google-юзер — тепер у нього є пароль, оновлюємо форму
                if (isGoogleOnly) {
                    isGoogleOnly = false;
                    if (curPassWrap)  curPassWrap.style.display = 'block';
                    if (passTitle)    passTitle.textContent = 'Змінити пароль';
                    if (passHint)     passHint.textContent = '';
                }
                setTimeout(() => {
                    passForm.style.display = 'none';
                    if (passAnswer) passAnswer.innerHTML = '';
                    ['currentPasswordInput','newPasswordInput','confirmPasswordInput'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                }, 2000);
            } else if (result.status === 401) {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#ef4444;">Поточний пароль невірний</span>';
            } else {
                if (passAnswer) passAnswer.innerHTML = '<span style="color:#ef4444;">Помилка сервера</span>';
            }
        });
    }

    // ── Завантажити дані ──────────────────────────────────────
    const downloadBtn = document.getElementById('downloadDataBtn');
    if (downloadBtn && profile) {
        downloadBtn.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify({
                username:     profile.username,
                email:        profile.email,
                location:     profile.location,
                bio:          profile.bio,
                member_since: profile.member_since,
                exported_at:  new Date().toISOString(),
            }, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'topspots_profile.json';
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }

    // ── Видалення акаунту ─────────────────────────────────────
    const deleteBtn     = document.getElementById('deleteAccountBtn');
    const confirmBlock  = document.getElementById('deleteConfirmBlock');
    const confirmDelete = document.getElementById('confirmDeleteBtn');
    const cancelDelete  = document.getElementById('cancelDeleteBtn');

    if (deleteBtn && confirmBlock) {
        deleteBtn.addEventListener('click', () => {
            confirmBlock.style.display = 'block';
            deleteBtn.style.display = 'none';
        });
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => {
                confirmBlock.style.display = 'none';
                deleteBtn.style.display = '';
            });
        }
        if (confirmDelete) {
            confirmDelete.addEventListener('click', async () => {
                confirmDelete.disabled = true;
                confirmDelete.textContent = 'Видалення...';
                await profileFn.deleteAccount();
                // якщо щось пішло не так — повертаємо кнопку
                confirmDelete.disabled = false;
                confirmDelete.textContent = 'Так, видалити';
            });
        }
    }
}

// ============================================================
// NEARBY
// ============================================================
async function performSearch() {
    const statusText  = document.getElementById('nearbyStatus');
    const radiusInput = document.getElementById('nearbyRadius');
    const activeChip  = document.querySelector('.chip.active');
    let category = activeChip ? activeChip.dataset.type || activeChip.innerText : 'tourist_attraction';
    category = category.toLowerCase().replace(/\s+/g, '_');
    if (!statusText) return;
    statusText.innerHTML = `<i class="fas fa-sync fa-spin"></i> Опитування локальної бази...`;
    try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
        const { latitude, longitude } = pos.coords;
        const radius = (radiusInput ? radiusInput.value : 12) * 1000;
        const dbRes = await fetch('/api/nearby/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latitude, longitude, radius, category }) });
        if (dbRes.ok) {
            const dbData = await dbRes.json();
            if (dbData.results && dbData.results.length > 0) { statusText.innerText = `Знайдено ${dbData.results.length} локацій (з бази)`; renderNearbyCards(dbData.results); return; }
        }
        statusText.innerHTML = `<i class="fas fa-satellite"></i> Супутниковий пошук Google...`;
        await loadGoogleMapsAPI();
        const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
        const { places } = await Place.searchNearby({
            fields: ["displayName","location","rating","photos","id","formattedAddress"],
            locationRestriction: { center: new google.maps.LatLng(latitude, longitude), radius },
            includedPrimaryTypes: [category], maxResultCount: 20,
            rankPreference: SearchNearbyRankPreference.POPULARITY
        });
        if (places && places.length > 0) {
            const NO_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='20' font-family='sans-serif'%3EНемає фото%3C/text%3E%3C/svg%3E";
            const results = places.map(p => ({
                place_id: p.id, name: p.displayName?.text || p.displayName || "Без назви",
                vicinity: p.formattedAddress, rating: p.rating || 4.5,
                latitude: p.location.lat(), longitude: p.location.lng(),
                photo_url: p.photos?.[0]?.getURI({ maxWidth: 800 }) || NO_PHOTO, types: [category]
            }));
            renderNearbyCards(results);
            statusText.innerText = `Знайдено ${places.length} нових локацій`;
            syncNearbyWithBackend(results);
        } else { throw new Error("ZERO_RESULTS"); }
    } catch (err) {
        if (statusText) statusText.innerText = err.message === "ZERO_RESULTS" ? "Нічого не знайдено поруч" : "Помилка доступу до даних";
    }
}

function renderNearbyCards(places) {
    const NO_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='20' font-family='sans-serif'%3EНемає фото%3C/text%3E%3C/svg%3E";
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    grid.innerHTML = '';
    places.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'place-card-v2';
        card.innerHTML = `<div class="card-img-wrapper"><img src="${p.photo_url || NO_PHOTO}" class="card-main-img" onerror="this.src='${NO_PHOTO}'"><div class="card-rating-glass"><i class="fas fa-star"></i> <span>${p.rating}</span></div></div><div class="card-info"><h4 class="card-title">${p.name || "Цікаве місце"}</h4><p class="card-addr">${p.vicinity || "Україна"}</p><button class="card-btn" style="margin-top:12px;padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Детальніше</button></div>`;
        card.querySelector('.card-btn').onclick = () => { window.location.href = `/html/city_page.html?placeId=${p.place_id}`; };
        grid.appendChild(card);
        setTimeout(() => card.classList.add('visible'), i * 60);
    });
}

function syncNearbyWithBackend(results) {
    fetch('/api/nearby/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ places: results }) }).catch(e => console.error("Sync error:", e));
}

function initNearbyPage() {
    const radiusInput = document.getElementById('nearbyRadius');
    const chips       = document.querySelectorAll('.chip');
    const startBtn    = document.getElementById('startNearbySearch');
    chips.forEach(chip => { chip.addEventListener('click', () => { if (chip.classList.contains('active')) return; chips.forEach(c => c.classList.remove('active')); chip.classList.add('active'); performSearch(); }); });
    if (radiusInput) { radiusInput.oninput = () => { const v = document.getElementById('radiusVal'); if (v) v.textContent = radiusInput.value + ' км'; }; radiusInput.onchange = () => performSearch(); }
    if (startBtn) startBtn.addEventListener('click', performSearch);
    setTimeout(() => performSearch(), 1000);
}

// ============================================================
// STATISTICS PAGE
// ============================================================
function initAchievementsPage() {
    document.querySelectorAll('.kpi-val').forEach(el => {
        const target = parseFloat(el.dataset.target);
        const isFloat = el.dataset.float === 'true';
        let step = 0;
        const iv = setInterval(() => {
            step++;
            const cur = Math.min(target * step / 50, target);
            el.textContent = isFloat ? cur.toFixed(1) : Math.round(cur);
            if (step >= 50) clearInterval(iv);
        }, 24);
    });
    document.querySelectorAll('.kpi-card').forEach((c, i) => {
        c.style.cssText = 'opacity:0;transform:translateY(20px)';
        setTimeout(() => { c.style.transition = 'opacity 0.4s ease,transform 0.4s ease'; c.style.opacity = '1'; c.style.transform = 'translateY(0)'; }, 80 + i * 80);
    });

    function drawBar(id, data, labels) {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth, H = canvas.offsetHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        const pL=36,pR=16,pT=18,pB=32,cW=W-pL-pR,cH=H-pT-pB;
        const max = Math.max(...data)*1.15;
        const bW=(cW/data.length)*0.55,gap=(cW/data.length)*0.45;
        const t0=performance.now();
        function frame(now){
            const p=Math.min((now-t0)/900,1),e=1-Math.pow(1-p,3);
            ctx.clearRect(0,0,W,H);
            ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
            for(let g=0;g<=4;g++){const y=pT+cH-(g/4)*cH;ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();ctx.fillStyle='rgba(148,163,184,0.5)';ctx.font='11px Sora,sans-serif';ctx.textAlign='right';ctx.fillText(Math.round(max*g/4),pL-5,y+4);}
            data.forEach((v,i)=>{
                const x=pL+i*(cW/data.length)+gap/2,bH=(v/max)*cH*e,y=pT+cH-bH;
                const gr=ctx.createLinearGradient(x,y,x,pT+cH);
                gr.addColorStop(0,'#10b981');gr.addColorStop(1,'rgba(56,189,248,0.25)');
                ctx.fillStyle=gr;
                const r=Math.min(5,bW/2);
                ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+bW-r,y);ctx.quadraticCurveTo(x+bW,y,x+bW,y+r);ctx.lineTo(x+bW,pT+cH);ctx.lineTo(x,pT+cH);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();
                ctx.fillStyle='rgba(148,163,184,0.6)';ctx.font='11px Sora,sans-serif';ctx.textAlign='center';ctx.fillText(labels[i],x+bW/2,H-8);
                if(p>0.85){ctx.fillStyle='rgba(255,255,255,0.75)';ctx.font='bold 11px Sora,sans-serif';ctx.fillText(v,x+bW/2,y-5);}
            });
            if(p<1)requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function drawDonut(id,segs,legendId){
        const canvas=document.getElementById(id);if(!canvas)return;
        const ctx=canvas.getContext('2d'),dpr=window.devicePixelRatio||1,sz=160;
        canvas.width=sz*dpr;canvas.height=sz*dpr;ctx.scale(dpr,dpr);
        const cx=sz/2,cy=sz/2,oR=sz/2-8,iR=sz/2-34;
        const total=segs.reduce((a,s)=>a+s.value,0);
        const t0=performance.now();
        function frame(now){
            const p=Math.min((now-t0)/1100,1),e=1-Math.pow(1-p,3);
            ctx.clearRect(0,0,sz,sz);let sa=-Math.PI/2;
            segs.forEach(s=>{const sw=(s.value/total)*2*Math.PI*e;ctx.beginPath();ctx.moveTo(cx+iR*Math.cos(sa),cy+iR*Math.sin(sa));ctx.arc(cx,cy,oR,sa,sa+sw);ctx.arc(cx,cy,iR,sa+sw,sa,true);ctx.closePath();ctx.fillStyle=s.color;ctx.fill();sa+=sw;});
            if(p<1)requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        const leg=document.getElementById(legendId);
        if(leg){leg.innerHTML='';segs.forEach(s=>{const d=document.createElement('div');d.className='donut-legend-item';d.innerHTML=`<span class="dl-dot" style="background:${s.color}"></span><span class="dl-label">${s.label}</span><span class="dl-val">${s.value}</span>`;leg.appendChild(d);});}
    }

    function buildHeatmap(){
        const grid=document.getElementById('heatmapGrid'),mEl=document.getElementById('heatmapMonths');if(!grid)return;
        const cols=['rgba(26,34,54,1)','rgba(16,185,129,0.2)','rgba(16,185,129,0.4)','rgba(16,185,129,0.65)','rgba(16,185,129,0.9)'];
        grid.innerHTML='';
        for(let w=0;w<52;w++){const col=document.createElement('div');col.className='hm-col';for(let d=0;d<7;d++){const v=Math.random()<0.28?Math.floor(Math.random()*5):0;const cell=document.createElement('div');cell.className='hm-cell';cell.style.background=cols[Math.min(v,4)];cell.title=`${v} місць`;cell.style.cssText+=';opacity:0;transform:scale(0.4)';setTimeout(()=>{cell.style.transition='opacity 0.25s ease,transform 0.25s ease';cell.style.opacity='1';cell.style.transform='scale(1)';},w*7+d*2);col.appendChild(cell);}grid.appendChild(col);}
        if(mEl){mEl.innerHTML='';['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'].forEach(m=>{const s=document.createElement('span');s.textContent=m;mEl.appendChild(s);});}
    }

    function buildCityBars(){
        const el=document.getElementById('cityBars');if(!el)return;
        const list=[{name:'Київ',count:47,color:'#7c3aed'},{name:'Львів',count:28,color:'#c026d3'},{name:'Одеса',count:19,color:'#38bdf8'},{name:'Харків',count:14,color:'#10b981'},{name:'Івано-Франківськ',count:9,color:'#f59e0b'},{name:'Дніпро',count:7,color:'#f43f5e'}];
        const max=list[0].count;el.innerHTML='';
        list.forEach((c,i)=>{const row=document.createElement('div');row.className='city-bar-row';row.innerHTML=`<div class="cb-label">${c.name}</div><div class="cb-track"><div class="cb-fill" style="width:0%;background:${c.color}"></div></div><div class="cb-count">${c.count}</div>`;el.appendChild(row);setTimeout(()=>{const f=row.querySelector('.cb-fill');f.style.transition=`width 0.9s cubic-bezier(.4,0,.2,1) ${i*90}ms`;f.style.width=(c.count/max*100)+'%';},300);});
    }

    const barData={'2024':[8,12,7,15,18,22,14,19,11,16,9,5],'2023':[4,6,10,8,13,16,20,11,9,7,5,3]};
    const months=['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
    const drawPeriod=p=>setTimeout(()=>drawBar('barChartCanvas',barData[p],months),50);
    document.querySelectorAll('.period-tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.period-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');drawPeriod(t.dataset.period);}));
    setTimeout(()=>{drawPeriod('2024');drawDonut('donutCanvas',[{label:'Ресторани',value:47,color:'#f43f5e'},{label:'Парки',value:28,color:'#10b981'},{label:'Музеї',value:19,color:'#8b5cf6'},{label:'Кафе',value:18,color:'#f59e0b'},{label:'Готелі',value:12,color:'#38bdf8'}],'donutLegend');buildHeatmap();buildCityBars();},200);
    document.querySelectorAll('.insight-card').forEach((c,i)=>{c.style.cssText='opacity:0;transform:translateY(14px)';setTimeout(()=>{c.style.transition='opacity 0.4s ease,transform 0.4s ease';c.style.opacity='1';c.style.transform='translateY(0)';},800+i*100);});
}

// ============================================================
// NAVIGATION
// ============================================================
const updateActiveMenu = key => {
    document.querySelectorAll('[data-page]').forEach(el => {
        el.classList.toggle('active-nav', el.getAttribute('data-page') === key);
    });
};

const bindNav = () => {
    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.onclick = e => { e.preventDefault(); navigateTo(btn.getAttribute('data-page')); };
    });
};

const navigateTo = (key, push = true) => {
    if (!pages[key]) return;
    hidePortal();
    mainPageFunctions.loadPageContent(pages[key]);
    const main = document.getElementById('main-page-content');
    if (main) animatePageIn(main);
    if (push) window.history.pushState({ page: key }, '', `#${key}`);
    updateActiveMenu(key);
    bindNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if      (key === 'dashboard') initDashboard();
    else if (key === 'photos')    initAchievementsPage();
    else if (key === 'nearby')    initNearbyPage();
    else if (key === 'profile')   initProfilePage();
    else if (key === 'settings')  initSettingsPage();
};

window.onpopstate = e => navigateTo(e.state?.page || 'dashboard', false);

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    mountAIWidget();
    mountSuggestionsPortal();
    navigateTo(window.location.hash.replace('#', '') || 'dashboard', false);
});


