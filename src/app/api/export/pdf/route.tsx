import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";

// ─── Font Registration ────────────────────────────────────────────────────────

Font.register({
  family: "Tiro Bangla",
  src: "https://fonts.gstatic.com/s/tirobangla/v6/IuaHaJaHVsk2rGGByzUFTJrmwLs.ttf",
});

// ─── Constants & Styling ──────────────────────────────────────────────────────

const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

const COURSE_CATEGORIES = [
  "বিশিষ্টদের", "সাধারণদের", "কর্মীদের", "ইউনিট সভানেত্রী",
  "অগ্রসরদের", "শিশু- তা'লিমুল কুরআন", "নিরক্ষর- তা'লিমুস সলাত"
];

const ORG_CATEGORIES = [
  "দাওয়াত দান", "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন", "সহযোগী হয়েছে",
  "সম্মতি দিয়েছেন", "সক্রিয় সহযোগী", "কর্মী", "রুকন", "দাওয়াতী ইউনিট",
  "ইউনিট", "সূধী", "এককালীন", "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
  "বই বিলি", "বই বিক্রি"
];

const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে", "মুয়াল্লিমাদের নিয়ে বৈঠক", "Committee Orientation", "Muallima Orientation"
];

const EXTRA_CATEGORIES = [
  "মক্তব সংখ্যা", "মক্তব বৃদ্ধি", "মহানগরী পরিচালিত", "স্থানীয়ভাবে পরিচালিত",
  "মহানগরীর সফর", "থানা কমিটির সফর", "থানা প্রতিনিধির সফর", "ওয়ার্ড প্রতিনিধির সফর"
];

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Tiro Bangla",
    backgroundColor: "#ffffff",
    fontSize: 9,
    lineHeight: 1.3,
  },
  header: {
    marginBottom: 15,
    borderBottom: "1.5pt solid #0f172a",
    paddingBottom: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    color: "#475569",
    marginTop: 3,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#f1f5f9",
    padding: 4,
    marginBottom: 6,
    borderRadius: 3,
    color: "#1e3a8a",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  gridItem: {
    width: "25%",
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
  },
  gridLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  gridValue: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 2,
    color: "#0f172a",
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 4,
    textAlign: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#cbd5e1",
  },
  textLeft: {
    textAlign: "left",
  },
  commentBox: {
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    padding: 6,
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    minHeight: 40,
  },
});

// ─── PDF Component Layout ─────────────────────────────────────────────────────

interface ReportPDFProps {
  reportType: string;
  periodLabel: string;
  zoneName: string;
  header: any;
  courses: any[];
  org: any[];
  personal: any[];
  meetings: any[];
  extras: any[];
  comment: any;
  isCityAgg?: boolean;
}

