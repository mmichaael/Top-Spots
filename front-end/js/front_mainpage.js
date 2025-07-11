import {mainPageFunctionsHandler} from "./functions.js";
const mainPageFunctions = new mainPageFunctionsHandler();

// -----------------------  Menu Pop Up Button ------------------------
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
const closeBtn = document.getElementById('closeBtn');

menuBtn.addEventListener('click', () => {
    menu.classList.toggle('active');
});

document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && event.target !== menuBtn) {
        menu.classList.remove('active');
    }
});

closeBtn.addEventListener('click', () => {
    menu.classList.remove('active');
});

document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && event.target !== menuBtn) {
        menu.classList.remove('active');
    }
});



// -----------------------  Log Out Button ------------------------
const logOutBtn = document.getElementById('LogOut');
logOutBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log(`Button Log Out clicked`);
    mainPageFunctions.logOut();
});



// const searchInput = document.getElementById("searchInput");
// const suggestionsList = document.createElement("ul");
// suggestionsList.id = "suggestionsList";
// document.querySelector(".search-bar").appendChild(suggestionsList);
// // БРО Я ТУТ ВСЕ ПОПІДПИСУЮ ЩОБ НЕ ПЛУТАТИСЬ 



// let lastRequestTime = 0; // Час останнього запиту

// // Спочатку ховаємо список
// suggestionsList.style.display = "none"; 

// searchInput.addEventListener("input", async (e) => {
//     const query = e.target.value.trim();
    
//     // Показуємо список лише якщо введено хоча б 2 символи
//     if (query.length < 2) {
//         suggestionsList.innerHTML = "";  // Очистка списку
//         suggestionsList.style.display = "none"; // Сховати список
//         return;
//     }

//     const currentTime = Date.now();
//     if (currentTime - lastRequestTime < 1000) { 
//         return; // Чекаємо 1 секунду перед новим запитом
//     }
//     lastRequestTime = currentTime;

//     const results = await searchCity(query);
//     showSuggestions(results);
// });
// async function searchCity(query) {
//     const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&laccept-language=uk&countrycodes=UA`;
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

// function showSuggestions(results) {
//     suggestionsList.innerHTML = ""; // Очистка перед новими даними

//     // Якщо нічого не знайдено
//     if (results.length === 0) {
//         suggestionsList.innerHTML = "<li class='no-results'>Нічого не знайдено</li>";
//     } else {
//         results.forEach(result => {
//             const li = document.createElement("li");
//             li.textContent = result.display_name; // Назва місця
//             li.addEventListener("click", () => selectSuggestion(result)); // Вибір місця
//             suggestionsList.appendChild(li);
//         });
//     }

//     // Показуємо список після заповнення результатами
//     suggestionsList.style.display = "block"; 
//     suggestionsList.classList.add("show"); // Додаємо клас для анімації
// }

// function selectSuggestion(result) {
//     searchInput.value = result.display_name; // Вставляємо вибране місце
//     suggestionsList.innerHTML = ""; // Ховаємо випадаючий список
//     suggestionsList.style.display = "none"; // Сховати список після вибору
//     suggestionsList.classList.remove("show"); // Прибираємо клас анімації
// }
const suggestion = document.getElementById('suggestionsList');
const inputField = document.getElementById('searchInput');
let timer;
inputField.addEventListener('input', () => {
    clearTimeout(timer);
    
    const inputValue = inputField.value;
    if(!inputValue.trim()) return suggestion.innerHTML = ``;

    timer = setTimeout(()=>{
    const searchingSug = mainPageFunctions.searchingSugges(inputValue)
        clearTimeout(timer);
    }, 400);
})
