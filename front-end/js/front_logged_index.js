import { mainPageFunctionsHandler } from "./functions.js";

const mainPageFunctions = new mainPageFunctionsHandler();

const pages = {
    dashboard: `
    <div class="dashboard-wrapper fade-in">
        <div class="hero-section" style="background: linear-gradient(135deg, #701a75 0%, #2e1065 100%); padding: 80px 40px; border-radius: 40px; margin-bottom: 50px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
            <div style="position: relative; z-index: 2;">
                <h1 style="font-weight: 800; margin-bottom: 15px; color: #fff; font-size: clamp(28px, 5vw, 48px);">Привіт, Artemka! 👋</h1>
                <p style="font-size: clamp(16px, 2vw, 20px); opacity: 0.8; color: #e2e8f0;">Готовий відкрити нові місця сьогодні?</p>
            </div>
            <div style="position: absolute; top: -50px; right: -50px; width: 250px; height: 250px; background: #c026d3; filter: blur(120px); opacity: 0.3;"></div>
        </div>

        <div class="top-cards-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 50px;">
            <div class="mini-card" data-page="favorites" style="background: #1e293b; padding: 40px 30px; border-radius: 35px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s;">
                <span style="font-weight: 700; font-size: 18px; color: #f1f5f9;">Улюблені</span>
                <div style="background: #fb7185; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(251,113,133,0.3); color: white; font-size: 24px;"><i class="fas fa-heart"></i></div>
            </div>
            <div class="mini-card" data-page="photos" style="background: #1e293b; padding: 40px 30px; border-radius: 35px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s;">
                <span style="font-weight: 700; font-size: 18px; color: #f1f5f9;">Альбом</span>
                <div style="background: #38bdf8; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(56,189,248,0.3); color: white; font-size: 24px;"><i class="fas fa-image"></i></div>
            </div>
            <div class="mini-card" style="background: #1e293b; padding: 40px 30px; border-radius: 35px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.05);">
                <span style="font-weight: 700; font-size: 18px; color: #f1f5f9;">Поради</span>
                <div style="background: #a78bfa; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(167,139,250,0.3); color: white; font-size: 24px;"><i class="fas fa-magic"></i></div>
            </div>
        </div>

        <div class="main-options-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 50px;">
            <div class="option-card" style="background: #1e293b; padding: 40px; border-radius: 40px; display: flex; align-items: center; gap: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="background: #fbbf24; min-width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 30px; color: white;"><i class="fas fa-chart-line"></i></div>
                <div>
                    <h3 style="margin: 0; font-size: 22px; color: #fff; font-weight: 800;">Тренди</h3>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #94a3b8;">Популярне зараз</p>
                </div>
            </div>
            <div class="option-card" style="background: #1e293b; padding: 40px; border-radius: 40px; display: flex; align-items: center; gap: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="background: #10b981; min-width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 30px; color: white;"><i class="fas fa-location-dot"></i></div>
                <div>
                    <h3 style="margin: 0; font-size: 22px; color: #fff; font-weight: 800;">Поруч</h3>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #94a3b8;">Місця неподалік</p>
                </div>
            </div>
        </div>

        <div class="search-wrapper">
          <div class="search-bar">
            <div class="search-section" style="position: relative;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40 C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                </svg>
                <input type="text" id="searchInput" placeholder="Search Place" autocomplete="off" />
                <ul id="suggestionsList"></ul>
            </div>
            <button class="search-button">Search</button>

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
          <button class="scroll-button left">&#10094;</button>
          <div class="scroll-container" id="cityContainer"></div>
          <button class="scroll-button right">&#10095;</button>
          
          <div class="progress-bar-container">
            <div class="progress-line-track">
              <div class="progress-line-thumb" id="scrollThumb"></div>
            </div>
          </div>
        </div>

        <h2 style="margin: 30px 0 30px; font-size: 28px; font-weight: 800; color: #fff; font-family: sans-serif;">Категорії</h2>
        <div class="grid-container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 50px;">
            <div class="cat-card" style="background: #1e293b; padding: 45px 20px; border-radius: 40px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.transform='translateY(-10px)'; this.style.background='#243049';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#1e293b';">
                <div style="background: #f43f5e; width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 28px; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-utensils"></i>
                </div>
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Ресторани</span>
            </div>
            <div class="cat-card" style="background: #1e293b; padding: 45px 20px; border-radius: 40px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.transform='translateY(-10px)'; this.style.background='#243049';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#1e293b';">
                <div style="background: #3b82f6; width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 28px; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-hotel"></i>
                </div>
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Готелі</span>
            </div>
            <div class="cat-card" style="background: #1e293b; padding: 45px 20px; border-radius: 40px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.transform='translateY(-10px)'; this.style.background='#243049';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#1e293b';">
                <div style="background: #10b981; width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 28px; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-tree"></i>
                </div>
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Парки</span>
            </div>
            <div class="cat-card" style="background: #1e293b; padding: 45px 20px; border-radius: 40px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.transform='translateY(-10px)'; this.style.background='#243049';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#1e293b';">
                <div style="background: #8b5cf6; width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 28px; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-landmark"></i>
                </div>
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Музеї</span>
            </div>
            <div class="cat-card" style="background: #1e293b; padding: 45px 20px; border-radius: 40px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.transform='translateY(-10px)'; this.style.background='#243049';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#1e293b';">
                <div style="background: #f59e0b; width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 28px; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-mug-hot"></i>
                </div>
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Кафе</span>
            </div>
            <div class="cat-card" style="background: #1e293b; padding: 45px 20px; border-radius: 40px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.transform='translateY(-10px)'; this.style.background='#243049';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#1e293b';">
                <div style="background: #ec4899; width: 70px; height: 70px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 28px; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Магазини</span>
            </div>
        </div>
    </div>
    <div id="ai-launcher" class="ai-launcher">
    <i class="fas fa-robot"></i>
    <span class="notification-badge"></span>
</div>

<div id="ai-widget-container" class="ai-widget">
    <div class="ai-header">
        <div class="ai-info">
            <div class="ai-status-dot"></div>
            <div>
                <h4 id="aiStatus">Онлайн</h4>
                <p id="cacheInfo">Завантаження...</p>
            </div>
        </div>
        <div class="ai-controls">
            <button id="themeToggle" title="Змінити тему">🌙</button>
            <button id="clearChatBtn" title="Очистити кеш"><i class="fas fa-trash-alt"></i></button>
            <button id="minimizeChat" title="Згорнути">—</button>
        </div>
    </div>

    <div id="aiBody" class="ai-body">
        <div id="chatWindow" class="chat-messages">
            </div>
        
        <div id="aiSuggestions" class="ai-suggestions">
            <span class="suggestion">Найкращі ресторани Києва?</span>
            <span class="suggestion">Покажи готелі поруч</span>
            <span class="suggestion">Що цікавого у Львові?</span>
        </div>
    </div>

    <div class="ai-footer">
        <div class="input-wrapper">
            <input type="text" id="chatInput" placeholder="Запитайте будь-що..." autocomplete="off">
            <button id="sendBtn">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
</div>
    `,






  profile: `
<div class="profile-page-wrapper fade-in">
    <div class="profile-card">
        <div class="profile-banner"></div>
        
        <div class="profile-main-content">
            <div class="profile-info-header">
                <div class="profile-avatar-container">
                    <div class="avatar-circle">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
                <div class="profile-titles">
                    <h1 class="profile-name">Artemka</h1>
                    <p class="profile-location"><i class="fas fa-map-marker-alt"></i> Київ, Україна</p>
                </div>
                <button class="edit-profile-btn">
                    <i class="fas fa-edit"></i> Редагувати
                </button>
            </div>

            <div class="profile-stats-grid">
                <div class="stat-box purple">
                    <div class="stat-icon"><i class="fas fa-map-marked-alt"></i></div>
                    <div class="stat-text">
                        <p>Відвідано</p>
                        <span>124</span>
                    </div>
                </div>
                <div class="stat-box blue">
                    <div class="stat-icon"><i class="fas fa-camera"></i></div>
                    <div class="stat-text">
                        <p>Фотографій</p>
                        <span>142</span>
                    </div>
                </div>
                <div class="stat-box green">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-text">
                        <p>Учасник з</p>
                        <span>2023</span>
                    </div>
                </div>
            </div>

            <div class="profile-contacts">
                <div class="contact-item">
                    <i class="far fa-envelope"></i> artemka@example.com
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone-alt"></i> +380 (XX) XXX-XX-XX
                </div>
            </div>

            <hr class="profile-divider">

            <div class="profile-about">
                <h3>Про себе</h3>
                <p>Люблю подорожувати та відкривати нові місця. Завжди шукаю цікаві ресторани та кав'ярні. Фотографія — моє хобі! 📸</p>
            </div>
        </div>
    </div>
      <div id="ai-launcher" class="ai-launcher">
    <i class="fas fa-robot"></i>
    <span class="notification-badge"></span>
</div>

<div id="ai-widget-container" class="ai-widget">
    <div class="ai-header">
        <div class="ai-info">
            <div class="ai-status-dot"></div>
            <div>
                <h4 id="aiStatus">Онлайн</h4>
                <p id="cacheInfo">Завантаження...</p>
            </div>
        </div>
        <div class="ai-controls">
            <button id="themeToggle" title="Змінити тему">🌙</button>
            <button id="clearChatBtn" title="Очистити кеш"><i class="fas fa-trash-alt"></i></button>
            <button id="minimizeChat" title="Згорнути">—</button>
        </div>
    </div>

    <div id="aiBody" class="ai-body">
        <div id="chatWindow" class="chat-messages">
            </div>
        
        <div id="aiSuggestions" class="ai-suggestions">
            <span class="suggestion">Найкращі ресторани Києва?</span>
            <span class="suggestion">Покажи готелі поруч</span>
            <span class="suggestion">Що цікавого у Львові?</span>
        </div>
    </div>

    <div class="ai-footer">
        <div class="input-wrapper">
            <input type="text" id="chatInput" placeholder="Запитайте будь-що..." autocomplete="off">
            <button id="sendBtn">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
</div>
`,





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
                    <div class="card-head">
                        <i class="fas fa-sliders-h"></i>
                        <h3>Налаштування радару</h3>
                    </div>
                    
                    <div class="range-group">
                        <div class="range-info">
                            <span>Радіус пошуку</span>
                            <b id="radiusVal">12 км</b>
                        </div>
                        <input type="range" id="nearbyRadius" min="1" max="50" value="12" class="modern-slider">
                    </div>

                    <div class="category-chips">
                        <button class="chip active" data-type="tourist_attraction">Пам'ятки</button>
                        <button class="chip" data-type="park">Парки</button>
                        <button class="chip" data-type="museum">Музеї</button>
                        <button class="chip" data-type="restaurant">Ресторани</button>
                    </div>

                    <button id="startNearbySearch" class="glow-btn">
                        <i class="fas fa-crosshairs"></i> Сканувати вручну
                    </button>
                </div>
            </aside>

            <main class="nearby-results">
                <div id="nearbyGrid" class="places-grid-v2">
                    <div class="nearby-placeholder">
                       
                    </div>
                </div>
            </main>
        </div>
    </div>
    `,







    photos: `<div style="padding:40px; color:white;"><h2>Альбом</h2></div>`,






settings: `
    <div class="dashboard-wrapper fade-in">
      <header class="settings-hero">
    <div class="hero-bg-glow"></div> <div class="hero-content">
        <div class="badge-premium">Система v2.4</div>
        <h1 class="glitch-text" data-text="Налаштування">Налаштування</h1>
        <div class="hero-separator"></div>
        <p>Центральна панель керування акаунтом. <span>Персоналізуйте свій досвід у Top Spots.</span></p>
    </div>
</header>

        <div class="settings-grid">
            <section class="settings-card">
                <div class="card-head">
                    <div class="icon-box purple"><i class="fas fa-bell"></i></div>
                    <h3>Сповіщення</h3>
                </div>
                <div class="card-body">
                    <div class="setting-item">
                        <div class="info">
                            <span class="label">Email сповіщення</span>
                            <span class="sub-label">Отримуйте новини про нові локації на пошту</span>
                        </div>
                        <label class="ios-switch">
                            <input type="checkbox" checked>
                            <span class="ios-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <div class="info">
                            <span class="label">Push сповіщення</span>
                            <span class="sub-label">Миттєві повідомлення у браузері</span>
                        </div>
                        <label class="ios-switch">
                            <input type="checkbox">
                            <span class="ios-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <div class="info">
                            <span class="label">Нові місця поруч</span>
                            <span class="sub-label">Сповіщати, коли я біля цікавої пам'ятки</span>
                        </div>
                        <label class="ios-switch">
                            <input type="checkbox" checked>
                            <span class="ios-slider"></span>
                        </label>
                    </div>
                </div>
            </section>

            <section class="settings-card">
                <div class="card-head">
                    <div class="icon-box blue"><i class="fas fa-user-shield"></i></div>
                    <h3>Конфіденційність</h3>
                </div>
                <div class="card-body">
                    <div class="setting-item">
                        <div class="info">
                            <span class="label">Публічний профіль</span>
                            <span class="sub-label">Дозволити іншим бачити мої фото та відгуки</span>
                        </div>
                        <label class="ios-switch">
                            <input type="checkbox" checked>
                            <span class="ios-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <div class="info">
                            <span class="label">Показувати локацію</span>
                            <span class="sub-label">Ваше місцезнаходження для пошуку поруч</span>
                        </div>
                        <label class="ios-switch">
                            <input type="checkbox">
                            <span class="ios-slider"></span>
                        </label>
                    </div>
                </div>
            </section>

            <section class="settings-card full-width">
                <div class="card-head">
                    <div class="icon-box orange"><i class="fas fa-key"></i></div>
                    <h3>Дії з акаунтом</h3>
                </div>
                <div class="action-grid">
                    <div class="action-box">
                        <div class="action-text">
                            <h4>Змінити пароль</h4>
                            <p>Останні зміни: 2 місяці тому</p>
                        </div>
                        <button class="action-btn">Оновити</button>
                    </div>
                    
                    <div class="action-box">
                        <div class="action-text">
                            <h4>Змінити email</h4>
                            <p>artemka@example.com</p>
                        </div>
                        <button class="action-btn">Змінити</button>
                    </div>

                    <div class="action-box">
                        <div class="action-text">
                            <h4>Завантажити дані</h4>
                            <p>Отримай копію всіх твоїх дій у форматі JSON</p>
                        </div>
                        <button class="action-btn secondary"><i class="fas fa-download"></i></button>
                    </div>

                    <div class="action-box danger-zone">
                        <div class="action-text">
                            <h4 class="text-danger">Видалити акаунт</h4>
                            <p>Це призведе до незворотного видалення даних</p>
                        </div>
                        <button class="action-btn danger">Видалити</button>
                    </div>
                </div>
            </section>
        </div>
    </div>
    `
};




function initAIChat() {
    const launcher = document.getElementById("ai-launcher");
    const widget = document.getElementById("ai-widget-container");
    const chatWindow = document.getElementById("chatWindow");
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");
    const clearChatBtn = document.getElementById("clearChatBtn");
    const aiStatus = document.getElementById("aiStatus");
    const cacheInfo = document.getElementById("cacheInfo");
    const minimizeBtn = document.getElementById("minimizeChat");
    const suggestions = document.getElementById("aiSuggestions");

    // Захист: якщо елементів немає на сторінці — виходимо
    if (!launcher || !widget || !chatWindow) return;

    const ENDPOINT = "/chat/assistant";
    const THROTTLE_MS = 1200; // Захист від спаму (1.2 сек)
    const CACHE_KEY = "topspots_chat_cache_v1";
    
    let lastSentTs = 0;
    let localCache = {};

    // Завантаження кешу з браузера
    try {
        localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch (e) {
        localCache = {};
    }

    // Функція оновлення лічильника кешу в інтерфейсі
    const updateCacheDisplay = () => {
        if (cacheInfo) {
            const count = Object.keys(localCache).length;
            cacheInfo.textContent = `Пам'ять: ${count} відповідей`;
        }
    };

    // Функція створення та додавання повідомлення
    function appendMessage(text, cls = "bot-msg", isTypingEffect = false) {
        const node = document.createElement("div");
        node.className = `msg ${cls}`;
        
        // Створюємо структуру повідомлення для бота (з аватаром)
        if (cls === "bot-msg") {
            const avatar = document.createElement("div");
            avatar.className = "msg-avatar";
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
            node.appendChild(avatar);

            const textContainer = document.createElement("div");
            textContainer.className = "msg-text";
            node.appendChild(textContainer);

            // Ефект поступового друку тексту
            if (isTypingEffect) {
                let i = 0;
                textContainer.textContent = ""; 
                const typeInterval = setInterval(() => {
                    if (i < text.length) {
                        textContainer.textContent += text.charAt(i);
                        i++;
                        chatWindow.scrollTop = chatWindow.scrollHeight;
                    } else {
                        clearInterval(typeInterval);
                    }
                }, 25); // Швидкість друку (25мс на символ)
            } else {
                textContainer.textContent = text;
            }
        } else {
            // Звичайне повідомлення користувача
            node.textContent = text;
        }

        chatWindow.appendChild(node);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return node;
    }

    // Функція відправки запиту
    async function handleSend() {
        const message = input.value.trim();
        
        if (!message) return;
        
        // Перевірка на швидкість відправки (throttle)
        if (Date.now() - lastSentTs < THROTTLE_MS) {
            if (aiStatus) aiStatus.textContent = "Зачекайте секунду...";
            setTimeout(() => aiStatus.textContent = "Онлайн", 2000);
            return;
        }

        lastSentTs = Date.now();
        appendMessage(message, "user-msg"); // Додаємо текст юзера в чат
        input.value = ""; // Очищуємо поле вводу

        // ПЕРЕВІРКА КЕШУ
        if (localCache[message]) {
            console.log("Взято з локального кешу");
            // Невелика затримка для реалістичності
            setTimeout(() => appendMessage(localCache[message], "bot-msg", true), 600);
            return;
        }

        // Відображення індикатора завантаження
        const typingIndicator = appendMessage("AI думає...", "bot-msg typing");

        try {
            const response = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) throw new Error("Помилка сервера");

            const data = await response.json();
            
            // Видаляємо індикатор завантаження і додаємо реальну відповідь
            typingIndicator.remove();
            appendMessage(data.reply, "bot-msg", true);

            // Зберігаємо в кеш
            localCache[message] = data.reply;
            localStorage.setItem(CACHE_KEY, JSON.stringify(localCache));
            updateCacheDisplay();

        } catch (err) {
            console.error("Chat Error:", err);
            typingIndicator.remove();
            appendMessage("Вибачте, сталася помилка з'єднання з сервером. Спробуйте пізніше.", "bot-msg");
        }
    }

    // --- ОБРОБНИКИ ПОДІЙ (EVENTS) ---

    // Відкрити / Закрити віджет
    launcher.onclick = () => {
        widget.classList.toggle("active");
        if (widget.classList.contains("active")) {
            input.focus();
        }
    };

    // Згорнути чат
    minimizeBtn.onclick = (e) => {
        e.stopPropagation();
        widget.classList.remove("active");
    };

    // Кнопка відправити
    sendBtn.onclick = handleSend;

    // Клавіша Enter
    input.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Очистити історію та кеш
    clearChatBtn.onclick = () => {
        if (confirm("Очистити всю історію чату?")) {
            localCache = {};
            localStorage.removeItem(CACHE_KEY);
            chatWindow.innerHTML = "";
            updateCacheDisplay();
            appendMessage("Пам'ять очищена. Чим я можу допомогти зараз?", "bot-msg", true);
        }
    };

    // Клік по підказках (suggestions)
    if (suggestions) {
        suggestions.onclick = (e) => {
            const tag = e.target.closest(".suggestion-tag");
            if (tag) {
                input.value = tag.innerText.trim();
                handleSend();
            }
        };
    }

    // Початковий запуск
    updateCacheDisplay();
    if (chatWindow.children.length === 0) {
        setTimeout(() => {
            appendMessage("Привіт! Я AI-помічник Top Spots. Я допоможу знайти найкращі локації для відпочинку!", "bot-msg", true);
        }, 1000);
    }
    // Додай це в кінець функції initAIChat
