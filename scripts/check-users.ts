import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const checkUsers = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM "User"');
    console.log("Users in DB:", res.rows);
    
    const verif = await client.query('SELECT * FROM "AccountVerification"');
    console.log("Verifications in DB:", verif.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

checkUsers();
