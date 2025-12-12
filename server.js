const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const db = require("./db");
const session = require('express-session');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// SESSION (warning normal hai, ignore for now)
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
}));

// --- FIX FOR RENDER: serve static frontend files ---
app.use(express.static(path.join(__dirname)));

// ROUTES
app.use("/rooms", require("./routes/rooms"));
app.use("/bookings", require("./routes/bookings"));
app.use("/auth", require("./routes/auth"));

// --- FIX: fallback route for index.html ---
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
