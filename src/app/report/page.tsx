"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ChevronDown,
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

const DB_TYPE_MAP: Record<string, string> = {
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

const URL_TO_ENGLISH_MAP: Record<string, string> = {
  "মাসিক": "monthly",
  "ত্রৈমাসিক": "quarterly",
  "ষান্মাসিক": "halfYearly",
  "নয়-মাসিক": "nineMonth",
  "বার্ষিক": "yearly",
  monthly: "monthly",
  quarterly: "quarterly",
  halfYearly: "halfYearly",
  nineMonth: "nineMonth",
  yearly: "yearly",
};

const REPORT_TYPES = [
  { value: "monthly", label: "মাসিক" },
  { value: "quarterly", label: "ত্রৈমাসিক" },
  { value: "halfYearly", label: "ষান্মাসিক" },
  { value: "nineMonth", label: "নয়-মাসিক" },
  { value: "yearly", label: "বার্ষিক" },
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
  "সহযোগী হয়েছেন",
  "সম্মতি দিয়েছেন",
  "সক্রিয় সহযোগী",
  "কর্মী",
  "রুকন",
  "দাওয়াতী ইউনিট",
  "ইউনিট",
  "সূধী",
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন",
  "বই বিলি",
  "বই বিক্রি",
];

const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

const PERSONAL_METRICS_ROWS = [
  { key: "teaching", label: "কতজন শিখাচ্ছেন" },
  { key: "learning", label: "কতজনকে শিখাচ্ছেন" },
  { key: "olama_invited", label: "দাওয়াতপ্রাপ্ত ওলামা" },
  { key: "became_shohojogi", label: "সহযোগী হয়েছেন" },
  { key: "became_sokrio_shohojogi", label: "সক্রিয় সহযোগী হয়েছেন" },
  { key: "became_kormi", label: "কর্মী হয়েছেন" },
  { key: "became_rukon", label: "রুকন হয়েছেন" },
];

const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে",
  "মুয়াল্লিমাদের নিয়ে বৈঠক",
  "Committee Orientation",
  "Muallima Orientation",
  "অন্যান্য",
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
      if (row.meeting_name && row.meeting_name.trim() !== "") {
        if (!(existing.meeting_name || "").includes(row.meeting_name.trim())) {
          existing.meeting_name = [existing.meeting_name, row.meeting_name.trim()].filter(Boolean).join(", ");
        }
      }
      if (row.comments && row.comments.trim() !== "" && row.comments.trim() !== "—") {
        if (!(existing.comments || "").includes(row.comments.trim())) {
          existing.comments = [existing.comments, row.comments.trim()].filter(Boolean).join(", ");
        }
      }
    }
  }
  return Array.from(grouped.values());
}

