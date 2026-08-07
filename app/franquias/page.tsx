import FranquiasClient from "./FranquiasClient";

export const metadata = {
  title: "Franquias | Zerey",
  description: "Explore coleções e franquias de jogos.",
};

export default function FranquiasPage() {
  // Mocking some popular franchises to avoid complex IGDB queries just for initial render
  const popularFranchises = [
    { id: 24, name: "The Legend of Zelda", games_count: 53 },
    { id: 27, name: "Super Mario", games_count: 122 },
    { id: 14, name: "Final Fantasy", games_count: 133 },
    { id: 58, name: "Resident Evil", games_count: 49 },
    { id: 12, name: "Grand Theft Auto", games_count: 17 },
    { id: 70, name: "Pokémon", games_count: 104 }
  ];

  return <FranquiasClient popularFranchises={popularFranchises} />;
}
