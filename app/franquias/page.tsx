import FranquiasClient from "./FranquiasClient";

export const metadata = {
  title: "Franquias | Zerey",
  description: "Explore coleções e franquias de jogos.",
};

export default function FranquiasPage() {
  // Mocking some popular franchises to avoid complex IGDB queries just for initial render
  const popularFranchises = [
    { id: 24, name: "The Legend of Zelda", games_count: 53, cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5z8s.jpg" },
    { id: 27, name: "Super Mario", games_count: 122, cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3p.jpg" },
    { id: 14, name: "Final Fantasy", games_count: 133, cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2k39.jpg" },
    { id: 58, name: "Resident Evil", games_count: 49, cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1qky.jpg" },
    { id: 12, name: "Grand Theft Auto", games_count: 17, cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg" },
    { id: 70, name: "Pokémon", games_count: 104, cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg" }
  ];

  return <FranquiasClient popularFranchises={popularFranchises} />;
}
