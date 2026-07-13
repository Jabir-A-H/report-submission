"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CorrectionButton } from "@/components/admin/correction-button";
import {
  Building2,
  Download,
  FileText,
  Loader2,
  Save,
  SearchX,
  ChevronRight,
} from "lucide-react";
import { ORG_CATEGORIES } from "@/components/report/sections/organizational-form";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderRow {
  year: number;
  month: number;
  report_type: string;
  total_muallima: number;
  muallima_increase: number;
  muallima_decrease: number;
  certified_muallima: number;
  certified_muallima_taking_classes: number;
  trained_muallima: number;
  trained_muallima_taking_classes: number;
  total_unit: number;
  units_with_muallima: number;
}

interface CourseRow {
  year: number;
  month: number;
  report_type: string;
  category: string;
  number: number;
  increase: number;
  decrease: number;
  sessions: number;
  students: number;
  attendance: number;
  status_board: number;
  status_qayda: number;
  status_ampara: number;
  status_quran: number;
  completed: number;
  correctly_learned: number;
}

interface OrgRow {
  year: number;
  month: number;
  report_type: string;
  category: string;
  number: number;
  increase: number;
  amount: number;
}

interface PersonalRow {
  year: number;
  month: number;
  report_type: string;
  category: string;
  teaching: number;
  learning: number;
  olama_invited: number;
  became_shohojogi: number;
  became_sokrio_shohojogi: number;
  became_kormi: number;
  became_rukon: number;
}

interface MeetingRow {
  year: number;
  month: number;
  report_type: string;
  category: string;
  city_count: number;
  city_avg_attendance: number;
  thana_count: number;
  thana_avg_attendance: number;
  ward_count: number;
  ward_avg_attendance: number;
  meeting_name?: string;
  comments?: string;
}

interface ExtraRow {
  year: number;
  month: number;
  report_type: string;
  category: string;
  number: number;
}

interface OverrideRow {
  id: number;
  year: number;
  month: number;
  report_type: string;
  section: string;
  field: string;
  value: string;
  category: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const REPORT_TYPES = [
  { value: "মাসিক", label: "মাসিক" },
  { value: "ত্রৈমাসিক", label: "ত্রৈমাসিক" },
  { value: "ষান্মাসিক", label: "ষান্মাসিক" },
  { value: "নয়-মাসিক", label: "নয়-মাসিক" },
  { value: "বার্ষিক", label: "বার্ষিক" },
];

const HEADER_FIELDS: { key: keyof HeaderRow; label: string; color?: string }[] =
  [
    { key: "total_muallima", label: "মোট মুয়াল্লিমা" },
    { key: "muallima_increase", label: "বৃদ্ধি", color: "text-green-600" },
    { key: "muallima_decrease", label: "ঘাটতি", color: "text-red-500" },
    { key: "certified_muallima", label: "সনদপ্রাপ্তা" },
    {
      key: "certified_muallima_taking_classes",
      label: "সনদপ্রাপ্তা ক্লাস নিচ্ছেন",
    },
    { key: "trained_muallima", label: "প্রশিক্ষণপ্রাপ্তা" },
    {
      key: "trained_muallima_taking_classes",
      label: "প্রশিক্ষণপ্রাপ্তা ক্লাস নিচ্ছেন",
    },
    { key: "total_unit", label: "মোট ইউনিট" },
    { key: "units_with_muallima", label: "মুয়াল্লিমা আছে" },
  ];

const COURSE_COLUMNS: { key: keyof CourseRow; label: string }[] = [
  { key: "category", label: "বিভাগ/ধরন" },
  { key: "number", label: "সংখ্যা" },
  { key: "increase", label: "বৃদ্ধি" },
  { key: "decrease", label: "ঘাটতি" },
  { key: "sessions", label: "ক্লাস" },
  { key: "students", label: "শিক্ষার্থী" },
  { key: "attendance", label: "উপস্থিতি" },
  { key: "status_board", label: "বোর্ড" },
  { key: "status_qayda", label: "কায়দা" },
  { key: "status_ampara", label: "আমপারা" },
  { key: "status_quran", label: "কুরআন" },
  { key: "completed", label: "শেষ করেছে" },
  { key: "correctly_learned", label: "সহীহ শিখেছে" },
];

const ORG_COLUMNS: { key: keyof OrgRow; label: string }[] = [
  { key: "category", label: "বিভাগ" },
  { key: "number", label: "সংখ্যা" },
  { key: "increase", label: "বৃদ্ধি" },
  { key: "amount", label: "পরিমাণ/টাকা" },
];

const PERSONAL_COLUMNS: { key: keyof PersonalRow; label: string }[] = [
  { key: "category", label: "বিভাগ" },
  { key: "teaching", label: "তা'লীম দান" },
  { key: "learning", label: "তা'লীম গ্রহণ" },
  { key: "olama_invited", label: "ওলামা আমন্ত্রণ" },
  { key: "became_shohojogi", label: "সহযোগী" },
  { key: "became_sokrio_shohojogi", label: "সক্রিয় সহযোগী" },
  { key: "became_kormi", label: "কর্মী" },
  { key: "became_rukon", label: "রুকন" },
];

const MEETING_COLUMNS = [
  { key: "category", label: "বিভাগ" },
  { group: "মহানগরী", fields: [
    { key: "city_count", label: "সংখ্যা" },
    { key: "city_avg_attendance", label: "গড় উপস্থিতি" },
  ]},
  { group: "থানা", fields: [
    { key: "thana_count", label: "সংখ্যা" },
    { key: "thana_avg_attendance", label: "গড় উপস্থিতি" },
  ]},
  { group: "ওয়ার্ড", fields: [
    { key: "ward_count", label: "সংখ্যা" },
    { key: "ward_avg_attendance", label: "গড় উপস্থিতি" },
  ]},
] as const;

const EXTRA_COLUMNS: { key: keyof ExtraRow; label: string }[] = [
  { key: "category", label: "বিভাগ" },
  { key: "number", label: "সংখ্যা" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "০";
  return String(n).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d)]);
}

