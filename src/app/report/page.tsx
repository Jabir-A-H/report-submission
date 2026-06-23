"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  FileText,
  Download,
  Filter,
  Table2,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Building,
  ClipboardList,
} from "lucide-react";

// ─── Constants & Categories ──────────────────────────────────────────────────

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

const COURSE_CATEGORIES = [
  "বিশিষ্টদের",
  "সাধারণদের",
  "কর্মীদের",
  "ইউনিট সভানেত্রী",
  "অগ্রসরদের",
  "রুকনদের অনুশীলনী ক্লাস",
  "শিশু- তা'লিমুল কুরআন",
  "নিরক্ষর- তা'লিমুস সলাত",
];

const ORG_CATEGORIES = [
  "দাওয়াত দান",
  "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
  "সহযোগী হয়েছে",
  "সম্মতি দিয়েছেন",
  "সক্রিয় সহযোগী",
  "কর্মী",
  "রুকন",
  "দাওয়াতী ইউনিট",
  "ইউনিট",
  "সূধী",
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
  "বই বিলি",
  "বই বিক্রি",
];

const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
  "Orientation / Result Publish",
];

const EXTRA_CATEGORIES = [
  "মক্তব সংখ্যা",
  "মক্তব বৃদ্ধি",
  "মহানগরী পরিচালিত",
  "স্থানীয়ভাবে পরিচালিত",
  "মহানগরীর সফর",
  "থানা কমিটির সফর",
  "থানা প্রতিনিধির সফর",
  "ওয়ার্ড প্রতিনিধির সফর",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "০";
  return String(n).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d)]);
}

function sumHeaderRows(rows: any[]): any | null {
  if (rows.length === 0) return null;
  const base = { ...rows[0] };
  const numericKeys = [
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
      base[k] = (base[k] || 0) + (rows[i][k] || 0);
    }
  }
  return base;
}

function sumRows(rows: any[], numericKeys: string[]): any[] {
  const grouped = new Map<string, any>();
  for (const row of rows) {
    const cat = row.category || "__header__";
    if (!grouped.has(cat)) {
      grouped.set(cat, { ...row });
    } else {
      const existing = grouped.get(cat)!;
      for (const k of numericKeys) {
        existing[k] = (existing[k] || 0) + (row[k] || 0);
      }
    }
  }
  return Array.from(grouped.values());
}

