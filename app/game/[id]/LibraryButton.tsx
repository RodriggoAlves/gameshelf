"use client";

import { useState } from "react";
import styles from "./game.module.css";
import GameStatusModal from "../../components/GameStatusModal";

export default function LibraryButton({ gameId, isSavedInitial }: { gameId: number, isSavedInitial: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={isSavedInitial ? styles.secondaryButton : "button-primary"}
      >
        {isSavedInitial ? (
          <>Editar Jogo</>
        ) : (
          <>▶ Jogar</>
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