function getMonthsForPeriod(reportType: string, selectedMonth: number): number[] {
  const dbType = DB_TYPE_MAP[reportType] || reportType;
  switch (dbType) {
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
  const reportTypeParam = searchParams.get("report_type") || searchParams.get("type");

  // User details
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userZoneId, setUserZoneId] = useState<number | null>(null);
  const [userZoneName, setUserZoneName] = useState<string>("");

  // Lists for dropdowns
  const [zones, setZones] = useState<any[]>([]);

  // Filter state
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedReportType, setSelectedReportType] = useState<string>("monthly");
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          .select("role, zone_id, zone(name)")
          .eq("supabase_uid", user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
          setUserZoneId(profile.zone_id);
          if ((profile as any).zone?.name) setUserZoneName((profile as any).zone.name);
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
    const rawType = searchParams.get("type") || searchParams.get("report_type");
    if (rawType) {
      setSelectedReportType(URL_TO_ENGLISH_MAP[rawType] || rawType);
    }
  }, [zoneIdParam, monthParam, yearParam, searchParams, userZoneId]);

  // Active/Applied filter parameters derived directly from URL searchParams (sole source of truth for database querying)
  const appliedZoneId = zoneIdParam ? Number(zoneIdParam) : (userZoneId ? Number(userZoneId) : (selectedZone ? Number(selectedZone) : null));
  const appliedMonth = monthParam ? Number(monthParam) : (new Date().getMonth() + 1);
  const appliedYear = yearParam ? Number(yearParam) : (new Date().getFullYear());
  const rawTypeParam = searchParams.get("type") || searchParams.get("report_type");
  const appliedReportType = rawTypeParam ? (URL_TO_ENGLISH_MAP[rawTypeParam] || rawTypeParam) : "monthly";

  // 3. Fetch Report Data based on parameters
  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsDataLoaded(false);

    try {
      let targetReportId = reportIdParam ? Number(reportIdParam) : null;
      let targetZoneId = appliedZoneId;

      // For non-admin, force their own zone
      if (userRole && userRole !== "admin" && userRole !== "superadmin" && userZoneId) {
        targetZoneId = userZoneId;
      }

      let activeReport = null;
      let isMultiMonth = appliedReportType !== "monthly";
      let targetYear = appliedYear;
      let targetReportType = appliedReportType;
      let targetMonth = appliedMonth;
      let dbReportType = DB_TYPE_MAP[targetReportType] || targetReportType || "মাসিক";

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
        targetReportType = URL_TO_ENGLISH_MAP[reportObj.report_type] || reportObj.report_type;
        dbReportType = reportObj.report_type;
        targetMonth = reportObj.month;
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

        if (reportObj) {
          activeReport = reportObj;
          targetReportId = reportObj.id;
        }
      }

      // If it is multi-month, load and aggregate
      if (!targetReportId && isMultiMonth && targetZoneId) {
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
            report_type: dbReportType,
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
          setIsLoading(false);
          return;
        } else {
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
      }

      if (activeReport && targetReportId && targetReportId !== -1) {
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
    appliedZoneId,
    appliedMonth,
    appliedYear,
    appliedReportType,
    userRole,
    userZoneId,
  ]);

  // Load report when URL searchParams or currentUser/profile resolve
  useEffect(() => {
    if (currentUser && (appliedZoneId || reportIdParam || userZoneId)) {
      loadReport();
    }
  }, [currentUser, appliedZoneId, reportIdParam, userZoneId, loadReport]);

  // Handle Apply Filter Click
  const handleApplyFilter = () => {
    setIsFilterExpanded(false);
    const params = new URLSearchParams();
    if (selectedZone) params.set("zone_id", selectedZone);
    params.set("month", String(selectedMonth));
    params.set("year", String(selectedYear));
    const englishType = URL_TO_ENGLISH_MAP[selectedReportType] || selectedReportType || "monthly";
    params.set("type", englishType);
    params.set("report_type", englishType);
    router.push(`/report?${params.toString()}`);
  };

  // Download Handlers
  const handleDownloadExcel = () => {
    const type = reportInfo?.report_type || selectedReportType;
    const dbType = DB_TYPE_MAP[type] || type;
    if (dbType !== "মাসিক") {
      const targetZoneId = reportInfo?.zone_id || selectedZone || userZoneId;
      const targetYear = reportInfo?.year || selectedYear;
      const targetMonth = reportInfo?.month || selectedMonth;
      const urlType = URL_TO_ENGLISH_MAP[type] || "monthly";
      window.open(`/api/export/excel?zone_id=${targetZoneId}&year=${targetYear}&month=${targetMonth}&type=${urlType}&report_type=${urlType}`, "_blank");
    } else {
      const targetReportId = reportIdParam ? Number(reportIdParam) : reportId;
      if (!targetReportId || targetReportId === -1) return;
      window.open(`/api/export/excel?report_id=${targetReportId}`, "_blank");
    }
  };

  const handleDownloadPDF = () => {
    const type = reportInfo?.report_type || selectedReportType;
    const dbType = DB_TYPE_MAP[type] || type;
    if (dbType !== "মাসিক") {
      const targetZoneId = reportInfo?.zone_id || selectedZone || userZoneId;
      const targetYear = reportInfo?.year || selectedYear;
      const targetMonth = reportInfo?.month || selectedMonth;
      const urlType = URL_TO_ENGLISH_MAP[type] || "monthly";
      window.open(`/api/export/pdf?zone_id=${targetZoneId}&year=${targetYear}&month=${targetMonth}&type=${urlType}&report_type=${urlType}`, "_blank");
    } else {
      const targetReportId = reportIdParam ? Number(reportIdParam) : reportId;
      if (!targetReportId || targetReportId === -1) return;
      window.open(`/api/export/pdf?report_id=${targetReportId}`, "_blank");
    }
  };

  // ─── Render Helper Constants ────────────────────────────────────────────────

  const activeZoneName = useMemo(() => {
    if (reportInfo?.zone?.name) return reportInfo.zone.name;
    if (appliedZoneId) {
      const found = zones.find((z) => z.id === appliedZoneId);
      if (found?.name) return found.name;
    }
    if (selectedZone) {
      const found = zones.find((z) => String(z.id) === String(selectedZone));
      if (found?.name) return found.name;
    }
    return userZoneName || "";
  }, [reportInfo, appliedZoneId, selectedZone, zones, userZoneName]);

  const activeReportTypeBn = useMemo(() => {
    if (reportInfo?.report_type) {
      return DB_TYPE_MAP[reportInfo.report_type] || reportInfo.report_type;
    }
    return DB_TYPE_MAP[appliedReportType] || appliedReportType || "মাসিক";
  }, [reportInfo, appliedReportType]);

  const displayPeriodLabel = useMemo(() => {
    const month = reportInfo?.month || appliedMonth || selectedMonth;
    const year = reportInfo?.year || appliedYear || selectedYear;
    const dbType = activeReportTypeBn;
    if (dbType === "মাসিক") {
      return `${MONTHS_BN[month - 1]} ${toBn(year)}`;
    }
    return `${dbType} ${toBn(year)}`;
  }, [reportInfo, appliedMonth, selectedMonth, appliedYear, selectedYear, activeReportTypeBn]);

  // ─── Render View ───────────────────────────────────────────────────────────

  return (
    <div className="container py-8 max-w-7xl animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="flex flex-col items-center justify-center text-center p-6 bg-card border border-border/50 rounded-[2rem] shadow-sm relative mb-8">
        <div className="w-full max-w-3xl py-2">
          <p className="text-base md:text-lg font-bold text-foreground mb-1.5">
            বিসমিল্লাহির রহমানীর রহীম
          </p>
          <p className="text-2xl md:text-3xl font-black text-foreground mb-1.5">
            তা'লীমুল কুরআন বিভাগ
          </p>
          <p className="text-lg md:text-xl font-bold text-foreground mb-0">
            {activeZoneName ? `${activeZoneName} জোন - ` : ""}
            {activeReportTypeBn} রিপোর্ট - {displayPeriodLabel}
          </p>
        </div>

        {/* Download Buttons Dropdown */}
        {isDataLoaded && reportId && (
          <div
            ref={downloadRef}
            className="relative mt-4 md:mt-0 md:absolute md:right-6 md:top-6 flex justify-center w-full md:w-auto"
          >
            <button
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              className="modern-btn border border-border bg-card flex items-center justify-center gap-2 px-5 py-2.5 hover:bg-muted text-sm font-bold text-foreground transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>ডাউনলোড</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDownloadOpen ? "rotate-180" : ""}`} />
            </button>

            {isDownloadOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 py-1.5 text-left">
                <button
                  onClick={() => {
                    setIsDownloadOpen(false);
                    handleDownloadPDF();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-muted/60 transition-all text-foreground"
                >
                  <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>PDF ডাউনলোড</span>
                </button>
                <button
                  onClick={() => {
                    setIsDownloadOpen(false);
                    handleDownloadExcel();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-muted/60 transition-all text-foreground"
                >
                  <Download className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Excel ডাউনলোড</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filter Form ── */}
      {!reportIdParam && (
        <div className="modern-card p-4 md:p-6 mb-8 bg-card shadow-lg border-primary/10">
          {/* Mobile Collapsed Summary Bar */}
          <div className="flex md:hidden items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Filter className="w-4 h-4 text-primary shrink-0" />
              <div className="truncate text-xs font-bold text-foreground">
                {reportInfo
                  ? `${reportInfo.zone?.name || "জোন"} - ${reportInfo.report_type || selectedReportType} - ${displayPeriodLabel}`
                  : "ফিল্টার করুন (জোন, মাস, সাল)"}
              </div>
            </div>
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary active:scale-95 transition-all shrink-0 outline-none"
            >
              {isFilterExpanded ? "বন্ধ করুন" : "ফিল্টার পরিবর্তন"}
            </button>
          </div>

          {/* Filter Grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end mt-4 md:mt-0 ${
              isFilterExpanded ? "block" : "hidden md:grid"
            }`}
          >
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
                মাস {selectedReportType !== "monthly" && selectedReportType !== "মাসিক" && <span className="text-[10px] text-muted-foreground/60">(প্রযোজ্য নয়)</span>}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={selectedReportType !== "monthly" && selectedReportType !== "মাসিক"}
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

      {/* ── Report Content Area (Continuous Document Layout) ── */}
      {!isLoading && isDataLoaded && reportId && (
        <div className="modern-card bg-card border border-border/80 shadow-2xl rounded-[2.5rem] p-6 md:p-12 space-y-10">
          
          {/* ────── Summary Information Grid ────── */}
          {headerData && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 max-[320px]:grid-cols-1 gap-3 md:gap-6 text-sm bg-muted/30 p-5 rounded-2xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-semibold">দায়িত্বশীলের নাম:</span>
                  <span className="font-extrabold text-foreground text-base">
                    {headerData.responsible_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-semibold">থানা:</span>
                  <span className="font-extrabold text-foreground text-base">
                    {headerData.thana || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs font-semibold">ওয়ার্ড:</span>
                  <span className="font-extrabold text-foreground text-base">
                    {headerData.ward || "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 max-[320px]:grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Col 1: Total Muallima + Increase/Decrease */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">মোট মুয়াল্লিমা:</span>
                    <span className="font-black text-xl text-foreground">
                      {toBn(headerData.total_muallima)}
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">বৃদ্ধি / ঘাটতি:</span>
                    <span className="font-black text-lg text-foreground inline-flex gap-1.5">
                      <span className="text-green-600">+{toBn(headerData.muallima_increase)}</span>
                      <span className="text-muted-foreground/60">/</span>
                      <span className="text-red-500">-{toBn(headerData.muallima_decrease)}</span>
                    </span>
                  </div>
                </div>

                {/* Col 2: Certified Muallima + Certified Taking Classes */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা:</span>
                    <span className="font-black text-xl text-foreground">
                      {toBn(headerData.certified_muallima)}
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">সার্টিফিকেটপ্রাপ্ত ক্লাস নিচ্ছেন:</span>
                    <span className="font-bold text-lg text-foreground">
                      {toBn(headerData.certified_muallima_taking_classes)}
                    </span>
                  </div>
                </div>

                {/* Col 3: Trained Muallima + Trained Taking Classes */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা:</span>
                    <span className="font-black text-xl text-foreground">
                      {toBn(headerData.trained_muallima)}
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">প্রশিক্ষণপ্রাপ্ত ক্লাস নিচ্ছেন:</span>
                    <span className="font-bold text-lg text-foreground">
                      {toBn(headerData.trained_muallima_taking_classes)}
                    </span>
                  </div>
                </div>

                {/* Col 4: Total Unit + Unit With Muallima */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">ইউনিট সংখ্যা:</span>
                    <span className="font-black text-xl text-foreground">
                      {toBn(headerData.total_unit)}
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="text-muted-foreground block mb-1 text-xs font-bold">মুয়াল্লিমা সহ ইউনিট:</span>
                    <span className="font-bold text-lg text-foreground">
                      {toBn(headerData.units_with_muallima)}
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

            {/* Inline Maktab Stats */}
            <div className="p-4 rounded-xl border border-border text-xs sm:text-sm">
              <span className="font-black text-muted-foreground block text-xs tracking-wider uppercase mb-2">মক্তব রিপোর্ট:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মক্তব সংখ্যা:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "মক্তব সংখ্যা")?.number || 0)} টি</span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মক্তব বৃদ্ধি:</span>
                  <span className="font-black text-green-600 text-sm sm:text-base">+{toBn(extraData.find(e => e.category === "মক্তব বৃদ্ধি")?.number || 0)} টি</span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">মহানগরী পরিচালিত:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "মহানগরী পরিচালিত")?.number || 0)} টি</span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">স্থানীয়ভাবে পরিচালিত:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "স্থানীয়ভাবে পরিচালিত")?.number || 0)} টি</span>
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
                        <td className="w-[17%] px-2 py-3 border-r border-border">{toBn(row.number)}</td>
                        <td className="w-[17%] px-2 py-3 border-r border-border text-green-600">+{toBn(row.increase)}</td>
                        <td className="w-[16%] px-2 py-3 border-r border-border">{toBn(row.amount)}</td>
                        <td className="w-[16%] px-2 py-3 text-left text-muted-foreground text-xs truncate" title={row.comments || ""}>
                          {row.comments || "—"}
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
                            {toBn(val)}
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
                    const customTitle = (row as any).meeting_name?.trim() || (row.comments?.trim() && row.comments?.trim() !== "—" ? row.comments?.trim() : "");
                    const displayLabel = cat === "অন্যান্য" && customTitle ? customTitle : cat;
                    return (
                      <tr key={cat} className="hover:bg-muted/40 transition-colors">
                        <td className="w-[28%] px-3 py-3 border-r border-border text-left font-bold text-foreground break-words">{displayLabel}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">{toBn(row.city_count)}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">{toBn(row.city_avg_attendance)}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">{toBn(row.thana_count)}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">{toBn(row.thana_avg_attendance)}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">{toBn(row.ward_count)}</td>
                        <td className="w-[10%] px-1 py-3 border-r border-border">{toBn(row.ward_avg_attendance)}</td>
                        <td className="w-[12%] px-2 py-3 text-left text-muted-foreground text-xs truncate" title={row.comments || ""}>
                          {row.comments || "—"}
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
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "মহানগরীর সফর")?.number || 0)} টি</span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">থানা কমিটির সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "থানা কমিটির সফর")?.number || 0)} টি</span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">থানা প্রতিনিধির সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "থানা প্রতিনিধির সফর")?.number || 0)} টি</span>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center px-3 py-2 rounded-lg border border-border/70 gap-0.5">
                  <span className="text-muted-foreground font-semibold">ওয়ার্ড প্রতিনিধির সফর:</span>
                  <span className="font-black text-foreground text-sm sm:text-base">{toBn(extraData.find(e => e.category === "ওয়ার্ড প্রতিনিধির সফর")?.number || 0)} টি</span>
                </div>
              </div>
            </div>
          </div>

          {/* ────── ৫. মন্তব্য ────── */}
          <div className="space-y-3 pt-4">
            <div className="font-black text-foreground text-base">মন্তব্য:</div>
            <div className="bg-muted/30 border border-border/80 rounded-xl p-5 min-h-[90px] text-foreground text-sm whitespace-pre-wrap leading-relaxed">
              {commentData?.comment?.trim() ? (
                commentData.comment
              ) : (
                <span className="text-muted-foreground italic font-medium">কোনো মন্তব্য যোগ করা হয়নি।</span>
              )}
            </div>
          </div>

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
