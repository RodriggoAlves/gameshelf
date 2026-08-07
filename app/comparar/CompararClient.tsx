"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import styles from "./comparar.module.css";

interface CompareGame {
  id: number;
  name: string;
  released: string | null;
  background_image: string;
  rating: number;
  platforms: string[];
  genres: string[];
  companies: string[];
  game_modes: string[];
  themes: string[];
}

interface SearchResult {
  id: number;
  name: string;
  background_image: string;
  released: string;
}

export default function CompararClient() {
  const [game1, setGame1] = useState<CompareGame | null>(null);
  const [game2, setGame2] = useState<CompareGame | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [results1, setResults1] = useState<SearchResult[]>([]);
  const [results2, setResults2] = useState<SearchResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Debounced search for slot 1
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search1.trim().length > 2) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(search1)}`);
          if (res.ok) {
            const data = await res.json();
            setResults1(data);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setResults1([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search1]);

  // Debounced search for slot 2
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search2.trim().length > 2) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(search2)}`);
          if (res.ok) {
            const data = await res.json();
            setResults2(data);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setResults2([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search2]);

  // Fetch comparison data when both games are selected
  useEffect(() => {
    if (game1?.id && game2?.id && !isComparing) {
      const fetchComparison = async () => {
        setIsComparing(true);
        try {
          const res = await fetch(`/api/compare?ids=${game1.id},${game2.id}`);
          if (res.ok) {
            const data = await res.json();
            const g1 = data.find((g: any) => g.id === game1.id);
            const g2 = data.find((g: any) => g.id === game2.id);
            if (g1) setGame1(g1);
            if (g2) setGame2(g2);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchComparison();
    }
  }, [game1?.id, game2?.id, isComparing]);

  const selectGame1 = (game: SearchResult) => {
    setGame1(game as unknown as CompareGame);
    setSearch1("");
    setResults1([]);
    setIsComparing(false); // trigger re-fetch of comparison data
  };

  const selectGame2 = (game: SearchResult) => {
    setGame2(game as unknown as CompareGame);
    setSearch2("");
    setResults2([]);
    setIsComparing(false); // trigger re-fetch of comparison data
  };

  const renderTags = (tags: string[], otherTags: string[] = []) => {
    if (!tags || tags.length === 0) return <span>N/A</span>;
    return tags.map(tag => {
      const isMatch = otherTags.includes(tag);
      return (
        <span key={tag} className={`${styles.tag} ${isMatch ? styles.tagMatch : styles.tagDiff}`}>
          {tag}
        </span>
      );
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Comparador de Jogos</h1>

      <div className={styles.selectorContainer}>
        {/* Game 1 Selector */}
        <div className={styles.searchBox}>
          {!game1 ? (
            <>
              <input 
                type="text" 
                placeholder="Buscar primeiro jogo..." 
                className={styles.searchInput}
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
              />
              {results1.length > 0 && (
                <div className={styles.searchResults}>
                  {results1.map(game => (
                    <div key={game.id} className={styles.searchResultItem} onClick={() => selectGame1(game)}>
                      {game.background_image && (
                        <div style={{ width: 40, height: 50, position: 'relative' }}>
                          <Image src={game.background_image} alt={game.name} fill style={{ objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{game.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {game.released ? new Date(game.released).getFullYear() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.selectedGameInfo}>
              <div className={styles.selectedGameImage}>
                {game1.background_image && <Image src={game1.background_image} alt={game1.name} fill style={{ objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{game1.name}</h3>
              </div>
              <button onClick={() => { setGame1(null); setIsComparing(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Game 2 Selector */}
        <div className={styles.searchBox}>
          {!game2 ? (
            <>
              <input 
                type="text" 
                placeholder="Buscar segundo jogo..." 
                className={styles.searchInput}
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
              />
              {results2.length > 0 && (
                <div className={styles.searchResults}>
                  {results2.map(game => (
                    <div key={game.id} className={styles.searchResultItem} onClick={() => selectGame2(game)}>
                      {game.background_image && (
                        <div style={{ width: 40, height: 50, position: 'relative' }}>
                          <Image src={game.background_image} alt={game.name} fill style={{ objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{game.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {game.released ? new Date(game.released).getFullYear() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.selectedGameInfo}>
              <div className={styles.selectedGameImage}>
                {game2.background_image && <Image src={game2.background_image} alt={game2.name} fill style={{ objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{game2.name}</h3>
              </div>
              <button onClick={() => { setGame2(null); setIsComparing(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      {game1 && game2 && isComparing && game1.platforms && game2.platforms && (
        <div className={styles.comparisonContainer}>
          {/* Column 1 */}
          <div className={styles.compareColumn}>
            <div className={styles.heroImageWrapper}>
              {game1.background_image && <Image src={game1.background_image} alt={game1.name} fill style={{ objectFit: 'cover' }} />}
            </div>
            <h2 className={styles.gameName}>{game1.name}</h2>
            
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Lançamento</span>
              <span className={styles.statValue}>{game1.released ? new Date(game1.released).toLocaleDateString('pt-BR') : 'N/A'}</span>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Avaliação (IGDB)</span>
              <span className={styles.statValue}>{Math.round(game1.rating || 0)} / 100</span>
              <div className={styles.ratingBarContainer}>
                <div className={styles.ratingBar} style={{ width: `${game1.rating || 0}%` }}></div>
              </div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Desenvolvedoras</span>
              <div className={styles.statValue}>{renderTags(game1.companies, game2.companies)}</div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Plataformas</span>
              <div className={styles.statValue}>{renderTags(game1.platforms, game2.platforms)}</div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Gêneros</span>
              <div className={styles.statValue}>{renderTags(game1.genres, game2.genres)}</div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Modos de Jogo</span>
              <div className={styles.statValue}>{renderTags(game1.game_modes, game2.game_modes)}</div>
            </div>
          </div>

          {/* Column 2 */}
          <div className={styles.compareColumn}>
            <div className={styles.heroImageWrapper}>
              {game2.background_image && <Image src={game2.background_image} alt={game2.name} fill style={{ objectFit: 'cover' }} />}
            </div>
            <h2 className={styles.gameName}>{game2.name}</h2>
            
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Lançamento</span>
              <span className={styles.statValue}>{game2.released ? new Date(game2.released).toLocaleDateString('pt-BR') : 'N/A'}</span>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Avaliação (IGDB)</span>
              <span className={styles.statValue}>{Math.round(game2.rating || 0)} / 100</span>
              <div className={styles.ratingBarContainer}>
                <div className={styles.ratingBar} style={{ width: `${game2.rating || 0}%` }}></div>
              </div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Desenvolvedoras</span>
              <div className={styles.statValue}>{renderTags(game2.companies, game1.companies)}</div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Plataformas</span>
              <div className={styles.statValue}>{renderTags(game2.platforms, game1.platforms)}</div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Gêneros</span>
              <div className={styles.statValue}>{renderTags(game2.genres, game1.genres)}</div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Modos de Jogo</span>
              <div className={styles.statValue}>{renderTags(game2.game_modes, game1.game_modes)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
