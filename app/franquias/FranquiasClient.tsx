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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.3 }}>
                {franchise.cover_url ? (
                  <Image src={franchise.cover_url} alt={franchise.name} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#222' }} />
                )}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(10,10,15,1), rgba(10,10,15,0))' }} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{franchise.name}</h3>
                <span className={styles.cardCount} style={{ opacity: 0.8 }}>{franchise.games_count} jogos</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
