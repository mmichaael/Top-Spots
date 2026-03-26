import { mainPageFunctionsHandler, profileFunctionsHandler } from "./functions.js";
const mainPageFunctions = new mainPageFunctionsHandler();
const profileFn = new profileFunctionsHandler();
function showToast(msg, type = 'info') {
    let toast = document.querySelector('.shop-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'shop-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `shop-toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 2800);
}
const SHOP_NO_PHOTO = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<rect width="100%" height="100%" fill="#0e1425"/>' +
    '<text x="50%" y="50%" text-anchor="middle" fill="#c9a84c" ' +
    'font-family="sans-serif" font-size="60" opacity="0.25">🏪</text></svg>'
)}`;
  (function() {
        const burgerBtn   = document.getElementById('burgerBtn');
        const mobileMenu  = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');

        if (!burgerBtn || !mobileMenu) return;

        function openMenu() {
            burgerBtn.classList.add('active');
            burgerBtn.setAttribute('aria-expanded', 'true');
            mobileMenu.classList.add('open');
            mobileMenu.setAttribute('aria-hidden', 'false');
            mobileOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            burgerBtn.classList.remove('active');
            burgerBtn.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('open');
            mobileMenu.setAttribute('aria-hidden', 'true');
            mobileOverlay.classList.remove('visible');
            document.body.style.overflow = '';
        }

        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.contains('active') ? closeMenu() : openMenu();
        });

        mobileOverlay.addEventListener('click', closeMenu);

        document.addEventListener('click', (e) => {
            if (
                !mobileMenu.contains(e.target) &&
                !burgerBtn.contains(e.target) &&
                mobileMenu.classList.contains('open')
            ) {
                closeMenu();
            }
        });

        document.querySelectorAll('.mobile-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                closeMenu();
            });
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeMenu();
        });

        const observer = new MutationObserver(() => {
            const activePage = document.querySelector('.nav-item.active-nav')?.dataset.page;
            if (activePage) {
                document.querySelectorAll('.mobile-nav-item').forEach(b => {
                    b.classList.toggle('active-nav', b.dataset.page === activePage);
                });
            }
        });
        observer.observe(document.querySelector('.nav-menu') || document.body, {
            attributes: true, subtree: true, attributeFilter: ['class']
        });
    })();
// Logout в хедері
const headerLogout = document.getElementById('headerLogoutBtn');
if (headerLogout) {
    headerLogout.addEventListener('click', async () => {
        headerLogout.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        headerLogout.disabled = true;
        await mainPageFunctions.logOut();
    });
}
// ============================================================
// AI WIDGET
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

function hidePortal() {
    document.getElementById('search-suggestions-portal')?.classList.remove('active');
}

