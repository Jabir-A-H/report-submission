"use client";

import { AutoSaveField } from "../auto-save-field";
import { UserPlus } from "lucide-react";
import { ViewModeProvider, useViewModeContext } from "../view-mode-toggle";

export const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

function PersonalFormContent() {
  const { viewMode } = useViewModeContext();

  if (viewMode === "table") {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs overflow-x-auto animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs font-black">
              <th className="p-3 w-40 sticky left-0 bg-muted/90 backdrop-blur z-10">ক্যাটাগরি</th>
              <th className="p-2 text-center w-24">কতজন শিখাচ্ছেন</th>
              <th className="p-2 text-center w-24">কতজনকে শিখাচ্ছেন</th>
              <th className="p-2 text-center w-24">উলামা দাওয়াত</th>
              <th className="p-2 text-center w-24">সহযোগী হলেন</th>
              <th className="p-2 text-center w-24">সক্রিয় সহযোগী</th>
              <th className="p-2 text-center w-24">কর্মী হলেন</th>
              <th className="p-2 text-center w-24">রুকন হলেন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {PERSONAL_CATEGORIES.map((category) => (
              <tr key={category} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50 text-xs sm:text-sm">
                  {category}
                </td>
                <td className="p-1"><AutoSaveField label="" name="teaching" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="learning" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="olama_invited" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="became_shohojogi" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="became_sokrio_shohojogi" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="became_kormi" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="became_rukon" type="number" section="personal" table="report_personal" category={category} tableMode /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {PERSONAL_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
            <div className="p-2 bg-pink-500/10 rounded-xl text-pink-600">
               <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{category}</h3>
          </div>

          <div className="space-y-5">
            {/* General Teaching */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <AutoSaveField 
                label="কতজন শিখাচ্ছেন" 
                name="teaching" 
                type="number" 
                section="personal" 
                table="report_personal" 
                category={category} 
                inline
                inputWidth="w-28"
              />
              <AutoSaveField 
                label="কতজনকে শিখাচ্ছেন" 
                name="learning" 
                type="number" 
                section="personal" 
                table="report_personal" 
                category={category} 
                inline
                inputWidth="w-28"
              />
            </div>

            {/* Olama Outreach - Clean without nested box borders */}
            <div className="pt-4 border-t border-border/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wide">উলামাদের মাঝে দাওয়াত</h4>
                <div className="w-full sm:w-64">
                  <AutoSaveField 
                    label="দাওয়াত দিয়েছেন (জন)" 
                    name="olama_invited" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                    inline
                    inputWidth="w-24"
                  />
                </div>
              </div>
              
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-2.5">দাওয়াত প্রাপ্ত উলামাদের মধ্যে:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <AutoSaveField 
                    label="সহযোগী হয়েছেন" 
                    name="became_shohojogi" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                    inline
                  />
                  <AutoSaveField 
                    label="সক্রিয় সহযোগী হয়েছেন" 
                    name="became_sokrio_shohojogi" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                    inline
                  />
                  <AutoSaveField 
                    label="কর্মী হয়েছেন" 
                    name="became_kormi" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                    inline
                  />
                  <AutoSaveField 
                    label="রুকন হয়েছেন" 
                    name="became_rukon" 
                    type="number" 
                    section="personal" 
                    table="report_personal" 
                    category={category} 
                    inline
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

export function PersonalForm() {
  return (
    <ViewModeProvider defaultMode="card">
      <PersonalFormContent />
    </ViewModeProvider>
  );
}
