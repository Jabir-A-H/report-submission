import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';
  const month = searchParams.get('month') || '3';

  const supabase = await createClient();

  // Fetch detailed city report data
  const { data: courses } = await supabase
    .from('view_city_course_final')
    .select('*')
    .eq('year', year)
    .eq('month', month);

  // Build Excel workbook using exceljs (no known vulnerabilities)
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`City Report ${month}/${year}`);

  if (courses && courses.length > 0) {
    sheet.columns = Object.keys(courses[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));
    courses.forEach((row) => sheet.addRow(row));
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Disposition': `attachment; filename="City_Report_${month}_${year}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
}
