const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all bookings
router.get("/", (req, res) => {
    db.all("SELECT * FROM bookings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create new booking
router.post("/", (req, res) => {
    const { room, name, mobile, advance, checkIn, checkOut } = req.body;

    db.run(
        `INSERT INTO bookings (room, name, mobile, advance, checkIn, checkOut, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [room, name, mobile, advance, checkIn, checkOut, "Booked"],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Booking created", id: this.lastID });
        }
    );
});


// Check availability
router.post("/availability", (req, res) => {
    const { roomType, checkIn, checkOut } = req.body;

    const queryRooms = `
        SELECT * FROM rooms
        WHERE type = ? OR ? = 'Any'
    `;

    db.all(queryRooms, [roomType, roomType], (err, rooms) => {
        if (err) return res.status(500).json({ error: err.message });

        const queryBookings = `
            SELECT * FROM bookings
            WHERE datetime(checkIn) < datetime(?)
            AND datetime(checkOut) > datetime(?)
`;


        db.all(queryBookings, [checkOut, checkIn], (err2, bookedRooms) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const bookedNos = bookedRooms.map(b => b.room);

            const available = rooms.filter(r => !bookedNos.includes(r.no));

            res.json(available);
        });
    });
});


// Check-in
router.put("/:id/checkin", (req, res) => {
    db.run("UPDATE bookings SET status='Checked-In' WHERE id=?", [req.params.id], function(err){
        if(err) return res.status(500).json({ error: err.message });
        res.json({ message: "Checked In" });
    });
});

// Check-out
router.put("/:id/checkout", (req, res) => {
    console.log("CHECKOUT ROUTE CALLED at", new Date());
    const now = new Date();
    
    // Format to "YYYY-MM-DD HH:MM:SS"
    const current =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + " " +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0");

    db.run(
        "UPDATE bookings SET status='Checked-Out', checkOut=? WHERE id=?",
        [current, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Early Check-out Updated", checkOut: current });
        }
    );
});

router.delete("/:id", (req, res) => {
    db.run("DELETE FROM bookings WHERE id=?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Booking Deleted" });
    });
});

module.exports = router;
