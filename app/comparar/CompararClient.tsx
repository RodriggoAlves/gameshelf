"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, X, Swords } from "lucide-react";
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

  const extractTagNames = (tags: any[] | undefined) => {
    if (!tags || tags.length === 0) return [];
    return tags.map(t => typeof t === 'string' ? t : (t.name || (t.platform && t.platform.name) || '')).filter(Boolean);
  };

  const renderTags = (tags: any[] | undefined, otherTags: any[] | undefined) => {
    const names1 = extractTagNames(tags);
    const names2 = extractTagNames(otherTags);

    if (names1.length === 0) return <span>N/A</span>;
    return names1.map(tag => {
      const isMatch = names2.includes(tag);
      return (
        <span key={tag} className={`${styles.tag} ${isMatch ? styles.tagMatch : styles.tagDiff}`}>
          {tag}
        </span>
      );
    });
  };

  return (
    <div className={styles.container}>
      {!isComparing && (
        <div className={styles.minimalSearchContainer}>
          <div className={styles.minimalBentoBox}>
            
            {/* Jogo 1 */}
            <div className={styles.minimalSearchBox}>
              <div className={styles.minimalSearchHeader}>Jogo 1</div>
              {!game1 ? (
                <div style={{ position: 'relative' }}>
                  <Search size={18} className={styles.minimalSearchIcon} />
                  <input 
                    type="text" 
                    placeholder="Buscar jogo..." 
                    className={styles.minimalSearchInput}
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                  />
                  {results1.length > 0 && (
                    <div className={styles.minimalSearchResults}>
                      {results1.map(game => (
                        <div key={game.id} className={styles.minimalSearchResultItem} onClick={() => selectGame1(game)}>
                          {game.background_image && (
                            <div className={styles.minimalResultThumb}>
                              <Image src={game.background_image} alt={game.name} fill style={{ objectFit: 'cover' }} />
                            </div>
                          )}
                          <div className={styles.minimalResultText}>
                            <div className={styles.minimalResultName}>{game.name}</div>
                            <div className={styles.minimalResultYear}>{game.released ? new Date(game.released).getFullYear() : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.minimalSelected}>
                  {game1.background_image && (
                    <div className={styles.minimalSelectedThumb}>
                      <Image src={game1.background_image} alt={game1.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <span className={styles.minimalSelectedName}>{game1.name}</span>
                  <button onClick={() => { setGame1(null); setIsComparing(false); }} className={styles.minimalClearBtn}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className={styles.minimalDivider}></div>

            {/* Jogo 2 */}
            <div className={styles.minimalSearchBox}>
              <div className={styles.minimalSearchHeader}>Jogo 2</div>
              {!game2 ? (
                <div style={{ position: 'relative' }}>
                  <Search size={18} className={styles.minimalSearchIcon} />
                  <input 
                    type="text" 
                    placeholder="Buscar oponente..." 
                    className={styles.minimalSearchInput}
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                  />
                  {results2.length > 0 && (
                    <div className={styles.minimalSearchResults}>
                      {results2.map(game => (
                        <div key={game.id} className={styles.minimalSearchResultItem} onClick={() => selectGame2(game)}>
                          {game.background_image && (
                            <div className={styles.minimalResultThumb}>
                              <Image src={game.background_image} alt={game.name} fill style={{ objectFit: 'cover' }} />
                            </div>
                          )}
                          <div className={styles.minimalResultText}>
                            <div className={styles.minimalResultName}>{game.name}</div>
                            <div className={styles.minimalResultYear}>{game.released ? new Date(game.released).getFullYear() : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.minimalSelected}>
                  {game2.background_image && (
                    <div className={styles.minimalSelectedThumb}>
                      <Image src={game2.background_image} alt={game2.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <span className={styles.minimalSelectedName}>{game2.name}</span>
                  <button onClick={() => { setGame2(null); setIsComparing(false); }} className={styles.minimalClearBtn}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {/* Comparison Grid */}
      {game1 && game2 && game1.platforms && game2.platforms && (
            <div className={styles.comparisonContainer}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <button 
              onClick={() => { setGame1(null); setGame2(null); setIsComparing(false); }}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Search size={18} />
              Nova Comparação
            </button>
          </div>
          <div className={styles.heroComparison}>
            <div className={styles.heroGame}>
              <div className={styles.heroImageWrapper}>
                {game1.background_image && <Image src={game1.background_image} alt={game1.name} fill style={{ objectFit: 'cover' }} />}
              </div>
              <h2 className={styles.gameName}>{game1.name}</h2>
            </div>
            
            <div className={styles.vsIconHero}>VS</div>
            
            <div className={styles.heroGame}>
              <div className={styles.heroImageWrapper}>
                {game2.background_image && <Image src={game2.background_image} alt={game2.name} fill style={{ objectFit: 'cover' }} />}
              </div>
              <h2 className={styles.gameName}>{game2.name}</h2>
            </div>
          </div>

          <div className={styles.statsTable}>
            {/* Lançamento */}
            <div className={styles.statTableRow}>
              <div className={styles.statColLeft}>
                <span className={styles.statValue}>{game1.released ? new Date(game1.released).toLocaleDateString('pt-BR') : 'N/A'}</span>
              </div>
              <div className={styles.statColCenter}>Lançamento</div>
              <div className={styles.statColRight}>
                <span className={styles.statValue}>{game2.released ? new Date(game2.released).toLocaleDateString('pt-BR') : 'N/A'}</span>
              </div>
            </div>

            {/* Avaliação */}
            <div className={styles.statTableRow}>
              <div className={styles.statColLeft}>
                <span className={styles.statValue}>{Math.round(game1.rating || 0)} / 100</span>
                <div className={styles.ratingBarContainer}>
                  <div className={styles.ratingBarLeft} style={{ width: `${game1.rating || 0}%` }}></div>
                </div>
              </div>
              <div className={styles.statColCenter}>Avaliação (IGDB)</div>
              <div className={styles.statColRight}>
                <span className={styles.statValue}>{Math.round(game2.rating || 0)} / 100</span>
                <div className={styles.ratingBarContainer}>
                  <div className={styles.ratingBarRight} style={{ width: `${game2.rating || 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Desenvolvedoras */}
            <div className={styles.statTableRow}>
              <div className={styles.statColLeft}>
                <div className={styles.statValue}>{renderTags((game1 as any).involved_companies, (game2 as any).involved_companies)}</div>
              </div>
              <div className={styles.statColCenter}>Desenvolvedoras</div>
              <div className={styles.statColRight}>
                <div className={styles.statValue}>{renderTags((game2 as any).involved_companies, (game1 as any).involved_companies)}</div>
              </div>
            </div>

            {/* Plataformas */}
            <div className={styles.statTableRow}>
              <div className={styles.statColLeft}>
                <div className={styles.statValue}>{renderTags(game1.platforms, game2.platforms)}</div>
              </div>
              <div className={styles.statColCenter}>Plataformas</div>
              <div className={styles.statColRight}>
                <div className={styles.statValue}>{renderTags(game2.platforms, game1.platforms)}</div>
              </div>
            </div>

            {/* Gêneros */}
            <div className={styles.statTableRow}>
              <div className={styles.statColLeft}>
                <div className={styles.statValue}>{renderTags(game1.genres, game2.genres)}</div>
              </div>
              <div className={styles.statColCenter}>Gêneros</div>
              <div className={styles.statColRight}>
                <div className={styles.statValue}>{renderTags(game2.genres, game1.genres)}</div>
              </div>
            </div>

            {/* Modos de Jogo */}
            <div className={styles.statTableRow}>
              <div className={styles.statColLeft}>
                <div className={styles.statValue}>{renderTags(game1.game_modes, game2.game_modes)}</div>
              </div>
              <div className={styles.statColCenter}>Modos de Jogo</div>
              <div className={styles.statColRight}>
                <div className={styles.statValue}>{renderTags(game2.game_modes, game1.game_modes)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
