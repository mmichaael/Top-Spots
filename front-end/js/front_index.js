import { mainPageFunctionsHandler } from './functions.js';
const mainPageFunctions = new mainPageFunctionsHandler();


document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM повністю завантажено");

  // ---------------- Пошукова панель ----------------
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.querySelector(".search-button");
  const suggestionsList = document.getElementById("suggestionsList");
  const searchCategories = document.querySelector(".search-categories");
  const moreBtn = document.querySelector(".more-btn");
  const moreCategories = document.querySelector(".search-category-list-so_own");
const burger = document.getElementById("burger");
const navMenu = document.getElementById("navMenu");

burger.addEventListener("click", () => {
  burger.classList.toggle("active");
  navMenu.classList.toggle("active");
});
  moreBtn.addEventListener("click", () => {
    const isHidden = moreCategories.classList.contains("hidden");

    if (isHidden) {
      moreCategories.classList.remove("hidden");
      moreCategories.classList.add("show");
      moreBtn.textContent = "Менше ▲";
    } else {
      moreCategories.classList.add("hidden");
      moreCategories.classList.remove("show");
      moreBtn.textContent = "Ще ▼";
    }
  });
  
  if (suggestionsList) {
    searchCategories.classList.toggle("with-suggestions");
  }

  // === Голосовий пошук ===
  const micBtn = document.createElement("span");
  micBtn.innerHTML = "🎤";
  micBtn.className = "mic-button";
  micBtn.style.cssText = `position:absolute; right:20px; font-size:25px; color:#333; cursor:pointer; z-index:10;`;
  document.querySelector(".search-section").appendChild(micBtn);

  // === Кнопка "очистити" ===
  const clearBtn = document.createElement("span");
  clearBtn.innerHTML = "✖";
  clearBtn.className = "clear-button";
  clearBtn.style.cssText = `position:absolute; right:58px; font-size:25px; color:#333; cursor:pointer; display:none; z-index:10;`;
  document.querySelector(".search-section").appendChild(clearBtn);

  let selectedCategory = null;

  // === Клік по категоріях ===
  document.querySelectorAll(".search-category").forEach(cat => {
    cat.addEventListener("click", () => {
      document.querySelectorAll(".search-category").forEach(c => c.classList.remove("active"));
      cat.classList.add("active");
      selectedCategory = cat.dataset.type;
      console.log("Обрана категорія:", selectedCategory);

      if (searchInput.value.trim()) {
        searchInput.dispatchEvent(new Event("input"));
      }
    });
  });

  // === Автокомпліт ===
  async function fetchSuggestions(query) {
    try {
      const response = await fetch("http://localhost:3500/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: query, type: selectedCategory })
      });
      if (!response.ok) throw new Error("Backend API error: " + response.status);
      const data = await response.json();
      return data.predictions || [];
    } catch (err) {
      console.error("Помилка автокомпліту:", err);
      return [];
    }
  }

  // === Деталі місця ===
  async function fetchPlaceDetails(placeId) {
    try {
      const response = await fetch("http://localhost:3500/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: placeId })
      });
      if (!response.ok) throw new Error("Backend API error: " + response.status);
      const data = await response.json();
      return data.result || null;
    } catch (err) {
      console.error("Помилка деталей місця:", err);
      return null;
    }
  }

  // === Обробка введення ===
