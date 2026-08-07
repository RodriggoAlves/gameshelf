import { fetchUpcomingGames, fetchRecentReleases } from "../../lib/api";
import { getLibraryGames } from "../actions/library";
import LancamentosClient from "./LancamentosClient";

export default async function LancamentosPage() {
  const [upcoming, recent, libraryGames] = await Promise.all([
    fetchUpcomingGames(),
    fetchRecentReleases(),
    getLibraryGames()
  ]);

  const libraryIds = libraryGames.map((g: any) => g.gameId);

  return (
    <LancamentosClient upcoming={upcoming} recent={recent} libraryIds={libraryIds} />
  );
}
