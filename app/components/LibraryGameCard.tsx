import Link from "next/link";
import Image from "next/image";
import { Game } from "../../lib/api";
import styles from "./librarycard.module.css";
import QuickAddButton from "./QuickAddButton";

export default function LibraryGameCard({ game, libraryData }: { game: Game, libraryData: any }) {
  const statusColors: Record<string, string> = {
    "Quero Jogar": "#f39c12",
    "Próximo Jogo": "#9b59b6",
    "Jogando": "#3498db",
    "Pausado": "#e67e22",
    "Zerey": "#00f0ff",
    "Platinado": "#f1c40f",
    "100%": "#1abc9c",
    "Dropado": "#e74c3c",
    "Rejogar": "#34495e"
  };

  const badgeColor = statusColors[libraryData?.status] || "#95a5a6";
  const progress = libraryData?.progress || 0;
  const isPlatinum = libraryData?.status === "Platinado" || libraryData?.status === "100%";
  const progressColor = isPlatinum ? "#b026ff" : badgeColor;

  return (
    <Link href={`/game/${game.id}`} className={styles.card}>
      <QuickAddButton gameId={game.id} isSavedInitial={true} />
      
      {libraryData?.isFavorite ? (
         <div className={styles.favoriteBadge}>★</div>
      ) : null}

      <div className={styles.imageWrapper} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
        {game.background_image ? (
          <Image 
            src={game.background_image} 
            alt={game.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 250px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.placeholder}>Sem Capa</div>
        )}
        <div className={styles.statusBadge} style={{ backgroundColor: badgeColor }}>
          {libraryData?.status || "Na Biblioteca"}
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>
          {isPlatinum && <span title="Platinado / 1000G" style={{ marginRight: '6px', filter: 'drop-shadow(0 0 5px #b026ff)' }}>🏆</span>}
          {game.name}
        </h3>
        <div className={styles.meta}>
          {libraryData?.rating > 0 ? (
             <span style={{ color: '#f1c40f', fontSize: '1.1rem', textShadow: '0 0 5px rgba(241,196,15,0.3)', letterSpacing: '2px' }}>
                {'★'.repeat(Math.min(5, Math.round((libraryData.rating > 10 ? Math.round(libraryData.rating / 10) : libraryData.rating) / 2)))}
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>{'★'.repeat(Math.max(0, 5 - Math.round((libraryData.rating > 10 ? Math.round(libraryData.rating / 10) : libraryData.rating) / 2)))}</span>
             </span>
          ) : (
             <span className={styles.year}>{new Date(game.released).getFullYear()}</span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className={styles.progressContainer} title={`Progresso: ${progress}%`}>
           <div 
             className={styles.progressBar} 
             style={{ 
               width: `${progress}%`, 
               backgroundColor: progressColor,
               boxShadow: isPlatinum ? '0 0 10px #b026ff' : 'none' 
             }}>
           </div>
        </div>
      </div>
    </Link>
  );
}
