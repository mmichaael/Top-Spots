const NO_PHOTO_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='20' font-family='sans-serif'%3EНемає фото%3C/text%3E%3C/svg%3E";

const log = (msg, data = '') => console.log(`%c[SYSTEM]: ${msg}`, 'color: #10b981; font-weight: bold', data);

async function loadGoogleMapsAPI() {
    if (window.google && window.google.maps && window.google.maps.places) return true;
    
    if (document.getElementById('google-maps-sdk')) {
        for (let i = 0; i < 20; i++) {
            if (window.google && window.google.maps && window.google.maps.places) return true;
            await new Promise(r => setTimeout(r, 200));
        }
    }

    const response = await fetch('/api/google-maps-key');
    const data = await response.json();

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'google-maps-sdk';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&v=weekly&loading=async`;
        script.onload = () => resolve(true);
        document.head.appendChild(script);
    });
}

async function performSearch() {
    const statusText = document.getElementById('nearbyStatus');
    const grid = document.getElementById('nearbyGrid');
    const radiusInput = document.getElementById('nearbyRadius');
    const activeChip = document.querySelector('.chip.active');

    let category = activeChip ? activeChip.dataset.type || activeChip.innerText : 'tourist_attraction';
    category = category.toLowerCase().replace(/\s+/g, '_');

    log(`🔍 Пошук категорії: ${category}`);
    statusText.innerHTML = `<i class="fas fa-sync fa-spin"></i> Опитування радару...`;

    try {
        await loadGoogleMapsAPI();
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 });
        });
        const { latitude, longitude } = pos.coords;

        // Використовуємо новий API v1
        const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
        
        const request = {
            fields: ["displayName", "location", "rating", "photos", "id", "formattedAddress"],
            locationRestriction: {
                center: new google.maps.LatLng(latitude, longitude),
                radius: radiusInput.value * 1000,
            },
            includedPrimaryTypes: [category],
            maxResultCount: 15,
            rankPreference: SearchNearbyRankPreference.POPULARITY,
        };

        const { places } = await Place.searchNearby(request);

        if (places && places.length > 0) {
            log(`Знайдено через новий API: ${places.length}`);
            
            const formattedResults = places.map(p => {
                // НОВИЙ МЕТОД: getURI замість getUrl
                let finalPhotoUrl = NO_PHOTO_SVG;
                if (p.photos && p.photos.length > 0) {
                    finalPhotoUrl = p.photos[0].getURI({ maxWidth: 800 });
                }

                return {
                    place_id: p.id,
                    name: p.displayName,
                    vicinity: p.formattedAddress,
                    rating: p.rating || 4.5,
                    latitude: p.location.lat(),
                    longitude: p.location.lng(),
                    photo_url: finalPhotoUrl
                };
            });

            renderNearbyCards(formattedResults);
            statusText.innerText = `Знайдено ${places.length} локацій`;
            syncWithBackend(formattedResults);
        } else {
            throw new Error("ZERO_RESULTS");
        }
    } catch (err) {
        log(`🔴 Помилка: ${err.message}`);
        statusText.innerText = err.message === "ZERO_RESULTS" ? "Нічого не знайдено" : "Помилка доступу до даних";
    }
}

function renderNearbyCards(places) {
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    grid.innerHTML = ''; 

    places.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'place-card-v2';
        
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${p.photo_url}" class="card-main-img" onerror="this.src='${NO_PHOTO_SVG}'">
                <div class="card-rating-glass">
                    <i class="fas fa-star"></i> <span>${p.rating}</span>
                </div>
            </div>
            <div class="card-info">
                <h4 class="card-title">${p.name}</h4>
                <p class="card-addr">${p.vicinity || 'Україна'}</p>
                <button class="card-btn">Детальніше</button>
            </div>
        `;

        card.querySelector('.card-btn').onclick = () => {
            window.location.href = `/html/city_page.html?placeId=${p.place_id}`;
        };

        grid.appendChild(card);
        setTimeout(() => card.classList.add('visible'), i * 60);
    });
}

function syncWithBackend(results) {
    fetch('/api/nearby/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: results })
    }).catch(e => console.error("Sync error:", e));
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
    setTimeout(performSearch, 1000);
}

document.addEventListener('DOMContentLoaded', initNearbyPage);