/** Get the months array for a given report type and selected month */
function getMonthsForPeriod(
  reportType: string,
  selectedMonth: number
): number[] {
  switch (reportType) {
    case "ত্রৈমাসিক":
      return [1, 2, 3];
    case "ষান্মাসিক":
      return [1, 2, 3, 4, 5, 6];
    case "নয়-মাসিক":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    case "বার্ষিক":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    default: // মাসিক
      return [selectedMonth];
  }
}

/** Sum numeric fields across multiple rows, grouped by category */
function sumRows<T>(
  rows: T[],
  numericKeys: string[]
): T[] {
  const grouped = new Map<string, T>();
  for (const row of rows) {
    const cat = ((row as any).category as string) || "__header__";
    if (!grouped.has(cat)) {
      grouped.set(cat, { ...row });
    } else {
      const existing = grouped.get(cat)!;
      for (const k of numericKeys) {
        (existing as any)[k] =
          ((existing as any)[k] || 0) + ((row as any)[k] || 0);
      }
      if ((row as any).meeting_name && (row as any).meeting_name.trim() !== "") {
        if (!((existing as any).meeting_name || "").includes((row as any).meeting_name.trim())) {
          (existing as any).meeting_name = [(existing as any).meeting_name, (row as any).meeting_name.trim()].filter(Boolean).join(", ");
        }
      }
      if ((row as any).comments && (row as any).comments.trim() !== "") {
        if (!((existing as any).comments || "").includes((row as any).comments.trim())) {
          (existing as any).comments = [(existing as any).comments, (row as any).comments.trim()].filter(Boolean).join(", ");
        }
      }
    }
  }
  return Array.from(grouped.values());
}