window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '');
    console.log(`AI знає, що ти перейшов на ${page}`);
    // Тут можна змусити бота дати підказку по новій сторінці
});
}


function initNearbyPage() {
    const radiusInput = document.getElementById('nearbyRadius');
    const radiusLabel = document.getElementById('radiusVal');
    const chips = document.querySelectorAll('.chip');
    const statusText = document.getElementById('nearbyStatus');
    
    let selectedCategory = 'tourist_attraction';
    let debounceTimer;

    // Спільна функція пошуку
    const performSearch = async () => {
        statusText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Оновлюємо локації...`;
        
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 });
            });

            const { latitude, longitude } = pos.coords;
            const radius = radiusInput.value;
            
            const places = await fetchNearbyFromGoogle(latitude, longitude, radius, selectedCategory);
            renderNearbyCards(places);
            
            statusText.innerText = `Знайдено ${places.length} локацій поруч`;
        } catch (err) {
            statusText.innerText = "Увімкніть доступ до локації для пошуку";
        }
    };

    // 1. Оновлення при кліку на категорію
    chips.forEach(chip => {
        chip.onclick = () => {
            if (chip.classList.contains('active')) return; // Не оновлювати, якщо вже вибрано
            
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedCategory = chip.dataset.type;
            
            performSearch(); // Миттєве оновлення
        };
    });

    // 2. Оновлення при зміні радіусу (з невеликою затримкою Debounce)
    radiusInput.oninput = (e) => {
        const val = e.target.value;
        radiusLabel.innerText = `${val} км`;
        
        // Щоб не закидати Google API запитами під час руху повзунка,
        // чекаємо 500мс після того, як юзер зупинився
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 500);
    };

    // Перший запуск при завантаженні сторінки
    performSearch();
}
async function fetchNearbyFromGoogle(lat, lng, radiusKm, type) {
    return new Promise((resolve) => {
        const dummyNode = document.createElement('div');
        const service = new google.maps.places.PlacesService(dummyNode);
        
        const request = {
            location: new google.maps.LatLng(lat, lng),
            radius: radiusKm * 1000,
            type: type
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                // Фільтруємо лише ті, де є фото
                resolve(results.filter(p => p.photos && p.photos.length > 0));
            } else {
                resolve([]);
            }
        });
    });
}
function renderNearbyCards(places) {
    const grid = document.getElementById('nearbyGrid');
    grid.innerHTML = '';

    if (!places || places.length === 0) {
        grid.innerHTML = `
            <div class="nearby-placeholder">
                <i class="fas fa-search-minus" style="font-size: 3rem; color: #475569;"></i>
                <p>Нічого не знайдено поруч. Спробуйте збільшити радіус!</p>
            </div>`;
        return;
    }

    places.forEach((p, i) => {
        const photoUrl = p.photos ? p.photos[0].getUrl({ maxWidth: 600 }) : 'https://via.placeholder.com/600x400?text=No+Photo';
        const rating = p.rating ? `⭐ ${p.rating}` : '⭐ 0.0';
        
        const card = document.createElement('div');
        card.className = 'place-card-v2';
        
        // Анімація появи з затримкою
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${photoUrl}" alt="${p.name}" loading="lazy">
                <div class="card-rating-badge">${rating}</div>
            </div>
            <div class="card-content">
                <h4>${p.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${p.vicinity || 'Адреса невідома'}</p>
                <button class="details-link" onclick="window.location.href='/html/city_page.html?placeId=${p.place_id}'">
                    Деталі <i class="fas fa-chevron-right" style="font-size: 0.7rem;"></i>
                </button>
            </div>
        `;
        
        grid.appendChild(card);
        
        // Запускаємо анімацію
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 60);
    });
}




















