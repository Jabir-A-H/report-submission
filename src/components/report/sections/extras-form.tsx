"use client";

import { AutoSaveField } from "../auto-save-field";
import { Send, Compass, BookOpen } from "lucide-react";

const MOKTOB_CATEGORIES = [
  "মক্তব সংখ্যা",
  "মক্তব বৃদ্ধি",
  "মহানগরী পরিচালিত",
  "স্থানীয়ভাবে পরিচালিত",
];

const SAFAR_CATEGORIES = [
  "মহানগরীর সফর",
  "থানা কমিটির সফর",
  "থানা প্রতিনিধির সফর",
  "ওয়ার্ড প্রতিনিধির সফর",
];

import { useLanguage } from "@/components/providers/language-provider";

export function ExtrasForm() {
  const { t, tc } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Card 1: Moktob Report */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-green-500/10 rounded-xl text-green-600">
             <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{t.labels.maktabReport}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOKTOB_CATEGORIES.map((category) => (
            <AutoSaveField 
              key={category}
              label={tc(category as any)}
              name="number" 
              type="number" 
              section="extra" 
              table="report_extra" 
              category={category} 
              inline
              inputWidth="w-24"
            />
          ))}
        </div>
      </div>

      {/* Card 2: Safar Report */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
             <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{t.labels.safarReport}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAFAR_CATEGORIES.map((category) => (
            <AutoSaveField 
              key={category}
              label={tc(category as any)}
              name="number" 
              type="number" 
              section="extra" 
              table="report_extra" 
              category={category} 
              inline
              inputWidth="w-24"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
