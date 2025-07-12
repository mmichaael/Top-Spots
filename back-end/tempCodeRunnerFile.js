const express = require("express");
const app = express()
const path = require('path')
const router = require('./router.js')
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.resolve(__dirname, './privateInf.env') });

app.use(cors({
    origin: 'http://localhost:3500',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

app.use(express.json());

app.use(passport.initialize());
passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        function (accessToken, refreshToken, profile, done) {
            return done(null, profile);
        },
    ),
);


app.use(cookieParser());

// Статичні файли
app.use(express.static(path.join(__dirname, '../Front-end'), { cacheControl: false, etag: false, maxAge: 0 }));

// Роутер
app.use('/', router);   

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
