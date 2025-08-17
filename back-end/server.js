const express = require("express");
const path = require("path");
const router = require("./router.js");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config({ path: path.resolve(__dirname, "./privateInf.env") });

const app = express();
   

// --- CORS ---
app.use(cors({
  origin: "http://localhost:3500",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// --- JSON ---
app.use(express.json());

// --- Passport (Google OAuth) ---
app.use(passport.initialize());
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

// --- Статичні файли Front-end ---
app.use(express.static(path.join(__dirname, "../front-end"))); 

// --- API роутер ---
app.use("/api", router); 
app.use("/", router);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end/html/index.html"));
});

// --- Сервер ---
const PORT = process.env.PORT || 3500;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
