const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();

// REGISTER
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check for existing username or email
    const existing = await pool.query(
      'SELECT username, email FROM UserAccount WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];

      if (match.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      if (match.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Fallback just in case
      return res.status(400).json({ error: 'Account already exists' });
    }

    // Register new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO UserAccount (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered', userId: result.rows[0].user_id });

  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM UserAccount WHERE email = $1 OR username = $1',
      [emailOrUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Login username or password is incorrect' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Login username or password is incorrect' });
    }

    res.json({ message: 'Login successful', userId: user.user_id });
  } catch (err) {
    console.error('❌ Login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;