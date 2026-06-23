"use client";

import { useEffect, useState } from "react";
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
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useReport } from "@/components/report/report-context";
import { createClient } from "@/utils/supabase/client";

export function UserDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, reportId, setReportId, loadReport } = useReport();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPeriodSelectorExpanded, setIsPeriodSelectorExpanded] = useState(false);

  // Extract selected period parameters
  const typeParam = searchParams.get("type");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const hasParams = !!(typeParam && monthParam && yearParam);

  const BENGALI_MONTHS = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];

  useEffect(() => {
    if (!hasParams) {
      return;
    }

    const selectedType = typeParam;
    const selectedMonth = parseInt(monthParam);
    const selectedYear = parseInt(yearParam);

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
        setError("ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।");
        setIsLoading(false);
        return;
      }

      // Fetch user profile and zone
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("ব্যবহারকারী চিহ্নিত করা যায়নি।");
        setIsLoading(false);
        return;
      }

      const { data: person } = await supabase
        .from("people")
        .select("zone_id")
        .eq("supabase_uid", user.id)
        .single();

      if (!person?.zone_id) {
        setError("আপনার জোন এখনও নির্ধারণ করা হয়নি।");
        setIsLoading(false);
        return;
      }

      // Map dynamic URL types to Bangla report types
      const REPORT_TYPE_MAP: Record<string, string> = {
        monthly: "মাসিক",
        quarterly: "ত্রৈমাসিক",
        halfYearly: "ষান্মাসিক",
        nineMonth: "নয়-মাসিক",
        yearly: "বার্ষিক",
      };
      const dbReportType = REPORT_TYPE_MAP[selectedType] || "মাসিক";

      // Call database RPC to get or create report
      const { data: repId, error: rpcErr } = await supabase.rpc("get_or_create_report", {
        p_zone_id: person.zone_id,
        p_year: selectedYear,
        p_month: dbReportType !== "মাসিক" ? 1 : selectedMonth,
        p_report_type: dbReportType,
      });

      if (rpcErr || !repId) {
        console.error("RPC Error:", rpcErr);
        setError("রিপোর্ট লোড বা তৈরি করতে সমস্যা হয়েছে।");
      } else {
        setReportId(repId);
        await loadReport(repId);
      }
      setIsLoading(false);
    };

    initReport();
  }, [typeParam, monthParam, yearParam, pathname, router, supabase, setReportId, loadReport, hasParams]);

  const sections = [
    { id: "header", name: t.sections.header, icon: FileText },
    { id: "courses", name: t.sections.courses, icon: BookOpen },
    { id: "organizational", name: t.sections.organizational, icon: Users },
    { id: "personal", name: t.sections.personal, icon: User },
    { id: "meeting", name: t.sections.meeting, icon: Users2 },
    { id: "extra", name: t.sections.extra, icon: PlusSquare },
    { id: "comment", name: t.sections.comment, icon: MessageSquare },
  ];

  if (!hasParams) {
    return (
      <div className="container py-6 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">{t.dashboard}</h1>
          <p className="text-muted-foreground">আপনার জোনের মাসিক রিপোর্ট ম্যানেজ করুন</p>
        </div>
        <PeriodSelector monthlyOnly={true} />
      </div>
    );
  }

  return (
    <div className="container py-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">{t.dashboard}</h1>
        <p className="text-muted-foreground">আপনার জোনের মাসিক রিপোর্ট ম্যানেজ করুন</p>
      </div>

      {!isPeriodSelectorExpanded ? (
        <div className="modern-card p-5 mb-8 bg-card shadow-md border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <span className="font-bold text-foreground">
                মাসিক রিপোর্ট - {BENGALI_MONTHS[parseInt(monthParam!) - 1]} {yearParam}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsPeriodSelectorExpanded(true)}
            className="modern-btn btn-secondary py-2 px-4 text-sm"
          >
            পিরিয়ড পরিবর্তন করুন
          </button>
        </div>
      ) : (
        <div className="relative">
          <PeriodSelector monthlyOnly={true} />
          <button
            onClick={() => setIsPeriodSelectorExpanded(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm font-semibold z-10"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">রিপোর্ট লোড করা হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive font-bold flex flex-col items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              
              return (
                <div 
                  key={section.id} 
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="premium-card p-5 flex flex-col justify-between group h-full animate-fade-in-up border-border bg-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-4">{section.name}</h3>
                    <Link 
                      href={`/report/${section.id}?type=${typeParam}&month=${monthParam}&year=${yearParam}`}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 bg-linear-to-r from-primary to-primary/80"
                    >
                      <span>{t.actions.edit}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


