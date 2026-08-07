import { NextResponse } from 'next/server';
import { igdbRequest, fetchGamesByIds } from '../../../../lib/api';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const query = `
      fields name, games;
      where id = ${id};
    `;
    const results = await igdbRequest("franchises", query);

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
    }

    const franchise = results[0];
    const gameIds = franchise.games || [];
    
    const games = await fetchGamesByIds(gameIds);
    
    // Sort chronologically
    games.sort((a, b) => new Date(a.released).getTime() - new Date(b.released).getTime());

    return NextResponse.json({
      id: franchise.id,
      name: franchise.name,
      games: games
    });
  } catch (error) {
    console.error("Error fetching franchise details:", error);
    return NextResponse.json({ error: "Failed to fetch franchise details" }, { status: 500 });
  }
}
