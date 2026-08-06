import { fetchUpcomingGames, fetchRecentReleases } from "../../lib/api";
import { getLibraryGames } from "../actions/library";
import LancamentosClient from "./LancamentosClient";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default async function LancamentosPage() {
  const [upcoming, recent, libraryGames] = await Promise.all([
    fetchUpcomingGames(),
    fetchRecentReleases(),
    getLibraryGames()
  ]);

  const libraryIds = libraryGames.map((g: any) => g.gameId);

  return (
    <>
      <Header />
      <LancamentosClient upcoming={upcoming} recent={recent} libraryIds={libraryIds} />
      <Footer />
    </>
  );
}
