const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dvdrental',
  password: 'YOUR_PASSW0RD',
  port: 5432,
});

module.exports = pool;