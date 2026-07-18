"use client";

import { AutoSaveField } from "../auto-save-field";
import { Users2 } from "lucide-react";
import { ViewModeProvider, useViewModeContext } from "../view-mode-toggle";

import { ORG_CATEGORIES } from "@/lib/report-utils";

function OrganizationalFormContent() {
  const { viewMode } = useViewModeContext();

  if (viewMode === "table") {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs overflow-x-auto animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs font-black">
              <th className="p-3 w-48 sticky left-0 bg-muted/90 backdrop-blur z-10 border-r border-border/50 text-left">দাওয়াত ও সংগঠন</th>
              <th className="p-2 text-center w-24">সংখ্যা</th>
              <th className="p-2 text-center w-24">বৃদ্ধি</th>
              <th className="p-2 text-center w-24">পরিমাণ</th>
              <th className="p-2 text-left min-w-[200px]">মন্তব্য</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {ORG_CATEGORIES.map((category) => (
              <tr key={category} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 w-48 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50 text-xs sm:text-sm">
                  {category}
                </td>
                <td className="p-1"><AutoSaveField label="" name="number" type="number" section="organizational" table="report_organizational" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="increase" type="number" section="organizational" table="report_organizational" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="amount" type="number" section="organizational" table="report_organizational" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="comments" type="text" section="organizational" table="report_organizational" category={category} tableMode placeholder="মন্তব্য" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {ORG_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-2xl p-4 shadow-2xs transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2.5 mb-3.5 border-b border-border/40 pb-2.5">
            <div className="p-1.5 bg-cyan-500/10 rounded-xl text-cyan-600">
               <Users2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-foreground leading-tight">{category}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-2.5">
             <AutoSaveField label="সংখ্যা" name="number" type="number" section="organizational" table="report_organizational" category={category} inline />
             <AutoSaveField label="বৃদ্ধি" name="increase" type="number" section="organizational" table="report_organizational" category={category} inline />
             <AutoSaveField label="পরিমাণ" name="amount" type="number" section="organizational" table="report_organizational" category={category} inline />
          </div>

          <div className="pt-1">
             <AutoSaveField label="মন্তব্য" name="comments" type="text" section="organizational" table="report_organizational" category={category} placeholder="প্রয়োজন হলে মন্তব্য লিখুন" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrganizationalForm() {
  return (
    <ViewModeProvider defaultMode="card">
      <OrganizationalFormContent />
    </ViewModeProvider>
  );
}
