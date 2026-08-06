"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Game } from "../../lib/api";
import styles from "./lancamentos.module.css";
import QuickAddButton from "../components/QuickAddButton";
import * as LucideIcons from "lucide-react";

export default function LancamentosClient({ upcoming, recent, libraryIds }: { upcoming: Game[], recent: Game[], libraryIds: number[] }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "recent">("upcoming");

  const currentGames = activeTab === "upcoming" ? upcoming : recent;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>O Radar Gamer</h1>
          <p className={styles.subtitle}>
            Acompanhe os lançamentos de peso. Separamos os maiores jogos Triple A que estão chegando ou acabaram de sair.
          </p>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === "upcoming" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Próximos Grandes Lançamentos
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "recent" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            Lançamentos Recentes
          </button>
        </div>

        <div className={styles.grid}>
          {currentGames.map(game => (
            <Link href={`/game/${game.id}`} key={game.id} className={styles.gameCard}>
              <QuickAddButton gameId={game.id} isSavedInitial={libraryIds.includes(game.id)} />
              <div className={styles.gameImagePlaceholder}>
                {game.background_image ? (
                  <Image 
                    src={game.background_image} 
                    alt={game.name} 
                    fill
                    sizes="(max-width: 768px) 50vw, 300px"
                    style={{ objectFit: 'cover' }} 
                  />
                ) : (
                  <LucideIcons.Gamepad2 size={48} opacity={0.2} />
                )}
              </div>
              <div className={styles.gameInfo}>
                <h3 className={styles.gameTitle}>{game.name}</h3>
                <div className={styles.gameDate}>
                  <LucideIcons.Calendar size={14} />
                  {new Date(game.released).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {currentGames.length === 0 && (
          <div style={{ textAlign: "center", color: "#888", marginTop: "2rem" }}>
            Nenhum jogo encontrado para este período.
          </div>
        )}
      </main>
    </div>
  );
}
