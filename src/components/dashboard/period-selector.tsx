"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { getDhakaDate } from "@/lib/date-utils";
import { 
  REPORT_TYPES, 
  QUARTERS_BN, 
  HALVES_BN, 
  MONTHS_BN, 
  resolvePeriodConfig 
} from "@/lib/report-utils";
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
    if (monthlyOnly) return "monthly";
    const URL_TO_ENGLISH: Record<string, string> = {
      "মাসিক": "monthly",
      "ত্রৈমাসিক": "quarterly",
      "ষান্মাসিক": "halfYearly",
      "নয়-মাসিক": "nineMonth",
      "বার্ষিক": "yearly",
      "কাস্টম": "custom",
      "কাস্টম রেঞ্জ": "custom",
    };
    return URL_TO_ENGLISH[rawType || ""] || rawType || "monthly";
  });

  const [month, setMonth] = useState(() => {
    return searchParams?.get("month") || String(getDhakaDate().month);
  });

  const [quarter, setQuarter] = useState(() => {
    if (searchParams?.get("quarter")) return searchParams.get("quarter")!;
    const m = Number(searchParams?.get("month") || getDhakaDate().month);
    return String(Math.ceil(m / 3));
  });

  const [half, setHalf] = useState(() => {
    if (searchParams?.get("half")) return searchParams.get("half")!;
    const m = Number(searchParams?.get("month") || getDhakaDate().month);
    return m <= 6 ? "1" : "2";
  });

  const [startMonth, setStartMonth] = useState(() => {
    return searchParams?.get("startMonth") || searchParams?.get("month") || "1";
  });

  const [endMonth, setEndMonth] = useState(() => {
    return searchParams?.get("endMonth") || String(getDhakaDate().month);
  });

  const [year, setYear] = useState(() => {
    return searchParams?.get("year") || String(getDhakaDate().year);
  });

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
      "কাস্টম": "custom",
      "কাস্টম রেঞ্জ": "custom",
    };
    const cleanType = URL_TO_ENGLISH[rawType || ""] || rawType || "monthly";
    setType(monthlyOnly ? "monthly" : cleanType);

    if (searchParams?.get("month")) setMonth(searchParams.get("month")!);
    if (searchParams?.get("quarter")) setQuarter(searchParams.get("quarter")!);
    if (searchParams?.get("half")) setHalf(searchParams.get("half")!);
    if (searchParams?.get("startMonth")) setStartMonth(searchParams.get("startMonth")!);
    if (searchParams?.get("endMonth")) setEndMonth(searchParams.get("endMonth")!);
    if (searchParams?.get("year")) setYear(searchParams.get("year")!);
  }, [searchParams, monthlyOnly]);

  const handleGo = () => {
    if (type === "custom" && Number(startMonth) > Number(endMonth)) {
      setValidationError("শুরু মাস শেষ মাসের চেয়ে পরে হতে পারে না।");
      return;
    }

    const config = resolvePeriodConfig({
      type,
      month,
      quarter,
      half,
      startMonth,
      endMonth,
      year,
    });

    // Start-Month Future Lockout rule: A period is only future if its starting month has not occurred yet
    if (config.isFuture) {
      setValidationError("ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা দেখা সম্ভব নয়।");
      return;
    }

    setValidationError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", config.type);
    params.set("year", String(config.year));

    if (config.type === "monthly") {
      params.set("month", String(config.startMonth));
      params.delete("quarter");
      params.delete("half");
      params.delete("startMonth");
      params.delete("endMonth");
    } else if (config.type === "quarterly") {
      const q = Math.ceil(config.startMonth / 3);
      params.set("quarter", String(q));
      params.set("month", String(config.startMonth));
      params.delete("half");
      params.delete("startMonth");
      params.delete("endMonth");
    } else if (config.type === "halfYearly") {
      const h = config.startMonth <= 6 ? "1" : "2";
      params.set("half", h);
      params.set("month", String(config.startMonth));
      params.delete("quarter");
      params.delete("startMonth");
      params.delete("endMonth");
    } else if (config.type === "custom") {
      params.set("startMonth", String(config.startMonth));
      params.set("endMonth", String(config.endMonth));
      params.set("month", String(config.startMonth));
      params.delete("quarter");
      params.delete("half");
    } else {
      // nineMonth, yearly
      params.set("month", String(config.startMonth));
      params.delete("quarter");
      params.delete("half");
      params.delete("startMonth");
      params.delete("endMonth");
    }

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
              {REPORT_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic Period Scope Controls */}
        {type === "monthly" && (
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t.periodSelector.month}
            </label>
            <select 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              suppressHydrationWarning
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
            >
              {MONTHS_BN.map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === "quarterly" && (
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ত্রৈমাসিক নির্ধারণ করুন
            </label>
            <select 
              value={quarter}
              onChange={(e) => {
                setQuarter(e.target.value);
                const q = Number(e.target.value);
                setMonth(String((q - 1) * 3 + 1));
              }}
              suppressHydrationWarning
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
            >
              {QUARTERS_BN.map((q) => (
                <option key={q.quarter} value={String(q.quarter)}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === "halfYearly" && (
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ষান্মাসিক নির্ধারণ করুন
            </label>
            <select 
              value={half}
              onChange={(e) => {
                setHalf(e.target.value);
                setMonth(e.target.value === "2" ? "7" : "1");
              }}
              suppressHydrationWarning
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
            >
              {HALVES_BN.map((h) => (
                <option key={h.half} value={String(h.half)}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === "nineMonth" && (
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              সময়সীমা
            </label>
            <input 
              type="text" 
              readOnly 
              value="জানুয়ারি – সেপ্টেম্বর (৯ মাস)" 
              className="modern-input w-full bg-muted/40 font-medium text-foreground cursor-not-allowed"
            />
          </div>
        )}

        {type === "yearly" && (
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              সময়সীমা
            </label>
            <input 
              type="text" 
              readOnly 
              value="জানুয়ারি – ডিসেম্বর (পূর্ণ বছর)" 
              className="modern-input w-full bg-muted/40 font-medium text-foreground cursor-not-allowed"
            />
          </div>
        )}

        {type === "custom" && (
          <>
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                শুরু মাস
              </label>
              <select 
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                suppressHydrationWarning
                className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
              >
                {MONTHS_BN.map((m, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                শেষ মাস
              </label>
              <select 
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                suppressHydrationWarning
                className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
              >
                {MONTHS_BN.map((m, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

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
            <option value="2027">২০২৭</option>
          </select>
        </div>

        <button 
          onClick={handleGo}
          className="modern-btn btn-primary h-[48px] px-8 flex items-center gap-2 group w-full md:w-auto justify-center cursor-pointer"
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
