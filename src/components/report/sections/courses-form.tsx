"use client";

import { AutoSaveField } from "../auto-save-field";
import { BookOpen } from "lucide-react";

export const COURSE_CATEGORIES = [
  "বিশিষ্টদের",
  "সাধারণদের",
  "কর্মীদের",
  "ইউনিট সভানেত্রী",
  "অগ্রসরদের",
  "শিশু- তা'লিমুল কুরআন",
  "নিরক্ষর- তা'লিমুস সলাত",
];

export function CoursesForm() {
  return (
    <div className="space-y-8">
      {COURSE_CATEGORIES.map((category) => (
        <div 
          key={category} 
          className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
               <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">{category}</h3>
          </div>

          <div className="space-y-8">
            {/* Row 1: Basic Counts */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">গ্রুপ / কোর্স সংখ্যা</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AutoSaveField label="সংখ্যা" name="number" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="বৃদ্ধি" name="increase" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="ঘাটতি" name="decrease" type="number" section="courses" table="report_course" category={category} />
              </div>
            </div>

            {/* Row 2: Sessions & Attendance */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">সেশন ও উপস্থিতি</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AutoSaveField label="অধিবেশন সংখ্যা" name="sessions" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="শিক্ষার্থী সংখ্যা" name="students" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="উপস্থিতি সংখ্যা" name="attendance" type="number" section="courses" table="report_course" category={category} />
              </div>
            </div>

            {/* Row 3: Status Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">শিক্ষার্থী অবস্থান</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AutoSaveField label="বোর্ডে" name="status_board" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="কায়দায়" name="status_qayda" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="আমপারা" name="status_ampara" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="কুরআন" name="status_quran" type="number" section="courses" table="report_course" category={category} />
              </div>
            </div>

            {/* Row 4: Final Outcomes */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-sm font-semibold text-emerald-600 mb-3">সমাপ্তি ও ফলাফল</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AutoSaveField label="কতজন নিয়ে সমাপ্ত" name="completed" type="number" section="courses" table="report_course" category={category} />
                <AutoSaveField label="সহীহ শিখেছেন কতজন" name="correctly_learned" type="number" section="courses" table="report_course" category={category} />
              </div>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
}
