const express = require("express");
const path = require("path");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: path.resolve(__dirname, './privateInf.env') });

const app = express();
const PORT = process.env.PORT || 3500;

// CORS — працює локально і на продакшн
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3500";
app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

app.use(express.json());
app.use(cookieParser());

// Google OAuth Callback
const GOOGLE_CALLBACK_URL = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/auth/google/callback`
    : process.env.GOOGLE_CALLBACK_URL;

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
    },
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

app.use(passport.initialize());

const router = require('./router.js');
app.use('/api', router);

app.use(express.static(path.join(__dirname, '../front-end/build')));

// Всі інші маршрути віддають index.html (для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
