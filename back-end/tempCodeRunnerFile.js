const express = require("express");
const app = express();
const path = require("path");
const router = require("./router.js");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: path.resolve(__dirname, "./privateInf.env") });

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Passport Google OAuth
app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// API роутер
app.use("/api", router); // всi твої API запити повинні починатися з /api

// Статика фронтенду
const frontEndPath = path.join(__dirname, "../Front-end");
app.use(express.static(frontEndPath));

// SPA fallback — віддаємо index.html тільки для маршрутів без крапки
app.get("*", (req, res) => {
  if (req.path.includes(".")) {
    // Якщо це файл (.js, .css, .png...) — повертаємо 404
    return res.status(404).send("File not found");
  }
  res.sendFile(path.join(frontEndPath, "index.html"));
});










// Порт
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
