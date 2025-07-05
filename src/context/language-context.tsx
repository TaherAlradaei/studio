"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo } from "react";
import { enStrings, type Dictionary } from "@/lib/dictionaries/en";
import { arStrings } from "@/lib/dictionaries/ar";

type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, Dictionary> = {
  en: enStrings,
  ar: arStrings,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>("en");

  const value = useMemo(() => {
    return {
      lang,
      setLang,
      t: dictionaries[lang],
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
