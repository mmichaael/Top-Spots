const express = require('express'); 
const router = express.Router();
const passport = require('passport'); 
const Controller = require('./controller.js');
const controller = new Controller();

// Main Page
router.get('/', controller.openBaseMainPage);



// ── Profile & Settings (захищені токеном) ──────────────────
router.get   ('/api/user/profile',         controller.checkValidityAccessToken, controller.getProfile);
router.patch ('/api/user/profile',         controller.checkValidityAccessToken, controller.updateProfile);
router.post  ('/api/user/avatar',          controller.checkValidityAccessToken, (req, res, next) => controller.avatarUpload.single('avatar')(req, res, next), controller.uploadAvatar);
router.post  ('/api/user/change-password', controller.checkValidityAccessToken, controller.changeUserPassword);
router.get   ('/api/user/settings',        controller.checkValidityAccessToken, controller.getUserSettings);
router.patch ('/api/user/settings',        controller.checkValidityAccessToken, controller.updateUserSettings);
router.delete('/api/user/account',         controller.checkValidityAccessToken, controller.deleteUserAccount);
 router.get('/api/user/password-status', controller.checkValidityAccessToken, controller.getPasswordStatus);


router.post("/api/places/autocomplete", controller.autocompletePlaces);
router.post("/api/places/details", controller.placeDetails);
router.get('/api/places/:id', controller.getPlaceDetails);
router.post("/api/nearby/get", controller.getNearbyPlaces);
router.post("/api/nearby/save", controller.saveNearbyPlaces);

// Chat Assistant
router.post("/chat/assistant", controller.chatAssistant);

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


// Перевірка всіх зареєстрованих маршрутів
router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`Маршрут зареєстровано: ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
});
// ОДИН module.exports В КІНЦІ
module.exports = router;