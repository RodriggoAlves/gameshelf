import { getLibraryGames } from "../actions/library";
import { fetchGamesByIds, Game } from "../../lib/api";
import LibraryClient from "./LibraryClient";
import searchStyles from "../search/search.module.css";

export default async function LibraryPage() {
  const libraryGamesData = await getLibraryGames();
  const gameIds = libraryGamesData.map(g => g.gameId);
  
  let games: Game[] = [];
  if (gameIds.length > 0) {
    games = await fetchGamesByIds(gameIds);
  }

  return (
    <div style={{ width: '100%' }}>
      <LibraryClient games={games} libraryDataList={libraryGamesData} />
    </div>
  );
}
