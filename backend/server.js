const express = require('express');
const authRoutes = require('./routes/auth');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

const pool = require('./db'); 

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send('DB is connected. Time on server: ${result.rows[0].now}');
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
    console.error('❌ Query failed:', err);
    res.status(500).send('Query failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});