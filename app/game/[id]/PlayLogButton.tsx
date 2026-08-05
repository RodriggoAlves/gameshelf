"use client";
import { useState } from "react";
import styles from "./game.module.css";
import { useRouter } from "next/navigation";

export default function PlayLogButton({ gameId, isSaved }: { gameId: number, isSaved: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [minutes, setMinutes] = useState(60);
  const [isCompletion, setIsCompletion] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isSaved) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          sessionDate: date,
          durationMinutes: Number(minutes),
          isCompletionDay: isCompletion
        })
      });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      alert("Erro ao salvar sessão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className={styles.logButton} 
        onClick={() => setIsOpen(true)}
      >
        ⏱️ Registrar Jogatina
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Registrar Sessão</h2>
            <form onSubmit={handleSubmit} className={styles.logForm}>
              
              <div className={styles.formGroup}>
                <label>Data da Sessão</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tempo Jogado (Minutos)</label>
                <input 
                  type="number" 
                  min="1"
                  value={minutes} 
                  onChange={e => setMinutes(Number(e.target.value))} 
                  required
                />
              </div>

              <div className={styles.formGroupCheckbox}>
                <input 
                  type="checkbox" 
                  id="completion"
                  checked={isCompletion}
                  onChange={e => setIsCompletion(e.target.checked)}
                />
                <label htmlFor="completion">🏆 Zerei o jogo nesta sessão!</label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" disabled={loading} className={styles.saveBtn}>
                  {loading ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
