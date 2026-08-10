"use client";

import Link from "next/link";
import Image from "next/image";
import { Game } from "../../../lib/api";
import styles from "./franchise-detail.module.css";
import { ArrowLeft } from "lucide-react";

interface FranchiseDetailProps {
  franchise: {
    id: number;
    name: string;
    games: Game[];
  } | null;
}

export default function FranchiseDetailClient({ franchise }: FranchiseDetailProps) {
  if (!franchise) {
    return <div className={styles.container}><h1 className={styles.title}>Franquia não encontrada</h1></div>;
  }

  return (
    <div className={styles.container}>
      <Link href="/franquias" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', marginBottom: '2rem', textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={20} />
        Voltar para Franquias
      </Link>

      <div className={styles.hero}>
        <h1 className={styles.title}>{franchise.name}</h1>
        <p className={styles.subtitle}>Linha do Tempo - {franchise.games.length} Jogos</p>
      </div>

      <div className={styles.timeline}>
        {franchise.games.map((game, index) => {
          const isEven = index % 2 === 0;
          const exactDate = game.released 
            ? new Date(game.released).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) 
            : 'Data desconhecida';

          return (
            <div key={`${game.id}-${index}`} className={`${styles.gameRow} ${isEven ? styles.rowLeft : styles.rowRight}`}>
              <div className={styles.timelineContent}>
                <Link href={`/game/${game.id}`} className={styles.gameCard}>
                  <div className={styles.gameImageWrapper}>
                    {game.background_image ? (
                      <Image 
                        src={game.background_image} 
                        alt={game.name} 
                        fill
                        style={{ objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Sem Capa</div>
                    )}
                    <div className={styles.dateBadge}>
                      {exactDate}
                    </div>
                  </div>
                  <div className={styles.gameInfo}>
                    <h3 className={styles.gameTitle}>{game.name}</h3>
                    <div className={styles.gameMeta}>
                      <span className={styles.gameRating}>
                        {game.rating ? `${Math.round(game.rating)} / 100` : 'S/ Nota'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
              <div className={styles.timelineDot}></div>
              <div className={styles.timelineEmpty}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
