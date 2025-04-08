const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db/index');  // Make sure this is correctly pointing to your DB module

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is up ✅');
});

// Define the /data route
app.get('/data', async (req, res) => {
  try {
    // Example query to fetch some data from your PostgreSQL database
    const result = await pool.query('SELECT * FROM testtbl'); // Change this to a valid query in your database
    res.json(result.rows); // Return the result as JSON
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
