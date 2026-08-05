"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Game } from "../../lib/api";
import LibraryGameCard from "../components/LibraryGameCard";
import RouletteModal from "../components/RouletteModal";
import CustomSelect from "../components/CustomSelect";
import { useI18n } from "../contexts/I18nContext";
import styles from "./library.module.css";

export default function LibraryClient({ 
  games, 
  libraryDataList 
}: { 
  games: Game[], 
  libraryDataList: any[] 
}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>(t.library.sortMostRecent);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);

  const libraryItems = useMemo(() => {
    return libraryDataList
      .filter(data => data.isArchived === 0)
      .map(data => ({
        data,
        game: games.find(g => g.id === data.gameId)
      }))
      .filter(item => item.game !== undefined) as { data: any, game: Game }[];
  }, [games, libraryDataList]);

  const filteredItems = useMemo(() => {
    let result = libraryItems.filter(item => {
      if (showFavoritesOnly && !item.data.isFavorite) return false;
      if (statusFilter && item.data.status !== statusFilter) return false;
      if (platformFilter && item.data.platform !== platformFilter) return false;
      if (searchQuery && !item.game!.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === t.library.sortHighestZerey) return (b.data.rating || 0) - (a.data.rating || 0);
      if (sortBy === t.library.sortReleaseDate) return new Date(b.game.released).getTime() - new Date(a.game.released).getTime();
      if (sortBy === t.library.sortAlphabetical) return a.game.name.localeCompare(b.game.name);
      return b.game.id - a.game.id; // recent fallback
    });

    return result;
  }, [libraryItems, searchQuery, statusFilter, showFavoritesOnly, platformFilter, sortBy]);

  const uniqueStatuses = Array.from(new Set(libraryItems.map(i => i.data.status)));
  const uniquePlatforms = Array.from(new Set(libraryItems.filter(i => i.data.platform).map(i => i.data.platform))).sort() as string[];

  const playing = libraryItems.filter(i => i.data.status === "Jogando");
  const backlog = libraryItems.filter(i => i.data.status === "Quero Jogar" || i.data.status === "Próximo Jogo");
  const heroGame = playing.length > 0 ? playing[0] : (libraryItems.length > 0 ? libraryItems[0] : null);

  // Dashboard Stats
  const totalGames = libraryItems.length;
  const zereys = libraryItems.filter(i => ["Zerey", "Platinado", "100%"].includes(i.data.status)).length;
  const ratedGames = libraryItems.filter(i => i.data.rating && i.data.rating > 0);
  const avgRating = ratedGames.length > 0 ? Math.round(ratedGames.reduce((acc, curr) => acc + curr.data.rating, 0) / ratedGames.length) : 0;
  const genreCounts: Record<string, number> = {};
  libraryItems.forEach(i => {
    i.game.genres?.forEach(g => {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
    });
  });
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nenhum";

  const renderFocusMode = () => {
    if (!heroGame) return null;
    return (
      <div className={styles.focusContainer}>
        <div className={styles.focusHeader}>
          <button className={styles.btnExitFocus} onClick={() => setIsFocusMode(false)}>{t.library.exitFocus}</button>
        </div>
        <div className={styles.focusContent}>
          <h1 className={styles.focusTitle}>{t.library.focusMode}</h1>
          <p className={styles.focusSubtitle}>{t.library.reduceDistractions}</p>
          <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
            <LibraryGameCard game={heroGame.game!} libraryData={heroGame.data} />
          </div>
        </div>
      </div>
    );
  };

  if (libraryItems.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>{t.library.emptyLibrary}</h2>
        <p>{t.library.exploreGames}</p>
      </div>
    );
  }

  if (isFocusMode) {
    return renderFocusMode();
  }

  return (
    <div className={styles.container}>
      
      {/* HERO SECTION */}
      {heroGame && !searchQuery && !statusFilter && (
        <section 
          className={styles.hero} 
          style={{ backgroundImage: `url(${heroGame.game.hero_image || heroGame.game.background_image})` }}
        >
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{heroGame.game.name}</h1>
            <p className={styles.heroMeta}>
              {heroGame.data.status} • {heroGame.data.progress || 0}% Concluído
            </p>
            <div className={styles.heroButtons}>
              <button className={styles.btnPlay} onClick={() => setIsFocusMode(true)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg>
                {heroGame.data.status === "Jogando" ? t.library.continuePlaying : t.library.enterFocusMode}
              </button>
              <button className={styles.btnFocusHero} onClick={() => setShowRoulette(true)}>
                 {t.library.whatToPlay}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* DASHBOARD STATS */}
      {!searchQuery && !statusFilter && !platformFilter && (
        <div className={styles.dashboard}>
          <div className={styles.dashCard}>
            <span className={styles.dashValue}>{totalGames}</span>
            <span className={styles.dashLabel}>{t.library.gamesInCollection}</span>
          </div>
          <div className={styles.dashCard}>
            <span className={styles.dashValue}>{zereys}</span>
            <span className={styles.dashLabel}>{t.library.gamesCleared}</span>
          </div>
          <div className={styles.dashCard}>
            <span className={styles.dashValue}>{avgRating > 0 ? avgRating : '-'}</span>
            <span className={styles.dashLabel}>{t.library.averageRating}</span>
          </div>
          <div className={styles.dashCard}>
            <span className={styles.dashValue} style={{ fontSize: '1.2rem', marginTop: '6px' }}>{topGenre}</span>
            <span className={styles.dashLabel}>{t.library.favoriteGenre}</span>
          </div>
        </div>
      )}

      {/* NAVBAR / FILTERS */}
      <nav className={styles.navBar}>
        <div className={styles.filterGroup}>
          <button 
            className={(statusFilter === null && !showFavoritesOnly) ? styles.activeFilter : ""} 
            onClick={() => { setStatusFilter(null); setShowFavoritesOnly(false); }}
          >
            {t.library.filterAll}
          </button>
          <button 
            className={showFavoritesOnly ? styles.activeFilter : ""} 
            onClick={() => { setShowFavoritesOnly(true); setStatusFilter(null); }}
          >
            {t.library.filterFavorites}
          </button>
          {uniqueStatuses.map(status => (
            <button 
              key={status} 
              className={(statusFilter === status && !showFavoritesOnly) ? styles.activeFilter : ""}
              onClick={() => { setStatusFilter(status); setShowFavoritesOnly(false); }}
            >
              {status}
            </button>
          ))}
          
          <CustomSelect 
            compact
            options={[t.library.platformAll, ...uniquePlatforms]} 
            value={platformFilter || t.library.platformAll} 
            onChange={val => setPlatformFilter(val === t.library.platformAll ? null : val)} 
          />
        </div>

        <div className={styles.toolsGroup}>
          <CustomSelect 
            compact
            options={[t.library.sortMostRecent, t.library.sortHighestZerey, t.library.sortReleaseDate, t.library.sortAlphabetical]}
            value={sortBy}
            onChange={setSortBy}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className={styles.selectFilter} 
              style={{ background: viewMode === 'grid' ? 'white' : '', color: viewMode === 'grid' ? 'black' : '' }}
              onClick={() => setViewMode('grid')}
              title="Grid"
            >🔲</button>
            <button 
              className={styles.selectFilter} 
              style={{ background: viewMode === 'list' ? 'white' : '', color: viewMode === 'list' ? 'black' : '' }}
              onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
              title="Lista"
            >📄</button>
            <button 
              className={styles.selectFilter} 
              style={{ background: viewMode === 'timeline' ? 'white' : '', color: viewMode === 'timeline' ? 'black' : '', fontWeight: 'bold' }}
              onClick={() => setViewMode(v => v === 'timeline' ? 'grid' : 'timeline')}
              title="Hall da Fama"
            >🏆 Timeline</button>
          </div>

          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder={t.library.searchPlaceholder} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT GRID */}
      <main className={styles.content}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyContainer}>{t.library.noGamesFound}</div>
        ) : viewMode === 'timeline' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '20px 4%', borderLeft: '3px solid var(--primary-color, #2ecc71)', marginLeft: '20px' }}>
            {filteredItems.filter(i => ["Zerey", "Platinado", "100%"].includes(i.data.status))
              .sort((a, b) => {
                const dateA = a.data.endDate ? new Date(a.data.endDate).getTime() : 0;
                const dateB = b.data.endDate ? new Date(b.data.endDate).getTime() : 0;
                return dateB - dateA; // Ordena do mais recente finalizado para o mais antigo
              })
              .map(item => (
              <div key={item.game!.id} style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ position: 'absolute', left: '-33px', top: '10px', width: '15px', height: '15px', borderRadius: '50%', background: 'white', border: '3px solid var(--primary-color, #2ecc71)' }}></div>
                <div style={{ width: '120px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                  <img src={item.game!.background_image || ''} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>{item.game!.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                    {item.data.startDate || item.data.endDate ? (
                      <>
                        {t.library.period} {item.data.startDate ? new Date(item.data.startDate).toLocaleDateString() : '?'} 
                        {t.library.until} 
                        {item.data.endDate ? new Date(item.data.endDate).toLocaleDateString() : '?'}
                      </>
                    ) : (
                      t.library.unregisteredPeriod
                    )}
                  </p>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {item.data.status} • {item.data.rating ? `${item.data.rating > 10 ? Math.round(item.data.rating / 10) : item.data.rating}/10` : t.library.noRating} {item.data.playtime ? `• ⏱️ ${item.data.playtime}h` : ''}
                  </span>
                </div>
              </div>
            ))}
            {filteredItems.filter(i => ["Zerey", "Platinado", "100%"].includes(i.data.status)).length === 0 && (
              <p style={{ color: '#999' }}>{t.library.noClearedGames}</p>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className={styles.list}>
            {filteredItems.map(item => (
              <Link href={`/game/${item.game!.id}`} key={item.game!.id} className={styles.listItem}>
                <div className={styles.listImage}>
                  <img src={item.game!.background_image || ''} alt="" />
                </div>
                <div className={styles.listInfo}>
                  <h3>{item.game!.name}</h3>
                  <p>{new Date(item.game!.released).getFullYear()}</p>
                </div>
                  <div className={styles.listStatus}>
                    <span className={styles.listBadge} data-status={item.data.status}>{item.data.status}</span>
                  </div>
                  <div className={styles.listProgress}>
                    {item.data.progress ? `${item.data.progress}%` : '-'}
                  </div>
                  <div className={styles.listRating}>
                    {item.data.rating > 0 ? (
                      <span style={{ color: '#f1c40f', fontSize: '1.2rem', textShadow: '0 0 5px rgba(241,196,15,0.3)', letterSpacing: '2px' }}>
                        {'★'.repeat(Math.min(5, Math.round((item.data.rating > 10 ? Math.round(item.data.rating / 10) : item.data.rating) / 2)))}
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>{'★'.repeat(Math.max(0, 5 - Math.round((item.data.rating > 10 ? Math.round(item.data.rating / 10) : item.data.rating) / 2)))}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>N/A</span>
                    )}
                  </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredItems.map(item => (
              <LibraryGameCard key={item.game!.id} game={item.game!} libraryData={item.data} />
            ))}
          </div>
        )}
      </main>

      {showRoulette && (
        <RouletteModal 
          backlogGames={backlog} 
          onClose={() => setShowRoulette(false)} 
        />
      )}
    </div>
  );
}
