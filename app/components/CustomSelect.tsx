"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./customselect.module.css";

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  compact?: boolean;
}

export default function CustomSelect({ options, value, onChange, compact = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`${styles.container} ${compact ? styles.containerCompact : ''}`} ref={containerRef}>
      <div 
        className={`${styles.selectedBox} ${compact ? styles.compactBox : ''}`} 

        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value}</span>
        <svg className={`${styles.chevron} ${isOpen ? styles.open : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((opt) => (
            <div 
              key={opt}
              className={`${styles.option} ${value === opt ? styles.active : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
