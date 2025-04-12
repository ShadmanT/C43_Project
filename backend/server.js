require('dotenv').config({ path: __dirname + '/.env' });

console.log("stockListRoutes.js loaded");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const stockListRoutes = require('./routes/stockListRoutes');
const friendRoutes = require('./routes/friendRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const reviewRoutes = require('./routes/reviewRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/api/stocklists', stockListRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/reviews', reviewRoutes);

const pool = require('./db'); 

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`DB is connected. Time on server: ${result.rows[0].now}`);
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).send('DB connection failed');
  }
});

app.get('/prices', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM StockPrice LIMIT 1');
    res.json(result.rows);
  } catch (err) {
    console.error('Query failed:', err);
    res.status(500).send('Query failed');
  }
});

app.get('/symbols', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT symbol FROM StockPrice ORDER BY symbol');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load symbols');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});