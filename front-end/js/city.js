console.log("📄 Сторінка міста завантажена.");

document.addEventListener("DOMContentLoaded", () => {
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
  let map;
  let marker;
  let slides = [];
  let dots = [];
  let slideIndex = 0;

  const params = new URLSearchParams(window.location.search);
  const initialPlaceId = params.get("placeId");
  if (!initialPlaceId) {
    placeNameEl.textContent = "Помилка: місце не знайдено";
    return;
  }

  async function loadPlace(placeId) {
    try {
      console.log("🚀 Завантаження даних про місце...", placeId);

      const detailsRes = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,rating,userRatingCount,photos,reviews&key=${apiKey}`
      );
      const place = await detailsRes.json();
      console.log("✅ Деталі місця:", place);

      if (!place || !place.id) {
        placeNameEl.textContent = "Не вдалося знайти місце 😢";
        return;
      }

      // Назва, адреса, рейтинг
      placeNameEl.textContent = place.displayName?.text || "Без назви";
      addressEl.textContent = place.formattedAddress || "Адреса не вказана";

      if (place.rating) {
        ratingEl.classList.remove("hidden");
        ratingEl.innerHTML = `⭐ ${place.rating} (${place.userRatingCount || 0} відгуків)`;
      } else {
        ratingEl.classList.add("hidden");
      }

      // 🖼 Фото
      slidesContainer.innerHTML = "";
      dotWrap.innerHTML = "";
      slides = [];
      dots = [];
      slideIndex = 0;

      if (place.photos && place.photos.length > 0) {
        photoSlider.classList.remove("hidden");
        const photoUrls = place.photos.slice(0, 5).map((p) =>
          `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=500&key=${apiKey}`
        );

        photoUrls.forEach((url, i) => {
          const img = document.createElement("img");
          img.src = url;
          img.className = "slide";
          img.style.display = i === 0 ? "block" : "none"; // показуємо тільки перший
          slidesContainer.appendChild(img);
          slides.push(img);

          const dot = document.createElement("span");
          dot.className = "dot";
          if (i === 0) dot.classList.add("active");
          dot.addEventListener("click", () => showSlide(i));
          dotWrap.appendChild(dot);
          dots.push(dot);
        });

        // Встановлюємо кнопки
        prevBtn.onclick = () => showSlide(slideIndex - 1);
        nextBtn.onclick = () => showSlide(slideIndex + 1);
      } else {
        photoSlider.classList.add("hidden");
      }

      // 💬 Відгуки
      reviewsContainer.innerHTML = "";
      if (place.reviews && place.reviews.length > 0) {
        reviewsSection.classList.remove("hidden");
        place.reviews.slice(0, 5).forEach((r) => {
          const div = document.createElement("div");
          div.className = "review-card";
          div.innerHTML = `
            <p class="review-author">👤 ${r.authorAttribution?.displayName || "Користувач"}</p>
            <p class="review-rating">⭐ ${r.rating || "-"}</p>
            <p class="review-text">${r.text?.text || ""}</p>
          `;
          reviewsContainer.appendChild(div);
        });
      } else {
        reviewsSection.classList.add("hidden");
      }

      // 📍 Nearby місця
      nearbyList.innerHTML = "";
      if (place.location && place.location.latitude && place.location.longitude) {
        const loc = place.location;
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

        const nearbyRes = await fetch(
          `https://places.googleapis.com/v1/places:searchNearby?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-FieldMask": "places.id,places.displayName,places.rating",
            },
            body: JSON.stringify({
              includedTypes: ["tourist_attraction", "restaurant", "museum", "park"],
              maxResultCount: 4,
              locationRestriction: {
                circle: {
                  center: { latitude: loc.latitude, longitude: loc.longitude },
                  radius: 2000,
                },
              },
            }),
          }
        );

        const nearbyData = await nearbyRes.json();
        console.log("📍 Nearby results:", nearbyData);

        if (nearbyData.places && nearbyData.places.length > 0) {
          nearbySection.classList.remove("hidden");
          nearbyData.places.forEach((p) => {
            const li = document.createElement("li");
            li.className = "nearby-item";
            li.dataset.placeId = p.id;
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
      console.error("❌ Помилка:", err);
      placeNameEl.textContent = "Сталася помилка при завантаженні місця.";
    }
  }

  function showSlide(i) {
    if (!slides || slides.length === 0) return;

    slides.forEach((s) => (s.style.display = "none"));
    dots.forEach((d) => d.classList.remove("active"));

    slideIndex = (i + slides.length) % slides.length;
    slides[slideIndex].style.display = "block";
    dots[slideIndex].classList.add("active");
  }

  // 🔹 Клік на nearby місце
  nearbyList.addEventListener("click", (e) => {
    const li = e.target.closest(".nearby-item");
    if (!li) return;
    const newPlaceId = li.dataset.placeId;
    if (newPlaceId) {
      loadPlace(newPlaceId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // 🔹 Завантажуємо початкове місце
  loadPlace(initialPlaceId);
});
