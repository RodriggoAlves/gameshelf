import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '');
  const year = parseInt(searchParams.get('year') || '');

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
  }

  // Calculate start and end timestamps for the month
  const startTimestamp = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(year, month, 1).getTime() / 1000) - 1;

  const query = `
    fields game.name, game.cover.image_id, game.total_rating, game.genres.name, date, human, platform.name;
    where date >= ${startTimestamp} & date <= ${endTimestamp} & game.cover.image_id != null;
    sort date asc;
    limit 100;
  `;

  try {
    const results = await igdbRequest('release_dates', query);

    const grouped: { [key: number]: any } = {};
    
    for (const r of results) {
      if (!r.game) continue;
      
      const dateObj = new Date(r.date * 1000);
      const day = dateObj.getDate();
      
      if (!grouped[day]) {
        grouped[day] = { 
          date: dateObj.toISOString(), 
          day, 
          games: [] 
        };
      }
      
      // Avoid duplicates on the same day if a game releases on multiple platforms
      const existingGame = grouped[day].games.find((g: any) => g.id === r.game.id);
      
      if (existingGame) {
        if (r.platform) existingGame.platforms.push(r.platform);
      } else {
        grouped[day].games.push({
          id: r.game.id,
          name: r.game.name,
          cover_url: r.game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${r.game.cover.image_id}.jpg` : "",
          rating: r.game.total_rating || 0,
          genres: r.game.genres || [],
          platforms: r.platform ? [r.platform] : []
        });
      }
    }

    return NextResponse.json({ releases: Object.values(grouped) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
