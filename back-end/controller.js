const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const pool = require('./database');
const passport = require('passport');
const { default: axios } = require('axios');
const NodeCache = require("node-cache");
const OpenAI = require("openai");
const https = require('https');
const fs = require('fs');
const multer = require('multer');
const { LRUCache } = require('lru-cache'); 


 require('dotenv').config({ path: path.resolve(__dirname, './privateInf.env') });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
           
const CACHE_TTL_DAYS = 7; 

 const GroqClient = {
    apiKey:  process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1/chat/completions',
    async chat(systemPrompt, userMessage) {
        if (!this.apiKey) throw new Error('GROQ_API_KEY not set');
        const r = await axios.post(this.baseURL, {
            model: 'mixtral-8x7b-32768',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userMessage  },
            ],
            temperature: 0.55,
            max_tokens:  300,
        }, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });
        return r.data.choices[0].message.content;
    }
};
 
const TogetherAIClient = {
    apiKey:  process.env.TOGETHER_AI_API_KEY,
    baseURL: 'https://api.together.xyz/v1/chat/completions',
    async chat(systemPrompt, userMessage) {
        if (!this.apiKey) throw new Error('TOGETHER_AI_API_KEY not set');
        const r = await axios.post(this.baseURL, {
            model: 'mistralai/Mistral-7B-Instruct-v0.1',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userMessage  },
            ],
            temperature: 0.55,
            max_tokens:  300,
        }, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });
        return r.data.choices[0].message.content;
    }
};
 
const HuggingFaceClient = {
    apiKey:  process.env.HUGGINGFACE_API_KEY,
    baseURL: 'https://api-inference.huggingface.co/models',
    async chat(systemPrompt, userMessage) {
        if (!this.apiKey) throw new Error('HUGGINGFACE_API_KEY not set');
        const modelId = 'mistralai/Mistral-7B-Instruct-v0.1';
        const r = await axios.post(`${this.baseURL}/${modelId}`, {
            inputs: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
            parameters: { max_new_tokens: 300, temperature: 0.55, top_p: 0.95 }
        }, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });
        if (Array.isArray(r.data) && r.data[0]?.generated_text) {
            let text = r.data[0].generated_text;
            const idx = text.indexOf('Assistant:');
            if (idx !== -1) text = text.slice(idx + 10);
            return text.trim();
        }
        throw new Error('Unexpected HF response format');
    }
};
 
// ── Ліміти (free tier) ───────────────────────────────────────
const _aiLimits = {
    openai:      100,
    groq:        1400,
    together:    200,
    huggingface: 500,
};
 
// ── Перевірка ліміту з БД ────────────────────────────────────

async function _aiAvailable(provider) {
    try {
        // Якщо reset_at вже минув — скидаємо лічильник
        await pool.query(
            `UPDATE "AIUsage"
             SET count = 0, reset_at = NOW() + INTERVAL '1 day'
             WHERE provider = $1 AND reset_at < NOW()`,
            [provider]
        );
        const row = await pool.query(
            `SELECT count FROM "AIUsage" WHERE provider = $1`,
            [provider]
        );
        if (!row.rows.length) return true; // якщо запис не існує — дозволяємо
        return row.rows[0].count < _aiLimits[provider];
    } catch (e) {
        console.warn(`[AI] _aiAvailable DB error (${provider}):`, e.message);
        return true; // при помилці БД — дозволяємо спробу
    }
}
 
// ── Збільшити лічильник в БД ─────────────────────────────────
async function _aiTick(provider) {
    try {
        const result = await pool.query(
            `UPDATE "AIUsage"
             SET count = count + 1
             WHERE provider = $1
             RETURNING count`,
            [provider]
        );
        const count = result.rows[0]?.count ?? '?';
        console.log(`[AI] ${provider.toUpperCase()} used: ${count}/${_aiLimits[provider]}`);
    } catch (e) {
        console.warn(`[AI] _aiTick DB error (${provider}):`, e.message);
    }
}
 
// ── Fallback ланцюг: OpenAI → Groq → Together → HuggingFace ─
async function askAI(systemPrompt, userMessage) {
    const providers = [
        {
            name: 'openai',
            async call() {
                const r = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user',   content: userMessage  },
                    ],
                    temperature: 0.55,
                    max_tokens:  300,
                });
                return r.choices[0].message.content;
            }
        },
        {
            name: 'groq',
            async call() { return GroqClient.chat(systemPrompt, userMessage); }
        },
        {
            name: 'together',
            async call() { return TogetherAIClient.chat(systemPrompt, userMessage); }
        },
        {
            name: 'huggingface',
            async call() { return HuggingFaceClient.chat(systemPrompt, userMessage); }
        },
    ];
 
    for (const provider of providers) {
        const available = await _aiAvailable(provider.name);
        if (!available) {
            console.log(`[AI] ${provider.name} — денний ліміт вичерпано, переходимо далі`);
            continue;
        }
        try {
            await _aiTick(provider.name);
            const reply = await provider.call();
            console.log(`[AI] ✅ ${provider.name}`);
            return { reply, model: provider.name };
        } catch (err) {
            console.warn(`[AI] ❌ ${provider.name}: ${err.message}`);
            // Продовжуємо до наступного провайдера
        }
    }
 
    throw new Error('ALL_PROVIDERS_FAILED');
}

class Controller {
     pageBaseMain = path.join(__dirname, '../front-end/html/index.html');
    pageFullMain = path.join(__dirname, '../front-end/html/logged_index.html');
    pageError    = path.join(__dirname, '../front-end/html/error.html');
    pageAuth     = path.join(__dirname, '../front-end/html/authentication.html');
    pageEmailConfirmation = path.join(__dirname, '../front-end/html/email_confirmation.html');
    pageResetPasswordEnterPage = path.join(__dirname, '../front-end/html/reset_password.html');
 
  
 
    constructor() {
        // LRU кеш: 500 відповідей, TTL 30 хвилин
        this.chatCache = new LRUCache({ max: 500, ttl: 1_800_000 });
    }
 
    hashToken = (token) => {
        return crypto.createHash('sha3-256').update(token).digest('hex');
    };
 


geocodeReverse = async (req, res) => {
       try {
           const { lat, lon } = req.query;
           if (!lat || !lon) {
               return res.status(400).json({ error: 'Missing lat/lon' });
           }
           res.json({ city: 'your area', lat, lon });
       } catch (err) {
           res.status(500).json({ error: 'Geocode error' });
       }
   };


 requireAuth = (req, res, next) => {
        try {
            // Попробуй из cookies (основной способ)
            const accessToken = req.cookies.accessToken;
            
            // Если в cookies нет, попробуй из Authorization header
            const headerToken = (() => {
                const header = req.headers.authorization || '';
                return header.startsWith('Bearer ') ? header.slice(7) : null;
            })();
            
            const token = accessToken || headerToken;
            
            if (!token) {
                console.log('[AUTH] ❌ No token found (cookies or header)');
                return res.status(401).json({ error: 'Unauthorized' });
            }
 
            jwt.verify(
                token,
                process.env.ACCESSJWTTOKEN,
                (err, decoded) => {
                    if (err) {
                        console.log('[AUTH] ❌ Token verification failed:', err.message);
                        return res.status(401).json({ error: 'Invalid or expired token' });
                    }
                    
          
                    req.user = decoded;
                    req.username = decoded.username;
                    req.email = decoded.email;
                    req.user_id = decoded.user_id || decoded.id;
                    
                    console.log('[AUTH] ✅ Token verified for user:', decoded.username || decoded.email);
                    next();
                }
            );
        } catch (err) {
            console.error('[AUTH] Exception during token verification:', err.message);
            return res.status(500).json({ error: 'Server error' });
        }
    };
 
 
 
