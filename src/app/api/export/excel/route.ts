import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";
import {
  COURSE_CATEGORIES,
  ORG_CATEGORIES,
  PERSONAL_CATEGORIES,
  MEETING_CATEGORIES,
  EXTRA_CATEGORIES,
} from "@/lib/report-utils";
import { loadReportDataBundle } from "@/lib/report-data-loader";

// ─── Export Endpoint ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportIdParam = searchParams.get("report_id");
    const zoneIdParam = searchParams.get("zone_id");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const reportTypeParam = searchParams.get("type") || searchParams.get("report_type");
    const endMonthParam = searchParams.get("endMonth") || searchParams.get("end_month");

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

    if (requesterProfileError || !requesterProfile || requesterProfile.active !== true) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { data: bundle, error } = await loadReportDataBundle(
      supabase,
      {
        reportId: reportIdParam,
        zoneId: zoneIdParam,
        year: yearParam,
        month: monthParam,
        reportType: reportTypeParam,
        endMonth: endMonthParam,
      },
      requesterProfile
    );

    if (error || !bundle) {
      return new NextResponse(error?.message || "Data loading failed", { status: error?.status || 400 });
    }

    const {
      zoneName,
      reportType,
      periodLabel,
      filenameBase,
      isCityAgg,
      header,
      courses,
      org,
      personal,
      meetings,
      extras,
      comment,
    } = bundle;

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

    const suffix = isCityAgg ? " (সমষ্টিগত)" : "";

    // Page Titles
    if (!isCityAgg) {
      worksheet.addRow([`তা'লীমুল কুরআন রিপোর্ট`]);
      worksheet.addRow([`জোন: ${zoneName}`]);
      worksheet.addRow([`সময়কাল: ${periodLabel} (${reportType})`]);
    } else {
      worksheet.addRow([`তা'লীমুল কুরআন মহানগরী রিপোর্ট (সমষ্টিগত)`]);
      worksheet.addRow([`সময়কাল: ${periodLabel} (${reportType})`]);
    }
    worksheet.addRow([]); // Spacer

    // 1. Header Section
    const hRow1 = worksheet.addRow([`১. মূল তথ্য${suffix}`, "", ""]);
    hRow1.getCell(1).fill = sectionTitleFill;
    hRow1.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

    const headerFields = isCityAgg
      ? [
          { key: "total_muallima", label: "মোট মুয়াল্লিমা" },
          { key: "muallima_increase", label: "মুয়াল্লিমা বৃদ্ধি" },
          { key: "muallima_decrease", label: "মুয়াল্লিমা হ্রাস" },
          { key: "certified_muallima", label: "সনদপ্রাপ্তা মুয়াল্লিমা" },
          { key: "certified_muallima_taking_classes", label: "সনদপ্রাপ্তা ক্লাস নিচ্ছেন" },
          { key: "trained_muallima", label: "প্রশিক্ষণপ্রাপ্তা মুয়াল্লিমা" },
          { key: "trained_muallima_taking_classes", label: "প্রশিক্ষণপ্রাপ্তা ক্লাস নিচ্ছেন" },
          { key: "total_unit", label: "মোট ইউনিট" },
          { key: "units_with_muallima", label: "মুয়াল্লিমা সহ ইউনিট" },
        ]
      : [
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

    if (header) {
      headerFields.forEach((f) => {
        const val = header[f.key] !== undefined && header[f.key] !== null ? header[f.key] : (isCityAgg ? 0 : "—");
        const row = worksheet.addRow(["হেডার তথ্য", f.label, val]);
        row.eachCell((c) => { c.border = borderStyle; });
        row.getCell(3).alignment = typeof val === "number" ? textCenter : textLeft;
      });
    }
    worksheet.addRow([]); // Spacer

    // 2. Courses Section
    const cRow = worksheet.addRow([`২. গ্রুপ / কোর্স রিপোর্ট${suffix}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
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
      const item = courses.find((x: any) => x.category === cat) || {};
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
    const oRow = worksheet.addRow([`৩. দাওয়াত ও সংগঠন${suffix}`, "", "", "", ""]);
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
      const item = org.find((x: any) => x.category === cat) || {};
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
    const pRow = worksheet.addRow([`৪. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন${suffix}`, "", "", "", "", "", "", ""]);
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
      const item = personal.find((x: any) => x.category === cat) || {};
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
    const mRow = worksheet.addRow([`৫. বৈঠকসমূহ${suffix}`, "", "", "", "", "", "", ""]);
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
      const item = meetings.find((x: any) => x.category === cat) || {};
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
    const eRow = worksheet.addRow([`৬. মক্তব ও সফর রিপোর্ট${suffix}`, ""]);
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
      const item = extras.find((x: any) => x.category === cat) || {};
      const r = worksheet.addRow([cat, item.number || 0]);
      r.eachCell((c, idx) => {
        c.border = borderStyle;
        c.alignment = idx === 1 ? textLeft : textCenter;
      });
    });

    // 7. Comments Section
    if (comment && comment.comment) {
      worksheet.addRow([]); // Spacer
      const title = isCityAgg ? "৭. মন্তব্য ও বিশেষ পর্যালোচনা" : "৭. মন্তব্য";
      const comRow = worksheet.addRow([title, ""]);
      comRow.getCell(1).fill = sectionTitleFill;
      comRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      
      const r = worksheet.addRow(["মন্তব্য", comment.comment]);
      r.getCell(1).border = borderStyle;
      r.getCell(2).border = borderStyle;
      r.getCell(2).alignment = textLeft;
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

    const filename = `${filenameBase}.xlsx`;
    const encodedFilename = encodeURIComponent(filename).replace(
      /['()!*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "").trim() || "report.xlsx";

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("Excel generation error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
