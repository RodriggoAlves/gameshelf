import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const verifyUser = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('UPDATE "User" SET "isVerified" = 1 WHERE email = $1', ['rodriggoalvesareba@gmail.com']);
    console.log("User verified manually. Rows affected:", res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

verifyUser();
