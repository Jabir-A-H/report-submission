"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
      className="tap-target px-3 rounded-full hover:bg-muted flex items-center gap-2 group transition-all"
    >
      <Languages className="w-4 h-4 text-primary group-hover:scale-110" />
      <span className="text-sm font-bold uppercase tracking-wider">
        {language === "bn" ? "EN" : "BN"}
      </span>
    </button>
  );
}
