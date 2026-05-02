"use client";

import { useEffect } from "react";
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

function SectionSwitcher() {
  const { section } = useParams();
  const { t } = useLanguage();
  const { reportId, setReportId, loadReport } = useReport();

  // For now, let's assume we have a report ID from the URL or state
  // In a real app, we'd fetch the active report for the user/period
  useEffect(() => {
    // Placeholder ID for development
    if (!reportId) {
      setReportId(1); 
      loadReport(1);
    }
  }, [reportId, setReportId, loadReport]);

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
