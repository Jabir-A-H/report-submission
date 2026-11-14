"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, Translations } from "@/lib/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  tc: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage = "bn",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  // Persist language preference
  useEffect(() => {
    const savedLang = localStorage.getItem("app-language") as Language;
    if (savedLang && (savedLang === "bn" || savedLang === "en")) {
      if (savedLang !== language) {
        setLanguage(savedLang);
        document.documentElement.lang = savedLang;
        document.cookie = `app-language=${savedLang}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } else {
      localStorage.setItem("app-language", language);
      document.cookie = `app-language=${language}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-language", lang);
    document.documentElement.lang = lang;
    document.cookie = `app-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = translations[language];
  const tc = (key: string) => {
    return (t.categories as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, tc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
