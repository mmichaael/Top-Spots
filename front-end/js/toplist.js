const tpl = document.getElementById('placeCardTpl');
const grid = document.getElementById('placesGrid');
const metaText = document.getElementById('metaText');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');

const GOOGLE_API_KEY = "AIzaSyBaWd1yK7Y3sO-gNw6VWv9Gqsu6b8Y";

// категорії → Google Places type
const CATEGORY_TYPES = {
  popular: ["tourist_attraction", "museum", "point_of_interest"],
  romantic: ["park", "tourist_attraction", "scenic_viewpoint"],
  active: ["hiking_trail", "park", "gym", "stadium"],
  summer: ["beach", "lake", "pool"],
  family: ["zoo", "amusement_park", "aquarium"]
};

function getQueryParam(name) {
  const url = new URL(window.location.href);
  const val = url.searchParams.get(name);
  console.log(`[LOG] Отримано параметр "${name}": ${val}`);
  return val;
}

async function getUserPosition(timeout = 10000) {
  console.log("[LOG] Отримуємо геолокацію користувача...");
  return new Promise((res, rej) => {
    if (!navigator.geolocation) {
      console.warn("[WARN] Geolocation не підтримується браузером");
      return rej(new Error("Geolocation not supported"));
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        console.log(`[LOG] Геолокація отримана: ${pos.coords.latitude}, ${pos.coords.longitude}`);
        res(pos.coords);
      },
      err => {
        console.error("[ERROR] Не вдалося отримати геолокацію:", err);
        rej(err);
      },
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}

// Отримуємо фото або placeholder
function getPhotoUrl(place) {
  if (place.photos && place.photos.length) {
    return place.photos[0].getUrl({ maxWidth: 800 });
  }
  return '../img/placeholder.jpg';
}

function renderPlaces(places) {
  console.log(`[LOG] Рендеримо ${places.length} місць...`);
  grid.innerHTML = '';
  if (!places || places.length === 0) {
    emptyState.classList.remove('hidden');
    metaText.textContent = 'Нічого не знайдено.';
    console.log("[LOG] Показано порожній стан");
    return;
  }
  emptyState.classList.add('hidden');
  places.forEach((p, i) => {
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.place-card');
    node.querySelector('.place-photo').src = getPhotoUrl(p);
    node.querySelector('.place-name').textContent = p.name || '—';
    node.querySelector('.place-addr').textContent = p.vicinity || p.address || '';
    node.querySelector('.place-rating').textContent = p.rating ? `⭐ ${p.rating}` : '—';

    const detailsBtn = node.querySelector('.details-btn');
    detailsBtn.addEventListener('click', () => {
      console.log(`[LOG] Клік на деталі: ${p.name} (${p.place_id})`);
      window.location.href = `/html/city_page.html?placeId=${encodeURIComponent(p.place_id)}`;
    });

    grid.appendChild(node);
    setTimeout(() => card.classList.add('show'), i * 80);
  });
}

function fetchPlacesWithGoogleJS(lat, lng, category) {
  return new Promise((resolve) => {
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv);
    const service = new google.maps.places.PlacesService(map);

    const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.popular;
    let resultsAll = [];
    let remaining = types.length;

    types.forEach(type => {
      const request = {
        location: new google.maps.LatLng(lat, lng),
        radius: 12000,
        type: type
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length) {
          resultsAll = resultsAll.concat(results);
        } else {
          console.warn(`[WARN] Type "${type}" не дав результатів`);
        }

        remaining--;
        if (remaining === 0) {
          const uniqueResults = Object.values(resultsAll.reduce((acc, p) => {
            acc[p.place_id] = p;
            return acc;
          }, {}));
          console.log(`[LOG] Загалом отримано ${uniqueResults.length} унікальних результатів`);
          resolve(uniqueResults);
        }
      });
    });
  });
}

async function init() {
  console.log("[LOG] Ініціалізація сторінки...");
  const category = getQueryParam('category') || 'popular';
  const titles = {
    popular: 'Популярні напрямки',
    romantic: 'Романтичні локації',
    active: 'Активний відпочинок',
    summer: 'Літні тури',
    family: 'Сімейні напрямки'
  };
  document.getElementById('pageTitle').textContent = titles[category] || 'Ідеї для подорожей';
  metaText.textContent = 'Отримую вашу геолокацію...';

  try {
    const coords = await getUserPosition();
    const { latitude: lat, longitude: lng } = coords;
    metaText.textContent = 'Завантажую місця поблизу...';
    const places = await fetchPlacesWithGoogleJS(lat, lng, category);
    renderPlaces(places.slice(0, 10));
    metaText.textContent = `Показано ${Math.min(places.length, 10)} місць у радіусі 12 км`;
  } catch (err) {
    console.warn("[WARN] Геолокація не доступна, показуємо fallback");
    metaText.textContent = 'Не вдалося отримати геолокацію. Показую популярні місця України...';

    const lat = 50.4501, lng = 30.5234;
    const places = await fetchPlacesWithGoogleJS(lat, lng, category);
    renderPlaces(places.slice(0, 10));
    metaText.textContent = `Показано ${Math.min(places.length, 10)} популярних місць`;
  }
}

refreshBtn.addEventListener('click', () => {
  console.log("[LOG] Натиснуто кнопку Refresh");
  init();
});

window.initToplistPage = init;
