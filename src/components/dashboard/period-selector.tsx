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

export function PeriodSelector() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state to safe default strings to avoid hydration errors
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState("monthly");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("2026");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Set mounted to true on client-side mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state with URL search parameters changes only after mounted is true
  useEffect(() => {
    if (!mounted) return;
    setType(searchParams.get("type") || "monthly");
    setMonth(searchParams.get("month") || String(new Date().getMonth() + 1));
    setYear(searchParams.get("year") || String(new Date().getFullYear()));
  }, [searchParams, mounted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleGo = () => {
    const selMonth = parseInt(month);
    const selYear = parseInt(year);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Check if the selected date is in the future
    if (selYear > currentYear || (selYear === currentYear && selMonth > currentMonth)) {
      setValidationError("ভবিষ্যতের মাসের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।");
      return;
    }

    setValidationError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.set("month", month);
    params.set("year", year);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="modern-card p-6 mb-8 bg-card shadow-lg border-primary/10">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            {t.periodSelector.type}
          </label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
          >
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
          <select 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
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

