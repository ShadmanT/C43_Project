require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',  // Local PostgreSQL
  database: process.env.DB_DATABASE || 'mydb',
  password: process.env.DB_PASSWORD || 'postgres', // default password
  port: process.env.DB_PORT || 5432,  // Default PostgreSQL port
});

module.exports = pool;
