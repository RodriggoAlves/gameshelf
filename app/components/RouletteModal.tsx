"use client";
import { useState, useEffect } from "react";
import styles from "./roulette.module.css";
import { Game } from "../../lib/api";
import { addGameToLibrary } from "../actions/library";
import { useRouter } from "next/navigation";

export default function RouletteModal({ 
  backlogGames, 
  onClose 
}: { 
  backlogGames: { game: Game, data: any }[],
  onClose: () => void 
}) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<{ game: Game, data: any } | null>(null);

  useEffect(() => {
    if (backlogGames.length === 0) return;
    
    let spins = 0;
    const maxSpins = 20; 
    
    const interval = setInterval(() => {
      setCurrentIndex(Math.floor(Math.random() * backlogGames.length));
      spins++;
      
      if (spins >= maxSpins) {
        clearInterval(interval);
        setSpinning(false);
        const finalGame = backlogGames[Math.floor(Math.random() * backlogGames.length)];
        setSelectedGame(finalGame);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [backlogGames]);

  const handleStartPlaying = async () => {
    if (!selectedGame) return;
    await addGameToLibrary(selectedGame.game.id, { 
       ...selectedGame.data,
       status: "Jogando"
    });
    router.refresh();
    onClose();
  };

  if (backlogGames.length === 0) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <h2>Roleta Indisponível</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Você não tem nenhum jogo com o status "Quero Jogar".</p>
          <div className={styles.actions} style={{ marginTop: '20px' }}>
             <button className={styles.btnCancel} onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

  const currentGame = spinning ? backlogGames[currentIndex].game : selectedGame?.game;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>{spinning ? "🎲 Sorteando Próximo Jogo..." : "🎮 Você deveria jogar:"}</h2>
        
        <div className={`${styles.cardContainer} ${spinning ? styles.spinning : styles.done}`}>
          {currentGame?.background_image ? (
             <img src={currentGame.background_image} alt={currentGame.name} className={styles.gameImage} />
          ) : (
             <div className={styles.gameImagePlaceholder}>Sem Capa</div>
          )}
          <h3 className={styles.gameTitle}>{currentGame?.name}</h3>
        </div>

        <div className={styles.actions} style={{ marginTop: '20px' }}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          {!spinning && (
            <button className={styles.btnSave} onClick={handleStartPlaying}>
              Começar a Jogar!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
