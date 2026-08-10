"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import styles from "./franquias.module.css";

import Image from "next/image";

interface Franchise {
  id: number;
  name: string;
  games_count: number;
  cover_url?: string;
}

export default function FranquiasClient({ popularFranchises }: { popularFranchises: Franchise[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Franchise[]>(popularFranchises);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults(popularFranchises);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/franchises?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to search franchises", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Universos Lendários</h1>
        <p className={styles.subtitle}>Explore as maiores franquias e coleções de jogos de todos os tempos. Descubra a ordem cronológica, detalhes de cada lançamento e expanda seu conhecimento.</p>
        
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Qual franquia você procura? (ex: Tomb Raider)" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton} disabled={isSearching}>
            {isSearching ? "..." : <Search size={20} />}
          </button>
        </form>
      </div>

      <div className={styles.contentWrapper}>
        {results.length === 0 && !isSearching && (
          <div className={styles.noResults}>
            <p>Nenhuma franquia encontrada para a sua busca.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.grid}>
            {results.map(franchise => (
              <Link href={`/franquias/${franchise.id}`} key={franchise.id} className={styles.card}>
                <div className={styles.cardImageWrapper}>
                  {franchise.cover_url ? (
                    <Image src={franchise.cover_url} alt={franchise.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#222' }} />
                  )}
                </div>
                <div className={styles.cardGradient} />
                
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{franchise.name}</h3>
                  <span className={styles.cardCount}>{franchise.games_count} jogos</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
