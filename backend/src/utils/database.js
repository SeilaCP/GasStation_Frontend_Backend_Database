const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dvdrental',
  password: 'your_password', // replace with your actual password
  port: 5432,
});

module.exports = pool;