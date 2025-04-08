const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
console.log("DB user from .env:", process.env.DB_USER);

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: false,
});

module.exports = pool;