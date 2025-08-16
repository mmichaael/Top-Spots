// const cityInput = document.getElementById('city-input');
// const searchBtn = document.getElementById('search-btn');
// const cityNameElem = document.getElementById('city-name');
// const cityDescElem = document.getElementById('city-description');
// const cityRatingElem = document.getElementById('city-rating');
// const cityPopulationElem = document.getElementById('city-population');
// const placesListElem = document.getElementById('places-list');
// const reviewsListElem = document.getElementById('reviews-list');
// const reviewForm = document.getElementById('review-form');
// const mapContainer = document.getElementById('map');

// let map;
// let markers = [];

// function initMap(lat, lon) {
//   if (map) {
//     map.setView([lat, lon], 13);
//     markers.forEach(m => map.removeLayer(m));
//     markers = [];
//   } else {
//     map = L.map('map').setView([lat, lon], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       maxZoom: 19,
//     }).addTo(map);
//   }
// }

// function addMarker(lat, lon, popupText) {
//   const marker = L.marker([lat, lon]).addTo(map);
//   if (popupText) marker.bindPopup(popupText);
//   markers.push(marker);
// }

// async function fetchCityData(city) {
//   try {
//     const res = await fetch(`/api/city?city=${encodeURIComponent(city)}`);
//     if (!res.ok) throw new Error('City not found');
//     const data = await res.json();

//     cityNameElem.textContent = data.city.name;
//     cityDescElem.textContent = data.city.description;
//     cityRatingElem.textContent = `Рейтинг: ${data.city.rating.toFixed(1)} ⭐`;
//     cityPopulationElem.textContent = `Населення: ${data.city.population}`;

//     placesListElem.innerHTML = '';
//     data.places.forEach(place => {
//       const li = document.createElement('li');
//       li.textContent = `${place.name} (${place.category}) — ${place.address}`;
//       placesListElem.appendChild(li);
//       addMarker(place.lat, place.lon, place.name);
//     });

//     if (data.places.length > 0) {
//       reviewForm.style.display = 'block';
//       reviewsListElem.style.display = 'block';
//     } else {
//       reviewForm.style.display = 'none';
//       reviewsListElem.style.display = 'none';
//     }

//     reviewsListElem.innerHTML = '';
//     data.reviews.forEach(r => {
//       const div = document.createElement('div');
//       div.className = 'review';
//       div.innerHTML = `
//         <strong>${r.user_name}</strong> — рейтинг: ${r.rating} ⭐<br>
//         <em>${new Date(r.created_at).toLocaleDateString()}</em><br>
//         <p>${r.comment}</p>
//       `;
//       reviewsListElem.appendChild(div);
//     });

//     // Ініціалізувати карту, центрована на перше круте місце або місто (приблизні координати)
//     if (data.places.length > 0) {
//       initMap(data.places[0].lat, data.places[0].lon);
//     } else {
//       // Якщо крутих місць немає, ставимо центр на координати міста (тут треба заздалегідь знати)
//       initMap(50.45, 30.52); // Київ як дефолт
//     }

//   } catch (error) {
//     alert(error.message);
//   }
// }

// searchBtn.addEventListener('click', () => {
//   const city = cityInput.value.trim();
//   if (city) fetchCityData(city);
// });

// reviewForm.addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const formData = new FormData(reviewForm);
//   const payload = {
//     city: cityInput.value.trim(),
//     user_name: formData.get('user_name'),
//     rating: Number(formData.get('rating')),
//     comment: formData.get('comment')
//   };
//   try {
//     const res = await fetch('/api/city/review', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });
//     const data = await res.json();
//     if (data.success) {
//       alert('Відгук додано');
//       reviewForm.reset();
//       fetchCityData(cityInput.value.trim());
//     } else {
//       alert('Помилка додавання відгуку');
//     }
//   } catch {
//     alert('Помилка сервера');
//   }
// });
