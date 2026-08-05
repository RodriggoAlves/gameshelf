"use client";

import { useState } from "react";
import styles from "./quickadd.module.css";
import GameStatusModal from "./GameStatusModal";

export default function QuickAddButton({ gameId, isSavedInitial }: { gameId: number, isSavedInitial: boolean }) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className={`${styles.button} ${isSavedInitial ? styles.saved : ""}`}
        title={isSavedInitial ? "Editar Jogo" : "Adicionar à Biblioteca"}
      >
        {isSavedInitial ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        )}
      </button>

      {showModal && (
        <GameStatusModal 
          gameId={gameId} 
          isSavedInitial={isSavedInitial}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
