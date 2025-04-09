console.log("✅ stockListRoutes.js loaded");

const express = require('express');
const cors = require('cors');
const stockListRoutes = require('./routes/stockListRoutes');
const friendRoutes = require('./routes/friendRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/stocklists', stockListRoutes);
app.use('/api/friends', friendRoutes);

const pool = require('./db'); // Add this line at the top

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`DB is connected. Time on server: ${result.rows[0].now}`);
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).send('DB connection failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});