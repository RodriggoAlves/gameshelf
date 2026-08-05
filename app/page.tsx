import { fetchPopularGames } from "../lib/api";
import HomeView from "./components/HomeView";
import { getLibraryGames } from "./actions/library";

export default async function Home() {
  const popularGames = await fetchPopularGames();
  const libraryGames = await getLibraryGames();
  const libraryIds = libraryGames.map((g: any) => g.gameId);
  return <HomeView popularGames={popularGames} libraryIds={libraryIds} />;
}
