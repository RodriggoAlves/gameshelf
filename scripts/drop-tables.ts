import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const dropTables = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Dropping old tables to fix column casing...");
    
    await client.query(`DROP TABLE IF EXISTS "UserGame" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "PlaySession" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "TimelineEvent" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "GameTag" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Tag" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Session" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "PasswordReset" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "AccountVerification" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "User" CASCADE;`);
    
    await client.query("COMMIT");
    console.log("Tables dropped successfully! They will be recreated correctly on next boot.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error dropping tables:", err);
  } finally {
    client.release();
    pool.end();
  }
};

dropTables();
