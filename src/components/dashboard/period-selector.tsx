"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { 
  Calendar, 
  ChevronRight, 
  LayoutDashboard,
  FileCheck
} from "lucide-react";

export function PeriodSelector({ monthlyOnly = false }: { monthlyOnly?: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state directly from URL search parameters to eliminate hydration pop-in delays
  const [type, setType] = useState(() => {
    const rawType = searchParams?.get("type") || searchParams?.get("report_type");
    const URL_TO_ENGLISH: Record<string, string> = {
      "মাসিক": "monthly",
      "ত্রৈমাসিক": "quarterly",
      "ষান্মাসিক": "halfYearly",
      "নয়-মাসিক": "nineMonth",
      "বার্ষিক": "yearly",
    };
    const cleanType = URL_TO_ENGLISH[rawType || ""] || rawType || "monthly";
    return monthlyOnly ? "monthly" : cleanType;
  });
  const [month, setMonth] = useState(() => searchParams?.get("month") || String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => searchParams?.get("year") || String(new Date().getFullYear()));
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state cleanly whenever URL search parameters change during client navigation
  useEffect(() => {
    const rawType = searchParams?.get("type") || searchParams?.get("report_type");
    const URL_TO_ENGLISH: Record<string, string> = {
      "মাসিক": "monthly",
      "ত্রৈমাসিক": "quarterly",
      "ষান্মাসিক": "halfYearly",
      "নয়-মাসিক": "nineMonth",
      "বার্ষিক": "yearly",
    };
    const cleanType = URL_TO_ENGLISH[rawType || ""] || rawType || "monthly";
    setType(monthlyOnly ? "monthly" : cleanType);
    if (searchParams?.get("month")) setMonth(searchParams.get("month")!);
    if (searchParams?.get("year")) setYear(searchParams.get("year")!);
  }, [searchParams, monthlyOnly]);


  const getEndingMonthForPeriod = (reportType: string): number => {
    switch (reportType) {
      case "quarterly":
      case "ত্রৈমাসিক":
        return 3;
      case "halfYearly":
      case "ষান্মাসিক":
        return 6;
      case "nineMonth":
      case "নয়-মাসিক":
        return 9;
      case "yearly":
      case "বার্ষিক":
        return 12;
      default:
        return 1;
    }
  };

  const handleGo = () => {
    const selMonth = parseInt(month);
    const selYear = parseInt(year);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const isMonthly = type === "monthly" || type === "মাসিক";
    const endingMonth = isMonthly ? selMonth : getEndingMonthForPeriod(type);

    // Check if the selected date is in the future
    if (selYear > currentYear || (selYear === currentYear && endingMonth > currentMonth)) {
      setValidationError("ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।");
      return;
    }

    setValidationError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.set("month", type !== "monthly" ? "1" : month);
    params.set("year", year);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="modern-card p-6 mb-8 bg-card shadow-lg border-primary/10">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {!monthlyOnly && (
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              {t.periodSelector.type}
            </label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              suppressHydrationWarning
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
            >
              <option value="monthly">{t.reportTypes.monthly}</option>
              <option value="quarterly">{t.reportTypes.quarterly}</option>
              <option value="halfYearly">{t.reportTypes.halfYearly}</option>
              <option value="nineMonth">{t.reportTypes.nineMonth}</option>
              <option value="yearly">{t.reportTypes.yearly}</option>
            </select>
          </div>
        )}

        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t.periodSelector.month}
          </label>
          <select 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={type !== "monthly"}
            suppressHydrationWarning
            className="modern-input w-full bg-muted/50 focus:bg-background transition-colors disabled:opacity-50"
          >
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
          <select 
            value={year}
            onChange={(e) => setYear(e.target.value)}
            suppressHydrationWarning
            className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
          >
            <option value="2025">২০২৫</option>
            <option value="2026">২০২৬</option>
          </select>
        </div>

        <button 
          onClick={handleGo}
          className="modern-btn btn-primary h-[48px] px-8 flex items-center gap-2 group w-full md:w-auto justify-center"
        >
          <span>{t.periodSelector.go}</span>
          <ChevronRight className="w-4 h-4 group-active:translate-x-1 transition-transform" />
        </button>
      </div>

      {validationError && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center gap-2">
          <span>⚠️ {validationError}</span>
        </div>
      )}
    </div>
  );
}

