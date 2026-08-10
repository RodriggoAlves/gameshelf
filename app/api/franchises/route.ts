import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const igdbQuery = `
      search "${query}";
      fields name, games;
      limit 20;
    `;
    const results = await igdbRequest("collections", igdbQuery);
    
    const franchises = results.filter((f: any) => f.games && f.games.length > 0).map((f: any) => ({
      id: f.id,
      name: f.name,
      games_count: f.games.length,
      first_game_id: f.games[0],
      cover_url: null
    }));

    if (franchises.length > 0) {
      const firstGameIds = franchises.map((f: any) => f.first_game_id).filter(Boolean);
      if (firstGameIds.length > 0) {
        const coverQuery = `
          fields cover.image_id, artworks.image_id;
          where id = (${firstGameIds.join(",")});
          limit ${firstGameIds.length};
        `;
        const coverResults = await igdbRequest("games", coverQuery);
        
        franchises.forEach((f: any) => {
          const gameWithCover = coverResults.find((g: any) => g.id === f.first_game_id);
          if (gameWithCover) {
            if (gameWithCover.artworks && gameWithCover.artworks.length > 0) {
              f.cover_url = `https://images.igdb.com/igdb/image/upload/t_720p/${gameWithCover.artworks[0].image_id}.jpg`;
            } else if (gameWithCover.cover && gameWithCover.cover.image_id) {
              f.cover_url = `https://images.igdb.com/igdb/image/upload/t_1080p/${gameWithCover.cover.image_id}.jpg`;
            }
          }
        });
      }
    }

    return NextResponse.json(franchises);
  } catch (error) {
    console.error("Error fetching franchises:", error);
    return NextResponse.json({ error: "Failed to fetch franchises" }, { status: 500 });
  }
}
