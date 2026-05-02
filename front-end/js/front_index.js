import { mainPageFunctionsHandler } from './functions.js';


// ============================================================
// AUTH GUARD
// ============================================================
const AUTH_URL = '/html/authentication.html';

async function isLoggedIn() {
    console.log("[AUTH]: Checking user status...");
    if (localStorage.getItem('topspots_user')) return true;
    if (sessionStorage.getItem('topspots_session')) return true;
    try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        if (res.ok) {
            const d = await res.json();
            return !!(d?.id || d?.email);
        }
    } catch (e) {
        console.warn("[AUTH]: API check failed");
    }
    return false;
}

function mountAuthGuard() {
    if (document.getElementById('ag-backdrop')) return;
    console.log("[SYSTEM]: Mounting Auth Guard...");
    
    const el = document.createElement('div');
    el.innerHTML = `
        <div id="ag-backdrop">
            <div id="ag-modal" role="dialog" aria-modal="true">
                <div class="ag-particles">
                    <span></span><span></span><span></span>
                    <span></span><span></span><span></span>
                </div>
                <button class="ag-close" id="ag-close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
                <div class="ag-icon-wrap">
                    <div class="ag-icon-ring"></div>
                    <div class="ag-icon-inner">🔐</div>
                </div>
                <p class="ag-eyebrow">Top Spots</p>
                <h2 class="ag-title">Account Required</h2>
                <p class="ag-desc">To use <strong id="ag-feature">this feature</strong>, please sign in or create an account.</p>
                <div class="ag-actions">
                    <button class="ag-btn-reg" id="ag-reg-btn">Register Now</button>
                    <button class="ag-btn-login" id="ag-login-btn">Already have an account? Sign in</button>
                </div>
                <button class="ag-dismiss" id="ag-dismiss">Maybe later</button>
            </div>
        </div>`;
    document.body.appendChild(el.firstElementChild);

    const close = () => {
        document.getElementById('ag-backdrop')?.classList.remove('ag-open');
        document.body.classList.remove('ag-body-lock');
    };

    document.getElementById('ag-close')?.addEventListener('click', close);
    document.getElementById('ag-dismiss')?.addEventListener('click', close);
    document.getElementById('ag-reg-btn')?.addEventListener('click', () => window.location.href = AUTH_URL + '?mode=register');
    document.getElementById('ag-login-btn')?.addEventListener('click', () => window.location.href = AUTH_URL + '?mode=login');
    document.getElementById('ag-backdrop')?.addEventListener('click', e => { if (e.target.id === 'ag-backdrop') close(); });
}

function openAuthModal(featureName) {
    mountAuthGuard();
    const backdrop = document.getElementById('ag-backdrop');
    const feature = document.getElementById('ag-feature');
    if (!backdrop) return;
    if (feature) feature.textContent = featureName;
    backdrop.classList.add('ag-open');
    document.body.classList.add('ag-body-lock');
}

async function requireAuth(featureName, action) {
    const ok = await isLoggedIn();
    if (ok) {
        if (typeof action === 'function') action();
    } else {
        openAuthModal(featureName);
    }
}

// ============================================================
// MAIN PAGE LOGIC
// ============================================================





// 1. Елементи
const burger = document.getElementById("burger");
const navMenu = document.getElementById("navMenu");
const body = document.body;

// 2. Універсальна функція закриття бургера (щоб не дублювати)
function closeBurger() {
    if (navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        burger.classList.remove("active");
        body.style.overflow = "";
    }
}

// 3. Обробка ВСІХ кнопок у хедері (десктоп + бургер)
// Вибираємо всі кнопки всередині .header_list та окрему кнопку SignUp
document.querySelectorAll('.header-ul_element button, #SignUp').forEach(btn => {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        // Отримуємо назву розділу для контексту (якщо треба)
        const sectionName = btn.innerText || btn.getAttribute('data-section');

        // Викликаємо твою функцію перевірки
        await requireAuth(`access ${sectionName}`, () => {
            // Цей код виконається ТІЛЬКИ якщо юзер залогінений
            console.log("Доступ дозволено до:", sectionName);
            closeBurger();
            // Тут може бути редірект або скрол, якщо треба
        });
        
        // Якщо requireAuth викинув вікно реєстрації, 
        // закриваємо бургер, щоб він не перекривав попап
        if (navMenu.classList.contains("active")) {
            closeBurger();
        }
    });
});

