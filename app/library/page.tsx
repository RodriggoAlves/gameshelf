import { getLibraryGames } from "../actions/library";
import { fetchGamesByIds, Game } from "../../lib/api";
import { getUser } from "../actions/auth";
import { redirect } from "next/navigation";
import LibraryClient from "./LibraryClient";
import searchStyles from "../search/search.module.css";

export default async function LibraryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

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
