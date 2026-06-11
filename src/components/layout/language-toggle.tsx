"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => setLanguage("bn")}
        className={cn(
          "px-3 py-1 rounded-lg text-xs font-black tracking-wide transition-all duration-200",
          language === "bn"
            ? "bg-primary/10 text-primary ring-1.5 ring-primary/40"
            : "text-muted-foreground hover:bg-muted/60"
        )}
      >
        বাংলা
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "px-3 py-1 rounded-lg text-xs font-black tracking-wide transition-all duration-200",
          language === "en"
            ? "bg-primary/10 text-primary ring-1.5 ring-primary/40"
            : "text-muted-foreground hover:bg-muted/60"
        )}
      >
        EN
      </button>
    </div>
  );
}