// ============================================================
// PAGES
// ============================================================
const pages = {

dashboard: `
<div class="dashboard-wrapper fade-in">
    <div class="hero-section" style="background:linear-gradient(135deg,rgba(201,168,76,0.08) 0%,rgba(5,8,15,1) 50%,rgba(31,212,200,0.06) 100%);padding:80px 40px;border-radius:40px;margin-bottom:50px;position:relative;overflow:hidden;border:1px solid rgba(201,168,76,0.12);box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,#1fd4c8,transparent);opacity:.6;"></div>
        <div style="position:relative;z-index:2;">
            <h1 id="dashboardGreeting" style="font-weight:800;margin-bottom:15px;color:#f0ece4;font-size:clamp(26px,5vw,48px);font-family:'Outfit',sans-serif;">Привіт! 👋</h1>
            <p style="font-size:clamp(15px,2vw,20px);opacity:0.6;color:#a8a199;">Готовий відкрити нові місця сьогодні?</p>
        </div>
        <div style="position:absolute;top:-50px;right:-50px;width:300px;height:300px;background:rgba(201,168,76,0.06);filter:blur(80px);border-radius:50%;"></div>
        <div style="position:absolute;bottom:-30px;left:10%;width:200px;height:200px;background:rgba(31,212,200,0.05);filter:blur(60px);border-radius:50%;"></div>
    </div>

    <div class="top-cards-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:44px;">
        <div class="mini-card tilt-card" data-page="favorites" style="background:rgba(255,255,255,0.025);padding:36px 28px;border-radius:32px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid rgba(255,255,255,0.06);">
            <span style="font-weight:700;font-size:17px;color:#f0ece4;font-family:'Outfit',sans-serif;">Улюблені</span>
            <div style="background:rgba(255,107,74,0.15);border:1px solid rgba(255,107,74,0.25);width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#ff6b4a;font-size:22px;"><i class="fas fa-heart"></i></div>
        </div>
        <div class="mini-card tilt-card" data-page="shopping" style="background:rgba(255,255,255,0.025);padding:36px 28px;border-radius:32px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid rgba(255,255,255,0.06);">
            <span style="font-weight:700;font-size:17px;color:#f0ece4;font-family:'Outfit',sans-serif;">Шопінг</span>
            <div style="background:rgba(31,212,200,0.12);border:1px solid rgba(31,212,200,0.2);width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#1fd4c8;font-size:22px;"><i class="fas fa-shopping-bag"></i></div>
        </div>
        <div class="mini-card tilt-card" style="background:rgba(255,255,255,0.025);padding:36px 28px;border-radius:32px;display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(255,255,255,0.06);">
            <span style="font-weight:700;font-size:17px;color:#f0ece4;font-family:'Outfit',sans-serif;">Поради</span>
            <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.2);width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#e8c97a;font-size:22px;"><i class="fas fa-magic"></i></div>
        </div>
    </div>

    <div class="main-options-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:44px;">
        <div class="option-card tilt-card" style="background:rgba(255,255,255,0.025);padding:36px;border-radius:36px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.06);">
            <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.2);min-width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#e8c97a;"><i class="fas fa-chart-line"></i></div>
            <div><h3 style="margin:0;font-size:20px;color:#f0ece4;font-weight:800;font-family:'Outfit',sans-serif;">Тренди</h3><p style="margin:5px 0 0;font-size:13px;color:#6b6560;">Популярне зараз</p></div>
        </div>
        <div class="option-card tilt-card" data-page="nearby" style="background:rgba(255,255,255,0.025);padding:36px;border-radius:36px;display:flex;align-items:center;gap:20px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;">
            <div style="background:rgba(31,212,200,0.1);border:1px solid rgba(31,212,200,0.2);min-width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#1fd4c8;"><i class="fas fa-location-dot"></i></div>
            <div><h3 style="margin:0;font-size:20px;color:#f0ece4;font-weight:800;font-family:'Outfit',sans-serif;">Поруч</h3><p style="margin:5px 0 0;font-size:13px;color:#6b6560;">Місця неподалік</p></div>
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

    <h2 style="margin:44px 0 28px;font-size:26px;font-weight:800;color:#f0ece4;font-family:'Outfit',sans-serif;letter-spacing:-.3px;">Категорії</h2>
    <div class="grid-container" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:50px;">
        <div class="cat-card" data-category="restaurant" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="background:rgba(255,107,74,0.12);border:1px solid rgba(255,107,74,0.2);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#ff6b4a;"><i class="fas fa-utensils"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Ресторани</span>
        </div>
        <div class="cat-card" data-category="lodging" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.2);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#e8c97a;"><i class="fas fa-hotel"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Готелі</span>
        </div>
        <div class="cat-card" data-category="park" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="background:rgba(31,212,200,0.1);border:1px solid rgba(31,212,200,0.18);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#1fd4c8;"><i class="fas fa-tree"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Парки</span>
        </div>
        <div class="cat-card" data-category="museum" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.2);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#a78bfa;"><i class="fas fa-landmark"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Музеї</span>
        </div>
        <div class="cat-card" data-category="cafe" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.18);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#c9a84c;"><i class="fas fa-mug-hot"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Кафе</span>
        </div>
        <div class="cat-card" data-category="shopping_mall" style="background:rgba(255,255,255,0.025);padding:44px 20px;border-radius:36px;text-align:center;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="background:rgba(255,107,74,0.1);border:1px solid rgba(255,107,74,0.18);width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:26px;color:#ff6b4a;"><i class="fas fa-shopping-bag"></i></div>
            <span style="font-size:17px;font-weight:700;color:#f0ece4;font-family:'Outfit',sans-serif;">Магазини</span>
        </div>
    </div>
</div>`,



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
                            <span style="color:#fff;font-size:10px;font-weight:600;">Змінити</span>
                        </div>
                    </div>
                    <div id="avatarStatus" style="position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);font-size:11px;white-space:nowrap;font-weight:600;"></div>
                </div>
                <div class="profile-titles">
                    <h1 class="profile-name" id="profileName">...</h1>
                    <p class="profile-location"><i class="fas fa-map-marker-alt" style="color:#c9a84c;"></i> <span id="profileLocationText">—</span></p>
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

            <div style="display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:24px;">
                <button class="profile-tab-btn active" data-tab="about">
                    <i class="fas fa-user" style="margin-right:6px;font-size:12px;"></i>Про себе
                </button>
                <button class="profile-tab-btn" data-tab="stats">
                    <i class="fas fa-chart-bar" style="margin-right:6px;font-size:12px;"></i>Статистика
                </button>
            </div>

            <div id="tab-about" class="profile-tab-content">
                <div id="profileViewMode" class="profile-about">
                    <h3>Про себе</h3>
                    <p id="profileBioText" style="color:#6b6560;font-style:italic;">—</p>
                </div>
                <div id="profileEditMode" style="display:none;padding:24px;background:rgba(255,255,255,0.025);border:1px solid rgba(201,168,76,0.12);border-radius:24px;margin-top:16px;">
                    <h3 style="margin-bottom:20px;color:#f0ece4;">Редагування профілю</h3>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div>
                            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#6b6560;display:block;margin-bottom:8px;">Ім'я</label>
                            <input type="text" id="editUsername" maxlength="50" placeholder="Твоє ім'я"
                                style="width:100%;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;"
                                onfocus="this.style.borderColor='rgba(201,168,76,.5)'" onblur="this.style.borderColor='rgba(201,168,76,.15)'">
                        </div>
                        <div>
                            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#6b6560;display:block;margin-bottom:8px;">Місто</label>
                            <input type="text" id="editLocation" maxlength="100" placeholder="Наприклад: Київ, Україна"
                                style="width:100%;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;"
                                onfocus="this.style.borderColor='rgba(201,168,76,.5)'" onblur="this.style.borderColor='rgba(201,168,76,.15)'">
                        </div>
                        <div style="position:relative;">
                            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#6b6560;display:block;margin-bottom:8px;">Про себе <span style="color:#3d3935;">(макс. 300)</span></label>
                            <textarea id="editBio" maxlength="300" rows="4" placeholder="Розкажи про себе..."
                                style="width:100%;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;resize:vertical;box-sizing:border-box;"
                                onfocus="this.style.borderColor='rgba(201,168,76,.5)'" onblur="this.style.borderColor='rgba(201,168,76,.15)'"></textarea>
                            <span id="bioCounter" style="position:absolute;bottom:10px;right:14px;font-size:11px;color:#3d3935;">0/300</span>
                        </div>
                        <div id="editAnswer" style="font-size:13px;min-height:18px;"></div>
                        <div style="display:flex;gap:10px;">
                            <button id="saveProfileBtn" style="padding:11px 24px;background:linear-gradient(135deg,#c9a84c,#e8c97a);border:none;border-radius:var(--r2);color:#05080f;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;">
                                <i class="fas fa-check"></i> Зберегти
                            </button>
                            <button id="cancelEditBtn" style="padding:11px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:var(--r2);color:#6b6560;font-size:13px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;">
                                <i class="fas fa-times"></i> Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="tab-stats" class="profile-tab-content" style="display:none;">
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:28px;">
                    <div class="kpi-card">
                        <div class="kpi-icon" style="background:rgba(201,168,76,0.12);color:#e8c97a;"><i class="fas fa-map-marked-alt"></i></div>
                        <div class="kpi-body"><span class="kpi-val" id="statsVisited">0</span><span class="kpi-label">Місць відвідано</span></div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon" style="background:rgba(31,212,200,0.12);color:#1fd4c8;"><i class="fas fa-calendar-alt"></i></div>
                        <div class="kpi-body"><span class="kpi-val" id="statsMemberSince" style="font-size:18px;">—</span><span class="kpi-label">Учасник з</span></div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon" style="background:rgba(167,139,250,0.12);color:#a78bfa;"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="kpi-body"><span class="kpi-val" id="statsLocation" style="font-size:18px;">—</span><span class="kpi-label">Місто</span></div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon" style="background:rgba(201,168,76,0.12);color:#c9a84c;"><i class="fas fa-star"></i></div>
                        <div class="kpi-body"><span class="kpi-val" id="statsRating">4.8</span><span class="kpi-label">Рейтинг</span></div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:22px;margin-bottom:18px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                        <div><h4 style="color:#f0ece4;margin:0;font-size:15px;font-family:'Outfit',sans-serif;">Активність по місяцях</h4></div>
                        <div style="display:flex;gap:6px;">
                            <button class="period-tab active" data-period="2024">2024</button>
                            <button class="period-tab" data-period="2023">2023</button>
                        </div>
                    </div>
                    <div style="position:relative;height:160px;"><canvas id="profileBarChart"></canvas></div>
                </div>
                <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:22px;margin-bottom:18px;">
                    <h4 style="color:#f0ece4;margin:0 0 18px;font-size:15px;font-family:'Outfit',sans-serif;">Категорії місць</h4>
                    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
                        <div style="position:relative;width:140px;height:140px;flex-shrink:0;">
                            <canvas id="profileDonutChart"></canvas>
                            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
                                <span id="donutTotal" style="font-size:22px;font-weight:800;color:#f0ece4;font-family:'Space Mono',monospace;">0</span>
                                <span style="display:block;font-size:10px;color:#3d3935;">всього</span>
                            </div>
                        </div>
                        <div id="profileDonutLegend" style="flex:1;min-width:120px;"></div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:22px;margin-bottom:18px;">
                    <h4 style="color:#f0ece4;margin:0 0 18px;font-size:15px;font-family:'Outfit',sans-serif;">Топ міст</h4>
                    <div id="profileCityBars"></div>
                </div>
            </div>
        </div>
    </div>
</div>`,

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
                <div class="card-head"><i class="fas fa-sliders-h" style="color:#c9a84c;font-size:18px;"></i><h3>Налаштування радару</h3></div>
                <div class="range-group">
                    <div class="range-info"><span>Радіус пошуку</span><b id="radiusVal">12 км</b></div>
                    <input type="range" id="nearbyRadius" min="1" max="30" value="12" class="modern-slider">
                </div>
                <div class="category-chips">
                    <button class="chip active" data-type="tourist_attraction">🏛️ Пам'ятки</button>
                    <button class="chip" data-type="park">🌳 Парки</button>
                    <button class="chip" data-type="shopping_mall">🛍️ ТЦ</button>
                    <button class="chip" data-type="museum">🏺 Музеї</button>
                    <button class="chip" data-type="restaurant">🍽️ Ресторани</button>
                    <button class="chip" data-type="cafe">☕ Кафе</button>
                    <button class="chip" data-type="lodging">🏨 Готелі</button>
                    <button class="chip" data-type="supermarket">🛒 Супермаркет</button>
                    <button class="chip" data-type="pharmacy">💊 Аптека</button>
                    <button class="chip" data-type="gym">🏋️ Спортзал</button>
                    <button class="chip" data-type="gas_station">⛽ АЗС</button>
                    <button class="chip" data-type="bank">🏦 Банк</button>
                </div>
                <button id="startNearbySearch" class="glow-btn"><i class="fas fa-crosshairs"></i> Сканувати вручну</button>
            </div>
        </aside>
        <main class="nearby-results">
            <div id="nearbyGrid" class="places-grid-v2"><div class="nearby-placeholder"></div></div>
        </main>
    </div>
</div>`,

shopping: () => {
    const savedCity = sessionStorage.getItem('shopping_city') || '';
    const savedType = sessionStorage.getItem('shopping_type') || '';
    return `
    <div class="shop-page">

        <div class="shop-hero">
            <div class="shop-hero-glow"></div>
            <h1 class="shop-title">
                <span class="shop-title-top">TOP</span>
                <span class="shop-title-bot">МАГАЗИНИ</span>
            </h1>
            <p class="shop-sub">Найкращі місця твого міста — рейтинг, фото, маршрут</p>
        </div>

        <div class="shop-search-block">
            <div class="shop-input-wrap">
                <i class="fas fa-city shop-input-icon"></i>
                <input id="shopCityInput" class="shop-input" type="text"
                    placeholder="Місто — Київ, Львів, Одеса..."
                    value="${savedCity}" autocomplete="off"/>
                <div id="shopCitySuggestions" class="shop-suggestions"></div>
            </div>
            <div class="shop-types-grid">
                ${[
                    {key:'supermarket',    icon:'fa-shopping-cart',  label:'Супермаркет'},
                    {key:'clothing',       icon:'fa-tshirt',          label:'Одяг'},
                    {key:'electronics',    icon:'fa-laptop',          label:'Електроніка'},
                    {key:'pharmacy',       icon:'fa-pills',           label:'Аптека'},
                    {key:'shopping_mall',  icon:'fa-store',           label:'ТЦ'},
                    {key:'furniture',      icon:'fa-couch',           label:'Меблі'},
                    {key:'sport',          icon:'fa-dumbbell',        label:'Спорт'},
                    {key:'building_materials', icon:'fa-hammer',      label:'Будматеріали'},
                    {key:'books',          icon:'fa-book',            label:'Книги'},
                    {key:'market',         icon:'fa-leaf',            label:'Ринок'},
                ].map(t => `
                    <button class="shop-type-btn ${savedType===t.key?'active':''}"
                        data-type="${t.key}">
                        <i class="fas ${t.icon}"></i>
                        <span>${t.label}</span>
                    </button>
                `).join('')}
            </div>
            <button id="shopSearchBtn" class="shop-search-btn">
                <i class="fas fa-search"></i> Знайти магазини
            </button>
        </div>

        <div id="shopFavSection" class="shop-section" style="display:none;">
            <div class="shop-section-head">
                <span class="shop-section-badge"><i class="fas fa-heart"></i> Збережені</span>
                <span id="shopFavCount" class="shop-fav-count"></span>
            </div>
            <div id="shopFavGrid" class="shop-grid"></div>
        </div>

        <div id="shopResultsSection" class="shop-section" style="display:none;">
            <div class="shop-section-head">
                <span class="shop-section-badge"><i class="fas fa-fire"></i> Результати</span>
                <span id="shopResultsMeta" class="shop-meta"></span>
            </div>
            <div id="shopResultsGrid" class="shop-grid"></div>
        </div>

        <div id="shopLoader" class="shop-loader" style="display:none;">
            <div class="shop-spinner"></div>
            <p>Шукаємо найкраще...</p>
        </div>

        <div id="shopEmpty" class="shop-empty" style="display:none;">
            <i class="fas fa-store-slash"></i>
            <p>Нічого не знайдено. Спробуй інше місто або категорію.</p>
        </div>
        <div id="shopDailyTop" class="shop-daily-top" style="display:none;">
    <div class="daily-top-head">
        <div class="daily-top-title">
            <span class="daily-top-fire">🔥</span>
            <h2>Топ магазини дня</h2>
            <span class="daily-top-badge">LIVE</span>
        </div>
        <div class="daily-top-timer">Завантаження...</div>
    </div>
    <div class="daily-top-grid"></div>
</div>
    </div>`;
},

settings: `
<div class="dashboard-wrapper fade-in">
    <header class="settings-hero">
        <div class="hero-bg-glow"></div>
        <div class="hero-content">
            <div class="badge-premium">Система v2.4</div>
            <h1 class="glitch-text">Налаштування</h1>
            <div class="hero-separator"></div>
            <p>Центральна панель керування акаунтом. <span>Персоналізуйте свій досвід у Top Spots.</span></p>
        </div>
    </header>
    <div class="settings-grid">
        <section class="settings-card">
            <div class="card-head"><div class="icon-box purple"><i class="fas fa-bell"></i></div><h3>Сповіщення</h3></div>
            <div class="card-body">
                <div class="setting-item"><div class="info"><span class="label">Email сповіщення</span><span class="sub-label">Отримуйте новини про нові локації на пошту</span></div><label class="ios-switch"><input type="checkbox" id="toggle_notifications_email"><span class="ios-slider"></span></label></div>
                <div class="setting-item"><div class="info"><span class="label">Push сповіщення</span><span class="sub-label">Миттєві повідомлення у браузері</span></div><label class="ios-switch"><input type="checkbox" id="toggle_notifications_push"><span class="ios-slider"></span></label></div>
                <div class="setting-item"><div class="info"><span class="label">Нові місця поруч</span><span class="sub-label">Сповіщати, коли я біля цікавої пам'ятки</span></div><label class="ios-switch"><input type="checkbox" id="toggle_notifications_nearby"><span class="ios-slider"></span></label></div>
            </div>
        </section>
        <section class="settings-card">
            <div class="card-head"><div class="icon-box blue"><i class="fas fa-user-shield"></i></div><h3>Конфіденційність</h3></div>
            <div class="card-body">
                <div class="setting-item"><div class="info"><span class="label">Публічний профіль</span><span class="sub-label">Дозволити іншим бачити мій профіль</span></div><label class="ios-switch"><input type="checkbox" id="toggle_privacy_public"><span class="ios-slider"></span></label></div>
                <div class="setting-item"><div class="info"><span class="label">Показувати локацію</span><span class="sub-label">Ваше місцезнаходження для пошуку поруч</span></div><label class="ios-switch"><input type="checkbox" id="toggle_privacy_location"><span class="ios-slider"></span></label></div>
            </div>
        </section>
        <section class="settings-card full-width">
            <div class="card-head"><div class="icon-box orange"><i class="fas fa-key"></i></div><h3>Дії з акаунтом</h3></div>
            <div class="action-grid">
                <div class="action-box"><div class="action-text"><h4>Змінити пароль</h4><p>Оновіть пароль для безпеки</p></div><button class="action-btn" id="openChangePasswordBtn">Оновити</button></div>
                <div class="action-box"><div class="action-text"><h4>Email акаунту</h4><p id="settingsEmail" style="word-break:break-all;">—</p></div></div>
                <div class="action-box"><div class="action-text"><h4>Завантажити дані</h4><p>Отримай копію профілю у форматі JSON</p></div><button class="action-btn secondary" id="downloadDataBtn"><i class="fas fa-download"></i></button></div>
                <div class="action-box danger-zone"><div class="action-text"><h4 class="text-danger">Видалити акаунт</h4><p>Це призведе до незворотного видалення даних</p></div><button class="action-btn danger" id="deleteAccountBtn">Видалити</button></div>
            </div>
            <!-- ВИЙТИ З АКАУНТУ -->
            <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                    <div><h4 style="color:#f0ece4;margin:0 0 4px;">Вийти з акаунту</h4><p style="color:#6b6560;font-size:13px;margin:0;">Завершити поточну сесію</p></div>
                    <button id="logoutBtn" style="padding:11px 24px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:14px;color:#f87171;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .25s;"
                        onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                        <i class="fas fa-sign-out-alt"></i> Вийти
                    </button>
                </div>
            </div>
            <form id="changePasswordForm" style="display:none;margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);" onsubmit="return false;">
                <h4 style="color:#f0ece4;margin-bottom:6px;" id="passwordFormTitle">Змінити пароль</h4>
                <p id="passwordFormHint" style="font-size:12px;color:#6b6560;margin-bottom:16px;min-height:16px;"></p>
                <div style="display:flex;flex-direction:column;gap:10px;max-width:420px;">
                    <div id="currentPasswordWrap">
                        <input type="password" id="currentPasswordInput" placeholder="Поточний пароль" autocomplete="current-password"
                            style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                    </div>
                    <input type="password" id="newPasswordInput" placeholder="Новий пароль (мін. 8 символів)" autocomplete="new-password"
                        style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                    <input type="password" id="confirmPasswordInput" placeholder="Підтвердь новий пароль" autocomplete="new-password"
                        style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:14px;color:#f0ece4;font-family:'Outfit',sans-serif;box-sizing:border-box;">
                    <div id="passwordChangeAnswer" style="font-size:13px;min-height:18px;"></div>
                    <div style="display:flex;gap:10px;">
                        <button type="button" id="confirmChangePasswordBtn" style="padding:11px 24px;background:linear-gradient(135deg,#c9a84c,#e8c97a);border:none;border-radius:14px;color:#05080f;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;">
                            <i class="fas fa-check"></i> Зберегти
                        </button>
                        <button type="button" id="cancelChangePasswordBtn" style="padding:11px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:#6b6560;font-size:13px;cursor:pointer;font-family:'Outfit',sans-serif;">
                            <i class="fas fa-times"></i> Скасувати
                        </button>
                    </div>
                </div>
            </form>
            <div id="deleteConfirmBlock" style="display:none;margin-top:20px;padding:20px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:18px;">
                <p style="color:#f87171;margin-bottom:14px;font-size:14px;"><i class="fas fa-exclamation-triangle"></i> Ти впевнений? Ця дія <strong>незворотна</strong>.</p>
                <div style="display:flex;gap:10px;">
                    <button class="action-btn danger" id="confirmDeleteBtn">Так, видалити</button>
                    <button type="button" style="padding:10px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#6b6560;font-size:13px;cursor:pointer;" id="cancelDeleteBtn">Скасувати</button>
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

function initTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            card.style.transform = `perspective(600px) rotateX(${(-y/r.height)*8}deg) rotateY(${(x/r.width)*8}deg) translateY(-5px) scale(1.02)`;
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
            if (typing) { let i = 0; const iv = setInterval(() => { if (i < text.length) { t.textContent += text[i++]; chatWindow.scrollTop = 9e9; } else clearInterval(iv); }, 22); }
            else { t.textContent = text; }
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
const modernPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23090d18"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%230e1425"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g)"%3E%3C/rect%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23c9a84c" font-family="sans-serif" font-size="80" opacity="0.3"%3E%F0%9F%93%8D%3C/text%3E%3C/svg%3E';
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
            <div class="image-wrapper" style="height:185px;overflow:hidden;background:#090d18;">
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
    const greeting = document.getElementById('dashboardGreeting');
    if (greeting) {
        profileFn.getProfile().then(profile => {
            if (profile?.username) greeting.textContent = `Привіт, ${profile.username}! 👋`;
        });
    }
    const searchInput     = document.getElementById("searchInput");
    const categoryButtons = document.querySelectorAll('.search-category');

    updateSliderCards(defaultCities, true);
    initTiltCards();

    const scrollLeftBtn  = document.getElementById("scrollLeft");
    const scrollRightBtn = document.getElementById("scrollRight");
    const cityContainer  = document.getElementById("cityContainer");

    if (scrollLeftBtn && cityContainer) {
        scrollLeftBtn.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            const card = cityContainer.querySelector(".city-card");
            const step = card ? card.offsetWidth + 20 : 300;
            cityContainer.scrollBy({ left: -step, behavior: "smooth" });
        });
    }
    if (scrollRightBtn && cityContainer) {
        scrollRightBtn.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            const card = cityContainer.querySelector(".city-card");
            const step = card ? card.offsetWidth + 20 : 300;
            cityContainer.scrollBy({ left: step, behavior: "smooth" });
        });
    }

    if (cityContainer) {
        cityContainer.addEventListener("scroll", () => {
            const thumb = document.getElementById("scrollThumb");
            if (!thumb) return;
            const maxScroll = cityContainer.scrollWidth - cityContainer.clientWidth;
            const pct = maxScroll > 0 ? (cityContainer.scrollLeft / maxScroll) * 70 : 0;
            thumb.style.transform = `translateX(${pct}px)`;
        });
    }

    // Категорії → Nearby з вибраною категорією
    document.querySelectorAll('.cat-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const category = card.dataset.category;
            if (category) {
                window._pendingNearbyCategory = category;
                navigateTo('nearby');
            }
        });
    });

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

// Зберігаємо аватар у sessionStorage щоб він не зникав при переключенні
const AVATAR_CACHE_KEY = 'topspots_avatar_cache';

function saveAvatarToCache(url) {
    try { sessionStorage.setItem(AVATAR_CACHE_KEY, url); } catch (_) {}
}
function getAvatarFromCache() {
    try { return sessionStorage.getItem(AVATAR_CACHE_KEY); } catch (_) { return null; }
}

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

    if (profile.has_google) { const badge = document.getElementById('googleBadge'); if (badge) badge.style.display = 'flex'; }

    // ── ФІКС #1: Завантаження аватара з кешу або з профілю ──
    function applyAvatar(url) {
        const img  = document.getElementById('avatarImg');
        const icon = document.getElementById('avatarIcon');
        if (img && icon && url) {
            img.src = url;
            img.style.display = 'block';
            icon.style.display = 'none';
            saveAvatarToCache(url);
        }
    }

    // Спочатку перевіряємо кеш (миттєво), потім профіль з сервера
    const cachedAvatar = getAvatarFromCache();
    if (cachedAvatar) {
        applyAvatar(cachedAvatar);
    }
    if (profile.avatar_url) {
        applyAvatar(profile.avatar_url);
    }

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

            // Показуємо превью одразу
            const reader = new FileReader();
            reader.onload = ev => { applyAvatar(ev.target.result); };
            reader.readAsDataURL(file);

            if (status) { status.textContent = 'Завантаження...'; status.style.color = '#a8a199'; }

            const result = await profileFn.uploadAvatar(file);

            if (status) {
                if (result.status === 200) {
                    status.textContent = '✓ Збережено';
                    status.style.color = '#1fd4c8';
                    // Оновлюємо кеш з реальним URL з сервера
                    if (result.data?.avatar_url) {
                        saveAvatarToCache(result.data.avatar_url);
                    }
                    setTimeout(() => { status.textContent = ''; }, 2500);
                } else {
                    status.textContent = '✗ Помилка';
                    status.style.color = '#ef4444';
                }
            }
            // Скидаємо input щоб можна було завантажити той самий файл знову
            fileInput.value = '';
        });
    }

    // ── Вкладки ──
    const tabBtns = document.querySelectorAll('.profile-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
            const tabEl = document.getElementById(`tab-${target}`);
            if (tabEl) tabEl.style.display = 'block';
            if (target === 'stats') initProfileStats(profile);
        });
    });

    const editBtn   = document.getElementById('editProfileBtn');
    const viewMode  = document.getElementById('profileViewMode');
    const editMode  = document.getElementById('profileEditMode');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const saveBtn   = document.getElementById('saveProfileBtn');
    const bioEl     = document.getElementById('editBio');
    const counter   = document.getElementById('bioCounter');
    const answer    = document.getElementById('editAnswer');

    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tabBtns.forEach(b => b.classList.remove('active'));
            const aboutBtn = document.querySelector('.profile-tab-btn[data-tab="about"]');
            if (aboutBtn) aboutBtn.classList.add('active');
            document.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
            const aboutTab = document.getElementById('tab-about');
            if (aboutTab) aboutTab.style.display = 'block';

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

let profileStatsInited = false;

function initProfileStats(profile) {
    if (profileStatsInited) return;
    profileStatsInited = true;
    const visited = profile?.places_visited || 0;
    const since   = profile?.member_since   || '—';
    const loc     = profile?.location       || '—';
    const setEl   = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    const visitedEl = document.getElementById('statsVisited');
    if (visitedEl && visited > 0) {
        let step = 0;
        const iv = setInterval(() => { step++; visitedEl.textContent = Math.min(Math.round(visited * step / 40), visited); if (step >= 40) clearInterval(iv); }, 20);
    } else if (visitedEl) { visitedEl.textContent = visited; }

    setEl('statsMemberSince', since);
    setEl('statsLocation', loc.length > 14 ? loc.split(',')[0] : loc);
    setEl('statsRating', '4.8');
    const donutTotalEl = document.getElementById('donutTotal');
    if (donutTotalEl) donutTotalEl.textContent = visited || 0;

    const barCanvas = document.getElementById('profileBarChart');
    if (barCanvas) {
        const ctx = barCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = barCanvas.offsetWidth || 400, H = 160;
        barCanvas.width = W * dpr; barCanvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        const barData = { '2024':[8,12,7,15,18,22,14,19,11,16,9,5], '2023':[4,6,10,8,13,16,20,11,9,7,5,3] };
        const months = ['С','Л','Б','К','Т','Ч','Л','С','В','Ж','Л','Г'];
        function drawBar(data) {
            const max = Math.max(...data)*1.15;
            const pL=32,pR=12,pT=14,pB=28,cW=W-pL-pR,cH=H-pT-pB;
            const bW=(cW/data.length)*0.55, gap=(cW/data.length)*0.45;
            const t0=performance.now();
            function frame(now) {
                const p=Math.min((now-t0)/800,1), e=1-Math.pow(1-p,3);
                ctx.clearRect(0,0,W,H);
                ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
                for(let g=0;g<=4;g++){const y=pT+cH-(g/4)*cH;ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();}
                data.forEach((v,i)=>{
                    const x=pL+i*(cW/data.length)+gap/2, bH=(v/max)*cH*e, y=pT+cH-bH;
                    const gr=ctx.createLinearGradient(x,y,x,pT+cH);
                    gr.addColorStop(0,'#c9a84c'); gr.addColorStop(1,'rgba(201,168,76,0.1)');
                    ctx.fillStyle=gr;
                    const r=Math.min(4,bW/2);
                    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+bW-r,y);ctx.quadraticCurveTo(x+bW,y,x+bW,y+r);ctx.lineTo(x+bW,pT+cH);ctx.lineTo(x,pT+cH);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();
                    ctx.fillStyle='rgba(168,161,153,0.5)';ctx.font='10px Outfit,sans-serif';ctx.textAlign='center';
                    ctx.fillText(months[i],x+bW/2,H-6);
                });
                if(p<1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }
        drawBar(barData['2024']);
        document.querySelectorAll('.period-tab').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('.period-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                drawBar(barData[t.dataset.period]);
            });
        });
    }

    const donutCanvas = document.getElementById('profileDonutChart');
    if (donutCanvas) {
        const ctx = donutCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1, sz = 140;
        donutCanvas.width = sz*dpr; donutCanvas.height = sz*dpr;
        ctx.scale(dpr, dpr);
        const segs = [
            { label:'Ресторани', value:38, color:'#ff6b4a' },
            { label:'Парки',     value:24, color:'#1fd4c8' },
            { label:'Музеї',     value:16, color:'#a78bfa' },
            { label:'Кафе',      value:14, color:'#c9a84c' },
            { label:'Готелі',    value:8,  color:'#e8c97a' },
        ];
        const total = segs.reduce((a,s)=>a+s.value,0);
        const cx=sz/2, cy=sz/2, oR=sz/2-6, iR=sz/2-28;
        const t0=performance.now();
        function frame(now) {
            const p=Math.min((now-t0)/900,1), e=1-Math.pow(1-p,3);
            ctx.clearRect(0,0,sz,sz); let sa=-Math.PI/2;
            segs.forEach(s=>{
                const sw=(s.value/total)*2*Math.PI*e;
                ctx.beginPath();ctx.moveTo(cx+iR*Math.cos(sa),cy+iR*Math.sin(sa));
                ctx.arc(cx,cy,oR,sa,sa+sw);ctx.arc(cx,cy,iR,sa+sw,sa,true);
                ctx.closePath();ctx.fillStyle=s.color;ctx.fill(); sa+=sw;
            });
            if(p<1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        const leg = document.getElementById('profileDonutLegend');
        if (leg) {
            leg.innerHTML='';
            segs.forEach(s=>{
                const d=document.createElement('div');
                d.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:8px;';
                d.innerHTML=`<span style="width:10px;height:10px;border-radius:3px;background:${s.color};flex-shrink:0;"></span><span style="font-size:12px;color:#a8a199;flex:1;">${s.label}</span><span style="font-size:12px;color:#f0ece4;font-weight:600;">${s.value}%</span>`;
                leg.appendChild(d);
            });
        }
    }

    const cityEl = document.getElementById('profileCityBars');
    if (cityEl) {
        const list=[{name:'Київ',count:47,color:'#c9a84c'},{name:'Львів',count:28,color:'#1fd4c8'},{name:'Одеса',count:19,color:'#a78bfa'},{name:'Харків',count:14,color:'#ff6b4a'},{name:'Дніпро',count:7,color:'#e8c97a'}];
        const max=list[0].count; cityEl.innerHTML='';
        list.forEach((c,i)=>{
            const row=document.createElement('div');
            row.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:10px;';
            row.innerHTML=`<span style="width:70px;font-size:12px;color:#a8a199;flex-shrink:0;text-align:right;">${c.name}</span><div style="flex:1;background:rgba(255,255,255,0.04);border-radius:6px;height:8px;overflow:hidden;"><div style="width:0%;height:100%;border-radius:6px;background:${c.color};transition:width 0.9s ease ${i*80}ms;"></div></div><span style="width:24px;font-size:12px;color:#f0ece4;font-weight:600;">${c.count}</span>`;
            cityEl.appendChild(row);
            setTimeout(()=>{ row.querySelector('div > div').style.width=(c.count/max*100)+'%'; },100);
        });
    }
}





async function initShoppingPage() {
    let selectedType = sessionStorage.getItem('shopping_type') || '';

    document.querySelectorAll('.shop-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shop-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
            sessionStorage.setItem('shopping_type', selectedType);
        });
    });

    const cityInput      = document.getElementById('shopCityInput');
    const suggestionsBox = document.getElementById('shopCitySuggestions');
    let suggestTimeout;

    cityInput.addEventListener('input', () => {
        clearTimeout(suggestTimeout);
        const val = cityInput.value.trim();
        if (val.length < 2) { suggestionsBox.innerHTML = ''; return; }

        suggestTimeout = setTimeout(async () => {
            try {
                const res  = await fetch(`/api/suggestions?query=${encodeURIComponent(val)}`);
                const data = await res.json();
                // Максимум 3 підказки
                suggestionsBox.innerHTML = data.slice(0, 3).map(s => {
                    const city = s.description.split(',')[0].trim();
                    return `<div class="shop-suggest-item" data-city="${city}">
                        <i class="fas fa-map-marker-alt"></i> ${s.description}
                    </div>`;
                }).join('');

                suggestionsBox.querySelectorAll('.shop-suggest-item').forEach(item => {
                    item.addEventListener('click', () => {
                        cityInput.value = item.dataset.city;
                        sessionStorage.setItem('shopping_city', item.dataset.city);
                        suggestionsBox.innerHTML = '';
                    });
                });
            } catch(e) { suggestionsBox.innerHTML = ''; }
        }, 350);
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.shop-input-wrap')) suggestionsBox.innerHTML = '';
    });

    document.getElementById('shopSearchBtn').addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (!city) {
            cityInput.focus();
            cityInput.classList.add('shake');
            setTimeout(() => cityInput.classList.remove('shake'), 500);
            return;
        }
        if (!selectedType) { showToast('Вибери тип магазину ☝️', 'warning'); return; }
        sessionStorage.setItem('shopping_city', city);
        sessionStorage.setItem('shopping_type', selectedType);
        searchShops(city, selectedType);
    });

    cityInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('shopSearchBtn').click();
    });

    // Завантажуємо DailyTop
    loadDailyTop();

    // Якщо є збережені параметри — одразу шукаємо
    const savedCity = sessionStorage.getItem('shopping_city');
    if (savedCity && selectedType) searchShops(savedCity, selectedType);
}

async function loadDailyTop() {
    const section = document.getElementById('shopDailyTop');
    if (!section) return;

    try {
        const res  = await fetch('/api/daily-top');
        const data = await res.json();

        if (!data.top?.length) { section.style.display = 'none'; return; }

        section.style.display = 'block';
        const grid = section.querySelector('.daily-top-grid');
        if (!grid) return;

        const medals = ['🥇', '🥈', '🥉'];

        grid.innerHTML = data.top.map((place, i) => {
            const photo      = place.photo_url || SHOP_NO_PHOTO;
            const rating     = place.rating ? parseFloat(place.rating).toFixed(1) : '—';
            const detailUrl  = `/html/city_page.html?placeId=${place.place_id}&name=${encodeURIComponent(place.name||'')}`;
            const shortAddr  = (place.address||'').split(',').slice(0,2).join(',').trim();

            return `
            <div class="daily-card" style="animation-delay:${i*0.12}s">
                <div class="daily-card-rank">${medals[i]||''}</div>
                <div class="daily-card-img-wrap">
                    <img src="${photo}"
                         onerror="this.onerror=null;this.src='${SHOP_NO_PHOTO}'"
                         alt="${place.name||''}"/>
                    <div class="daily-card-overlay"></div>
                    <div class="daily-card-category">${place.category||''}</div>
                </div>
                <div class="daily-card-body">
                    <h3 class="daily-card-name">${place.name||'Без назви'}</h3>
                    <div class="daily-card-rating">
                        <i class="fas fa-star"></i> ${rating}
                    </div>
                    <p class="daily-card-addr">
                        <i class="fas fa-map-marker-alt"></i> ${shortAddr||'—'}
                    </p>
                    <a href="${detailUrl}" class="daily-card-btn">
                        <i class="fas fa-arrow-right"></i> Відкрити
                    </a>
                </div>
            </div>`;
        }).join('');

        // Таймер до наступного оновлення (рахується від updated_at в БД)
        const timer = section.querySelector('.daily-top-timer');
        if (timer && data.top[0]?.updated_at) {
            const nextUpdate = new Date(data.top[0].updated_at).getTime() + 24 * 60 * 60 * 1000;
            function tick() {
                const diff = nextUpdate - Date.now();
                if (diff <= 0) { timer.textContent = 'Оновлюється...'; return; }
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                timer.textContent = `🕐 Оновлення через ${h}г ${m}хв ${s}с`;
                setTimeout(tick, 1000);
            }
            tick();
        }

    } catch(e) {
        console.error('[DAILYTOP] load error:', e);
        if (section) section.style.display = 'none';
    }
}




async function searchShops(city, type) {
    const loader         = document.getElementById('shopLoader');
    const resultsSection = document.getElementById('shopResultsSection');
    const resultsGrid    = document.getElementById('shopResultsGrid');
    const meta           = document.getElementById('shopResultsMeta');
    const emptyEl        = document.getElementById('shopEmpty');

    loader.style.display = 'flex';
    resultsSection.style.display = 'none';
    emptyEl.style.display = 'none';
    resultsGrid.innerHTML = '';

    try {
        const res = await fetch('/api/shopping/search', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, type })
        });
        const data = await res.json();
        loader.style.display = 'none';

        if (!data.results?.length) { emptyEl.style.display = 'flex'; return; }

        meta.textContent = `${data.results.length} магазинів · ${data.source === 'database' ? '📦 з кешу' : '🌐 Google'}`;
        resultsSection.style.display = 'block';
        resultsGrid.innerHTML = data.results.map(shop => buildShopCard(shop, city)).join('');

        resultsGrid.querySelectorAll('.shop-card').forEach((card, i) => {
            card.style.animationDelay = `${i * 0.07}s`;
            card.classList.add('card-appear');
        });

    } catch(err) {
        loader.style.display = 'none';
        emptyEl.style.display = 'flex';
        console.error('[SHOPPING]', err);
    }
}


function buildShopCard(shop, city = '') {
    const rating    = shop.rating ? parseFloat(shop.rating).toFixed(1) : '—';
    const stars     = shop.rating
        ? '★'.repeat(Math.round(shop.rating)) + '☆'.repeat(5 - Math.round(shop.rating))
        : '';
    const photo     = shop.photo_url || SHOP_NO_PHOTO;
    const detailUrl = `/html/city_page.html?placeId=${shop.place_id}&name=${encodeURIComponent(shop.query_name || '')}`;

    return `
    <div class="shop-card"
         data-id="${shop.place_id}"
         data-name="${(shop.query_name||'').replace(/"/g,'&quot;')}"
         data-city="${city}">
        <div class="shop-card-img-wrap">
            <img class="shop-card-img"
                 src="${photo}"
                 onerror="this.onerror=null;this.src='${SHOP_NO_PHOTO}'"
                 loading="lazy"
                 alt="${(shop.query_name||'').replace(/"/g,'&quot;')}"/>
            <div class="shop-card-overlay"></div>
            ${(shop.save_count > 0)
                ? `<div class="shop-popular-badge"><i class="fas fa-fire"></i> ${shop.save_count}</div>`
                : ''}
        </div>
        <div class="shop-card-body">
            <h3 class="shop-card-name">${shop.query_name || 'Без назви'}</h3>
            ${rating !== '—' ? `
            <div class="shop-card-rating">
                <span class="shop-stars">${stars}</span>
                <span class="shop-rating-num">${rating}</span>
            </div>` : ''}
            <p class="shop-card-addr">
                <i class="fas fa-map-marker-alt"></i>
                ${shop.full_name || '—'}
            </p>
            <a class="shop-route-btn" href="${detailUrl}">
                <i class="fas fa-info-circle"></i> Детальніше
            </a>
        </div>
    </div>`;
}






async function performSearch() {
    const statusText  = document.getElementById('nearbyStatus');
    const radiusInput = document.getElementById('nearbyRadius');
    const activeChip  = document.querySelector('.chip.active');
    let category = activeChip ? activeChip.dataset.type || activeChip.innerText : 'tourist_attraction';
    category = category.toLowerCase().replace(/\s+/g,'_');
    if (!statusText) return;
    statusText.innerHTML = `<i class="fas fa-sync fa-spin"></i> Опитування локальної бази...`;
    try {
        const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
        const {latitude,longitude} = pos.coords;
        const radius = (radiusInput?radiusInput.value:12)*1000;
        const dbRes = await fetch('/api/nearby/get',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({latitude,longitude,radius,category})});
        if (dbRes.ok) {
            const dbData = await dbRes.json();
            if (dbData.results&&dbData.results.length>0) { statusText.innerText=`Знайдено ${dbData.results.length} локацій (з бази)`; renderNearbyCards(dbData.results); return; }
        }
        statusText.innerHTML=`<i class="fas fa-satellite"></i> Супутниковий пошук Google...`;
        await loadGoogleMapsAPI();
        const {Place,SearchNearbyRankPreference} = await google.maps.importLibrary("places");
        const {places} = await Place.searchNearby({
            fields:["displayName","location","rating","photos","id","formattedAddress"],
            locationRestriction:{center:new google.maps.LatLng(latitude,longitude),radius},
            includedPrimaryTypes:[category], maxResultCount:20,
            rankPreference:SearchNearbyRankPreference.POPULARITY
        });
        if (places&&places.length>0) {
            const NO_PHOTO="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%230e1425'/%3E%3C/svg%3E";
            const results=places.map(p=>({place_id:p.id,name:p.displayName?.text||p.displayName||"Без назви",vicinity:p.formattedAddress,rating:p.rating||4.5,latitude:p.location.lat(),longitude:p.location.lng(),photo_url:p.photos?.[0]?.getURI({maxWidth:800})||NO_PHOTO,types:[category]}));
            renderNearbyCards(results);
            statusText.innerText=`Знайдено ${places.length} нових локацій`;
            syncNearbyWithBackend(results);
        } else { throw new Error("ZERO_RESULTS"); }
    } catch(err) {
        if(statusText) statusText.innerText=err.message==="ZERO_RESULTS"?"Нічого не знайдено поруч":"Помилка доступу до геолокації";
    }
}

function renderNearbyCards(places) {
    const NO_PHOTO="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%230e1425'/%3E%3C/svg%3E";
    const grid=document.getElementById('nearbyGrid'); if(!grid)return;
    grid.innerHTML='';
    places.forEach((p,i)=>{
        const card=document.createElement('div'); card.className='place-card-v2';
        const placeName = p.name || p.query_name || p.displayName || 'Без назви';
        const rawAddr = p.vicinity || p.formatted_address || p.full_name || p.description || '';
        let addr = rawAddr.trim();
        if (addr.length > 55) {
            const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
            const meaningful = parts.filter(s => !/^\d+$/.test(s) && s.toLowerCase() !== 'україна');
            addr = meaningful.slice(0, 2).join(', ');
        }
        const displayAddr = addr || 'Адреса не вказана';
        const rating = parseFloat(p.rating) || 0;
        const ratingDisplay = rating > 0 ? rating.toFixed(1) : '—';
        card.innerHTML=`
            <div class="card-img-wrapper">
                <img src="${p.photo_url||NO_PHOTO}" class="card-main-img" loading="lazy" onerror="this.src='${NO_PHOTO}'">
                <div class="card-rating-glass"><i class="fas fa-star"></i> ${ratingDisplay}</div>
            </div>
            <div class="card-info">
                <h4 class="card-title">${placeName}</h4>
                <p class="card-addr"><i class="fas fa-map-marker-alt"></i>${displayAddr}</p>
                <button class="glow-btn" style="margin-top:auto;padding:10px 20px;font-size:13px;">Детальніше</button>
            </div>`;
        card.querySelector('.glow-btn').addEventListener('click', () => {
            window.location.href = `/html/city_page.html?placeId=${p.place_id}`;
        });
        grid.appendChild(card);
        card.style.opacity = '0'; card.style.transform = 'translateY(16px)';
        setTimeout(() => { card.style.transition = 'opacity 0.35s ease, transform 0.35s ease'; card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, i * 70);
    });
}

function syncNearbyWithBackend(results) {
    fetch('/api/nearby/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({places:results})}).catch(e=>console.error("Sync error:",e));
}

function initNearbyPage() {
    const radiusInput = document.getElementById('nearbyRadius');
    const chips       = document.querySelectorAll('.chip');
    const startBtn    = document.getElementById('startNearbySearch');

    if (window._pendingNearbyCategory) {
        chips.forEach(c => c.classList.remove('active'));
        const target = document.querySelector(`.chip[data-type="${window._pendingNearbyCategory}"]`);
        if (target) target.classList.add('active');
        window._pendingNearbyCategory = null;
    }

    chips.forEach(chip=>{
        chip.addEventListener('click',()=>{ if(chip.classList.contains('active'))return; chips.forEach(c=>c.classList.remove('active')); chip.classList.add('active'); performSearch(); });
    });
    if(radiusInput){ radiusInput.oninput=()=>{ const v=document.getElementById('radiusVal'); if(v)v.textContent=radiusInput.value+' км'; }; radiusInput.onchange=()=>performSearch(); }
    if(startBtn) startBtn.addEventListener('click',performSearch);
    setTimeout(()=>performSearch(),1000);
}





const updateActiveMenu = key => {
    document.querySelectorAll('[data-page]').forEach(el => {
        el.classList.toggle('active-nav', el.getAttribute('data-page') === key);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-page') === key);
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
    if (key !== 'profile') profileStatsInited = false;
    
    const content = typeof pages[key] === 'function' ? pages[key]() : pages[key];
    mainPageFunctions.loadPageContent(content);
    
    const main = document.getElementById('main-page-content');
    if (main) animatePageIn(main);
    if (push) window.history.pushState({ page: key }, '', `#${key}`);
    updateActiveMenu(key);
    bindNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if      (key === 'dashboard') initDashboard();
    else if (key === 'shopping')  initShoppingPage();
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