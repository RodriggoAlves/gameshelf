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
    const results = await igdbRequest("franchises", igdbQuery);
    
    const franchises = results.map((f: any) => ({
      id: f.id,
      name: f.name,
      games_count: f.games ? f.games.length : 0
    })).filter((f: any) => f.games_count > 0);

    return NextResponse.json(franchises);
  } catch (error) {
    console.error("Error fetching franchises:", error);
    return NextResponse.json({ error: "Failed to fetch franchises" }, { status: 500 });
  }
}