// 4. Стандартна логіка відкриття/закриття самого бургера
if (burger && navMenu) {
    burger.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("active");
        burger.classList.toggle("active");
        body.style.overflow = isOpen ? "hidden" : "";
    });
}
document.addEventListener('DOMContentLoaded', async () => {
    console.log("%c[SYSTEM]: Application started", "color: #10b981; font-weight: bold;");
    
    mountAuthGuard();

    const searchInput = document.getElementById("searchInput");
    const suggestionsList = document.getElementById("suggestionsList");
    const container = document.querySelector(".scroll-container");

    const cities = [
        { name: "London", place_id: "ChIJdd4hrwug2EcRmSrV3Vo6llI", photo: "../img/def-sity_img/london.png", rating: 4.9 },
        { name: "Dubai", place_id: "ChIJRcbZaklDXz4RYlEphFBu5r0", photo: "../img/def-sity_img/dubai.png", rating: 4.7 },
        { name: "Paris", place_id: "ChIJD7fiBh9u5kcRYJSMaMOCvaQ", photo: "../img/def-sity_img/paris.png", rating: 4.9 },
        { name: "New York", place_id: "ChIJOwg_06VPwokRYv534QaPC8g", photo: "../img/def-sity_img/new-york.png", rating: 4.8 },
        { name: "Tokyo", place_id: "ChIJ51cu8IcbXWARiRtXIothAS4", photo: "../img/def-sity_img/tokyo.png", rating: 4.9 },
        { name: "Barcelona", place_id: "ChIJ5TCOcRaYpBIRCmZHTz37sEQ", photo: "../img/def-sity_img/barcelone.png", rating: 4.8 },
        { name: "Rome", place_id: "ChIJu46S-ZZhLxMROG5lkwZ3D7k", photo: "../img/def-sity_img/rome.png", rating: 4.8 },
        { name: "Amsterdam", place_id: "ChIJVXealLU_xkcRja_At0z9AGo", photo: "../img/def-sity_img/amsterdam.png", rating: 4.8 }
    ];

    // Рендер карток з обробкою авторизації
    function renderMainCards() {
        if (!container) return;
        
        container.innerHTML = cities.map(city => `
            <div class="city-card" data-id="${city.place_id}">
                <img src="${city.photo}" alt="${city.name}" class="city-image">
                <div class="city-content">
                    <div class="city-name">${city.name}</div>
                    <div class="city-rating">⭐ ${city.rating}</div>
                    <div class="city-description">Discover incredible locations and local culture in ${city.name}.</div>
                    <button class="map-button">View on Map</button>
                </div>
            </div>
        `).join('');

        // Додаємо івент на кожну картку
        container.querySelectorAll('.city-card').forEach(card => {
            card.addEventListener('click', async () => {
                const placeId = card.getAttribute('data-id');
                console.log(`[CLICK]: Card ${placeId} clicked. Checking auth...`);
                
                await requireAuth('view place details', () => {
                    window.location.href = `/html/details.html?id=${placeId}`;
                });
            });
        });
    }

    // Рендер підказок пошуку (також з перевіркою)
    function renderSearchSuggestions(query) {
        if (!suggestionsList) return;
        const filtered = cities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
        
        if (filtered.length > 0) {
            suggestionsList.innerHTML = filtered.map(city => `
                <div class="suggestion-item" data-id="${city.place_id}">
                    <img src="${city.photo}" alt="${city.name}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                    <div class="suggestion-info">
                        <div class="suggestion-name">${city.name}</div>
                        <div class="suggestion-rating">⭐ ${city.rating}</div>
                    </div>
                </div>
            `).join('');
            
            suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const placeId = item.getAttribute('data-id');
                    await requireAuth('view place details', () => {
                        window.location.href = `/html/details.html?id=${placeId}`;
                    });
                });
            });

            suggestionsList.classList.add('active');
            suggestionsList.style.display = 'block';
        } else {
            suggestionsList.innerHTML = '<div style="padding:15px; color:#666;">No results found</div>';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                await requireAuth('Place Search', () => {
                    renderSearchSuggestions(query);
                });
            } else {
                if (suggestionsList) {
                    suggestionsList.style.display = 'none';
                    suggestionsList.classList.remove('active');
                }
            }
        });
    }

    renderMainCards();

    // Логіка кнопок скролу
    const rightBtn = document.querySelector(".scroll-button.right");
    const leftBtn = document.querySelector(".scroll-button.left");
    if (container) {
        const getStep = () => document.querySelector(".city-card")?.offsetWidth + 20 || 300;
        rightBtn?.addEventListener("click", () => container.scrollBy({ left: getStep(), behavior: "smooth" }));
        leftBtn?.addEventListener("click", () => container.scrollBy({ left: -getStep(), behavior: "smooth" }));
    }





});