require('dotenv').config({path: '.env.local'});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const featured = await client.query('SELECT DISTINCT "entityId", section FROM "FeaturedContent"');
    const ids = [];
    const franchiseIds = [];
    
    for (const row of featured.rows) {
      if (row.section === 'FRANCHISES') {
        franchiseIds.push(parseInt(row.entityId));
      } else {
        ids.push(parseInt(row.entityId));
      }
    }

    if (ids.length > 0) {
      const tokenRes = await fetch('https://id.twitch.tv/oauth2/token?client_id='+process.env.TWITCH_CLIENT_ID+'&client_secret='+process.env.TWITCH_CLIENT_SECRET+'&grant_type=client_credentials', {method:'POST'});
      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;
      
      const query = `
        fields name, first_release_date, cover.image_id, artworks.image_id, total_rating, platforms.name, genres.name, summary, screenshots.image_id, involved_companies.company.name;
        where id = (${ids.join(',')});
        limit 500;
      `;
      const res = await fetch('https://api.igdb.com/v4/games', {
        method:'POST',
        headers:{'Client-ID': process.env.TWITCH_CLIENT_ID, 'Authorization': 'Bearer ' + token, 'Content-Type': 'text/plain'},
        body: query
      });
      const igdbGames = await res.json();
      
      for (const g of igdbGames) {
        const coverUrl = g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "";
        
        // Formatar igual as functions mapeavam antes
        const mapped = {
          id: g.id,
          name: g.name,
          released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
          background_image: coverUrl,
          hero_image: g.artworks?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.artworks[0].image_id}.jpg` : (g.screenshots?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.screenshots[0].image_id}.jpg` : ""),
          rating: g.total_rating || 0,
          platforms: g.platforms ? g.platforms.map(p => ({ platform: { id: p.id, name: p.name } })) : [],
          genres: g.genres ? g.genres.map(gen => ({ id: gen.id, name: gen.name })) : [],
          summary: g.summary || "",
          screenshots: g.screenshots ? g.screenshots.map(s => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`) : [],
          companies: g.involved_companies ? g.involved_companies.map(c => c.company?.name).filter(Boolean) : [],
        };
        
        await client.query(`
          INSERT INTO "CachedGame" (id, name, "coverUrl", data)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET name = $2, "coverUrl" = $3, data = $4, "lastSyncedAt" = CURRENT_TIMESTAMP
        `, [g.id, g.name, coverUrl, JSON.stringify(mapped)]);
      }
      console.log('Synced games:', igdbGames.length);
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
