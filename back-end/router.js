const express = require('express'); 
const router = express.Router();
const passport = require('passport'); 
const Controller = require('./controller.js');
const controller = new Controller();
const rateLimiter = require('./middleware/rateLimiter.js');

// 🛡️ ── ПРОСТОЇ CSRF ЗАХИСТ (Origin/Referer check) ──────────────────
const basicCSRFCheck = (req, res, next) => {
    // Тільки для методів, які змінюють дані
    if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
        const origin = req.get('origin');
        const referer = req.get('referer');
        const host = req.get('host');
        
        // 🔒 Перевірка: той ж origin або відсутній (нормально для same-site)
        const isValidOrigin = !origin || origin.includes('localhost') || origin.includes(host);
        const isValidReferer = !referer || referer.includes('localhost') || referer.includes(host);
        
        if (!isValidOrigin && !isValidReferer) {
            console.warn(`⚠️ CSRF ATTEMPT: ${req.method} ${req.path} from ${origin}`);
            return res.status(403).json({
                success: false,
                message: 'CSRF验证не пройдено (неприпустиме походження запиту)',
                timestamp: new Date().toISOString()
            });
        }
    }
    next();
};

// Глобально для всіх POST/PATCH/DELETE маршрутів
router.use(basicCSRFCheck);

// Main Page
router.get('/', controller.openBaseMainPage);



// ── Profile & Settings (захищені токеном) ──────────────────
router.get   ('/api/user/profile',         controller.checkValidityAccessToken, controller.getProfile);
router.get   ('/api/user/me',              controller.checkValidityAccessToken, controller.getProfile); // backward compatible endpoint for front_index
router.patch ('/api/user/profile',         controller.checkValidityAccessToken, controller.updateProfile);
router.post  ('/api/user/avatar',          controller.checkValidityAccessToken, (req, res, next) => controller.avatarUpload.single('avatar')(req, res, next), controller.uploadAvatar);
router.post  ('/api/user/change-password', controller.checkValidityAccessToken, controller.changeUserPassword);
router.get   ('/api/user/settings',        controller.checkValidityAccessToken, controller.getUserSettings);
router.patch ('/api/user/settings',        controller.checkValidityAccessToken, controller.updateUserSettings);
router.delete('/api/user/account',         controller.checkValidityAccessToken, controller.deleteUserAccount);
 router.get('/api/user/password-status', controller.checkValidityAccessToken, controller.getPasswordStatus);


// ── Place Search & Discovery (захищеніRate Limiter від спама) ──────────────────
router.post("/api/places/autocomplete", 
    controller.checkValidityAccessToken, 
    rateLimiter.searchLimiter('autocomplete'),
    controller.autocompletePlaces);

router.post("/api/places/details", 
    controller.checkValidityAccessToken, 
    rateLimiter.searchLimiter('place-details'),
    controller.placeDetails);

router.get('/api/places/:id', 
    controller.checkValidityAccessToken, 
    rateLimiter.searchLimiter('place-get'),
    controller.getPlaceDetails);

router.post("/api/nearby/get", 
    controller.checkValidityAccessToken,
    rateLimiter.searchLimiter('nearby-search'),
    controller.getNearbyPlaces);

router.post("/api/nearby/save", 
    controller.checkValidityAccessToken,
    rateLimiter.globalLimiter('nearby-save'),
    controller.saveNearbyPlaces);

// ── Shopping Search (захищен Rate Limiter від спама) ──────────────────
router.post('/api/shopping/search',    
    controller.checkValidityAccessToken, 
    rateLimiter.searchLimiter('shop-search'),
    controller.searchShops);

router.get('/api/daily-top',         
    rateLimiter.globalLimiter('daily-top'),
    controller.getDailyTop);

router.post('/api/daily-top/refresh', 
    rateLimiter.globalLimiter('daily-top-refresh'),
    controller.refreshDailyTop);

// ── Chat Assistant (захищен Rate Limiter від spam queries) ──────────────────
router.post("/chat/assistant", 
    controller.checkValidityAccessToken,
    rateLimiter.searchLimiter('ai-chat'),
    controller.chatAssistant);

// Authentication Page
router.get('/checkUser', controller.openAuthPage);

// Email Confirmation after Registration
router.get('/api/verify-email', controller.emailVerify);
router.get('/email-confirmition', controller.openEmailConfirmation);
router.post('/resent-email', controller.resentEmail);

// Sign Up and Log in
router.post('/api/signUp', controller.signUp);
router.post('/api/logIn', controller.logIn);

// Sign Up and Login via Google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', controller.getGoogleDataAuth);

// Log Out 
router.post('/logOut', controller.checkValidityAccessToken);
router.post('/logOut', controller.logOut);

// New Main Page, after Authentification
router.use('/new-main', controller.checkValidityAccessToken);
router.get('/new-main', controller.openFullMainPage);

// Reset Password, Sending Code and Open Reset Password Page from Email
router.post('/api/resetPasword', controller.resetPasswordSentEmail);
router.get('/api/resetPasword/OpenEnterPage', controller.openResetPasswordEnterPage);

// Reset Password, Verification Code, Creating new Password and Deleting old Reset Password Code
router.post('/api/resetPassword/OpenEnterPage/checkVerificationCode', controller.checkVerificationCode);
router.post('/api/resetPassword/OpenEnterPage/creatingNewPassword', controller.creatingNewPassword);
router.post('/api/resetPassword/OpenEnterPage/deleteResetCode', controller.deletingResetCode);

router.get('/api/suggestions', controller.searchingSugges);
router.get('/api/suggestions/placeInf', controller.placeInfFromSugg);

// ── Admin: Rate Limiter Monitoring (DELETE THIS IN PRODUCTION) ──────────────────
router.get('/api/admin/rate-limiter-stats', controller.checkValidityAccessToken, (req, res) => {
    // Only admin users should access this (you may want to add role-based check)
    const stats = rateLimiter.getStats();
    res.json({
        success: true,
        message: '📊 Rate Limiter Statistics',
        timestamp: new Date().toISOString(),
        ...stats
    });
});

// ── Health Check ──────────────────
router.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is healthy',
        rateLimiterActive: true
    });
});


// Перевірка всіх зареєстрованих маршрутів
router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`Маршрут зареєстровано: ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
});
// ОДИН module.exports В КІНЦІ
module.exports = router;