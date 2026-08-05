"use client";

import { useState } from "react";
import { updateUserProfile, logout } from "../actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "./profile.module.css";

const PRESET_AVATARS = [
  { name: "Cyber Hacker", url: "/avatars/hacker.jpg" },
  { name: "Dark Knight", url: "/avatars/knight.jpg" },
  { name: "Space Explorer", url: "/avatars/explorer.jpg" },
  { name: "Neon Ninja", url: "/avatars/ninja.jpg" },
  { name: "Cyber Android", url: "/avatars/android.jpg" }
];

import { XpRing, GenreRadar, BadgesGrid, ActivityHeatmap } from "./Gamification";

export default function ProfileClient({ initialUser, stats, favorites = [], recent = [], badges = [], heatmapData = [], radarData = [] }: any) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState<"avatar" | "cover" | null>(null);
  const [tempUrl, setTempUrl] = useState("");
  const router = useRouter();
  const { t } = useI18n();

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

        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {t.profile.logout}
        </button>
      </div>

      <div className={styles.statsRow}>
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

      <div className={styles.gamificationRow}>
        <ActivityHeatmap data={heatmapData} />
      </div>

      <div className={styles.hubGrid}>
        {favorites.length > 0 && (
          <div className={styles.favoritesSection}>
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

        <BadgesGrid badges={badges} />

        <div className={styles.recentSection}>
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
        
        <GenreRadar data={radarData} />
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
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {t.profile.pasteDirectLink}
              </p>
            )}

            {!(editing === "avatar" && PRESET_AVATARS.some(a => a.url === tempUrl)) && (
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
