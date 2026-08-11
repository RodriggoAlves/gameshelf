import { fetchPopularGames, fetchGamesByIds } from "../lib/api";
import HomeView from "./components/HomeView";
import { getLibraryGames } from "./actions/library";
import { getFeaturedContent } from "./actions/admin";

export default async function Home() {
  const libraryGames = await getLibraryGames();
  const libraryIds = libraryGames.map((g: any) => g.gameId);
  
  const cmsRecommended = await getFeaturedContent('HOME_RECOMMENDED');
  const activeCms = cmsRecommended.filter((c: any) => c.isActive === 1);
  
  let popularGames = [];
  if (activeCms.length > 0) {
    const ids = activeCms.map((c: any) => parseInt(c.entityId));
    const fetched = await fetchGamesByIds(ids);
    // Preservar a ordem configurada no painel
    popularGames = ids.map((id: number) => fetched.find(f => f.id === id)).filter(Boolean);
  } else {
    popularGames = await fetchPopularGames();
  }

  return <HomeView popularGames={popularGames} libraryIds={libraryIds} />;
}
