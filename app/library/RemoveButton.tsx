"use client";

import { useTransition } from "react";
import { toggleGameInLibrary } from "../actions/library";
import styles from "../components/quickadd.module.css";

export default function RemoveButton({ gameId }: { gameId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Confirmação simples
    if (!window.confirm("Deseja realmente remover este jogo da biblioteca?")) {
      return;
    }

    startTransition(async () => {
      await toggleGameInLibrary(gameId);
    });
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isPending}
      className={styles.button}
      style={{ background: 'rgba(230, 57, 70, 0.8)', borderColor: 'rgba(230, 57, 70, 0.4)' }}
      title="Remover da Biblioteca"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  );
}
