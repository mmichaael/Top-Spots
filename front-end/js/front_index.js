import { mainPageFunctionsHandler } from './functions.js';
const mainPageFunctions = new mainPageFunctionsHandler();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM повністю завантажено. Система готова.");

    // ============ КОНСТАНТИ ============
    const NO_PHOTO_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='20' font-family='sans-serif'%3EНемає фото%3C/text%3E%3C/svg%3E";

    const modernPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Cdefs%3E%3ClinearGradient id="modernGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981;stop-opacity:1" /%3E%3Cstop offset="50%25" style="stop-color:%233b82f6;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6;stop-opacity:1" /%3E%3C/linearGradient%3E%3Cfilter id="blur"%3E%3CfeGaussianBlur in="SourceGraphic" stdDeviation="15" /%3E%3C/filter%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23modernGrad)" filter="url(%23blur)"/%3E%3Ccircle cx="400" cy="300" r="100" fill="white" opacity="0.15"/%3E%3Ctext x="50%25" y="48%25" text-anchor="middle" fill="white" font-family="system-ui" font-size="100" opacity="0.6"%3E📍%3C/text%3E%3Ctext x="50%25" y="62%25" text-anchor="middle" fill="white" font-family="system-ui" font-size="24" opacity="0.4"%3EЗавантаження...%3C/text%3E%3C/svg%3E';

    // ============ ЕЛЕМЕНТИ DOM ============
    const searchInput = document.getElementById("searchInput");
    const suggestionsList = document.getElementById("suggestionsList");
    const container = document.querySelector(".scroll-container");
    const indicatorsContainer = document.querySelector(".scroll-indicators");
    const categoryButtons = document.querySelectorAll('.search-category');
    
    const burger = document.getElementById("burger");
    const navMenu = document.getElementById("navMenu");
    const searchSection = document.querySelector(".search-section");
    const leftBtn = document.querySelector(".scroll-button.left");
    const rightBtn = document.querySelector(".scroll-button.right");

    // ============ ДИНАМІЧНІ КНОПКИ ============
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

    // ============ ЗМІННІ ============
    let debounceTimer;
    let currentCategoryTypes = "(cities)";
    let googleMapsPromise = null;

    // ============ ДЕФОЛТНІ МІСТА ============
    const cities = [
        { name: "Київ", place_id: "ChIJBUVa4U7P1EAR_kYBF9IxSXY", photo: "../img/def-sity_img/kyiv.jpg", rating: 4.9 },
        { name: "Одеса", place_id: "ChIJ8_S_In_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/odesa.jpg", rating: 4.8 },
        { name: "Львів", place_id: "ChIJay7_In_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/lviv.jpg", rating: 4.9 },
        { name: "Харків", place_id: "ChIJ9Wv_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/harkiv.jpg", rating: 4.7 },
        { name: "Дніпро", place_id: "ChIJ76v_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/dnepr.jpg", rating: 4.6 },
        { name: "Івано-Франківськ", place_id: "ChIJ_6t_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/iv-fr.jpg", rating: 4.8 },
        { name: "Запоріжжя", place_id: "ChIJsWv_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/zaporoshe.jpg", rating: 4.5 },
        { name: "Вінниця", place_id: "ChIJpWv_Xn_0_UARsB_XIn_0_UA", photo: "../img/def-sity_img/vinica.jpg", rating: 4.7 }
    ];

    // ============ УТИЛІТИ ============
    function truncateText(text, maxLength = 40) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    const log = (msg, data = '') => console.log(`%c[SYSTEM]: ${msg}`, 'color: #10b981; font-weight: bold', data);

    // ============ GOOGLE MAPS API ============
    async function loadGoogleMapsAPI() {
        if (window.google && window.google.maps && window.google.maps.importLibrary) return true;
        
        if (googleMapsPromise) return googleMapsPromise;

        googleMapsPromise = (async () => {
            try {
                const response = await fetch('/api/google-maps-key');
                const data = await response.json();

                return new Promise((resolve, reject) => {
                    if (document.getElementById('google-maps-sdk')) {
                        resolve(true);
                        return;
                    }
                    const script = document.createElement('script');
                    script.id = 'google-maps-sdk';
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&v=weekly&loading=async`;
                    
                    script.onload = () => {
                        const check = setInterval(() => {
                            if (window.google?.maps?.importLibrary) {
                                clearInterval(check);
                                log('✅ Google Maps API завантажено');
                                resolve(true);
                            }
                        }, 50);
                    };
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            } catch (err) {
                googleMapsPromise = null;
                throw err;
            }
        })();

        return googleMapsPromise;
    }

async function getPlaceDataViaSDK(placeId, fullAddress = "") {
    try {
        await loadGoogleMapsAPI();
        const { Place } = await google.maps.importLibrary("places");
        
        const place = new Place({ id: placeId, requestedLanguage: 'uk' });
        await place.fetchFields({ fields: ["displayName", "formattedAddress", "photos", "types"] });

        const cityName = place.displayName?.text || place.displayName || "Місто";
        // Використовуємо або повну адресу з підказки, або ту, що дав Google
        const searchQuery = fullAddress || place.formattedAddress || cityName;

        log(`🏙️ Шукаю точне фото для: ${searchQuery}`);

        const { places } = await Place.searchByText({
            // Тепер запит включає область, наприклад "Київка, Чернігівська область"
            textQuery: `пам'ятки та краєвиди ${searchQuery}`,
            maxResultCount: 1,
            fields: ["photos"]
        });

        let photoUrl = null;
        if (places && places.length > 0 && places[0].photos?.length > 0) {
            photoUrl = places[0].photos[0].getURI({ maxWidth: 1200 });
        } else if (place.photos?.length > 0) {
            photoUrl = place.photos[0].getURI({ maxWidth: 1200 });
        }

        return {
            place_id: placeId,
            name: cityName,
            photo_url: photoUrl,
            description: searchQuery // Зберігаємо повну адресу
        };
    } catch (err) {
        return null;
    }
}
    // ============ AUTOCOMPLETE ============
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
            log(`🔴 Autocomplete error: ${err.message}`);
            return [];
        }
    }

    // ============ СИНХРОНІЗАЦІЯ З БЕКЕНДОМ ============
    async function syncPlaceWithBackend(placeData) {
        try {
            await fetch('/api/places/details', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(placeData)
            });
            log(`✅ Синхронізовано: ${placeData.name}`);
        } catch (err) {
            log(`⚠️ Sync error: ${err.message}`);
        }
    }

    // ============ ОНОВЛЕННЯ КАРТОК ============
