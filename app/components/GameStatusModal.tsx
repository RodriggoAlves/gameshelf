"use client";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { addGameToLibrary, removeGameFromLibrary, getGameModalData } from "../actions/library";
import CustomCalendar from "./CustomCalendar";
import CustomSelect from "./CustomSelect";
import StarRating from "./StarRating";
import { useI18n } from "../contexts/I18nContext";
import styles from "./modal.module.css";

export default function GameStatusModal({ 
  gameId, 
  onClose,
  isSavedInitial,
  onSaveOptimistic,
  onRemoveOptimistic
}: { 
  gameId: number, 
  onClose: () => void,
  isSavedInitial: boolean,
  onSaveOptimistic?: (saved: boolean) => void,
  onRemoveOptimistic?: (saved: boolean) => void
}) {
  const { t } = useI18n();
  const isSaved = isSavedInitial;
  const [status, setStatus] = useState("Quero Jogar");
  const [rating, setRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platform, setPlatform] = useState("");
  const [progress, setProgress] = useState(0);
  const [playtime, setPlaytime] = useState(0);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  
  const [ownership, setOwnership] = useState("Digital");
  const [storefront, setStorefront] = useState("");
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  
  const [isPending, startTransition] = useTransition();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [gameMeta, setGameMeta] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    getGameModalData(gameId).then((data: any) => {
      if (!data) {
        // Se a resposta for nula (ex: usuário não logado ou sessão expirada)
        setIsLoading(false);
        onClose(); // Fecha o modal ou redireciona
        window.location.href = "/login";
        return;
      }
      
      setAvailablePlatforms(data.platforms || []);
      setGameMeta(data.game);
      if (data.libraryData) {
        setStatus(data.libraryData.status || "Quero Jogar");
        setRating(data.libraryData.rating || 0);
        setProgress(data.libraryData.progress || 0);
        setPlaytime(data.libraryData.playtime || 0);
        setIsFavorite(!!data.libraryData.isFavorite);
        setPlatform(data.libraryData.platform || "");
        setStartDate(data.libraryData.startDate ? data.libraryData.startDate.split('T')[0] : "");
        setEndDate(data.libraryData.endDate ? data.libraryData.endDate.split('T')[0] : "");
        setOwnership(data.libraryData.ownership || "Digital");
        setStorefront(data.libraryData.storefront || "");
        setReview(data.libraryData.review || "");
        setContainsSpoilers(!!data.libraryData.containsSpoilers);
      } else {
        if (data.platforms && data.platforms.length > 0) {
          setPlatform(data.platforms[0]);
        }
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error(err);
      setIsLoading(false);
      onClose();
    });
  }, [gameId]);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const stopProp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // UX Zero-latency: Fecha imediatamente e reflete a UI. O trabalho de rede ocorre no background.
    if (onSaveOptimistic) onSaveOptimistic(true);
    onClose();

    startTransition(async () => {
      await addGameToLibrary(gameId, { 
        status, rating, progress, playtime, isFavorite, platform, startDate, endDate, 
        ownership, storefront, containsSpoilers, review 
      });
    });
  };

  const handleRemoveCompletely = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // UX Zero-latency
    if (onRemoveOptimistic) onRemoveOptimistic(false);
    onClose();

    startTransition(async () => {
      await removeGameFromLibrary(gameId);
    });
  };

  if (isRemoving) {
    const removeContent = (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={stopProp} style={{ maxWidth: '400px', padding: '30px' }}>
          <h2>{t.modal.removeGame}</h2>
          <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
            {t.modal.removeWarning}
          </p>
          <div className={styles.footerActions} style={{ marginTop: '20px' }}>
            <button className={styles.btnCancel} onClick={() => setIsRemoving(false)}>{t.modal.cancel}</button>
            <button className={styles.btnSave} onClick={handleRemoveCompletely} style={{ background: '#e74c3c', boxShadow: 'none' }}>{t.modal.remove}</button>
          </div>
        </div>
      </div>
    );
    return mounted ? createPortal(removeContent, document.body) : null;
  }

  const modalContent = (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={stopProp}>
        
        {isLoading || !gameMeta ? (
          <div className={styles.modalContent} style={{ padding: '40px 20px', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
               <div style={{ width: '80px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <div style={{ width: '60%', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                 <div style={{ width: '40%', height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
               </div>
            </div>
            <div style={{ width: '100%', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            <div style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            <style>{`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
            `}</style>
          </div>
        ) : (
          <>
            <div className={styles.modalGrid}>
              
              {/* SIDEBAR COL (Capa, Título, Favoritar) */}
              <div className={styles.sidebar}>
                <img src={gameMeta.cover} alt={gameMeta.name} className={styles.heroCover} />
                <div className={styles.sidebarTitles}>
                  <h2 className={styles.heroTitle}>{gameMeta.name}</h2>
                  <span className={styles.heroYear}>{gameMeta.year}</span>
                </div>
                
                <button 
                  className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorite(!isFavorite); }}
                  title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                >
                  {isFavorite ? '⭐ Favorito' : '☆ Favoritar'}
                </button>
              </div>

              {/* MAIN CONTENT COL */}
              <div className={styles.mainScroll}>
                <div className={styles.statusChips}>
                  {(!gameMeta.released || new Date(gameMeta.released) <= new Date()) ? (
                    <>
                      <button className={`${styles.chip} ${status === 'Zerey' ? styles.active : ''}`} onClick={() => setStatus('Zerey')}>
                        {t.modal.statusZerey}
                      </button>
                      <button className={`${styles.chip} ${status === 'Platinado' ? styles.active : ''}`} onClick={() => setStatus('Platinado')}>
                        {t.modal.statusPlatinum}
                      </button>
                      <button className={`${styles.chip} ${status === '100%' ? styles.active : ''}`} onClick={() => setStatus('100%')}>
                        {t.modal.status100}
                      </button>
                      <button className={`${styles.chip} ${status === 'Jogando' ? styles.active : ''}`} onClick={() => setStatus('Jogando')}>
                        {t.modal.statusPlaying}
                      </button>
                    </>
                  ) : null}
                  <button className={`${styles.chip} ${status === 'Quero Jogar' ? styles.active : ''}`} onClick={() => setStatus('Quero Jogar')}>
                    {t.modal.statusBacklog}
                  </button>
                  <button className={`${styles.chip} ${status === 'Próximo Jogo' ? styles.active : ''}`} onClick={() => setStatus('Próximo Jogo')}>
                    {t.modal.statusNext}
                  </button>
                  {(!gameMeta.released || new Date(gameMeta.released) <= new Date()) ? (
                    <button className={`${styles.chip} ${status === 'Dropado' ? styles.active : ''}`} onClick={() => setStatus('Dropado')}>
                      {t.modal.statusDropped}
                    </button>
                  ) : null}
                </div>

                {!['Quero Jogar', 'Próximo Jogo'].includes(status) && (
                  <div className={styles.starBlock}>
                    <span className={styles.starLabel}>{t.modal.yourVerdict}</span>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                )}

                <div className={styles.journeyCard}>
                  <div className={styles.journeyHeader}>
                    <span style={{ fontSize: '20px' }}>🗓️</span>
                    <h3>{t.modal.theJourney}</h3>
                  </div>
                  <CustomCalendar 
                    startDate={startDate}
                    endDate={endDate}
                    onDateChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </div>

                <div className={styles.progressCard}>
                  <div className={styles.progressRow}>
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>{t.modal.yourProgress}</span>
                        <span className={styles.progressValue}>{progress}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={progress} 
                        onChange={e => setProgress(Number(e.target.value))}
                        className={styles.rangeSlider}
                      />
                    </div>
                    
                    <div className={styles.hoursSection}>
                      <span className={styles.progressLabel}>{t.modal.hours}</span>
                      <div className={styles.hoursInputWrapper}>
                        <input 
                          type="number" 
                          min="0" 
                          value={playtime || ''} 
                          onChange={e => setPlaytime(Number(e.target.value))}
                          className={styles.cleanInput}
                          placeholder="0"
                        />
                        <span className={styles.hoursSuffix}>h</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailCard}>
                    <label>{t.modal.platform}</label>
                    <CustomSelect 
                      options={availablePlatforms.length === 0 ? ["-"] : availablePlatforms}
                      value={platform || "-"}
                      onChange={val => setPlatform(val === "-" ? "" : val)}
                    />
                  </div>
                  <div className={styles.detailCard}>
                    <label>{t.modal.media}</label>
                    <CustomSelect 
                      options={[t.modal.digital, t.modal.physical, t.modal.subscription]}
                      value={ownership || t.modal.digital}
                      onChange={setOwnership}
                    />
                  </div>
                  <div className={styles.detailCard}>
                    <label>{t.modal.store}</label>
                    <CustomSelect 
                      options={["-", "PlayStation Store", "PlayStation Plus", "Steam", "Xbox Store", "Game Pass", "Nintendo eShop"]}
                      value={storefront || "-"}
                      onChange={val => setStorefront(val === "-" ? "" : val)}
                    />
                  </div>
                </div>

                {!['Quero Jogar', 'Próximo Jogo'].includes(status) && (
                  <div className={styles.reviewCard}>
                    <label className={styles.reviewLabel}>{t.modal.yourDiary} / Análise</label>
                    <textarea 
                      className={styles.reviewArea} 
                      placeholder={t.modal.diaryPlaceholder}
                      value={review}
                      onChange={e => setReview(e.target.value)}
                    />
                    <div className={styles.spoilerRow}>
                      <input type="checkbox" id="spoilers" checked={containsSpoilers} onChange={e => setContainsSpoilers(e.target.checked)} />
                      <label htmlFor="spoilers">{t.modal.containsSpoilers}</label>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS (Grid Area) */}
              <div className={styles.footerActions}>
                {isSaved && (
                  <button className={styles.btnRemove} onClick={() => setIsRemoving(true)}>
                    {t.modal.removeFromLibrary}
                  </button>
                )}
                <div className={styles.footerRight}>
                  <button className={styles.btnCancel} onClick={handleClose}>{t.modal.cancel}</button>
                  <button className={styles.btnSave} onClick={handleSave} disabled={isPending}>
                    {isPending ? t.modal.saving : t.modal.saveRecord}
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
