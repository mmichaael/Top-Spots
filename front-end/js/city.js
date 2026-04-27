console.log("City page loaded.");

document.addEventListener("DOMContentLoaded", () => {

    /* ── DOM ─────────────────────────────────────────────────── */
    const placeNameEl    = document.getElementById("place-name");
    const addressEl      = document.getElementById("address");
    const ratingEl       = document.getElementById("rating");
    const reviewsSection = document.getElementById("reviews-section");
    const reviewsTrack   = document.getElementById("reviews");
    const photoSlider    = document.getElementById("photo-slider");
    const slidesWrap     = document.getElementById("slides");
    const dotWrap        = document.getElementById("dot-wrap");
    const mapEl          = document.getElementById("map");
    const nearbyList     = document.getElementById("nearby-list");
    const nearbySection  = document.getElementById("nearby-section");

    /* ── CONFIG ──────────────────────────────────────────────── */
    const PHOTO_PROXY = '/api/photo/v1';
    const PLACEHOLDER = 'https://placehold.co/800x600/111827/8b5cf6?text=%F0%9F%93%8D';

    const params      = new URLSearchParams(window.location.search);
    const placeId     = params.get("placeId");
    const initialName = params.get("name") ? decodeURIComponent(params.get("name")) : null;

    let slides = [], dots = [], slideIdx = 0, autoTimer = null;
    let photoUrls = [];
    let embedApiKey = null;

    /* ── HELPERS ─────────────────────────────────────────────── */

    /**
     * Build a proxied photo URL.
     * Rules:
     *  - Already a /api/... path   → use as-is (server handles it)
     *  - places/... (v1 name)      → /api/photo/v1?name=...
     *  - anything else (ref string)→ /api/google/photo?photoRef=...
     *  - null / undefined          → PLACEHOLDER
     */
    function buildPhotoUrl(photo, maxSize = 900) {
        if (!photo) return PLACEHOLDER;

        // Photo object from Google Places API
        if (typeof photo === 'object') {
            if (photo.url)             return buildPhotoUrl(photo.url, maxSize);
            const ref = photo.photo_reference || photo.photoReference || photo.reference;
            if (ref)                   return `/api/google/photo?photoRef=${encodeURIComponent(ref)}&maxheight=${maxSize}`;
            if (photo.name)            return `${PHOTO_PROXY}?name=${encodeURIComponent(photo.name)}&maxw=${maxSize}`;
            return PLACEHOLDER;
        }

        if (typeof photo !== 'string') return PLACEHOLDER;

        // Already our proxy path — don't double-wrap
        if (photo.startsWith('/api/')) return photo;

        // v1 name format: places/PLACE_ID/photos/PHOTO_ID
        if (photo.startsWith('places/')) {
            return `${PHOTO_PROXY}?name=${encodeURIComponent(photo)}&maxw=${maxSize}`;
        }

        // Absolute external URL — proxy through v1 url param
        if (photo.startsWith('http')) {
            return `${PHOTO_PROXY}?url=${encodeURIComponent(photo)}&maxw=${maxSize}`;
        }

        // Bare photo reference string (old Places API)
        return `/api/google/photo?photoRef=${encodeURIComponent(photo)}&maxheight=${maxSize}`;
    }

    /**
     * Set img.src with a single clean fallback to placeholder.
     * Does NOT re-proxy already-proxied paths.
     */
    function setImg(img, url, maxSize = 900) {
        const src = buildPhotoUrl(url, maxSize);
        img.src = src;
        img.addEventListener('error', function onErr() {
            img.removeEventListener('error', onErr);
            if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
        });
    }

    async function getMapsEmbedKey() {
        if (embedApiKey) return embedApiKey;
        const res = await fetch('/api/google-maps-key');
        if (!res.ok) throw new Error('Failed to load Google Maps key');
        const data = await res.json();
        embedApiKey = data.key;
        return embedApiKey;
    }

    /* ── GUARD ───────────────────────────────────────────────── */
    if (!placeId) {
        placeNameEl.textContent = "Place not specified 😢";
        document.title = "Place not found";
        return;
    }

    if (initialName && placeNameEl) {
        placeNameEl.textContent = initialName;
        document.title = initialName;
    }

    /* ── BACK BUTTON ─────────────────────────────────────────── */
    const backBtn = document.createElement('a');
    backBtn.href = '/new-main';
    backBtn.id = 'backToPublic';
    backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M15 18l-6-6 6-6"/></svg> Back`;
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
            <img id="lightbox-img" src="" alt="Full photo">
            <button id="lb-prev" class="lb-nav" aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="lb-next" class="lb-nav" aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <div id="lb-dot-wrap"></div>
        </div>
        <button id="lightbox-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>`;
    document.body.appendChild(lightbox);

    const lbImg     = document.getElementById("lightbox-img");
    const lbCounter = document.getElementById("lightbox-counter");
    const lbDotWrap = document.getElementById("lb-dot-wrap");

    function openLightbox(index) {
        lbIndex = index;
        lbDotWrap.innerHTML = "";
        lbDots = [];
        photoUrls.forEach((_, i) => {
            const d = document.createElement("button");
            d.className = "lb-dot" + (i === lbIndex ? " active" : "");
            d.setAttribute("aria-label", `Photo ${i + 1}`);
            d.onclick = () => lbGoTo(i);
            lbDotWrap.appendChild(d);
            lbDots.push(d);
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
        lbImg.classList.remove("lb-anim");
        void lbImg.offsetWidth;
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

            const name = p.displayName || "Unnamed";
            placeNameEl.textContent = name;
            placeNameEl.style.animation = "gradShift 5s ease infinite";

            if (addressEl) addressEl.textContent = p.editorialSummary?.text || p.formattedAddress || "";

            if (p.rating) {
                ratingEl.classList.remove("hidden");
                ratingEl.innerHTML = `<span class="rating-stars">${starsHTML(p.rating)}</span><span class="rating-value">${p.rating}</span><span class="rating-count">(${p.userRatingCount} reviews)</span>`;
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
            console.error("Error loading place:", e);
            placeNameEl.textContent = "Could not find this place 😟";
        }
    }

    function starsHTML(rating) {
        return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆').join('');
    }

    /* ═══════════════════════════════════════════════════════════
       PHOTO SLIDER
    ═══════════════════════════════════════════════════════════ */
    function renderPhotos(photos) {
        slidesWrap.innerHTML = "";
        dotWrap.innerHTML = "";
        slides = []; dots = []; slideIdx = 0; photoUrls = [];
        photoSlider.classList.remove("hidden");

        photos.slice(0, 10).forEach((ph, i) => {
            // Build URL once, store for lightbox
            const url = buildPhotoUrl(ph, 900);
            photoUrls.push(url);

            const slide = document.createElement("div");
            slide.className = "slide" + (i === 0 ? " active" : "");

            const img = document.createElement("img");
            img.loading = i === 0 ? "eager" : "lazy";
            img.alt = `Photo ${i + 1}`;
            img.src = url;
            img.addEventListener('error', function onErr() {
                img.removeEventListener('error', onErr);
                img.src = PLACEHOLDER;
            });
            img.style.cursor = "zoom-in";
            img.addEventListener("click", () => openLightbox(i));

            slide.appendChild(img);
            slidesWrap.appendChild(slide);
            slides.push(slide);

            const dot = document.createElement("button");
            dot.className = "dot" + (i === 0 ? " active" : "");
            dot.setAttribute("aria-label", `Photo ${i + 1}`);
            dot.onclick = () => goSlide(i);
            dotWrap.appendChild(dot);
            dots.push(dot);
        });

        const fsBtn = document.createElement("button");
        fsBtn.className = "slide-fullscreen";
        fsBtn.setAttribute("aria-label", "Open fullscreen");
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
        slides[slideIdx].classList.remove("active");
        dots[slideIdx].classList.remove("active");
        slideIdx = (i + slides.length) % slides.length;
        slides[slideIdx].classList.add("active");
        dots[slideIdx].classList.add("active");
        clearInterval(autoTimer);
        startAuto();
    }
    function startAuto() { autoTimer = setInterval(() => goSlide(slideIdx + 1), 4800); }

    /* ═══════════════════════════════════════════════════════════
       REVIEWS WITH FILTER
    ═══════════════════════════════════════════════════════════ */
    let allReviews = [];

    function renderReviewsWithFilter(reviews) {
        allReviews = reviews;
        if (!reviews.length) return;
        reviewsSection.classList.remove("hidden");

        if (!document.getElementById('review-filter-bar')) {
            const bar = document.createElement('div');
            bar.id = 'review-filter-bar';
            bar.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;padding:0 4px;';

            const cAll = reviews.length;
            const cPos = reviews.filter(r => Math.round(r.rating || 0) >= 4).length;
            const cNeg = reviews.filter(r => Math.round(r.rating || 0) <= 2).length;
            const c5   = reviews.filter(r => Math.round(r.rating || 0) === 5).length;

            bar.innerHTML = `
                <span style="font-size:12px;color:#6b6560;font-family:'Outfit',sans-serif;white-space:nowrap;">Filter:</span>
                <button class="rv-filter-btn active" data-filter="all">All (${cAll})</button>
                <button class="rv-filter-btn" data-filter="positive">👍 Positive (${cPos})</button>
                <button class="rv-filter-btn" data-filter="negative">👎 Negative (${cNeg})</button>
                <button class="rv-filter-btn" data-filter="5">⭐⭐⭐⭐⭐ 5★ (${c5})</button>`;

            if (!document.getElementById('rv-filter-style')) {
                const s = document.createElement('style');
                s.id = 'rv-filter-style';
                s.textContent = `.rv-filter-btn{padding:6px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;color:#6b6560;font-size:12px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;white-space:nowrap;} .rv-filter-btn.active,.rv-filter-btn:hover{background:rgba(201,168,76,0.15);border-color:rgba(201,168,76,0.4);color:#e8c97a;}`;
                document.head.appendChild(s);
            }

            const sectionHead = reviewsSection.querySelector('.section-head');
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
            reviewsTrack.innerHTML = `<div style="padding:40px;text-align:center;color:#6b6560;font-family:'Outfit',sans-serif;min-width:280px;"><div style="font-size:36px;margin-bottom:12px;">🔍</div><p>No reviews found for this filter</p></div>`;
            return;
        }

        filtered.forEach((r, i) => {
            const name   = r.authorAttribution?.displayName || "Guest";
            const letter = name[0]?.toUpperCase() || "?";
            const stars  = Math.round(r.rating || 0);
            const text   = typeof r.text === 'string' ? r.text : r.text?.text || "No text";
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
                        Helpful <span class="lc">0</span>
                    </button>
                </div>`;
            reviewsTrack.appendChild(card);
            card.querySelector('.rv-like')?.addEventListener('click', function() { toggleLike(this); });
        });

        bindArrows(reviewsTrack, "#reviews-section .arrow-prev", "#reviews-section .arrow-next", reviewsSection);
    }

    /* ═══════════════════════════════════════════════════════════
       NEARBY — FIXED photo loading
    ═══════════════════════════════════════════════════════════ */
    async function searchNearby(loc) {
        try {
            const res = await fetch('/api/google/nearby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude:  loc.latitude,
                    longitude: loc.longitude,
                    radius:    1500,
                    types:     ['tourist_attraction', 'park', 'museum', 'restaurant'],
                    language:  'en'
                })
            });
            const data = await res.json();
            const places = (data.places || []).filter(p => p.id !== placeId);
            if (!places.length) return;

            nearbySection.classList.remove("hidden");
            nearbyList.innerHTML = '';

            places.forEach((p, i) => {
                const name   = escHtml(p.displayName || p.name || "Place");
                const addr   = escHtml(p.formattedAddress || p.vicinity || "Nearby");
                const rating = p.rating ? `⭐ ${p.rating}` : "—";
                const type   = (p.types?.[0] || "place").replace(/_/g, " ");

                // ── KEY FIX: build photo URL correctly ──
                // p.photo_url already comes from backend as /api/google/photo?photoRef=...
                // so we use it directly — no double-wrapping
                const photoSrc = p.photo_url || PLACEHOLDER;

                const card = document.createElement('a');
                card.className = 'nearby-card';
                card.href = `city_page.html?placeId=${p.id || p.place_id}`;
                card.style.animationDelay = `${i * 0.07}s`;
                card.innerHTML = `
                    <div class="nc-img-wrap">
                        <img class="nc-img" alt="${name}" loading="lazy">
                        <div class="nc-overlay"></div>
                        <span class="nc-type">${type}</span>
                        <span class="nc-rating">${rating}</span>
                    </div>
                    <div class="nc-body">
                        <h3 class="nc-title">${name}</h3>
                        <p class="nc-addr">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${addr}
                        </p>
                        <div class="nc-cta">Details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                    </div>`;

                nearbyList.appendChild(card);

                // Set image AFTER appending so the element exists in DOM
                const img = card.querySelector('.nc-img');
                img.src = photoSrc;
                img.addEventListener('error', function onErr() {
                    img.removeEventListener('error', onErr);
                    img.src = PLACEHOLDER;
                });
            });

            bindArrows(nearbyList, "#nearby-section .arrow-prev", "#nearby-section .arrow-next", nearbySection);
        } catch (e) {
            console.error("Nearby error:", e);
        }
    }

    /* ── ARROWS ── */
    function bindArrows(track, prevSel, nextSel, ctx) {
        const prev = ctx.querySelector(prevSel) || document.querySelector(prevSel);
        const next = ctx.querySelector(nextSel) || document.querySelector(nextSel);
        if (!prev || !next) return;
        const scroll = () => track.offsetWidth * 0.72;
        prev.addEventListener("click", () => track.scrollBy({ left: -scroll(), behavior: "smooth" }));
        next.addEventListener("click", () => track.scrollBy({ left:  scroll(), behavior: "smooth" }));
        const update = () => {
            prev.classList.toggle("dim", track.scrollLeft < 20);
            next.classList.toggle("dim", track.scrollLeft + track.offsetWidth >= track.scrollWidth - 20);
        };
        track.addEventListener("scroll", update, { passive: true });
        update();
    }

    /* ── MAP ── */
    async function renderMap(lat, lng) {
        try {
            const key    = await getMapsEmbedKey();
            const locale = localStorage.getItem('topspots_locale') || 'en';
            mapEl.innerHTML = `<iframe
                src="https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=place_id:${encodeURIComponent(placeId)}&language=${encodeURIComponent(locale)}"
                width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"></iframe>`;
        } catch (err) {
            console.error('Map embed error:', err);
            mapEl.innerHTML = '<div class="map-error">Could not load map</div>';
        }
    }

    /* ── REVEAL ── */
    function initRevealObserver() {
        const io = new IntersectionObserver(entries =>
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }),
            { threshold: 0.12 }
        );
        document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    }

    /* ── UTILS ── */
    function escHtml(str) {
        return String(str)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;");
    }

    async function syncData(place, name) {
        const pid   = place.place_id || place.id || place.placeId || null;
        const photo = place.photos?.[0] ? buildPhotoUrl(place.photos[0], 800) : null;
        if (!pid) return;
        await fetch('/api/places/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                place_id:    pid,
                name,
                photo_url:   photo,
                description: place.editorialSummary?.text || place.formattedAddress,
                rating:      place.rating,
                latitude:    place.location?.latitude,
                longitude:   place.location?.longitude
            })
        }).catch(() => {});
    }

    init();
});

function toggleLike(btn) {
    const on = btn.classList.toggle("on");
    btn.querySelector(".lc").textContent =
        parseInt(btn.querySelector(".lc").textContent) + (on ? 1 : -1);
}