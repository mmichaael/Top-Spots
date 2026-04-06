const express    = require("express");
const path       = require("path");
const cron       = require("node-cron");
const helmet     = require("helmet");
const mongoSanitize = require("xss-clean");
require("dotenv").config({ path: path.resolve(__dirname, "./privateInf.env") });
const pool = require('./database.js');
const router     = require("./router.js");
const cors       = require("cors");
const passport   = require("passport");
const cookieParser = require("cookie-parser");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Controller = require("./controller.js");
const rateLimiter = require("./middleware/rateLimiter.js");

const app = express();


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://maps.googleapis.com", "https://maps.gstatic.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'",
                "https://maps.googleapis.com",
                "https://maps.gstatic.com",
                "https://places.googleapis.com",
                "https://places.gstatic.com",
                "https://www.googleapis.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"] // 🔓 Дозволяємо Google Maps frames
        }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    frameguard: false
}));


app.use(mongoSanitize()); 


app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? ["https://your-domain.com"] 
        : ["http://localhost:3500"],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    maxAge: 600, // Preflight cache 10 хвилин
    sameSite: "Lax"
}));

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
            "https://maps.googleapis.com " +
            "https://maps.gstatic.com " +
            "https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' " +
            "https://fonts.googleapis.com " +
            "https://cdnjs.cloudflare.com; " +
        "font-src 'self' " +
            "https://fonts.gstatic.com " +
            "https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob: " +
            "https://maps.googleapis.com " +
            "https://maps.gstatic.com " +
            "https://places.googleapis.com " +
            "https://lh3.googleusercontent.com " +
            "https://streetviewpixels-pa.googleapis.com; " +
        "connect-src 'self' " +
            "https://maps.googleapis.com " +
            "https://places.googleapis.com; " +
        "frame-src https://www.google.com;"
    );
    next();
});
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

passport.use(new GoogleStrategy(
    {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
));

app.get('/api/google-maps-key', (req, res) => {
    if (!process.env.GOOGLE_API_KEY)
        return res.status(500).json({ error: 'Google API key not configured' });
    res.json({ key: process.env.GOOGLE_API_KEY });
});

app.use("/", router);
app.use(express.static(path.join(__dirname, "../front-end")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../front-end/html/index.html"));
});
app.get("/city_page.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../front-end/html/city_page.html"));
});

// 🛡️ ── ГЛОБАЛЬНІ ERROR HANDLERS ──────────────────────────────────
// 404 Handler
app.use((req, res) => {
    console.warn(`⚠️ 404: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'Маршрут не знайдено',
        path: req.path,
        method: req.method
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Внутрішня pomилка сервера';
    
    console.error(`❌ [${status}] ${message}`, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        error: err.stack
    });

    // Не показуємо stack trace в production
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(status).json({
        success: false,
        message: message,
        ...(isDev && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3500;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, async () => {
    console.log(`\n🚀 Server running at http://${HOST}:${PORT}\n`);
    
    // ── Rate Limiter Status ──
    console.log('🛡️  Rate Limiter initialized:');
    console.log(`   • Search endpoints: 7 requests/60 seconds per user`);
    console.log(`   • Global limit: 100 requests/600 seconds per user`);
    console.log(`   • IP block threshold: 30 violations/60 seconds`);
    console.log(`   • IP block duration: 1 hour`);
    console.log('');

    //  Cron
    cron.schedule('0 6 * * *', async () => {
        console.log('[CRON] Оновлення DailyTop...');
        const ctrl = new Controller();
        await ctrl._doRefreshDailyTop();
    });
    try {
        const check = await pool.query(
            `SELECT updated_at FROM "DailyTop" ORDER BY updated_at DESC LIMIT 1`
        );
        const needsRefresh = check.rows.length === 0 ||
            (Date.now() - new Date(check.rows[0].updated_at).getTime()) > 24 * 60 * 60 * 1000;

        if (needsRefresh) {
            console.log('[CRON] DailyTop застарів або порожній — оновлюємо...');
            const ctrl = new Controller();
            await ctrl._doRefreshDailyTop();
        } else {
            console.log('[CRON] DailyTop актуальний, пропускаємо');
        }
    } catch(e) {
        console.error('[CRON] init check error:', e.message);
    }

});