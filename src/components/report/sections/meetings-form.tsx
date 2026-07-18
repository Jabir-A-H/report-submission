"use client";

import { useState } from "react";
import { AutoSaveField } from "../auto-save-field";
import { Users, ChevronDown } from "lucide-react";
import { ViewModeProvider, useViewModeContext } from "../view-mode-toggle";
import { useLanguage } from "@/components/providers/language-provider";

import { MEETING_CATEGORIES } from "@/lib/report-utils";

function MeetingsFormContent() {
  const { t, tc, language } = useLanguage();
  const { viewMode } = useViewModeContext();
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    [MEETING_CATEGORIES[0]]: true,
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
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs font-black">
              <th rowSpan={2} className="p-3 w-48 sticky left-0 bg-muted/90 backdrop-blur z-10 border-r border-border/50 text-left">{t.labels.meetingsTitle}</th>
              <th colSpan={2} className="p-2 text-center border-r border-border/50">{t.labels.city}</th>
              <th colSpan={2} className="p-2 text-center border-r border-border/50">{t.labels.thana}</th>
              <th colSpan={2} className="p-2 text-center border-r border-border/50">{t.labels.ward}</th>
              <th rowSpan={2} className="p-2 text-left min-w-[150px]">{t.labels.comments}</th>
            </tr>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] font-bold">
              <th className="p-2 text-center w-24 border-r border-border/40">{t.labels.howMany}</th>
              <th className="p-2 text-center w-24 border-r border-border/50">{t.labels.averageAttendance}</th>
              <th className="p-2 text-center w-24 border-r border-border/40">{t.labels.howMany}</th>
              <th className="p-2 text-center w-24 border-r border-border/50">{t.labels.averageAttendance}</th>
              <th className="p-2 text-center w-24 border-r border-border/40">{t.labels.howMany}</th>
              <th className="p-2 text-center w-24 border-r border-border/50">{t.labels.averageAttendance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {MEETING_CATEGORIES.map((category) => (
              <tr key={category} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 w-48 font-bold text-foreground sticky left-0 bg-card z-10 border-r border-border/50 text-xs sm:text-sm">
                  {category === "অন্যান্য" ? (
                    <div className="space-y-1 min-w-[160px]">
                      <span className="text-blue-600 block font-black">{t.labels.others}:</span>
                      <AutoSaveField
                        label=""
                        name="meeting_name"
                        type="text"
                        section="meeting"
                        table="report_meeting"
                        category={category}
                        placeholder={t.labels.enterMeetingName}
                        tableMode
                      />
                    </div>
                  ) : (
                    tc(category as any)
                  )}
                </td>
                <td className="p-1"><AutoSaveField label="" name="city_count" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="city_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="thana_count" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="thana_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="ward_count" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="ward_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} tableMode /></td>
                <td className="p-1"><AutoSaveField label="" name="comments" type="text" section="meeting" table="report_meeting" category={category} tableMode placeholder={t.labels.comments} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {MEETING_CATEGORIES.map((category) => {
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
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {category === "অন্যান্য" ? t.labels.others : tc(category as any)}
                </h3>
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
                {category === "অন্যান্য" && (
                  <div className="pt-4 pb-2 border-b border-border/30">
                    <AutoSaveField
                      label={t.labels.specifyMeetingName}
                      name="meeting_name"
                      type="text"
                      section="meeting"
                      table="report_meeting"
                      category={category}
                      placeholder={t.labels.enterMeetingName}
                    />
                  </div>
                )}

                <div className={`${category === "অন্যান্য" ? "pt-2" : "pt-4"} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
                  {/* City Level - clean without nested box borders */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-border/30 pb-1.5">{t.labels.city}</h4>
                    <AutoSaveField label={t.labels.howMany} name="city_count" type="number" section="meeting" table="report_meeting" category={category} inline />
                    <AutoSaveField label={t.labels.averageAttendance} name="city_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} inline />
                  </div>

                  {/* Thana Level - clean without nested box borders */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-border/30 pb-1.5">{t.labels.thana}</h4>
                    <AutoSaveField label={t.labels.howMany} name="thana_count" type="number" section="meeting" table="report_meeting" category={category} inline />
                    <AutoSaveField label={t.labels.averageAttendance} name="thana_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} inline />
                  </div>

                  {/* Ward Level - clean without nested box borders */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-border/30 pb-1.5">{t.labels.ward}</h4>
                    <AutoSaveField label={t.labels.howMany} name="ward_count" type="number" section="meeting" table="report_meeting" category={category} inline />
                    <AutoSaveField label={t.labels.averageAttendance} name="ward_avg_attendance" type="number" section="meeting" table="report_meeting" category={category} inline />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <AutoSaveField
                    label={t.labels.comments}
                    name="comments"
                    type="text"
                    section="meeting"
                    table="report_meeting"
                    category={category}
                    placeholder={t.labels.commentsIfAny}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
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
