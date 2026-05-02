"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { PeriodSelector } from "./period-selector";
import { 
  FileText, 
  BookOpen, 
  Users, 
  User, 
  Users2, 
  PlusSquare, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Circle,
  ArrowRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useReport } from "@/components/report/report-context";

export function UserDashboard() {
  const { t } = useLanguage();
  const { data, reportId, isSaving } = useReport();

  type SectionStatus = "complete" | "incomplete" | "empty";

  // Dynamic status check logic
  const checkSectionStatus = (sectionId: string): SectionStatus => {
    if (!reportId || !data) return "empty";
    
    const sectionData = data[sectionId];
    if (!sectionData) return "empty";

    // For arrays (courses, organizational, etc.)
    if (Array.isArray(sectionData)) {
      if (sectionData.length === 0) return "empty";
      
      const allFilled = sectionData.every(row => {
        return Object.entries(row).every(([key, value]) => {
          if (key === 'id' || key === 'report_id') return true;
          return value !== null && value !== "" && value !== undefined;
        });
      });
      return allFilled ? "complete" : "incomplete";
    }

    // For objects (header, comment)
    if (typeof sectionData === 'object') {
      if (Object.keys(sectionData).length === 0) return "empty";
      const allFilled = Object.entries(sectionData).every(([key, value]) => {
        if (key === 'id' || key === 'report_id') return true;
        return value !== null && value !== "" && value !== undefined;
      });
      return allFilled ? "complete" : "incomplete";
    }

    return "empty";
  };

  const sections: { id: string, name: string, icon: any, status: SectionStatus }[] = [
    { id: "header", name: t.sections.header, icon: FileText, status: checkSectionStatus("header") },
    { id: "courses", name: t.sections.courses, icon: BookOpen, status: checkSectionStatus("courses") },
    { id: "organizational", name: t.sections.organizational, icon: Users, status: checkSectionStatus("organizational") },
    { id: "personal", name: t.sections.personal, icon: User, status: checkSectionStatus("personal") },
    { id: "meeting", name: t.sections.meeting, icon: Users2, status: checkSectionStatus("meeting") },
    { id: "extra", name: t.sections.extra, icon: PlusSquare, status: checkSectionStatus("extra") },
    { id: "comment", name: t.sections.comment, icon: MessageSquare, status: checkSectionStatus("comment") },
  ];

  const totalComplete = sections.filter(s => s.status === "complete").length;
  const totalIncomplete = sections.filter(s => s.status === "incomplete").length;

  return (
    <div className="container py-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">{t.dashboard}</h1>
        <p className="text-muted-foreground">আপনার জোনের মাসিক রিপোর্ট ম্যানেজ করুন</p>
      </div>

      <PeriodSelector />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          
          let cardStyle = "";
          let iconStyle = "";
          let badgeStyle = "";
          let StatusIcon = Circle;
          let statusText = "";

          if (section.status === "complete") {
            cardStyle = "border-green-500/20 bg-green-500/2";
            iconStyle = "bg-green-500/10 text-green-600";
            badgeStyle = "text-green-600 bg-green-500/10";
            StatusIcon = CheckCircle2;
            statusText = t.status.complete;
          } else if (section.status === "incomplete") {
            cardStyle = "border-amber-500/20 bg-amber-500/2";
            iconStyle = "bg-amber-500/10 text-amber-600";
            badgeStyle = "text-amber-600 bg-amber-500/10";
            StatusIcon = AlertCircle;
            statusText = t.status.incomplete;
          } else {
            cardStyle = "border-border bg-card";
            iconStyle = "bg-muted text-muted-foreground";
            badgeStyle = "text-muted-foreground bg-muted";
            StatusIcon = Circle;
            statusText = t.status.empty;
          }
          
          return (
            <div 
              key={section.id} 
              className={`premium-card p-5 flex flex-col justify-between group h-full ${cardStyle}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${iconStyle}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${badgeStyle}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusText}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4">{section.name}</h3>
                <Link 
                  href={`/report/${section.id}`}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    section.status === "complete" 
                    ? "bg-muted text-foreground hover:bg-muted/80" 
                    : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 bg-linear-to-r from-primary to-primary/80"
                  }`}
                >
                  <span>{section.status === "complete" ? t.actions.edit : t.actions.start}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Floating Bar for Mobile/Sticky Footer */}
      <div className="fixed bottom-20 left-4 right-4 md:static md:mt-12 flex flex-col md:flex-row items-center justify-between p-4 px-6 md:p-6 bg-card border rounded-2xl shadow-2xl md:shadow-lg z-40">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t.stats.total}</p>
            <p className="text-xl font-bold">7</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-[10px] text-green-600 uppercase font-bold tracking-widest">{t.stats.completed}</p>
            <p className="text-xl font-bold text-green-600">{totalComplete}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-[10px] text-amber-600 uppercase font-bold tracking-widest">{t.stats.pending}</p>
            <p className="text-xl font-bold text-amber-600">{7 - totalComplete}</p>
          </div>
        </div>

        <button 
          disabled={totalComplete < 7}
          className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-base transition-all ${
            totalComplete === 7
            ? "bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20 active:scale-95"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
          }`}
        >
          {t.actions.finalSubmit}
        </button>
      </div>
    </div>
  );
}
