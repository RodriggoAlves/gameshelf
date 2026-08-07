"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import styles from "./franquias.module.css";

interface Franchise {
  id: number;
  name: string;
  games_count: number;
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
      <h1 className={styles.title}>Coleções & Franquias</h1>
      
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input 
          type="text" 
          className={styles.searchInput}
          placeholder="Busque por uma franquia (ex: Final Fantasy)..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className={styles.searchButton} disabled={isSearching}>
          {isSearching ? "..." : <Search size={20} />}
        </button>
      </form>

      {results.length === 0 && !isSearching && (
        <p className={styles.noResults}>Nenhuma franquia encontrada.</p>
      )}

      {results.length > 0 && (
        <div className={styles.grid}>
          {results.map(franchise => (
            <Link href={`/franquias/${franchise.id}`} key={franchise.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{franchise.name}</h3>
              <span className={styles.cardCount}>{franchise.games_count} jogos</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
