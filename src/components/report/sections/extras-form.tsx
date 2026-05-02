"use client";

import { AutoSaveField } from "../auto-save-field";
import { Send } from "lucide-react";

export const EXTRA_CATEGORIES = [
  "মক্তব সংখ্যা",
  "মক্তব বৃদ্ধি",
  "মহানগরী পরিচালিত",
  "স্থানীয়ভাবে পরিচালিত",
  "মহানগরীর সফর",
  "থানা কমিটির সফর",
  "থানা প্রতিনিধির সফর",
  "ওয়ার্ড প্রতিনিধির সফর",
];

export function ExtrasForm() {
  return (
    <div className="space-y-6">
      {/* We can group them by Moktob vs Safar to make it look nicer */}
      
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
          <div className="p-2.5 bg-green-500/10 rounded-2xl text-green-600">
             <Send className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight">মক্তব ও সফর রিপোর্ট</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {EXTRA_CATEGORIES.map((category) => (
            <div key={category} className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col justify-center">
               <AutoSaveField 
                 label={category}
                 name="number" 
                 type="number" 
                 section="extra" 
                 table="report_extra" 
                 category={category} 
               />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
