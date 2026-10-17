"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useReport, ReportProvider } from "@/components/report/report-context";
import { SectionLayout } from "@/components/report/section-layout";
import { ReportHeaderForm } from "@/components/report/sections/report-header-form";
import { CoursesForm } from "@/components/report/sections/courses-form";
import { OrganizationalForm } from "@/components/report/sections/organizational-form";
import { PersonalForm } from "@/components/report/sections/personal-form";
import { MeetingsForm } from "@/components/report/sections/meetings-form";
import { ExtrasForm } from "@/components/report/sections/extras-form";
import { CommentsForm } from "@/components/report/sections/comments-form";
import { createClient } from "@/utils/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

/** Returns true only when the param is a real value (not null, "null", undefined, "undefined") */
function isValidParam(val: string | null): val is string {
  return !!val && val !== "null" && val !== "undefined";
}

function SectionSwitcher() {
  const { section } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tc } = useLanguage();
  const { reportId, setReportId, loadReport, data, loadError } = useReport();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract selected period from URL params
  const typeParam = searchParams.get("type");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const hasValidParams =
    isValidParam(typeParam) && isValidParam(monthParam) && isValidParam(yearParam);

  useEffect(() => {
    // 1. Redirect to dashboard if params are missing or invalid (e.g. "null" strings)
    if (!hasValidParams) {
      // Preserve any valid params that did come through
      router.replace("/");
      return;
    }

    const selectedType = typeParam!;
    const selectedMonth = parseInt(monthParam!);
    const selectedYear = parseInt(yearParam!);

    // Extra safety guard: if parseInt returns NaN, redirect
    if (isNaN(selectedMonth) || isNaN(selectedYear)) {
      router.replace("/");
      return;
    }

    let ignore = false;

    const fetchActiveReport = async () => {
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
          setError(t.futureReportError);
          setIsLoading(false);
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (ignore) return;
      if (!user) {
        router.replace("/home");
        return;
      }

      // Get the user's person record for their zone and role
      const { data: person } = await supabase
        .from("people")
        .select("zone_id, role")
        .eq("supabase_uid", user.id)
        .single();

      if (ignore) return;

      // WEB-006 fix (ADR-009): Admins must not access zone data-entry forms
      if (person?.role === "admin" || person?.role === "superadmin") {
        router.replace("/dashboard");
        return;
      }

      if (!person || !person.zone_id) {
        setError(t.zoneNotAssigned);
        setIsLoading(false);
        return;
      }

      // Map dynamic URL types to Bangla report types
      const REPORT_TYPE_MAP: Record<string, string> = {
        monthly: t.reportTypes.monthly,
        quarterly: t.reportTypes.quarterly,
        halfYearly: t.reportTypes.halfYearly,
        nineMonth: t.reportTypes.nineMonth,
        yearly: t.reportTypes.yearly,
        [t.reportTypes.monthly]: t.reportTypes.monthly,
        [t.reportTypes.quarterly]: t.reportTypes.quarterly,
        [t.reportTypes.halfYearly]: t.reportTypes.halfYearly,
        [t.reportTypes.nineMonth]: t.reportTypes.nineMonth,
        [t.reportTypes.yearly]: t.reportTypes.yearly,
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
        console.error("Error initializing report:", rpcErr);
        setError(t.reportLoadError);
        setIsLoading(false);
        return;
      }

      // RS-23 Fix: If report is already in memory for this exact ID and has data, skip redundant re-fetch on section tab changes
      if (reportId === repId && data && Object.keys(data).length > 0 && !loadError) {
        if (!ignore) setIsLoading(false);
        return;
      }

      setReportId(repId);
      const res = await loadReport(repId);
      if (ignore) return;
      if (!res.success) {
        setError(t.reportLoadError || "রিপোর্ট ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।");
      }
      if (!ignore) {
        setIsLoading(false);
      }
    };

    fetchActiveReport();

    return () => {
      ignore = true;
    };
  }, [typeParam, monthParam, yearParam, hasValidParams, supabase, router, setReportId, loadReport, reportId, data, loadError, t]);

  const activeError = error || loadError;

  if (activeError) {
    return (
      <SectionLayout title="">
        <div className="text-center py-16 text-destructive flex flex-col items-center gap-4 max-w-md mx-auto p-6 bg-destructive/5 rounded-2xl border border-destructive/20 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
            <span>{activeError}</span>
          </div>
          <p className="text-sm font-normal text-muted-foreground">
            আপনার পূর্বের ডেটা সুরক্ষিত আছে। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (reportId) {
                loadReport(reportId).then((res) => {
                  if (!res.success) {
                    setError(t.reportLoadError || "রিপোর্ট ডেটা লোড করতে সমস্যা হয়েছে।");
                  }
                  setIsLoading(false);
                });
              } else {
                router.refresh();
              }
            }}
            className="modern-btn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
          >
            পুনরায় চেষ্টা করুন (Retry)
          </button>
        </div>
      </SectionLayout>
    );
  }

  if (!hasValidParams || isLoading || !data || Object.keys(data).length === 0) {
    return (
      <SectionLayout title="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SectionLayout>
    );
  }

  switch (section) {
    case "header":
      return (
        <SectionLayout title={t.sections.header}>
          <ReportHeaderForm />
        </SectionLayout>
      );
    case "courses":
      return (
        <SectionLayout title={t.sections.courses}>
          <CoursesForm />
        </SectionLayout>
      );
    case "organizational":
      return (
        <SectionLayout title={t.sections.organizational}>
          <OrganizationalForm />
        </SectionLayout>
      );
    case "personal":
      return (
        <SectionLayout title={t.sections.personal}>
          <PersonalForm />
        </SectionLayout>
      );
    case "meeting":
      return (
        <SectionLayout title={t.sections.meeting}>
          <MeetingsForm />
        </SectionLayout>
      );
    case "extra":
      return (
        <SectionLayout title={t.sections.extra}>
          <ExtrasForm />
        </SectionLayout>
      );
    case "comment":
      return (
        <SectionLayout title={t.sections.comment}>
          <CommentsForm />
        </SectionLayout>
      );
    default:
      return (
        <SectionLayout title="Unknown Section">
          <div className="text-center py-20">Section not found.</div>
        </SectionLayout>
      );
  }
}

export default function ReportSectionPage() {
  return <SectionSwitcher />;
}
