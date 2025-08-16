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

// API роутер (⚡ тут більше НЕ додаємо "/api")
app.use("/", router);

// Статика фронтенду
const frontEndPath = path.join(__dirname, "../front-end");
app.use(express.static(frontEndPath));

// SPA fallback — віддаємо index.html для всіх не-API запитів
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).send("API route not found");
  }
  res.sendFile(path.join(frontEndPath, "index.html"));
});

// Порт
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
