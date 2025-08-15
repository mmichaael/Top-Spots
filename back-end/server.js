const express = require("express");
const app = express();
const path = require("path");
const router = require("./router.js");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: path.resolve(__dirname, "./privateInf.env") });

// CORS для продакшн
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(express.json());

app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

app.use(cookieParser());

// API та роутер
app.use("/", router);

// Роздача статичних файлів фронтенду
app.use(express.static(path.join(__dirname, "../front-end")));

// Всі інші маршрути віддають index.html (для SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end", "index.html"));
});

// Порт
const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
