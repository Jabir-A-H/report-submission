"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useUser } from "@/components/providers/user-provider";
import { useReport } from "@/components/report/report-context";
import { SectionLayout } from "@/components/report/section-layout";
import { ReportHeaderForm } from "@/components/report/sections/report-header-form";
import { CoursesForm } from "@/components/report/sections/courses-form";
import { OrganizationalForm } from "@/components/report/sections/organizational-form";
import { PersonalForm } from "@/components/report/sections/personal-form";
import { MeetingsForm } from "@/components/report/sections/meetings-form";
import { ExtrasForm } from "@/components/report/sections/extras-form";
import { CommentsForm } from "@/components/report/sections/comments-form";
import { Loader2, AlertCircle } from "lucide-react";

function SectionSwitcher() {
  const { section } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { isAdmin, isSuperAdmin, isLoading: isUserLoading } = useUser();
  const { reportId, setReportId, loadReport, data, loadError } = useReport();
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const reportIdParam = searchParams.get("reportId") || searchParams.get("report_id");

  // Admin access guard: admins must not access zone data-entry forms
  useEffect(() => {
    if (!isUserLoading && (isAdmin || isSuperAdmin)) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isSuperAdmin, isUserLoading, router]);

  useEffect(() => {
    // 1. If no reportIdParam in URL:
    if (!reportIdParam) {
      if (reportId) {
        // In-memory reportId exists: replace URL with canonical pointer
        router.replace(`/report/${section}?reportId=${reportId}`);
      } else {
        // No reportId in memory: redirect to dashboard
        router.replace("/");
      }
      return;
    }

    const targetId = Number(reportIdParam);
    if (isNaN(targetId)) {
      router.replace("/");
      return;
    }

    // 2. If in-memory reportId matches URL targetId and data is already loaded in context:
    if (reportId === targetId && data && Object.keys(data).length > 0 && !loadError) {
      setIsLoading(false);
      setAccessError(null);
      return;
    }

    // 3. Not in memory: load directly by ID (skip RPC)
    let ignore = false;
    setIsLoading(true);
    setAccessError(null);

    loadReport(targetId).then((res) => {
      if (ignore) return;
      setIsLoading(false);
      if (res.success) {
        setReportId(targetId);
        setAccessError(null);
      } else {
        console.error("Failed to load report by canonical ID:", res.error);
        // Handle PGRST116 / access-denied / not-found
        setAccessError("রিপোর্টটি খুঁজে পাওয়া যায়নি অথবা এটি দেখার অনুমতি আপনার নেই");
      }
    });

    return () => {
      ignore = true;
    };
  }, [reportIdParam, reportId, data, loadError, section, router, loadReport, setReportId]);

  // Handle access error (PGRST116 / unauthorized / tampering)
  if (accessError) {
    return (
      <SectionLayout title="">
        <div className="text-center py-16 flex flex-col items-center gap-4 max-w-md mx-auto p-6 bg-card rounded-2xl border border-destructive/30 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 text-lg font-bold text-destructive">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
            <span>{accessError}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            অনুরোধকৃত রিপোর্টটি বিদ্যমান নেই অথবা আপনার জোনের সাথে সংশ্লিষ্ট নয়।
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="modern-btn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            ড্যাশবোর্ডে ফিরে যান
          </button>
        </div>
      </SectionLayout>
    );
  }

  // Handle load error (network / transient)
  if (loadError) {
    return (
      <SectionLayout title="">
        <div className="text-center py-16 text-destructive flex flex-col items-center gap-4 max-w-md mx-auto p-6 bg-destructive/5 rounded-2xl border border-destructive/20 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
            <span>{loadError}</span>
          </div>
          <p className="text-sm font-normal text-muted-foreground">
            আপনার পূর্বের ডেটা সুরক্ষিত আছে। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (reportIdParam) {
                  setIsLoading(true);
                  loadReport(Number(reportIdParam)).then(() => setIsLoading(false));
                } else {
                  router.refresh();
                }
              }}
              className="modern-btn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              পুনরায় চেষ্টা করুন (Retry)
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="modern-btn border border-border bg-card hover:bg-muted px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              ড্যাশবোর্ডে ফিরে যান
            </button>
          </div>
        </div>
      </SectionLayout>
    );
  }

  if (isLoading || !data || Object.keys(data).length === 0) {
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