    _buildSystemPrompt(searchHistory = [], context = {}) {
        const { userCity, recentMessages } = context;
 
        // Персоналізована геолокація
        const locationLine = userCity
            ? `\nUser's current city: ${userCity}. Prioritise recommendations in or near ${userCity}.`
            : '';
 
        // Остання пошукова активність
        const searchLine = searchHistory.length
            ? `\nUser's recent searches on Top-Spots: ${searchHistory.map(h => `"${h.query_text}" (${h.category || 'general'})`).join('; ')}.`
            : '';
 
        // Контекст попередніх повідомлень чату
        const contextLine = recentMessages
            ? `\n\nConversation so far:\n${recentMessages}`
            : '';
 
        return `You are a friendly, knowledgeable travel concierge for Top-Spots — a premium tourism platform.
${locationLine}${searchLine}
 
PERSONALITY RULES (follow strictly):
- Use 1–2 relevant emojis per message to feel alive and warm (not robotic)
- NEVER start with "Hi!", "Hello!", "Привіт!" or any greeting — the user already knows you
- Continue naturally from the conversation context, as if you remember everything
- Be concise: max 3 short paragraphs
- If the user mentions food/drink preferences, remember and reference them
- If you know the user's city, give specific local recommendations
- Always end with one concrete actionable suggestion
- Reply in the same language as the user's message
- Never mention that you have search history or location data${contextLine}`;
    }
 
chatAssistant = async (req, res) => {
        try {
            const { message, context = {} } = req.body;
            if (!message?.trim()) {
                return res.status(400).json({ error: 'Введи повідомлення' });
            }

            const userId   = req.user?.id || req.user?.user_id || null;
            const rawKey   = `${userId || 'anon'}::${message.trim().toLowerCase()}`;
            const cacheKey = crypto.createHash('md5').update(rawKey).digest('hex');
 
            // ── 1. DB Cache ───────────────────────────────────
            const hasContext = !!context?.recentMessages;
            if (!hasContext) {
                try {
                    const dbRow = await pool.query(
                        `SELECT reply, model FROM "ChatCache" WHERE cache_key = $1 LIMIT 1`,
                        [cacheKey]
                    );
                    if (dbRow.rows.length) {
                        console.log('[AI] DB cache HIT');
                        pool.query(
                            `UPDATE "ChatCache" SET hits = hits + 1 WHERE cache_key = $1`,
                            [cacheKey]
                        ).catch(() => {});
                        return res.status(200).json({
                            reply:  dbRow.rows[0].reply,
                            model:  dbRow.rows[0].model,
                            cached: true,
                        });
                    }
                } catch (e) {
                    console.warn('[AI] DB cache error:', e.message);
                }
 
                // ── 2. LRU ────────────────────────────────────
                const lruHit = this.chatCache.get(cacheKey);
                if (lruHit) {
                    console.log('[AI] LRU HIT');
                    return res.status(200).json({ ...lruHit, cached: true });
                }
            }
 
            console.log('[AI] Cache MISS — calling AI');
 
            // ── 3. Підтягуємо пошукову історію ───────────────
            let searchHistory = [];
            if (userId) {
                try {
                    const rows = await pool.query(
                        `SELECT query_text, category FROM "SearchStats"
                         WHERE user_id = $1
                         ORDER BY created_at DESC LIMIT 8`,
                        [userId]
                    );
                    searchHistory = rows.rows;
                } catch (e) {
                    console.warn('[AI] History error:', e.message);
                }
            }
 
            const systemPrompt = this._buildSystemPrompt(searchHistory, context);
 
            // ── 4. Fallback запит ─────────────────────────────
            let result;
            try {
                result = await askAI(systemPrompt, message);
            } catch (err) {
                if (err.message === 'ALL_PROVIDERS_FAILED') {
                    return res.status(503).json({ error: 'All AI providers unavailable. Try again later.' });
                }
                throw err;
            }
 
            // ── 5. Зберегти в кеш (тільки без контексту) ─────
            if (!hasContext) {
                this.chatCache.set(cacheKey, result);
                pool.query(
                    `INSERT INTO "ChatCache" (cache_key, user_id, message, reply, model)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (cache_key) DO NOTHING`,
                    [cacheKey, userId, message.trim(), result.reply, result.model]
                ).catch(e => console.warn('[AI] DB save error:', e.message));
            }
 
            return res.status(200).json({
                reply:  result.reply,
                model:  result.model,
                cached: false,
            });
 
        } catch (err) {
            console.error('[AI] chatAssistant error:', err);
            return res.status(500).json({ error: 'Error processing your request' });
        }
    };
 

saveSearchStats = async (user_id, query, category, source, results_count) => {
    // Якщо немає ID користувача або запиту — нічого не робимо
    if (!user_id || !query) return;

    try {
        await pool.query(
            `INSERT INTO "SearchStats" (user_id, query_text, category, source, results_count, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
                user_id, 
                query, 
                category || null, 
                source || 'unknown', 
                results_count || 0
            ]
        );
    } catch (err) {
        // Виводимо помилку в консоль, але не кидаємо її далі, 
        // щоб основний пошук не зупинився через статистику
        console.warn(`[STATS ERROR] SearchStats insert failed: ${err.message}`);
    }
};

autocompletePlaces = async (req, res) => {
    const { input, category, language } = req.body;
    const email = req.email || null;
    let userId = null;
    const googleLang = (language || 'uk').toString().toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) || 'uk';

    console.log(`\x1b[36m[API CALL]\x1b[0m Input: "${input}", Cat: "${category}", Lang: "${googleLang}"`);

    if (email) {
        const userRow = await pool.query(`SELECT user_id FROM "Users" WHERE email = $1`, [email]);
        if (userRow.rowCount > 0) userId = userRow.rows[0].user_id;
    }

    try {
        // КРОК 1: ПОШУК У ЛОКАЛЬНІЙ БД
        const inputLower = input.toLowerCase();
        let dynamicLimit;
        
        if (inputLower.includes('район') || inputLower.includes('область') || inputLower.includes('region') || inputLower.includes('oblast')) {
            dynamicLimit = 15;
        } else if (input.split(' ').length === 1) {
            dynamicLimit = 45; // місто
        } else {
            dynamicLimit = 55; // фраза
        }

        let dbQuery = `
            SELECT place_id, full_name AS name, query_name AS description, photo_url, rating, types 
            FROM places 
            WHERE (query_name ILIKE $1 OR full_name ILIKE $1)`;
        
        const params = [`%${input}%`];
        if (category && category !== "(cities)") {
            dbQuery += ` AND $2 = ANY(types)`;
            params.push(category);
        }
        dbQuery += ` ORDER BY rating DESC NULLS LAST, COALESCE(save_count, 0) DESC LIMIT ${dynamicLimit}`;

        const dbSearch = await pool.query(dbQuery, params);
        const localResults = dbSearch.rows || [];

        // Якщо знайшли достатньо результатів у БД - повертаємо їх
        if (localResults.length >= dynamicLimit) {
            console.log(`\x1b[32m[DB HIT]\x1b[0m Знайдено ${localResults.length} записів у БД. Повертаємо їх.`);
            await this.saveSearchStats(userId, input, category, 'db', localResults.length);
            return res.status(200).json({ predictions: localResults.slice(0, dynamicLimit) });
        }

        // КРОК 2: ЯКЩО У БД НЕДОСТАТНЬО - ЗАПИТ ДО GOOGLE
        console.log(`\x1b[33m[DB PARTIAL]\x1b[0m Знайдено ${localResults.length} записів. Запрошуємо Google...`);
        
        const categoryQueries = {
            'restaurant': { uk: 'популярні ресторани', en: 'popular restaurants', de: 'beliebte Restaurants' },
            'cafe': { uk: 'популярні кафе', en: 'popular cafes', de: 'beliebte Cafés' },
            'lodging': { uk: 'популярні готелі', en: 'popular hotels', de: 'beliebte Hotels' },
            'museum': { uk: 'популярні музеї', en: 'popular museums', de: 'beliebte Museen' },
            'park': { uk: 'популярні парки', en: 'popular parks', de: 'beliebte Parks' },
            'shopping_mall': { uk: 'популярні торгові центри', en: 'popular shopping malls', de: 'beliebte Einkaufszentren' }
        };

        const defaultQuery = {
            uk: 'популярні туристичні локації в Європі',
            en: 'popular tourist attractions in Europe',
            de: 'beliebte Sehenswürdigkeiten in Europa'
        };

        const localizedCategory = category && category !== "(cities)" ? categoryQueries[category] : null;
        const hint = localizedCategory ? (localizedCategory[googleLang] || localizedCategory.en) : "";
        let searchPhrase = input.trim();
        
        if (hint) {
            searchPhrase = searchPhrase ? `${hint} in ${searchPhrase}` : hint;
        } else {
            searchPhrase = searchPhrase || defaultQuery[googleLang] || defaultQuery.en;
        }

        console.log(`\x1b[36m[GOOGLE REQUEST]\x1b[0m Query: "${searchPhrase}"`);
        
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchPhrase)}&language=${encodeURIComponent(googleLang)}&key=${process.env.GOOGLE_API_KEY}`;
        const response = await fetch(textSearchUrl);
        const data = await response.json();

        let results = data.results || [];
        let pageToken = data.next_page_token;

        // Отримуємо додаткові сторінки з Google якщо потрібно
        while (pageToken && results.length < dynamicLimit) {
            await new Promise(resolve => setTimeout(resolve, 1400));
            const moreUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(pageToken)}&key=${process.env.GOOGLE_API_KEY}&language=${encodeURIComponent(googleLang)}`;
            const moreResp = await fetch(moreUrl);
            const moreData = await moreResp.json();
            if (moreData.results?.length) {
                results = results.concat(moreData.results);
            }
            pageToken = moreData.next_page_token;
        }

        // КРОК 3: МЕРЖ ЛОКАЛЬНИХ РЕЗУЛЬТАТІВ З GOOGLE
        let finalResults = [...localResults];
        
        if (results.length > 0) {
            const existingIds = new Set(localResults.map(item => item.place_id));
            const newResults = results.filter(item => item.place_id && !existingIds.has(item.place_id));
            
            // Зберігаємо нові місця в БД
            if (newResults.length > 0) {
                console.log(`\x1b[32m[DB SAVE]\x1b[0m Зберігаю ${newResults.length} нових місць з Google...`);
                
                const toSave = newResults.map(p => ({
                    place_id: p.place_id,
                    name: p.name,
                    vicinity: p.formatted_address,
                    photo_url: p.photos?.[0]?.photo_reference 
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${process.env.GOOGLE_API_KEY}` 
                        : null,
                    rating: p.rating,
                    latitude: p.geometry?.location?.lat,
                    longitude: p.geometry?.location?.lng,
                    types: p.types || []
                }));

                try {
                    for (const place of toSave) {
                        await pool.query(`
                            INSERT INTO places (place_id, query_name, full_name, photo_url, rating, latitude, longitude, types)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (place_id) DO UPDATE SET
                                rating = EXCLUDED.rating,
                                photo_url = EXCLUDED.photo_url,
                                latitude = EXCLUDED.latitude,
                                longitude = EXCLUDED.longitude,
                                types = EXCLUDED.types
                        `, [place.place_id, input, place.name, place.photo_url, place.rating, place.latitude, place.longitude, place.types]);
                    }
                    console.log(`\x1b[32m[DB SAVE SUCCESS]\x1b[0m Успішно збережено ${toSave.length} місць`);
                } catch (e) {
                    console.log(`\x1b[31m[DB SAVE ERROR]\x1b[0m ${e.message}`);
                }
            }

            // Додаємо нові результати до фіналу
            const formatted = newResults.map(p => ({
                place_id: p.place_id,
                name: p.name || p.formatted_address || 'Місце',
                description: p.formatted_address || p.name || '',
                photo_url: p.photos?.[0]?.photo_reference 
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${process.env.GOOGLE_API_KEY}` 
                    : null,
                rating: p.rating || 4.5
            }));

            finalResults = finalResults.concat(formatted);
        }

        // Логування фіналу
        console.log(`\x1b[32m[RESULT]\x1b[0m Повертаємо ${finalResults.length} результатів (${localResults.length} з БД + ${finalResults.length - localResults.length} з Google)`);
await this.saveSearchStats(userId, input, category, 'db', localResults.length);
        return res.status(200).json({ predictions: finalResults.slice(0, dynamicLimit) });

    } catch (err) {
        console.error("Помилка сервера:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};






getReviews = async (req, res) => {
    const { place_id } = req.params;

       if (!place_id || !place_id.startsWith('ChIJ') || place_id.length < 10) {
        return res.status(400).json({ error: 'Invalid place_id' });
    }

    try {
        // ── КРОК 1: перевіряємо БД ──────────────────────────
        const cached = await pool.query(
            `SELECT
                id,
                author_display_name,
                author_photo_uri,
                review_text,
                review_language_code,
                original_text,
                original_language_code,
                rating,
                publish_time,
                relative_publish_time_desc,
                google_review_name,
                helpful_count,
                fetched_at
             FROM place_reviews
             WHERE place_id = $1
             ORDER BY publish_time DESC NULLS LAST`,
            [place_id]
        );

        // Є кеш і він свіжий — повертаємо з БД
        if (cached.rowCount > 0) {
            const firstFetch = cached.rows[0].fetched_at;
            const ageMs      = Date.now() - new Date(firstFetch).getTime();
            const ageDays    = ageMs / (1000 * 60 * 60 * 24);

            if (ageDays < CACHE_TTL_DAYS) {
                console.log(`\x1b[32m[REVIEWS DB HIT]\x1b[0m place_id=${place_id}, count=${cached.rowCount}, age=${ageDays.toFixed(1)}d`);
                return res.status(200).json({
                    source:  'db',
                    reviews:cached.rows.map(r => this.formatFromDb(r))
                });
            }

            console.log(`\x1b[33m[REVIEWS STALE]\x1b[0m place_id=${place_id}, age=${ageDays.toFixed(1)}d → re-fetching Google`);
        } else {
            console.log(`\x1b[33m[REVIEWS MISS]\x1b[0m place_id=${place_id} → fetching from Google`);
        }

        // ── КРОК 2: запит до Google Places API (New) ─────────
        const googleUrl =
            `https://places.googleapis.com/v1/places/${encodeURIComponent(place_id)}` +
            `?fields=reviews` +
            `&key=${process.env.GOOGLE_API_KEY}`;

        const googleRes  = await fetch(googleUrl);
        const googleData = await googleRes.json();

        if (!googleRes.ok || !googleData.reviews?.length) {
            // Google нічого не дав — повертаємо кеш (навіть якщо старий) або порожній масив
            console.log(`\x1b[31m[REVIEWS GOOGLE EMPTY]\x1b[0m place_id=${place_id}`);
            return res.status(200).json({
                source:  'db_stale',
                reviews: cached.rows.map(r => this.formatFromDb(r))
            });
        }

        const rawReviews = googleData.reviews; // масив об'єктів Review від Google
        console.log(`\x1b[36m[REVIEWS GOOGLE]\x1b[0m place_id=${place_id}, count=${rawReviews.length}`);

        // ── КРОК 3: зберігаємо в БД ──────────────────────────
        // Видаляємо старі записи для цього місця (свіже перезаписує старе)
        await pool.query(`DELETE FROM place_reviews WHERE place_id = $1`, [place_id]);

        for (const r of rawReviews) {
            const reviewName   = r.name || null;
            const authorName   = r.authorAttribution?.displayName || null;
            const authorUri    = r.authorAttribution?.uri         || null;
            const authorPhoto  = r.authorAttribution?.photoUri    || null;
            const reviewText   = r.text?.text           || null;
            const reviewLang   = r.text?.languageCode   || null;
            const origText     = r.originalText?.text         || null;
            const origLang     = r.originalText?.languageCode || null;
            const rating       = r.rating ? Math.round(r.rating) : null;
            const publishTime  = r.publishTime || null;
            const relativeTime = r.relativePublishTimeDescription || null;

            await pool.query(
                `INSERT INTO place_reviews
                    (place_id, google_review_name, author_display_name, author_uri,
                     author_photo_uri, review_text, review_language_code,
                     original_text, original_language_code,
                     rating, publish_time, relative_publish_time_desc, fetched_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
                 ON CONFLICT (google_review_name) DO UPDATE SET
                     review_text                = EXCLUDED.review_text,
                     review_language_code       = EXCLUDED.review_language_code,
                     original_text              = EXCLUDED.original_text,
                     original_language_code     = EXCLUDED.original_language_code,
                     rating                     = EXCLUDED.rating,
                     relative_publish_time_desc = EXCLUDED.relative_publish_time_desc,
                     fetched_at                 = NOW()`,
                [place_id, reviewName, authorName, authorUri,
                 authorPhoto, reviewText, reviewLang,
                 origText, origLang,
                 rating, publishTime, relativeTime]
            );
        }

        console.log(`\x1b[32m[REVIEWS SAVED]\x1b[0m Збережено ${rawReviews.length} відгуків для place_id=${place_id}`);

        // ── КРОК 4: повертаємо щойно збережені відгуки ───────
        const fresh = await pool.query(
            `SELECT
                id, author_display_name, author_photo_uri,
                review_text, review_language_code,
                original_text, original_language_code,
                rating, publish_time, relative_publish_time_desc,
                google_review_name, helpful_count
             FROM place_reviews
             WHERE place_id = $1
             ORDER BY publish_time DESC NULLS LAST`,
            [place_id]
        );

        return res.status(200).json({
            source:  'google',
            reviews: fresh.rows.map(r => this.formatFromDb(r))
        });

    } catch (err) {
        console.error('\x1b[31m[REVIEWS ERROR]\x1b[0m', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


 markHelpful = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE place_reviews
             SET helpful_count = helpful_count + 1
             WHERE id = $1
             RETURNING helpful_count`,
            [id]
        );
        if (!result.rowCount) return res.status(404).json({ error: 'Review not found' });
        return res.status(200).json({ helpful_count: result.rows[0].helpful_count });
    } catch (err) {
        console.error('\x1b[31m[HELPFUL ERROR]\x1b[0m', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Змінити async на звичайну функцію і додати this
formatFromDb = (row) => {  // прибрати async
    return {
        rating: row.rating,
        text: {
            text:         row.review_text         || '',
            languageCode: row.review_language_code || ''
        },
        originalText: row.original_text ? {
            text:         row.original_text,
            languageCode: row.original_language_code || ''
        } : null,
        authorAttribution: {
            displayName: row.author_display_name || 'Guest',
            photoUri:    row.author_photo_uri    || null
        },
        relativePublishTimeDescription: row.relative_publish_time_desc || '',
        publishTime: row.publish_time,
        dbId:         row.id,
        helpfulCount: row.helpful_count || 0,
        googleReviewName: row.google_review_name
    };
}



placeDetails = async (req, res) => {
    let { place_id, name, photo_url } = req.body || {};

    if (!place_id) {
        console.warn('[SYNC] missing place_id in request body');
        return res.status(400).json({ success: false, error: 'place_id is required' });
    }

    console.log(`\x1b[35m[SYNC]\x1b[0m Sync attempt: ${name || place_id}`);
    console.log(`       Photo URL: ${photo_url ? (photo_url.length > 60 ? photo_url.substring(0, 60) + '...' : photo_url) : 'EMPTY'}`);

    try {
        // Перевірити чи місце вже існує
        const checkQuery = `SELECT place_id FROM places WHERE place_id = $1`;
        const checkResult = await pool.query(checkQuery, [place_id]);

        if (checkResult.rows.length > 0) {
            console.log(`Place ${name || place_id} already exists in DB`);
            return res.status(200).json({ success: true, message: 'Place already exists', place_id });
        }

        // Insert new place
        const insertQuery = `
            INSERT INTO places (place_id, query_name, full_name, photo_url, rating)
            VALUES ($1, $2, $3, $4, 4.5)
            ON CONFLICT(place_id) DO UPDATE SET photo_url = $4
            RETURNING place_id, query_name, full_name
        `;

        const result = await pool.query(insertQuery, [place_id, name || null, name || null, photo_url || null]);

        console.log(`Saved to DB: ${name || place_id}`);
        return res.status(200).json({ success: true, result: result.rows[0] });
    } catch (err) {
        console.error(`[SYNC ERROR] saving ${name || place_id}:`, err && err.stack ? err.stack : err.message || err);
        return res.status(500).json({ success: false, error: 'Server error: could not save place details' });
    }
};
getPlaceDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM places WHERE place_id = $1", [id]);
        
        if (result.rows.length > 0) {
            console.log(`\x1b[32m[CITY DB]\x1b[0m Дані для ${id} взяті з бази`);
            return res.status(200).json(result.rows[0]);
        }
        
        return res.status(404).json({ error: "Not found in DB" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};




getBestPhotoData = async (place_id, name, location) => {
    try {
        // А) Шукаємо через Text Search (найкраща якість)
        const lang = (location?.language || 'uk').toString().toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) || 'uk';
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&key=${process.env.GOOGLE_API_KEY}&language=${encodeURIComponent(lang)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.results && searchData.results[0]?.photos) {
            return {
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${searchData.results[0].photos[0].photo_reference}&key=${process.env.GOOGLE_API_KEY}`,
                rating: searchData.results[0].rating || 4.5,
                isDefault: false
            };
        }

        // Б) Якщо немає фото, пробуємо Street View
        if (location?.lat && location?.lng) {
            return {
                url: `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location.lat},${location.lng}&fov=90&heading=0&pitch=10&key=${process.env.GOOGLE_API_KEY}`,
                rating: 4.0,
                isDefault: false
            };
        }

        return { url: '/img/default_city.jpg', rating: 0, isDefault: true };
    } catch (err) {
        return { url: '/img/default_city.jpg', rating: 0, isDefault: true };
    }
};



getGooglePlaceDetails = async (req, res) => {
    const place_id = req.params.id;
    if (!place_id) return res.status(400).json({ error: 'place_id is required' });

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=name,formatted_address,geometry,rating,user_ratings_total,photos,editorial_summary&key=${process.env.GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            return res.status(502).json({ error: data.error_message || data.status });
        }

        const result = data.result || {};

        const photos = (result.photos || []).map(photo => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            url: `/api/google/photo?photoRef=${encodeURIComponent(photo.photo_reference)}&maxheight=900`
        }));

        return res.json({
            place_id,
            displayName: result.name,
            formattedAddress: result.formatted_address,
            location: {
                latitude:  result.geometry?.location?.lat,
                longitude: result.geometry?.location?.lng,
            },
            rating:          result.rating,
            userRatingCount: result.user_ratings_total,
            editorialSummary: {
                text: result.editorial_summary?.overview || result.editorial_summary?.text || ''
            },
            photos
        });

    } catch (err) {
        console.error('Google place detail fetch error:', err);
        return res.status(500).json({ error: 'Unable to fetch Google place details' });
    }
};

getGooglePhoto = async (req, res) => {
    const { photoRef, place_id, maxwidth, maxheight } = req.query;
    try {
        let photoReference = photoRef;

        if (!photoReference && place_id) {
            const lang = (req.query.language || 'uk').toString().toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) || 'uk';
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=photos&language=${encodeURIComponent(lang)}&key=${process.env.GOOGLE_API_KEY}`;
            const detailRes = await fetch(detailUrl);
            const detailData = await detailRes.json();
            photoReference = detailData.result?.photos?.[0]?.photo_reference;
        }

        if (!photoReference) {
            return res.status(404).json({ error: 'Photo reference not found' });
        }

        const params = new URLSearchParams();
        if (maxwidth) params.set('maxwidth', maxwidth);
        if (maxheight) params.set('maxheight', maxheight);
        params.set('photoreference', photoReference);
        params.set('key', process.env.GOOGLE_API_KEY);

        const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`;
        const photoRes = await fetch(googlePhotoUrl);

        if (!photoRes.ok) {
            const text = await photoRes.text();
            console.error('Google photo proxy error:', photoRes.status, text);
            return res.status(photoRes.status).json({ error: 'Unable to load Google photo' });
        }

        const buffer = Buffer.from(await photoRes.arrayBuffer());
        res.set('Content-Type', photoRes.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
    } catch (err) {
        console.error('Google photo proxy fail:', err);
        return res.status(500).json({ error: 'Google photo proxy failed' });
    }
};




// Допоміжна функція для витягування регіону
extractRegion = (description) => {
    if (!description) return null;
    const parts = description.split(',');
    if (parts.length >= 2) {
        return parts[parts.length - 2].trim();
    }
    return null;
};



  avatarUpload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only JPEG/PNG/WEBP allowed'));
            }
        }
    });
    //Open Main page
    openBaseMainPage = (req, res) => {
        try {
            res.sendFile(this.pageBaseMain, (err) => {
                if (err) {
                    console.log(`Problem with sending Main page: ${err}`);
                    return res.status(404).json();
                }
                console.log(`Main page successfully opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    openFullMainPage = (req, res) => {
        try {
            res.sendFile(this.pageFullMain, (err) => {
                if (err) {
                    console.log(`Problem with sending New Main page: ${err}`);
                    return res.status(404).json();
                }
                console.log(`New Main page successfully opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Error page
    openErrorPage = (req, res) => {
        try {
            res.sendFile(this.pageError, (err) => {
                if (err) {
                    console.log(`Problem with sending Error page: ${err}`);
                    return res.status(400).json();
                }
                console.log(`Error page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Auth page
    openAuthPage = (req, res) => {
        try {
            res.sendFile(this.pageAuth, (err) => {
                if (err) {
                    console.log(`Problem with sending Auth page: ${err}`);
                    return res.status(400).json();
                }
                console.log(`Auth page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Reset Password Enter Page
    openResetPasswordEnterPage = (req, res) => {
        try {
            res.sendFile(this.pageResetPasswordEnterPage, (err) => {
                if (err) {
                    console.log(
                        `Problem with sending Reset Password Enter page: ${err}`,
                    );
                    return res.status(400).json();
                }
                console.log(`Reset Password Enter page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    //Open Email Confirmation page
    openEmailConfirmation = (req, res) => {
        try {
            res.sendFile(this.pageEmailConfirmation, (err) => {
                if (err) {
                    console.log(
                        `Problem with sending Email Confirmation page: ${err}`,
                    );
                    return res.status(400).json();
                }
                console.log(`Email Confirmation page ssuccessful opened`);
                res.status(200);
            });
        } catch (err) {
            console.log(`Problem with server or bad request: ${err}`);
            res.status(500).json();
        }
    };

    // Creating JWT Token and sending to Data BASE
    creatingJwtAccRefTokens = async (username, email, remember) => {
        try {
            const accessTokenPayload = {
                username,
                email,
                iat: Math.floor(Date.now() / 1000), // Time when Token was created
                exp: Math.floor(Date.now() / 1000) + 7 * 60, // Time when Token will unvalid
            };
            const refreshTokenPayload = {
                username,
                email,
                iat: Math.floor(Date.now() / 1000), // Time when Token was created
                exp: remember
                    ? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
                    : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Time when Token will unvalid
            };
            const accessToken = jwt.sign(
                accessTokenPayload,
                process.env.ACCESSJWTTOKEN,
            );
            const refreshToken = jwt.sign(
                refreshTokenPayload,
                process.env.REFRESHJWTTOKEN,
            );
            const hashedRefreshToken = this.hashToken(refreshToken);
            const saveToken = await pool.query(
                `
                    INSERT INTO "JWTRefreshToken" (refresh_token) 
                    VALUES ($1) 
                    ON CONFLICT (refresh_token) 
                    DO UPDATE SET refresh_token = EXCLUDED.refresh_token 
                    RETURNING reftoken_id`,
                [hashedRefreshToken],
            );
            if (saveToken.rowCount === 0) {
                console.log(`Refresh Token have not saved in Database`);
                return { refreshToken: null, accessToken: null };
            }
            const refTokenId = saveToken.rows[0].reftoken_id;
            const updateRefToken = await pool.query(
                `UPDATE "Users" SET reftoken_id = $1 WHERE email = $2 RETURNING user_id`,
                [refTokenId, email],
            );
            if (updateRefToken.rowCount === 0) {
                return console.log(
                    `Refresh Token have not updated in Users table`,
                );
            }
            console.log(`Refresh Token is saved in Database`);
            return { refreshToken, accessToken };
        } catch (err) {
            console.log(`Error with creating JWT tokens: ${err}`);
            return;
        }
    };

sendingEmail = async (to, subject, htmlEmailContent) => {
    try {
        console.log(`\x1b[36m[EMAIL]\x1b[0m ── Початок відправки ──`);
        console.log(`\x1b[36m[EMAIL]\x1b[0m TO: ${to}`);
        console.log(`\x1b[36m[EMAIL]\x1b[0m FROM: ${process.env.EMAILSENDER}`);
        console.log(`\x1b[36m[EMAIL]\x1b[0m PASS length: ${process.env.GOOGLEAPPPASSWORD?.length}`);
        console.log(`\x1b[36m[EMAIL]\x1b[0m PASS value: "${process.env.GOOGLEAPPPASSWORD}"`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAILSENDER,
                pass: process.env.GOOGLEAPPPASSWORD,
            },
            tls: { rejectUnauthorized: false },
            debug: true,
            logger: true,
        });

        console.log(`\x1b[36m[EMAIL]\x1b[0m Перевірка з'єднання...`);
        await transporter.verify();
        console.log(`\x1b[32m[EMAIL]\x1b[0m З'єднання успішне!`);

        const info = await transporter.sendMail({
            from: `"Top Spots" <${process.env.EMAILSENDER}>`,
            to,
            subject,
            html: htmlEmailContent,
        });

        console.log(`\x1b[32m[EMAIL]\x1b[0m Відправлено! ID: ${info.messageId}`);
        console.log(`\x1b[32m[EMAIL]\x1b[0m Response: ${info.response}`);
        return true;
    } catch (err) {
        console.error(`\x1b[31m[EMAIL ERROR]\x1b[0m Code: ${err.code}`);
        console.error(`\x1b[31m[EMAIL ERROR]\x1b[0m Message: ${err.message}`);
        console.error(`\x1b[31m[EMAIL ERROR]\x1b[0m Stack: ${err.stack}`);
        return false;
    }
};

    // Email Letter Html content
    emailLetterContent = (username, token) => {
        return `
             <div style="width: 100%; height: 100%;">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="width: 100%;">
                <tr align="center" style="background-color: #000;">
                    <td>
                       <div style="width: 25%; height: 20%;">
                           <img src="https://imgur.com/r43Fdc9.png" alt="" style="width: 100%; height: 100%;">
                        </div>
                    </td>
                </tr>
                 <tr >
                    <td style="padding: 0px 5% 8% 5%; color: #000;" >
                       <table> 
                             <tr align="center" style="font-size: 25px">
                                <td>
                                   <h2>Email Confirmation</h2>
                                </td>
                             </tr>
                             <tr>
                                <td >
                                   <p style="font-size: 18px; letter-spacing: 1.5px; color: #000;">Hi <span style="color:rgb(22, 0, 80);" font-size: 18px;>${username}</span>, <br> <span style="font-size: 20px; letter-spacing: 1.5px; color: #000;">you're almost set to start enjoying our service. Simply click the link below to verify your email address and get started. The link expires in 24 hours.</span></p>
                                </td>
                             </tr>
                             <tr align="center">
                                <td style="padding: 15px 0px;">
                                   <a href="http://localhost:3500/api/verify-email?token=${token}"  style="background: linear-gradient(to right,rgb(19, 19, 19),rgb(12, 66, 165)); padding: 2.5% 4.5%; border-radius: 10px; letter-spacing: 2px; color:#eeeeee; font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif; font-size: 20px; font-weight: 550; text-decoration: none;">Verify my Email</a>
                                </td>
                             </tr>
                             <tr>
                                <td style="padding-top: 10px;">
                                <p style="font-size: 16px; letter-spacing: 1.5px; font-weight: 500;">If you did not request this email verification, please ignore this message. No further action is required.</p>
                                </td>
                             </tr>
                             <tr align="center">
                                <td align="center" style="font-size: 14px; color: #666; padding-top: 40px;">
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                                    <tr>
                                       <td width="40%">
                                       <div style="width: 100%; height: 3px; background: linear-gradient(to left,rgb(156, 154, 154),rgb(255, 255, 255));"></div>
                                       </td>
                                       <td align="center" style="width: 20%; font-weight: 500; font-size: 18px; color: #000; letter-spacing: 2px; padding: 0 5px; white-space: nowrap;">Social Media</td>
                                       <td width="40%">
                                       <div style="width: 100%; height: 3px; background: linear-gradient(to right,rgb(156, 154, 154),rgb(255, 255, 255));"></div>
                                       </td>
                                    </tr>
                                  </table>
                                </td>
                             </tr>
                            <tr align="center">
                              <td style="padding-top: 10px;">
                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                                    <tr>
                                       <td align="center" width="10%" style="text-align: right;">
                                          <a href="https://www.facebook.com/" target="_blank" >
                                            <img src="https://imgur.com/3LjMEoc.png" alt="Facebook" width="25" height="25" style="display: block;  border-radius: 45px; margin-left: auto;">
                                          </a>
                                       </td>
                                       <td align="center" width="10%">
                                         <a href="https://www.youtube.com/" target="_blank">
                                           <img src="https://imgur.com/PATYsSx.png" alt="YouTube" width="25" height="25" style="display: block;  border-radius: 45px;">
                                         </a>
                                       </td>
                                       <td align="center" width="10%" style="text-align: left;">
                                         <a href="https://www.instagram.com/" target="_blank">
                                           <img src="https://imgur.com/NqwvKkM.png" alt="Tik Tok" width="25" height="25" style="display: block; border-radius: 45px; margin-right: auto;">
                                         </a>
                                       </td>
                                    </tr>
                                 </table>
                              </td>
                            </tr>
                            <tr>
                               <td align="center">
                                  <p style="font-size: 16px; letter-spacing: 1px; color: #000;">Follow our social media for updates and great offers</p>
                               </td>
                            </tr>
                             <tr>
                               <td align="center" style="background-color: #000; padding: 10px 10px;">
                                  <p style="font-size: 15px; letter-spacing: 1px; color: #fff; font-weight: 600; margin: 0px;">Top Spots</p>
                                  <p style="font-size: 12px; letter-spacing: 1px; color: rgb(230, 188, 4); margin: 0px;">Discover The best Around You</p>
                               </td>
                            </tr>
                       </table>
                    </td>
                 </tr>
              </table>`;
    };
    //Email Varification
    emailVerify = async (req, res) => {
        try {
            const { token } = req.query;
            if (!token) {
                console.log(`EVToken is failed, can't to verify email`);
                return;
            }
            const checkToken = await pool.query(
                `SELECT evtoken_id FROM "EVToken" where ev_token = $1`,
                [token],
            );
            if (checkToken.rowCount === 0) {
                console.log(
                    `Database has no this token, so wew can't confirm email`,
                );
                return;
            }
            const chekedTokenId = checkToken.rows[0].evtoken_id;
            console.log(`Token id: ${chekedTokenId}`);

            const isVerified = await pool.query(
                `UPDATE "Users" SET is_verified = true WHERE evtoken_id = $1 RETURNING is_verified, email, username, remember_me`,
                [chekedTokenId],
            );
            if (isVerified.rowCount === 0) {
                console.log(`Problem with updating isVerified`);
                return;
            }
            const verificationStatus = isVerified.rows[0].is_verified;
            console.log(
                `Verification is completed, is Verified = ${verificationStatus}`,
            );

            const username = isVerified.rows[0].username;
            const email = isVerified.rows[0].email;
            const remember = isVerified.rows[0].remember_me;

            const { refreshToken, accessToken } =
                await this.creatingJwtAccRefTokens(username, email, remember);
            if (!refreshToken || !accessToken) {
                console.log(`Error: JWT tokens were not created properly`);
                return res
                    .status(500)
                    .json({ error: 'JWT token generation failed' });
            }
            this.createCookies(res, refreshToken, accessToken);

            // res.status(200).json({accessToken})
            res.redirect('/email-confirmition');
        } catch (err) {
            console.log(
                `Problem with confirmation EVtoken or updating isVerified: ${err}`,
            );
            res.status(500).json();
        }
    };
    // Resent email btn
    resentEmail = async (req, res) => {
        const { email } = req.body;
        if (!email) {
            console.log(`Email are required`);
            return res.status(400).json();
        }
        const userInf = await pool.query(
            `SELECT username, evtoken_id FROM "Users" WHERE email = $1`,
            [email],
        );
        if (userInf.rowCount === 0) {
            console.log(`We have not this email in database`);
            return;
        }
        const username = userInf.rows[0].username;
        const tokenId = userInf.rows[0].evtoken_id;
        const evtokenInf = await pool.query(
            `SELECT ev_token FROM "EVToken" WHERE evtoken_id = $1`,
            [tokenId],
        );
        if (evtokenInf.rowCount === 0) {
            console.log(`We have not found evtoken in database`);
            return;
        }
        const EmailVereficationToken = evtokenInf.rows[0].ev_token;

        const emailContent = this.emailLetterContent(
            username,
            EmailVereficationToken,
        );
        await this.sendingEmail(email, 'Email Confirmation', emailContent);
        res.status(201).json({ createdEmail: email });
    };

    //Registration
    signUp = async (req, res) => {
        const { username, email, password, remember } = req.body;
        const saltLvl = 10;

        if (!username || !email || !password) {
            console.log(`Username, Login and password are required`);
            return res.status(400).json();
        }
        const existUser = await pool.query(
            `SELECT * FROM "Users" WHERE email = ($1)`,
            [email],
        );
        if (existUser.rowCount > 0) {
            console.log(
                `User with this email or phone number ${existUser.rows[0].email} are already exist`,
            );
            return res.status(409).json({ createdEmail: 'error@gmail.com' });
        }
        try {
            const hashedPassword = await bcrypt.hash(password, saltLvl);
            console.log(`Hashed password: ${hashedPassword}`);

            //Creating Email Verification Token
            const EmailVereficationToken = crypto
                .randomBytes(32)
                .toString('hex');
            const creatingEVToken = await pool.query(
                'INSERT INTO "EVToken" (ev_token) VALUES ($1) RETURNING evtoken_id',
                [EmailVereficationToken],
            );
            const EVToken = creatingEVToken.rows[0]?.evtoken_id || null;
            if (!EVToken) {
                console.log('Error creating evtoken');
                res.status(500).json();
                return;
            }
            const provider = 'local';
            //Creating/Sending User and EVToken in database
            const creatingUser = await pool.query(
                `INSERT INTO "Users" (username, email, password, evtoken_id, remember_me, provider) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
                [username, email, hashedPassword, EVToken, remember, provider],
            );
            if (creatingUser.rowCount === 0) {
                console.log(
                    `Problem with creating user or evtoken in Database`,
                );
                res.status(400).json();
                return;
            }
            //Sending Email Confirmation
            const emailContent = this.emailLetterContent(
                username,
                EmailVereficationToken,
            );
            await this.sendingEmail(email, 'Email Confirmation', emailContent);
            res.status(201).json({ createdEmail: email });
        } catch (err) {
            console.log(`Problem with server, ${err}`);
            res.status(500).json();
        }
    };
    //Log in
    logIn = async (req, res, next) => {
        const { email, password, remember } = req.body;
        if (!email || !password) {
            console.log(`User have not entered login or password`);
            return res.status(400).json();
        }
        try {
            const dataBaseUserInf = await pool.query(
                `SELECT * FROM "Users" WHERE email = ($1)`,
                [email],
            );
            if (dataBaseUserInf.rowCount === 0) {
                console.log(`User with this email ${email} is not exist`);
                return res.status(401).json();
            }
            const user = dataBaseUserInf.rows[0];
            const IsMatchPassword = await bcrypt.compare(
                password,
                user.password,
            );
            if (!IsMatchPassword) {
                console.log(`User have entered wrong password`);
                return res.status(401).json();
            }

            if (remember) {
                const savingRemember = await pool.query(
                    `UPDATE "Users" SET remember_me = $1 WHERE email = $2 RETURNING username`,
                    [remember, user.email],
                );
                if (savingRemember.rowCount === 0) {
                    return console.log(`Saving Remember Me in DB is is failed`);
                }
            }

            const { refreshToken, accessToken } =
                await this.creatingJwtAccRefTokens(
                    user.username,
                    user.email,
                    remember,
                );
            if (!refreshToken || !accessToken) {
                console.log(`Error: JWT tokens were not created properly`);
                return res
                    .status(500)
                    .json({ error: 'JWT token generation failed' });
            }

            this.createCookies(res, refreshToken, accessToken);

            console.log(`User with this email ${email} successfully logged in`);
            res.status(200).json({ redirectUrl: '/new-main' });
        } catch (err) {
            console.log(`Problem with server, cause: ${err}`);
            return res.status(500).json();
        }
    };
    //Clear Cookies
    clearCookies = (res) => {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            // maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            // maxAge: 2 * 60 * 1000,
        });
    };
    //Create Cookies
    createCookies = (res, refreshToken, accessToken) => {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // Defend from XSS
            secure: false, // Only  HTTPS
            sameSite: 'Lax', // Defend from CSRF
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true, // Defend from XSS
            secure: false, // Only  HTTPS
            sameSite: 'Lax', // Defend from CSRF
        });
    };
    //Log Out
    //!---------------------------------------------------------------------------------------------------------------------
    logOut = async (req, res) => {
        console.log(`Log out is working`);
        try {
            const refreshToken = req.cookies.refreshToken;
            console.log(`Received refreshToken:`, refreshToken); // Лог значення
            if (!refreshToken) {
                console.log('No refresh token found in cookies');
                this.clearCookies(res);
                return res.redirect('/checkUser');
            }
            const hashedRefresh = this.hashToken(refreshToken);
            const response = await pool.query(
                `UPDATE "JWTRefreshToken" 
                    SET refresh_token = NULL
                    WHERE refresh_token = $1 
                    RETURNING *`,
                [hashedRefresh],
            );
            if (response.rowCount > 0) {
                console.log(`Refresh Token is deleted from Database`);
            } else {
                console.log(`Refresh Token is not deleted from Database`);
            }
            this.clearCookies(res);
            console.log(`Redirecting user to checkUser`);
            return res.status(200).json({ redirectUrl: '/checkUser' });
        } catch (err) {
            console.error(`Logout process failed:${err}`);
            return res
                .status(500)
                .json({ message: 'Internal server error during logout' });
        }
    };

    //Middleware to check Validity Access and Refresh Tokens
    checkValidityAccessToken = async (req, res, next) => {
        try {
            const accessToken = req.cookies.accessToken;
            // if (!accessToken) {
            //     console.log(`Access token is not defined`);
            //     return res
            //         .status(401)
            //         .json({ message: 'Access token missing'});
            // }
            jwt.verify(
                accessToken,
                process.env.ACCESSJWTTOKEN,
                (err, decoded) => {
                    if (err) {
                        console.log(`The Access Token is not valid`);
                        return this.refreshAccessToken(req, res, next);
                    }
                    const { username, email } = decoded;
                    req.username = username;
                    req.email = email;
                    console.log(`The Access Token is valid`);
                    next();
                },
            );
        } catch (err) {
            console.log(
                `Problem with cheking validity of access token: ${err.message}`,
            );
            res.status(500).json();
        }
    };

    //Refresh Access and Refresh tokens
    refreshAccessToken = async (req, res, next) => {
        try {
            //Get Refresh Token from Cookies
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                console.log(`Refresh token is missing in cookies`);
                this.clearCookies(res);
                return res.redirect('/checkUser');
            }
            // Decoding Token to get Info about User
            let decodedRefreshToken;
            try {
                decodedRefreshToken = jwt.verify(
                    refreshToken,
                    process.env.REFRESHJWTTOKEN,
                );
            } catch (err) {
                console.log(`Decoding users refresh token is failed: ${err}`);
                const response = await pool.query(
                    `UPDATE "JWTRefreshToken" 
                    SET refresh_token = NULL
                    WHERE refresh_token = $1 
                    RETURNING *`,
                    [refreshToken],
                );
                if (response.rowCount > 0) {
                    console.log(`Refresh Token is deleted from Database`);
                } else {
                    console.log(`Refresh Token is not deleted from Database`);
                }
                this.clearCookies(res);
                return res.redirect('/checkUser');
            }
            const { username, email } = decodedRefreshToken;
            console.log(
                `Refresh token decoded successfully for user: ${username}, email: ${email}`,
            );

            const hashedRefresh = this.hashToken(refreshToken);
            //Check if this RefreshToken exists in the Database
            const checkTokenPayload = await pool.query(
                `
            SELECT jt.reftoken_id 
            FROM "JWTRefreshToken" jt 
            JOIN "Users" u 
            ON u.reftoken_id = jt.reftoken_id 
            WHERE u.email = $1 AND jt.refresh_token = $2`,
                [email, hashedRefresh],
            );

            //If Refresh Token is not in database or invalid, we redirect to login
            if (checkTokenPayload.rowCount === 0) {
                console.log(
                    `Invalid or expired refresh token for user: ${username}, email: ${email}`,
                );
                return res.redirect('/checkUser');
            }

            //Creating ans sending Access Token to user
            const accessToken = jwt.sign(
                {
                    username,
                    email,
                    iat: Math.floor(Date.now() / 1000), // Time when Token was created
                    exp: Math.floor(Date.now() / 1000) + 7 * 60, // Time when Token will unvalid
                },
                process.env.ACCESSJWTTOKEN,
            );
            console.log(
                `New Access Token: ${accessToken} generated for user: ${username}, email: ${email}`,
            );
            res.cookie('accessToken', accessToken, {
                httpOnly: true, // Defend from XSS
                secure: false, // Only  HTTPS
                sameSite: 'Strict', // Defend from CSRFDFF
                // maxAge: 2 * 60 * 1000, // Alive time
            });
            req.cookies.accessToken = accessToken;
            await this.checkValidityAccessToken(req, res, next);
            res.status(200);
            // res.status(200).json({ message: 'Access token refreshed' });
        } catch (err) {
            console.error(
                `Problem with Refreshing Access or Refresh Tokens: ${err.message}`,
            );
            res.status(500).json({
                message: 'Problem with Refreshing Tokens',
                error: err.message,
            });
        }
  
    };
    //Reset Passwordd Email HTML Content
    resentPasswordEmailContent = (username, reset_code) => {
        return `
     <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0;">
     <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="width: 100%;">
                <tr align="center" style="background-color: #000;">
                    <td>
                       <div style="width: 25%; height: 20%;">
                           <img src="https://imgur.com/r43Fdc9.png" alt="" style="width: 100%; height: 100%;">
                        </div>
                    </td>
                </tr>
            </table>
     <div class="container" style="max-width: 600px; margin: 20px auto; background-color:rgb(255, 255, 255); padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); color: #333333;">
     <div class="header" style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
     <h1 style="margin: 0; color: #2c3e50;">Password Change Request</h1>
    </div>
    <div class="content" style="line-height: 1.6; font-size: 14px;">
      <p style="font-size: 16px; color:rgb(0, 0, 0); ">Hello <span style="color: #003366;">${username}</span>,</p>
      <p style="font-size: 16px; color:rgb(0, 0, 0);">We received a request to reset the password for your account.</p>
      <p style="font-size: 16px; color:rgb(0, 0, 0);">If this was you — great! Use the code below to proceed:</p>

      <div class="reset-code" style="font-size: 24px;
      font-weight: bold;
      background-color: #F4F4F4;
      padding: 12px 20px;
      text-align: center;
     border-radius: 8px;
      margin: 20px 0;
      color: #003366;
      letter-spacing: 3px;">${reset_code}</div>

      <p style="color:rgb(0, 0, 0);">This code is valid for a limited time and should be used only once.</p>

      <p style="color:rgb(0, 0, 0);">To continue resetting your password, click the button below:</p>
      <div style="text-align: center;" >
      <a class="button" style="display: inline-block;
      padding: 14px 24px;
      background-color: #005288;
      color: white;
      leter-spacing: 1.2 px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;" href="http://localhost:3500/api/resetPasword/OpenEnterPage">Reset My Password</a>
      </div>   
      
      <p style="color:rgb(0, 0, 0);">If the button doesn’t work, copy and paste the following link into your browser:</p>
      <p class="link" style="word-break: break-word;
      color: #005288;">http://localhost:3500/api/resetPasword/OpenEnterPage</p>

      <p style="color:rgb(0, 0, 0);">If you did not request this change, please ignore this message. Your account remains secure.</p>

      <p style="color:rgb(0, 0, 0);">Need help? Contact our support team — we’re here for you!</p>

      <p style="color:rgb(0, 0, 0);">Best regards,<br><strong>Top Spots Team</strong></p>
    </div>
    <div class="footer" style="font-size: 13px;
      color: #888888;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
      text-align: center;">
      <p style="color:rgb(114, 114, 114);">This email was sent by Top Spots. If you didn’t request a password change, no further action is needed.</p>
    </div>
  </div>
</body>
      `;
    };

    //Reset Password Sending Email to User
    resetPasswordSentEmail = async (req, res) => {
        const { resentPasswordEmail } = req.body;
        if (!resentPasswordEmail) {
            console.log(`Email is required`);
            return res.status(400).json({ message: 'Email is required' });
        }

        function generateSecureCode() {
            return crypto.randomInt(100000, 1000000).toString();
        }

        try {
            const userInf = await pool.query(
                `SELECT * FROM "Users" WHERE email = $1`,
                [resentPasswordEmail],
            );

            if (userInf.rowCount === 0) {
                console.log(`User with this email is not found`);
                return res.status(200).json({ message: 'User not found' });
            }

            const codeForEmail = generateSecureCode();
            const expiresTime = new Date(Date.now() + 1.5 * 60 * 1000);
            console.log(`Generated code for email: ${codeForEmail}`);

            const saveInf = await pool.query(
                `WITH upsert AS (
         INSERT INTO "ResetPassword" (reset_code, expires_time)
         VALUES ($1, $3)
         ON CONFLICT (reset_code) DO UPDATE
         SET reset_code = EXCLUDED.reset_code, expires_time = EXCLUDED.expires_time
         RETURNING reset_password_id)
         
         UPDATE "Users"
         SET reset_password_id = (SELECT reset_password_id FROM upsert LIMIT 1)
         WHERE email = $2 RETURNING username`,
                [codeForEmail, resentPasswordEmail, expiresTime],
            );

            if (saveInf.rowCount === 0) {
                console.log(`Saving reset code in Data Base failed`);
                return res
                    .status(400)
                    .json({ message: 'Failed to save reset code' });
            }

            const username = saveInf.rows[0].username;
            const emailContent = this.resentPasswordEmailContent(
                username,
                codeForEmail,
            );
            await this.sendingEmail(
                resentPasswordEmail,
                'Reset Password',
                emailContent,
            );

            console.log(`Reset email successfully sent`);

            return res.status(200).json({ message: 'Email sent successfully' });
        } catch (err) {
            console.log(
                `Problem with Reset Password Sending Email: ${err.message}`,
            );
            res.status(500).json({
                message: 'Problem with Reset Password Sending Email',
                error: err.message,
            });
        }
    };

    //Reset Password Check Validity of Verification Code
    checkVerificationCode = async (req, res) => {
        const { resetCode } = req.body;
        if (!resetCode) {
            console.log(
                `Check Verification Code Function didn't receive any data`,
            );
            return res.status(400).json();
        }

        const codeFromDatabase = await pool.query(
            `SELECT * FROM "ResetPassword" WHERE reset_code = ($1)`,
            [resetCode],
        );
        if (codeFromDatabase.rowCount == 0) {
            console.log(`Code is Not verificated, user can't change password`);
            return res.status(404).json();
        }
        const expiresTime = codeFromDatabase.rows[0].expires_time;
        if (Date.now() > new Date(expiresTime).getTime()) {
            console.log(`Reset code has expired`);
            const deleteResetCode = await pool.query(
                `DELETE FROM "ResetPassword" WHERE reset_code = $1`,
                [resetCode],
            );
            if (deleteResetCode.rowCount == 0)
                console.log(`Deleting expired reset code was failed`);
            return res.status(410).json();
        }

        console.log(`Code is verificated, user can change password`);
        return res.status(200).json();
    };

    //Reset Password Creating new Password
        creatingNewPassword = async (req, res) => {
            const { newPassword01, resetCode } = req.body;
            const saltLvl = 10;

            if (!newPassword01 || !resetCode) {
                console.log(
                    `Creating New Password havn't recive new password or reset code`,
                );
                return res.status(403).json();
            }
            try {
                const resetPasswordId = await pool.query(
                    `SELECT reset_password_id FROM "ResetPassword" WHERE reset_code = $1`,
                    [resetCode],
                );
                if (resetPasswordId.rowCount == 0) {
                    console.log(`User not found for updating password`);
                    return res.status(404).json();
                }
                const resetPasswordCodeId =
                    resetPasswordId.rows[0].reset_password_id;
                const hashedPassword = await bcrypt.hash(newPassword01, saltLvl);
                const updatingPassword = await pool.query(
                    `UPDATE "Users" SET password = $1 WHERE reset_password_id = $2 RETURNING user_id`,
                    [hashedPassword, resetPasswordCodeId],
                );
                if (updatingPassword.rowCount == 0) {
                    console.log(`Updating new Password in database was failed`);
                    return res.status(404).json();
                }

                console.log(`New Password is updated`);
                res.status(200).json();
                return;
            } catch (err) {
                console.log(`Problem with server, cause: ${err.message}`);
                return res.status(500).json();
            }
        };

    //Reset Password Deleting Reset Code
    deletingResetCode = async (req, res) => {
        const code = req.body.resetCode;

        const deleteResetCode = await pool.query(
            `DELETE FROM "ResetPassword" WHERE reset_code = $1`,
            [code],
        );
        if (deleteResetCode.rowCount == 0) {
            console.log(`Deleting expired reset code was failed`);
            return res.status(200).json({ redirectTo: '/checkUser' });
        }
        console.log(`Deleting expired reset code was successful`);
        return res.status(200).json({ redirectTo: '/checkUser' });
    };

    //Authentification with Google, Send user to Google
    openGoogleAuth = () => {
        return passport.authenticate('google', { scope: ['profile', 'email'] });
    };

    //Authentification with Google, Get user from Google
    getGoogleDataAuth = (req, res, next) => {
        passport.authenticate(
            'google',
            { session: false, failureRedirect: '/checkUser' },
            async (err, user, info) => {
                if (err | !user) return res.redirect('/checkUser');
                const { id: googleId, displayName: name, emails } = user;
                const email = emails?.[0]?.value;
                const provider = 'google';
                const rememberMe = true;
                const isVerified = true;

                const searchForGoogleId = await pool.query(
                    `SELECT * FROM "Users" WHERE google_id = $1`,
                    [googleId],
                );
                if (searchForGoogleId.rowCount > 0) {
                    const { refreshToken, accessToken } =
                        await this.creatingJwtAccRefTokens(
                            name,
                            email,
                            rememberMe,
                        );
                    if (!refreshToken || !accessToken) {
                        console.log(
                            `Error: JWT tokens were not created properly in searchForGoogleId function`,
                        );
                        return res.redirect('/checkUser');
                    }
                    this.createCookies(res, refreshToken, accessToken);
                    console.log(`User logged in via Google`);
                    return res.redirect('/new-main');
                }

                const searchForEmail = await pool.query(
                    `SELECT * FROM "Users" WHERE email = $1`,
                    [email],
                );
                if (searchForEmail.rowCount > 0) {
                    const changeUserDataInDb = await pool.query(
                        `UPDATE "Users" SET google_id = $1 WHERE email = $2 RETURNING user_id`,
                        [googleId, email],
                    );
                    if (changeUserDataInDb.rowCount == 0) {
                        console.log(
                            `Changing users data in searching user via email was failed`,
                        );
                        return res.redirect('/checkUser');
                    }
                    const { refreshToken, accessToken } =
                        await this.creatingJwtAccRefTokens(
                            name,
                            email,
                            rememberMe,
                        );
                    if (!refreshToken || !accessToken) {
                        console.log(
                            `Error: JWT tokens were not created properly in searchForEmail function`,
                        );
                        return res.redirect('/checkUser');
                    }
                    this.createCookies(res, refreshToken, accessToken);
                    console.log(
                        `User account merged: Google ID linked to existing email ${email} was successfully`,
                    );
                    return res.redirect('/new-main');
                } else {
                    const createNewUserGoogle = await pool.query(
                        `INSERT INTO "Users" (username, email, is_verified, remember_me, google_id, provider) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
                        [
                            name,
                            email,
                            isVerified,
                            rememberMe,
                            googleId,
                            provider,
                        ],
                    );
                    if (createNewUserGoogle.rowCount == 0) {
                        console.log(
                            `Creating new user in createNewUserGoogle was failed`,
                        );
                        return res.redirect('/checkUser');
                    }
                    const { refreshToken, accessToken } =
                        await this.creatingJwtAccRefTokens(
                            name,
                            email,
                            rememberMe,
                        );
                    if (!refreshToken || !accessToken) {
                        console.log(
                            `Error: JWT tokens were not created properly in createNewUserGoogle function`,
                        );
                        return res.redirect('/checkUser');
                    }
                    this.createCookies(res, refreshToken, accessToken);
                    console.log(
                        `Creating new user via Google was successfully`,
                    );
                    res.redirect('/new-main');
                }
            },
        )(req, res, next);
    };

    // Searching Suggestions for SearchBar
    searchingSugges = async (req, res) => {
        const query = req.query.query;
        if (!query) {
            console.log(`searchingSugges function havn't recive any info`);
            return res.status(400).json();
        }

        const lang = (req.query.language || 'uk').toString().toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) || 'uk';
        const searchingInApi = await axios.get(
            'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            {
                params: {
                    input: query,
                    key: process.env.GOOGLE_API_KEY,
                    types: 'establishment',
                    language: lang,
                },
            },
        );
        const suggestions = searchingInApi.data.predictions.map((place) => ({
            description: place.description,
            place_id: place.place_id,
        }));
        res.json(suggestions);
    };


    //Searching Information about Place from Suggestions
    placeInfFromSugg = async (req, res) => {
    const query = req.query.query
    if(!query) {
        console.log(`Place Inf From Suggestions Function havn't recive any data`);
        return res.status(400).json()
    }
    const gettingData = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
            params: {
                place_id: query,
                key: process.env.GOOGLE_API_KEY,
                fields: 'name',
            },
        },
    );
    console.log(`Data:${gettingData.data}`);
    return res.status(200).json(gettingData.data);

};














    // ══════════════════════════════════════════════════════════
    // PROFILE
    // ══════════════════════════════════════════════════════════

    getProfile = async (req, res) => {
        try {
            const email = req.email;
            if (!email) return res.status(401).json({ message: 'Unauthorized' });

            const userInf = await pool.query(
                `SELECT user_id, username, email, avatar_url, bio, location, created_at, places_visited, provider, google_id
                 FROM "Users" WHERE email = $1`,
                [email],
            );
            if (userInf.rowCount === 0) return res.status(404).json({ message: 'User not found' });

            const user = userInf.rows[0];
            const memberSince = user.created_at
                ? new Date(user.created_at).getFullYear()
                : new Date().getFullYear();

            const statsQuery = await pool.query(
                `SELECT query_text, category, source, results_count, created_at
                 FROM "SearchStats"
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 30`,
                [user.user_id],
            );

            const categorySummaryRes = await pool.query(
                `SELECT category, COUNT(*) AS searches, AVG(results_count)::NUMERIC(10,2) AS avg_results
                 FROM "SearchStats"
                 WHERE user_id = $1
                 GROUP BY category
                 ORDER BY searches DESC
                 LIMIT 5`,
                [user.user_id],
            );

            console.log(`getProfile: success for ${email}`);
            return res.status(200).json({
                user_id:        user.user_id,
                username:       user.username,
                email:          user.email,
                avatar_url:     user.avatar_url || null,
                bio:            user.bio || '',
                location:       user.location || '',
                member_since:   memberSince,
                places_visited: user.places_visited || 0,
                provider:       user.provider,
                has_google:     !!user.google_id,
                search_stats:   statsQuery.rows,
                search_summary: categorySummaryRes.rows,
            });
        } catch (err) {
            console.log(`getProfile error: ${err.message}`);
            return res.status(500).json({ message: 'Server error' });
        }
    };

    updateProfile = async (req, res) => {
        try {
            const email = req.email;
            if (!email) return res.status(401).json({ message: 'Unauthorized' });

            const { username, bio, location } = req.body;
            if (!username?.trim()) return res.status(400).json({ message: 'Username is required' });
            if (username.trim().length > 50) return res.status(400).json({ message: 'Username too long' });
            if (bio && bio.length > 300) return res.status(400).json({ message: 'Bio too long' });

            const checkUsername = await pool.query(
                `SELECT user_id FROM "Users" WHERE username = $1 AND email != $2`,
                [username.trim(), email],
            );
            if (checkUsername.rowCount > 0) return res.status(409).json({ message: 'Username already taken' });

            const updated = await pool.query(
                `UPDATE "Users" SET username = $1, bio = $2, location = $3
                 WHERE email = $4 RETURNING username, bio, location`,
                [username.trim(), bio?.trim() || null, location?.trim() || null, email],
            );
            if (updated.rowCount === 0) return res.status(404).json({ message: 'User not found' });

            console.log(`updateProfile: success for ${email}`);
            return res.status(200).json({
                message:  'Profile updated',
                username: updated.rows[0].username,
                bio:      updated.rows[0].bio,
                location: updated.rows[0].location,
            });
        } catch (err) {
            console.log(`updateProfile error: ${err.message}`);
            return res.status(500).json({ message: 'Server error' });
        }
    };


uploadAvatar = async (req, res) => {
    try {
        const email = req.email;
        if (!email) return res.status(401).json({ message: 'Unauthorized' });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        await pool.query(`UPDATE "Users" SET avatar_url = $1 WHERE email = $2`, [base64, email]);

        console.log(`uploadAvatar: ${email} → base64 saved`);
        return res.status(200).json({ message: 'Avatar uploaded', avatar_url: base64 });
    } catch (err) {
        console.log(`uploadAvatar error: ${err.message}`);
        return res.status(500).json({ message: 'Server error' });
    }
};
deleteAvatar = async (req, res) => {
    try {
        const email = req.email;
        if (!email) return res.status(401).json({ message: 'Unauthorized' });
        
        await pool.query(`UPDATE "Users" SET avatar_url = $1 WHERE email = $2`, [null, email]);
        
        console.log(`deleteAvatar: ${email} → avatar removed`);
        return res.status(200).json({ message: 'Avatar deleted' }); // ← цього не було
    } catch (error) {
        console.log('DeleteAvatar error:', error.message);
        return res.status(500).json({ message: 'Server error' });
    }
};
 
changeUserPassword = async (req, res) => {
    try {
        const email = req.email;
        if (!email) return res.status(401).json({ message: 'Unauthorized' });

        const { currentPassword, newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: 'New password required' });
        if (newPassword.length < 8) return res.status(400).json({ message: 'Min 8 characters' });

        const userInf = await pool.query(
            `SELECT password, provider FROM "Users" WHERE email = $1`, [email]
        );
        if (userInf.rowCount === 0) return res.status(404).json({ message: 'User not found' });

        const { password: hashedPwd, provider } = userInf.rows[0];
        const isGoogleOnly = provider === 'google' && !hashedPwd;

        // Google-юзер без пароля — просто встановлюємо новий без перевірки поточного
        if (!isGoogleOnly) {
            if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
            const isMatch = await bcrypt.compare(currentPassword, hashedPwd);
            if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query(`UPDATE "Users" SET password = $1 WHERE email = $2`, [hashed, email]);

        console.log(`changeUserPassword: success for ${email} (provider: ${provider})`);
        return res.status(200).json({ message: 'Password changed' });
    } catch (err) {
        console.log(`changeUserPassword error: ${err.message}`);
        return res.status(500).json({ message: 'Server error' });
    }
};

getPasswordStatus = async (req, res) => {
    try {
        const email = req.email;
        if (!email) return res.status(401).json({ message: 'Unauthorized' });

        const userInf = await pool.query(
            `SELECT password, provider FROM "Users" WHERE email = $1`, [email]
        );
        if (userInf.rowCount === 0) return res.status(404).json({ message: 'User not found' });

        const { password, provider } = userInf.rows[0];
        return res.status(200).json({
            has_password:  !!password,
            provider:      provider,
            is_google_only: provider === 'google' && !password
        });
    } catch (err) {
        console.log(`getPasswordStatus error: ${err.message}`);
        return res.status(500).json({ message: 'Server error' });
    }
};


    getUserSettings = async (req, res) => {
        try {
            const email = req.email;
            if (!email) return res.status(401).json({ message: 'Unauthorized' });

            const userInf = await pool.query(`SELECT user_id FROM "Users" WHERE email = $1`, [email]);
            if (userInf.rowCount === 0) return res.status(404).json({ message: 'User not found' });

            const userId = userInf.rows[0].user_id;
            const settings = await pool.query(`SELECT * FROM "UserSettings" WHERE user_id = $1`, [userId]);

            if (settings.rowCount === 0) {
                return res.status(200).json({
                    notifications_email:  true,
                    notifications_push:   false,
                    notifications_nearby: true,
                    privacy_public:       true,
                    privacy_location:     false,
                });
            }

            const s = settings.rows[0];
            return res.status(200).json({
                notifications_email:  s.notifications_email,
                notifications_push:   s.notifications_push,
                notifications_nearby: s.notifications_nearby,
                privacy_public:       s.privacy_public,
                privacy_location:     s.privacy_location,
            });
        } catch (err) {
            console.log(`getUserSettings error: ${err.message}`);
            return res.status(500).json({ message: 'Server error' });
        }
    };

    updateUserSettings = async (req, res) => {
        try {
            const email = req.email;
            if (!email) return res.status(401).json({ message: 'Unauthorized' });

            const { notifications_email, notifications_push, notifications_nearby, privacy_public, privacy_location } = req.body;

            const userInf = await pool.query(`SELECT user_id FROM "Users" WHERE email = $1`, [email]);
            if (userInf.rowCount === 0) return res.status(404).json({ message: 'User not found' });

            const userId = userInf.rows[0].user_id;

            await pool.query(
                `INSERT INTO "UserSettings" (user_id, notifications_email, notifications_push, notifications_nearby, privacy_public, privacy_location)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (user_id) DO UPDATE SET
                    notifications_email  = COALESCE(EXCLUDED.notifications_email,  "UserSettings".notifications_email),
                    notifications_push   = COALESCE(EXCLUDED.notifications_push,   "UserSettings".notifications_push),
                    notifications_nearby = COALESCE(EXCLUDED.notifications_nearby, "UserSettings".notifications_nearby),
                    privacy_public       = COALESCE(EXCLUDED.privacy_public,       "UserSettings".privacy_public),
                    privacy_location     = COALESCE(EXCLUDED.privacy_location,     "UserSettings".privacy_location)`,
                [userId, notifications_email ?? null, notifications_push ?? null, notifications_nearby ?? null, privacy_public ?? null, privacy_location ?? null],
            );

            console.log(`updateUserSettings: saved for user_id ${userId}`);
            return res.status(200).json({ message: 'Settings saved' });
        } catch (err) {
            console.log(`updateUserSettings error: ${err.message}`);
            return res.status(500).json({ message: 'Server error' });
        }
    };

   
deleteUserAccount = async (req, res) => {
    try {
        const email = req.email;
        if (!email) return res.status(401).json({ message: 'Unauthorized' });

        console.log(`[deleteUserAccount] Спроба видалення: ${email}`);

        const userInf = await pool.query(
            `SELECT user_id, avatar_url, reftoken_id, evtoken_id FROM "Users" WHERE email = $1`,
            [email]
        );
        if (userInf.rowCount === 0) {
            console.log(`[deleteUserAccount] Юзер не знайдений: ${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const { user_id, avatar_url, reftoken_id, evtoken_id } = userInf.rows[0];
        console.log(`[deleteUserAccount] user_id=${user_id}, reftoken_id=${reftoken_id}, evtoken_id=${evtoken_id}`);

        // 1. Видаляємо аватар з диску якщо є
        if (avatar_url) {
            try {
                const avatarPath = path.join(this.publicDir, avatar_url);
                if (fs.existsSync(avatarPath)) {
                    fs.unlinkSync(avatarPath);
                    console.log(`[deleteUserAccount] Аватар видалено: ${avatarPath}`);
                }
            } catch (fileErr) {
                console.log(`[deleteUserAccount] Помилка видалення файлу (не критично): ${fileErr.message}`);
                // Не зупиняємось — продовжуємо видалення акаунту
            }
        }

        // 2. Обнуляємо FK перед видаленням щоб не було конфліктів
        await pool.query(
            `UPDATE "Users" SET reftoken_id = NULL, evtoken_id = NULL, reset_password_id = NULL WHERE user_id = $1`,
            [user_id]
        );
        console.log(`[deleteUserAccount] FK обнулено`);

        // 3. Видаляємо пов'язані записи вручну (якщо немає ON DELETE CASCADE)
        if (reftoken_id) {
            await pool.query(`DELETE FROM "JWTRefreshToken" WHERE reftoken_id = $1`, [reftoken_id]);
            console.log(`[deleteUserAccount] RefreshToken видалено`);
        }
        if (evtoken_id) {
            await pool.query(`DELETE FROM "EVToken" WHERE evtoken_id = $1`, [evtoken_id]);
            console.log(`[deleteUserAccount] EVToken видалено`);
        }

        // 4. Видаляємо налаштування
        await pool.query(`DELETE FROM "UserSettings" WHERE user_id = $1`, [user_id]);
        console.log(`[deleteUserAccount] UserSettings видалено`);

        // 5. Видаляємо самого юзера
        await pool.query(`DELETE FROM "Users" WHERE user_id = $1`, [user_id]);
        console.log(`[deleteUserAccount] Юзер видалений з БД: ${email}`);

        // 6. Чистимо куки
        this.clearCookies(res);

        return res.status(200).json({ redirectTo: '/checkUser' });

    } catch (err) {
        console.log(`[deleteUserAccount] КРИТИЧНА ПОМИЛКА: ${err.message}`);
        console.log(err.stack);
        return res.status(500).json({ message: 'Server error', detail: err.message });
    }
};














// ─────────────────────────────────────────────────────────────
// SHOPPING SEARCH  (global — any city worldwide)
// ─────────────────────────────────────────────────────────────
searchShops = async (req, res) => {
    const { city, type, language = 'en' } = req.body;
    if (!city || !type) return res.status(400).json({ error: 'city and type required' });

    const lang = language.toString().toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) || 'en';

    try {
        // 1. Try DB cache
        const dbResult = await pool.query(
            `SELECT * FROM places
             WHERE full_name ILIKE $1
               AND $2 = ANY(types)
               AND photo_url IS NOT NULL
             ORDER BY save_count DESC NULLS LAST, rating DESC NULLS LAST
             LIMIT 10`,
            [`%${city}%`, type]
        );

        if (dbResult.rows.length >= 5) {
            const ids = dbResult.rows.map(r => r.place_id);
            await pool.query(`UPDATE places SET view_count = view_count + 1 WHERE place_id = ANY($1)`, [ids]);
            console.log(`[SHOPPING] DB hit: ${dbResult.rows.length} for ${city}/${type}`);
            return res.status(200).json({ results: dbResult.rows, source: 'database' });
        }

        // 2. Google Text Search (global)
        console.log(`[SHOPPING] DB miss → Google for ${city}/${type}`);
        const typeMap = {
            supermarket: 'supermarket', clothing: 'clothing_store',
            electronics: 'electronics_store', pharmacy: 'pharmacy',
            shopping_mall: 'shopping_mall', furniture: 'furniture_store',
            sport: 'sporting_goods_store', books: 'book_store',
            building_materials: 'hardware_store', market: 'grocery_or_supermarket'
        };
        const googleType = typeMap[type] || type;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
            `?query=${encodeURIComponent(type + ' in ' + city)}` +
            `&type=${googleType}` +
            `&language=${encodeURIComponent(lang)}` +
            `&key=${process.env.GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ZERO_RESULTS' || !data.results?.length) {
            return res.status(200).json({ results: [], source: 'empty' });
        }

        if (data.status !== 'OK') {
            console.error(`[SHOPPING] Google error: ${data.status} — ${data.error_message}`);
            return res.status(502).json({ error: data.status, details: data.error_message });
        }

        const saved = [];
        for (const place of data.results.slice(0, 50)) {
            const photoUrl = place.photos?.[0]
                ? `/api/google/photo?photoRef=${encodeURIComponent(place.photos[0].photo_reference)}&maxheight=800`
                : null;
            const inserted = await pool.query(
                `INSERT INTO places (place_id, query_name, full_name, photo_url, rating, latitude, longitude, types, city)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (place_id) DO UPDATE SET
                    rating    = EXCLUDED.rating,
                    photo_url = COALESCE(EXCLUDED.photo_url, places.photo_url),
                    city      = COALESCE(EXCLUDED.city, places.city)
                 RETURNING *`,
                [
                    place.place_id, place.name, place.formatted_address,
                    photoUrl, place.rating,
                    place.geometry?.location?.lat,
                    place.geometry?.location?.lng,
                    [googleType], city
                ]
            );
            if (inserted.rows[0]) saved.push(inserted.rows[0]);
        }
        return res.status(200).json({ results: saved, source: 'google' });

    } catch (err) {
        console.error(`[SHOPPING] error: ${err.message}`);
        return res.status(500).json({ error: 'Server error' });
    }
};
// ── Reverse geocoding ─────────────────────────────────────────

_getCityFromCoords = async (latitude, longitude) => {
    try {
        const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json` +
            `?latlng=${latitude},${longitude}&language=en&key=${process.env.GOOGLE_API_KEY}`
        );
        const geoData = await geoRes.json();
        if (!geoData.results?.length) return null;

        const allComponents = geoData.results.flatMap(r => r.address_components);
        const country = allComponents.find(c => c.types.includes('country'));

        const adm1 = allComponents.find(c =>
            c.types.includes('administrative_area_level_1')
        );

        if (!adm1) return null;

        // "Kyivs'ka oblast" → split → ["Kyivs'ka", "oblast"] → беремо [0] → "Kyivs'ka"
        // Але нам треба "Kyiv" — тому прибираємо s'ka або s'kyi з кінця першого слова
        const raw = adm1.long_name; // "Kyivs'ka oblast" або "Kyiv Oblast"
        
        // Беремо перше слово і чистимо суфікси
        const firstWord = raw.split(' ')[0]; // "Kyivs'ka" або "Kyiv"
        const cityName = firstWord
            .replace(/[''`\u2018\u2019\u02BC]?s?['']?(ka|kyi|ska|skyi)$/i, '')
            .trim();

        console.log('[GEO] raw:', raw, '→ firstWord:', firstWord, '→ city:', cityName);
        return cityName ? { name: cityName, country: country?.long_name || null } : null;

    } catch (err) {
        console.warn('[GEO] Geocoding failed:', err.message);
        return null;
    }
};



_fetchFromGoogle = async (cityName, latitude, longitude, cityId) => {
    console.log('[Google Places] Fetching top places for:', cityName);
    try {
        const types = ['store', 'shopping_mall', 'supermarket', 'restaurant', 'cafe'];
        let allPlaces = [];

        for (const type of types) {
            if (allPlaces.length >= 9) break;

            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
                `?location=${latitude},${longitude}` +
                `&radius=10000` +
                `&type=${type}` +
                `&rankby=prominence` +
                `&key=${process.env.GOOGLE_API_KEY}`;

            const res  = await fetch(url);
            const data = await res.json();

            for (const p of data.results || []) {
                if (allPlaces.length >= 9) break;
                if (!p.photos?.length) continue;
                if ((p.rating || 0) < 4.0) continue;
                if (allPlaces.find(x => x.place_id === p.place_id)) continue;

                const photoRef = p.photos[0].photo_reference;

                // ✅ Резолвимо реальний URL фото через redirect на бекенді
                const photoUrl = await this._resolvePhotoUrl(photoRef);
                if (!photoUrl) continue; // якщо фото не резолвилось — пропускаємо

                allPlaces.push({
                    place_id:  p.place_id,
                    name:      p.name,
                    address:   p.vicinity || '',
                    photo_url: photoUrl,
                    rating:    p.rating || 0,
                    score:     (p.user_ratings_total || 0) * 0.3 + (p.rating || 0) * 0.7
                });
            }
        }

        allPlaces.sort((a, b) => b.score - a.score);
        allPlaces = allPlaces.slice(0, 9);

        for (const place of allPlaces) {
            await pool.query(`
                INSERT INTO city_top (city_id, place_id, name, address, photo_url, rating, score, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (city_id, place_id) DO UPDATE
                    SET name       = EXCLUDED.name,
                        address    = EXCLUDED.address,
                        photo_url  = EXCLUDED.photo_url,
                        rating     = EXCLUDED.rating,
                        score      = EXCLUDED.score,
                        updated_at = NOW()
            `, [cityId, place.place_id, place.name, place.address, place.photo_url, place.rating, place.score]);
        }

        return allPlaces;
    } catch (err) {
        console.error('[Google Places] Error:', err.message);
        return [];
    }
};

_resolvePhotoUrl = async (photoRef) => {
    try {
        const googleUrl = `https://maps.googleapis.com/maps/api/place/photo` +
            `?maxwidth=800&photoreference=${photoRef}&key=${process.env.GOOGLE_API_KEY}`;

        const res = await fetch(googleUrl, { redirect: 'manual' });

        if (res.status === 302 || res.status === 301) {
            const location = res.headers.get('location');
            if (location) {
                console.log('[Photo] Resolved OK:', location.substring(0, 50));
                return location;
            }
        }

        if (res.ok) return res.url;

        console.warn('[Photo] Status:', res.status, 'for ref:', photoRef.substring(0, 30));
        return null;
    } catch (err) {
        console.warn('[Photo] Error:', err.message);
        return null;
    }
};


_fillCityTop = async (cityId, cityName, latitude, longitude) => {
    console.log('[CityTop] Filling from our DB for:', cityName);

    let result = await pool.query(`
        SELECT place_id, query_name AS name, full_name AS address,
               photo_url, rating,
               (COALESCE(save_count, 0) * 0.3 + rating * 0.7) AS score
        FROM places
        WHERE photo_url IS NOT NULL 
          AND photo_url != ''
          AND photo_url LIKE 'http%'
          AND rating >= 4.0
          AND city ILIKE $1
        ORDER BY score DESC
        LIMIT 9
    `, [`%${cityName}%`]);

    console.log('[CityTop] By city name found:', result.rows.length);
    result.rows.forEach(r => console.log('  photo_url:', r.photo_url?.substring(0, 60)));

    if (result.rows.length < 3 && latitude && longitude) {
        console.log('[CityTop] Not enough, trying nearby coords...');
        const nearby = await pool.query(`
            SELECT place_id, query_name AS name, full_name AS address,
                   photo_url, rating,
                   (COALESCE(save_count, 0) * 0.3 + rating * 0.7) AS score
            FROM places
            WHERE photo_url IS NOT NULL 
              AND photo_url != ''
              AND photo_url LIKE 'http%'
              AND rating >= 4.0
              AND latitude IS NOT NULL AND longitude IS NOT NULL
              AND (
                  6371 * acos(
                      cos(radians($1)) * cos(radians(latitude::float)) *
                      cos(radians(longitude::float) - radians($2)) +
                      sin(radians($1)) * sin(radians(latitude::float))
                  )
              ) <= 50
            ORDER BY score DESC
            LIMIT 9
        `, [latitude, longitude]);

        console.log('[CityTop] By coords found:', nearby.rows.length);
        nearby.rows.forEach(r => console.log('  photo_url:', r.photo_url?.substring(0, 60)));

        const ids   = new Set(result.rows.map(r => r.place_id));
        const extra = nearby.rows.filter(r => !ids.has(r.place_id));
        result = { rows: [...result.rows, ...extra].slice(0, 9) };
    }

    console.log('[CityTop] Total to save:', result.rows.length);
    if (!result.rows.length) return [];

    for (const place of result.rows) {
        await pool.query(`
            INSERT INTO city_top (city_id, place_id, name, address, photo_url, rating, score, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (city_id, place_id) DO UPDATE
                SET name       = EXCLUDED.name,
                    address    = EXCLUDED.address,
                    photo_url  = EXCLUDED.photo_url,
                    rating     = EXCLUDED.rating,
                    score      = EXCLUDED.score,
                    updated_at = NOW()
        `, [cityId, place.place_id, place.name, place.address, place.photo_url, place.rating, place.score]);
    }

    return result.rows;
};


// ── Головний endpoint ─────────────────────────────────────────
getDailyTop = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        console.log('[Daily Top] Request with coords:', latitude, longitude);

        if (!latitude || !longitude) {
            return res.status(200).json({ top: [], city: null });
        }

        // 1. Отримуємо місто через Google Geocoding
        const cityInfo = await this._getCityFromCoords(latitude, longitude);
        if (!cityInfo) {
            console.warn('[Daily Top] Could not detect city');
            return res.status(200).json({ top: [], city: null });
        }
        console.log('[Daily Top] City detected:', cityInfo.name);

        // 2. Шукаємо місто в нашій таблиці cities
        let cityRow = await pool.query(
            `SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1`,
            [cityInfo.name]
        );

        let cityId;

        if (cityRow.rows.length) {
            // Місто є в таблиці
            cityId = cityRow.rows[0].id;
            console.log('[Daily Top] City found in DB, id:', cityId);
        } else {
            // Місто нове — додаємо в таблицю cities
            const inserted = await pool.query(`
                INSERT INTO cities (name, country, latitude, longitude)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [cityInfo.name, cityInfo.country, latitude, longitude]);
            cityId = inserted.rows[0].id;
            console.log('[Daily Top] New city added, id:', cityId);
        }

        // 3. Перевіряємо чи є вже топ для цього міста в city_top
        const existing = await pool.query(`
            SELECT ct.place_id, ct.name, ct.address, ct.photo_url, ct.rating, ct.score
            FROM city_top ct
            WHERE ct.city_id = $1
              AND ct.updated_at > NOW() - INTERVAL '48 hours'
            ORDER BY ct.score DESC
            LIMIT 9
        `, [cityId]);

        if (existing.rows.length >= 3) {
            // Є актуальні дані — повертаємо одразу
            console.log('[Daily Top] Returning cached city_top:', existing.rows.length, 'places');
            return res.status(200).json({ top: existing.rows, city: cityInfo.name });
        }

        // 4. Нема або застарілі — чистимо і заповнюємо з нашої бази
        await pool.query(`DELETE FROM city_top WHERE city_id = $1`, [cityId]);

        let places = await this._fillCityTop(cityId, cityInfo.name, latitude, longitude);

        // 5. Якщо в нашій базі нічого нема — йдемо в Google Places API
        if (places.length < 3) {
            console.log('[Daily Top] Not enough in our DB, fetching from Google Places...');
            places = await this._fetchFromGoogle(cityInfo.name, latitude, longitude, cityId);
        }

        if (!places.length) {
            return res.status(200).json({ top: [], city: cityInfo.name });
        }

        return res.status(200).json({ top: places, city: cityInfo.name });

    } catch (err) {
        console.error('[Daily Top] Error:', err.message);
        return res.status(500).json({ error: 'Failed to load daily top' });
    }
};
// ── _doRefreshDailyTop ─────────────────────────────────────────
_doRefreshDailyTop = async () => {
    console.log('[DAILYTOP] Starting refresh...');
    
    try {

        const query = `
            SELECT 
                place_id, query_name, full_name, photo_url,
                rating, reviews, city
            FROM places
            WHERE photo_url IS NOT NULL
              AND rating >= 4.0
            ORDER BY (COALESCE(save_count, 0) * 0.3 + rating * 0.7) DESC
            LIMIT 12`;

        const result = await pool.query(query);
        console.log('[DAILYTOP] Found', result.rows.length, 'places');

        if (result.rows.length === 0) {
            console.log('[DAILYTOP] No results to update');
            return;
        }


        try {
            await pool.query(`DELETE FROM "DailyTop"`);
            console.log('[DAILYTOP] Cleared DailyTop table');
        } catch (err) {
            console.warn('[DAILYTOP] Could not clear DailyTop:', err.message);
        }
        
        for (const place of result.rows) {
            try {
                await pool.query(
                    `INSERT INTO "DailyTop" 
                     (place_id, name, address, photo_url, rating, reviews, city, updated_at)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
                    [place.place_id, place.query_name, place.full_name, place.photo_url, place.rating, place.reviews, place.city]
                );
            } catch (err) {
                console.warn('[DAILYTOP] Could not insert', place.place_id, ':', err.message);
            }
        }
        
        console.log(`[DAILYTOP] ✓ Successfully updated ${result.rows.length} top stores`);
    } catch (err) {
        console.error('[DAILYTOP] Error:', err.message);
    }
};

refreshDailyTop = async (req, res) => {
    try {
        await this._doRefreshDailyTop();
        return res.status(200).json({ ok: true, message: 'DailyTop updated successfully' });
    } catch (err) {
        console.error('[DAILYTOP] refresh error:', err.message);
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
};


// ── refreshDailyTop endpoint ───────────────────────────────────
refreshDailyTop = async (req, res) => {
    try {
        await this._doRefreshDailyTop();
        return res.status(200).json({ ok: true, message: 'DailyTop updated successfully' });
    } catch (err) {
        console.error('[DAILYTOP] refresh error:', err.message);
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
};

// ─────────────────────────────────────────────────────────────
// PHOTO PROXIES (unchanged — kept stable)
// ─────────────────────────────────────────────────────────────
proxyPlacePhoto = async (req, res) => {
    const { photoRef, ref, maxheight = 800, maxw = 800 } = req.query;
    const reference = photoRef || ref;
    if (!reference) return res.status(400).json({ error: 'photoRef required' });
    if (!/^[A-Za-z0-9_\-]+$/.test(reference)) return res.status(400).json({ error: 'Invalid ref' });

    try {
        const maxSize = Math.min(parseInt(maxheight || maxw) || 800, 1600);
        const url = `https://maps.googleapis.com/maps/api/place/photo` +
            `?maxheight=${maxSize}&photoreference=${reference}&key=${process.env.GOOGLE_API_KEY}`;

        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) return res.status(response.status).json({ error: 'Photo not found' });

        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(await response.arrayBuffer()));

    } catch (err) {
        console.error('[PHOTO PROXY] error:', err.message);
        return res.status(500).json({ error: 'Proxy error' });
    }
};

proxyPlacePhotoV1 = async (req, res) => {
    const { name, maxw = 800, url } = req.query;

    // Accept either a v1-style `name` or an absolute `url` parameter.
    if (!name && !url) return res.status(400).json({ error: 'name or url required' });

    try {
        if (url) {
            // Basic validation: must be https and reasonable length
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== 'https:') return res.status(400).json({ error: 'Only https URLs allowed' });
            } catch (e) {
                return res.status(400).json({ error: 'Invalid url' });
            }

            const fetchRes = await fetch(url, { redirect: 'follow' });
            if (!fetchRes.ok) {
                const text = await fetchRes.text().catch(() => '');
                console.error('[PHOTO V1 PROXY] fetch failed:', fetchRes.status, text.slice(0, 200));
                return res.status(fetchRes.status).json({ error: 'Unable to fetch image' });
            }

            res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(Buffer.from(await fetchRes.arrayBuffer()));
        }

        // existing name-based behavior
        if (!/^places\/[A-Za-z0-9_\-.]+\/photos\/[A-Za-z0-9_\-.]+$/.test(name)) {
            return res.status(400).json({ error: 'Invalid name format' });
        }

        const urlV1 = `https://places.googleapis.com/v1/${name}/media` +
            `?maxWidthPx=${Math.min(parseInt(maxw) || 800, 1600)}&key=${process.env.GOOGLE_API_KEY}`;

        const response = await fetch(urlV1, { redirect: 'follow' });

        if (response.status === 400) {
            const placeId = name.match(/^places\/([^/]+)\//)?.[1];
            if (!placeId) return res.status(400).json({ error: 'Photo expired' });
            const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${process.env.GOOGLE_API_KEY}`);
            const detail = await detailRes.json();
            const ref = detail.result?.photos?.[0]?.photo_reference;
            if (!ref) return res.status(404).json({ error: 'No photos' });
            pool.query(`UPDATE places SET photo_url = $1 WHERE place_id = $2`, [`/api/google/photo?photoRef=${encodeURIComponent(ref)}&maxheight=800`, placeId]).catch(() => {});
            const photoRes = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxheight=800&photoreference=${ref}&key=${process.env.GOOGLE_API_KEY}`, { redirect: 'follow' });
            if (!photoRes.ok) return res.status(404).json({ error: 'Photo failed' });
            res.setHeader('Content-Type', photoRes.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=604800');
            return res.send(Buffer.from(await photoRes.arrayBuffer()));
        }

        if (!response.ok) return res.status(response.status).json({ error: 'Photo not found' });
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(await response.arrayBuffer()));

    } catch (err) {
        console.error('[PHOTO V1 PROXY] error:', err && err.stack ? err.stack : err.message || err);
        return res.status(500).json({ error: 'Proxy error' });
    }
};

// ─────────────────────────────────────────────────────────────
// NEARBY 
// ─────────────────────────────────────────────────────────────

searchGoogleNearby = async (req, res) => {
    const { latitude, longitude, radius = 1500, types = [], language = 'en' } = req.body;

    if (latitude == null || longitude == null) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius) || 1500;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const lang = language.toString().toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) || 'en';
    const type = Array.isArray(types) && types.length > 0
        ? types[0].toLowerCase().replace(/\s+/g, '_')
        : 'tourist_attraction';

    console.log(`[NEARBY] ${lat}, ${lng}, ${rad}m, type: ${type}, lang: ${lang}`);

    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
            `?location=${lat},${lng}` +
            `&radius=${rad}` +
            `&type=${encodeURIComponent(type)}` +
            `&language=${encodeURIComponent(lang)}` +
            `&key=${process.env.GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ZERO_RESULTS') {
            return res.status(200).json({ places: [], message: 'No places found' });
        }
        if (data.status !== 'OK') {
            console.error(`[NEARBY] API error: ${data.status} — ${data.error_message}`);
            return res.status(502).json({ error: data.status, details: data.error_message });
        }

        const formatted = (data.results || []).map(place => ({
            id:                place.place_id,
            place_id:          place.place_id,
            name:              place.name,
            displayName:       place.name,
            vicinity:          place.vicinity || place.formatted_address || '',
            formatted_address: place.vicinity || place.formatted_address || '',
            rating:            place.rating || 0,
            latitude:          place.geometry?.location?.lat,
            longitude:         place.geometry?.location?.lng,
            photo_url:         place.photos?.[0]?.photo_reference
                ? `/api/google/photo?photoRef=${encodeURIComponent(place.photos[0].photo_reference)}&maxheight=800`
                : null,
            types:             place.types || [],
            opening_hours:     place.opening_hours || null,
        }));

        console.log(`[NEARBY] Found ${formatted.length} places`);
        return res.json({ places: formatted });

    } catch (err) {
        console.error(`[NEARBY] Server error: ${err.message}`);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};
getNearbyPlaces = async (req, res) => {
    const { latitude, longitude, radius = 5000, category } = req.body;
    if (latitude == null || longitude == null) return res.status(400).json({ error: 'Coordinates required' });

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius) || 5000;
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'Invalid coordinates' });

    try {
        let q = `
            SELECT place_id, query_name, full_name, photo_url, rating, latitude, longitude, types,
                (6371 * acos(
                    LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(latitude)))
                )) AS distance_km
            FROM places
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND photo_url IS NOT NULL
              AND (6371 * acos(
                    LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(latitude))
                    )
                )) <= $3`;

        const params = [lat, lng, rad / 1000];

        if (category && category !== 'all') {
            // FIX: types is text[] — use = ANY() instead of @> jsonb
            q += ` AND $4 = ANY(types)`;
            params.push(category.toLowerCase().replace(/\s+/g, '_'));
        }

        q += ` ORDER BY rating DESC NULLS LAST, distance_km ASC LIMIT 60`;

        const { rows } = await pool.query(q, params);
        if (!rows.length) return res.status(200).json({ results: [], source: 'empty' });

        const formatted = rows.map(p => ({
            place_id:          p.place_id,
            name:              p.query_name,
            vicinity:          p.full_name,
            formatted_address: p.full_name,
            rating:            p.rating,
            latitude:          p.latitude,
            longitude:         p.longitude,
            photo_url:         p.photo_url,
            distance_km:       parseFloat(p.distance_km).toFixed(2),
            types:             p.types,
        }));

        console.log(`[NEARBY CACHE] ${formatted.length} places found`);
        return res.status(200).json({ results: formatted, source: 'database' });

    } catch (err) {
        console.error(`[NEARBY CACHE] ${err.message}`);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};

saveNearbyPlaces = async (req, res) => {
    const { places } = req.body;
    if (!places?.length) return res.status(400).json({ error: 'No places provided' });

    let ok = 0, fail = 0;
    for (const place of places) {
        try {
            // FIX: types must be text[] not JSON string
            const typesArr = Array.isArray(place.types)
                ? place.types.map(t => String(t))
                : [];

            await pool.query(
                `INSERT INTO places (place_id, query_name, full_name, photo_url, rating, latitude, longitude, types)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT (place_id) DO UPDATE SET
                    rating    = EXCLUDED.rating,
                    photo_url = COALESCE(EXCLUDED.photo_url, places.photo_url),
                    latitude  = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    types     = EXCLUDED.types`,
                [
                    place.place_id || place.id,
                    place.name || 'Unknown',
                    place.vicinity || place.formatted_address || place.name || 'Unknown',
                    place.photo_url || null,
                    place.rating || 0,
                    place.latitude || null,
                    place.longitude || null,
                    typesArr   // pass as JS array — pg driver maps to text[]
                ]
            );
            ok++;
        } catch (e) {
            fail++;
            console.error(`[SAVE NEARBY] ${place.name}: ${e.message}`);
        }
    }

    console.log(`[NEARBY SAVE] ${ok} saved, ${fail} failed`);
    return res.status(200).json({ success: true, saved: ok, failed: fail });
};
}

module.exports = Controller;
    