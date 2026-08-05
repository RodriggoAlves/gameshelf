"use client";
import { useState } from "react";
import styles from "./stars.module.css";

interface StarRatingProps {
  value: number; // 0 a 100
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, readOnly }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  // Normalizar notas antigas (ex: 80 -> 8)
  const normalizedValue = value > 10 ? Math.round(value / 10) : value;
  // currentStars será de 1 a 5
  const currentStars = hover !== null ? hover : Math.round(normalizedValue / 2);

  return (
    <div className={styles.starContainer} onMouseLeave={() => setHover(null)} style={{ gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`${styles.star} ${star <= currentStars ? styles.active : ""}`}
          style={{ fontSize: '1.5rem' }}
          onMouseEnter={() => !readOnly && setHover(star)}
          onClick={(e) => {
            e.preventDefault();
            if (!readOnly && onChange) onChange(star * 2); // Salva de 2 a 10 (passos de 2)
          }}
        >
          ★
        </button>
      ))}
      {!readOnly && value > 0 && (
        <button 
          className={styles.clearBtn} 
          onClick={(e) => { e.preventDefault(); if (onChange) onChange(0); setHover(null); }}
          title="Clear Rating"
        >
          ×
        </button>
      )}
    </div>
  );
}