// ---------------- Автокомпліт (оновлення карток) ----------------
searchInput.addEventListener("input", async (e) => {
  
  const query = e.target.value.trim();
  clearBtn.style.display = query ? "block" : "none";

  if (!query) {
    suggestionsList.innerHTML = "";
    suggestionsList.classList.remove("show");
    return;
  }

  const suggestions = await fetchSuggestions(query);
  suggestionsList.innerHTML = "";

  if (!suggestions || suggestions.length === 0) {
    suggestionsList.innerHTML = "<li class='no-results'>Нічого не знайдено</li>";
    suggestionsList.classList.add("show");
    return;
  }

  // --- малюємо список підказок з фільтром ---
  suggestions.forEach((s) => {
    let name = s.description || "";
    if (name.length > 60) {
      name = name.slice(0, 30) + "..."; // скорочуємо назву
    }

    const li = document.createElement("li");
    li.textContent = name;

        // при кліку на підказку -> переходимо на сторінку міста
    li.addEventListener("click", () => {
      const url = `/html/city_page.html?placeId=${s.place_id}`;
      window.location.href = url;
    });

    suggestionsList.appendChild(li);
    
  });
  suggestionsList.classList.add("show");

  // --- підміняємо перші N карток ---
  const N = 5;
  const cards = document.querySelectorAll(".city-card");

  for (let i = 0; i < Math.min(N, suggestions.length, cards.length); i++) {
    const s = suggestions[i];
    const details = await fetchPlaceDetails(s.place_id);
    if (!details) continue;

    // скорочуємо назву для картки
    let placeName = details.name || "";
    if (placeName.length > 30) {
      placeName = placeName.slice(0, 30) + "...";
      
    }
    let placeDescription = details.formatted_address || "Адреса недоступна";
  if (placeDescription.length > 30) {
    placeDescription = placeDescription.slice(0, 30) + "...";
  }

    const card = cards[i];
    const photo = details.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${details.photos[0].photo_reference}&key=AIzaSyDW-bqi3Gq8lPld_ese2w6nzWAGKZO9Szw`
      : "../img/default_city.jpg";

    // фільтр: пропускаємо якщо немає фото або адреса занадто довга
    if (!details.photos || details.photos.length === 0 || placeName.length === 0 || placeDescription.length >= 130) {
      continue;
    } else {
      card.innerHTML = `
        <img src="${photo}" alt="${placeName}" class="city-image">
        <div class="city-content">
          <h3 class="city-name">${placeName}</h3>
          <p class="city-description">${placeDescription || "Адреса недоступна"}</p>
          <div class="city-rating">⭐ ${details.rating || "—"}</div>
          <button class="map-button">Переглянути місто</button>
        </div>
      `;
    }

    card.querySelector(".map-button").addEventListener("click", () => {
      const url = `/html/city_page.html?placeId=${s.place_id}`;
      window.location.href = url;
    });
  }
});


  // === Кнопка "очистити" ===
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    suggestionsList.innerHTML = "";
    suggestionsList.classList.remove("show");
    clearBtn.style.display = "none";
    searchInput.focus();
  });

  // === Голосовий пошук ===
  micBtn.addEventListener("click", () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Ваш браузер не підтримує голосовий пошук.");
      return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "uk-UA";
    recognition.start();
    recognition.onresult = (event) => {
      searchInput.value = event.results[0][0].transcript;
      searchInput.dispatchEvent(new Event("input"));
    };
    recognition.onerror = () => alert("Сталася помилка під час розпізнавання голосу.");
  });

  // === Кнопка Search ===
  searchButton.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return alert("Введіть назву міста.");
    const suggestions = await fetchSuggestions(query);
    if (!suggestions || suggestions.length === 0) return alert("Місто не знайдено.");
    const url = `/html/city_page.html?placeId=${suggestions[0].place_id}`;
    console.log("Переходимо на:", url);
    window.location.href = url;
  });

  // ---------------- Картки міст ----------------
  // ---------------- Картки міст (CITY SLIDER) ----------------


const cities = [
  {
    name: "Київ",
    description: "Столиця України",
    rating: 4.8,
    image: "../img/cit/kiev.jpg",

  },
  {
    name: "Львів",
    description: "Культурна столиця",
    rating: 4.7,
    image: "../img/cit/lviv.jpg",

  },
  {
    name: "Одеса",
    description: "Морська перлина",
    rating: 4.6,
    image: "../img/cit/odesa.jpg",

  },
  {
    name: "Харків",
    description: "Студентське місто",
    rating: 4.5,
    image: "../img/cit/harkiv.jpg"},
  {
    name: "Дніпро",
    description: "Промисловий центр",
    rating: 4.4,
    image: "../img/cit/dnepr.jpg",

  },
  {
    name: "Запоріжжя",
    description: "Місто козацької слави",
    rating: 4.3,
    image: "../img/cit/zaporoshe.jpg",
  },
  {
    name: "Вінниця",
    description: "Місто фонтанів",
    rating: 4.2,
    image: "../img/cit/vinica.jpg",},
    {
    name: "Чернівці",
    description: "Місто університетів",
    rating: 4.1,
    image: "../img/cit/chernivci.jpg",
  },
    {
    name: "Івано-Франківськ",
    description: "Гірське місто",
    rating: 4.0,
    image: "../img/cit/ivanofrankovsk.jpg",
  },
    {
    name: "Тернопіль",
    description: "Місто замків",
    rating: 3.9,
    image: "../img/cit/ternopil.jpg",
  },
  { 
    name: "Житомир",
    description: "Місто космонавтики",
    rating: 3.8,
    image: "../img/cit/zhetom.jpg",
  },
  {
    name: "Полтава",
    description: "Місто галушок",
    rating: 3.7,
    image: "../img/cit/poltava.jpg",
  },
  {
    name: "Черкаси",
    description: "Місто на Дніпрі",
    rating: 3.6,
    image: "../img/cit/cherkasy.jpg",
  },
  {
    name: "Суми",
    description: "Місто вітрів",
    rating: 3.5,
    image: "../img/cit/sumy.jpg",
  },
  {
    name: "Рівне",
    description: "Місто парків",
    rating: 3.4,
    image: "../img/cit/rivne.jpg",
  },
  {
    name: "Хмельницький",
    description: "Місто садів",
    rating: 3.3,
    image: "../img/cit/hmelnycki.jpg",
  }
];




const container = document.querySelector(".scroll-container");
const indicators = document.querySelector(".scroll-indicators");
async function getPlaceIdByCityName(cityName) {
  try {
    const response = await fetch("http://localhost:3500/api/places/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: cityName,
        type: "locality" // міста
      })
    });

    if (!response.ok) throw new Error("Autocomplete error");

    const data = await response.json();
    return data.predictions?.[0]?.place_id || null;
  } catch (err) {
    console.error("❌ Помилка отримання placeId:", err);
    return null;
  }
}

cities.forEach((city, index) => {
  const card = document.createElement("div");
  card.className = "city-card";

  card.innerHTML = `
    <img src="${city.image}" alt="${city.name}" class="city-image">
    <div class="city-content">
      <h3 class="city-name">${city.name}</h3>
      <p class="city-description">${city.description}</p>
      <div class="city-rating">⭐ ${city.rating}</div>
      <button class="map-button">Переглянути місто</button>
    </div>
  `;

 card.querySelector(".map-button").addEventListener("click", async () => {
  console.log("🔍 Шукаємо placeId для:", city.name);

  const placeId = await getPlaceIdByCityName(city.name);

  if (!placeId) {
    alert("❌ Не вдалося знайти місто в Google Places");
    return;
  }

  const url = `/html/city_page.html?placeId=${placeId}`;
  console.log("➡️ Перехід на city_page:", url);
  window.location.href = url;
});


  container.appendChild(card);

  const dot = document.createElement("div");
  dot.className = "dot";
  if (index === 0) dot.classList.add("active");
  indicators.appendChild(dot);
});

  setTimeout(() => {
    document.querySelectorAll(".city-card").forEach(card => card.classList.add("show"));
  }, 100);

const leftButton = document.querySelector(".scroll-button.left");
const rightButton = document.querySelector(".scroll-button.right");
const dotsContainer = document.querySelector(".scroll-indicators");

// функція для визначення ширини картки + gap
function getCardWidth() {
  const card = document.querySelector(".city-card");
  const style = window.getComputedStyle(container);
  const gap = parseInt(style.gap) || 0;
  return card.offsetWidth + gap;
}

let cardWidth = getCardWidth();

// створюємо індикатори
const cards = document.querySelectorAll(".city-card");
dotsContainer.innerHTML = "";
cards.forEach(() => {
  const dot = document.createElement("div");
  dot.classList.add("dot");
  dotsContainer.appendChild(dot);
});
const dots = document.querySelectorAll(".scroll-indicators .dot");
dots[0]?.classList.add("active");

// кнопки скролу
leftButton.addEventListener("click", () => {
  container.scrollBy({ left: -cardWidth, behavior: "smooth" });
});
rightButton.addEventListener("click", () => {
  container.scrollBy({ left: cardWidth, behavior: "smooth" });
});

// оновлення активного індикатора
container.addEventListener("scroll", () => {
  const activeIndex = Math.round(container.scrollLeft / cardWidth);
  dots.forEach(dot => dot.classList.remove("active"));
  if (dots[activeIndex]) dots[activeIndex].classList.add("active");
});

// адаптив: перераховуємо ширину при зміні розміру
window.addEventListener("resize", () => {
  cardWidth = getCardWidth();
});
  

  
  // ---------------- Теми ----------------
  const themeCards = document.querySelectorAll(".theme-card");
  console.log(`Знайдено theme-card: ${themeCards.length}`);
  themeCards.forEach(card => {
    card.addEventListener("click", () => {
      const theme = card.dataset.theme;
      const url = `/html/toplist.html?theme=${theme}`;
      console.log(`Клік на тему: ${theme} | Переходимо на: ${url}`);
      window.location.href = url;
    });

    // Додаткові логи для hover та відображення
    card.addEventListener('mouseenter', () => {
      console.log(`Наведено на тему: ${card.dataset.theme}`);
    });
    card.addEventListener('mouseleave', () => {
      console.log(`Вийшли з теми: ${card.dataset.theme}`);
    });
  });
});




console.log("✅ front_index.js підключено");
console.log("✅ front_index.js підключено — режим без створення DOM");

// ---------------- Ідеї для подорожей ----------------
const ideaCards = document.querySelectorAll(".idea-card");
console.log(`🔍 Знайдено карток ідей: ${ideaCards.length}`);

ideaCards.forEach(card => {
  const id = card.dataset.category || "невідомо";
  console.log(`➡️ Обробляємо картку: ${id}`);

  card.addEventListener("click", () => {
    const url = `/html/toplist.html?category=${encodeURIComponent(id)}`;
    console.log(`🖱️ Клік на картку ідеї: ${id} | Переходимо на: ${url}`);
    window.location.href = url;
  });

  card.addEventListener("mouseenter", () => {
    console.log(`👀 Наведено на картку: ${id}`);
  });
  card.addEventListener("mouseleave", () => {
    console.log(`👋 Вийшли з картки: ${id}`);
  });
});

// ---------------- Теми ----------------
const themeCards = document.querySelectorAll(".theme-card");
console.log(`🔎 Знайдено theme-card: ${themeCards.length}`);

themeCards.forEach(card => {
  const theme = card.dataset.theme || "невідомо";
  console.log(`➡️ Обробляємо тему: ${theme}`);

  card.addEventListener("click", () => {
 const url = `/html/toplist.html?category=${encodeURIComponent(theme)}`;

    console.log(`🖱️ Клік на тему: ${theme} | Переходимо на: ${url}`);
    window.location.href = url;
  });

  card.addEventListener("mouseenter", () => {
    console.log(`👀 Наведено на тему: ${theme}`);
  });
  card.addEventListener("mouseleave", () => {
    console.log(`👋 Вийшли з теми: ${theme}`);
  });
});

const chatBox = document.querySelector(".chat-box");
const input = document.querySelector(".chat-input");
const sendBtn = document.querySelector(".send-btn");

// ====== ДОДАТКОВИЙ ФУНКЦІОНАЛ ======
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
    const message = input.value.trim();
    if (!message) return;

    appendMessage(message, "user");
    input.value = "";

    const typingBubble = showTyping();

    const res = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    });

    const data = await res.json();

    typingBubble.remove();

    appendMessage(data.reply, "bot");
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});


