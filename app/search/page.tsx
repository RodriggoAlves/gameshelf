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
    results = await fetchPopularGames();
  }
  
  const libraryGames = await getLibraryGames();
  const libraryIds = libraryGames.map((g: any) => g.gameId);
  
  return <SearchClient initialQuery={query} initialResults={results} libraryIds={libraryIds} />;
}
