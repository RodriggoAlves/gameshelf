"use client";

import { useState, useOptimistic, startTransition } from "react";
import styles from "./game.module.css";
import GameStatusModal from "../../components/GameStatusModal";

export default function LibraryButton({ gameId, isSavedInitial }: { gameId: number, isSavedInitial: boolean }) {
  const [showModal, setShowModal] = useState(false);

  const [optimisticIsSaved, addOptimisticSaved] = useOptimistic(
    isSavedInitial,
    (state: boolean, newSaved: boolean) => newSaved
  );

  const handleOptimisticUpdate = (saved: boolean) => {
    startTransition(() => {
      addOptimisticSaved(saved);
    });
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={optimisticIsSaved ? styles.secondaryButton : "button-primary"}
      >
        {optimisticIsSaved ? (
          <>Editar Jogo</>
        ) : (
          <>▶ Adicionar</>
        )}
      </button>

      {showModal && (
        <GameStatusModal 
          gameId={gameId} 
          isSavedInitial={optimisticIsSaved}
          onClose={() => setShowModal(false)}
          onSaveOptimistic={() => handleOptimisticUpdate(true)}
          onRemoveOptimistic={() => handleOptimisticUpdate(false)}
        />
      )}
    </>
  );
}
