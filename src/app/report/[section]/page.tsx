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
import { Loader2 } from "lucide-react";

/** Returns true only when the param is a real value (not null, "null", undefined, "undefined") */
function isValidParam(val: string | null): val is string {
  return !!val && val !== "null" && val !== "undefined";
}

function SectionSwitcher() {
  const { section } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { reportId, setReportId, loadReport } = useReport();
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
          setError("ভবিষ্যতের সময়ের জন্য রিপোর্ট তৈরি বা পরিবর্তন করা সম্ভব নয়।");
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

      // Get the user's person record for their zone
      const { data: person } = await supabase
        .from("people")
        .select("zone_id")
        .eq("supabase_uid", user.id)
        .single();

      if (ignore) return;
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

    fetchActiveReport();

    return () => {
      ignore = true;
    };
  }, [typeParam, monthParam, yearParam, hasValidParams, supabase, router, setReportId, loadReport]);

  if (!hasValidParams || isLoading) {
    return (
      <SectionLayout title="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SectionLayout>
    );
  }

  if (error) {
    return (
      <SectionLayout title="">
        <div className="text-center py-20 text-destructive font-bold flex flex-col items-center gap-2">
          <span>⚠️ {error}</span>
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
  return (
    <ReportProvider>
      <SectionSwitcher />
    </ReportProvider>
  );
}
