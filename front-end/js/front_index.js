import { mainPageFunctionsHandler } from './functions.js';
const mainPageFunctions = new mainPageFunctionsHandler();

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM повністю завантажено");

  // ---------------- Пошукова панель ----------------
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.querySelector(".search-button");
  const suggestionsList = document.getElementById("suggestionsList");

  // === Голосовий пошук ===
  const micBtn = document.createElement("span");
  micBtn.innerHTML = "🎤";
  micBtn.className = "mic-button";
  micBtn.style.cssText = `position:absolute; right:32px; font-size:25px; color:#333; cursor:pointer; z-index:10;`;
  document.querySelector(".search-section").appendChild(micBtn);

  // === Кнопка "очистити" ===
  const clearBtn = document.createElement("span");
  clearBtn.innerHTML = "✖";
  clearBtn.className = "clear-button";
  clearBtn.style.cssText = `position:absolute; right:75px; font-size:25px; color:#333; cursor:pointer; display:none; z-index:10;`;
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

    suggestions.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s.description;

      li.addEventListener("click", async () => {
        console.log("Клік на підказку:", s.description);
        const details = await fetchPlaceDetails(s.place_id);
        if (!details) return;
        const url = `/html/city_page.html?placeId=${s.place_id}`;
        console.log("Переходимо на:", url);
        window.location.href = url;
      });

      suggestionsList.appendChild(li);
    });

    suggestionsList.classList.add("show");
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
  const cities = [
    { name: "Київ", description: "Столиця України", rating: 4.8, image: "../img/киев ночной.jpg", mapsQuery: "Kyiv, Ukraine" },
    { name: "Львів", description: "Культурна столиця", rating: 4.7, image: "../img/львов нічний.jpg", mapsQuery: "Lviv, Ukraine" },
    { name: "Одеса", description: "Морська перлина", rating: 4.6, image: "../img/одеса.avif", mapsQuery: "Odesa, Ukraine" },
    { name: "Харків", description: "Студентське місто", rating: 4.5, image: "../img/харьков.jpg", mapsQuery: "Kharkiv, Ukraine" },
    { name: "Дніпро", description: "Промисловий центр", rating: 4.4, image: "../img/днепр.jpg", mapsQuery: "Dnipro, Ukraine" },
  ];

  const container = document.querySelector(".scroll-container");
  const indicators = document.querySelector(".scroll-indicators");

  cities.forEach((city, index) => {
    const card = document.createElement("div");
    card.classList.add("city-card");
    card.innerHTML = `
      <img src="${city.image}" alt="${city.name}" class="city-image">
      <div class="city-content">
        <h3 class="city-name">${city.name}</h3>
        <p class="city-description">${city.description}</p>
        <div class="city-rating">⭐ ${city.rating}</div>
        <button class="map-button" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city.mapsQuery)}', '_blank')">
          Показати на Google Maps
        </button>
      </div>
    `;
    container.appendChild(card);

    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    indicators.appendChild(dot);
  });

  setTimeout(() => {
    document.querySelectorAll(".city-card").forEach(card => card.classList.add("show"));
  }, 100);

  // Скрол кнопки
  const leftButton = document.querySelector(".scroll-button.left");
  const rightButton = document.querySelector(".scroll-button.right");
  const dots = document.querySelectorAll(".scroll-indicators .dot");
  const cardWidth = 301;

  leftButton.addEventListener("click", () =>
    container.scrollBy({ left: -cardWidth, behavior: "smooth" })
  );
  rightButton.addEventListener("click", () =>
    container.scrollBy({ left: cardWidth, behavior: "smooth" })
  );

  container.addEventListener("scroll", () => {
    const activeIndex = Math.round(container.scrollLeft / cardWidth);
    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[activeIndex]) dots[activeIndex].classList.add("active");
  });

  document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM завантажено. Починаємо ініціалізацію...");

  // ---------------- Ідеї для подорожей ----------------
  function createIdeaCard({ id, title, subtitle, emoji }) {
    console.log(`Створюємо картку: ${title || id} (id: ${id})`);
    const card = document.createElement('div');
    card.className = 'idea-card';
    card.dataset.category = id;
    card.innerHTML = `
      <div class="idea-emoji">${emoji}</div>
      <div class="idea-body">
        <h4 class="idea-title">${title || id}</h4>
        <p class="idea-sub">${subtitle}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      const url = `/html/toplist.html?category=${encodeURIComponent(id)}`;
      console.log(`Клік на картку: ${title || id} | Переходимо на: ${url}`);
      window.location.href = url;
    });

    return card;
  }

  const wrapper = document.querySelector('.scroll-container-wrapper');
  if (!wrapper) console.warn('Не знайдено .scroll-container-wrapper для ідей');

  const ideasWrap = document.createElement('section');
  ideasWrap.className = 'ideas-section';
  ideasWrap.innerHTML = `<h2 class="ideas-title">Ідеї для подорожей</h2><div class="ideas-grid"></div>`;
  wrapper.insertAdjacentElement('afterend', ideasWrap);

  const ideasList = [
    { id: 'popular', title: 'Популярні зараз', subtitle: 'Топ-10 найпопулярніших місць', emoji: '⭐' },
    { id: 'romantic', title: 'Романтичні локації', subtitle: 'Ідеально для побачень', emoji: '💘' },
    { id: 'active', title: 'Активний відпочинок', subtitle: 'Трекинг, байкінг, адреналін', emoji: '🏃‍♂️' },
    { id: 'summer', title: 'Літні тури', subtitle: 'Пляжі та відпочинок на сонці', emoji: '🌞' },
    { id: 'family', title: 'Сімейні напрямки', subtitle: 'Для дітей і батьків', emoji: '🎈' },
    { id: 'night_life', title: 'Нічне життя', subtitle: 'Клуби, бари та вечірки', emoji: '🎉' },
  ];

  const grid = document.querySelector('.ideas-grid');
  if (!grid) console.error('Не знайдено .ideas-grid');
  else {
    ideasList.forEach(it => grid.appendChild(createIdeaCard(it)));
    console.log('✅ Всі картки ідей додані в DOM');

    // Анімація появи
    setTimeout(() => {
      document.querySelectorAll('.idea-card').forEach((c, i) => {
        c.style.transition = `transform 450ms cubic-bezier(.2,.9,.2,1) ${i*60}ms, opacity 350ms`;
        c.classList.add('visible');
        console.log(`Картка "${c.querySelector('.idea-title').textContent}" з'явилась`);
      });
    }, 120);
  }

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




});
