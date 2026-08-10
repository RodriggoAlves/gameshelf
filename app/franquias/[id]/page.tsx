import FranchiseDetailClient from "./FranchiseDetailClient";
import { igdbRequest, fetchGamesByIds } from "../../../lib/api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return {
    title: `Franquia | Zerey`,
  };
}

export const dynamic = "force-dynamic";

export default async function FranchiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const id = parseInt(paramId, 10);
  
  if (isNaN(id)) {
    return <FranchiseDetailClient franchise={null} />;
  }

  let data = null;
  try {
    const query = `
      fields name, games;
      where id = ${id};
    `;
    const results = await igdbRequest("collections", query);

    if (results && results.length > 0) {
      const franchise = results[0];
      const gameIds = franchise.games || [];
      
      let games = await fetchGamesByIds(gameIds);
      
      // Sort chronologically
      games.sort((a, b) => new Date(a.released).getTime() - new Date(b.released).getTime());

      data = {
        id: franchise.id,
        name: franchise.name,
        games: games
      };
    }
  } catch (error) {
    console.error("Failed to fetch franchise details", error);
  }

  return <FranchiseDetailClient franchise={data} />;
}