// --- ПОВНА ЛОГІКА AI ПОМІЧНИКА TOP SPOTS ---


const truncate = (text, limit) => {
    if (!text) return "";
    return text.length > limit ? text.slice(0, limit) + "..." : text;
};

// Глобальна змінна для обраної категорії
let selectedCategory = null;




















/*--- ЛОГІКА ГОЛОВНОЇ СТОРІНКИ (DASHBOARD) ---*/
function initDashboard() {
    const container = document.getElementById("cityContainer");
    const thumb = document.getElementById("scrollThumb");
    const searchInput = document.getElementById("searchInput");
    const suggestionsList = document.getElementById("suggestionsList");
    const categoryButtons = document.querySelectorAll(".search-category");

    // 1. ПОЧАТКОВІ МІСТА
    const cities = [
        { name: "Київ", description: "Столиця України", rating: 4.8, image: "../img/cit/kiev.jpg" },
        { name: "Львів", description: "Культурна столиця", rating: 4.7, image: "../img/cit/lviv.jpg" },
        { name: "Одеса", description: "Морська перлина", rating: 4.6, image: "../img/cit/odesa.jpg" },
        { name: "Харків", description: "Студентське місто", rating: 4.5, image: "../img/cit/harkiv.jpg" },
        { name: "Дніпро", description: "Промисловий центр", rating: 4.4, image: "../img/cit/dnepr.jpg" },
        { name: "Запоріжжя", description: "Місто козацької слави", rating: 4.3, image: "../img/cit/zaporoshe.jpg" },
        { name: "Вінниця", description: "Місто фонтанів", rating: 4.2, image: "../img/cit/vinica.jpg" },
        { name: "Чернівці", description: "Місто університетів", rating: 4.1, image: "../img/cit/chernivci.jpg" },
        { name: "Івано-Франківськ", description: "Гірське місто", rating: 4.0, image: "../img/cit/ivanofrankovsk.jpg" },
        { name: "Тернопіль", description: "Місто замків", rating: 3.9, image: "../img/cit/ternopil.jpg" },
        { name: "Житомир", description: "Місто космонавтики", rating: 3.8, image: "../img/cit/zhetom.jpg" },
        { name: "Полтава", description: "Місто галушок", rating: 3.7, image: "../img/cit/poltava.jpg" },
        { name: "Черкаси", description: "Місто на Дніпрі", rating: 3.6, image: "../img/cit/cherkasy.jpg" },
        { name: "Суми", description: "Місто вітрів", rating: 3.5, image: "../img/cit/sumy.jpg" },
        { name: "Рівне", description: "Місто парків", rating: 3.4, image: "../img/cit/rivne.jpg" },
        { name: "Хмельницький", description: "Місто садів", rating: 3.3, image: "../img/cit/hmelnycki.jpg" }
    ];

    if (container) {
        container.innerHTML = cities.map(city => `
            <div class="city-card">
                <img src="${city.image}" class="city-image">
                <div class="city-content">
                    <h3 class="city-name">${truncate(city.name, 30)}</h3>
                    <p class="city-description">${truncate(city.description, 35)}</p>
                    <div class="city-rating">⭐ ${city.rating}</div>
                    <button class="map-button">Переглянути</button>
                </div>
            </div>
        `).join('');
    }

    // 2. Логіка скролу
    if (container && thumb) {
        container.onscroll = () => {
            const maxScroll = container.scrollWidth - container.clientWidth;
            const scrollPercent = (container.scrollLeft / maxScroll) * 100;
            thumb.style.left = `${scrollPercent * 0.7}%`;
        };
        const leftBtn = document.querySelector(".scroll-button.left");
        const rightBtn = document.querySelector(".scroll-button.right");
        if (leftBtn) leftBtn.onclick = () => container.scrollBy({ left: -300, behavior: 'smooth' });
        if (rightBtn) rightBtn.onclick = () => container.scrollBy({ left: 300, behavior: 'smooth' });
    }

    // 3. Логіка категорій (датчиків)
    categoryButtons.forEach(cat => {
        cat.onclick = () => {
            const isAlreadyActive = cat.classList.contains("active");
            categoryButtons.forEach(c => c.classList.remove("active"));

            if (!isAlreadyActive) {
                cat.classList.add("active");
                selectedCategory = cat.dataset.type;
            } else {
                selectedCategory = null;
            }

            if (searchInput.value.trim().length >= 3) {
                searchInput.dispatchEvent(new Event("input"));
            }
        };
    });

    // 4. Логіка пошуку
    if (searchInput) {
        searchInput.oninput = async (e) => {
            const query = e.target.value.trim();
            if (query.length < 3) { 
                suggestionsList.classList.remove("show"); 
                return; 
            }

            try {
                const res = await fetch("http://localhost:3500/api/places/autocomplete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input: query, type: selectedCategory })
                });
                const data = await res.json();
                const predictions = (data.predictions || []).slice(0, 5);

                suggestionsList.innerHTML = predictions.map(s => `
                    <li onclick="window.location.href='/html/city_page.html?placeId=${s.place_id}'">
                        ${truncate(s.description, 30)}
                    </li>
                `).join('');
                
                if (predictions.length > 0) suggestionsList.classList.add("show");
                else suggestionsList.classList.remove("show");

                // Оновлення карток
                const cards = document.querySelectorAll(".city-card");
                for (let i = 0; i < Math.min(5, predictions.length); i++) {
                    const detailRes = await fetch("http://localhost:3500/api/places/details", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ place_id: predictions[i].place_id })
                    });
                    const detailData = await detailRes.json();
                    const place = detailData.result;

                    if (place && cards[i]) {
                        cards[i].querySelector(".city-name").textContent = truncate(place.name, 25);
                        cards[i].querySelector(".city-description").textContent = truncate(place.formatted_address, 35);
                        cards[i].querySelector(".city-rating").textContent = `⭐ ${place.rating || 'N/A'}`;
                        if (place.photos && place.photos[0]) {
                            cards[i].querySelector(".city-image").src = 
                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=AIzaSyDW-bqi3Gq8lPld_ese2w6nzWAGKZO9Szw`;
                        }
                    }
                }
            } catch (err) { console.error(err); }
        };
    }
}// 1. Функція підсвітки меню (МАЄ БУТИ ПЕРШОЮ)
const updateActiveMenu = (pageKey) => {
    // Отримуємо всі елементи, які можуть бути кнопками меню
    const menuItems = document.querySelectorAll('[data-page]');
    
    menuItems.forEach(item => {
        // Видаляємо клас активності
        item.classList.remove('active-nav');
        
        // Якщо дата-атрибут збігається з поточною сторінкою — додаємо клас
        if (item.getAttribute('data-page') === pageKey) {
            item.classList.add('active-nav');
        }
    });
};

// 2. Функція прив'язки подій кліку
const bindNavigationEvents = () => {
    const navButtons = document.querySelectorAll('[data-page]');
    
    navButtons.forEach(btn => {
        // Використовуємо onclick або addEventListener
        btn.onclick = (e) => {
            e.preventDefault();
            const page = btn.getAttribute('data-page');
            console.log("Спроба переходу на:", page);
            navigateTo(page);
        };
    });
};

// 3. Головна функція навігації
const navigateTo = (pageKey, addHistory = true) => {
    // Перевірка чи існує контент для сторінки
    if (!pages[pageKey]) {
        console.error(`Сторінку "${pageKey}" не знайдено в об'єкті pages!`);
        return;
    }

    // Рендеримо контент (твій метод з functions.js)
    mainPageFunctions.loadPageContent(pages[pageKey]);

    // Оновлюємо URL
    if (addHistory) {
        window.history.pushState({ page: pageKey }, "", `#${pageKey}`);
    }

    // ТЕПЕР ЦЯ ФУНКЦІЯ ПРАЦЮВАТИМЕ (вона оголошена вище)
    updateActiveMenu(pageKey);

    // Оновлюємо обробники подій для нових елементів, що з'явилися
    bindNavigationEvents();
function initSettingsPage() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.onchange = (e) => {
            console.log("Тема змінена:", e.target.checked);

        };
    }
}
    // Запуск специфічних скриптів для сторінок
    if (pageKey === 'dashboard') {
        if (typeof initDashboard === 'function') initDashboard();
    } else if (pageKey === 'profile') {
        if (typeof initProfilePage === 'function') initProfilePage();
    }
   else if (pageKey === 'nearby') {initNearbyPage(); }
    else if (pageKey === 'settings') {
        if (typeof initSettingsPage === 'function') initSettingsPage();
    }
};

// 4. Обробка подій браузера та завантаження
window.onpopstate = (event) => {
    const page = (event.state && event.state.page) ? event.state.page : 'dashboard';
    navigateTo(page, false);
};

// Викликаємо при старті
document.addEventListener('DOMContentLoaded', () => {
    const initialPage = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(initialPage);

    if (typeof initAIChat === 'function') {
        initAIChat();
    }
});
// Функція ініціалізації профілю (заглушка)
function initProfilePage() {
    console.log("--- Скрипти сторінки профілю активовані ---");
}

