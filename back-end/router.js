const express = require('express'); 
const router = express.Router();
const passport = require('passport'); 
const Controller = require('./controller.js');
const controller = new Controller();
const rateLimiter = require('./middleware/rateLimiter.js');

// ════════════════════════════════════════════════════════════
//CSRF (Origin + Referer)
// ════════════════════════════════════════════════════════════

const basicCSRFCheck = (req, res, next) => {
    if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
        const origin  = req.get('origin');
        const referer = req.get('referer');
        const host    = req.get('host');

        const isValidOrigin  = !origin || origin.includes('localhost') || origin.includes(host);
        const isValidReferer = !referer || referer.includes('localhost') || referer.includes(host);
        
        if (!isValidOrigin && !isValidReferer) {
            console.warn(`⚠️ CSRF ATTEMPT: ${req.method} ${req.path} from ${origin}`);
            return res.status(403).json({
                success: false,
                message: 'CSRF перевірка не пройдена (неприпустиме походження)',
                timestamp: new Date().toISOString()
            });
        }
    }
    next();
};

router.use(basicCSRFCheck);



router.get('/', controller.openBaseMainPage);


router.get('/api/photo',    controller.proxyPlacePhoto);
router.get('/api/photo/v1', controller.proxyPlacePhotoV1);




router.post('/chat/assistant',
    controller.requireAuth,           
    rateLimiter.searchLimiter('ai-chat'),  
    controller.chatAssistant
);
router.get('/api/geocode/reverse', controller.geocodeReverse);

// ════════════════════════════════════════════════════════════
// 
// ════════════════════════════════════════════════════════════

router.get('/api/user/profile',         
    controller.checkValidityAccessToken, 
    controller.getProfile
);

router.get('/api/user/me',              
    controller.checkValidityAccessToken, 
    controller.getProfile
);

router.patch('/api/user/profile',       
    controller.checkValidityAccessToken, 
    controller.updateProfile
);

router.post('/api/user/avatar',         
    controller.checkValidityAccessToken, 
    (req, res, next) => controller.avatarUpload.single('avatar')(req, res, next), 
    controller.uploadAvatar
);

router.post('/api/user/change-password',
    controller.checkValidityAccessToken, 
    controller.changeUserPassword
);

router.get('/api/user/settings',        
    controller.checkValidityAccessToken, 
    controller.getUserSettings
);

router.patch('/api/user/settings',      
    controller.checkValidityAccessToken, 
    controller.updateUserSettings
);

router.delete('/api/user/account',      
    controller.checkValidityAccessToken, 
    controller.deleteUserAccount
);

router.get('/api/user/password-status', 
    controller.checkValidityAccessToken, 
    controller.getPasswordStatus
);




// ── Place Search & Discovery (захищеніRate Limiter від спама) ──────────────────
router.post("/api/places/autocomplete", 
    controller.checkValidityAccessToken, 
    rateLimiter.autocompleteLimiter('autocomplete'),
    controller.autocompletePlaces);

router.post("/api/places/details", 
    controller.checkValidityAccessToken, 
    rateLimiter.searchLimiter('place-details'),
    controller.placeDetails);

router.get('/api/google/place/:id', controller.getGooglePlaceDetails);
router.get('/api/google/photo', controller.getGooglePhoto);
router.post('/api/google/nearby', controller.searchGoogleNearby);

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

router.post('/api/daily-top',         
    rateLimiter.globalLimiter('daily-top'),
    controller.getDailyTop);

router.post('/api/daily-top/refresh', 
    rateLimiter.globalLimiter('daily-top-refresh'),
    controller.refreshDailyTop);


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



router.get('/api/reviews/:place_id', controller.getReviews);
router.post('/api/reviews/:id/helpful', controller.markHelpful);

router.get('/api/admin/rate-limiter-stats', controller.checkValidityAccessToken, (req, res) => {

    const stats = rateLimiter.getStats();
    res.json({
        success: true,
        message: ' Rate Limiter Statistics',
        timestamp: new Date().toISOString(),
        ...stats
    });
});

module.exports = router;