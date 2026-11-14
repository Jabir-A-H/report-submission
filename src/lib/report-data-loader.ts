import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COURSE_CATEGORIES,
  ORG_CATEGORIES,
  PERSONAL_CATEGORIES,
  MEETING_CATEGORIES,
  EXTRA_CATEGORIES,
  MONTHS_BN,
  toBn,
  resolvePeriodConfig,
  sumRows,
  sumHeaderRows,
  toFiniteNumber,
} from "./report-utils.ts";

export interface ReportDataBundle {
  zoneName: string;
  reportType: string;
  periodLabel: string;
  filenameBase: string;
  isCityAgg: boolean;
  header: any;
  courses: any[];
  org: any[];
  personal: any[];
  meetings: any[];
  extras: any[];
  comment: { comment: string } | null;
}

export interface ReportLoaderParams {
  reportId?: string | number | null;
  zoneId?: string | number | null;
  year?: string | number | null;
  month?: string | number | null;
  reportType?: string | null;
  endMonth?: string | number | null;
  cityReport?: boolean | null;
}

export interface RequesterProfile {
  role: string;
  zone_id: number | null;
  active?: boolean;
}

export async function loadReportDataBundle(
  supabase: SupabaseClient,
  params: ReportLoaderParams,
  requester: RequesterProfile
): Promise<{ data?: ReportDataBundle; error?: { status: number; message: string } }> {
  // 1. Authorization check
  if (requester.active !== true) {
    return { error: { status: 403, message: "Forbidden" } };
  }

  const isAdmin = requester.role === "admin" || requester.role === "superadmin";

  // 2. Determine Case: Case B (City Aggregated) vs Case A (Single Zone)
  const isExplicitCity = params.cityReport === true;
  const isDcsZone1 =
    params.zoneId !== undefined &&
    params.zoneId !== null &&
    String(params.zoneId).trim() !== "" &&
    Number(params.zoneId) === 1;
  const hasNoZoneOrReport = !params.reportId && !params.zoneId;

  const isCaseB = isExplicitCity || isDcsZone1 || hasNoZoneOrReport;

  if (isCaseB) {
    if (!isAdmin) {
      return { error: { status: 403, message: "Forbidden" } };
    }

    const activePeriod = resolvePeriodConfig({
      type: params.reportType,
      report_type: params.reportType,
      month: params.month,
      year: params.year,
      startMonth: params.month,
      endMonth: params.endMonth,
    });

    const { year, startMonth, dbType, months, isMultiMonth, labelBn } = activePeriod;
    const queryReportType = "মাসিক";

    // Fetch views and overrides in parallel
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
        .eq("report_type", dbType)
        .in("month", months),
    ]);

    const rawHeader = headerRes.data || [];
    const computedHeader = isMultiMonth ? sumHeaderRows(rawHeader) : rawHeader[0] || null;

    const rawCourse = courseRes.data || [];
    const computedCourse = isMultiMonth
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
      : rawCourse;

    const rawOrg = orgRes.data || [];
    const computedOrg = isMultiMonth
      ? sumRows(rawOrg, ["number", "increase", "amount"])
      : rawOrg;

    const rawPersonal = personalRes.data || [];
    const computedPersonal = isMultiMonth
      ? sumRows(rawPersonal, [
          "teaching",
          "learning",
          "olama_invited",
          "became_shohojogi",
          "became_sokrio_shohojogi",
          "became_kormi",
          "became_rukon",
        ])
      : rawPersonal;

    const rawMeeting = meetingRes.data || [];
    const computedMeeting = isMultiMonth
      ? sumRows(rawMeeting, [
          "city_count",
          "city_avg_attendance",
          "thana_count",
          "thana_avg_attendance",
          "ward_count",
          "ward_avg_attendance",
        ])
      : rawMeeting;

    const rawExtra = extraRes.data || [];
    const computedExtra = isMultiMonth ? sumRows(rawExtra, ["number"]) : rawExtra;

    // Build override map
    const overrides = overrideRes.data || [];
    const overrideMap = new Map<string, string>();
    overrides.forEach((o: any) => {
      const key = `${o.section}:${o.field}:${o.category || ""}`;
      overrideMap.set(key, o.value);
    });

    const getVal = (section: string, field: string, computed: number, cat?: string) => {
      const key = `${section}:${field}:${cat || ""}`;
      const ov = overrideMap.get(key);
      return ov !== undefined ? toFiniteNumber(ov) : toFiniteNumber(computed);
    };

    let header: any = null;
    if (computedHeader) {
      header = {};
      const headerKeys = [
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
      headerKeys.forEach((k) => {
        header[k] = getVal("header", k, computedHeader[k] || 0);
      });
    }

    const courses = COURSE_CATEGORIES.map((cat) => {
      const item = computedCourse.find((x: any) => x.category === cat) || {};
      const resolved: any = { category: cat };
      const keys = [
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
      ];
      keys.forEach((k) => {
        resolved[k] = getVal("courses", k, item[k] || 0, cat);
      });
      return resolved;
    });

    const org = ORG_CATEGORIES.map((cat) => {
      const item = computedOrg.find((x: any) => x.category === cat) || {};
      return {
        category: cat,
        number: getVal("organizational", "number", item.number || 0, cat),
        increase: getVal("organizational", "increase", item.increase || 0, cat),
        amount: getVal("organizational", "amount", item.amount || 0, cat),
        comments: item.comments || "",
      };
    });

    const personal = PERSONAL_CATEGORIES.map((cat) => {
      const item = computedPersonal.find((x: any) => x.category === cat) || {};
      return {
        category: cat,
        teaching: getVal("personal", "teaching", item.teaching || 0, cat),
        learning: getVal("personal", "learning", item.learning || 0, cat),
        olama_invited: getVal("personal", "olama_invited", item.olama_invited || 0, cat),
        became_shohojogi: getVal("personal", "became_shohojogi", item.became_shohojogi || 0, cat),
        became_sokrio_shohojogi: getVal(
          "personal",
          "became_sokrio_shohojogi",
          item.became_sokrio_shohojogi || 0,
          cat
        ),
        became_kormi: getVal("personal", "became_kormi", item.became_kormi || 0, cat),
        became_rukon: getVal("personal", "became_rukon", item.became_rukon || 0, cat),
      };
    });

    const meetings = MEETING_CATEGORIES.map((cat) => {
      const item = computedMeeting.find((x: any) => x.category === cat) || {};
      return {
        category: cat,
        city_count: getVal("meetings", "city_count", item.city_count || 0, cat),
        city_avg_attendance: getVal(
          "meetings",
          "city_avg_attendance",
          item.city_avg_attendance || 0,
          cat
        ),
        thana_count: getVal("meetings", "thana_count", item.thana_count || 0, cat),
        thana_avg_attendance: getVal(
          "meetings",
          "thana_avg_attendance",
          item.thana_avg_attendance || 0,
          cat
        ),
        ward_count: getVal("meetings", "ward_count", item.ward_count || 0, cat),
        ward_avg_attendance: getVal(
          "meetings",
          "ward_avg_attendance",
          item.ward_avg_attendance || 0,
          cat
        ),
        meeting_name: item.meeting_name || "",
        comments: item.comments || "",
      };
    });

    const extras = EXTRA_CATEGORIES.map((cat) => {
      const item = computedExtra.find((x: any) => x.category === cat) || {};
      return {
        category: cat,
        number: getVal("extras", "number", item.number || 0, cat),
      };
    });

    const cityComment =
      overrideMap.get("comment:city_comment:মহানগরী মন্তব্য") ||
      overrideMap.get("comment:city_comment:") ||
      "";
    const comment = { comment: cityComment.trim() };

    return {
      data: {
        zoneName: "ঢাকা মহানগরী",
        reportType: dbType,
        periodLabel: labelBn,
        filenameBase: `City_Report_${dbType}_${startMonth}_${year}`,
        isCityAgg: true,
        header,
        courses,
        org,
        personal,
        meetings,
        extras,
        comment,
      },
    };
  }

  // 3. CASE A: Single Zone Report (By reportId or zoneId + period range)
  if (params.reportId) {
    const repId = Number(params.reportId);
    if (!Number.isInteger(repId) || repId <= 0) {
      return { error: { status: 400, message: "Invalid report_id" } };
    }

    const { data: report, error: repError } = await supabase
      .from("report")
      .select("*, zone(name)")
      .eq("id", repId)
      .single();

    if (repError || !report) {
      return { error: { status: 404, message: "Report not found" } };
    }

    if (!isAdmin && report.zone_id !== requester.zone_id) {
      return { error: { status: 403, message: "Forbidden" } };
    }

    const zoneName = report.zone?.name || "—";
    const reportType = report.report_type;
    const periodLabel =
      report.report_type === "মাসিক"
        ? `${MONTHS_BN[report.month - 1]} ${toBn(report.year)}`
        : `${report.report_type} (${toBn(report.year)})`;
    const filenameBase = `${zoneName}_Report_${report.month}_${report.year}`;

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

    return {
      data: {
        zoneName,
        reportType,
        periodLabel,
        filenameBase,
        isCityAgg: false,
        header: headerRes.data,
        courses: coursesRes.data || [],
        org: orgRes.data || [],
        personal: personalRes.data || [],
        meetings: meetingRes.data || [],
        extras: extraRes.data || [],
        comment: commentRes.data
          ? { comment: commentRes.data.comment || "" }
          : { comment: "" },
      },
    };
  }

  // Sub-branch: Query by zoneId + period range
  const targetZoneId = Number(params.zoneId);
  const targetYear = Number(params.year);
  const targetMonth = Number(params.month || 1);

  if (!Number.isInteger(targetZoneId) || targetZoneId <= 0) {
    return { error: { status: 400, message: "Invalid zone_id" } };
  }
  if (!Number.isInteger(targetYear) || targetYear < 2000) {
    return { error: { status: 400, message: "Invalid year" } };
  }
  if (!Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    return { error: { status: 400, message: "Invalid month" } };
  }
  if (!isAdmin && targetZoneId !== requester.zone_id) {
    return { error: { status: 403, message: "Forbidden" } };
  }

  const { data: zoneObj } = await supabase
    .from("zone")
    .select("name")
    .eq("id", targetZoneId)
    .single();

  const zoneName = zoneObj?.name || "—";

  const activePeriod = resolvePeriodConfig({
    type: params.reportType,
    report_type: params.reportType,
    month: targetMonth,
    year: targetYear,
    startMonth: targetMonth,
    endMonth: params.endMonth,
  });

  const { year, startMonth, dbType, months, labelBn } = activePeriod;
  const periodLabel = labelBn;
  const filenameBase = `${zoneName}_Report_${startMonth}_${year}`;

  const { data: monthlyReports } = await supabase
    .from("report")
    .select("id, month")
    .eq("zone_id", targetZoneId)
    .eq("year", targetYear)
    .eq("report_type", "মাসিক")
    .in("month", months);

  let header: any = null;
  let courses: any[] = [];
  let org: any[] = [];
  let personal: any[] = [];
  let meetings: any[] = [];
  let extras: any[] = [];
  let comment: { comment: string } = { comment: "" };

  if (monthlyReports && monthlyReports.length > 0) {
    const reportIds = monthlyReports.map((r: any) => r.id);
    const monthMap = new Map((monthlyReports || []).map((r: any) => [r.id, r.month]));

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

    const rawHeader = (headerRes.data || []).map((h: any) => ({
      ...h,
      month: monthMap.get(h.report_id) ?? h.month,
    }));
    const rawCourse = coursesRes.data || [];
    const rawOrg = orgRes.data || [];
    const rawPersonal = personalRes.data || [];
    const rawMeeting = meetingRes.data || [];
    const rawExtra = extraRes.data || [];
    const rawComment = commentRes.data || [];

    header = sumHeaderRows(rawHeader) || {};
    courses = sumRows(rawCourse, [
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
    ]);
    org = sumRows(rawOrg, ["number", "increase", "amount"]);
    personal = sumRows(rawPersonal, [
      "teaching",
      "learning",
      "olama_invited",
      "became_shohojogi",
      "became_sokrio_shohojogi",
      "became_kormi",
      "became_rukon",
    ]);
    meetings = sumRows(rawMeeting, [
      "city_count",
      "city_avg_attendance",
      "thana_count",
      "thana_avg_attendance",
      "ward_count",
      "ward_avg_attendance",
    ]);
    extras = sumRows(rawExtra, ["number"]);
    comment = {
      comment: rawComment
        .map((c: any) => c.comment)
        .filter((c: any) => c && String(c).trim() !== "")
        .join("\n"),
    };
  }

  return {
    data: {
      zoneName,
      reportType: dbType,
      periodLabel,
      filenameBase,
      isCityAgg: false,
      header,
      courses,
      org,
      personal,
      meetings,
      extras,
      comment,
    },
  };
}
