"use client";

import { useState } from "react";
import { AutoSaveField } from "../auto-save-field";
import { BookOpen, ChevronDown } from "lucide-react";
import { ViewModeProvider, useViewModeContext } from "../view-mode-toggle";
import { useLanguage } from "@/components/providers/language-provider";

import { COURSE_CATEGORIES } from "@/lib/report-utils";

function CoursesFormContent() {
  const { t, tc } = useLanguage();
  const { viewMode } = useViewModeContext();
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    [COURSE_CATEGORIES[0]]: true,
  });

  const toggleCard = (category: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (viewMode === "table") {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs overflow-x-auto animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-xs font-black">
            <tr className="border-b border-border">
              <th rowSpan={2} className="p-3 w-48 sticky left-0 bg-muted/90 backdrop-blur z-10 border-r border-border/50 text-left">{t.labels.category}</th>
              <th colSpan={3} className="p-2 text-center border-r border-b border-border font-black text-foreground">{t.labels.groupCourse}</th>
              <th rowSpan={2} className="p-2 text-center w-20 border-r border-border">{t.labels.sessionsLabel}</th>
              <th rowSpan={2} className="p-2 text-center w-20 border-r border-border">{t.labels.studentsLabel}</th>
              <th rowSpan={2} className="p-2 text-center w-20 border-r border-border">{t.labels.attendanceLabel}</th>
              <th colSpan={4} className="p-2 text-center border-r border-b border-border font-black text-foreground">{t.labels.studentStatus}</th>
              <th rowSpan={2} className="p-2 text-center w-24 border-r border-border">{t.labels.completedCount}</th>
              <th rowSpan={2} className="p-2 text-center w-28">{t.labels.correctlyLearned}</th>
            </tr>
            <tr className="border-b border-border bg-muted/70 text-[11px]">
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.count}</th>
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.increase}</th>
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.decrease}</th>
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.board}</th>
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.qaida}</th>
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.ampara}</th>
              <th className="p-1.5 text-center w-20 border-r border-border font-bold">{t.labels.quran}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {COURSE_CATEGORIES.map((category) => (
              <tr key={category} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 w-48 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50 text-xs sm:text-sm">
                  {tc(category as any)}
                </td>
                <td className="p-1"><AutoSaveField label="" name="number" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="increase" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="decrease" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="sessions" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="students" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="attendance" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="status_board" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="status_qayda" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="status_ampara" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="status_quran" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="completed" type="number" section="courses" table="report_course" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="correctly_learned" type="number" section="courses" table="report_course" category={category} tableMode /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {COURSE_CATEGORIES.map((category) => {
        const isOpen = !!openCards[category];

        return (
          <div
            key={category}
            className="bg-card border border-border/60 rounded-2xl shadow-2xs overflow-hidden transition-all"
          >
            {/* Collapsible Card Header */}
            <button
              type="button"
              onClick={() => toggleCard(category)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer outline-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{tc(category as any)}</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Collapsible Card Body */}
            {isOpen && (
              <div className="p-4 sm:p-5 pt-0 border-t border-border/40 space-y-5 animate-in fade-in duration-200">
                {/* Row 1: Basic Counts */}
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wide">
                    {t.labels.groupCourseCount}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    <AutoSaveField label={t.labels.count} name="number" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.increase} name="increase" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.decrease} name="decrease" type="number" section="courses" table="report_course" category={category} inline />
                  </div>
                </div>

                {/* Row 2: Sessions & Attendance (Clean without inner box border) */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wide">
                    {t.labels.sessionAndAttendance}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    <AutoSaveField label={t.labels.sessionCount} name="sessions" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.studentCount} name="students" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.attendanceCount} name="attendance" type="number" section="courses" table="report_course" category={category} inline />
                  </div>
                </div>

                {/* Row 3: Status Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wide">
                    {t.labels.studentStatus}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <AutoSaveField label={t.labels.board} name="status_board" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.qaida} name="status_qayda" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.ampara} name="status_ampara" type="number" section="courses" table="report_course" category={category} inline />
                    <AutoSaveField label={t.labels.quran} name="status_quran" type="number" section="courses" table="report_course" category={category} inline />
                  </div>
                </div>

                {/* Row 4: Final Outcomes (Clean without inner box border) */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 mb-2.5 uppercase tracking-wide">
                    {t.labels.completionAndResults}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <AutoSaveField label={t.labels.completedCount} name="completed" type="number" section="courses" table="report_course" category={category} inline inputWidth="w-28" />
                    <AutoSaveField label={t.labels.correctlyLearned} name="correctly_learned" type="number" section="courses" table="report_course" category={category} inline inputWidth="w-28" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CoursesForm() {
  return (
    <ViewModeProvider defaultMode="card">
      <CoursesFormContent />
    </ViewModeProvider>
  );
}
