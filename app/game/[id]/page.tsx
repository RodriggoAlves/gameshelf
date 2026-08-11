import { fetchGameDetails } from "../../../lib/api";
import { notFound } from "next/navigation";
import { checkGameInLibrary, getGameTimeline } from "../../actions/library";
import LibraryButton from "./LibraryButton";
import GameTimeline from "../../components/GameTimeline";
import StarRating from "../../components/StarRating";
import { getGameReviews, getReviewStats } from "../../actions/reviews";
import ReviewsSection from "./ReviewsSection";
import styles from "./game.module.css";

export default async function GamePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const gameId = Number(params.id);
  const game = await fetchGameDetails(gameId);
  
  if (!game) {
    notFound();
  }

  const isSaved = await checkGameInLibrary(game.id);
  const events = isSaved ? await getGameTimeline(game.id) : [];
  
  // Puxar os dados do banco usando auth
  const { getUser } = await import("../../actions/auth");
  const user = await getUser();
  const db = (await import("../../../lib/db")).default;
  const userData = (isSaved && user) ? await db.get('SELECT * FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [user.id, game.id]) : null;

  // Busca as reviews e estatísticas da V1
  const reviews = await getGameReviews(game.id);
  const reviewStats = await getReviewStats(game.id);

  const bgImage = game.screenshots && game.screenshots.length > 0 
    ? game.screenshots[0] 
    : game.background_image;

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroBackground}>
          {bgImage && <img src={bgImage} alt="" className={styles.bgImg} fetchPriority="high" />}
          <div className={styles.vignetteTop} />
          <div className={styles.vignetteBottom} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.gameInfo}>
            <h1 className={styles.title}>{game.name}</h1>
            <div className={styles.metaRow}>
              {game.companies && game.companies.length > 0 && (
                <span className={styles.company}>{game.companies[0]}</span>
              )}
              <span className={styles.year}>{new Date(game.released).getFullYear()}</span>
              {game.rating > 0 && (
                <span className={styles.ratingBadge}>{Math.round(game.rating)}%</span>
              )}
            </div>
            
            <div className={styles.tagsContainer}>
              {game.genres.map((g: any) => (
                <span key={g.id} className={styles.tag}>{g.name}</span>
              ))}
            </div>

            {userData && (
              <div className={styles.userStatsRow}>
                <div className={styles.statusBadge} data-status={userData.status}>
                  {userData.status}
                </div>
                {userData.rating > 0 && (
                  <div className={styles.userRating}>
                    <StarRating value={userData.rating} readOnly={true} />
                  </div>
                )}
                {userData.progress > 0 && (
                  <div className={styles.userProgress}>
                    Progresso: {userData.progress}%
                  </div>
                )}
                {userData.playtime > 0 && (
                  <div className={styles.userPlaytime}>
                    {userData.playtime} horas
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <LibraryButton gameId={game.id} isSavedInitial={isSaved} />
              <a href="#reviews" className={styles.reviewsLinkBtn}>Ler Avaliações</a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.detailsSection}>
          <div className={styles.mainColumn}>
            
            {events && events.length > 0 && (
              <div className={styles.timelineSection}>
                <h2>Sua Jornada</h2>
                <GameTimeline events={events} />
              </div>
            )}
            
            <h2>Sobre o Jogo</h2>
            <p className={styles.summary}>{game.summary || "Nenhuma sinopse disponível para este jogo."}</p>
            
            {game.screenshots && game.screenshots.length > 0 && (
              <div className={styles.mediaSection}>
                <h2>Galeria</h2>
                <div className={styles.screenshotGrid}>
                  {game.screenshots.map((url: string, i: number) => (
                    <div key={i} className={styles.screenshotWrapper}>
                      <img src={url} alt={`Screenshot ${i + 1}`} className={styles.screenshot} loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO NOVA DE REVIEWS (V1) */}
            <ReviewsSection 
              gameId={game.id} 
              stats={reviewStats} 
              reviews={reviews} 
              currentUser={user} 
            />
          </div>
          
          <div className={styles.sideColumn}>
            <div className={styles.infoCard}>
              <h3>Plataformas</h3>
              <ul>
                {game.platforms.map((p: any) => (
                  <li key={p.platform.id}>{p.platform.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
