const NO_PHOTO_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='20' font-family='sans-serif'%3EНемає фото%3C/text%3E%3C/svg%3E";

const log = (msg, color = '#10b981') => console.log(`%c[SYSTEM]: ${msg}`, `color: ${color}; font-weight: bold`);

async function performSearch() {
    const statusText = document.getElementById('nearbyStatus');
    const radiusInput = document.getElementById('nearbyRadius');
    const activeChip = document.querySelector('.chip.active');

    let category = activeChip ? activeChip.dataset.type || activeChip.innerText : 'tourist_attraction';
    category = category.toLowerCase().replace(/\s+/g, '_');

    log(`🔍 Початок пошуку. Категорія: ${category}`, '#3b82f6');
    statusText.innerHTML = `<i class="fas fa-sync fa-spin"></i> Опитування локальної бази...`;

    try {
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 });
        });
        const { latitude, longitude } = pos.coords;
        const radius = radiusInput.value * 1000;

        log(`📡 Запит до нашого сервера...`, '#8b5cf6');
        const dbRes = await fetch('/api/nearby/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, radius, category }) // ← ФІКС
        });

        if (dbRes.ok) {
            const dbData = await dbRes.json();
            if (dbData.results && dbData.results.length > 0) {
                log(`✅ [DATABASE HIT]: Знайдено ${dbData.results.length} місць у вашій БД!`, '#10b981');
                statusText.innerText = `Знайдено ${dbData.results.length} локацій (з бази)`;
                renderNearbyCards(dbData.results);
                return;
            }
        }

        log(`⚠️ [DATABASE MISS]: В базі порожньо. Запитуємо Google...`, '#f59e0b');
        statusText.innerHTML = `<i class="fas fa-satellite"></i> Супутниковий пошук Google...`;

        await loadGoogleMapsAPI();
        const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");

        const request = {
            fields: ["displayName", "location", "rating", "photos", "id", "formattedAddress"],
            locationRestriction: {
                center: new google.maps.LatLng(latitude, longitude),
                radius: radius,
            },
            includedPrimaryTypes: [category],
            maxResultCount: 20,
            rankPreference: SearchNearbyRankPreference.POPULARITY,
        };

        const { places } = await Place.searchNearby(request);

        if (places && places.length > 0) {
            log(`🌐 [GOOGLE API]: Отримано ${places.length} місць`, '#10b981');

            const formattedResults = places.map(p => ({
                place_id: p.id,
                name: p.displayName?.text || p.displayName || "Без назви",
                vicinity: p.formattedAddress,
                rating: p.rating || 4.5,
                latitude: p.location.lat(),
                longitude: p.location.lng(),
                photo_url: `/api/google/photo?place_id=${encodeURIComponent(p.id)}&maxwidth=800`,
                types: [category] // ← ФІКС
            }));

            renderNearbyCards(formattedResults);
            statusText.innerText = `Знайдено ${places.length} нових локацій`;
            syncWithBackend(formattedResults);
        } else {
            throw new Error("ZERO_RESULTS");
        }

    } catch (err) {
        log(`🔴 Помилка: ${err.message}`, '#ef4444');
        statusText.innerText = err.message === "ZERO_RESULTS" ? "Нічого не знайдено поруч" : "Помилка доступу до даних";
    }
}

function renderNearbyCards(places) {
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    places.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'place-card-v2';

        const displayName = p.name || p.query_name || "Цікаве місце";
        const displayAddr = p.vicinity || p.full_name || "Україна";

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${p.photo_url || NO_PHOTO_SVG}" class="card-main-img">
                <div class="card-rating-glass">
                    <i class="fas fa-star"></i> <span>${p.rating}</span>
                </div>
            </div>
            <div class="card-info">
                <h4 class="card-title">${displayName}</h4>
                <p class="card-addr">${displayAddr}</p>
                <button class="card-btn" style="margin-top:12px;padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:opacity 0.2s;">Детальніше</button>
            </div>
        `;

        const img = card.querySelector('img');
        if (img) {
            img.addEventListener('error', () => { img.src = NO_PHOTO_SVG; });
        }
        const btn = card.querySelector('.card-btn');
        if (btn) {
            btn.addEventListener('mouseover', () => { btn.style.opacity = '0.85'; });
            btn.addEventListener('mouseout', () => { btn.style.opacity = '1'; });
            btn.addEventListener('click', () => {
                window.location.href = `/html/city_page.html?placeId=${p.place_id}`;
            });
        }

        grid.appendChild(card);
        setTimeout(() => card.classList.add('visible'), i * 60);
    });
}

function syncWithBackend(results) {
    fetch('/api/nearby/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: results }) // ← ФІКС
    })
    .then(() => log(`💾 Дані синхронізовано з БД`))
    .catch(e => console.error("Sync error:", e));
}

function initNearbyPage() {
    const radiusInput = document.getElementById('nearbyRadius');
    const chips = document.querySelectorAll('.chip');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('active')) return;
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            performSearch();
        });
    });

    if (radiusInput) radiusInput.onchange = () => performSearch();

    setTimeout(() => {
        performSearch();
    }, 1000);
}

document.addEventListener('DOMContentLoaded', initNearbyPage);