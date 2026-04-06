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
    const PHOTO_PROXY = '/api/photo/v1';
    const params  = new URLSearchParams(window.location.search); // ← ФІХ #params
    const placeId = params.get("placeId");
    const initialName = params.get("name") ? decodeURIComponent(params.get("name")) : null;

    let slides = [], dots = [], slideIdx = 0, autoTimer = null;
    let photoUrls = [];

    const getPhotoUrl = (photo, maxHeight = 900) => {
        if (!photo) return 'https://placehold.co/800x600/111827/8b5cf6?text=%F0%9F%93%8D';
        if (typeof photo === 'string') {
            if (photo.startsWith('http')) return photo;
            if (photo.startsWith('places/')) return `${PHOTO_PROXY}?name=${encodeURIComponent(photo)}&maxw=${maxHeight}`;
            return `/api/photo?ref=${encodeURIComponent(photo)}&maxw=${maxHeight}`;
        }
        if (photo.reference) return `/api/photo?ref=${encodeURIComponent(photo.reference)}&maxw=${maxHeight}`;
        if (photo.name) return `${PHOTO_PROXY}?name=${encodeURIComponent(photo.name)}&maxw=${maxHeight}`;
        return 'https://placehold.co/800x600/111827/8b5cf6?text=%F0%9F%93%8D';
    };

    let embedApiKey = null;
    async function getMapsEmbedKey() {
        if (embedApiKey) return embedApiKey;
        const res = await fetch('/api/google-maps-key');
        if (!res.ok) throw new Error('Не вдалося завантажити ключ Google Maps');
        const data = await res.json();
        embedApiKey = data.key;
        return embedApiKey;
    }

    if (!placeId) {
        placeNameEl.textContent = "Місце не вказано 😢";
        document.title = "Місце не знайдено";
        return;
    }

    if (initialName && placeNameEl) {
        placeNameEl.textContent = initialName;
        document.title = initialName;
    }

    /* ── #6: Кнопка "Назад" ── */
    const backBtn = document.createElement('a');
