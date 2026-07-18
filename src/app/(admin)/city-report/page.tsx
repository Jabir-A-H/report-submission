"use client";

import { useCallback, useEffect, useMemo, useState, createContext, useContext } from "react";
import { createClient } from "@/utils/supabase/client";
import { CorrectionButton } from "@/components/admin/correction-button";
import {
  Building2,
  Download,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Save,
  SearchX,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import {
  BENGALI_DIGITS,
  MONTHS_BN,
  REPORT_TYPES,
  COURSE_CATEGORIES,
  ORG_CATEGORIES,
  PERSONAL_CATEGORIES,
  PERSONAL_METRICS_ROWS,
  MEETING_CATEGORIES,
  toBn,
  getMonthsForPeriod,
  sumRows,
  sumHeaderRows,
} from "@/lib/report-utils";

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

// ─── Context & Top-Level Cell Component ────────────────────────────────────────

const CityReportContext = createContext<{
  year: number;
  month: number;
  reportType: string;
  isEditing: boolean;
  getVal: (
    section: string,
    field: string,
    computedValue: any,
    category?: string,
    isText?: boolean
  ) => { value: any; isOverridden: boolean };
} | null>(null);

function NumericCell({
  section,
  field,
  computedValue,
  category,
  className = "",
  isText,
}: {
  section: string;
  field: string;
  computedValue: any;
  category?: string;
  className?: string;
  isText?: boolean;
}) {
  const ctx = useContext(CityReportContext);
  if (!ctx) return null;
  const { year, month, reportType, isEditing, getVal } = ctx;
  const { value, isOverridden } = getVal(
    section,
    field,
    computedValue ?? (isText ? "" : 0),
    category,
    isText
  );
  if (isOverridden) {
    const badge = (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black border border-amber-500/30 shadow-2xs hover:bg-amber-500/25 transition-all ${isText ? "text-sm text-left whitespace-pre-wrap font-normal" : ""}`}
        title={`মূল মান: ${isText ? (computedValue || "নেই") : toBn(computedValue)}`}
      >
        {isText ? (value || "কোনো মন্তব্য নেই") : toBn(value)}
      </span>
    );

    return (
      <span className={`group inline-flex items-center gap-1 ${className}`}>
        {isEditing ? (
          <CorrectionButton
            year={year}
            month={month}
            reportType={reportType}
            section={section}
            field={field}
            category={category}
            currentValue={value}
            computedValue={computedValue}
            isOverridden={isOverridden}
            isText={isText}
            customTrigger={
              <span className="inline-flex items-center gap-1">
                {badge}
                <span
                  className="opacity-60 group-hover/cb:opacity-100 min-h-[26px] min-w-[26px] inline-flex items-center justify-center hover:bg-primary/10 rounded-lg text-primary transition-all active:scale-95"
                  title="সংশোধন করুন (Override)"
                >
                  <Edit2 size={13} />
                </span>
              </span>
            }
          />
        ) : (
          badge
        )}
      </span>
    );
  }

  return (
    <span className={`group inline-flex items-center gap-1 ${className}`}>
      <span>{isText ? (value || <span className="text-muted-foreground italic text-xs">কোনো মন্তব্য নেই</span>) : toBn(value)}</span>
      {isEditing && (
        <CorrectionButton
          year={year}
          month={month}
          reportType={reportType}
          section={section}
          field={field}
          category={category}
          currentValue={value}
          computedValue={computedValue}
          isOverridden={isOverridden}
          isText={isText}
        />
      )}
    </span>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CityReportPage() {
  const supabase = useMemo(() => createClient(), []);

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
  const [isEditing, setIsEditing] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    computedValue: any,
    category?: string,
    isText?: boolean
  ): { value: any; isOverridden: boolean } {
    const key = `${section}:${field}:${category || ""}`;
    const ov = overrideMap.get(key);
    if (ov !== undefined) {
      return { value: isText ? ov : Number(ov), isOverridden: true };
    }
    return { value: computedValue ?? (isText ? "" : 0), isOverridden: false };
  }

  // ─── Fetch Logic ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (ignoreFlag: { current: boolean }) => {
    setIsLoading(true);
    setHasFetched(true);
    setError(null);

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

      if (ignoreFlag.current) return;

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
      if (ignoreFlag.current) return;
      console.error("Failed to fetch city report data:", err);
      setError("ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।");
    } finally {
      if (!ignoreFlag.current) {
        setIsLoading(false);
      }
    }
  }, [supabase, reportType, month, year]);

  // Fetch on mount
  useEffect(() => {
    const ignore = { current: false };
    fetchData(ignore);
    return () => {
      ignore.current = true;
    };
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

  // ─── Render Helpers (NumericCell moved top-level) ─────────────────────────

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
    <CityReportContext.Provider value={{ year, month, reportType, isEditing, getVal }}>
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
              মহানগরীর সমষ্টিগত রিপোর্ট পর্যালোচনা ও প্রয়োজনবোধে ওভাররাইড সংশোধন
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Action Buttons & View Mode Switcher */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  !isEditing ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ভিউ মোড</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  isEditing ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>এডিট মোড</span>
              </button>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold"
              title="পিডিএফ ডাউনলোড"
            >
              <FileText className="w-4 h-4 text-purple-600" />
            </button>
            <button
              onClick={handleDownloadExcel}
              className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold"
              title="এক্সেল ডাউনলোড"
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
            onClick={() => fetchData({ current: false })}
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

      {/* ── Error State ─────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-600 mb-1">দুঃখিত!</h3>
          <p className="text-red-600/80 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {!isLoading && hasFetched && !error && !hasAnyData && (
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
          {/* ────── 0. Header Summary Block ────── */}
          {headerData && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 max-[320px]:grid-cols-1 gap-3 md:gap-6 text-sm bg-muted/30 p-5 rounded-2xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-semibold">দায়িত্বশীল:</span>
                  <span className="font-extrabold text-foreground text-base">
                    মহানগরী সভাপতি / সেক্রেটারি
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-semibold">বিভাগ:</span>
                  <span className="font-extrabold text-foreground text-base">
                    তা'লীমুল কুরআন বিভাগ, মহানগরী
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-semibold">রিপোর্ট সময়কাল:</span>
                  <span className="font-extrabold text-foreground text-base">
                    {periodLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 max-[320px]:grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Col 1: Total Muallima + Increase/Decrease */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">মোট মুয়াল্লিমা:</span>
                    <span className="font-black text-xl text-foreground">
                      <NumericCell section="header" field="total_muallima" computedValue={headerData.total_muallima ?? 0} />
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">বৃদ্ধি / ঘাটতি:</span>
                    <span className="font-black text-lg text-foreground inline-flex gap-1.5 items-center">
                      <span className="text-green-600">+<NumericCell section="header" field="muallima_increase" computedValue={headerData.muallima_increase ?? 0} /></span>
                      <span className="text-muted-foreground/60">/</span>
                      <span className="text-red-500">-<NumericCell section="header" field="muallima_decrease" computedValue={headerData.muallima_decrease ?? 0} /></span>
                    </span>
                  </div>
                </div>

                {/* Col 2: Certified Muallima + Certified Taking Classes */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা:</span>
                    <span className="font-black text-xl text-foreground">
                      <NumericCell section="header" field="certified_muallima" computedValue={headerData.certified_muallima ?? 0} />
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">সার্টিফিকেটপ্রাপ্ত ক্লাস নিচ্ছেন:</span>
                    <span className="font-bold text-lg text-foreground">
                      <NumericCell section="header" field="certified_muallima_taking_classes" computedValue={headerData.certified_muallima_taking_classes ?? 0} />
                    </span>
                  </div>
                </div>

                {/* Col 3: Trained Muallima + Trained Taking Classes */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা:</span>
                    <span className="font-black text-xl text-foreground">
                      <NumericCell section="header" field="trained_muallima" computedValue={headerData.trained_muallima ?? 0} />
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">প্রশিক্ষণপ্রাপ্ত ক্লাস নিচ্ছেন:</span>
                    <span className="font-bold text-lg text-foreground">
                      <NumericCell section="header" field="trained_muallima_taking_classes" computedValue={headerData.trained_muallima_taking_classes ?? 0} />
                    </span>
                  </div>
                </div>

                {/* Col 4: Total Unit + Unit With Muallima */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">ইউনিট সংখ্যা:</span>
                    <span className="font-black text-xl text-foreground">
                      <NumericCell section="header" field="total_unit" computedValue={headerData.total_unit ?? 0} />
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">মুয়াল্লিমা সহ ইউনিট:</span>
                    <span className="font-bold text-lg text-foreground">
                      <NumericCell section="header" field="units_with_muallima" computedValue={headerData.units_with_muallima ?? 0} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────── ১. গ্রুপ / কোর্স রিপোর্ট ────── */}
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-purple-500/5 text-purple-800 font-bold border-b border-border">
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border text-left">বিভাগ/ধরন</th>
                    <th colSpan={3} className="px-4 py-2 font-black border-r border-b border-border">গ্রুপ / কোর্স</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">অধিবেশন</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">শিক্ষার্থী</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">উপস্থিতি</th>
                    <th colSpan={4} className="px-4 py-2 font-black border-r border-b border-border">শিক্ষার্থী অবস্থান</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">কতজন নিয়ে সমাপ্ত</th>
                    <th rowSpan={2} className="px-4 py-3 font-black">সহীহ শিখেছেন কতজন</th>
                  </tr>
                  <tr className="bg-purple-500/10 text-purple-900 border-b border-border text-[11px]">
                    <th className="px-2 py-2 border-r border-border font-bold">সংখ্যা</th>
                    <th className="px-2 py-2 border-r border-border font-bold">বৃদ্ধি</th>
                    <th className="px-2 py-2 border-r border-border font-bold">ঘাটতি</th>
                    <th className="px-2 py-2 border-r border-border font-bold">বোর্ড</th>
                    <th className="px-2 py-2 border-r border-border font-bold">কায়দা</th>
                    <th className="px-2 py-2 border-r border-border font-bold">আমপারা</th>
                    <th className="px-2 py-2 border-r border-border font-bold">কুরআন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COURSE_CATEGORIES.map((cat) => {
                    const row = courseData.find((r) => r.category === cat) || {
                      number: 0,
                      increase: 0,
                      decrease: 0,
                      sessions: 0,
                      students: 0,
                      attendance: 0,
                      status_board: 0,
                      status_qayda: 0,
                      status_ampara: 0,
                      status_quran: 0,
                      completed: 0,
                      correctly_learned: 0,
                    };
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 border-r border-border text-left font-bold text-foreground">{cat}</td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="number" computedValue={row.number ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border text-green-600 font-medium">
                          +<NumericCell section="course" field="increase" computedValue={row.increase ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border text-red-500 font-medium">
                          -<NumericCell section="course" field="decrease" computedValue={row.decrease ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="sessions" computedValue={row.sessions ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="students" computedValue={row.students ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="attendance" computedValue={row.attendance ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="status_board" computedValue={row.status_board ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="status_qayda" computedValue={row.status_qayda ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="status_ampara" computedValue={row.status_ampara ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="status_quran" computedValue={row.status_quran ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3 border-r border-border">
                          <NumericCell section="course" field="completed" computedValue={row.completed ?? 0} category={cat} />
                        </td>
                        <td className="px-2 py-3">
                          <NumericCell section="course" field="correctly_learned" computedValue={row.correctly_learned ?? 0} category={cat} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inline Maktab Stats */}
            <div className="p-4 rounded-xl border border-border text-xs sm:text-sm">
              <span className="font-black text-muted-foreground block text-xs tracking-wider uppercase mb-2">মক্তব রিপোর্ট:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মক্তব সংখ্যা:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "মক্তব সংখ্যা")?.number ?? 0} category="মক্তব সংখ্যা" /> টি
                  </span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মক্তব বৃদ্ধি:</span>
                  <span className="font-black text-green-600 text-sm sm:text-base inline-flex items-center">
                    +<NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "মক্তব বৃদ্ধি")?.number ?? 0} category="মক্তব বৃদ্ধি" /> টি
                  </span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মহানগরী পরিচালিত:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "মহানগরী পরিচালিত")?.number ?? 0} category="মহানগরী পরিচালিত" /> টি
                  </span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">স্থানীয়ভাবে পরিচালিত:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "স্থানীয়ভাবে পরিচালিত")?.number ?? 0} category="স্থানীয়ভাবে পরিচালিত" /> টি
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ────── ২. দাওয়াত ও সংগঠন ────── */}
          <div className="space-y-4 pt-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-sm text-center border-collapse table-fixed min-w-[500px]">
                <thead className="bg-blue-500/5 text-blue-800 font-bold border-b border-border">
                  <tr>
                    <th className="w-[34%] px-3 py-3 text-left border-r border-border font-black">দাওয়াত ও সংগঠন</th>
                    <th className="w-[17%] px-2 py-3 border-r border-border">সংখ্যা</th>
                    <th className="w-[17%] px-2 py-3 border-r border-border">বৃদ্ধি</th>
                    <th className="w-[16%] px-2 py-3 border-r border-border">পরিমাণ / টাকা</th>
                    <th className="w-[16%] px-2 py-3 text-left">মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ORG_CATEGORIES.map((cat) => {
                    const row = orgData.find((r) => r.category === cat || (cat === "সহযোগী হয়েছেন" && r.category === "সহযোগী হয়েছে") || (cat === "সহযোগী হয়েছে" && r.category === "সহযোগী হয়েছেন") || (cat === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি" && r.category === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)")) || {
                      number: 0,
                      increase: 0,
                      amount: 0,
                      comments: "",
                    };
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="w-[34%] px-3 py-3 border-r border-border text-left font-bold text-foreground break-words">{cat}</td>
                        <td className="w-[17%] px-2 py-3 border-r border-border">
                          <NumericCell section="organizational" field="number" computedValue={(row as any).number ?? 0} category={cat} />
                        </td>
                        <td className="w-[17%] px-2 py-3 border-r border-border text-green-600">
                          +<NumericCell section="organizational" field="increase" computedValue={(row as any).increase ?? 0} category={cat} />
                        </td>
                        <td className="w-[16%] px-2 py-3 border-r border-border">
                          <NumericCell section="organizational" field="amount" computedValue={(row as any).amount ?? 0} category={cat} />
                        </td>
                        <td className="w-[16%] px-2 py-3 text-left text-muted-foreground text-xs truncate" title={(row as any).comments || ""}>
                          {(row as any).comments || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ────── ৩. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন ────── */}
          <div className="space-y-4 pt-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-sm text-center border-collapse table-fixed min-w-[500px]">
                <thead className="bg-pink-500/5 text-pink-800 font-bold border-b border-border">
                  <tr>
                    <th className="w-[36%] px-3 py-3 text-left border-r border-border font-black break-words">ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</th>
                    {PERSONAL_CATEGORIES.map((cat) => (
                      <th key={cat} className="w-[16%] px-2 py-3 border-r border-border font-bold break-words">
                        {cat === "সক্রিয় সহযোগী" ? "সক্রিয় সহযোগী হয়েছেন" : cat}
                      </th>
                    ))}
                    <th className="w-[16%] px-2 py-3 font-bold">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PERSONAL_METRICS_ROWS.map((metric) => (
                    <tr key={metric.key} className="hover:bg-muted/40 transition-colors">
                      <td className="w-[36%] px-3 py-3 border-r border-border text-left font-bold text-foreground break-words">
                        {metric.label}
                      </td>
                      {PERSONAL_CATEGORIES.map((cat) => {
                        const val = ((personalData.find((r) => r.category === cat) || {}) as any)[metric.key] || 0;
                        return (
                          <td key={cat} className="w-[16%] px-2 py-3 border-r border-border">
                            <NumericCell section="personal" field={metric.key} computedValue={val} category={cat} />
                          </td>
                        );
                      })}
                      <td className="w-[16%] px-2 py-3 font-black text-foreground">
                        {toBn(
                          PERSONAL_CATEGORIES.reduce(
                            (sum, cat) => sum + (((personalData.find((r) => r.category === cat) || {}) as any)[metric.key] || 0),
                            0
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ────── ৪. বৈঠকসমূহ ────── */}
          <div className="space-y-4 pt-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-sm text-center border-collapse table-fixed min-w-[520px]">
                <thead className="bg-cyan-500/5 text-cyan-800 font-bold border-b border-border">
                  <tr>
                    <th rowSpan={2} className="w-[28%] px-3 py-3 text-left border-r border-b border-border font-black break-words">বৈঠকসমূহ</th>
                    <th colSpan={2} className="w-[20%] px-2 py-2 text-center border-r border-b border-border font-black">মহানগরী</th>
                    <th colSpan={2} className="w-[20%] px-2 py-2 text-center border-r border-b border-border font-black">থানা</th>
                    <th colSpan={2} className="w-[20%] px-2 py-2 text-center border-r border-b border-border font-black">ওয়ার্ড</th>
                    <th rowSpan={2} className="w-[12%] px-2 py-3 text-left border-b border-border font-black">মন্তব্য</th>
                  </tr>
                  <tr className="bg-cyan-500/10 text-cyan-900 border-b border-border text-[11px]">
                    <th className="w-[10%] px-1 py-2 border-r border-border font-bold">কতটি</th>
                    <th className="w-[10%] px-1 py-2 border-r border-border font-bold">গড় উপস্থিতি</th>
                    <th className="w-[10%] px-1 py-2 border-r border-border font-bold">কতটি</th>
                    <th className="w-[10%] px-1 py-2 border-r border-border font-bold">গড় উপস্থিতি</th>
                    <th className="w-[10%] px-1 py-2 border-r border-border font-bold">কতটি</th>
                    <th className="w-[10%] px-1 py-2 border-r border-border font-bold">গড় উপস্থিতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MEETING_CATEGORIES.map((cat) => {
                    const row = meetingData.find((r) => r.category === cat || (cat === "Committee Orientation" && (r.category === "Committee Orientation / Muallima Orientation" || r.category === "Orientation / Result Publish")) || (cat === "Muallima Orientation" && (r.category === "Committee Orientation / Muallima Orientation" || r.category === "Orientation / Result Publish"))) || {
                      city_count: 0,
                      city_avg_attendance: 0,
                      thana_count: 0,
                      thana_avg_attendance: 0,
                      ward_count: 0,
                      ward_avg_attendance: 0,
                      comments: "",
                    };
                    const customTitle = (row as any).meeting_name?.trim() || ((row as any).comments?.trim() && (row as any).comments?.trim() !== "—" ? (row as any).comments?.trim() : "");
                    const displayLabel = cat === "অন্যান্য" && customTitle ? customTitle : cat;
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="w-[28%] px-3 py-3 border-r border-border text-left font-bold text-foreground break-words">{displayLabel}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">
                          <NumericCell section="meeting" field="city_count" computedValue={(row as any).city_count ?? 0} category={cat} />
                        </td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">
                          <NumericCell section="meeting" field="city_avg_attendance" computedValue={(row as any).city_avg_attendance ?? 0} category={cat} />
                        </td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">
                          <NumericCell section="meeting" field="thana_count" computedValue={(row as any).thana_count ?? 0} category={cat} />
                        </td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">
                          <NumericCell section="meeting" field="thana_avg_attendance" computedValue={(row as any).thana_avg_attendance ?? 0} category={cat} />
                        </td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">
                          <NumericCell section="meeting" field="ward_count" computedValue={(row as any).ward_count ?? 0} category={cat} />
                        </td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">
                          <NumericCell section="meeting" field="ward_avg_attendance" computedValue={(row as any).ward_avg_attendance ?? 0} category={cat} />
                        </td>
                        <td className="w-[12%] px-2 py-3 text-left text-muted-foreground text-xs truncate" title={(row as any).comments || ""}>
                          {(row as any).comments || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inline Safar Stats */}
            <div className="p-4 rounded-xl border border-border text-xs sm:text-sm">
              <span className="font-black text-muted-foreground block text-xs tracking-wider uppercase mb-2">সফর রিপোর্ট:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মহানগরীর সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "মহানগরীর সফর")?.number ?? 0} category="মহানগরীর সফর" /> টি
                  </span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">থানা কমিটির সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "থানা কমিটির সফর")?.number ?? 0} category="থানা কমিটির সফর" /> টি
                  </span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">থানা প্রতিনিধির সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "থানা প্রতিনিধির সফর")?.number ?? 0} category="থানা প্রতিনিধির সফর" /> টি
                  </span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">ওয়ার্ড প্রতিনিধির সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">
                    <NumericCell section="extra" field="number" computedValue={extraData.find(e => e.category === "ওয়ার্ড প্রতিনিধির সফর")?.number ?? 0} category="ওয়ার্ড প্রতিনিধির সফর" /> টি
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Comments Section ────────────────────────────────────────────── */}
          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-5 bg-muted/30 border-b border-border/60 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                ৫. মন্তব্য ও বিশেষ পর্যালোচনা (Comments)
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
                <span className="font-black text-xs tracking-wider uppercase text-muted-foreground block mb-2">
                  মহানগরীর সামষ্টিক মন্তব্য / বিশেষ পর্যবেক্ষণ (ওভাররাইড বা ইনপুট করুন):
                </span>
                <div className="text-base font-medium text-foreground min-h-[60px] p-3 bg-card border border-border/80 rounded-xl">
                  <NumericCell
                    section="comment"
                    field="city_comment"
                    computedValue=""
                    category="মহানগরী মন্তব্য"
                    isText={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </CityReportContext.Provider>
  );
}
