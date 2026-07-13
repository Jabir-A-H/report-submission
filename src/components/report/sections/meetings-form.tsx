"use client";

import { AutoSaveField } from "../auto-save-field";
import { Users } from "lucide-react";
import { ViewModeProvider, useViewModeContext } from "../view-mode-toggle";

export const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
  "Orientation / Result Publish",
];

function MeetingsFormContent() {
  const { viewMode } = useViewModeContext();

  if (viewMode === "table") {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs overflow-x-auto animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs font-black">
              <th className="p-3 w-52 sticky left-0 bg-muted/90 backdrop-blur z-10">ক্যাটাগরি</th>
              <th className="p-2 text-center w-20">মহানগরী (টি)</th>
              <th className="p-2 text-center w-24">মহানগরী (গড়)</th>
              <th className="p-2 text-center w-20">থানা (টি)</th>
              <th className="p-2 text-center w-24">থানা (গড়)</th>
              <th className="p-2 text-center w-20">ওয়ার্ড (টি)</th>
              <th className="p-2 text-center w-24">ওয়ার্ড (গড়)</th>
              <th className="p-2 text-left min-w-[150px]">মন্তব্য</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {MEETING_CATEGORIES.map((category) => (
              <tr key={category} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50 text-xs sm:text-sm">
                  {category}
                </td>
                <td className="p-1"><AutoSaveField label="" name="city_count" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="city_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="thana_count" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="thana_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="ward_count" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="ward_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="comments" type="text" section="meeting" table="report_meeting" category={category} tableMode placeholder="মন্তব্য" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {MEETING_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
               <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{category}</h3>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* City Level - clean without nested box borders */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-border/30 pb-1.5">মহানগরী</h4>
                  <AutoSaveField label="কতটি" name="city_count" type="number" section="meeting" table="report_meeting" category={category} inline />
                  <AutoSaveField label="গড় উপস্থিতি" name="city_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} inline />
                </div>

                {/* Thana Level - clean without nested box borders */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-border/30 pb-1.5">থানা</h4>
                  <AutoSaveField label="কতটি" name="thana_count" type="number" section="meeting" table="report_meeting" category={category} inline />
                  <AutoSaveField label="গড় উপস্থিতি" name="thana_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} inline />
                </div>

                {/* Ward Level - clean without nested box borders */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-border/30 pb-1.5">ওয়ার্ড</h4>
                  <AutoSaveField label="কতটি" name="ward_count" type="number" section="meeting" table="report_meeting" category={category} inline />
                  <AutoSaveField label="গড় উপস্থিতি" name="ward_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} inline />
                </div>
             </div>

             <div className="pt-2 border-t border-border/30">
                <AutoSaveField label="মন্তব্য" name="comments" type="text" section="meeting" table="report_meeting" category={category} placeholder="মন্তব্য (যদি থাকে)" />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetingsForm() {
  return (
    <ViewModeProvider defaultMode="card">
      <MeetingsFormContent />
    </ViewModeProvider>
  );
}
