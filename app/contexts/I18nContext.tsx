"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import ptBR from "../dictionaries/pt-BR.json";
import en from "../dictionaries/en.json";

export type Language = "pt-BR" | "en";
type Dictionary = typeof ptBR;

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

const dictionaries: Record<Language, Dictionary> = {
  "pt-BR": ptBR,
  "en": en,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt-BR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("gameshelf-lang") as Language;
    if (savedLang && (savedLang === "pt-BR" || savedLang === "en")) {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language;
      if (browserLang.startsWith("en")) {
        setLanguage("en");
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("gameshelf-lang", lang);
    document.documentElement.lang = lang;
  };

  // Previne hydration mismatch retornando um provider vazio enquanto carrega
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ language: "pt-BR", setLanguage: handleSetLanguage, t: ptBR }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t: dictionaries[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
