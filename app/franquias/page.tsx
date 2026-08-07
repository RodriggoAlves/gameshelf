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
      fields name, games;
      where name = ("The Legend of Zelda", "Super Mario", "Final Fantasy", "Resident Evil", "Grand Theft Auto", "Pokémon");
      limit 6;
    `;
    const results = await igdbRequest("franchises", igdbQuery);
    
    if (results && Array.isArray(results)) {
      popularFranchises = results.filter((f: any) => f.games && f.games.length > 0).map((f: any) => ({
        id: f.id,
        name: f.name,
        games_count: f.games.length,
        first_game_id: f.games[0],
        cover_url: null
      }));

      if (popularFranchises.length > 0) {
        const firstGameIds = popularFranchises.map((f: any) => f.first_game_id).filter(Boolean);
        if (firstGameIds.length > 0) {
          const coverQuery = `
            fields cover.image_id;
            where id = (${firstGameIds.join(",")});
            limit ${firstGameIds.length};
          `;
          const coverResults = await igdbRequest("games", coverQuery);
          
          popularFranchises.forEach((f: any) => {
            const gameWithCover = coverResults.find((g: any) => g.id === f.first_game_id);
            if (gameWithCover && gameWithCover.cover && gameWithCover.cover.image_id) {
              f.cover_url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${gameWithCover.cover.image_id}.jpg`;
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching popular franchises:", error);
  }

  return <FranquiasClient popularFranchises={popularFranchises} />;
}
