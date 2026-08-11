import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignorar erro de certificado no script local

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();
  return data.access_token;
}

async function igdbRequest(endpoint, body) {
  const token = await getAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    body,
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "text/plain"
    }
  });
  return await response.json();
}

async function seedDatabase() {
  await client.connect();
  
  // 1. Seed HOME_RECOMMENDED
  const homeCount = await client.query('SELECT COUNT(*) as count FROM "FeaturedContent" WHERE section = $1', ['HOME_RECOMMENDED']);
  if (parseInt(homeCount.rows[0].count) === 0) {
    console.log("Seeding HOME_RECOMMENDED...");
    const query = `
      fields name, first_release_date, cover.image_id, total_rating;
      where cover.image_id != null & total_rating_count > 0;
      sort total_rating_count desc;
      limit 27;
    `;
    const results = await igdbRequest("games", query);
    
    for (let i = 0; i < results.length; i++) {
      const g = results[i];
      const image = g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "";
      await client.query(`
        INSERT INTO "FeaturedContent" (section, "entityId", "entityName", "entityImage", "orderIndex", "isActive")
        VALUES ($1, $2, $3, $4, $5, 1)
      `, ['HOME_RECOMMENDED', g.id.toString(), g.name, image, i + 1]);
    }
    console.log(`Inseridos ${results.length} jogos na Home.`);
  }

  // 2. Seed FRANCHISES
  const franchiseCount = await client.query('SELECT COUNT(*) as count FROM "FeaturedContent" WHERE section = $1', ['FRANCHISES']);
  if (parseInt(franchiseCount.rows[0].count) === 0) {
    console.log("Seeding FRANCHISES...");
    const franchiseNames = [
      "The Legend of Zelda", "Super Mario", "Final Fantasy", "Resident Evil", 
      "Grand Theft Auto", "Pokémon", "Call of Duty", "Assassin's Creed", 
      "Halo", "Tomb Raider", "Sonic the Hedgehog", "Metal Gear Solid", 
      "God of War", "Mortal Kombat", "Street Fighter", "The Elder Scrolls", 
      "Fallout", "Mass Effect", "The Witcher", "Dark Souls"
    ];
    
    const fQuery = `
      fields name, games;
      where name = ("${franchiseNames.join('", "')}");
      limit 20;
    `;
    const fResults = await igdbRequest("franchises", fQuery);
    
    for (let i = 0; i < fResults.length; i++) {
      const f = fResults[i];
      await client.query(`
        INSERT INTO "FeaturedContent" (section, "entityId", "entityName", "entityImage", "orderIndex", "isActive")
        VALUES ($1, $2, $3, $4, $5, 1)
      `, ['FRANCHISES', f.id.toString(), f.name, "", i + 1]);
    }
    console.log(`Inseridas ${fResults.length} franquias.`);
  }
  
  await client.end();
  console.log("Seed finalizado com sucesso!");
}

seedDatabase().catch(console.error);
