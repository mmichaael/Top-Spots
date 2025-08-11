
import { mainPageFunctionsHandler } from './functions.js';
const mainPageFunctions = new mainPageFunctionsHandler();

// // Пошук елементів
// const searchInput = document.getElementById("searchInput");
// const searchButton = document.querySelector(".search-button");

// // Створення списку підказок
// const suggestionsList = document.createElement("ul");
// suggestionsList.id = "suggestionsList";
// document.querySelector(".search-bar").appendChild(suggestionsList);

// // Час останнього запиту
// let lastRequestTime = 0;

// // Спочатку ховаємо список
// suggestionsList.style.display = "none";

// // Обробка введення в поле пошуку
// searchInput.addEventListener("input", async (e) => {
//     const query = e.target.value.trim();

//     if (query.length < 2) {
//         suggestionsList.innerHTML = "";
//         suggestionsList.style.display = "none";
//         return;
//     }

//     const currentTime = Date.now();
//     if (currentTime - lastRequestTime < 1000) {
//         return;
//     }
//     lastRequestTime = currentTime;

//     const results = await searchCity(query);
//     showSuggestions(results);
// });

// // Пошук міста через Nominatim API
// async function searchCity(query) {
//     const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&accept-language=uk&countrycodes=UA`;
//     try {
//         const response = await fetch(url, {
//             headers: {
//                 "User-Agent": "TopSpotsSearch/1.0 (contact@topspots.com)",
//             }
//         });
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Помилка запиту:", error);
//         return [];
//     }
// }

// // Показати підказки
// function showSuggestions(results) {
//     suggestionsList.innerHTML = "";

//     if (results.length === 0) {
//         suggestionsList.innerHTML = "<li class='no-results'>Нічого не знайдено</li>";
//     } else {
//         results.forEach(result => {
//             const li = document.createElement("li");
//             li.textContent = result.display_name;
//             li.addEventListener("click", () => selectSuggestion(result));
//             suggestionsList.appendChild(li);
//         });
//     }

//     suggestionsList.style.display = "block";
//     suggestionsList.classList.add("show");
// }

// // Вибір підказки
// function selectSuggestion(result) {
//     searchInput.value = result.display_name;
//     suggestionsList.innerHTML = "";
//     suggestionsList.style.display = "none";
//     suggestionsList.classList.remove("show");

//     const cityName = encodeURIComponent(
//         result.address.city ||
//         result.address.town ||
//         result.address.village ||
//         result.address.county ||
//         result.display_name.split(",")[0]
//     );

//     window.location.href = `html/city_page.html?city=${cityName}`;
// }

// // Обробка кліку на кнопку "Search"
// searchButton.addEventListener("click", async () => {
//     const query = searchInput.value.trim();
//     if (query.length < 2) {
//         alert('Введіть назву міста.');
//         return;
//     }

//     const results = await searchCity(query);

//     if (results.length > 0) {
//         const firstResult = results[0];
//         const cityName = encodeURIComponent(
//             firstResult.address.city ||
//             firstResult.address.town ||
//             firstResult.address.village ||
//             firstResult.address.county ||
//             firstResult.display_name.split(",")[0]
//         );
//         window.location.href = `html/city_page.html?city=${cityName}`;
//     } else {
//         alert('Місто не знайдено.');
//     }
// });
const suggestion = document.getElementById('suggestionsList');
const inputField = document.getElementById('searchInput');
let timer;
inputField.addEventListener('input', () => {
    clearTimeout(timer);
    const inputValue = inputField.value;
    if (!inputValue.trim()) return (suggestion.innerHTML = ``);

    timer = setTimeout(() => {
        const searchingSug = mainPageFunctions.searchingSugges(inputValue);
        clearTimeout(timer);
    }, 400);
});

// Пошук елементів
const searchInput = document.getElementById("searchInput");
const searchButton = document.querySelector(".search-button");

// Створення списку підказок
const suggestionsList = document.createElement("ul");
suggestionsList.id = "suggestionsList";
document.querySelector(".search-bar").appendChild(suggestionsList);

// Час останнього запиту
let lastRequestTime = 0;

// Спочатку ховаємо список
suggestionsList.style.display = "none"; 

// Обробка введення в поле пошуку
searchInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        suggestionsList.innerHTML = "";  
        suggestionsList.style.display = "none"; 
        return;
    }

    const currentTime = Date.now();
    if (currentTime - lastRequestTime < 1000) { 
        return;
    }
    lastRequestTime = currentTime;

    const results = await searchCity(query);
    showSuggestions(results);
});

