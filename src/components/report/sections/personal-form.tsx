"use client";

import { AutoSaveField } from "../auto-save-field";
import { UserPlus } from "lucide-react";

export const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

export function PersonalForm() {
  return (
    <div className="space-y-6">
      {PERSONAL_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm hover:border-pink-500/30 transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
            <div className="p-2.5 bg-pink-500/10 rounded-2xl text-pink-600">
               <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground leading-tight">{category}</h3>
          </div>

          <div className="space-y-8">
            {/* General Teaching */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AutoSaveField 
                label="কতজন শিখাচ্ছেন" 
                name="teaching" 
                type="number" 
                section="personal" 
                table="report_personal" 
                category={category} 
              />
              <AutoSaveField 
                label="কতজনকে শিখাচ্ছেন" 
                name="learning" 
                type="number" 
                section="personal" 
                table="report_personal" 
                category={category} 
              />
            </div>

            {/* Olama Outreach */}
            <div className="p-5 rounded-2xl bg-pink-500/5 border border-pink-500/20 space-y-5">
              <h4 className="text-sm font-bold text-pink-700">উলামাদের মাঝে দাওয়াত</h4>
              <AutoSaveField 
                label="কতজন উলামাকে দাওয়াত দিয়েছেন" 
                name="olama_invited" 
                type="number" 
                section="personal" 
                table="report_personal" 
                category={category} 
              />
              
              <div className="pt-2">
                <h5 className="text-xs font-semibold text-muted-foreground mb-3">দাওয়াত প্রাপ্ত উলামাদের মধ্যে:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <AutoSaveField 
                    label="সহযোগী হয়েছেন" 
                    name="became_shohojogi" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                  />
                  <AutoSaveField 
                    label="সক্রিয় সহযোগী হয়েছেন" 
                    name="became_sokrio_shohojogi" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                  />
                  <AutoSaveField 
                    label="কর্মী হয়েছেন" 
                    name="became_kormi" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                  />
                  <AutoSaveField 
                    label="রুকন হয়েছেন" 
                    name="became_rukon" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
