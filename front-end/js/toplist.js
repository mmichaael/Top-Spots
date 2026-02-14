// ================== INIT ==================

function initNearbyPage() {
    const radiusInput = document.getElementById('nearbyRadius');
    const radiusLabel = document.getElementById('radiusVal');
    const chips = document.querySelectorAll('.chip');
    const statusText = document.getElementById('nearbyStatus');

    let selectedCategory = 'tourist attraction';
    let debounceTimer = null;

    // ---------------- ПОШУК ----------------
    const performSearch = async () => {
        statusText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Оновлюємо локації...`;

        console.log('🔍 SEARCH START:', selectedCategory, radiusInput.value);

        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            });

            const { latitude, longitude } = pos.coords;
            const radius = Number(radiusInput.value);

            console.log('📍 GEO:', latitude, longitude);

            const places = await fetchNearbyFromGoogle(
                latitude,
                longitude,
                radius,
                selectedCategory
            );

            console.log('📦 PLACES:', places);

            renderNearbyCards(places);

            statusText.innerText = places.length
                ? `Знайдено ${places.length} локацій поруч`
                : `Поруч нічого не знайдено`;

        } catch (err) {
            console.error('❌ GEO ERROR:', err);
            statusText.innerText = 'Увімкніть доступ до геолокації';
        }
    };

    // --------- КАТЕГОРІЇ ---------
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('active')) return;

            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // keyword стабільніший ніж type
            selectedCategory = chip.dataset.type || chip.innerText;

            performSearch();
        });
    });

    // --------- РАДІУС (DEBOUNCE) ---------
    radiusInput.addEventListener('input', e => {
        const val = e.target.value;
        radiusLabel.innerText = `${val} км`;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 500);
    });

    // --------- ПЕРШИЙ ЗАПУСК ---------
    performSearch();
}

// ================== GOOGLE PLACES ==================

function fetchNearbyFromGoogle(lat, lng, radiusKm, keyword) {
    return new Promise(resolve => {
        if (!google?.maps?.places) return resolve([]);

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.nearbySearch({
            location: new google.maps.LatLng(lat, lng),
            radius: radiusKm * 1000,
            keyword: keyword
        }, (results, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK) return resolve([]);
            
            // Повертаємо всі результати, розберемося з фото вже в рендері
            resolve(results); 
        });
    });
}


// ================== RENDER ==================
function getValidPhoto(place) {
    if (!place.photos || !place.photos.length) return null;

    for (const photo of place.photos) {
        try {
            const url = photo.getUrl({ maxWidth: 800 });
            if (url && url.startsWith('http')) return url;
        } catch {}
    }
    return null;
}
// 1. Константа (SVG вшито прямо в код)
const NO_PHOTO_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%23475569' font-family='sans-serif' font-size='24' text-anchor='middle'%3ENo Photo%3C/text%3E%3C/svg%3E";

function renderNearbyCards(places) {
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!places || places.length === 0) {
        grid.innerHTML = `<div class="nearby-placeholder" style="grid-column:1/-1;text-align:center;padding:50px;color:#94a3b8;">
            <i class="fas fa-search-location" style="font-size:3rem;margin-bottom:15px;display:block;"></i>
            Поруч нічого не знайдено 😕
        </div>`;
        return;
    }

    places.forEach((p, i) => {
places.forEach((p, i) => {
    let photoUrl = '';

    if (p.photos && p.photos.length > 0) {
        photoUrl = p.photos[0].getUrl({ maxWidth: 800 });
    } else {
        // Підбираємо тематичну заглушку замість порожнього тексту
        const type = p.types ? p.types[0] : '';
        if (type.includes('restaurant') || type.includes('food')) {
            photoUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400';
        } else if (type.includes('park')) {
            photoUrl = 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=400';
        } else {
            photoUrl = NO_PHOTO_SVG; // Наш дефолтний SVG
        }
    }
    // ... рендер картки
});
        if (p.photos && p.photos.length > 0) {
            try {
                photoUrl = p.photos[0].getUrl({ maxWidth: 600, maxHeight: 400 });
            } catch (e) {
                photoUrl = NO_PHOTO_SVG;
            }
        }

        const card = document.createElement('div');
        card.className = 'place-card-v2';
        // Початковий стан для анімації (якщо в CSS є transition)
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.4s ease';

card.innerHTML = `
    <div class="card-img-wrapper">
        <img src="${photoUrl}" 
             alt="${p.name}" 
             class="card-main-img"
             onerror="this.onerror=null; this.src='${NO_PHOTO_SVG}';">
        <div class="card-rating-badge">
            ⭐ ${p.rating || '0.0'}
        </div>
    </div>
    <div class="card-content">
        <h4 class="card-title">${p.name || 'Назва невідома'}</h4>
        <p class="card-location">
            <i class="fas fa-map-marker-alt"></i> ${p.vicinity || 'Адреса невідома'}
        </p>
        <button class="details-link" onclick="location.href='/html/city_page.html?placeId=${p.place_id}'">
            Деталі <i class="fas fa-chevron-right"></i>
        </button>
    </div>
`;

        grid.appendChild(card);

        // Плавна поява кожної картки по черзі
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 60);
    });
}

// ================== START ==================

window.addEventListener('load', () => {
    initNearbyPage();
});
