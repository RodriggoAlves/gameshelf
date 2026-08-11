import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { igdbRequest } from "../../../../lib/api";

export const dynamic = "force-dynamic"; // Nunca fazer cache estático desta rota
export const maxDuration = 60; // Next.js: Permite até 60s para terminar a requisição (útil se o plano Vercel suportar)

export async function GET(req: Request) {
  // Autenticação básica simples (opcional, pode ser baseada no Authorization Bearer token da Vercel)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = { updatedGames: 0, updatedFranchises: 0 };
    
    // Sincroniza Jogos que não foram sincronizados há mais de 3 dias
    const outdatedGames = await db.all(`
      SELECT id FROM "CachedGame" 
      WHERE "lastSyncedAt" < CURRENT_TIMESTAMP - INTERVAL '3 days'
      ORDER BY "lastSyncedAt" ASC
      LIMIT 20
    `);

    if (outdatedGames.length > 0) {
      const ids = outdatedGames.map(g => g.id);
      const query = `
        fields name, first_release_date, cover.image_id, artworks.image_id, screenshots.image_id, total_rating, platforms.name, genres.name;
        where id = (${ids.join(",")});
        limit ${ids.length};
      `;
      const igdbGames = await igdbRequest("games", query);
      
      for (const game of igdbGames) {
        const coverUrl = game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : "";
        await db.run(`
          UPDATE "CachedGame" SET name = $1, "coverUrl" = $2, data = $3, "lastSyncedAt" = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [game.name, coverUrl, JSON.stringify(game), game.id]);
        results.updatedGames++;
      }
    }

    // Sincroniza Franquias
    const outdatedFranchises = await db.all(`
      SELECT id FROM "CachedFranchise" 
      WHERE "lastSyncedAt" < CURRENT_TIMESTAMP - INTERVAL '3 days'
      ORDER BY "lastSyncedAt" ASC
      LIMIT 10
    `);

    if (outdatedFranchises.length > 0) {
      const ids = outdatedFranchises.map(f => f.id);
      const query = `
        fields name, games;
        where id = (${ids.join(",")});
        limit ${ids.length};
      `;
      const igdbFranchises = await igdbRequest("franchises", query);
      
      for (const franchise of igdbFranchises) {
        await db.run(`
          UPDATE "CachedFranchise" SET name = $1, "gamesCount" = $2, "lastSyncedAt" = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [franchise.name, franchise.games ? franchise.games.length : 0, franchise.id]);
        results.updatedFranchises++;
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