async function updateSliderCards(cityList, isInitial = false) {
    if (!container) return;

    container.innerHTML = "";
    if (indicatorsContainer) indicatorsContainer.innerHTML = "";

    for (let i = 0; i < cityList.length; i++) {
        const city = cityList[i];
        const card = document.createElement("div");
        // ПОВЕРТАЄМО ТВОЇ ОРИГІНАЛЬНІ КЛАСИ
        card.className = "city-card show";

        const displayName = truncateText(city.name, 40);

        // ПОВЕРТАЄМО ТВОЮ ОРИГІНАЛЬНУ СТРУКТУРУ HTML
        card.innerHTML = `
            <img src="${modernPlaceholder}" class="city-image">
            <div class="city-content">
                <h3 class="city-name" title="${city.name}">${displayName}</h3>
                <div class="city-rating">⭐ ${city.rating || '4.5'}</div>
                <button class="map-button">Детальніше</button>
            </div>
        `;
        container.appendChild(card);

        if (indicatorsContainer) {
            const dot = document.createElement("div");
            dot.className = `indicator ${i === 0 ? 'active' : ''}`;
            indicatorsContainer.appendChild(dot);
        }

        card.onclick = () => {
            window.location.href = `/html/city_page.html?placeId=${city.place_id}&name=${encodeURIComponent(city.name)}`;
        };

        if (!isInitial) {
            card.style.opacity = "0.6";

            // ПЕРЕДАЄМО ПОВНУ АДРЕСУ (description) ДЛЯ ТОЧНОГО ПОШУКУ ФОТО
            getPlaceDataViaSDK(city.place_id, city.description).then(sdkData => {
                if (sdkData && sdkData.photo_url) {
                    const img = card.querySelector(".city-image");
                    
                    const tempImg = new Image();
                    tempImg.src = sdkData.photo_url;
                    tempImg.onload = () => {
                        img.src = sdkData.photo_url;
                        card.style.opacity = "1";
                    };

                    syncPlaceWithBackend(sdkData);
                }
            }).catch(err => {
                console.error("SDK Error:", err);
                card.style.opacity = "1";
            });
        } else if (city.photo) {
            card.querySelector(".city-image").src = city.photo;
            card.style.opacity = "1";
        }
    }
}

    // ============ КАТЕГОРІЇ ============
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const type = btn.getAttribute('data-type');
            currentCategoryTypes = type;
            
            const query = searchInput ? searchInput.value.trim() : '';
            
            if (query.length >= 3) {
                searchInput.dispatchEvent(new Event('input'));
            } else {
                const suggestions = await fetchSuggestions(`популярні ${type} Україна`);
                
                suggestionsList.innerHTML = "";
                suggestions.forEach(s => {
                    const li = document.createElement("li");
                    li.textContent = truncateText(s.description, 40);
                    li.title = s.description;
                    li.onclick = () => {
                        window.location.href = `/html/city_page.html?placeId=${s.place_id}&name=${encodeURIComponent(s.description)}`;
                    };
                    suggestionsList.appendChild(li);
                });
                suggestionsList.classList.add("show");

                const searchResults = suggestions.map(s => ({
                    name: s.description,
                    place_id: s.place_id,
                    description: s.description
                }));
                updateSliderCards(searchResults, false);
            }
        });
    });

    // ============ ПОШУК ============
    if (searchInput) {
        searchInput.addEventListener("input", async (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);
            if (clearBtn) clearBtn.style.display = query ? "block" : "none";

            if (query.length < 3) {
                suggestionsList.innerHTML = "";
                suggestionsList.classList.remove("show");
                if (query.length === 0) updateSliderCards(cities, true);
                return;
            }

            debounceTimer = setTimeout(async () => {
                const suggestions = await fetchSuggestions(query);
                
                suggestionsList.innerHTML = "";
                
                if (suggestions.length === 0) {
                    const li = document.createElement("li");
                    li.textContent = "Нічого не знайдено";
                    li.style.color = "#999";
                    suggestionsList.appendChild(li);
                } else {
                    suggestions.forEach(s => {
                        const li = document.createElement("li");
                        li.textContent = truncateText(s.description, 40);
                        li.title = s.description;
                        li.onclick = () => {
                            window.location.href = `/html/city_page.html?placeId=${s.place_id}&name=${encodeURIComponent(s.description)}`;
                        };
                        suggestionsList.appendChild(li);
                    });
                }
                
                suggestionsList.classList.add("show");

                const searchResults = suggestions.map(s => ({
                    name: s.description,
                    place_id: s.place_id,
                    description: s.description
                }));
                updateSliderCards(searchResults, false);
            }, 300);
        });
    }

    // ============ ОЧИСТИТИ ПОШУК ============
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            suggestionsList.innerHTML = '';
            suggestionsList.classList.remove('show');
            
            categoryButtons.forEach(b => b.classList.remove('active'));
            currentCategoryTypes = "(cities)";
            
            updateSliderCards(cities, true);
        });
    }

    // ============ ЗАКРИТИ ПІДКАЗКИ ============
    document.addEventListener('click', (e) => {
        if (searchInput && suggestionsList && 
            !searchInput.contains(e.target) && 
            !suggestionsList.contains(e.target)) {
            suggestionsList.classList.remove('show');
        }
    });

    // ============ СКРОЛ ТА СЛАЙДЕР ============
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
        rightBtn?.addEventListener("click", () => container.scrollBy({ left: getScrollStep(), behavior: "smooth" }));
        leftBtn?.addEventListener("click", () => container.scrollBy({ left: -getScrollStep(), behavior: "smooth" }));
    }

    // ============ БУРГЕР МЕНЮ ============
    if (burger && navMenu) {
        burger.addEventListener("click", () => {
            burger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }

    // ============ ГОЛОСОВИЙ ПОШУК ============
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

    // ============ ІДЕЇ ДЛЯ ПОДОРОЖЕЙ ============
    const handleCategoryClick = (elements) => {
        elements.forEach(card => {
            card.addEventListener("click", () => {
                const cat = card.dataset.category || card.dataset.theme;
                if (cat) window.location.href = `/html/toplist.html?category=${encodeURIComponent(cat)}`;
            });
        });
    };
    handleCategoryClick(document.querySelectorAll(".idea-card"));
    handleCategoryClick(document.querySelectorAll(".theme-card"));

    // ============ ЧАТ-БОТ ============
    const chatBox = document.querySelector(".chat-box");
    const chatInput = document.querySelector(".chat-input");
    const sendBtn = document.querySelector(".send-btn");

    if (sendBtn && chatBox && chatInput) {
        const appendMessage = (text, type) => {
            const msg = document.createElement("div");
            msg.className = `msg ${type}-msg`;
            msg.innerText = text;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        const sendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;
            appendMessage(message, "user");
            chatInput.value = "";
            try {
                const res = await fetch("/api/chat-assistant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });
                const data = await res.json();
                appendMessage(data.reply, "bot");
            } catch (err) {
                appendMessage("Сервер не відповідає.", "bot");
            }
        };

        sendBtn.addEventListener("click", sendMessage);
        chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
    }

    // ============ ІНІЦІАЛІЗАЦІЯ ============
    updateSliderCards(cities, true);
    log('✅ front_index.js успішно ініціалізовано!');
});