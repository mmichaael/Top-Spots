const tpl = document.getElementById('placeCardTpl');
const grid = document.getElementById('placesGrid');
const metaText = document.getElementById('metaText');
const emptyState = document.getElementById('emptyState');

const radiusRange = document.getElementById('radiusRange');
const radiusValue = document.getElementById('radiusValue');
const applyFilterBtn = document.getElementById('applyFilterBtn');

let searchRadiusKm = 12;

// ---------- категорії ----------

const CATEGORY_TYPES = {
  popular: ["tourist_attraction", "museum", "point_of_interest"],
  romantic: ["park", "tourist_attraction"],
  active: ["park", "stadium", "gym"],
  summer: ["beach", "lake"],
  family: ["zoo", "amusement_park", "aquarium"]
};



function getQueryParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

function targetCountByRadius(radiusKm) {
  if (radiusKm <= 3.5) return 9;
  if (radiusKm <= 7.2) return 15;
  if (radiusKm <= 12.8) return 22;
  return 35;
}

async function getUserPosition() {
  return new Promise((res, rej) => {
    navigator.geolocation.getCurrentPosition(
      pos => res(pos.coords),
      err => rej(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ---------- render ----------

function renderPlaces(places) {
  grid.innerHTML = '';

  if (!places.length) {
    emptyState.classList.remove('hidden');
    metaText.textContent = 'Нічого не знайдено';
    return;
  }

  emptyState.classList.add('hidden');

  places.forEach((p, i) => {
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.place-card');

    node.querySelector('.place-photo').src =
      p.photos[0].getUrl({ maxWidth: 800 });

    node.querySelector('.place-name').textContent = p.name || '—';
    node.querySelector('.place-addr').textContent = p.vicinity || '';
    node.querySelector('.place-rating').textContent =
      p.rating ? `⭐ ${p.rating}` : '—';

    node.querySelector('.details-btn').onclick = () => {
      location.href = `/html/city_page.html?placeId=${p.place_id}`;
    };

    grid.appendChild(node);
    setTimeout(() => card.classList.add('show'), i * 70);
  });
}

// ---------- Google Places (з авто-розширенням) ----------

async function fetchPlaces(lat, lng, category) {
  const mapDiv = document.createElement('div');
  const map = new google.maps.Map(mapDiv);
  const service = new google.maps.places.PlacesService(map);

  const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.popular;
  const maxRadius = 25;

  let collected = {};
  let currentRadius = searchRadiusKm;

  while (currentRadius <= maxRadius) {
    const requests = types.map(type =>
      new Promise(resolve => {
        service.nearbySearch({
          location: new google.maps.LatLng(lat, lng),
          radius: currentRadius * 1000,
          type
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach(p => {
              if (p.photos && p.photos.length > 0) {
                collected[p.place_id] = p;
              }
            });
          }
          resolve();
        });
      })
    );

    await Promise.all(requests);

    const list = Object.values(collected);
    const target = targetCountByRadius(searchRadiusKm);

    if (list.length >= target || currentRadius === maxRadius) {
      const MAX_RESULTS = Math.min(
        Math.max(searchRadiusKm * 3, 8),
        60
      );
      return list.slice(0, MAX_RESULTS);
    }

    currentRadius = currentRadius < 10
      ? currentRadius + 2
      : currentRadius + 5;
  }

  return Object.values(collected);
}

// ---------- init ----------

async function init() {
  const category = getQueryParam('category') || 'popular';
  metaText.textContent = 'Отримую геолокацію…';

  try {
    const { latitude, longitude } = await getUserPosition();
    metaText.textContent = 'Завантажую місця…';

    const places = await fetchPlaces(latitude, longitude, category);
    renderPlaces(places);

    metaText.textContent =
      `Знайдено ${places.length} місць у радіусі ${searchRadiusKm} км`;
  } catch {
    const places = await fetchPlaces(50.4501, 30.5234, category);
    renderPlaces(places);

    metaText.textContent =
      `Знайдено ${places.length} популярних місць`;
  }
}

// ---------- events ----------

radiusRange.addEventListener('input', () => {
  searchRadiusKm = radiusRange.value;
  radiusValue.textContent = searchRadiusKm;
});

applyFilterBtn.addEventListener('click', init);

// ---------- старт після завантаження API ----------

window.addEventListener('load', () => {
  if (window.google && google.maps) {
    init();
  } else {
    console.error('Google Maps API не завантажився');
  }
});
