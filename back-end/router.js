const express = require('express'); 
const router = express.Router();
const passport = require('passport'); 
const Controller = require('./controller.js');
const controller = new Controller();

// Main Page
router.get('/', controller.openBaseMainPage);

    router.post("/places/autocomplete", controller.autocompletePlaces);
router.post("/places/details", controller.placeDetails);


router.post("/chat/assistant", controller.chatAssistant);



// Authentification Page
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

//Reset Password, Sendining Code and Open  Reset Passsword Page from Email
router.post('/api/resetPasword', controller.resetPasswordSentEmail);
router.get('/api/resetPasword/OpenEnterPage', controller.openResetPasswordEnterPage);

//Reset Password, Verification Code, Creating new Password and Deleting old Reset Password Code
router.post('/api/resetPassword/OpenEnterPage/checkVerificationCode', controller.checkVerificationCode);
router.post('/api/resetPassword/OpenEnterPage/creatingNewPassword', controller.creatingNewPassword);
router.post('/api/resetPassword/OpenEnterPage/deleteResetCode', controller.deletingResetCode);

router.get('/api/suggestions', controller.searchingSugges);
router.get('/api/suggestions/placeInf', controller.placeInfFromSugg);






// router.get('/api/city', getCityInfo);
// router.post('/api/city/review', addReview);

// Error Page for All Error Routs
router.use('*', controller.openErrorPage);

module.exports = router;