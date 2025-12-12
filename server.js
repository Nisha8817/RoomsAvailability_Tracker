const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const db = require("./db");

const app = express();

const FRONTEND = "http://127.0.0.1:5500"; // your front-end URL

// -------- FIXED CORS ---------
app.use(cors({
    origin: FRONTEND,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Preflight (OPTIONS) handler
app.options("*", cors({
    origin: FRONTEND,
    credentials: true
}));

// ---------- Sessions ----------
app.use(session({
    name: "guesthouse.sid",
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: false,
        sameSite: "lax"
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Static ----------
app.use("/", express.static(path.join(__dirname, "public")));

// ---------- Routes ----------
app.use("/rooms", require("./routes/rooms"));
app.use("/bookings", require("./routes/bookings"));
app.use("/auth", require("./routes/auth"));

const PORT = 5000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
