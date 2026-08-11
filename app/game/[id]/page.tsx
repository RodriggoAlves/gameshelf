import Image from "next/image";
import Link from "next/link";
import { fetchGamesByIds, searchGames } from "../../../lib/api";
import { getUser } from "../../actions/auth";
import LibraryButton from "./LibraryButton";
import PlayLogButton from "./PlayLogButton";
import { getGameReviews, getReviewStats } from "../../actions/reviews";
import ReviewsSection from "./ReviewsSection";

import styles from "./game.module.css";
import { Heart, Search } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Jogo ${id} | Zerey`,
  };
}

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const id = parseInt(paramId, 10);
  
  if (isNaN(id)) {
    return <div className={styles.container}>ID de jogo inválido.</div>;
  }

  const user = await getUser();
  const games = await fetchGamesByIds([id]);
  const game = games[0];

  if (!game) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '10rem' }}>
        <h2>Jogo não encontrado</h2>
        <p style={{ color: '#888', marginTop: '1rem' }}>O jogo que você está procurando não existe na IGDB ou foi removido.</p>
        <Link href="/" style={{ color: '#10b981', marginTop: '2rem', display: 'inline-block' }}>Voltar ao Início</Link>
      </div>
    );
  }

  // Buscar similares pelo primeiro gênero
  let relatedGames = [];
  try {
    if (game.genres && game.genres.length > 0) {
      const genreNames = game.genres.map((g: any) => g.name);
      const searchRes = await searchGames(genreNames[0]);
      relatedGames = searchRes.filter((g: any) => g.id !== game.id).slice(0, 6);
    }
  } catch(e) {}

  // Busca Reviews e Estatísticas do Banco Local
  const reviews = await getGameReviews(id);
  const reviewStats = await getReviewStats(id);

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        {game.hero_image && (
          <div className={styles.heroBackground}>
            <Image 
              src={game.hero_image} 
              alt={game.name} 
              fill 
              priority
              style={{ objectFit: 'cover' }} 
            />
            <div className={styles.heroGradient} />
          </div>
        )}
        
        <div className={styles.heroContent}>
          <div className={styles.coverWrapper}>
            {game.background_image ? (
              <Image 
                src={game.background_image} 
                alt={game.name} 
                fill
                style={{ objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#222' }} />
            )}
          </div>
          
          <div className={styles.gameInfo}>
            <h1 className={styles.gameTitle}>{game.name}</h1>
            <div className={styles.metaInfo}>
              <span>{new Date(game.released).getFullYear()}</span>
              {game.rating > 0 && (
                <span className={styles.ratingBadge}>
                  <Heart size={14} fill="currentColor" /> {Math.round(game.rating)}
                </span>
              )}
            </div>
            
            <div className={styles.genres}>
              {game.genres.map((g: any) => (
                <span key={g.id} className={styles.genreTag}>{g.name}</span>
              ))}
            </div>

            <div className={styles.actionButtons}>
              <LibraryButton gameId={id} />
              <PlayLogButton gameId={id} gameName={game.name} />
              <a href="#reviews" className={styles.reviewsLinkBtn}>Ler Avaliações</a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {game.summary && (
            <div className={styles.summarySection}>
              <h2>Sobre o Jogo</h2>
              <p>{game.summary}</p>
            </div>
          )}

          {game.screenshots && game.screenshots.length > 0 && (
            <div className={styles.screenshotsSection}>
              <h2>Galeria</h2>
              <div className={styles.screenshotsGrid}>
                {game.screenshots.slice(0, 4).map((shot: string, index: number) => (
                  <div key={index} className={styles.screenshotItem}>
                    <Image src={shot} alt="Screenshot" fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção Nova de Avaliações V1 */}
          <ReviewsSection 
            gameId={id} 
            stats={reviewStats} 
            reviews={reviews} 
            currentUser={user} 
          />

        </div>

        <div className={styles.rightColumn}>
          <div className={styles.detailsBox}>
            <h3>Plataformas</h3>
            <div className={styles.platformList}>
              {game.platforms.map((p: any) => (
                <span key={p.platform.id} className={styles.platformTag}>{p.platform.name}</span>
              ))}
            </div>
          </div>
          
          <div className={styles.detailsBox}>
            <h3>Desenvolvedoras</h3>
            <ul className={styles.companyList}>
              {game.companies && game.companies.length > 0 ? (
                game.companies.map((c: string, idx: number) => (
                  <li key={idx}>{c}</li>
                ))
              ) : (
                <li>Desconhecido</li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {relatedGames.length > 0 && (
        <div className={styles.relatedSection}>
          <h2>Jogos Similares</h2>
          <div className={styles.relatedGrid}>
            {relatedGames.map((g: any) => (
              <Link href={`/game/${g.id}`} key={g.id} className={styles.relatedCard}>
                <div className={styles.relatedCover}>
                  {g.background_image ? (
                    <Image src={g.background_image} alt={g.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#222' }} />
                  )}
                </div>
                <div className={styles.relatedTitle}>{g.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
