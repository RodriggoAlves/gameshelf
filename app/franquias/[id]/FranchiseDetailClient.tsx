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
        {franchise.games.map((game, index) => (
          <div key={`${game.id}-${index}`} className={styles.gameRow}>
            <div className={styles.timelineDot}></div>
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
              </div>
              <div className={styles.gameInfo}>
                <h3 className={styles.gameTitle}>{game.name}</h3>
                <div className={styles.gameMeta}>
                  <span className={styles.gameYear}>
                    {game.released ? new Date(game.released).getFullYear() : 'N/A'}
                  </span>
                  <span className={styles.gameRating}>
                    {Math.round(game.rating)} / 100
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
