require('dotenv').config({path: '.env.local'});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("Migrando avaliações da tabela UserGame para GameReview...");
  const client = await pool.connect();
  
  try {
    const userGames = await client.query(`
      SELECT "userId", "gameId", "rating", "review", "platform", "playtime", "status", "containsSpoilers"
      FROM "UserGame"
      WHERE "rating" IS NOT NULL OR "review" IS NOT NULL OR "review" != ''
    `);
    
    let count = 0;
    
    for (const row of userGames.rows) {
      let progressStatus = 'PLAYING';
      if (row.status === 'Zerei' || row.status === 'Platinei') progressStatus = 'COMPLETED';
      else if (row.status === 'Abandonei') progressStatus = 'ABANDONED';
      else if (row.status === 'Joguei') progressStatus = 'PARTIALLY_PLAYED';
      
      const score = row.rating ? (row.rating > 10 ? 10 : (row.rating < 0 ? 0 : row.rating)) : null;

      await client.query(`
        INSERT INTO "GameReview" ("userId", "gameId", "score", "reviewText", "platform", "playedHours", "progressStatus", "containsSpoiler")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("userId", "gameId") DO NOTHING
      `, [
        row.userId, 
        row.gameId, 
        score, 
        row.review || null, 
        row.platform || null,
        row.playtime || null,
        progressStatus,
        row.containsSpoilers || 0
      ]);
      count++;
    }
    
    console.log(`✅ Migração concluída. ${count} avaliações migradas com sucesso!`);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
