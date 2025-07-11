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