const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Always store SQLite in /data (Render uses this as writeable)
const dbPath = path.join(__dirname, "data", "database.sqlite");

const db = new sqlite3.Database(dbPath);


db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
            no TEXT PRIMARY KEY,
            type TEXT,
            price INTEGER,
            status TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room TEXT,
            name TEXT,
            mobile TEXT,
            advance INTEGER,
            checkIn TEXT,
            checkOut TEXT,
            status TEXT
        )
    `);
});

// ensure owners table exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guesthouse TEXT NOT NULL,
    owner TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contact TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