backBtn.href = '/new-main';
    backBtn.id = 'backToPublic';
    backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M15 18l-6-6 6-6"/></svg> Назад`;
    backBtn.style.cssText = `position:fixed;top:20px;left:20px;z-index:9999;display:flex;align-items:center;gap:6px;padding:10px 18px;background:rgba(5,8,15,0.85);border:1px solid rgba(201,168,76,0.3);border-radius:40px;color:#e8c97a;font-size:13px;font-weight:600;text-decoration:none;backdrop-filter:blur(12px);font-family:'Outfit',sans-serif;transition:all .25s;`;
    backBtn.addEventListener('mouseover', () => { backBtn.style.borderColor='rgba(201,168,76,0.7)'; backBtn.style.background='rgba(5,8,15,0.95)'; });
    backBtn.addEventListener('mouseout',  () => { backBtn.style.borderColor='rgba(201,168,76,0.3)'; backBtn.style.background='rgba(5,8,15,0.85)'; });
    document.body.appendChild(backBtn);

    /* ═══════════════════════════════════════════════════════════
       LIGHTBOX
    ═══════════════════════════════════════════════════════════ */
    let lbIndex = 0, lbDots = [];

    const lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.innerHTML = `
        <div id="lightbox-inner">
            <span id="lightbox-counter"></span>
            <img id="lightbox-img" src="" alt="Повне фото">
            <button id="lb-prev" class="lb-nav" aria-label="Попереднє">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="lb-next" class="lb-nav" aria-label="Наступне">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <div id="lb-dot-wrap"></div>
        </div>
        <button id="lightbox-close" aria-label="Закрити">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>`;
    document.body.appendChild(lightbox);

    const lbImg     = document.getElementById("lightbox-img");
    const lbCounter = document.getElementById("lightbox-counter");
    const lbDotWrap = document.getElementById("lb-dot-wrap");

    function openLightbox(index) {
        lbIndex = index; lbDotWrap.innerHTML = ""; lbDots = [];
        photoUrls.forEach((_, i) => {
            const d = document.createElement("button");
            d.className = "lb-dot" + (i === lbIndex ? " active" : "");
            d.setAttribute("aria-label", `Фото ${i + 1}`);
            d.onclick = () => lbGoTo(i);
            lbDotWrap.appendChild(d); lbDots.push(d);
        });
        lbShowPhoto(lbIndex, false);
        lightbox.classList.add("open");
        document.body.classList.add("lb-open");
    }
    function closeLightbox() { lightbox.classList.remove("open"); document.body.classList.remove("lb-open"); }
    function lbGoTo(i) {
        lbDots[lbIndex]?.classList.remove("active");
        lbIndex = (i + photoUrls.length) % photoUrls.length;
        lbDots[lbIndex]?.classList.add("active");
        lbShowPhoto(lbIndex, true);
    }
    function lbShowPhoto(i, animate) {
        lbImg.classList.remove("lb-anim"); void lbImg.offsetWidth;
        if (animate) lbImg.classList.add("lb-anim");
        lbImg.src = photoUrls[i];
        lbCounter.textContent = `${i + 1} / ${photoUrls.length}`;
    }

    document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => { if (e.target === lightbox || e.target.id === "lightbox-inner") closeLightbox(); });
    document.getElementById("lb-prev").addEventListener("click", e => { e.stopPropagation(); lbGoTo(lbIndex - 1); });
    document.getElementById("lb-next").addEventListener("click", e => { e.stopPropagation(); lbGoTo(lbIndex + 1); });
    document.addEventListener("keydown", e => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape")     closeLightbox();
        if (e.key === "ArrowLeft")  lbGoTo(lbIndex - 1);
        if (e.key === "ArrowRight") lbGoTo(lbIndex + 1);
    });
    let lbSx = 0;
    lbImg.addEventListener("touchstart", e => lbSx = e.touches[0].clientX, { passive: true });
    lbImg.addEventListener("touchend",   e => { const d = lbSx - e.changedTouches[0].clientX; if (Math.abs(d) > 40) lbGoTo(lbIndex + (d > 0 ? 1 : -1)); });

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
            const res = await fetch(`/api/google/place/${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error("Google proxy error");
            const p = await res.json();

            const name = p.displayName || "Без назви";
            placeNameEl.textContent = name;
            placeNameEl.style.animation = "gradShift 5s ease infinite";

            if (addressEl) addressEl.textContent = p.editorialSummary?.text || p.formattedAddress || "";

            if (p.rating) {
                ratingEl.classList.remove("hidden");
                ratingEl.innerHTML = `<span class="rating-stars">${starsHTML(p.rating)}</span><span class="rating-value">${p.rating}</span><span class="rating-count">(${p.userRatingCount} відгуків)</span>`;
            }

            if (p.photos?.length)  renderPhotos(p.photos);
            if (p.reviews?.length) renderReviewsWithFilter(p.reviews);
            if (p.location) {
                await renderMap(p.location.latitude, p.location.longitude);
                searchNearby(p.location);
            }
            syncData(p, name);
            initRevealObserver();

        } catch (e) {
            console.error("🚨", e);
            placeNameEl.textContent = "Не вдалося знайти місце 😟";
        }
    }

    function starsHTML(rating) {
        return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆').join('');
    }

    /* ═══════════════════════════════════════════════════════════
       ФОТО-СЛАЙДЕР
    ═══════════════════════════════════════════════════════════ */
    function renderPhotos(photos) {
        slidesWrap.innerHTML = ""; dotWrap.innerHTML = "";
        slides = []; dots = []; slideIdx = 0; photoUrls = [];
        photoSlider.classList.remove("hidden");

        photos.slice(0, 10).forEach((ph, i) => {
            const url = ph.url || getPhotoUrl(ph, 900);
            photoUrls.push(url);
            const slide = document.createElement("div");
            slide.className = "slide" + (i === 0 ? " active" : "");
            const img = document.createElement("img");
            img.src = url; img.alt = `Фото ${i + 1}`; img.loading = i === 0 ? "eager" : "lazy";
            img.style.cursor = "zoom-in";
            img.addEventListener("click", () => openLightbox(i));
            slide.appendChild(img); slidesWrap.appendChild(slide); slides.push(slide);

            const dot = document.createElement("button");
            dot.className = "dot" + (i === 0 ? " active" : "");
            dot.setAttribute("aria-label", `Фото ${i + 1}`);
            dot.onclick = () => goSlide(i);
            dotWrap.appendChild(dot); dots.push(dot);
        });

        const fsBtn = document.createElement("button");
        fsBtn.className = "slide-fullscreen";
        fsBtn.setAttribute("aria-label", "Відкрити на весь екран");
        fsBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
        fsBtn.addEventListener("click", () => openLightbox(slideIdx));
        photoSlider.appendChild(fsBtn);

        photoSlider.querySelector(".slide-prev")?.addEventListener("click", () => goSlide(slideIdx - 1));
        photoSlider.querySelector(".slide-next")?.addEventListener("click", () => goSlide(slideIdx + 1));

        let sx = 0;
        slidesWrap.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
        slidesWrap.addEventListener("touchend",   e => { const d = sx - e.changedTouches[0].clientX; if (Math.abs(d) > 45) goSlide(slideIdx + (d > 0 ? 1 : -1)); });
        startAuto();
    }

    function goSlide(i) {
        slides[slideIdx].classList.remove("active"); dots[slideIdx].classList.remove("active");
        slideIdx = (i + slides.length) % slides.length;
        slides[slideIdx].classList.add("active"); dots[slideIdx].classList.add("active");
        clearInterval(autoTimer); startAuto();
    }
    function startAuto() { autoTimer = setInterval(() => goSlide(slideIdx + 1), 4800); }

    /* ═══════════════════════════════════════════════════════════
       #2: ВІДГУКИ З ФІЛЬТРОМ
    ═══════════════════════════════════════════════════════════ */
    let allReviews = [];

    function renderReviewsWithFilter(reviews) {
        allReviews = reviews;
        if (!reviews.length) return;
        reviewsSection.classList.remove("hidden");

        if (!document.getElementById('review-filter-bar')) {
            const sectionHead = reviewsSection.querySelector('.section-head');
            const bar = document.createElement('div');
            bar.id = 'review-filter-bar';
            bar.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;padding:0 4px;';

            const cAll = reviews.length;
            const cPos = reviews.filter(r => Math.round(r.rating || 0) >= 4).length;
            const cNeg = reviews.filter(r => Math.round(r.rating || 0) <= 2).length;
            const c5   = reviews.filter(r => Math.round(r.rating || 0) === 5).length;

            bar.innerHTML = `
                <span style="font-size:12px;color:#6b6560;font-family:'Outfit',sans-serif;white-space:nowrap;">Фільтр:</span>
                <button class="rv-filter-btn active" data-filter="all">Всі (${cAll})</button>
                <button class="rv-filter-btn" data-filter="positive">👍 Позитивні (${cPos})</button>
                <button class="rv-filter-btn" data-filter="negative">👎 Негативні (${cNeg})</button>
                <button class="rv-filter-btn" data-filter="5">⭐⭐⭐⭐⭐ 5★ (${c5})</button>`;

            // Інжектимо стилі один раз
            if (!document.getElementById('rv-filter-style')) {
                const s = document.createElement('style');
                s.id = 'rv-filter-style';
                s.textContent = `.rv-filter-btn{padding:6px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;color:#6b6560;font-size:12px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;white-space:nowrap;} .rv-filter-btn.active,.rv-filter-btn:hover{background:rgba(201,168,76,0.15);border-color:rgba(201,168,76,0.4);color:#e8c97a;}`;
                document.head.appendChild(s);
            }

            reviewsSection.insertBefore(bar, sectionHead);

            bar.querySelectorAll('.rv-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    bar.querySelectorAll('.rv-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyReviewFilter(btn.dataset.filter);
                });
            });
        }

        applyReviewFilter('all');
    }

    function applyReviewFilter(filter) {
        let filtered = allReviews;
        if      (filter === 'positive') filtered = allReviews.filter(r => Math.round(r.rating || 0) >= 4);
        else if (filter === 'negative') filtered = allReviews.filter(r => Math.round(r.rating || 0) <= 2);
        else if (filter === '5')        filtered = allReviews.filter(r => Math.round(r.rating || 0) === 5);

        reviewsTrack.innerHTML = '';

        if (!filtered.length) {
            reviewsTrack.innerHTML = `<div style="padding:40px;text-align:center;color:#6b6560;font-family:'Outfit',sans-serif;min-width:280px;"><div style="font-size:36px;margin-bottom:12px;">🔍</div><p>Відгуків з таким фільтром не знайдено</p></div>`;
            return;
        }

        filtered.forEach((r, i) => {
            const name   = r.authorAttribution?.displayName || "Гість";
            const letter = name[0]?.toUpperCase() || "?";
            const stars  = Math.round(r.rating || 0);
            const text   = typeof r.text === 'string' ? r.text : r.text?.text || "Без тексту";
            const date   = r.relativePublishTimeDescription || "";
            const card   = document.createElement("div");
            card.className = "review-card";
            card.style.animationDelay = `${i * 0.08}s`;
            card.innerHTML = `
                <div class="rv-header">
                    <div class="review-avatar">${letter}</div>
                    <div class="rv-meta"><span class="rv-name">${escHtml(name)}</span><span class="rv-date">${date}</span></div>
                    <div class="rv-stars">${Array.from({length:5},(_,idx)=>`<span class="${idx<stars?'on':''}">${idx<stars?'★':'☆'}</span>`).join('')}</div>
                </div>
                <p class="rv-body">${escHtml(text)}</p>
                <div class="rv-foot">
                    <button class="rv-like">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                        Корисно <span class="lc">0</span>
                    </button>
                </div>`;
            reviewsTrack.appendChild(card);
            const likeBtn = card.querySelector('.rv-like');
            if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(likeBtn));
        });

        bindArrows(reviewsTrack, "#reviews-section .arrow-prev", "#reviews-section .arrow-next", reviewsSection);
    }

    /* ═══════════════════════════════════════════════════════════
       NEARBY
    ═══════════════════════════════════════════════════════════ */
    async function searchNearby(loc) {
        try {
            const res = await fetch('/api/google/nearby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    radius: 1500,
                    types: ['tourist_attraction', 'park', 'museum', 'restaurant']
                })
            });
            const data = await res.json();
            if (!data.places) return;
            nearbySection.classList.remove("hidden");
            nearbyList.innerHTML = data.places.filter(p => p.id !== placeId).map((p, i) => {
                const name   = p.displayName || "Місце";
                const addr   = p.formattedAddress || "Поряд з вами";
                const rating = p.rating ? `⭐ ${p.rating}` : "—";
                const type   = (p.types?.[0] || "місце").replace(/_/g," ");
                const photo  = p.photos?.[0] ? getPhotoUrl(p.photos[0], 500) : 'https://placehold.co/400x300/111827/8b5cf6?text=%F0%9F%93%8D';
                return `<a class="nearby-card" href="city_page.html?placeId=${p.id}" style="animation-delay:${i*.07}s"><div class="nc-img-wrap"><img class="nc-img" src="${photo}" alt="${escHtml(name)}" loading="lazy"><div class="nc-overlay"></div><span class="nc-type">${type}</span><span class="nc-rating">${rating}</span></div><div class="nc-body"><h3 class="nc-title">${escHtml(name)}</h3><p class="nc-addr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escHtml(addr)}</p><div class="nc-cta">Детальніше <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div></a>`;
            }).join('');
            nearbyList.querySelectorAll('img').forEach(img => {
                img.addEventListener('error', () => {
                    img.src = 'https://placehold.co/400x300/111827/8b5cf6?text=📍';
                });
            });
            bindArrows(nearbyList, "#nearby-section .arrow-prev", "#nearby-section .arrow-next", nearbySection);
        } catch (e) { console.error("Nearby error:", e); }
    }

    /* ── СТРІЛКИ ── */
    function bindArrows(track, prevSel, nextSel, ctx) {
        const prev = ctx.querySelector(prevSel) || document.querySelector(prevSel);
        const next = ctx.querySelector(nextSel) || document.querySelector(nextSel);
        if (!prev || !next) return;
        const scroll = () => track.offsetWidth * 0.72;
        prev.addEventListener("click", () => track.scrollBy({ left: -scroll(), behavior: "smooth" }));
        next.addEventListener("click", () => track.scrollBy({ left:  scroll(), behavior: "smooth" }));
        const update = () => { prev.classList.toggle("dim", track.scrollLeft < 20); next.classList.toggle("dim", track.scrollLeft + track.offsetWidth >= track.scrollWidth - 20); };
        track.addEventListener("scroll", update, { passive: true }); update();
    }

    /* ── КАРТА ── */
    async function renderMap(lat, lng) {
        try {
            const key = await getMapsEmbedKey();
            mapEl.innerHTML = `<iframe src="https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=place_id:${encodeURIComponent(placeId)}&language=uk" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
        } catch (err) {
            console.error('Map embed error:', err);
            mapEl.innerHTML = '<div class="map-error">Не вдалося завантажити карту</div>';
        }
    }

    /* ── REVEAL ── */
    function initRevealObserver() {
        const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }), { threshold: 0.12 });
        document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    }

    /* ── УТИЛІТИ ── */
    function escHtml(str) { return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

    async function syncData(place, name) {
        const photo = place.photos?.[0] ? getPhotoUrl(place.photos[0].name, 800) : null;
        await fetch('/api/places/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                place_id: place.id,
                name,
                photo_url: photo,
                description: place.editorialSummary?.text || place.formattedAddress,
                rating: place.rating,
                latitude: place.location?.latitude,
                longitude: place.location?.longitude
            })
        }).catch(() => {});
    }

    init();
});

function toggleLike(btn) {
    const on = btn.classList.toggle("on");
    btn.querySelector(".lc").textContent = parseInt(btn.querySelector(".lc").textContent) + (on ? 1 : -1);
}