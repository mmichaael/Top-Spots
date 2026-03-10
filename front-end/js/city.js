console.log("📄 Сторінка міста завантажена.");

document.addEventListener("DOMContentLoaded", () => {

    /* ── DOM ─────────────────────────────────────────────────── */
    const placeNameEl   = document.getElementById("place-name");
    const addressEl     = document.getElementById("address");
    const ratingEl      = document.getElementById("rating");
    const reviewsSection= document.getElementById("reviews-section");
    const reviewsTrack  = document.getElementById("reviews");
    const photoSlider   = document.getElementById("photo-slider");
    const slidesWrap    = document.getElementById("slides");
    const dotWrap       = document.getElementById("dot-wrap");
    const mapEl         = document.getElementById("map");
    const nearbyList    = document.getElementById("nearby-list");
    const nearbySection = document.getElementById("nearby-section");

    /* ── КОНФІГ ──────────────────────────────────────────────── */
    const apiKey  = "AIzaSyDQ6nB5ryXqJX58_A421J6Oqw1cbl6g6qk";
    const params  = new URLSearchParams(window.location.search);
    const placeId = params.get("placeId");

    let slides = [], dots = [], slideIdx = 0, autoTimer = null;

    if (!placeId) { placeNameEl.textContent = "Місце не вказано 😢"; return; }

    /* ═══════════════════════════════════════════════════════════
       INIT
    ═══════════════════════════════════════════════════════════ */
    async function init() {
        try { await fetch(`/api/places/${placeId}`); } catch (_) {}
        await loadFromGoogle(placeId);
    }

    /* ═══════════════════════════════════════════════════════════
       GOOGLE API
    ═══════════════════════════════════════════════════════════ */
    async function loadFromGoogle(id) {
        try {
            const res = await fetch(
                `https://places.googleapis.com/v1/places/${id}?key=${apiKey}&languageCode=uk`,
                { headers: { 'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,photos,reviews,editorialSummary' } }
            );
            if (!res.ok) throw new Error("Google API error");
            const p = await res.json();

            const name = p.displayName?.text || "Без назви";
            placeNameEl.textContent = name;
            placeNameEl.style.animation = "gradShift 5s ease infinite";

            if (addressEl) addressEl.textContent = p.editorialSummary?.text || p.formattedAddress || "";

            if (p.rating) {
                ratingEl.classList.remove("hidden");
                ratingEl.innerHTML =
                    `<span class="rating-stars">${starsHTML(p.rating)}</span>
                     <span class="rating-value">${p.rating}</span>
                     <span class="rating-count">(${p.userRatingCount} відгуків)</span>`;
            }

            if (p.photos?.length)   renderPhotos(p.photos);
            if (p.reviews?.length)  renderReviews(p.reviews);
            if (p.location) {
                renderMap(p.location.latitude, p.location.longitude);
                searchNearby(p.location);
            }
            syncData(p, name);
            initRevealObserver();

        } catch (e) {
            console.error("🚨", e);
            placeNameEl.textContent = "Не вдалося знайти місце 😟";
        }
    }

    /* ── ЗІРКИ ───────────────────────────────────────────────── */
    function starsHTML(rating) {
        return Array.from({length:5}, (_,i) =>
            i < Math.round(rating) ? '★' : '☆'
        ).join('');
    }

    /* ═══════════════════════════════════════════════════════════
       ФОТО-СЛАЙДЕР
    ═══════════════════════════════════════════════════════════ */
    function renderPhotos(photos) {
        slidesWrap.innerHTML = ""; dotWrap.innerHTML = "";
        slides = []; dots = []; slideIdx = 0;
        photoSlider.classList.remove("hidden");

        photos.slice(0, 10).forEach((ph, i) => {
            const slide = document.createElement("div");
            slide.className = "slide" + (i === 0 ? " active" : "");
            const img = document.createElement("img");
            img.src = `https://places.googleapis.com/v1/${ph.name}/media?maxHeightPx=900&key=${apiKey}`;
            img.alt = `Фото ${i+1}`; img.loading = i === 0 ? "eager" : "lazy";
            slide.appendChild(img); slidesWrap.appendChild(slide); slides.push(slide);

            const dot = document.createElement("button");
            dot.className = "dot" + (i === 0 ? " active" : "");
            dot.setAttribute("aria-label", `Фото ${i+1}`);
            dot.onclick = () => goSlide(i);
            dotWrap.appendChild(dot); dots.push(dot);
        });

        // Кнопки
        photoSlider.querySelector(".slide-prev")?.addEventListener("click", () => goSlide(slideIdx - 1));
        photoSlider.querySelector(".slide-next")?.addEventListener("click", () => goSlide(slideIdx + 1));

        // Свайп
        let sx = 0;
        slidesWrap.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
        slidesWrap.addEventListener("touchend",   e => {
            const d = sx - e.changedTouches[0].clientX;
            if (Math.abs(d) > 45) goSlide(slideIdx + (d > 0 ? 1 : -1));
        });

        startAuto();
    }

    function goSlide(i) {
        slides[slideIdx].classList.remove("active");
        dots[slideIdx].classList.remove("active");
        slideIdx = (i + slides.length) % slides.length;
        slides[slideIdx].classList.add("active");
        dots[slideIdx].classList.add("active");
        clearInterval(autoTimer); startAuto();
    }
    function startAuto() {
        autoTimer = setInterval(() => goSlide(slideIdx + 1), 4800);
    }

    /* ═══════════════════════════════════════════════════════════
       ВІДГУКИ
    ═══════════════════════════════════════════════════════════ */
    function renderReviews(reviews) {
        reviewsTrack.innerHTML = "";
        if (!reviews.length) return;
        reviewsSection.classList.remove("hidden");

        reviews.forEach((r, i) => {
            const name   = r.authorAttribution?.displayName || "Гість";
            const letter = name[0]?.toUpperCase() || "?";
            const stars  = Math.round(r.rating || 0);
            const text   = r.text?.text || "Без тексту";
            const date   = r.relativePublishTimeDescription || "";

            const card = document.createElement("div");
            card.className = "review-card";
            card.style.animationDelay = `${i * 0.08}s`;
            card.innerHTML = `
                <div class="rv-header">
                    <div class="review-avatar">${letter}</div>
                    <div class="rv-meta">
                        <span class="rv-name">${escHtml(name)}</span>
                        <span class="rv-date">${date}</span>
                    </div>
                    <div class="rv-stars">
                        ${Array.from({length:5},(_,idx)=>`<span class="${idx<stars?'on':''}">${idx<stars?'★':'☆'}</span>`).join('')}
                    </div>
                </div>
                <p class="rv-body">${escHtml(text)}</p>
                <div class="rv-foot">
                    <button class="rv-like" onclick="toggleLike(this)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        Корисно <span class="lc">0</span>
                    </button>
                </div>
            `;
            reviewsTrack.appendChild(card);
        });

        bindArrows(reviewsTrack, "#reviews-section .arrow-prev", "#reviews-section .arrow-next", reviewsSection);
    }

    /* ═══════════════════════════════════════════════════════════
       NEARBY
    ═══════════════════════════════════════════════════════════ */
    async function searchNearby(loc) {
        try {
            const res = await fetch(`https://places.googleapis.com/v1/places:searchNearby?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.photos,places.formattedAddress,places.types"
                },
                body: JSON.stringify({
                    includedTypes: ["tourist_attraction","park","museum","restaurant"],
                    maxResultCount: 9,
                    locationRestriction: {
                        circle: { center: { latitude: loc.latitude, longitude: loc.longitude }, radius: 1500 }
                    }
                })
            });
            const data = await res.json();
            if (!data.places) return;
            nearbySection.classList.remove("hidden");

            nearbyList.innerHTML = data.places
                .filter(p => p.id !== placeId)
                .map((p, i) => {
                    const name   = p.displayName?.text || "Місце";
                    const addr   = p.formattedAddress || "Поряд з вами";
                    const rating = p.rating ? `⭐ ${p.rating}` : "—";
                    const type   = (p.types?.[0] || "місце").replace(/_/g," ");
                    const photo  = p.photos?.[0]
                        ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=500&key=${apiKey}`
                        : `https://placehold.co/400x300/111827/8b5cf6?text=%F0%9F%93%8D`;

                    return `
                    <a class="nearby-card" href="city_page.html?placeId=${p.id}" style="animation-delay:${i*.07}s">
                        <div class="nc-img-wrap">
                            <img class="nc-img" src="${photo}" alt="${escHtml(name)}" loading="lazy"
                                 onerror="this.src='https://placehold.co/400x300/111827/8b5cf6?text=📍'">
                            <div class="nc-overlay"></div>
                            <span class="nc-type">${type}</span>
                            <span class="nc-rating">${rating}</span>
                        </div>
                        <div class="nc-body">
                            <h3 class="nc-title">${escHtml(name)}</h3>
                            <p class="nc-addr">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                ${escHtml(addr)}
                            </p>
                            <div class="nc-cta">
                                Детальніше
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </div>
                        </div>
                    </a>`;
                }).join('');

            bindArrows(nearbyList, "#nearby-section .arrow-prev", "#nearby-section .arrow-next", nearbySection);

        } catch (e) { console.error("Nearby error:", e); }
    }

    /* ═══════════════════════════════════════════════════════════
       СТРІЛКИ СКРОЛУ
    ═══════════════════════════════════════════════════════════ */
    function bindArrows(track, prevSel, nextSel, ctx) {
        const prev = ctx.querySelector(prevSel) || document.querySelector(prevSel);
        const next = ctx.querySelector(nextSel) || document.querySelector(nextSel);
        if (!prev || !next) return;

        const scroll = () => track.offsetWidth * 0.72;
        prev.addEventListener("click", () => track.scrollBy({ left: -scroll(), behavior: "smooth" }));
        next.addEventListener("click", () => track.scrollBy({ left:  scroll(), behavior: "smooth" }));

        const update = () => {
            const atStart = track.scrollLeft < 20;
            const atEnd   = track.scrollLeft + track.offsetWidth >= track.scrollWidth - 20;
            prev.classList.toggle("dim", atStart);
            next.classList.toggle("dim", atEnd);
        };
        track.addEventListener("scroll", update, { passive: true });
        update();
    }

    /* ═══════════════════════════════════════════════════════════
       КАРТА
    ═══════════════════════════════════════════════════════════ */
    function renderMap(lat, lng) {
        const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}&language=uk`;
        mapEl.innerHTML = `<iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    }

    /* ═══════════════════════════════════════════════════════════
       REVEAL OBSERVER
    ═══════════════════════════════════════════════════════════ */
    function initRevealObserver() {
        const io = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }),
            { threshold: 0.12 }
        );
        document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    }

    /* ═══════════════════════════════════════════════════════════
       УТИЛІТИ
    ═══════════════════════════════════════════════════════════ */
    function escHtml(str) {
        return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    async function syncData(place, name) {
        const photo = place.photos?.[0]
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=800&key=${apiKey}`
            : null;
        await fetch('/api/places/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                place_id: place.id, name, photo_url: photo,
                description: place.editorialSummary?.text || place.formattedAddress,
                rating: place.rating,
                latitude: place.location?.latitude,
                longitude: place.location?.longitude
            })
        }).catch(() => {});
    }

    init();
});

/* ── ГЛОБАЛЬНО: like-toggle ── */
function toggleLike(btn) {
    const on  = btn.classList.toggle("on");
    const lc  = btn.querySelector(".lc");
    lc.textContent = parseInt(lc.textContent) + (on ? 1 : -1);
}