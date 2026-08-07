import { NextResponse } from 'next/server';
import { searchGames } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchGames(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching search data:", error);
    return NextResponse.json({ error: "Failed to fetch search data" }, { status: 500 });
  }
}
