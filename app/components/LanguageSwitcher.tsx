"use client";

import { useI18n, Language } from "../contexts/I18nContext";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className={styles.switcher}>
      <button 
        className={`${styles.btn} ${language === 'pt-BR' ? styles.active : ''}`}
        onClick={() => setLanguage('pt-BR')}
      >
        PT
      </button>
      <span className={styles.divider}>|</span>
      <button 
        className={`${styles.btn} ${language === 'en' ? styles.active : ''}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}
