"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

function SectionSwitcher() {
  const { section } = useParams();
  const { t } = useLanguage();
  const { reportId, setReportId, loadReport } = useReport();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      setIsLoading(false);
      return;
    }

    const fetchActiveReport = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("ব্যবহারকারী চিহ্নিত করা যায়নি।");
        setIsLoading(false);
        return;
      }

      // Get the user's person record for their zone
      const { data: person } = await supabase
        .from("people")
        .select("zone_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!person?.zone_id) {
        setError("আপনার জোন এখনও নির্ধারণ করা হয়নি।");
        setIsLoading(false);
        return;
      }

      // Find the current period's report for this zone
      const now = new Date();
      const { data: report } = await supabase
        .from("report")
        .select("id")
        .eq("zone_id", person.zone_id)
        .eq("year", now.getFullYear())
        .eq("month", now.getMonth() + 1)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (report) {
        setReportId(report.id);
        await loadReport(report.id);
      } else {
        setError("এই মাসের জন্য কোনো রিপোর্ট পাওয়া যায়নি। প্রথমে একটি নতুন রিপোর্ট তৈরি করুন।");
      }
      setIsLoading(false);
    };

    fetchActiveReport();
  }, [reportId, setReportId, loadReport]);

  if (isLoading) {
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
        <div className="text-center py-20 text-muted-foreground">{error}</div>
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

