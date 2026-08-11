const { Pool } = require('pg');
require('dotenv').config({path: '.env.local'});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
pool.query('SELECT "gameId", rating, review FROM "UserGame" ORDER BY "updatedAt" DESC LIMIT 5')
  .then(res => { console.log(res.rows); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
