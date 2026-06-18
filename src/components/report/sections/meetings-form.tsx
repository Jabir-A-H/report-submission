"use client";

import { AutoSaveField } from "../auto-save-field";
import { Users } from "lucide-react";

export const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
  "Orientation / Result Publish",
];

export function MeetingsForm() {
  return (
    <div className="space-y-6">
      {MEETING_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm hover:border-blue-500/30 transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-600">
               <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground leading-tight">{category}</h3>
          </div>

          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City Level */}
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                  <h4 className="font-bold text-blue-700">মহানগরী</h4>
                  <AutoSaveField label="কতটি" name="city_count" type="number" section="meeting" table="report_meeting" category={category} />
                  <AutoSaveField label="গড় উপস্থিতি" name="city_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} />
                </div>

                {/* Thana Level */}
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                  <h4 className="font-bold text-blue-700">থানা</h4>
                  <AutoSaveField label="কতটি" name="thana_count" type="number" section="meeting" table="report_meeting" category={category} />
                  <AutoSaveField label="গড় উপস্থিতি" name="thana_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} />
                </div>

                {/* Ward Level */}
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                  <h4 className="font-bold text-blue-700">ওয়ার্ড</h4>
                  <AutoSaveField label="কতটি" name="ward_count" type="number" section="meeting" table="report_meeting" category={category} />
                  <AutoSaveField label="গড় উপস্থিতি" name="ward_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} />
                </div>
             </div>

             <div className="pt-2">
                <AutoSaveField label="মন্তব্য" name="comments" type="text" section="meeting" table="report_meeting" category={category} placeholder="মন্তব্য (যদি থাকে)" />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
