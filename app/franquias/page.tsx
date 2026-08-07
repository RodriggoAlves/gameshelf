import FranquiasClient from "./FranquiasClient";

export const metadata = {
  title: "Franquias | Zerey",
  description: "Explore coleções e franquias de jogos.",
};

import { igdbRequest } from "../../../lib/api";

export default async function FranquiasPage() {
  let popularFranchises = [];
  
  try {
    const igdbQuery = `
      fields name, games, games.cover.image_id;
      where name = ("The Legend of Zelda", "Super Mario", "Final Fantasy", "Resident Evil", "Grand Theft Auto", "Pokémon");
      limit 6;
    `;
    const results = await igdbRequest("franchises", igdbQuery);
    
    if (results && Array.isArray(results)) {
      popularFranchises = results.map((f: any) => {
        let cover_url = null;
        if (f.games && f.games.length > 0) {
          const gameWithCover = f.games.find((g: any) => g.cover && g.cover.image_id);
          if (gameWithCover) {
            cover_url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${gameWithCover.cover.image_id}.jpg`;
          }
        }
        return {
          id: f.id,
          name: f.name,
          games_count: f.games ? f.games.length : 0,
          cover_url
        };
      }).filter((f: any) => f.games_count > 0);
    }
  } catch (error) {
    console.error("Error fetching popular franchises:", error);
  }

  return <FranquiasClient popularFranchises={popularFranchises} />;
}
