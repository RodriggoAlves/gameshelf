"use client";

import { useState, useEffect } from "react";
import { updateUserProfile, logout } from "../actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import styles from "./profile.module.css";

const PRESET_AVATARS = [
  { name: "Cyber Hacker", url: "/avatars/hacker.jpg" },
  { name: "Dark Knight", url: "/avatars/knight.jpg" },
  { name: "Space Explorer", url: "/avatars/explorer.jpg" },
  { name: "Neon Ninja", url: "/avatars/ninja.jpg" },
  { name: "Cyber Android", url: "/avatars/android.jpg" }
];

const PRESET_COVERS = [
  { name: "Dark Setup", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop" },
  { name: "Minimalist Console", url: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2000&auto=format&fit=crop" },
  { name: "Dark Geometry", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop" },
  { name: "Black Texture", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" }
];

import { XpRing, GenreRadar, BadgesGrid, ActivityHeatmap } from "./Gamification";

export default function ProfileClient({ initialUser, stats, favorites = [], recent = [], badges = [], heatmapData = [], radarData = [] }: any) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState<"avatar" | "cover" | null>(null);
  const [tempUrl, setTempUrl] = useState("");
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.animateIn);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
    );
    
    document.querySelectorAll(`.${styles.scrollAnim}`).forEach((el) => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  async function handleSave() {
    if (!editing) return;
    
    const data = editing === "avatar" ? { avatarUrl: tempUrl } : { coverUrl: tempUrl };
    await updateUserProfile(data);
    
    setUser({ ...user, ...data });
    setEditing(null);
    setTempUrl("");
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      <div 
        className={styles.coverSection} 
        style={{ backgroundImage: user.coverUrl ? `url(${user.coverUrl})` : 'url(https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000&auto=format&fit=crop)' }}
      >
        <div className={styles.coverOverlay} />
        <button 
          className={styles.editCoverBtn}
          onClick={() => { setEditing("cover"); setTempUrl(user.coverUrl || ""); }}
        >
          {t.profile.changeCover}
        </button>
      </div>

      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          <XpRing 
            level={stats.level} 
            xp={stats.xp} 
            progressPercent={stats.progressPercent} 
            avatarUrl={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username}
          />
          <button 
            className={styles.editAvatarBtn}
            onClick={() => { setEditing("avatar"); setTempUrl(user.avatarUrl || ""); }}
          >
            {t.profile.editAvatar}
          </button>
        </div>
        
        <div className={styles.userInfo}>
          <h1 className={styles.username}>{user.username}</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Nível {stats.level} • {stats.xp} XP</p>
        </div>

        <div className={styles.headerActions}>
          <LanguageSwitcher />
          <button onClick={handleLogout} className={styles.logoutBtn}>
            {t.profile.logout}
          </button>
        </div>
      </div>

      {/* BENTO GRID PRINCIPAL */}
      <div className={styles.bentoGrid}>
        
        {/* STATS BENTO */}
        <div className={`${styles.bentoStats} ${styles.scrollAnim}`}>
          <Link href="/library" className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statValue}>{stats.gamesCount}</div>
            <div className={styles.statLabel}>{t.profile.gamesInLibrary || "Jogos"}</div>
          </Link>
          <Link href="/library" className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>{t.profile.gamesCompleted || "Zerados"}</div>
          </Link>
          <Link href="/library" className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statValue}>{stats.playtime}h</div>
            <div className={styles.statLabel}>{t.profile.playtime || "Horas"}</div>
          </Link>
        </div>

        {/* FAVORITES BENTO */}
        {favorites.length > 0 && (
          <div className={`${styles.bentoFavorites} ${styles.scrollAnim}`}>
            <h2 className={styles.sectionTitle}>⭐ {t.profile.myFavorites || "Meus Favoritos"}</h2>
            <div className={styles.favoritesGrid}>
              {[0, 1, 2, 3].map(index => {
                const game = favorites[index];
                return game ? (
                  <Link key={game.id} href={`/game/${game.id}`} className={styles.favoriteCard}>
                    <img src={game.cover || game.background_image} alt={game.name} className={styles.favoriteCover} />
                  </Link>
                ) : (
                  <div key={index} className={`${styles.favoriteCard} ${styles.emptyFavorite}`}>+</div>
                );
              })}
            </div>
          </div>
        )}

        {/* HEATMAP BENTO */}
        <div className={`${styles.bentoHeatmap} ${styles.scrollAnim}`}>
          <ActivityHeatmap data={heatmapData} />
        </div>

        {/* RECENT ACTIVITY BENTO */}
        <div className={`${styles.bentoRecent} ${styles.scrollAnim}`}>
          <h2 className={styles.sectionTitle}>⏱️ {t.profile.recentActivity || "Atividade Recente"}</h2>
          <div className={styles.recentList}>
            {recent.length > 0 ? recent.map((item: any, i: number) => (
              <Link key={i} href={`/game/${item.game.id}`} className={styles.recentItem} style={{ textDecoration: 'none' }}>
                <img src={item.game.cover || item.game.background_image} alt={item.game.name} className={styles.recentCover} />
                <div className={styles.recentInfo}>
                  <span className={styles.recentTitle}>{item.game.name}</span>
                  <span className={styles.recentStatus}>{item.status}</span>
                  <span className={styles.recentDate}>{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            )) : (
              <p style={{ color: '#888' }}>Nenhuma atividade recente.</p>
            )}
          </div>
        </div>
        
        {/* RADAR BENTO */}
        <div className={`${styles.bentoRadar} ${styles.scrollAnim}`}>
          <GenreRadar data={radarData} />
        </div>

        {/* BADGES BENTO */}
        <div className={`${styles.bentoBadges} ${styles.scrollAnim}`}>
          <BadgesGrid badges={badges} />
        </div>

      </div>

      {editing && (
        <div className={styles.modalOverlay} onClick={() => setEditing(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editing === "avatar" ? t.profile.modalTitleAvatar : t.profile.modalTitleCover}
            </h2>
            
            {editing === "avatar" && (
              <>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {t.profile.chooseAvatar}
                </p>
                <div className={styles.avatarGrid}>
                  {PRESET_AVATARS.map(avatar => (
                    <div 
                      key={avatar.name} 
                      className={`${styles.presetAvatar} ${tempUrl === avatar.url ? styles.selectedAvatar : ''}`}
                      onClick={() => setTempUrl(avatar.url)}
                      title={avatar.name}
                    >
                      <img src={avatar.url} alt={avatar.name} />
                    </div>
                  ))}
                </div>
                <div 
                  style={{ margin: '1rem 0', textAlign: 'center', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer' }}
                  onClick={() => setTempUrl("")}
                  title="Clique para digitar seu próprio link"
                >
                  {t.profile.customLink}
                </div>
              </>
            )}

            {editing === "cover" && (
              <>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Escolha uma capa predefinida:
                </p>
                <div className={styles.coverGrid}>
                  {PRESET_COVERS.map(cover => (
                    <div 
                      key={cover.name} 
                      className={`${styles.presetCover} ${tempUrl === cover.url ? styles.selectedCover : ''}`}
                      onClick={() => setTempUrl(cover.url)}
                      title={cover.name}
                    >
                      <img src={cover.url} alt={cover.name} />
                    </div>
                  ))}
                </div>
                <div 
                  style={{ margin: '1rem 0', textAlign: 'center', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer' }}
                  onClick={() => setTempUrl("")}
                  title="Clique para colar seu próprio link"
                >
                  Ou cole um link personalizado
                </div>
              </>
            )}

            {!(editing === "avatar" && PRESET_AVATARS.some(a => a.url === tempUrl)) && !(editing === "cover" && PRESET_COVERS.some(c => c.url === tempUrl)) && (
              <input 
                type="text" 
                className={styles.input}
                placeholder="https://..."
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
                autoFocus
              />
            )}
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setEditing(null)}>{t.profile.cancel}</button>
              <button className={`${styles.btn} ${styles.btnSave}`} onClick={handleSave}>{t.profile.saveImage}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
