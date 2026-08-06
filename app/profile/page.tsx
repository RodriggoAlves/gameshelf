import { getUser } from "../actions/auth";
import { redirect } from "next/navigation";
import db from "../../lib/db";
import ProfileClient from "./ProfileClient";
import styles from "./profile.module.css";
import { fetchGamesByIds, Game } from "../../lib/api";
import { calculateLevelAndXP, calculateBadges, generateHeatmapData, generateRadarData } from "../../lib/stats";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all user games for XP and Stats
  const userGames = await db.all('SELECT * FROM "UserGame" WHERE "userId" = $1 ORDER BY "updatedAt" DESC', [user.id]);
  
  // Calculate basic stats manually or from userGames
  const completed = userGames.filter((g: any) => ['Zerey', 'Platinado', '100%'].includes(g.status)).length;
  const playtime = userGames.reduce((acc: number, g: any) => acc + (g.playtime || 0), 0);
  const reviewsCount = userGames.filter((g: any) => g.review && g.review.trim().length > 0).length;

  const { level, xp, nextLevelXp, progressPercent } = calculateLevelAndXP(userGames);

  const stats = {
    gamesCount: userGames.length,
    playtime,
    completed,
    reviews: reviewsCount,
    level,
    xp,
    nextLevelXp,
    progressPercent
  };

  // Fetch all sessions for Heatmap and Badges
  const sessions = await db.all('SELECT * FROM "PlaySession" WHERE "userId" = $1', [user.id]);
  
  // Fetch details for ALL unique games to get Genres (for Radar and Badges)
  const allGameIds = Array.from(new Set(userGames.map(g => g.gameId)));
  let fetchedGames: Game[] = [];
  
  // To avoid IGDB limits or long load times, we fetch up to 500
  if (allGameIds.length > 0) {
    fetchedGames = await fetchGamesByIds(allGameIds.slice(0, 500));
  }

  // Build map for quick access
  const gameDetailsMap: Record<number, Game> = {};
  const allGenresSet = new Set<string>();
  fetchedGames.forEach(g => {
    gameDetailsMap[g.id] = g;
    if (g.genres) g.genres.forEach(gen => allGenresSet.add(gen.name));
  });

  const badges = calculateBadges(userGames, sessions, Array.from(allGenresSet));
  const heatmapData = generateHeatmapData(sessions);
  const radarData = generateRadarData(userGames, gameDetailsMap);

  // Favorites & Recent
  const favoritesRows = userGames.filter(g => g.isFavorite).slice(0, 4);
  const recentRows = userGames.slice(0, 5); // Already sorted by updatedAt DESC

  const favorites = favoritesRows.map(r => gameDetailsMap[r.gameId]).filter(Boolean);
  const recent = recentRows.map(r => ({
    game: gameDetailsMap[r.gameId],
    status: r.status,
    updatedAt: r.updatedAt
  })).filter(r => r.game);

  return (
    <div className={styles.container}>
      <ProfileClient 
        initialUser={user} 
        stats={stats} 
        favorites={favorites} 
        recent={recent} 
        badges={badges}
        heatmapData={heatmapData}
        radarData={radarData}
      />
    </div>
  );
}
