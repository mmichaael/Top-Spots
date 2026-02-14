import { mainPageFunctionsHandler } from './functions.js';
const mainPageFunctions = new mainPageFunctionsHandler();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM повністю завантажено. Система готова.");

    // ---------------- 1. Елементи інтерфейсу ----------------
    const searchInput = document.getElementById("searchInput");
    const suggestionsList = document.getElementById("suggestionsList");
    const container = document.querySelector(".scroll-container");
    
    // ВАЖЛИВО: indicatorsContainer - це сам батьківський DIV (.scroll-indicators)
    const indicatorsContainer = document.querySelector(".scroll-indicators");
    
    const burger = document.getElementById("burger");
    const navMenu = document.getElementById("navMenu");
    const searchSection = document.querySelector(".search-section");
    const leftBtn = document.querySelector(".scroll-button.left");
    const rightBtn = document.querySelector(".scroll-button.right");

    let currentCategoryTypes = ""; 
    let debounceTimer;

    // ---------------- 2. Динамічні кнопки (Мікрофон та Хрестик) ----------------
    const micBtn = document.createElement("span");
    micBtn.innerHTML = "🎤";
    micBtn.className = "mic-button";
    micBtn.style.cssText = `position:absolute; right:20px; font-size:25px; color:#333; cursor:pointer; z-index:10;`;

    const clearBtn = document.createElement("span");
    clearBtn.innerHTML = "✖";
    clearBtn.className = "clear-button";
    clearBtn.style.cssText = `position:absolute; right:58px; font-size:25px; color:#333; cursor:pointer; display:none; z-index:10;`;

    if (searchSection) {
        searchSection.appendChild(micBtn);
        searchSection.appendChild(clearBtn);
    }

    // ---------------- 3. API Функції ----------------
    async function fetchSuggestions(query) {
        try {
            const response = await fetch("/api/places/autocomplete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: query, category: currentCategoryTypes })
            });
            const data = await response.json();
            return data.predictions || [];
        } catch (err) {
            console.error("Помилка автокомпліту:", err);
            return [];
        }
    }

    async function fetchPlaceDetails(placeId, name) {
        try {
            const response = await fetch('/api/places/details', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: placeId, name: name })
            });
            const data = await response.json();
            return data.result || null;
        } catch (err) {
            console.error("Помилка деталізації:", err);
            return null;
        }
    }

    // ---------------- 4. Логіка Пошуку та Карток ----------------
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            clearBtn.style.display = query ? "block" : "none";

            if (query.length < 3) {
                suggestionsList.innerHTML = "";
                suggestionsList.classList.remove("show");
                return;
            }

            debounceTimer = setTimeout(async () => {
                const suggestions = await fetchSuggestions(query);
                
                // Випадаючий список підказок
                suggestionsList.innerHTML = "";
                suggestions.forEach((s) => {
                    const li = document.createElement("li");
                    li.textContent = s.description;
                    li.onclick = () => {
                        window.location.href = `/html/city_page.html?placeId=${s.place_id}&name=${encodeURIComponent(s.pure_name || s.description)}`;
                    };
                    suggestionsList.appendChild(li);
                });
                suggestionsList.classList.add("show");

                // Оновлення великих карток та крапок
                const allCards = document.querySelectorAll(".city-card");
                if (indicatorsContainer) indicatorsContainer.innerHTML = "";

                const updateTasks = Array.from(allCards).map(async (card, i) => {
                    const s = suggestions[i];
                    
                    // Додаємо крапку
                    if (indicatorsContainer) {
                        const dot = document.createElement("div");
                        dot.className = "indicator" + (i === 0 ? " active" : "");
                        indicatorsContainer.appendChild(dot);
                    }

                    if (!s) return;

                    card.style.opacity = "0.5";
                    const details = await fetchPlaceDetails(s.place_id, s.pure_name);

                    if (details) {
                        const imgEl = card.querySelector(".city-image");
                        const nameEl = card.querySelector(".city-name");
                        const ratingEl = card.querySelector(".city-rating");

                        if (imgEl) imgEl.src = details.photo_url || "../img/default_city.jpg";
                        if (nameEl) nameEl.textContent = details.query_name;
                        if (ratingEl) ratingEl.textContent = `⭐ ${details.rating || '4.5'}`;
                        card.style.opacity = "1";
                    }
                });
                await Promise.all(updateTasks);
            }, 300);
        });
    }

    // ---------------- 5. Слайдер та Кнопки Скролу ----------------
    const getScrollStep = () => {
        const card = document.querySelector(".city-card");
        if (!card) return 300;
        const style = window.getComputedStyle(container);
        const gap = parseInt(style.gap) || 0;
        return card.offsetWidth + gap;
    };

    if (container) {
        container.addEventListener("scroll", () => {
            const step = getScrollStep();
            const index = Math.round(container.scrollLeft / step);
            const dots = document.querySelectorAll(".indicator");
            dots.forEach((d, i) => d.classList.toggle("active", i === index));
        });

        rightBtn?.addEventListener("click", () => {
            container.scrollBy({ left: getScrollStep(), behavior: "smooth" });
        });

        leftBtn?.addEventListener("click", () => {
            container.scrollBy({ left: -getScrollStep(), behavior: "smooth" });
        });
    }

    // ---------------- 6. Категорії та Інші Події ----------------
    document.querySelectorAll(".search-category").forEach(cat => {
        cat.addEventListener("click", () => {
            document.querySelectorAll(".search-category").forEach(c => c.classList.remove("active"));
            cat.classList.add("active");
            currentCategoryTypes = cat.dataset.type || ""; 
            if (searchInput.value.length >= 3) searchInput.dispatchEvent(new Event("input"));
        });
    });

    if (burger && navMenu) {
        burger.addEventListener("click", () => {
            burger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        suggestionsList.innerHTML = "";
        suggestionsList.classList.remove("show");
        clearBtn.style.display = "none";
        searchInput.focus();
    });

    // Голосовий пошук
    if (micBtn) {
        micBtn.addEventListener("click", () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return alert("Браузер не підтримує голос.");
            const recognition = new SpeechRecognition();
            recognition.lang = "uk-UA";
            recognition.start();
            recognition.onresult = (e) => {
                searchInput.value = e.results[0][0].transcript;
                searchInput.dispatchEvent(new Event("input"));
            };
        });
    }

    // Закриття підказок при кліку поза ними
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.remove("show");
        }
    });

    // === Ідеї для подорожей та Теми ===
    const handleCategoryClick = (elements) => {
        elements.forEach(card => {
            card.addEventListener("click", () => {
                const cat = card.dataset.category || card.dataset.theme;
                if (cat) {
                    window.location.href = `/html/toplist.html?category=${encodeURIComponent(cat)}`;
                }
            });
        });
    };

    handleCategoryClick(document.querySelectorAll(".idea-card"));
    handleCategoryClick(document.querySelectorAll(".theme-card"));

    // === Твій Чат-Бот (без змін) ===
    const chatBox = document.querySelector(".chat-box");
    const chatInput = document.querySelector(".chat-input");
    const sendBtn = document.querySelector(".send-btn");

    if (sendBtn && chatBox && chatInput) {
        function appendMessage(text, type) {
            const msg = document.createElement("div");
            msg.className = `msg ${type}-msg`;
            msg.innerText = text;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function showTyping() {
            const typing = document.createElement("div");
            typing.className = "msg bot-msg typing";
            typing.innerText = "Пишу відповідь…";
            chatBox.appendChild(typing);
            chatBox.scrollTop = chatBox.scrollHeight;
            return typing;
        }

        async function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;

            appendMessage(message, "user");
            chatInput.value = "";

            const typingBubble = showTyping();

            try {
                const res = await fetch("/api/chat-assistant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });
                const data = await res.json();
                typingBubble.remove();
                appendMessage(data.reply, "bot");
            } catch (err) {
                typingBubble.remove();
                appendMessage("Сервер не відповідає. Спробуйте пізніше.", "bot");
            }
        }

        sendBtn.addEventListener("click", sendMessage);
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }

    console.log("✅ front_index.js успішно ініціалізовано!");
}); // Кінець DOMContentLoaded

