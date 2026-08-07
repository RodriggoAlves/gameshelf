import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  const ids = idsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  if (ids.length !== 2) {
    return NextResponse.json({ error: "Exactly 2 valid IDs are required" }, { status: 400 });
  }

  try {
    const query = `
      fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name, involved_companies.company.name, game_modes.name, themes.name;
      where id = (${ids.join(',')});
    `;
    const results = await igdbRequest("games", query);

    const games = results.map((g: any) => ({
      id: g.id,
      name: g.name,
      released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : null,
      background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
      rating: g.total_rating || 0,
      platforms: g.platforms ? g.platforms.map((p: any) => p.name) : [],
      genres: g.genres ? g.genres.map((gen: any) => gen.name) : [],
      companies: g.involved_companies ? g.involved_companies.map((c: any) => c.company?.name).filter(Boolean) : [],
      game_modes: g.game_modes ? g.game_modes.map((m: any) => m.name) : [],
      themes: g.themes ? g.themes.map((t: any) => t.name) : [],
    }));

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 });
  }
}
