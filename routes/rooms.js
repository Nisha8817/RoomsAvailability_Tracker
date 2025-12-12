const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all rooms
router.get("/", (req, res) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Insert default rooms (only once)
router.post("/seed", (req, res) => {
    const rooms = [
        ["S1","Single",800,"available"],
        ["S2","Single",800,"available"],
        ["S3","Single",800,"available"],
        ["S4","Single",800,"available"],
        ["S5","Single",800,"available"],
        ["D1","Double",1200,"available"],
        ["D2","Double",1200,"available"],
        ["D3","Double",1200,"available"],
        ["D4","Double",1200,"available"],
        ["T1","Triple",1500,"available"],
        ["BHK1","1BHK",2500,"available"],
        ["BHK2","2BHK",3500,"available"]
    ];

    rooms.forEach(r => {
        db.run("INSERT OR IGNORE INTO rooms(no,type,price,status) VALUES(?,?,?,?)", r);
    });

    res.json({ message: "Rooms added successfully" });
});

module.exports = router;