const ReportPDFDocument = ({
  reportType,
  periodLabel,
  zoneName,
  header,
  courses,
  org,
  personal,
  meetings,
  extras,
  comment,
  isCityAgg = false,
}: ReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCityAgg ? "তা'লীমুল কুরআন মহানগরী রিপোর্ট (সমষ্টিগত)" : "তা'লীমুল কুরআন জোন রিপোর্ট"}
        </Text>
        <Text style={styles.subtitle}>
          {isCityAgg ? "" : `জোন: ${zoneName} | `}সময়কাল: {periodLabel} ({reportType})
        </Text>
      </View>

      {/* 1. Header Info Grid */}
      {header && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>১. মূল তথ্য</Text>
          <View style={styles.grid}>
            {!isCityAgg && (
              <>
                <View style={[styles.gridItem, { width: "33%" }]}>
                  <Text style={styles.gridLabel}>দায়িত্বশীলের নাম</Text>
                  <Text style={styles.gridValue}>{header.responsible_name || "—"}</Text>
                </View>
                <View style={[styles.gridItem, { width: "33%" }]}>
                  <Text style={styles.gridLabel}>থানা</Text>
                  <Text style={styles.gridValue}>{header.thana || "—"}</Text>
                </View>
                <View style={[styles.gridItem, { width: "34%" }]}>
                  <Text style={styles.gridLabel}>ওয়ার্ড</Text>
                  <Text style={styles.gridValue}>{header.ward || "—"}</Text>
                </View>
              </>
            )}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>মোট মুয়াল্লিমা</Text>
              <Text style={styles.gridValue}>{header.total_muallima ?? 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>মুয়াল্লিমা বৃদ্ধি</Text>
              <Text style={styles.gridValue}>{header.muallima_increase ?? 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>মুয়াল্লিমা হ্রাস</Text>
              <Text style={styles.gridValue}>{header.muallima_decrease ?? 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>মোট ইউনিট</Text>
              <Text style={styles.gridValue}>{header.total_unit ?? 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>মুয়াল্লিমা সহ ইউনিট</Text>
              <Text style={styles.gridValue}>{header.units_with_muallima ?? 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>সনদপ্রাপ্তা ক্লাস নিচ্ছেন</Text>
              <Text style={styles.gridValue}>{header.certified_muallima_taking_classes ?? 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>প্রশিক্ষণপ্রাপ্তা ক্লাস নিচ্ছেন</Text>
              <Text style={styles.gridValue}>{header.trained_muallima_taking_classes ?? 0}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. Courses Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>২. গ্রুপ / কোর্স রিপোর্ট</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.textLeft, { width: "22%" }]}>বিভাগ/ধরন</Text>
            <Text style={[styles.tableCell, { width: "7%" }]}>সংখ্যা</Text>
            <Text style={[styles.tableCell, { width: "7%" }]}>বৃদ্ধি</Text>
            <Text style={[styles.tableCell, { width: "7%" }]}>ঘাটতি</Text>
            <Text style={[styles.tableCell, { width: "7%" }]}>ক্লাস</Text>
            <Text style={[styles.tableCell, { width: "8%" }]}>ছাত্রী</Text>
            <Text style={[styles.tableCell, { width: "8%" }]}>উপস্থিতি</Text>
            <Text style={[styles.tableCell, { width: "6%" }]}>বোর্ড</Text>
            <Text style={[styles.tableCell, { width: "6%" }]}>কায়দা</Text>
            <Text style={[styles.tableCell, { width: "6%" }]}>আমপারা</Text>
            <Text style={[styles.tableCell, { width: "6%" }]}>কুরআন</Text>
            <Text style={[styles.tableCell, { width: "5%" }]}>শেষ</Text>
            <Text style={[styles.tableCell, { width: "5%", borderRightWidth: 0 }]}>সহীহ</Text>
          </View>
          {/* Rows */}
          {COURSE_CATEGORIES.map((cat) => {
            const item = courses.find((x) => x.category === cat) || {};
            return (
              <View key={cat} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.textLeft, { width: "22%", fontWeight: "bold" }]}>{cat}</Text>
                <Text style={[styles.tableCell, { width: "7%" }]}>{item.number ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "7%" }]}>{item.increase ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "7%" }]}>{item.decrease ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "7%" }]}>{item.sessions ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "8%" }]}>{item.students ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "8%" }]}>{item.attendance ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "6%" }]}>{item.status_board ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "6%" }]}>{item.status_qayda ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "6%" }]}>{item.status_ampara ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "6%" }]}>{item.status_quran ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "5%" }]}>{item.completed ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "5%", borderRightWidth: 0 }]}>{item.correctly_learned ?? 0}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 3. Organizational Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>৩. দাওয়াত ও সংগঠন</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.textLeft, { width: "40%" }]}>দাওয়াত ও সংগঠন</Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>সংখ্যা</Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>বৃদ্ধি</Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>পরিমাণ/টাকা</Text>
            <Text style={[styles.tableCell, styles.textLeft, { width: "15%", borderRightWidth: 0 }]}>মন্তব্য</Text>
          </View>
          {/* Rows */}
          {ORG_CATEGORIES.map((cat) => {
            const item = org.find((x) => x.category === cat) || {};
            return (
              <View key={cat} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.textLeft, { width: "40%", fontWeight: "bold" }]}>{cat}</Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>{item.number ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>{item.increase ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>{item.amount ?? 0}</Text>
                <Text style={[styles.tableCell, styles.textLeft, { width: "15%", borderRightWidth: 0, fontSize: 7 }]}>
                  {item.comments || "—"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. Personal Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>৪. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.textLeft, { width: "23%" }]}>বিভাগ</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>শিখাচ্ছেন</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>শিখছেন</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>ওলামা দাওয়াত</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>সহযোগী</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>সক্রিয় সহযোগী</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>কর্মী</Text>
            <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>রুকন</Text>
          </View>
          {/* Rows */}
          {PERSONAL_CATEGORIES.map((cat) => {
            const item = personal.find((x) => x.category === cat) || {};
            return (
              <View key={cat} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.textLeft, { width: "23%", fontWeight: "bold" }]}>{cat}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.teaching ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.learning ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.olama_invited ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.became_shohojogi ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.became_sokrio_shohojogi ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.became_kormi ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>{item.became_rukon ?? 0}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 5. Meetings Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>৫. বৈঠকসমূহ</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.textLeft, { width: "23%" }]}>বৈঠকসমূহ</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>মহানগরী</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>গড় উপ.</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>থানা</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>গড় উপ.</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>ওয়ার্ড</Text>
            <Text style={[styles.tableCell, { width: "11%" }]}>গড় উপ.</Text>
            <Text style={[styles.tableCell, styles.textLeft, { width: "11%", borderRightWidth: 0 }]}>মন্তব্য</Text>
          </View>
          {/* Rows */}
          {MEETING_CATEGORIES.map((cat) => {
            const item = meetings.find((x) => x.category === cat) || {};
            return (
              <View key={cat} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.textLeft, { width: "23%", fontWeight: "bold" }]}>{cat}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.city_count ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.city_avg_attendance ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.thana_count ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.thana_avg_attendance ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.ward_count ?? 0}</Text>
                <Text style={[styles.tableCell, { width: "11%" }]}>{item.ward_avg_attendance ?? 0}</Text>
                <Text style={[styles.tableCell, styles.textLeft, { width: "11%", borderRightWidth: 0, fontSize: 7 }]}>
                  {item.comments || "—"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 6. Extras Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>৬. মক্তব ও সফর রিপোর্ট</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.textLeft, { width: "70%" }]}>বিষয়</Text>
            <Text style={[styles.tableCell, { width: "30%", borderRightWidth: 0 }]}>সংখ্যা</Text>
          </View>
          {/* Rows */}
          {EXTRA_CATEGORIES.map((cat) => {
            const item = extras.find((x) => x.category === cat) || {};
            return (
              <View key={cat} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.textLeft, { width: "70%", fontWeight: "bold" }]}>{cat}</Text>
                <Text style={[styles.tableCell, { width: "30%", borderRightWidth: 0 }]}>{item.number ?? 0}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 7. Comments Section */}
      {comment && comment.comment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>৭. মন্তব্য</Text>
          <View style={styles.commentBox}>
            <Text>{comment.comment}</Text>
          </View>
        </View>
      )}
    </Page>
  </Document>
);

// ─── Helpers for City Aggregation ─────────────────────────────────────────────

function getMonthsForPeriod(reportType: string, selectedMonth: number): number[] {
  switch (reportType) {
    case "ত্রৈমাসিক": return [1, 2, 3];
    case "ষান্মাসিক": return [1, 2, 3, 4, 5, 6];
    case "নয়-মাসিক": return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    case "বার্ষিক": return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    default: return [selectedMonth];
  }
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

function sumHeaderRows(rows: any[]): any | null {
  if (rows.length === 0) return null;
  const base = { ...rows[0] };
  const numericKeys = [
    "total_muallima", "muallima_increase", "muallima_decrease", "certified_muallima",
    "certified_muallima_taking_classes", "trained_muallima", "trained_muallima_taking_classes",
    "total_unit", "units_with_muallima"
  ];
  for (let i = 1; i < rows.length; i++) {
    for (const k of numericKeys) {
      base[k] = (base[k] || 0) + (rows[i][k] || 0);
    }
  }
  return base;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportIdParam = searchParams.get("report_id");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const reportTypeParam = searchParams.get("report_type");

    const supabase = await createClient();

    // Verify session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let reportType = "মাসিক";
    let periodLabel = "";
    let zoneName = "";
    let header: any = null;
    let courses: any[] = [];
    let org: any[] = [];
    let personal: any[] = [];
    let meetings: any[] = [];
    let extras: any[] = [];
    let comment: any = null;
    let isCityAgg = false;
    let filename = "Report.pdf";

    // ─────────────────────────────────────────────────────────────────────────
    // CASE A: Export Single Zone Report PDF
    // ─────────────────────────────────────────────────────────────────────────
    if (reportIdParam) {
      const repId = Number(reportIdParam);

      // Fetch main report record with zone name
      const { data: report, error: repError } = await supabase
        .from("report")
        .select("*, zone(name)")
        .eq("id", repId)
        .single();

      if (repError || !report) {
        return new NextResponse("Report not found", { status: 404 });
      }

      zoneName = report.zone?.name || "—";
      reportType = report.report_type;
      periodLabel = report.report_type === "মাসিক" 
        ? `${MONTHS_BN[report.month - 1]} ${report.year}`
        : `${report.report_type} (${report.year})`;
      filename = `${zoneName}_Report_${report.month}_${report.year}.pdf`;

      // Fetch sections
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

      header = headerRes.data;
      courses = coursesRes.data || [];
      org = orgRes.data || [];
      personal = personalRes.data || [];
      meetings = meetingRes.data || [];
      extras = extraRes.data || [];
      comment = commentRes.data;
    } 
    // ─────────────────────────────────────────────────────────────────────────
    // CASE B: Export City Aggregated Report PDF
    // ─────────────────────────────────────────────────────────────────────────
    else {
      isCityAgg = true;
      const year = yearParam ? Number(yearParam) : new Date().getFullYear();
      const month = monthParam ? Number(monthParam) : new Date().getMonth() + 1;
      reportType = reportTypeParam || "মাসিক";

      const months = getMonthsForPeriod(reportType, month);
      const isMultiMonth = months.length > 1;
      const queryReportType = "মাসিক";

      filename = `City_Report_${reportType}_${month}_${year}.pdf`;

      // Fetch views + overrides
      const [
        headerRes,
        courseRes,
        orgRes,
        personalRes,
        meetingRes,
        extraRes,
        overrideRes,
      ] = await Promise.all([
        supabase.from("view_city_header_agg").select("*").eq("year", year).in("month", months).eq("report_type", queryReportType),
        supabase.from("view_city_course_agg").select("*").eq("year", year).in("month", months).eq("report_type", queryReportType),
        supabase.from("view_city_organizational_agg").select("*").eq("year", year).in("month", months).eq("report_type", queryReportType),
        supabase.from("view_city_personal_agg").select("*").eq("year", year).in("month", months).eq("report_type", queryReportType),
        supabase.from("view_city_meeting_agg").select("*").eq("year", year).in("month", months).eq("report_type", queryReportType),
        supabase.from("view_city_extra_agg").select("*").eq("year", year).in("month", months).eq("report_type", queryReportType),
        supabase.from("city_report_override").select("*").eq("year", year).eq("report_type", reportType).in("month", months),
      ]);

      const rawHeader = headerRes.data || [];
      const computedHeader = isMultiMonth ? sumHeaderRows(rawHeader) : rawHeader[0] || null;

      const rawCourse = courseRes.data || [];
      const computedCourse = isMultiMonth ? sumRows(rawCourse, [
        "number", "increase", "decrease", "sessions", "students", "attendance",
        "status_board", "status_qayda", "status_ampara", "status_quran", "completed", "correctly_learned"
      ]) : rawCourse;

      const rawOrg = orgRes.data || [];
      const computedOrg = isMultiMonth ? sumRows(rawOrg, ["number", "increase", "amount"]) : rawOrg;

      const rawPersonal = personalRes.data || [];
      const computedPersonal = isMultiMonth ? sumRows(rawPersonal, [
        "teaching", "learning", "olama_invited", "became_shohojogi", 
        "became_sokrio_shohojogi", "became_kormi", "became_rukon"
      ]) : rawPersonal;

      const rawMeeting = meetingRes.data || [];
      const computedMeeting = isMultiMonth ? sumRows(rawMeeting, [
        "city_count", "city_avg_attendance", "thana_count", "thana_avg_attendance",
        "ward_count", "ward_avg_attendance"
      ]) : rawMeeting;

      const rawExtra = extraRes.data || [];
      const computedExtra = isMultiMonth ? sumRows(rawExtra, ["number"]) : rawExtra;

      // Map overrides
      const overrides = overrideRes.data || [];
      const overrideMap = new Map<string, string>();
      overrides.forEach((o) => {
        const key = `${o.section}:${o.field}:${o.category || ""}`;
        overrideMap.set(key, o.value);
      });

      const getVal = (section: string, field: string, computed: number, cat?: string) => {
        const key = `${section}:${field}:${cat || ""}`;
        const ov = overrideMap.get(key);
        return ov !== undefined ? Number(ov) : (computed || 0);
      };

      periodLabel = isMultiMonth
        ? `${MONTHS_BN[months[0] - 1]} — ${MONTHS_BN[months[months.length - 1] - 1]} ${year}`
        : `${MONTHS_BN[month - 1]} ${year}`;

      // Set aggregated data incorporating overrides
      if (computedHeader) {
        header = {};
        const headerKeys = [
          "total_muallima", "muallima_increase", "muallima_decrease", "certified_muallima",
          "certified_muallima_taking_classes", "trained_muallima", "trained_muallima_taking_classes",
          "total_unit", "units_with_muallima"
        ];
        headerKeys.forEach((k) => {
          header[k] = getVal("header", k, computedHeader[k] || 0);
        });
      }

      courses = COURSE_CATEGORIES.map((cat) => {
        const item = computedCourse.find((x) => x.category === cat) || {};
        const resolved: any = { category: cat };
        const keys = [
          "number", "increase", "decrease", "sessions", "students", "attendance",
          "status_board", "status_qayda", "status_ampara", "status_quran", "completed", "correctly_learned"
        ];
        keys.forEach((k) => {
          resolved[k] = getVal("courses", k, item[k] || 0, cat);
        });
        return resolved;
      });

      org = ORG_CATEGORIES.map((cat) => {
        const item = computedOrg.find((x) => x.category === cat) || {};
        return {
          category: cat,
          number: getVal("organizational", "number", item.number || 0, cat),
          increase: getVal("organizational", "increase", item.increase || 0, cat),
          amount: getVal("organizational", "amount", item.amount || 0, cat),
          comments: item.comments || "",
        };
      });

      personal = PERSONAL_CATEGORIES.map((cat) => {
        const item = computedPersonal.find((x) => x.category === cat) || {};
        return {
          category: cat,
          teaching: getVal("personal", "teaching", item.teaching || 0, cat),
          learning: getVal("personal", "learning", item.learning || 0, cat),
          olama_invited: getVal("personal", "olama_invited", item.olama_invited || 0, cat),
          became_shohojogi: getVal("personal", "became_shohojogi", item.became_shohojogi || 0, cat),
          became_sokrio_shohojogi: getVal("personal", "became_sokrio_shohojogi", item.became_sokrio_shohojogi || 0, cat),
          became_kormi: getVal("personal", "became_kormi", item.became_kormi || 0, cat),
          became_rukon: getVal("personal", "became_rukon", item.became_rukon || 0, cat),
        };
      });

      meetings = MEETING_CATEGORIES.map((cat) => {
        const item = computedMeeting.find((x) => x.category === cat) || {};
        return {
          category: cat,
          city_count: getVal("meetings", "city_count", item.city_count || 0, cat),
          city_avg_attendance: getVal("meetings", "city_avg_attendance", item.city_avg_attendance || 0, cat),
          thana_count: getVal("meetings", "thana_count", item.thana_count || 0, cat),
          thana_avg_attendance: getVal("meetings", "thana_avg_attendance", item.thana_avg_attendance || 0, cat),
          ward_count: getVal("meetings", "ward_count", item.ward_count || 0, cat),
          ward_avg_attendance: getVal("meetings", "ward_avg_attendance", item.ward_avg_attendance || 0, cat),
          comments: item.comments || "",
        };
      });

      extras = EXTRA_CATEGORIES.map((cat) => {
        const item = computedExtra.find((x) => x.category === cat) || {};
        return {
          category: cat,
          number: getVal("extras", "number", item.number || 0, cat),
        };
      });
    }

    // ── Generate PDF Buffer ──
    const pdfBuffer = await renderToBuffer(
      <ReportPDFDocument
        reportType={reportType}
        periodLabel={periodLabel}
        zoneName={zoneName}
        header={header}
        courses={courses}
        org={org}
        personal={personal}
        meetings={meetings}
        extras={extras}
        comment={comment}
        isCityAgg={isCityAgg}
      />
    );

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
