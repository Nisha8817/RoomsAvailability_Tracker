// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { guesthouse, owner, email, contact, password } = req.body;
    if (!guesthouse || !owner || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const stmt = `INSERT INTO owners (guesthouse, owner, email, contact, password) VALUES (?, ?, ?, ?, ?)`;
    db.run(stmt, [guesthouse, owner, email, contact || '', hash], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
        return res.status(500).json({ error: err.message });
      }
      // simple response
      res.json({ message: 'Owner account created', id: this.lastID });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  db.get('SELECT * FROM owners WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // store minimal info in session
    req.session.owner = {
      id: row.id,
      guesthouse: row.guesthouse,
      owner: row.owner,
      email: row.email
    };

    res.json({ message: 'Login successful', owner: req.session.owner });
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.json({ message: 'Logged out' });
  });
});

// add in routes/auth.js
router.get('/me', (req, res) => {
  if (req.session && req.session.owner) return res.json({ owner: req.session.owner });
  res.status(401).json({ error: 'Not authenticated' });
});


router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
});

module.exports = router;
