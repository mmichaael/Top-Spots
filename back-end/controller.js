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

 require('dotenv').config({ path: path.resolve(__dirname, './privateInf.env') });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


class Controller {
    pageBaseMain = path.join(__dirname, '../front-end/html/index.html');
    pageFullMain = path.join(__dirname, '../front-end/html/logged_index.html');
    pageError = path.join(__dirname, '../front-end/html/error.html');
    pageAuth = path.join(__dirname, '../front-end/html/authentication.html');
    pageEmailConfirmation = path.join(
        __dirname,
        '../front-end/html/email_confirmation.html',
    );
    pageResetPasswordEnterPage = path.join(

        __dirname,
        '../front-end/html/reset_password.html',
    );


    constructor() {
        this.chatCache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // 60 сек кеш
    }

    hashToken = (token) => {
        return crypto.createHash('sha3-256').update(token).digest('hex');
    };

    saveSearchStats = async (user_id, query, category, source, results_count) => {
        if (!user_id || !query) return;
        try {
            await pool.query(
                `INSERT INTO "SearchStats" (user_id, query_text, category, source, results_count, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [user_id, query, category || null, source || 'unknown', results_count || 0],
            );
        } catch (err) {
            console.warn(`SearchStats insert failed: ${err.message}`);
        }
    };

chatAssistant = async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                console.log("Message not provided");
                return res.status(400).json({
                    error: "Введи повідомлення",
                });
            }

            // --- CHECK CACHE ---
            const cached = this.chatCache.get(message);
            if (cached) {
                console.log("Chat cache HIT");
                return res.status(200).json({ reply: cached });
            }

            console.log("Chat cache MISS");

            // --- OPENAI REQUEST ---
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "Ти — розумний чат-бот сайту Top-Spots,цей сайт про туризм в Україні.Відповідай корисно, стисло і українською."
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.3,
                max_tokens: 250
            });

            const reply = completion.choices[0].message.content;

            // --- SAVE TO CACHE ---
            this.chatCache.set(message, reply);

            return res.status(200).json({ reply });

        } catch (err) {
            console.log("chatAssistant error:", err);
            return res.status(500).json({
                error: "Сталася помилка при зверненні до AI"
            });
        }
    };



 autocompletePlaces = async (req, res) => {
    const { input, category } = req.body;
    const email = req.email || null;
    let userId = null;

    console.log(`\x1b[36m[API CALL]\x1b[0m Input: "${input}", Cat: "${category}"`);

    if (email) {
        const userRow = await pool.query(`SELECT user_id FROM "Users" WHERE email = $1`, [email]);
        if (userRow.rowCount > 0) userId = userRow.rows[0].user_id;
    }

    try {
        // 1. Пошук у базі даних з фільтрацією по типах
        let dbQuery = `
            SELECT place_id, query_name AS name, full_name AS description, photo_url, rating, types 
            FROM places 
            WHERE (query_name ILIKE $1 OR full_name ILIKE $1)`;
        
        const params = [`%${input}%`];
        if (category && category !== "(cities)") {
            dbQuery += ` AND $2 = ANY(types)`;
            params.push(category);
        }
        dbQuery += ` LIMIT 5`;

        const dbSearch = await pool.query(dbQuery, params);

        if (dbSearch.rows.length > 0) {
            console.log(`\x1b[32m[DB HIT]\x1b[0m Знайдено ${dbSearch.rows.length} записів.`);
            await this.saveSearchStats(userId, input, category, 'db', dbSearch.rows.length);
            return res.status(200).json({ predictions: dbSearch.rows });
        }

        await this.saveSearchStats(userId, input, category, 'db', 0);
        // 2. Якщо в БД порожньо — запит до Google
        console.log(`\x1b[33m[DB MISS]\x1b[0m Запит до Google API...`);
        
        const categoryHints = {
            'restaurant': 'ресторан', 'cafe': 'кафе', 'lodging': 'готель',
            'museum': 'музей', 'park': 'парк', 'shopping_mall': 'торговий центр'
        };
        const hint = (category && category !== "(cities)") ? categoryHints[category] : "";
        const googleInput = `${input} ${hint}`.trim();

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(googleInput)}&language=uk&components=country:ua&key=${process.env.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        const formatted = (data.predictions || []).map(p => ({
            place_id: p.place_id,
            name: p.structured_formatting ? p.structured_formatting.main_text : p.description,
            description: p.description,
            photo_url: null, // Google Autocomplete не повертає фото відразу
            rating: 4.5
        }));

        await this.saveSearchStats(userId, input, category, 'google', formatted.length);
        return res.status(200).json({ predictions: formatted });
    } catch (err) {
        console.error("❌ Помилка сервера:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

saveNearbyPlaces = async (req, res) => {
    const { places } = req.body;
    if (!places || !Array.isArray(places)) {
        return res.status(400).json({ error: "No places provided" });
    }
    try {
        const saved = [];
        for (const place of places) {
            const insertQuery = `
                INSERT INTO places (
                    place_id, query_name, full_name, photo_url, rating, latitude, longitude, types
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (place_id) DO UPDATE SET
                    rating = EXCLUDED.rating,
                    photo_url = EXCLUDED.photo_url,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    types = EXCLUDED.types
                RETURNING *`;

            const result = await pool.query(insertQuery, [
                place.place_id,
                place.name,
                place.vicinity,
                place.photo_url,
                place.rating,
                place.latitude,
                place.longitude,
                place.types || []
            ]);
            saved.push(result.rows[0]);
        }
        return res.status(200).json({ success: true, count: saved.length });
    } catch (err) {
        console.error("DB Save Error:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
};

getNearbyPlaces = async (req, res) => {
    const { latitude, longitude, radius = 5000, category } = req.body;
    try {
        let cacheQuery = `
            SELECT * FROM places
            WHERE (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) <= $3
            AND photo_url IS NOT NULL
        `;
        const params = [latitude, longitude, radius / 1000];

        if (category) {
            cacheQuery += ` AND $4 = ANY(types)`;
            params.push(category);
        }

        cacheQuery += ` ORDER BY rating DESC NULLS LAST LIMIT 20`;

        const { rows: cached } = await pool.query(cacheQuery, params);

        if (cached.length > 0) {
            console.log(`\x1b[32m[DB SUCCESS]\x1b[0m Віддаємо ${cached.length} місць з бази`);
            return res.status(200).json({ results: cached, source: 'database' });
        }

        return res.status(200).json({ results: [], source: 'empty' });
    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
};


getBestPhotoData = async (place_id, name, location) => {
    try {
        // А) Шукаємо через Text Search (найкраща якість)
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&key=${process.env.GOOGLE_API_KEY}&language=uk`;
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


placeDetails = async (req, res) => {
    const { place_id, name, photo_url } = req.body;
    
    console.log(`\x1b[35m[SYNC]\x1b[0m Спроба синхронізації: ${name}`);
    console.log(`       Photo URL прийшов: ${photo_url ? photo_url.substring(0, 50) + '...' : 'ПУСТО'}`);

    try {
        // Перевірити чи місце вже існує
        const checkQuery = `SELECT place_id FROM places WHERE place_id = $1`;
        const checkResult = await pool.query(checkQuery, [place_id]);
        
        if (checkResult.rows.length > 0) {
            // Місце вже існує, повернути його
            console.log(`✅ Місце ${name} вже у БД`);
            return res.status(200).json({ 
                success: true, 
                message: 'Place already exists',
                place_id: place_id 
            });
        }
        
        // Додати нове місце
        const insertQuery = `
            INSERT INTO places (place_id, query_name, full_name, photo_url, rating)
            VALUES ($1, $2, $3, $4, 4.5)
            ON CONFLICT(place_id) DO UPDATE SET photo_url = $4
            RETURNING place_id, query_name, full_name
        `;
        const result = await pool.query(insertQuery, [place_id, name, name, photo_url || null]);
        
        console.log(`✅ Успішно збережено в БД: ${name}`);
        res.status(200).json({ 
            success: true, 
            result: result.rows[0] 
        });
    } catch (err) {
        console.log(`🔴 Помилка при збереженні ${name}:`, err.message);
        res.status(500).json({ 
            success: false,
            error: "Server error: could not save place details"
        });
    }
}
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

// Допоміжна функція для витягування регіону
extractRegion = (description) => {
    if (!description) return null;
    const parts = description.split(',');
    if (parts.length >= 2) {
        return parts[parts.length - 2].trim();
    }
    return null;
};

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
        console.log(`\x1b[32m[EMAIL]\x1b[0m ✅ З'єднання успішне!`);

        const info = await transporter.sendMail({
            from: `"Top Spots" <${process.env.EMAILSENDER}>`,
            to,
            subject,
            html: htmlEmailContent,
        });

        console.log(`\x1b[32m[EMAIL]\x1b[0m ✅ Відправлено! ID: ${info.messageId}`);
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

        const searchingInApi = await axios.get(
            'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            {
                params: {
                    input: query,
                    key: process.env.GOOGLE_API_KEY,
                    types: 'establishment',
                    language: 'uk',
                    components: 'country:ua',
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
 
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
 
        // Видаляємо старий аватар
        try {
            const oldRow = await pool.query(`SELECT avatar_url FROM "Users" WHERE email = $1`, [email]);
            if (oldRow.rows[0]?.avatar_url && oldRow.rows[0].avatar_url !== avatarUrl) {
                const oldPath = path.join(__dirname, '../front-end/public', oldRow.rows[0].avatar_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } catch (fileErr) {
            console.log(`uploadAvatar: old file remove error (non-critical): ${fileErr.message}`);
        }
 
        await pool.query(`UPDATE "Users" SET avatar_url = $1 WHERE email = $2`, [avatarUrl, email]);
 
        console.log(`uploadAvatar: ${email} → ${avatarUrl}`);
 
        // ← ВАЖЛИВО: повертаємо avatar_url щоб фронт міг оновити кеш
        return res.status(200).json({
            message: 'Avatar uploaded',
            avatar_url: avatarUrl   // ← цей рядок був відсутній!
        });
    } catch (err) {
        console.log(`uploadAvatar error: ${err.message}`);
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














searchShops = async (req, res) => {
    const { city, type } = req.body;
    if (!city || !type) return res.status(400).json({ error: 'city and type required' });
    try {
        const dbResult = await pool.query(
            `SELECT * FROM places
             WHERE full_name ILIKE $1
             AND $2 = ANY(types)
             AND photo_url IS NOT NULL
             ORDER BY save_count DESC NULLS LAST, rating DESC NULLS LAST
             LIMIT 8`,
            [`%${city}%`, type]
        );

        if (dbResult.rows.length >= 3) {
            const ids = dbResult.rows.map(r => r.place_id);
            await pool.query(
                `UPDATE places SET view_count = view_count + 1 WHERE place_id = ANY($1)`,
                [ids]
            );
            console.log(`[SHOPPING] DB hit: ${dbResult.rows.length} для ${city}/${type}`);
            return res.status(200).json({ results: dbResult.rows, source: 'database' });
        }

        console.log(`[SHOPPING] DB miss → Google для ${city}/${type}`);
        const typeMap = {
            supermarket: 'supermarket', clothing: 'clothing_store',
            electronics: 'electronics_store', pharmacy: 'pharmacy',
            shopping_mall: 'shopping_mall', furniture: 'furniture_store',
            sport: 'sporting_goods_store', books: 'book_store',
            building_materials: 'hardware_store', market: 'grocery_or_supermarket'
        };
        const googleType = typeMap[type] || type;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(type + ' ' + city)}&type=${googleType}&language=uk&key=${process.env.GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        if (!data.results?.length) return res.status(200).json({ results: [], source: 'empty' });

        const saved = [];
        for (const place of data.results.slice(0, 8)) {
            const photoUrl = place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_API_KEY}`
                : null;
            const inserted = await pool.query(
                `INSERT INTO places (place_id, query_name, full_name, photo_url, rating, latitude, longitude, types, city)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (place_id) DO UPDATE SET
                    rating = EXCLUDED.rating,
                    photo_url = COALESCE(EXCLUDED.photo_url, places.photo_url),
                    city = COALESCE(EXCLUDED.city, places.city)
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


// ── Отримати топ дня ──────────────────────────────────────
getDailyTop = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM "DailyTop" ORDER BY rating DESC LIMIT 3`
        );
        return res.status(200).json({ top: result.rows });
    } catch(err) {
        console.error('[DAILYTOP] getDailyTop error:', err.message);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ── Внутрішня логіка оновлення (викликається cron'ом) ─────
_doRefreshDailyTop = async () => {
    const categories = [
        { key: 'shopping_mall',  label: 'ТЦ',          googleType: 'shopping_mall'   },
        { key: 'supermarket',    label: 'Супермаркет',  googleType: 'supermarket'     },
        { key: 'clothing_store', label: 'Одяг',         googleType: 'clothing_store'  },
        { key: 'electronics',    label: 'Електроніка',  googleType: 'electronics_store'},
        { key: 'pharmacy',       label: 'Аптека',       googleType: 'pharmacy'        },
    ];

    // Перемішуємо щоразу щоб топ був різним
    const shuffled = categories.sort(() => Math.random() - 0.5).slice(0, 3);
    const results  = [];

    for (const cat of shuffled) {
        // 1. Шукаємо в нашій БД places (найкращі за рейтингом і популярністю)
        const dbRes = await pool.query(
            `SELECT * FROM places
             WHERE $1 = ANY(types)
             AND photo_url IS NOT NULL
             AND rating >= 4.0
             ORDER BY (COALESCE(save_count,0) * 0.4 + COALESCE(rating,0) * 0.6) DESC
             LIMIT 1`,
            [cat.key]
        );

        if (dbRes.rows.length > 0) {
            const p = dbRes.rows[0];
            results.push({
                place_id:  p.place_id,
                name:      p.query_name,
                address:   p.full_name,
                photo_url: p.photo_url,
                rating:    p.rating,
                category:  cat.label,
            });
            console.log(`[DAILYTOP] БД hit: ${p.query_name} (${cat.label})`);
            continue;
        }

        // 2. Якщо в БД немає — йдемо в Google
        console.log(`[DAILYTOP] БД miss → Google (${cat.label})`);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
                `?query=топ+${encodeURIComponent(cat.label)}+Україна` +
                `&type=${cat.googleType}` +
                `&language=uk` +
                `&key=${process.env.GOOGLE_API_KEY}`;

            const resp = await fetch(url);
            const data = await resp.json();

            if (!data.results?.length) continue;

            // Скор: рейтинг * log(відгуки) — найпопулярніше
            const best = data.results
                .filter(p => p.rating >= 4.0 && (p.user_ratings_total || 0) >= 50)
                .sort((a, b) =>
                    (b.rating * Math.log((b.user_ratings_total || 1) + 1)) -
                    (a.rating * Math.log((a.user_ratings_total || 1) + 1))
                )[0];

            if (!best) continue;

            const photoUrl = best.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200` +
                  `&photoreference=${best.photos[0].photo_reference}` +
                  `&key=${process.env.GOOGLE_API_KEY}`
                : null;

            // Зберігаємо в places щоб наступного разу взяти з БД
            await pool.query(
                `INSERT INTO places (place_id, query_name, full_name, photo_url, rating, latitude, longitude, types)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT (place_id) DO UPDATE SET
                    rating    = EXCLUDED.rating,
                    photo_url = COALESCE(EXCLUDED.photo_url, places.photo_url)`,
                [
                    best.place_id, best.name, best.formatted_address,
                    photoUrl, best.rating,
                    best.geometry?.location?.lat,
                    best.geometry?.location?.lng,
                    [cat.key]
                ]
            );

            results.push({
                place_id:  best.place_id,
                name:      best.name,
                address:   best.formatted_address,
                photo_url: photoUrl,
                rating:    best.rating,
                category:  cat.label,
            });

        } catch(gErr) {
            console.error(`[DAILYTOP] Google error (${cat.label}):`, gErr.message);
        }
    }

    if (!results.length) {
        console.log('[DAILYTOP] Немає результатів для оновлення');
        return;
    }

    // Очищаємо стару таблицю і вставляємо нову
    await pool.query(`DELETE FROM "DailyTop"`);
    for (const place of results) {
        await pool.query(
            `INSERT INTO "DailyTop" (place_id, name, address, photo_url, rating, category, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
            [place.place_id, place.name, place.address, place.photo_url, place.rating, place.category]
        );
    }
    console.log(`[DAILYTOP] ✅ Оновлено ${results.length} топових місць`);
};

// ── Ручне оновлення через API (для тесту) ─────────────────
refreshDailyTop = async (req, res) => {
    try {
        await this._doRefreshDailyTop();
        return res.status(200).json({ ok: true, message: 'DailyTop оновлено' });
    } catch(err) {
        console.error('[DAILYTOP] refresh error:', err.message);
        return res.status(500).json({ error: 'Server error' });
    }
};


}

module.exports = Controller;
