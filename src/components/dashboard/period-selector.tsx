"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { 
  Calendar, 
  ChevronRight, 
  LayoutDashboard,
  FileCheck
} from "lucide-react";

export function PeriodSelector() {
  const { t } = useLanguage();

  return (
    <div className="modern-card p-6 mb-8 bg-card shadow-lg border-primary/10">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            {t.periodSelector.type}
          </label>
          <select className="modern-input w-full bg-muted/50 focus:bg-background transition-colors">
            <option value="monthly">{t.reportTypes.monthly}</option>
            <option value="quarterly">{t.reportTypes.quarterly}</option>
            <option value="halfYearly">{t.reportTypes.halfYearly}</option>
            <option value="nineMonth">{t.reportTypes.nineMonth}</option>
            <option value="yearly">{t.reportTypes.yearly}</option>
          </select>
        </div>

        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t.periodSelector.month}
          </label>
          <select className="modern-input w-full bg-muted/50 focus:bg-background transition-colors">
            <option value="1">জানুয়ারি</option>
            <option value="2">ফেব্রুয়ারি</option>
            <option value="3">মার্চ</option>
            <option value="4">এপ্রিল</option>
            <option value="5">মে</option>
            <option value="6">জুন</option>
            <option value="7">জুলাই</option>
            <option value="8">আগস্ট</option>
            <option value="9">সেপ্টেম্বর</option>
            <option value="10">অক্টোবর</option>
            <option value="11">নভেম্বর</option>
            <option value="12">ডিসেম্বর</option>
          </select>
        </div>

        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            {t.periodSelector.year}
          </label>
          <select className="modern-input w-full bg-muted/50 focus:bg-background transition-colors">
            <option value="2025">২০২৫</option>
            <option value="2026">২০২৬</option>
          </select>
        </div>

        <button className="modern-btn btn-primary h-[48px] px-8 flex items-center gap-2 group w-full md:w-auto justify-center">
          <span>{t.periodSelector.go}</span>
          <ChevronRight className="w-4 h-4 group-active:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
