const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'traffic',
  password: 'Alg0r1thm@c#',
  port: 5432,
});

module.exports = pool;