const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dvdrental',
  password: 'YOUR_PASSWORD', // replace with your actual password
  port: 5432,
});

module.exports = pool;