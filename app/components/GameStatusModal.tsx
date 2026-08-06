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
  isSavedInitial 
}: { 
  gameId: number, 
  onClose: () => void,
  isSavedInitial: boolean 
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

    startTransition(async () => {
      await addGameToLibrary(gameId, { 
        status, rating, progress, playtime, isFavorite, platform, startDate, endDate, 
        ownership, storefront, containsSpoilers, review 
      });
      onClose();
    });
  };

  const handleRemoveCompletely = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await removeGameFromLibrary(gameId);
      onClose();
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
          <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Conectando com os servidores Zerey...</div>
        ) : (
          <>
            {/* HERO BACKGROUND */}
            <div className={styles.heroBg} style={{ backgroundImage: `url(${gameMeta.cover})` }}></div>

            <div className={styles.modalContent}>
              
              {/* BLOCO 1: HERO & STATUS */}
              <div className={styles.heroInfo}>
                <img src={gameMeta.cover} alt={gameMeta.name} className={styles.heroCover} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                  <h2 className={styles.heroTitle} style={{ margin: 0 }}>
                    {gameMeta.name} <span className={styles.heroYear}>({gameMeta.year})</span>
                  </h2>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorite(!isFavorite); }}
                    style={{ 
                      background: isFavorite ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)', 
                      border: isFavorite ? '1px solid gold' : '1px solid rgba(255,255,255,0.2)', 
                      color: isFavorite ? 'gold' : '#fff',
                      cursor: 'pointer', 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s',
                      boxShadow: isFavorite ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none'
                    }}
                    title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                  >
                    {isFavorite ? '⭐ Favorito' : '☆ Favoritar'}
                  </button>
                </div>
                
                <div className={styles.statusChips}>
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
                  <button className={`${styles.chip} ${status === 'Quero Jogar' ? styles.active : ''}`} onClick={() => setStatus('Quero Jogar')}>
                    {t.modal.statusBacklog}
                  </button>
                  <button className={`${styles.chip} ${status === 'Próximo Jogo' ? styles.active : ''}`} onClick={() => setStatus('Próximo Jogo')}>
                    {t.modal.statusNext}
                  </button>
                  <button className={`${styles.chip} ${status === 'Dropado' ? styles.active : ''}`} onClick={() => setStatus('Dropado')}>
                    {t.modal.statusDropped}
                  </button>
                </div>
              </div>

              {/* BLOCO 1.5: ESTRELAS */}
              <div className={styles.starBlock}>
                <span className={styles.starLabel}>{t.modal.yourVerdict}</span>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* BLOCO 2: A JORNADA (CALENDÁRIO) */}
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

              {/* BLOCO 2.5: PROGRESSO & HORAS */}
              <div className={styles.progressCard}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* PROGRESSO */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  
                  {/* HORAS */}
                  <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className={styles.progressLabel}>{t.modal.hours}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '6px 12px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={playtime || ''} 
                        onChange={e => setPlaytime(Number(e.target.value))}
                        className={styles.cleanInput}
                        style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold' }}
                        placeholder="0"
                      />
                      <span style={{ color: '#888', fontWeight: 'bold' }}>h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCO 3: DETALHES TÉCNICOS */}
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

              {/* BLOCO 4: REVIEW */}
              <div className={styles.reviewCard}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>{t.modal.yourDiary}</label>
                <textarea 
                  className={styles.reviewArea} 
                  placeholder={t.modal.diaryPlaceholder}
                  value={review}
                  onChange={e => setReview(e.target.value)}
                />
                <div className={styles.spoilerRow}>
                  <input type="checkbox" id="spoilers" checked={containsSpoilers} onChange={e => setContainsSpoilers(e.target.checked)} />
                  <label htmlFor="spoilers" style={{ fontSize: '0.85rem', color: '#aaa', cursor: 'pointer' }}>{t.modal.containsSpoilers}</label>
                </div>
              </div>

              {/* FOOTER */}
              <div className={styles.footerActions}>
                {isSaved && (
                  <div style={{ flex: 1 }}>
                    <button className={styles.btnCancel} style={{ color: '#e74c3c', padding: 0 }} onClick={() => setIsRemoving(true)}>
                      {t.modal.removeFromLibrary}
                    </button>
                  </div>
                )}
                <button className={styles.btnCancel} onClick={handleClose}>{t.modal.cancel}</button>
                <button className={styles.btnSave} onClick={handleSave} disabled={isPending}>
                  {isPending ? t.modal.saving : t.modal.saveRecord}
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
