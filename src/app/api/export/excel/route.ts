import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";

// ─── Constants & Categories ──────────────────────────────────────────────────

const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
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
  "এককালীন",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি",
  "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন",
  "বই বিলি",
  "বই বিক্রি",
];

const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

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

// ─── Helpers for City Aggregation ─────────────────────────────────────────────

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

function getMonthsForPeriod(reportType: string, selectedMonth: number): number[] {
  const dbType = DB_TYPE_MAP[reportType] || reportType;
  switch (dbType) {
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

// ─── Export Endpoint ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportIdParam = searchParams.get("report_id");
    const zoneIdParam = searchParams.get("zone_id");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const reportTypeParam = searchParams.get("type") || searchParams.get("report_type");

    const supabase = await createClient();

    // Verify session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: requesterProfile, error: requesterProfileError } = await supabase
      .from("people")
      .select("role, zone_id, active")
      .eq("supabase_uid", user.id)
      .maybeSingle();

    if (requesterProfileError || !requesterProfile || requesterProfile.active === false) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const isAdmin = requesterProfile.role === "admin" || requesterProfile.role === "superadmin";

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // Common styling configs
    const borderStyle: any = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };

    const headerFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Slate-900 for section headers
    };

    const sectionTitleFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // Deep Blue for titles
    };

    const textCenter: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "center" };
    const textLeft: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "left" };

    let filename = "Report.xlsx";

    let zoneName = "—";
    let periodLabel = "";
    let header: any = {};
    let courses: any[] = [];
    let org: any[] = [];
    let personal: any[] = [];
    let meetings: any[] = [];
    let extras: any[] = [];
    let comment: any = {};
    let reportType = "মাসিক";

    // ─────────────────────────────────────────────────────────────────────────
    // CASE A: Export Single Zone Report (Or Zone Aggregated Report)
    // ─────────────────────────────────────────────────────────────────────────
    if (reportIdParam || zoneIdParam) {
      if (reportIdParam) {
        const repId = Number(reportIdParam);
        if (!Number.isInteger(repId) || repId <= 0) {
          return new NextResponse("Invalid report_id", { status: 400 });
        }

        // Fetch main report record with zone name
        const { data: report, error: repError } = await supabase
          .from("report")
          .select("*, zone(name)")
          .eq("id", repId)
          .single();

        if (repError || !report) {
          return new NextResponse("Report not found", { status: 404 });
        }

        if (!isAdmin && report.zone_id !== requesterProfile.zone_id) {
          return new NextResponse("Forbidden", { status: 403 });
        }

        zoneName = report.zone?.name || "—";
        reportType = report.report_type;
        periodLabel = report.report_type === "মাসিক" 
          ? `${MONTHS_BN[report.month - 1]} ${report.year}`
          : `${report.report_type} (${report.year})`;
        filename = `${zoneName}_Report_${report.month}_${report.year}.xlsx`;

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

        header = headerRes.data || {};
        courses = coursesRes.data || [];
        org = orgRes.data || [];
        personal = personalRes.data || [];
        meetings = meetingRes.data || [];
        extras = extraRes.data || [];
        comment = commentRes.data || {};
      } else {
        const targetZoneId = Number(zoneIdParam);
        const targetYear = Number(yearParam);
        const targetMonth = Number(monthParam || 1);
        const targetReportType = DB_TYPE_MAP[reportTypeParam || "monthly"] || "মাসিক";

        if (!Number.isInteger(targetZoneId) || targetZoneId <= 0) {
          return new NextResponse("Invalid zone_id", { status: 400 });
        }
        if (!Number.isInteger(targetYear) || targetYear < 2000) {
          return new NextResponse("Invalid year", { status: 400 });
        }
        if (!Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
          return new NextResponse("Invalid month", { status: 400 });
        }
        if (!isAdmin && targetZoneId !== requesterProfile.zone_id) {
          return new NextResponse("Forbidden", { status: 403 });
        }

        // Fetch zone name
        const { data: zoneObj } = await supabase
          .from("zone")
          .select("name")
          .eq("id", targetZoneId)
          .single();
        
        zoneName = zoneObj?.name || "—";
        reportType = targetReportType;

        periodLabel = targetReportType === "মাসিক" 
          ? `${MONTHS_BN[targetMonth - 1]} ${targetYear}`
          : `${targetReportType} (${targetYear})`;
        filename = `${zoneName}_Report_${targetMonth}_${targetYear}.xlsx`;

        const monthsRange = getMonthsForPeriod(targetReportType, targetMonth);
        
        // Query monthly reports for the target zone, year, and months range
        const { data: monthlyReports } = await supabase
          .from("report")
          .select("id")
          .eq("zone_id", targetZoneId)
          .eq("year", targetYear)
          .eq("report_type", "মাসিক")
          .in("month", monthsRange);

        if (monthlyReports && monthlyReports.length > 0) {
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

          header = sumHeaderRows(rawHeader) || {};
          courses = sumRows(rawCourse, [
            "number", "increase", "decrease", "sessions", "students",
            "attendance", "status_board", "status_qayda", "status_ampara",
            "status_quran", "completed", "correctly_learned"
          ]);
          org = sumRows(rawOrg, ["number", "increase", "amount"]);
          personal = sumRows(rawPersonal, [
            "teaching", "learning", "olama_invited", "became_shohojogi",
            "became_sokrio_shohojogi", "became_kormi", "became_rukon"
          ]);
          meetings = sumRows(rawMeeting, [
            "city_count", "city_avg_attendance", "thana_count",
            "thana_avg_attendance", "ward_count", "ward_avg_attendance"
          ]);
          extras = sumRows(rawExtra, ["number"]);
          comment = {
            comment: rawComment.map(c => c.comment).filter(c => c && c.trim() !== "").join("\n")
          };
        }
      }

      // ── Build Document ──
      
      // Page Titles
      worksheet.addRow([`তা'লীমুল কুরআন রিপোর্ট`]);
      worksheet.addRow([`জোন: ${zoneName}`]);
      worksheet.addRow([`সময়কাল: ${periodLabel} (${reportType})`]);
      worksheet.addRow([]); // Spacer

      // 1. Header Section
      const hRow1 = worksheet.addRow(["১. মূল তথ্য", "", ""]);
      hRow1.getCell(1).fill = sectionTitleFill;
      hRow1.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      const headerFields = [
        { key: "responsible_name", label: "দায়িত্বশীলের নাম" },
        { key: "thana", label: "থানা" },
        { key: "ward", label: "ওয়ার্ড" },
        { key: "total_muallima", label: "মোট মুয়াল্লিমা" },
        { key: "muallima_increase", label: "মুয়াল্লিমা বৃদ্ধি" },
        { key: "muallima_decrease", label: "মুয়াল্লিমা হ্রাস" },
        { key: "certified_muallima", label: "সনদপ্রাপ্তা মুয়াল্লিমা" },
        { key: "certified_muallima_taking_classes", label: "সনদপ্রাপ্তা ক্লাস নিচ্ছেন" },
        { key: "trained_muallima", label: "প্রশিক্ষণপ্রাপ্তা মুয়াল্লিমা" },
        { key: "trained_muallima_taking_classes", label: "প্রশিক্ষণপ্রাপ্তা ক্লাস নিচ্ছেন" },
        { key: "total_unit", label: "মোট ইউনিট" },
        { key: "units_with_muallima", label: "মুয়াল্লিমা সহ ইউনিট" },
      ];

      worksheet.addRow(["বিভাগ", "ক্ষেত্র", "মান"]);
      const lastHIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastHIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastHIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      headerFields.forEach((f) => {
        const val = header[f.key] !== undefined && header[f.key] !== null ? header[f.key] : "—";
        const row = worksheet.addRow(["হেডার তথ্য", f.label, val]);
        row.eachCell((c) => { c.border = borderStyle; });
        row.getCell(3).alignment = typeof val === "number" ? textCenter : textLeft;
      });
      worksheet.addRow([]); // Spacer

      // 2. Courses Section
      const cRow = worksheet.addRow(["২. গ্রুপ / কোর্স রিপোর্ট", "", "", "", "", "", "", "", "", "", "", "", ""]);
      cRow.getCell(1).fill = sectionTitleFill;
      cRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow([
        "বিভাগ/ধরন", "সংখ্যা", "বৃদ্ধি", "ঘাটতি", "অধিবেশন", "শিক্ষার্থী", "উপস্থিতি",
        "বোর্ডে", "কায়দায়", "আমপারা", "কুরআন", "শেষ করেছে", "সহীহ শিখেছে"
      ]);
      const lastCIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastCIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastCIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      COURSE_CATEGORIES.forEach((cat) => {
        const item = courses.find((x) => x.category === cat) || {};
        const r = worksheet.addRow([
          cat,
          item.number || 0,
          item.increase || 0,
          item.decrease || 0,
          item.sessions || 0,
          item.students || 0,
          item.attendance || 0,
          item.status_board || 0,
          item.status_qayda || 0,
          item.status_ampara || 0,
          item.status_quran || 0,
          item.completed || 0,
          item.correctly_learned || 0,
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = idx === 1 ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 3. Organizational Section
      const oRow = worksheet.addRow(["৩. দাওয়াত ও সংগঠন", "", "", "", ""]);
      oRow.getCell(1).fill = sectionTitleFill;
      oRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow(["দাওয়াত ও সংগঠন", "সংখ্যা", "বৃদ্ধি", "পরিমাণ/টাকা", "মন্তব্য"]);
      const lastOIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastOIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastOIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      ORG_CATEGORIES.forEach((cat) => {
        const item = org.find((x) => x.category === cat || (cat === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি" && x.category === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)")) || {};
        const r = worksheet.addRow([
          cat,
          item.number || 0,
          item.increase || 0,
          item.amount || 0,
          item.comments || "—"
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = (idx === 1 || idx === 5) ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 4. Personal Section
      const pRow = worksheet.addRow(["৪. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন", "", "", "", "", "", "", ""]);
      pRow.getCell(1).fill = sectionTitleFill;
      pRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow([
        "বিভাগ", "কতজন শিখাচ্ছেন", "কতজনকে শিখাচ্ছেন", "ওলামা আমন্ত্রণ", 
        "সহযোগী হয়েছেন", "সক্রিয় সহযোগী", "কর্মী হয়েছেন", "রুকন হয়েছেন"
      ]);
      const lastPIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastPIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastPIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      PERSONAL_CATEGORIES.forEach((cat) => {
        const item = personal.find((x) => x.category === cat) || {};
        const r = worksheet.addRow([
          cat,
          item.teaching || 0,
          item.learning || 0,
          item.olama_invited || 0,
          item.became_shohojogi || 0,
          item.became_sokrio_shohojogi || 0,
          item.became_kormi || 0,
          item.became_rukon || 0
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = idx === 1 ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 5. Meetings Section
      const mRow = worksheet.addRow(["৫. বৈঠকসমূহ", "", "", "", "", "", "", ""]);
      mRow.getCell(1).fill = sectionTitleFill;
      mRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow([
        "বৈঠকসমূহ", "মহানগরী", "", "থানা", "", "ওয়ার্ড", "", "মন্তব্য"
      ]);
      worksheet.addRow([
        "", "কতটি", "গড় উপস্থিতি", "কতটি", "গড় উপস্থিতি", "কতটি", "গড় উপস্থিতি", ""
      ]);
      const lastMIndex = worksheet.lastRow!.number;
      worksheet.mergeCells(`A${lastMIndex - 1}:A${lastMIndex}`);
      worksheet.mergeCells(`B${lastMIndex - 1}:C${lastMIndex - 1}`);
      worksheet.mergeCells(`D${lastMIndex - 1}:E${lastMIndex - 1}`);
      worksheet.mergeCells(`F${lastMIndex - 1}:G${lastMIndex - 1}`);
      worksheet.mergeCells(`H${lastMIndex - 1}:H${lastMIndex}`);
      [lastMIndex - 1, lastMIndex].forEach((rNum) => {
        worksheet.getRow(rNum).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(rNum).eachCell((cell) => {
          cell.fill = headerFill;
          cell.alignment = textCenter;
          cell.border = borderStyle;
        });
      });

      MEETING_CATEGORIES.forEach((cat) => {
        const item = meetings.find((x) => x.category === cat || (cat === "Committee Orientation" && (x.category === "Committee Orientation / Muallima Orientation" || x.category === "Orientation / Result Publish")) || (cat === "Muallima Orientation" && (x.category === "Committee Orientation / Muallima Orientation" || x.category === "Orientation / Result Publish"))) || {};
        const customTitle = (item as any).meeting_name?.trim() || (item.comments?.trim() && item.comments?.trim() !== "—" ? item.comments?.trim() : "");
        const displayLabel = cat === "অন্যান্য" && customTitle ? customTitle : cat;
        const r = worksheet.addRow([
          displayLabel,
          item.city_count || 0,
          item.city_avg_attendance || 0,
          item.thana_count || 0,
          item.thana_avg_attendance || 0,
          item.ward_count || 0,
          item.ward_avg_attendance || 0,
          item.comments || "—"
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = (idx === 1 || idx === 8) ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 6. Extras Section
      const eRow = worksheet.addRow(["৬. মক্তব ও সফর রিপোর্ট", ""]);
      eRow.getCell(1).fill = sectionTitleFill;
      eRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow(["বিষয়", "সংখ্যা"]);
      const lastEIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastEIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastEIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      EXTRA_CATEGORIES.forEach((cat) => {
        const item = extras.find((x) => x.category === cat) || {};
        const r = worksheet.addRow([cat, item.number || 0]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = idx === 1 ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 7. Comments Section
      if (comment && comment.comment) {
        const comRow = worksheet.addRow(["৭. মন্তব্য", ""]);
        comRow.getCell(1).fill = sectionTitleFill;
        comRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        
        const r = worksheet.addRow(["মন্তব্য", comment.comment]);
        r.getCell(1).border = borderStyle;
        r.getCell(2).border = borderStyle;
        r.getCell(2).alignment = textLeft;
      }
    } 

    // ─────────────────────────────────────────────────────────────────────────
    // CASE B: Export City Aggregated Report
    // ─────────────────────────────────────────────────────────────────────────
    else {
      if (!isAdmin) {
        return new NextResponse("Forbidden", { status: 403 });
      }

      const year = yearParam ? Number(yearParam) : new Date().getFullYear();
      const month = monthParam ? Number(monthParam) : new Date().getMonth() + 1;
      const reportType = reportTypeParam || "মাসিক";

      const months = getMonthsForPeriod(reportType, month);
      const isMultiMonth = months.length > 1;
      const queryReportType = "মাসিক"; // Views always queried monthly and aggregated

      filename = `City_Report_${reportType}_${month}_${year}.xlsx`;

      // Parallel fetch views + overrides
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
      const headerData = isMultiMonth ? sumHeaderRows(rawHeader) : rawHeader[0] || null;

      const rawCourse = courseRes.data || [];
      const coursesData = isMultiMonth ? sumRows(rawCourse, [
        "number", "increase", "decrease", "sessions", "students", "attendance",
        "status_board", "status_qayda", "status_ampara", "status_quran", "completed", "correctly_learned"
      ]) : rawCourse;

      const rawOrg = orgRes.data || [];
      const orgData = isMultiMonth ? sumRows(rawOrg, ["number", "increase", "amount"]) : rawOrg;

      const rawPersonal = personalRes.data || [];
      const personalData = isMultiMonth ? sumRows(rawPersonal, [
        "teaching", "learning", "olama_invited", "became_shohojogi", 
        "became_sokrio_shohojogi", "became_kormi", "became_rukon"
      ]) : rawPersonal;

      const rawMeeting = meetingRes.data || [];
      const meetingData = isMultiMonth ? sumRows(rawMeeting, [
        "city_count", "city_avg_attendance", "thana_count", "thana_avg_attendance",
        "ward_count", "ward_avg_attendance"
      ]) : rawMeeting;

      const rawExtra = extraRes.data || [];
      const extraData = isMultiMonth ? sumRows(rawExtra, ["number"]) : rawExtra;

      const overrides = overrideRes.data || [];
      const overrideMap = new Map<string, string>();
      overrides.forEach((o) => {
        const key = `${o.section}:${o.field}:${o.category || ""}`;
        overrideMap.set(key, o.value);
      });

      // Override resolver
      const getVal = (section: string, field: string, computed: number, category?: string) => {
        const key = `${section}:${field}:${category || ""}`;
        const ov = overrideMap.get(key);
        return ov !== undefined ? Number(ov) : (computed || 0);
      };

      const periodLabel = isMultiMonth
        ? `${MONTHS_BN[months[0] - 1]} - ${MONTHS_BN[months[months.length - 1] - 1]} ${year}`
        : `${MONTHS_BN[month - 1]} ${year}`;

      // ── Build Document ──
      
      // Page Titles
      worksheet.addRow([`তা'লীমুল কুরআন মহানগরী রিপোর্ট (সমষ্টিগত)`]);
      worksheet.addRow([`সময়কাল: ${periodLabel} (${reportType})`]);
      worksheet.addRow([]); // Spacer

      // 1. Header Section
      const hRow1 = worksheet.addRow(["১. মূল তথ্য (সমষ্টিগত)", "", ""]);
      hRow1.getCell(1).fill = sectionTitleFill;
      hRow1.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      const headerFields = [
        { key: "total_muallima", label: "মোট মুয়াল্লিমা" },
        { key: "muallima_increase", label: "মুয়াল্লিমা বৃদ্ধি" },
        { key: "muallima_decrease", label: "মুয়াল্লিমা হ্রাস" },
        { key: "certified_muallima", label: "সনদপ্রাপ্তা মুয়াল্লিমা" },
        { key: "certified_muallima_taking_classes", label: "সনদপ্রাপ্তা ক্লাস নিচ্ছেন" },
        { key: "trained_muallima", label: "প্রশিক্ষণপ্রাপ্তা মুয়াল্লিমা" },
        { key: "trained_muallima_taking_classes", label: "প্রশিক্ষণপ্রাপ্তা ক্লাস নিচ্ছেন" },
        { key: "total_unit", label: "মোট ইউনিট" },
        { key: "units_with_muallima", label: "মুয়াল্লিমা সহ ইউনিট" },
      ];

      worksheet.addRow(["বিভাগ", "ক্ষেত্র", "মান"]);
      const lastHIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastHIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastHIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      if (headerData) {
        headerFields.forEach((f) => {
          const comp = headerData[f.key] || 0;
          const val = getVal("header", f.key, comp);
          const row = worksheet.addRow(["হেডার তথ্য", f.label, val]);
          row.eachCell((c) => { c.border = borderStyle; });
          row.getCell(3).alignment = textCenter;
        });
      }
      worksheet.addRow([]); // Spacer

      // 2. Courses Section
      const cRow = worksheet.addRow(["২. গ্রুপ / কোর্স রিপোর্ট (সমষ্টিগত)", "", "", "", "", "", "", "", "", "", "", "", ""]);
      cRow.getCell(1).fill = sectionTitleFill;
      cRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow([
        "বিভাগ/ধরন", "সংখ্যা", "বৃদ্ধি", "ঘাটতি", "অধিবেশন", "শিক্ষার্থী", "উপস্থিতি",
        "বোর্ডে", "কায়দায়", "আমপারা", "কুরআন", "শেষ করেছে", "সহীহ শিখেছে"
      ]);
      const lastCIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastCIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastCIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      COURSE_CATEGORIES.forEach((cat) => {
        const item = coursesData.find((x) => x.category === cat) || {};
        const r = worksheet.addRow([
          cat,
          getVal("courses", "number", item.number, cat),
          getVal("courses", "increase", item.increase, cat),
          getVal("courses", "decrease", item.decrease, cat),
          getVal("courses", "sessions", item.sessions, cat),
          getVal("courses", "students", item.students, cat),
          getVal("courses", "attendance", item.attendance, cat),
          getVal("courses", "status_board", item.status_board, cat),
          getVal("courses", "status_qayda", item.status_qayda, cat),
          getVal("courses", "status_ampara", item.status_ampara, cat),
          getVal("courses", "status_quran", item.status_quran, cat),
          getVal("courses", "completed", item.completed, cat),
          getVal("courses", "correctly_learned", item.correctly_learned, cat),
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = idx === 1 ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 3. Organizational Section
      const oRow = worksheet.addRow(["৩. দাওয়াত ও সংগঠন (সমষ্টিগত)", "", "", "", ""]);
      oRow.getCell(1).fill = sectionTitleFill;
      oRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow(["দাওয়াত ও সংগঠন", "সংখ্যা", "বৃদ্ধি", "পরিমাণ/টাকা", "মন্তব্য"]);
      const lastOIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastOIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastOIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      ORG_CATEGORIES.forEach((cat) => {
        const item = orgData.find((x) => x.category === cat || (cat === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি" && x.category === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)")) || {};
        const r = worksheet.addRow([
          cat,
          getVal("organizational", "number", item.number, cat),
          getVal("organizational", "increase", item.increase, cat),
          getVal("organizational", "amount", item.amount, cat),
          item.comments || "—"
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = (idx === 1 || idx === 5) ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 4. Personal Section
      const pRow = worksheet.addRow(["৪. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন (সমষ্টিগত)", "", "", "", "", "", "", ""]);
      pRow.getCell(1).fill = sectionTitleFill;
      pRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow([
        "বিভাগ", "কতজন শিখাচ্ছেন", "কতজনকে শিখাচ্ছেন", "ওলামা আমন্ত্রণ", 
        "সহযোগী হয়েছেন", "সক্রিয় সহযোগী", "কর্মী হয়েছেন", "রুকন হয়েছেন"
      ]);
      const lastPIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastPIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastPIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      PERSONAL_CATEGORIES.forEach((cat) => {
        const item = personalData.find((x) => x.category === cat) || {};
        const r = worksheet.addRow([
          cat,
          getVal("personal", "teaching", item.teaching, cat),
          getVal("personal", "learning", item.learning, cat),
          getVal("personal", "olama_invited", item.olama_invited, cat),
          getVal("personal", "became_shohojogi", item.became_shohojogi, cat),
          getVal("personal", "became_sokrio_shohojogi", item.became_sokrio_shohojogi, cat),
          getVal("personal", "became_kormi", item.became_kormi, cat),
          getVal("personal", "became_rukon", item.became_rukon, cat)
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = idx === 1 ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 5. Meetings Section
      const mRow = worksheet.addRow(["৫. বৈঠকসমূহ (সমষ্টিগত)", "", "", "", "", "", "", ""]);
      mRow.getCell(1).fill = sectionTitleFill;
      mRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow([
        "বৈঠকসমূহ", "মহানগরী", "", "থানা", "", "ওয়ার্ড", "", "মন্তব্য"
      ]);
      worksheet.addRow([
        "", "কতটি", "গড় উপস্থিতি", "কতটি", "গড় উপস্থিতি", "কতটি", "গড় উপস্থিতি", ""
      ]);
      const lastMIndex = worksheet.lastRow!.number;
      worksheet.mergeCells(`A${lastMIndex - 1}:A${lastMIndex}`);
      worksheet.mergeCells(`B${lastMIndex - 1}:C${lastMIndex - 1}`);
      worksheet.mergeCells(`D${lastMIndex - 1}:E${lastMIndex - 1}`);
      worksheet.mergeCells(`F${lastMIndex - 1}:G${lastMIndex - 1}`);
      worksheet.mergeCells(`H${lastMIndex - 1}:H${lastMIndex}`);
      [lastMIndex - 1, lastMIndex].forEach((rNum) => {
        worksheet.getRow(rNum).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(rNum).eachCell((cell) => {
          cell.fill = headerFill;
          cell.alignment = textCenter;
          cell.border = borderStyle;
        });
      });

      MEETING_CATEGORIES.forEach((cat) => {
        const item = meetingData.find((x) => x.category === cat || (cat === "Committee Orientation" && (x.category === "Committee Orientation / Muallima Orientation" || x.category === "Orientation / Result Publish")) || (cat === "Muallima Orientation" && (x.category === "Committee Orientation / Muallima Orientation" || x.category === "Orientation / Result Publish"))) || {};
        const customTitle = (item as any).meeting_name?.trim() || (item.comments?.trim() && item.comments?.trim() !== "—" ? item.comments?.trim() : "");
        const displayLabel = cat === "অন্যান্য" && customTitle ? customTitle : cat;
        const r = worksheet.addRow([
          displayLabel,
          getVal("meetings", "city_count", item.city_count, cat),
          getVal("meetings", "city_avg_attendance", item.city_avg_attendance, cat),
          getVal("meetings", "thana_count", item.thana_count, cat),
          getVal("meetings", "thana_avg_attendance", item.thana_avg_attendance, cat),
          getVal("meetings", "ward_count", item.ward_count, cat),
          getVal("meetings", "ward_avg_attendance", item.ward_avg_attendance, cat),
          item.comments || "—"
        ]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = (idx === 1 || idx === 8) ? textLeft : textCenter;
        });
      });
      worksheet.addRow([]); // Spacer

      // 6. Extras Section
      const eRow = worksheet.addRow(["৬. মক্তব ও সফর রিপোর্ট (সমষ্টিগত)", ""]);
      eRow.getCell(1).fill = sectionTitleFill;
      eRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.addRow(["বিষয়", "সংখ্যা"]);
      const lastEIndex = worksheet.lastRow!.number;
      worksheet.getRow(lastEIndex).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(lastEIndex).eachCell((cell) => {
        cell.fill = headerFill;
        cell.alignment = textCenter;
        cell.border = borderStyle;
      });

      EXTRA_CATEGORIES.forEach((cat) => {
        const item = extraData.find((x) => x.category === cat) || {};
        const r = worksheet.addRow([cat, getVal("extras", "number", item.number, cat)]);
        r.eachCell((c, idx) => {
          c.border = borderStyle;
          c.alignment = idx === 1 ? textLeft : textCenter;
        });
      });
    }

    // ── Font & Width Adjustments ──
    
    // Set general font on all cells except formatted titles
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.font) {
          cell.font = { name: "Arial", size: 9 };
        }
      });
    });

    // Auto-adjust column widths
    worksheet.columns.forEach((column, index) => {
      let maxLength = 0;
      column.eachCell!((cell) => {
        try {
          const cellLength = cell.value ? String(cell.value).length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        } catch {}
      });
      // Give padding
      column.width = index === 0 ? 40 : Math.min(Math.max(maxLength + 3, 12), 40);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("Excel generation error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
