"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  ArrowRight,
  Loader2,
  Calendar,
  Pencil
} from "lucide-react";
import Link from "next/link";
import { useReport } from "@/components/report/report-context";
import { createClient } from "@/utils/supabase/client";

const BENGALI_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "০";
  return String(n).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d)]);
}

export function UserDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, reportId, setReportId, loadReport } = useReport();
  const supabase = useMemo(() => createClient(), []);

  // isLoading only starts true when we have params to fetch with
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPeriodSelectorExpanded, setIsPeriodSelectorExpanded] = useState(false);
  const [zoneName, setZoneName] = useState<string>("");

  // Extract selected period parameters
  const typeParam = searchParams.get("type");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  // Params are valid only when all three are present AND not the string "null"
  const isValidParam = (val: string | null) =>
    !!val && val !== "null" && val !== "undefined";
  const hasParams = isValidParam(typeParam) && isValidParam(monthParam) && isValidParam(yearParam);

  useEffect(() => {
    if (!hasParams) {
      // No valid params — show the PeriodSelector, reset any previous state
      setIsLoading(false);
      setError(null);
      return;
    }

    let ignore = false;

    const selectedType = typeParam!;
    const selectedMonth = parseInt(monthParam!);
    const selectedYear = parseInt(yearParam!);

    const initReport = async () => {
      setIsLoading(true);
      setError(null);

      // Validate future periods
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

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

      const isMonthly = selectedType === "monthly" || selectedType === "মাসিক";
      const endingMonth = isMonthly ? selectedMonth : getEndingMonthForPeriod(selectedType);

      if (selectedYear > currentYear || (selectedYear === currentYear && endingMonth > currentMonth)) {
        if (!ignore) {
          setError("ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।");
          setIsLoading(false);
        }
        return;
      }

      // Fetch user profile and zone
      const { data: { user } } = await supabase.auth.getUser();
      if (ignore) return;
      if (!user) {
        router.replace("/home");
        return;
      }

      const { data: person } = await supabase
        .from("people")
        .select("zone_id, zone(name)")
        .eq("supabase_uid", user.id)
        .single();

      if (ignore) return;
      if (!person?.zone_id) {
        setError("আপনার জোন এখনও নির্ধারণ করা হয়নি।");
        setIsLoading(false);
        return;
      }

      const zoneObj = person.zone as any;
      if (zoneObj?.name) {
        setZoneName(zoneObj.name);
      }

      // Map dynamic URL types to Bangla report types
      const REPORT_TYPE_MAP: Record<string, string> = {
        monthly: "মাসিক",
        quarterly: "ত্রৈমাসিক",
        halfYearly: "ষান্মাসিক",
        nineMonth: "নয়-মাসিক",
        yearly: "বার্ষিক",
        "মাসিক": "মাসিক",
        "ত্রৈমাসিক": "ত্রৈমাসিক",
        "ষান্মাসিক": "ষান্মাসিক",
        "নয়-মাসিক": "নয়-মাসিক",
        "বার্ষিক": "বার্ষিক",
      };
      const dbReportType = REPORT_TYPE_MAP[selectedType] || "মাসিক";

      // Call database RPC to get or create report
      const { data: repId, error: rpcErr } = await supabase.rpc("get_or_create_report", {
        p_zone_id: person.zone_id,
        p_year: selectedYear,
        p_month: dbReportType !== "মাসিক" ? 1 : selectedMonth,
        p_report_type: dbReportType,
      });

      if (ignore) return;
      if (rpcErr || !repId) {
        console.error("RPC Error:", rpcErr);
        setError("রিপোর্ট লোড বা তৈরি করতে সমস্যা হয়েছে।");
      } else {
        setReportId(repId);
        await loadReport(repId);
      }
      if (!ignore) {
        setIsLoading(false);
      }
    };

    initReport();

    return () => {
      ignore = true;
    };
  }, [typeParam, monthParam, yearParam, supabase, setReportId, loadReport, hasParams]);

  const sections = [
    { id: "header", name: t.sections.header, icon: FileText },
    { id: "courses", name: t.sections.courses, icon: BookOpen },
    { id: "organizational", name: t.sections.organizational, icon: Users },
    { id: "personal", name: t.sections.personal, icon: User },
    { id: "meeting", name: t.sections.meeting, icon: Users2 },
    { id: "extra", name: t.sections.extra, icon: PlusSquare },
    { id: "comment", name: t.sections.comment, icon: MessageSquare },
  ];

  const REPORT_TYPE_MAP: Record<string, string> = {
    monthly: "মাসিক",
    quarterly: "ত্রৈমাসিক",
    halfYearly: "ষান্মাসিক",
    nineMonth: "নয়-মাসিক",
    yearly: "বার্ষিক",
    "মাসিক": "মাসিক",
    "ত্রৈমাসিক": "ত্রৈমাসিক",
    "ষান্মাসিক": "ষান্মাসিক",
    "নয়-মাসিক": "নয়-মাসিক",
    "বার্ষিক": "বার্ষিক",
  };

  const displayReportType = typeParam ? (REPORT_TYPE_MAP[typeParam] || typeParam) : "মাসিক";
  const displayPeriodLabel = useMemo(() => {
    if (!monthParam || !yearParam) return "";
    if (displayReportType === "মাসিক") {
      return `${BENGALI_MONTHS[parseInt(monthParam) - 1]} ${toBn(yearParam)}`;
    }
    return `${displayReportType} ${toBn(yearParam)}`;
  }, [monthParam, yearParam, displayReportType]);

  return (
    <div className="container py-6 pb-24 max-w-7xl animate-in fade-in duration-500">
      {/* ── Dashboard Header with Bismillah & Talimul Heading ── */}
      <div className="flex flex-col items-center justify-center text-center p-6 bg-card border border-border/50 rounded-3xl shadow-xs relative mb-6">
        <div className="w-full max-w-3xl py-2">
          <p className="text-base md:text-lg font-bold text-foreground mb-1.5">
            বিসমিল্লাহির রহমানীর রহীম
          </p>
          <p className="text-2xl md:text-3xl font-black text-foreground mb-1.5">
            তা&apos;লীমুল কুরআন বিভাগ
          </p>
          {hasParams && zoneName ? (
            <p className="text-lg md:text-xl font-bold text-primary mb-0 animate-in fade-in duration-300">
              {zoneName} জোন - {displayReportType} রিপোর্ট - {displayPeriodLabel}
            </p>
          ) : (
            <p className="text-sm md:text-base font-medium text-muted-foreground mb-0">
              আপনার জোনের রিপোর্ট ও সাংগঠনিক ডেটা প্রদান করুন
            </p>
          )}
        </div>

        {/* Compact Period Selector Pill (Top-Right on Desktop, Compact below heading on Mobile) */}
        {hasParams && (
          <div className="mt-4 md:mt-0 md:absolute md:right-6 md:top-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsPeriodSelectorExpanded(!isPeriodSelectorExpanded)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-muted/60 hover:bg-muted border border-border/80 text-xs sm:text-sm font-bold text-foreground transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-none">
                {BENGALI_MONTHS[parseInt(monthParam!) - 1]} {toBn(yearParam!)}
              </span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* Period Selector — always shown when !hasParams, or when pill is expanded */}
      {(!hasParams || isPeriodSelectorExpanded) && (
        <div className="relative mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
          <PeriodSelector monthlyOnly={true} />
          {hasParams && (
            <button
              onClick={() => setIsPeriodSelectorExpanded(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs sm:text-sm font-bold z-10 bg-card/80 px-3 py-1.5 rounded-xl border border-border/50 shadow-2xs cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      )}

      {/* Loading State — only when we have params and are actively fetching */}
      {hasParams && isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-bold">রিপোর্ট লোড করা হচ্ছে...</p>
        </div>
      ) : hasParams && error ? (
        <div className="text-center py-20 text-destructive font-bold flex flex-col items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      ) : hasParams && !isLoading && !error ? (
        /* Report Sections Grid — only shown when period is selected and loaded */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            
            return (
              <div 
                key={section.id} 
                style={{ animationDelay: `${index * 60}ms` }}
                className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col justify-between group h-full animate-in fade-in slide-in-from-bottom-2 shadow-2xs transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-4 text-foreground">{section.name}</h3>
                  <Link 
                    href={`/report/${section.id}?type=${typeParam}&month=${monthParam}&year=${yearParam}`}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 bg-linear-to-r from-primary to-primary/80"
                  >
                    <span>{t.actions.edit}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