// Пошук міста через Nominatim API
async function searchCity(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&accept-language=uk&countrycodes=UA`;
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "TopSpotsSearch/1.0 (contact@topspots.com)",
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Помилка запиту:", error);
        return [];
    }
}

// Показати підказки
function showSuggestions(results) {
    suggestionsList.innerHTML = ""; 

    if (results.length === 0) {
        suggestionsList.innerHTML = "<li class='no-results'>Нічого не знайдено</li>";
    } else {
        results.forEach(result => {
            const li = document.createElement("li");
            li.textContent = result.display_name;
            li.addEventListener("click", () => selectSuggestion(result));
            suggestionsList.appendChild(li);
        });
    }

    suggestionsList.style.display = "block"; 
    suggestionsList.classList.add("show");
}

// Вибір підказки
function selectSuggestion(result) {
    searchInput.value = result.display_name;
    suggestionsList.innerHTML = "";
    suggestionsList.style.display = "none";
    suggestionsList.classList.remove("show");

    const cityName = encodeURIComponent(
        result.address.city ||
        result.address.town ||
        result.address.village ||
        result.address.county ||
        result.display_name.split(",")[0]
    );

    window.location.href = `html/city_page.html?city=${cityName}`;
}

// Обробка кліку на кнопку "Search"
searchButton.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        alert('Введіть назву міста.');
        return;
    }

    const results = await searchCity(query);

    if (results.length > 0) {
        const firstResult = results[0];
        const cityName = encodeURIComponent(
            firstResult.address.city ||
            firstResult.address.town ||
            firstResult.address.village ||
            firstResult.address.county ||
            firstResult.display_name.split(",")[0]
        );
        window.location.href = `html/city_page.html?city=${cityName}`;
    } else {
        alert('Місто не знайдено.');
    }
});
const cities = [
  {
    name: "Київ",
    description: "Столиця України з багатою історією, унікальною архітектурою та культурним серцем країни.",
    rating: 4.8,
    image: "../img/ciid.jpeg",
    mapsQuery: "Kyiv, Ukraine"
  },
  {
    name: "Львів",
    description: "Культурна столиця України, відома своєю архітектурою, кав'ярнями та старовинним центром.",
    rating: 4.7,
    image: "../img/двів.jpg",
    mapsQuery: "Lviv, Ukraine"
  },
  {
    name: "Одеса",
    description: "Морська перлина на березі Чорного моря з веселим духом і неповторним колоритом.",
    rating: 4.6,
    image: "../img/одеса.avif",
    mapsQuery: "Odesa, Ukraine"
  },
  {
    name: "Харків",
    description: "Велике студентське місто з багатою історією та сучасною атмосферою. атмосферою.",
    rating: 4.5,
    image: "../img/харьков.jpg",
    mapsQuery: "Kharkiv, Ukraine"
  },
  {
    name: "Дніпро",
    description: "Промисловий центр України з красивою набережною та сучасною інфраструктурою.",
    rating: 4.4,
    image: "../img/днепр.jpg",
    mapsQuery: "Dnipro, Ukraine"
  },
  {
    name: "Чернівці",
    description: "Місто з унікальною архітектурою та затишною атмосферою.",
    rating: 4.6,
    image: "../img/черновци.jpg",
    mapsQuery: "Chernivtsi, Ukraine"
  },
  {
    name: "Івано-Франківськ",
    description: "Затишне місто біля Карпат, відоме своєю гостинністю.",
    rating: 4.5,
    image: "../img/иванофр.jpg",
    mapsQuery: "Ivano-Frankivsk, Ukraine"
  },
  {
    name: "Ужгород",
    description: "Місто на заході України з багатою історією та традиціями.",
    rating: 4.4,
    image: "../img/місто ужгород житло.jpeg",
    mapsQuery: "Uzhhorod, Ukraine"
  },
];

function createCityCards() {
  const container = document.querySelector(".scroll-container");
  const indicators = document.querySelector(".scroll-indicators");
  container.innerHTML = "";
  indicators.innerHTML = "";

  cities.forEach((city, index) => {
    const card = document.createElement("div");
    card.classList.add("city-card");
    card.innerHTML = `
      <img src="${city.image}" alt="${city.name}" class="city-image">
      <div class="city-content">
        <div class="city-name">${city.name}</div>
        <div class="city-description">${city.description}</div>
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
}

document.addEventListener("DOMContentLoaded", () => {
  createCityCards();

  const scrollContainer = document.querySelector('.scroll-container');
  const leftButton = document.querySelector('.scroll-button.left');
  const rightButton = document.querySelector('.scroll-button.right');
  const dots = document.querySelectorAll('.scroll-indicators .dot');
  const cards = document.querySelectorAll('.city-card');

  const cardWidth = 330 + 30; // ширина картки + gap

  // IntersectionObserver для анімації появи
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('show');
      } else {
        entry.target.classList.remove('show');
      }
    });
  }, { threshold: 0.5 });

  cards.forEach(card => observer.observe(card));

  // Scroll buttons
  leftButton.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  rightButton.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  // Оновлення активної точки
  scrollContainer.addEventListener('scroll', () => {
    const scrollLeft = scrollContainer.scrollLeft;
    const activeIndex = Math.round(scrollLeft / cardWidth);

    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[activeIndex]) dots[activeIndex].classList.add('active');
  });
});

const input = document.getElementById("searchInput");




// Кнопка "очистити" з’являється при введенні
const clearBtn = document.createElement("span");
clearBtn.innerHTML = "✖";
clearBtn.className = "clear-button";
clearBtn.style.cssText = `
  position: absolute;
  right: 55px;
  font-size: 20px;
  color: #333;
  cursor: pointer;
  display: none;
  z-index: 10;
`;

document.querySelector(".search-section").appendChild(clearBtn);

input.addEventListener("input", () => {
  clearBtn.style.display = input.value ? "block" : "none";
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  suggestionsList.innerHTML = "";
  clearBtn.style.display = "none";
  input.focus();
});

//  Голосовий пошук
const micBtn = document.createElement("span");
micBtn.innerHTML = "🎤";
micBtn.className = "mic-button";
micBtn.style.cssText = `
  position: absolute;
  right: 38px;
  font-size: 25px;
  color: #333;
  cursor: pointer;
  z-index: 10;
`;

document.querySelector(".search-section").appendChild(micBtn);

micBtn.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Ваш браузер не підтримує голосовий пошук.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
recognition.lang = "uk-UA"; 









  recognition.start();

  recognition.onresult = function (event) {
    const result = event.results[0][0].transcript;
    input.value = result;
    input.dispatchEvent(new Event("input")); 
  };

  recognition.onerror = function () {
    alert("Сталася помилка під час розпізнавання голосу.");
  };
});
