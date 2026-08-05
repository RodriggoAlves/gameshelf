"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Game } from "../../lib/api";
import { useI18n } from "../contexts/I18nContext";
import QuickAddButton from "../components/QuickAddButton";
import styles from "./search.module.css";

export default function SearchClient({ initialQuery, initialResults, libraryIds }: { initialQuery: string, initialResults: Game[], libraryIds: number[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);

  // Reseta o estado de loading quando os resultados chegarem do servidor
  useEffect(() => {
    setIsSearching(false);
  }, [initialQuery, initialResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t.nav.search}</h1>
      
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input 
          type="text" 
          className={styles.searchInput}
          placeholder="Busque por um jogo (ex: Zelda, The Last of Us)..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className={styles.searchButton} disabled={isSearching}>
          {isSearching ? "..." : "Buscar"}
        </button>
      </form>

      {initialQuery && initialResults.length === 0 && !isSearching && (
        <p className={styles.noResults}>Nenhum jogo encontrado para "{initialQuery}".</p>
      )}

      {initialResults.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            {initialQuery ? `Resultados para "${initialQuery}"` : "Em alta agora"}
          </h2>
          <div className={styles.searchGrid}>
          {initialResults.map(game => (
            <Link href={`/game/${game.id}`} key={game.id} className={styles.gameCard}>
              <QuickAddButton gameId={game.id} isSavedInitial={libraryIds.includes(game.id)} />
              <div className={styles.gameImage} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
                {game.background_image ? (
                  <Image 
                    src={game.background_image} 
                    alt={game.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 250px"
                    style={{ objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Sem Capa</div>
                )}
              </div>
              <div className={styles.gameInfo}>
                <h3 className={styles.gameTitle}>{game.name}</h3>
                <div className={styles.gameMeta}>
                  <span className={styles.gameYear}>{new Date(game.released).getFullYear()}</span>
                  <span className={styles.gameRating}>{Math.round(game.rating)} / 100</span>
                </div>
              </div>
            </Link>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
