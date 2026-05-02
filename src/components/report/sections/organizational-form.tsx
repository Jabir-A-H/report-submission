"use client";

import { AutoSaveField } from "../auto-save-field";
import { Users2 } from "lucide-react";

export const ORG_CATEGORIES = [
  "দাওয়াত দান",
  "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
  "সহযোগী হয়েছে",
  "সম্মতি দিয়েছেন",
  "সক্রিয় সহযোগী",
  "কর্মী",
  "রুকন",
  "দাওয়াতী ইউনিট",
  "ইউনিট",
  "সূধী",
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
  "বই বিলি",
  "বই বিক্রি",
];

export function OrganizationalForm() {
  return (
    <div className="space-y-6">
      {ORG_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-5 border-b border-border/40 pb-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-600">
               <Users2 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{category}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <AutoSaveField 
               label="সংখ্যা" 
               name="number" 
               type="number" 
               section="organizational" 
               table="report_organizational" 
               category={category} 
             />
             <AutoSaveField 
               label="বৃদ্ধি" 
               name="increase" 
               type="number" 
               section="organizational" 
               table="report_organizational" 
               category={category} 
             />
             <AutoSaveField 
               label="পরিমাণ" 
               name="amount" 
               type="number" 
               section="organizational" 
               table="report_organizational" 
               category={category} 
             />
             <AutoSaveField 
               label="মন্তব্য" 
               name="comments" 
               type="text" 
               section="organizational" 
               table="report_organizational" 
               category={category} 
               placeholder="প্রয়োজন হলে মন্তব্য লিখুন"
             />
          </div>
        </div>
      ))}
    </div>
  );
}