/** Sum header rows (single row result) */
function sumHeaderRows(rows: HeaderRow[]): HeaderRow | null {
  if (rows.length === 0) return null;
  const base = { ...rows[0] };
  const numericKeys: (keyof HeaderRow)[] = [
    "total_muallima",
    "muallima_increase",
    "muallima_decrease",
    "certified_muallima",
    "certified_muallima_taking_classes",
    "trained_muallima",
    "trained_muallima_taking_classes",
    "total_unit",
    "units_with_muallima",
  ];
  for (let i = 1; i < rows.length; i++) {
    for (const k of numericKeys) {
      (base as any)[k] =
        ((base as any)[k] || 0) + ((rows[i] as any)[k] || 0);
    }
  }
  return base;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CityReportPage() {
  const supabase = createClient();

  // Period selection state
  const [reportType, setReportType] = useState("মাসিক");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Data state
  const [headerData, setHeaderData] = useState<HeaderRow | null>(null);
  const [courseData, setCourseData] = useState<CourseRow[]>([]);
  const [orgData, setOrgData] = useState<OrgRow[]>([]);
  const [personalData, setPersonalData] = useState<PersonalRow[]>([]);
  const [meetingData, setMeetingData] = useState<MeetingRow[]>([]);
  const [extraData, setExtraData] = useState<ExtraRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Override map: `section:field:category` → value
  const overrideMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of overrides) {
      const key = `${o.section}:${o.field}:${o.category || ""}`;
      map.set(key, o.value);
    }
    return map;
  }, [overrides]);

  /** Get the display value — override if present, otherwise the computed value */
  function getVal(
    section: string,
    field: string,
    computedValue: number | null | undefined,
    category?: string
  ): { value: number; isOverridden: boolean } {
    const key = `${section}:${field}:${category || ""}`;
    const ov = overrideMap.get(key);
    if (ov !== undefined) {
      return { value: Number(ov), isOverridden: true };
    }
    return { value: computedValue ?? 0, isOverridden: false };
  }

  // ─── Fetch Logic ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setHasFetched(true);

    const months = getMonthsForPeriod(reportType, month);
    const isMultiMonth = months.length > 1;

    try {
      // Build filters — always query as মাসিক and aggregate client-side
      const queryReportType = "মাসিক";

      // Parallel fetch all views + overrides
      const [
        headerRes,
        courseRes,
        orgRes,
        personalRes,
        meetingRes,
        extraRes,
        overrideRes,
      ] = await Promise.all([
        supabase
          .from("view_city_header_agg")
          .select("*")
          .eq("year", year)
          .in("month", months)
          .eq("report_type", queryReportType),
        supabase
          .from("view_city_course_agg")
          .select("*")
          .eq("year", year)
          .in("month", months)
          .eq("report_type", queryReportType),
        supabase
          .from("view_city_organizational_agg")
          .select("*")
          .eq("year", year)
          .in("month", months)
          .eq("report_type", queryReportType),
        supabase
          .from("view_city_personal_agg")
          .select("*")
          .eq("year", year)
          .in("month", months)
          .eq("report_type", queryReportType),
        supabase
          .from("view_city_meeting_agg")
          .select("*")
          .eq("year", year)
          .in("month", months)
          .eq("report_type", queryReportType),
        supabase
          .from("view_city_extra_agg")
          .select("*")
          .eq("year", year)
          .in("month", months)
          .eq("report_type", queryReportType),
        supabase
          .from("city_report_override")
          .select("*")
          .eq("year", year)
          .eq("report_type", reportType)
          .in("month", months),
      ]);

      // Header
      const rawHeader = (headerRes.data as HeaderRow[]) || [];
      setHeaderData(
        isMultiMonth ? sumHeaderRows(rawHeader) : rawHeader[0] || null
      );

      // Course
      const rawCourse = (courseRes.data as CourseRow[]) || [];
      setCourseData(
        isMultiMonth
          ? sumRows(rawCourse, [
              "number",
              "increase",
              "decrease",
              "sessions",
              "students",
              "attendance",
              "status_board",
              "status_qayda",
              "status_ampara",
              "status_quran",
              "completed",
              "correctly_learned",
            ])
          : rawCourse
      );

      // Organizational
      const rawOrg = (orgRes.data as OrgRow[]) || [];
      setOrgData(
        isMultiMonth
          ? sumRows(rawOrg, ["number", "increase", "amount"])
          : rawOrg
      );

      // Personal
      const rawPersonal = (personalRes.data as PersonalRow[]) || [];
      setPersonalData(
        isMultiMonth
          ? sumRows(rawPersonal, [
              "teaching",
              "learning",
              "olama_invited",
              "became_shohojogi",
              "became_sokrio_shohojogi",
              "became_kormi",
              "became_rukon",
            ])
          : rawPersonal
      );

      // Meeting
      const rawMeeting = (meetingRes.data as MeetingRow[]) || [];
      setMeetingData(
        isMultiMonth
          ? sumRows(rawMeeting, [
              "city_count",
              "city_avg_attendance",
              "thana_count",
              "thana_avg_attendance",
              "ward_count",
              "ward_avg_attendance",
            ])
          : rawMeeting
      );

      // Extra
      const rawExtra = (extraRes.data as ExtraRow[]) || [];
      setExtraData(
        isMultiMonth ? sumRows(rawExtra, ["number"]) : rawExtra
      );

      // Overrides
      setOverrides((overrideRes.data as OverrideRow[]) || []);
    } catch (err) {
      console.error("Failed to fetch city report data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, reportType, month, year]);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Download handlers ─────────────────────────────────────────────────────

  const handleDownloadPDF = () => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      report_type: reportType,
    });
    window.open(`/api/export/pdf?${params.toString()}`, "_blank");
  };

  const handleDownloadExcel = () => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      report_type: reportType,
    });
    window.open(`/api/export/excel?${params.toString()}`, "_blank");
  };

  // ─── Check if any data loaded ───────────────────────────────────────────────

  const hasAnyData =
    headerData ||
    courseData.length > 0 ||
    orgData.length > 0 ||
    personalData.length > 0 ||
    meetingData.length > 0 ||
    extraData.length > 0;

  // ─── Render Helpers ─────────────────────────────────────────────────────────

  /** Render a numeric cell with override highlight + CorrectionButton */
  function NumericCell({
    section,
    field,
    computedValue,
    category,
    className = "",
  }: {
    section: string;
    field: string;
    computedValue: number;
    category?: string;
    className?: string;
  }) {
    const { value, isOverridden } = getVal(
      section,
      field,
      computedValue,
      category
    );
    return (
      <span className={`group inline-flex items-center gap-1 ${className}`}>
        <span
          className={`${
            isOverridden
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md"
              : ""
          }`}
        >
          {toBn(value)}
        </span>
        {isEditing && (
          <CorrectionButton
            year={year}
            month={month}
            reportType={reportType}
            section={section}
            field={field}
            category={category}
            currentValue={value}
          />
        )}
      </span>
    );
  }

  // ─── Period Label ───────────────────────────────────────────────────────────

  const periodLabel = useMemo(() => {
    const monthsRange = getMonthsForPeriod(reportType, month);
    if (monthsRange.length === 1) {
      return `${MONTHS_BN[month - 1]} ${toBn(year)}`;
    }
    return `${MONTHS_BN[monthsRange[0] - 1]} - ${MONTHS_BN[monthsRange[monthsRange.length - 1] - 1]} ${toBn(year)}`;
  }, [reportType, month, year]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="py-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 bg-card border border-border/50 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">
              সিটি রিপোর্ট
            </h1>
            <p className="text-muted-foreground mt-1">
              মহানগরীর সকল জোনের সমষ্টিগত রিপোর্ট
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Action Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`modern-btn border flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold transition-all ${
                isEditing
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card"
              }`}
            >
              <Save className="w-4 h-4" />
              <span className="hidden lg:inline">
                {isEditing ? "ওভাররাইড বন্ধ করুন" : "ওভাররাইড করুন"}
              </span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold"
            >
              <FileText className="w-4 h-4 text-purple-600" />
            </button>
            <button
              onClick={handleDownloadExcel}
              className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold"
            >
              <Download className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Period Selector (inline) ────────────────────────────────────────── */}
      <div className="modern-card p-6 mb-8 bg-card shadow-lg border-primary/10">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Report Type */}
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground">
              ধরন
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Month — only meaningful for মাসিক */}
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground">
              মাস {reportType !== "মাসিক" && <span className="text-xs text-muted-foreground/60">(প্রযোজ্য নয়)</span>}
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              disabled={reportType !== "মাসিক"}
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors disabled:opacity-50"
            >
              {MONTHS_BN.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground">
              সাল
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="modern-input w-full bg-muted/50 focus:bg-background transition-colors"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {toBn(y)}
                </option>
              ))}
            </select>
          </div>

          {/* Go */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="modern-btn btn-primary h-[48px] px-8 flex items-center gap-2 group w-full md:w-auto justify-center disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>দেখুন</span>
                <ChevronRight className="w-4 h-4 group-active:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Period badge */}
        {hasFetched && !isLoading && (
          <div className="mt-4 text-xs font-bold text-muted-foreground">
            প্রদর্শিত সময়কাল:{" "}
            <span className="text-foreground">{periodLabel}</span>{" "}
            <span className="text-primary">({reportType})</span>
          </div>
        )}
      </div>

      {/* ── Loading State ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 w-48 bg-muted rounded-lg mb-6" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 bg-muted/60 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {!isLoading && hasFetched && !hasAnyData && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-sm">
          <SearchX className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            কোনো ডেটা পাওয়া যায়নি
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            নির্বাচিত সময়কাল ({periodLabel}) এর জন্য কোনো রিপোর্ট ডেটা
            পাওয়া যায়নি। দয়া করে অন্য সময়কাল নির্বাচন করুন।
          </p>
        </div>
      )}

      {/* ── Data Sections ───────────────────────────────────────────────────── */}
      {!isLoading && hasAnyData && (
        <div className="space-y-8">
          {/* ────── 1. Header Section ────── */}
          {headerData && (
            <section
              className={`bg-card border-l-4 border-l-emerald-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden relative transition-all ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
              <h2 className="text-xl font-bold text-emerald-600 mb-6 relative z-10 flex items-center justify-between">
                মূল তথ্য (সমষ্টিগত)
                {isEditing && (
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                    এডিটিং চালু আছে
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {HEADER_FIELDS.map(({ key, label, color }) => {
                  const computedVal = (headerData[key] as number) ?? 0;
                  const { value, isOverridden } = getVal(
                    "header",
                    key,
                    computedVal
                  );
                  return (
                    <div
                      key={key}
                      className={`p-4 bg-muted/40 rounded-xl border border-border/50 group ${
                        isOverridden
                          ? "ring-2 ring-amber-400/50 bg-amber-50/50 dark:bg-amber-900/20"
                          : ""
                      }`}
                    >
                      <span className="text-muted-foreground block mb-2 text-sm">
                        {label}:
                      </span>
                      <span
                        className={`font-bold text-2xl ${color || "text-foreground"}`}
                      >
                        {color === "text-green-600" && value > 0 && "+"}
                        {color === "text-red-500" && value > 0 && "-"}
                        {toBn(value)}
                      </span>
                      {isEditing && (
                        <CorrectionButton
                          year={year}
                          month={month}
                          reportType={reportType}
                          section="header"
                          field={key}
                          currentValue={value}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ────── 2. Courses Section ────── */}
          {courseData.length > 0 && (
            <section
              className={`bg-card border-l-4 border-l-purple-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-purple-600 mb-4">
                গ্রুপ / কোর্স রিপোর্ট (সমষ্টিগত)
              </h2>
              <div className="overflow-x-auto w-full pb-4">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-purple-500/5 text-purple-700 dark:text-purple-400">
                    <tr>
                      {COURSE_COLUMNS.map((col, i) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3 font-bold border-b border-purple-500/20 ${
                            i === 0
                              ? "rounded-tl-lg"
                              : i === COURSE_COLUMNS.length - 1
                                ? "rounded-tr-lg text-center"
                                : "text-center"
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courseData.map((row) => (
                      <tr
                        key={row.category}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {row.category}
                        </td>
                        {COURSE_COLUMNS.filter((c) => c.key !== "category").map(
                          (col) => (
                            <td key={col.key} className="px-4 py-3 text-center">
                              <NumericCell
                                section="course"
                                field={col.key}
                                computedValue={row[col.key] as number}
                                category={row.category}
                              />
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ────── 3. Organizational Section ────── */}
          {orgData.length > 0 && (
            <section
              className={`bg-card border-l-4 border-l-blue-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-blue-600 mb-4">
                সাংগঠনিক রিপোর্ট (সমষ্টিগত)
              </h2>
              <div className="overflow-x-auto w-full pb-4">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-blue-500/5 text-blue-700 dark:text-blue-400">
                    <tr>
                      {ORG_COLUMNS.map((col, i) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3 font-bold border-b border-blue-500/20 ${
                            i === 0
                              ? "rounded-tl-lg"
                              : i === ORG_COLUMNS.length - 1
                                ? "rounded-tr-lg text-center"
                                : "text-center"
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ORG_CATEGORIES.map((cat) => {
                      const row = orgData.find((r) => r.category === cat || (cat === "সহযোগী হয়েছেন" && r.category === "সহযোগী হয়েছে") || (cat === "সহযোগী হয়েছে" && r.category === "সহযোগী হয়েছেন") || (cat === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি" && r.category === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)")) || {
                        category: cat,
                        number: 0,
                        increase: 0,
                        amount: 0,
                        comments: "",
                      };
                      return (
                        <tr
                          key={cat}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {cat}
                          </td>
                          {ORG_COLUMNS.filter((c) => c.key !== "category").map(
                            (col) => (
                              <td key={col.key} className="px-4 py-3 text-center">
                                <NumericCell
                                  section="organizational"
                                  field={col.key}
                                  computedValue={(row as any)[col.key] as number}
                                  category={cat}
                                />
                              </td>
                            )
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ────── 4. Personal Section ────── */}
          {personalData.length > 0 && (
            <section
              className={`bg-card border-l-4 border-l-pink-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-pink-600 mb-4">
                ব্যক্তিগত রিপোর্ট (সমষ্টিগত)
              </h2>
              <div className="overflow-x-auto w-full pb-4">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-pink-500/5 text-pink-700 dark:text-pink-400">
                    <tr>
                      {PERSONAL_COLUMNS.map((col, i) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3 font-bold border-b border-pink-500/20 ${
                            i === 0
                              ? "rounded-tl-lg"
                              : i === PERSONAL_COLUMNS.length - 1
                                ? "rounded-tr-lg text-center"
                                : "text-center"
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {personalData.map((row) => (
                      <tr
                        key={row.category}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {row.category}
                        </td>
                        {PERSONAL_COLUMNS.filter(
                          (c) => c.key !== "category"
                        ).map((col) => (
                          <td key={col.key} className="px-4 py-3 text-center">
                            <NumericCell
                              section="personal"
                              field={col.key}
                              computedValue={row[col.key] as number}
                              category={row.category}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ────── 5. Meeting Section ────── */}
          {meetingData.length > 0 && (
            <section
              className={`bg-card border-l-4 border-l-cyan-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-cyan-600 mb-4">
                সভা / বৈঠক রিপোর্ট (সমষ্টিগত)
              </h2>
              <div className="overflow-x-auto w-full pb-4">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead>
                    {/* Group header row */}
                    <tr className="bg-cyan-500/5 text-cyan-700 dark:text-cyan-400">
                      <th
                        rowSpan={2}
                        className="px-4 py-3 font-bold border-b border-cyan-500/20 rounded-tl-lg"
                      >
                        বিভাগ
                      </th>
                      <th
                        colSpan={2}
                        className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center"
                      >
                        মহানগরী
                      </th>
                      <th
                        colSpan={2}
                        className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center"
                      >
                        থানা
                      </th>
                      <th
                        colSpan={2}
                        className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center rounded-tr-lg"
                      >
                        ওয়ার্ড
                      </th>
                    </tr>
                    {/* Sub-header row */}
                    <tr className="bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 text-xs">
                      <th className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center">
                        সংখ্যা
                      </th>
                      <th className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center">
                        গড় উপস্থিতি
                      </th>
                      <th className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center">
                        সংখ্যা
                      </th>
                      <th className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center">
                        গড় উপস্থিতি
                      </th>
                      <th className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center">
                        সংখ্যা
                      </th>
                      <th className="px-4 py-2 font-bold border-b border-cyan-500/20 text-center">
                        গড় উপস্থিতি
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {meetingData.map((row) => (
                      <tr
                        key={row.category}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-foreground break-words">
                          {(() => {
                            const customTitle = row.meeting_name?.trim() || (row.comments?.trim() && row.comments?.trim() !== "—" ? row.comments?.trim() : "");
                            return row.category === "অন্যান্য" && customTitle ? customTitle : row.category;
                          })()}
                        </td>
                        {(
                          [
                            "city_count",
                            "city_avg_attendance",
                            "thana_count",
                            "thana_avg_attendance",
                            "ward_count",
                            "ward_avg_attendance",
                          ] as const
                        ).map((field) => (
                          <td key={field} className="px-4 py-3 text-center">
                            <NumericCell
                              section="meeting"
                              field={field}
                              computedValue={row[field] as number}
                              category={row.category}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ────── 6. Extra Section ────── */}
          {extraData.length > 0 && (
            <section
              className={`bg-card border-l-4 border-l-orange-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-orange-600 mb-4">
                অতিরিক্ত তথ্য (সমষ্টিগত)
              </h2>
              <div className="overflow-x-auto w-full pb-4">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-orange-500/5 text-orange-700 dark:text-orange-400">
                    <tr>
                      {EXTRA_COLUMNS.map((col, i) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3 font-bold border-b border-orange-500/20 ${
                            i === 0
                              ? "rounded-tl-lg"
                              : i === EXTRA_COLUMNS.length - 1
                                ? "rounded-tr-lg text-center"
                                : "text-center"
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {extraData.map((row) => (
                      <tr
                        key={row.category}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {row.category}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <NumericCell
                            section="extra"
                            field="number"
                            computedValue={row.number}
                            category={row.category}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
