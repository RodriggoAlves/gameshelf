import FranquiasClient from "./FranquiasClient";

export const metadata = {
  title: "Franquias | Zerey",
  description: "Explore coleções e franquias de jogos.",
};

export const dynamic = "force-dynamic";

import { igdbRequest } from "../../lib/api";

export default async function FranquiasPage() {
  let popularFranchises: any[] = [];
  
  try {
    const igdbQuery = `
      fields name, games;
      where name = ("The Legend of Zelda", "Super Mario", "Final Fantasy", "Resident Evil", "Grand Theft Auto", "Pokémon", "Call of Duty", "Assassin's Creed", "Halo", "Tomb Raider", "Sonic the Hedgehog", "Metal Gear Solid", "God of War", "Mortal Kombat", "Street Fighter", "The Elder Scrolls", "Fallout", "Mass Effect", "The Witcher", "Dark Souls");
      limit 20;
    `;
    const results = await igdbRequest("collections", igdbQuery);
    
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
            fields cover.image_id, artworks.image_id;
            where id = (${firstGameIds.join(",")});
            limit ${firstGameIds.length};
          `;
          const coverResults = await igdbRequest("games", coverQuery);
          
          popularFranchises.forEach((f: any) => {
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
    }
  } catch (error) {
    console.error("Error fetching popular franchises:", error);
  }

  return <FranquiasClient popularFranchises={popularFranchises} />;
}
