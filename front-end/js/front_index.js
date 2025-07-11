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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Kyiv_cityscape.jpg/1024px-Kyiv_cityscape.jpg",
    mapsQuery: "Kyiv, Ukraine"
  },
  {
    name: "Львів",
    description: "Культурна столиця України, відома своєю архітектурою, кав'ярнями та старовинним центром.",
    rating: 4.7,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Lviv_view_2020.jpg/1024px-Lviv_view_2020.jpg",
    mapsQuery: "Lviv, Ukraine"
  },
  {
    name: "Одеса",
    description: "Морська перлина на березі Чорного моря з веселим духом і неповторним колоритом.",
    rating: 4.6,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Odessa%2C_Potemkin_Stairs.jpg/1024px-Odessa%2C_Potemkin_Stairs.jpg",
    mapsQuery: "Odesa, Ukraine"
  }
];

function createCityCards() {
  cities.forEach((city, index) => {
    const card = document.getElementById(`city${index + 1}`);
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
  });
}

document.addEventListener("DOMContentLoaded", createCityCards);
