console.log("📄 Сторінка міста завантажена.");
// Я ЗРОБЛЮ КОМЕНТАРІ ПО МЕТОДАМ ФУНКЦІЯМИ ЗАПИТАМИ ЩОБ НЕ ЗАБУВАТИ ЯК ПРАЦЮЮТЬ (АРТЕМ)
//  Подія DOMContentLoaded — виконується, коли HTML повністю завантажено (але не обов’язково картинки)
document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Отримуємо посилання на всі елементи з HTML за їхніми id
  const placeNameEl = document.getElementById("place-name");
  const addressEl = document.getElementById("address");
  const ratingEl = document.getElementById("rating");
  const reviewsSection = document.getElementById("reviews-section");
  const reviewsContainer = document.getElementById("reviews");
  const photoSlider = document.getElementById("photo-slider");
  const slidesContainer = document.getElementById("slides");
  const dotWrap = document.getElementById("dot-wrap");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const nearbySection = document.getElementById("nearby-section");
  const nearbyList = document.getElementById("nearby-list");
  const mapEl = document.getElementById("map");


  const apiKey = "AIzaSyBaWd1yK7Y3sO-gNw6VWv9Gqsu6b8iB2zY";

  //  Змінні для карти, слайдів і стану
  let map;
  let marker;
  let slides = [];
  let dots = [];
  let slideIndex = 0;

  //  URLSearchParams — дозволяє отримати параметри з URL (наприклад ?placeId=123)
  const params = new URLSearchParams(window.location.search);
  const initialPlaceId = params.get("placeId");
  if (!initialPlaceId) {
    placeNameEl.textContent = "Помилка: місце не знайдено";
    return;
  }



  //  Асинхронна функція для завантаження даних про місце
  async function loadPlace(placeId) {
    try {
      console.log("🚀 Завантаження даних про місце...", placeId);
      //  fetch — метод для HTTP-запитів. Повертає проміс
      const detailsRes = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,rating,userRatingCount,photos,reviews&key=${apiKey}`
      );

      //  await detailsRes.json() — перетворює відповідь сервера (JSON-текст) у JavaScript-об’єкт
      const place = await detailsRes.json();
      console.log("✅ Деталі місця:", place);

      // Якщо місце не знайдено
      if (!place || !place.id) {
        placeNameEl.textContent = "Не вдалося знайти місце 😢";
        return;
      }

      //  Встановлюємо назву, адресу та рейтинг
      placeNameEl.textContent = place.displayName?.text || "Без назви";
      addressEl.textContent = place.formattedAddress || "Адреса не вказана";

      if (place.rating) {
        // classList.remove — видаляє клас (щоб елемент став видимим)
        ratingEl.classList.remove("hidden");
        ratingEl.innerHTML = `⭐ ${place.rating} (${place.userRatingCount || 0} відгуків)`;
      } else {
        ratingEl.classList.add("hidden");
      }

      //  Фото місця
      slidesContainer.innerHTML = "";
      dotWrap.innerHTML = "";
      slides = [];
      dots = [];
      slideIndex = 0;

      // Якщо є фото
      if (place.photos && place.photos.length > 0) {
        photoSlider.classList.remove("hidden");

        // map() — створює новий масив, застосовуючи функцію до кожного елемента
        const photoUrls = place.photos.slice(0, 5).map(
          (p) =>
            `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=500&key=${apiKey}`
        );



        // forEach() — перебирає всі елементи масиву
        photoUrls.forEach((url, i) => {
          const img = document.createElement("img"); // створюємо тег <img>
          img.src = url;
          img.className = "slide";
          img.style.display = i === 0 ? "block" : "none"; // показуємо лише перше фото
          slidesContainer.appendChild(img);
          slides.push(img);

          // Створюємо “крапки” під слайдером
          const dot = document.createElement("span");
          dot.className = "dot";
          if (i === 0) dot.classList.add("active");
          dot.addEventListener("click", () => showSlide(i));
          dotWrap.appendChild(dot);
          dots.push(dot);
        });

        // Кнопки "вліво/вправо"
        prevBtn.onclick = () => showSlide(slideIndex - 1);
        nextBtn.onclick = () => showSlide(slideIndex + 1);
      } else {
        photoSlider.classList.add("hidden");
      }

      //  Відгуки
      reviewsContainer.innerHTML = "";
      if (place.reviews && place.reviews.length > 0) {
        reviewsSection.classList.remove("hidden");

        // slice(0,3) — бере лише перші 3 відгуки
        place.reviews.slice(0, 6).forEach((r) => {
          let text = r.text?.text || "";
          if (text.length > 50) text = text.slice(0, 80) + "...";

          const div = document.createElement("div");
          div.className = "review";
          div.style.setProperty("--i", Math.floor(Math.random() * 5) - 2);
          div.innerHTML = `
            <span class="author">👤 ${r.authorAttribution?.displayName || "Користувач"}</span>
            <span class="rating">⭐ ${r.rating || "-"}</span>
            <p>${text}</p>
          `;
          reviewsContainer.appendChild(div);
        });
      } else {
        reviewsSection.classList.add("hidden");
      }

      //  Ініціалізація Google Maps
      if (place.location && place.location.latitude && place.location.longitude) {
        const loc = place.location;

        // Якщо карта ще не створена — створюємо її
        if (!map) {
          map = new google.maps.Map(mapEl, {
            center: { lat: loc.latitude, lng: loc.longitude },
            zoom: 15,
          });
        } else {
          map.setCenter({ lat: loc.latitude, lng: loc.longitude });
        }

        // Очищаємо попередній маркер
        if (marker) marker.setMap(null);

        // Додаємо новий маркер
        marker = new google.maps.Marker({
          position: { lat: loc.latitude, lng: loc.longitude },
          map,
          title: placeNameEl.textContent,
        });

        // Клік по карті відкриває Google Maps у новій вкладці
        mapEl.addEventListener("click", () => {
          if (!place.location) return;
          const lat = place.location.latitude;
          const lng = place.location.longitude;
          const query = encodeURIComponent(
            place.displayName?.text || place.formattedAddress || ""
          );
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.id}&hl=uk`;
          window.open(mapsUrl, "_blank");
        });
      }

      //  Nearby місця (поруч)
      nearbyList.innerHTML = "";
      if (place.location && place.location.latitude && place.location.longitude) {
        const loc = place.location;

        // Створюємо або оновлюємо карту
        if (!map) {
          map = new google.maps.Map(mapEl, {
            center: { lat: loc.latitude, lng: loc.longitude },
            zoom: 15,
          });
        } else {
          map.setCenter({ lat: loc.latitude, lng: loc.longitude });
        }

        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
          position: { lat: loc.latitude, lng: loc.longitude },
          map,
          title: placeNameEl.textContent,
        });

        //  Запит POST для пошуку nearby місць
        const nearbyRes = await fetch(
          `https://places.googleapis.com/v1/places:searchNearby?key=${apiKey}`,
          {
            method: "POST", // Тип запиту — POST (надсилаємо дані в body)
            headers: {
              "Content-Type": "application/json", // формат тіла — JSON
              "X-Goog-FieldMask": "places.id,places.displayName,places.rating",
            },
            body: JSON.stringify({
              includedTypes: [
                "tourist_attraction",
                "restaurant",
                "museum",
                "park",
              ],
              maxResultCount: 4,
              locationRestriction: {
                circle: {
                  center: {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  },
                  radius: 2000, // радіус у метрах
                },
              },
            }),
          }
        );

        const nearbyData = await nearbyRes.json();
        console.log("📍 Nearby results:", nearbyData);

        // Якщо поруч є місця — показуємо їх
        if (nearbyData.places && nearbyData.places.length > 0) {
          nearbySection.classList.remove("hidden");
          nearbyData.places.forEach((p) => {
            const li = document.createElement("li");
            li.className = "nearby-item";
            li.dataset.placeId = p.id; // зберігаємо id місця у data-атрибуті
            li.innerHTML = `
              <span class="nearby-name">${p.displayName?.text || "Без назви"}</span>
              <span class="nearby-rating">⭐ ${p.rating || "-"}</span>
            `;
            nearbyList.appendChild(li);
          });
        } else {
          nearbySection.classList.add("hidden");
        }
      }
    } catch (err) {
      // Обробка помилок
      console.error("❌ Помилка:", err);
      placeNameEl.textContent = "Сталася помилка при завантаженні місця.";
    }
  }

  //  Функція для показу потрібного слайду (з фото)
  function showSlide(i) {
    if (!slides || slides.length === 0) return;

    // Ховаємо всі слайди та знімаємо активні точки
    slides.forEach((s) => (s.style.display = "none"));
    dots.forEach((d) => d.classList.remove("active"));

    // Обчислюємо новий індекс слайду
    slideIndex = (i + slides.length) % slides.length;
    slides[slideIndex].style.display = "block";
    dots[slideIndex].classList.add("active");
  }

  // 🖱 Клік по nearby місцю
  nearbyList.addEventListener("click", (e) => {
    // closest() — шукає найближчий елемент з потрібним класом
    const li = e.target.closest(".nearby-item");
    if (!li) return;
    const newPlaceId = li.dataset.placeId;
    if (newPlaceId) {
      loadPlace(newPlaceId); // завантажуємо нове місце
      window.scrollTo({ top: 0, behavior: "smooth" }); // плавно прокручуємо нагору
    }
  });

  //  Завантажуємо початкове місце при відкритті сторінки
  loadPlace(initialPlaceId);
});
