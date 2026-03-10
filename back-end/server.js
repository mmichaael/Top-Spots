
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "./privateInf.env") });


const router = require("./router.js");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const GoogleStrategy = require("passport-google-oauth20").Strategy;


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
app.use(cookieParser());

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




app.get('/api/google-maps-key', (req, res) => {
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'Google API key not configured' });
  }
  res.json({ key: process.env.GOOGLE_API_KEY });
});

app.use("/", router); 







app.use(express.static(path.join(__dirname, "../front-end")));

// --- HTML-файли окремо ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end/html/index.html"));
});

app.get("/city_page.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end/html/city_page.html"));
});

// --- Сервер    ---
const PORT = process.env.PORT || 3500;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
