import { searchGames, fetchPopularGames, Game } from "../../lib/api";
import SearchClient from "./SearchClient";
import { getLibraryGames } from "../actions/library";

export default async function SearchPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams?.q === "string" ? searchParams.q : "";
  
  let results: Game[] = [];
  if (query.trim().length > 0) {
    results = await searchGames(query);
  } else {
    const { getFeaturedContent } = await import("../actions/admin");
    const { fetchGamesByIds } = await import("../../lib/api");
    
    const cmsFeatured = await getFeaturedContent('SEARCH_FEATURED');
    const activeCms = cmsFeatured.filter((c: any) => c.isActive === 1);
    
    if (activeCms.length > 0) {
      const ids = activeCms.map((c: any) => parseInt(c.entityId));
      const fetched = await fetchGamesByIds(ids);
      results = ids.map((id: number) => fetched.find(f => f.id === id)).filter(Boolean) as Game[];
    } else {
      results = await fetchPopularGames();
    }
  }
  
  const libraryGames = await getLibraryGames();
  const libraryIds = libraryGames.map((g: any) => g.gameId);
  
  return <SearchClient initialQuery={query} initialResults={results} libraryIds={libraryIds} />;
}