function getMonthsForPeriod(reportType: string, selectedMonth: number): number[] {
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

// ─── Main Viewer Component ────────────────────────────────────────────────────

function ReportViewer() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search parameters
  const reportIdParam = searchParams.get("report_id");
  const zoneIdParam = searchParams.get("zone_id");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const reportTypeParam = searchParams.get("report_type");

  // User details
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userZoneId, setUserZoneId] = useState<number | null>(null);

  // Lists for dropdowns
  const [zones, setZones] = useState<any[]>([]);

  // Filter state
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedReportType, setSelectedReportType] = useState<string>("মাসিক");

  // Loaded Report data
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportInfo, setReportInfo] = useState<any>(null);
  const [headerData, setHeaderData] = useState<any>(null);
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [orgData, setOrgData] = useState<any[]>([]);
  const [personalData, setPersonalData] = useState<any[]>([]);
  const [meetingData, setMeetingData] = useState<any[]>([]);
  const [extraData, setExtraData] = useState<any[]>([]);
  const [commentData, setCommentData] = useState<any>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial authentication and zones load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setCurrentUser(user);

        // Fetch profile
        const { data: profile } = await supabase
          .from("people")
          .select("role, zone_id")
          .eq("supabase_uid", user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
          setUserZoneId(profile.zone_id);
        }

        // If admin/superadmin, load all zones for selection
        if (profile?.role === "admin" || profile?.role === "superadmin") {
          const { data: zonesList } = await supabase
            .from("zone")
            .select("id, name")
            .order("name");
          if (zonesList) setZones(zonesList);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }
    loadInitialData();
  }, [supabase, router]);

  // 2. Map query parameters to filter states
  useEffect(() => {
    if (zoneIdParam) setSelectedZone(zoneIdParam);
    else if (userZoneId) setSelectedZone(String(userZoneId));

    if (monthParam) setSelectedMonth(Number(monthParam));
    if (yearParam) setSelectedYear(Number(yearParam));
    if (reportTypeParam) setSelectedReportType(reportTypeParam);
  }, [zoneIdParam, monthParam, yearParam, reportTypeParam, userZoneId]);

  // 3. Fetch Report Data based on parameters
  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsDataLoaded(false);

    try {
      let targetReportId = reportIdParam ? Number(reportIdParam) : null;
      let targetZoneId = selectedZone ? Number(selectedZone) : null;

      // For non-admin, force their own zone
      if (userRole && userRole !== "admin" && userRole !== "superadmin" && userZoneId) {
        targetZoneId = userZoneId;
      }

      let activeReport = null;
      let isMultiMonth = false;
      let targetYear = selectedYear;
      let targetReportType = selectedReportType;
      let targetMonth = selectedMonth;

      // A. If report_id is provided, load it directly
      if (targetReportId) {
        const { data: reportObj, error: reportErr } = await supabase
          .from("report")
          .select("*, zone(name)")
          .eq("id", targetReportId)
          .single();

        if (reportErr || !reportObj) {
          throw new Error("রিপোর্টটি পাওয়া যায়নি।");
        }
        activeReport = reportObj;
        targetZoneId = reportObj.zone_id;
        targetYear = reportObj.year;
        targetReportType = reportObj.report_type;
        targetMonth = reportObj.month;
      }

      if (targetReportType !== "মাসিক") {
        isMultiMonth = true;
      }

      // If we are looking for a single monthly report (and not already loaded via reportId)
      if (!targetReportId && !isMultiMonth && targetZoneId) {
        const { data: reportObj } = await supabase
          .from("report")
          .select("*, zone(name)")
          .eq("zone_id", targetZoneId)
          .eq("year", targetYear)
          .eq("report_type", "মাসিক")
          .eq("month", targetMonth)
          .maybeSingle();
        activeReport = reportObj;
      }

      // If it is multi-month, load and aggregate
      if (isMultiMonth && targetZoneId) {
        const monthsRange = getMonthsForPeriod(targetReportType, targetMonth);
        const { data: monthlyReports } = await supabase
          .from("report")
          .select("*, zone(name)")
          .eq("zone_id", targetZoneId)
          .eq("year", targetYear)
          .eq("report_type", "মাসিক")
          .in("month", monthsRange);

        if (monthlyReports && monthlyReports.length > 0) {
          activeReport = {
            id: -1,
            zone_id: targetZoneId,
            year: targetYear,
            month: targetMonth,
            report_type: targetReportType,
            zone: monthlyReports[0].zone
          };

          const reportIds = monthlyReports.map(r => r.id);

          const [
            headerRes,
            coursesRes,
            orgRes,
            personalRes,
            meetingRes,
            extraRes,
            commentRes,
          ] = await Promise.all([
            supabase.from("report_header").select("*").in("report_id", reportIds),
            supabase.from("report_course").select("*").in("report_id", reportIds),
            supabase.from("report_organizational").select("*").in("report_id", reportIds),
            supabase.from("report_personal").select("*").in("report_id", reportIds),
            supabase.from("report_meeting").select("*").in("report_id", reportIds),
            supabase.from("report_extra").select("*").in("report_id", reportIds),
            supabase.from("report_comment").select("*").in("report_id", reportIds),
          ]);

          const rawHeader = headerRes.data || [];
          const rawCourse = coursesRes.data || [];
          const rawOrg = orgRes.data || [];
          const rawPersonal = personalRes.data || [];
          const rawMeeting = meetingRes.data || [];
          const rawExtra = extraRes.data || [];
          const rawComment = commentRes.data || [];

          setHeaderData(sumHeaderRows(rawHeader));
          setCoursesData(sumRows(rawCourse, [
            "number", "increase", "decrease", "sessions", "students",
            "attendance", "status_board", "status_qayda", "status_ampara",
            "status_quran", "completed", "correctly_learned"
          ]));
          setOrgData(sumRows(rawOrg, ["number", "increase", "amount"]));
          setPersonalData(sumRows(rawPersonal, [
            "teaching", "learning", "olama_invited", "became_shohojogi",
            "became_sokrio_shohojogi", "became_kormi", "became_rukon"
          ]));
          setMeetingData(sumRows(rawMeeting, [
            "city_count", "city_avg_attendance", "thana_count",
            "thana_avg_attendance", "ward_count", "ward_avg_attendance"
          ]));
          setExtraData(sumRows(rawExtra, ["number"]));

          const combinedComments = rawComment
            .map(c => c.comment)
            .filter(c => c && c.trim() !== "")
            .join("\n");
          setCommentData({ comment: combinedComments });

          setReportId(-1);
          setReportInfo(activeReport);
          setIsDataLoaded(true);
        } else {
          activeReport = null;
        }
      }

      if (!isMultiMonth) {
        if (!activeReport) {
          // No report submitted yet for this period
          setReportId(null);
          setReportInfo(null);
          setHeaderData(null);
          setCoursesData([]);
          setOrgData([]);
          setPersonalData([]);
          setMeetingData([]);
          setExtraData([]);
          setCommentData(null);
          setIsDataLoaded(true);
          setIsLoading(false);
          return;
        }

        const repId = activeReport.id;
        setReportId(repId);
        setReportInfo(activeReport);

        const [
          headerRes,
          coursesRes,
          orgRes,
          personalRes,
          meetingRes,
          extraRes,
          commentRes,
        ] = await Promise.all([
          supabase.from("report_header").select("*").eq("report_id", repId).maybeSingle(),
          supabase.from("report_course").select("*").eq("report_id", repId),
          supabase.from("report_organizational").select("*").eq("report_id", repId),
          supabase.from("report_personal").select("*").eq("report_id", repId),
          supabase.from("report_meeting").select("*").eq("report_id", repId),
          supabase.from("report_extra").select("*").eq("report_id", repId),
          supabase.from("report_comment").select("*").eq("report_id", repId).maybeSingle(),
        ]);

        setHeaderData(headerRes.data);
        setCoursesData(coursesRes.data || []);
        setOrgData(orgRes.data || []);
        setPersonalData(personalRes.data || []);
        setMeetingData(meetingRes.data || []);
        setExtraData(extraRes.data || []);
        setCommentData(commentRes.data);
        setIsDataLoaded(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "রিপোর্ট লোড করতে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    reportIdParam,
    selectedZone,
    selectedMonth,
    selectedYear,
    selectedReportType,
    userRole,
    userZoneId,
  ]);

  // Load report on state/filter resolution
  useEffect(() => {
    if (currentUser && (selectedZone || reportIdParam)) {
      loadReport();
    }
  }, [currentUser, selectedZone, reportIdParam, loadReport]);

  // Handle Apply Filter Click
  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (selectedZone) params.set("zone_id", selectedZone);
    params.set("month", String(selectedMonth));
    params.set("year", String(selectedYear));
    params.set("report_type", selectedReportType);
    router.push(`/report?${params.toString()}`);
  };

  // Download Handlers
  const handleDownloadExcel = () => {
    const type = reportInfo?.report_type || selectedReportType;
    if (type !== "মাসিক") {
      const targetZoneId = reportInfo?.zone_id || selectedZone || userZoneId;
      const targetYear = reportInfo?.year || selectedYear;
      const targetMonth = reportInfo?.month || selectedMonth;
      window.open(`/api/export/excel?zone_id=${targetZoneId}&year=${targetYear}&month=${targetMonth}&report_type=${encodeURIComponent(type)}`, "_blank");
    } else {
      const targetReportId = reportIdParam ? Number(reportIdParam) : reportId;
      if (!targetReportId || targetReportId === -1) return;
      window.open(`/api/export/excel?report_id=${targetReportId}`, "_blank");
    }
  };

  const handleDownloadPDF = () => {
    const type = reportInfo?.report_type || selectedReportType;
    if (type !== "মাসিক") {
      const targetZoneId = reportInfo?.zone_id || selectedZone || userZoneId;
      const targetYear = reportInfo?.year || selectedYear;
      const targetMonth = reportInfo?.month || selectedMonth;
      window.open(`/api/export/pdf?zone_id=${targetZoneId}&year=${targetYear}&month=${targetMonth}&report_type=${encodeURIComponent(type)}`, "_blank");
    } else {
      const targetReportId = reportIdParam ? Number(reportIdParam) : reportId;
      if (!targetReportId || targetReportId === -1) return;
      window.open(`/api/export/pdf?report_id=${targetReportId}`, "_blank");
    }
  };

  // ─── Render Helper Constants ────────────────────────────────────────────────

  const displayPeriodLabel = useMemo(() => {
    if (!reportInfo) return "";
    if (reportInfo.report_type === "মাসিক") {
      return `${MONTHS_BN[reportInfo.month - 1]} ${toBn(reportInfo.year)}`;
    }
    return `${reportInfo.report_type} (${toBn(reportInfo.year)})`;
  }, [reportInfo]);

  // ─── Render View ───────────────────────────────────────────────────────────

  return (
    <div className="container py-8 max-w-7xl animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 bg-card border border-border/50 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <Table2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">
              রিপোর্ট (এক নজরে)
            </h1>
            <p className="text-muted-foreground mt-1">
              {reportInfo
                ? `${reportInfo.zone?.name || ""} - এর সম্পূর্ণ রিপোর্ট সারাংশ`
                : "জমাকৃত রিপোর্ট দেখার প্যানেল"}
            </p>
          </div>
        </div>

        {/* Download Buttons */}
        {isDataLoaded && reportId && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2.5 hover:bg-muted text-sm font-bold text-foreground transition-all active:scale-95"
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>PDF ডাউনলোড</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2.5 hover:bg-muted text-sm font-bold text-foreground transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-green-600" />
              <span>Excel ডাউনলোড</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Form ── */}
      {!reportIdParam && (
        <div className="modern-card p-6 mb-8 bg-card shadow-lg border-primary/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            {/* Zone Selector */}
            <div className="space-y-2 w-full md:col-span-1">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                জোন নির্বাচন
              </label>
              {(userRole === "admin" || userRole === "superadmin") ? (
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="modern-input w-full bg-muted/40 focus:bg-background text-sm"
                >
                  <option value="">জোন সিলেক্ট করুন</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="modern-input w-full bg-muted/40 flex items-center h-[46px] px-3 font-bold text-foreground text-sm border-dashed">
                  {reportInfo?.zone?.name || "আপনার নির্ধারিত জোন"}
                </div>
              )}
            </div>

            {/* Type Selector */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                রিপোর্টের ধরন
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="modern-input w-full bg-muted/40 focus:bg-background text-sm"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                মাস {selectedReportType !== "মাসিক" && <span className="text-[10px] text-muted-foreground/60">(প্রযোজ্য নয়)</span>}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={selectedReportType !== "মাসিক"}
                className="modern-input w-full bg-muted/40 focus:bg-background text-sm disabled:opacity-50"
              >
                {MONTHS_BN.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                সাল
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="modern-input w-full bg-muted/40 focus:bg-background text-sm"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {toBn(y)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Submit Button */}
            <button
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="modern-btn btn-primary h-[46px] w-full px-6 flex items-center gap-2 group justify-center font-bold text-sm"
            >
              <Filter className="w-4 h-4" />
              <span>ফিল্টার করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Loader State ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">রিপোর্ট ডেটা লোড হচ্ছে...</p>
        </div>
      )}

      {/* ── Error Banner ── */}
      {!isLoading && error && (
        <div className="p-5 mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Empty State (Not Submitted) ── */}
      {!isLoading && isDataLoaded && !reportId && (
        <div className="bg-card border border-border/80 rounded-3xl p-16 text-center shadow-sm max-w-2xl mx-auto my-8">
          <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            রিপোর্ট পাওয়া যায়নি
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            নির্বাচিত সময়কাল এবং জোনের জন্য কোনো রিপোর্ট এখনও সাবমিট করা হয়নি। দয়া করে অন্য সময়কাল ফিল্টার করুন অথবা অন্য জোনে চেষ্টা করুন।
          </p>
          {!reportIdParam && (
            <button
              onClick={loadReport}
              className="modern-btn border border-border bg-card px-5 py-2 text-sm font-bold"
            >
              পুনরায় চেষ্টা করুন
            </button>
          )}
        </div>
      )}

      {/* ── Report Content Area ── */}
      {!isLoading && isDataLoaded && reportId && (
        <div className="space-y-8">
          
          {/* ────── 1. Header Section ────── */}
          {headerData && (
            <section className="bg-card border-l-4 border-l-cyan-500 border-y border-r border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
              <h2 className="text-xl font-black text-cyan-600 mb-6 relative z-10 flex items-center gap-2">
                📋 মূল তথ্য
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm relative z-10">
                <div>
                  <span className="text-muted-foreground block mb-1">দায়িত্বশীলের নাম:</span>
                  <span className="font-bold text-foreground text-base">
                    {headerData.responsible_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">থানা:</span>
                  <span className="font-bold text-foreground text-base">
                    {headerData.thana || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">ওয়ার্ড:</span>
                  <span className="font-bold text-foreground text-base">
                    {headerData.ward || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">রিপোর্ট সময়কাল:</span>
                  <span className="font-bold text-primary text-base">
                    {displayPeriodLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/60 relative z-10">
                <div className="p-4 bg-muted/40 rounded-xl border border-border/30">
                  <span className="text-muted-foreground block mb-1 text-xs">মোট মুয়াল্লিমা:</span>
                  <span className="font-extrabold text-xl text-foreground">
                    {toBn(headerData.total_muallima)}
                  </span>
                </div>
                <div className="p-4 bg-muted/40 rounded-xl border border-border/30">
                  <span className="text-muted-foreground block mb-1 text-xs">বৃদ্ধি / ঘাটতি:</span>
                  <span className="font-extrabold text-xl text-foreground inline-flex gap-2">
                    <span className="text-green-600">+{toBn(headerData.muallima_increase)}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-500">-{toBn(headerData.muallima_decrease)}</span>
                  </span>
                </div>
                <div className="p-4 bg-muted/40 rounded-xl border border-border/30">
                  <span className="text-muted-foreground block mb-1 text-xs">মোট ইউনিট:</span>
                  <span className="font-extrabold text-xl text-foreground">
                    {toBn(headerData.total_unit)}
                  </span>
                </div>
                <div className="p-4 bg-muted/40 rounded-xl border border-border/30">
                  <span className="text-muted-foreground block mb-1 text-xs">মুয়াল্লিমা সহ ইউনিট:</span>
                  <span className="font-extrabold text-xl text-foreground">
                    {toBn(headerData.units_with_muallima)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 relative z-10">
                <div className="p-4 bg-muted/20 rounded-xl border border-border/20">
                  <span className="text-muted-foreground block mb-1 text-xs">সনদপ্রাপ্তা মুয়াল্লিমা:</span>
                  <span className="font-bold text-base text-foreground">
                    {toBn(headerData.certified_muallima)}
                  </span>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/20">
                  <span className="text-muted-foreground block mb-1 text-xs">সনদপ্রাপ্তা ক্লাস নিচ্ছেন:</span>
                  <span className="font-bold text-base text-foreground">
                    {toBn(headerData.certified_muallima_taking_classes)}
                  </span>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/20">
                  <span className="text-muted-foreground block mb-1 text-xs">প্রশিক্ষণপ্রাপ্তা মুয়াল্লিমা:</span>
                  <span className="font-bold text-base text-foreground">
                    {toBn(headerData.trained_muallima)}
                  </span>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/20">
                  <span className="text-muted-foreground block mb-1 text-xs">প্রশিক্ষণপ্রাপ্তা ক্লাস নিচ্ছেন:</span>
                  <span className="font-bold text-base text-foreground">
                    {toBn(headerData.trained_muallima_taking_classes)}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ────── 2. Courses Section ────── */}
          <section className="bg-card border-l-4 border-l-purple-500 border-y border-r border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-purple-600 mb-4 flex items-center gap-2">
              📚 গ্রুপ / কোর্স রিপোর্ট
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-purple-500/5 text-purple-800 font-bold border-b border-border">
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border text-left">বিভাগ/ধরন</th>
                    <th colSpan={3} className="px-4 py-2 font-black border-r border-b border-border">গ্রুপ / কোর্স</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">অধিবেশন</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">শিক্ষার্থী</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">উপস্থিতি</th>
                    <th colSpan={4} className="px-4 py-2 font-black border-r border-b border-border">শিক্ষার্থী অবস্থান</th>
                    <th rowSpan={2} className="px-4 py-3 font-black border-r border-border">সমাপ্ত</th>
                    <th rowSpan={2} className="px-4 py-3 font-black">সহীহ শিখেছে</th>
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
                    const row = coursesData.find((r) => r.category === cat) || {
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
                        <td className="px-2 py-3 border-r border-border">{toBn(row.number)}</td>
                        <td className="px-2 py-3 border-r border-border text-green-600 font-medium">+{toBn(row.increase)}</td>
                        <td className="px-2 py-3 border-r border-border text-red-500 font-medium">-{toBn(row.decrease)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.sessions)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.students)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.attendance)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.status_board)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.status_qayda)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.status_ampara)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.status_quran)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.completed)}</td>
                        <td className="px-2 py-3">{toBn(row.correctly_learned)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ────── 3. Organizational Section ────── */}
          <section className="bg-card border-l-4 border-l-blue-500 border-y border-r border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-blue-600 mb-4 flex items-center gap-2">
              🏢 দাওয়াত ও সংগঠন
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-blue-500/5 text-blue-800 font-bold border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-border">বিষয়</th>
                    <th className="px-4 py-3 border-r border-border">সংখ্যা</th>
                    <th className="px-4 py-3 border-r border-border">বৃদ্ধি</th>
                    <th className="px-4 py-3 border-r border-border">পরিমাণ / টাকা</th>
                    <th className="px-4 py-3 text-left">মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ORG_CATEGORIES.map((cat) => {
                    const row = orgData.find((r) => r.category === cat) || {
                      number: 0,
                      increase: 0,
                      amount: 0,
                      comments: "",
                    };
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 border-r border-border text-left font-bold text-foreground">{cat}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.number)}</td>
                        <td className="px-4 py-3 border-r border-border text-green-600">+{toBn(row.increase)}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.amount)}</td>
                        <td className="px-4 py-3 text-left text-muted-foreground text-xs truncate max-w-[200px]" title={row.comments || ""}>
                          {row.comments || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ────── 4. Personal Section ────── */}
          <section className="bg-card border-l-4 border-l-pink-500 border-y border-r border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-pink-600 mb-4 flex items-center gap-2">
              👤 ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-pink-500/5 text-pink-800 font-bold border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-border">বিভাগ</th>
                    <th className="px-4 py-3 border-r border-border">কতজন শিখাচ্ছেন</th>
                    <th className="px-4 py-3 border-r border-border">কতজনকে শিখাচ্ছেন</th>
                    <th className="px-4 py-3 border-r border-border">ওলামা আমন্ত্রণ</th>
                    <th className="px-4 py-3 border-r border-border">সহযোগী হয়েছেন</th>
                    <th className="px-4 py-3 border-r border-border">সক্রিয় সহযোগী</th>
                    <th className="px-4 py-3 border-r border-border">কর্মী হয়েছেন</th>
                    <th className="px-4 py-3">রুকন হয়েছেন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PERSONAL_CATEGORIES.map((cat) => {
                    const row = personalData.find((r) => r.category === cat) || {
                      teaching: 0,
                      learning: 0,
                      olama_invited: 0,
                      became_shohojogi: 0,
                      became_sokrio_shohojogi: 0,
                      became_kormi: 0,
                      became_rukon: 0,
                    };
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 border-r border-border text-left font-bold text-foreground">{cat}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.teaching)}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.learning)}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.olama_invited)}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.became_shohojogi)}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.became_sokrio_shohojogi)}</td>
                        <td className="px-4 py-3 border-r border-border">{toBn(row.became_kormi)}</td>
                        <td className="px-4 py-3">{toBn(row.became_rukon)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ────── 5. Meetings Section ────── */}
          <section className="bg-card border-l-4 border-l-cyan-600 border-y border-r border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-cyan-700 mb-4 flex items-center gap-2">
              🤝 বৈঠকসমূহ
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-cyan-500/5 text-cyan-800 font-bold border-b border-border">
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 text-left border-r border-border">বৈঠকসমূহ</th>
                    <th colSpan={2} className="px-4 py-2 border-r border-b border-border">মহানগরী</th>
                    <th colSpan={2} className="px-4 py-2 border-r border-b border-border">থানা</th>
                    <th colSpan={2} className="px-4 py-2 border-r border-b border-border">ওয়ার্ড</th>
                    <th rowSpan={2} className="px-4 py-3 text-left">মন্তব্য</th>
                  </tr>
                  <tr className="bg-cyan-500/10 text-cyan-900 border-b border-border text-[11px]">
                    <th className="px-2 py-2 border-r border-border font-bold">সংখ্যা</th>
                    <th className="px-2 py-2 border-r border-border font-bold">গড় উপস্থিতি</th>
                    <th className="px-2 py-2 border-r border-border font-bold">সংখ্যা</th>
                    <th className="px-2 py-2 border-r border-border font-bold">গড় উপস্থিতি</th>
                    <th className="px-2 py-2 border-r border-border font-bold">সংখ্যা</th>
                    <th className="px-2 py-2 border-r border-border font-bold">গড় উপস্থিতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MEETING_CATEGORIES.map((cat) => {
                    const row = meetingData.find((r) => r.category === cat) || {
                      city_count: 0,
                      city_avg_attendance: 0,
                      thana_count: 0,
                      thana_avg_attendance: 0,
                      ward_count: 0,
                      ward_avg_attendance: 0,
                      comments: "",
                    };
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 border-r border-border text-left font-bold text-foreground">{cat}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.city_count)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.city_avg_attendance)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.thana_count)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.thana_avg_attendance)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.ward_count)}</td>
                        <td className="px-2 py-3 border-r border-border">{toBn(row.ward_avg_attendance)}</td>
                        <td className="px-4 py-3 text-left text-muted-foreground text-xs truncate max-w-[150px]" title={row.comments || ""}>
                          {row.comments || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ────── 6. Extras Section ────── */}
          <section className="bg-card border-l-4 border-l-orange-500 border-y border-r border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-orange-600 mb-4 flex items-center gap-2">
              📊 মক্তব ও সফর রিপোর্ট
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-orange-500/5 text-orange-800 font-bold border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-border">বিষয়</th>
                    <th className="px-4 py-3">সংখ্যা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {EXTRA_CATEGORIES.map((cat) => {
                    const row = extraData.find((r) => r.category === cat) || {
                      number: 0,
                    };
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 border-r border-border text-left font-bold text-foreground">{cat}</td>
                        <td className="px-4 py-3 font-semibold">{toBn(row.number)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ────── 7. Comments Section ────── */}
          {commentData && commentData.comment && (
            <section className="bg-card border-l-4 border-l-amber-500 border-y border-r border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-black text-amber-600 mb-4 flex items-center gap-2">
                💬 মন্তব্য
              </h2>
              <div className="bg-muted/30 border border-border/80 rounded-xl p-5 min-h-[80px] text-foreground text-sm whitespace-pre-wrap leading-relaxed">
                {commentData.comment}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Entry Point with Suspense Boundary ──────────────────────────────────────

export default function ReportAtAGlancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">রিপোর্ট লোড হচ্ছে...</p>
        </div>
      }
    >
      <ReportViewer />
    </Suspense>
  );
}
