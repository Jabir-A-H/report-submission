import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getDhakaDate } from "@/lib/date-utils";
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

import path from "path";
import fs from "fs";

// ─── Font Registration ────────────────────────────────────────────────────────

Font.register({
  family: "Kalpurush",
  src: path.join(process.cwd(), "public/fonts/kalpurush.ttf").replace(/\\/g, "/"),
});

import {
  BENGALI_DIGITS,
  toBn,
  MONTHS_BN,
  COURSE_CATEGORIES,
  ORG_CATEGORIES,
  PERSONAL_CATEGORIES,
  PERSONAL_METRICS_ROWS,
  MEETING_CATEGORIES,
  EXTRA_CATEGORIES,
  DB_TYPE_MAP,
  getMonthsForPeriod,
  sumRows,
  sumHeaderRows,
} from "@/lib/report-utils";
import { loadReportDataBundle } from "@/lib/report-data-loader";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Kalpurush",
    backgroundColor: "#ffffff",
    fontSize: 8.5,
    lineHeight: 1.3,
  },
  header: {
    marginBottom: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#334155",
    marginTop: 2,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  infoBar: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
    justifyContent: "space-between",
  },
  infoBarItem: {
    flexDirection: "row",
  },
  infoBarLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  infoBarValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
    marginLeft: 3,
  },
  statCardsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statCard: {
    width: "24%",
    backgroundColor: "#f8fafc",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 5,
    justifyContent: "space-between",
  },
  statCardTop: {
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#64748b",
  },
  statCardMainValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 1,
  },
  statCardBottom: {
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 3,
  },
  statCardSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statCardSubLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#64748b",
  },
  statCardSubValue: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    alignItems: "center",
  },
  tableCell: {
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    textAlign: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#cbd5e1",
  },
  textLeft: {
    textAlign: "left",
    paddingLeft: 4,
  },
  // Color-coded table headers
  headerPurpleMain: {
    backgroundColor: "#faf5ff",
    color: "#6b21a8",
    fontWeight: "bold",
  },
  headerPurpleSub: {
    backgroundColor: "#f3e8ff",
    color: "#581c87",
    fontWeight: "bold",
  },
  headerBlueMain: {
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    fontWeight: "bold",
  },
  headerPinkMain: {
    backgroundColor: "#fdf2f8",
    color: "#9d174d",
    fontWeight: "bold",
  },
  headerCyanMain: {
    backgroundColor: "#ecfeff",
    color: "#155e75",
    fontWeight: "bold",
  },
  headerCyanSub: {
    backgroundColor: "#cffafe",
    color: "#164e63",
    fontWeight: "bold",
  },
  // Text colors for increase/decrease
  textGreen: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  textRed: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  // Inline Maktab & Safar Boxes
  inlineBlock: {
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 4,
    marginBottom: 6,
    backgroundColor: "#ffffff",
  },
  inlineBlockTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 3,
  },
  inlineGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inlineItem: {
    width: "24%",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    borderRadius: 2,
    paddingVertical: 3,
    paddingHorizontal: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inlineItemLabel: {
    fontSize: 7.5,
    color: "#64748b",
    fontWeight: "bold",
  },
  inlineItemValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
  },
  // Comments and Signature Block
  commentsContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 5,
    minHeight: 32,
    marginBottom: 10,
  },
  commentsLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  commentsText: {
    fontSize: 8,
    color: "#334155",
  },
  signatureContainer: {
    marginTop: 12,
    alignItems: "flex-end",
    paddingRight: 15,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    marginBottom: 3,
  },
  signatureText: {
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "center",
    width: 120,
    color: "#0f172a",
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
}: ReportPDFProps) => {
  // Helpers to calculate totals for Course Table
  const totalCourses = courses.reduce((acc, curr) => ({
    number: acc.number + (curr.number || 0),
    increase: acc.increase + (curr.increase || 0),
    decrease: acc.decrease + (curr.decrease || 0),
    sessions: acc.sessions + (curr.sessions || 0),
    students: acc.students + (curr.students || 0),
    attendance: acc.attendance + (curr.attendance || 0),
    status_board: acc.status_board + (curr.status_board || 0),
    status_qayda: acc.status_qayda + (curr.status_qayda || 0),
    status_ampara: acc.status_ampara + (curr.status_ampara || 0),
    status_quran: acc.status_quran + (curr.status_quran || 0),
    completed: acc.completed + (curr.completed || 0),
    correctly_learned: acc.correctly_learned + (curr.correctly_learned || 0),
  }), {
    number: 0, increase: 0, decrease: 0, sessions: 0, students: 0, attendance: 0,
    status_board: 0, status_qayda: 0, status_ampara: 0, status_quran: 0, completed: 0, correctly_learned: 0
  });

  return (
    <Document>
      {/* ── Page 1: Header, Summary Cards, Course Table & Maktab/Safar Blocks ── */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>বিসমিল্লাহির রহমানীর রহীম</Text>
          <Text style={styles.title}>তা'লীমুল কুরআন বিভাগ</Text>
          <Text style={styles.subtitle}>
            {isCityAgg ? "ডি সি এস রিপোর্ট" : `${zoneName} জোন - ${reportType} রিপোর্ট`} - {periodLabel}
          </Text>
        </View>

        {/* 1. Summary Information & Statistics Cards */}
        {header && (
          <View style={styles.section}>
            {!isCityAgg && (
              <View style={styles.infoBar}>
                <View style={styles.infoBarItem}>
                  <Text style={styles.infoBarLabel}>দায়িত্বশীলের নাম:</Text>
                  <Text style={styles.infoBarValue}>{header.responsible_name || "—"}</Text>
                </View>
                <View style={styles.infoBarItem}>
                  <Text style={styles.infoBarLabel}>থানা:</Text>
                  <Text style={styles.infoBarValue}>{header.thana || "—"}</Text>
                </View>
                <View style={styles.infoBarItem}>
                  <Text style={styles.infoBarLabel}>ওয়ার্ড:</Text>
                  <Text style={styles.infoBarValue}>{header.ward || "—"}</Text>
                </View>
              </View>
            )}

            <View style={styles.statCardsGrid}>
              {/* Card 1: Total Muallima + Increase/Decrease */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <Text style={styles.statCardLabel}>মোট মুয়াল্লিমা:</Text>
                  <Text style={styles.statCardMainValue}>{toBn(header.total_muallima)}</Text>
                </View>
                <View style={styles.statCardBottom}>
                  <View style={styles.statCardSubRow}>
                    <Text style={styles.statCardSubLabel}>বৃদ্ধি / ঘাটতি:</Text>
                    <Text style={styles.statCardSubValue}>
                      <Text style={styles.textGreen}>+{toBn(header.muallima_increase)}</Text>
                      {" / "}
                      <Text style={styles.textRed}>-{toBn(header.muallima_decrease)}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Certified Muallima + Certified Taking Classes */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <Text style={styles.statCardLabel}>সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা:</Text>
                  <Text style={styles.statCardMainValue}>{toBn(header.certified_muallima)}</Text>
                </View>
                <View style={styles.statCardBottom}>
                  <View style={styles.statCardSubRow}>
                    <Text style={styles.statCardSubLabel}>ক্লাস নিচ্ছেন:</Text>
                    <Text style={styles.statCardSubValue}>{toBn(header.certified_muallima_taking_classes)}</Text>
                  </View>
                </View>
              </View>

              {/* Card 3: Trained Muallima + Trained Taking Classes */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <Text style={styles.statCardLabel}>প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা:</Text>
                  <Text style={styles.statCardMainValue}>{toBn(header.trained_muallima)}</Text>
                </View>
                <View style={styles.statCardBottom}>
                  <View style={styles.statCardSubRow}>
                    <Text style={styles.statCardSubLabel}>ক্লাস নিচ্ছেন:</Text>
                    <Text style={styles.statCardSubValue}>{toBn(header.trained_muallima_taking_classes)}</Text>
                  </View>
                </View>
              </View>

              {/* Card 4: Total Unit + Units With Muallima */}
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <Text style={styles.statCardLabel}>ইউনিট সংখ্যা:</Text>
                  <Text style={styles.statCardMainValue}>{toBn(header.total_unit)}</Text>
                </View>
                <View style={styles.statCardBottom}>
                  <View style={styles.statCardSubRow}>
                    <Text style={styles.statCardSubLabel}>মুয়াল্লিমা সহ ইউনিট:</Text>
                    <Text style={styles.statCardSubValue}>{toBn(header.units_with_muallima)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 2. Courses Table (১. গ্রুপ / কোর্স রিপোর্ট) */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header Level 1 */}
            <View style={[styles.tableRow, styles.headerPurpleMain]}>
              <Text style={[styles.tableCell, { width: "16%" }]}>বিভাগ/ধরন</Text>
              <Text style={[styles.tableCell, { width: "14%" }]}>গ্রুপ / কোর্স</Text>
              <Text style={[styles.tableCell, { width: "6%" }]}>অধিবেশন</Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>শিক্ষার্থী</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>উপস্থিতি</Text>
              <Text style={[styles.tableCell, { width: "24%" }]}>শিক্ষার্থী অবস্থান</Text>
              <Text style={[styles.tableCell, { width: "11%" }]}>কতজন নিয়ে সমাপ্ত</Text>
              <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>সহীহ শিখেছেন কতজন</Text>
            </View>
            {/* Header Level 2 */}
            <View style={[styles.tableRow, styles.headerPurpleSub]}>
              <Text style={[styles.tableCell, { width: "16%" }]}></Text>
              {/* গ্রুপ / কোর্স */}
              <View style={[{ width: "14%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0.5 }]}>সংখ্যা</Text>
                <Text style={[styles.tableCell, { width: "34%", borderRightWidth: 0.5 }]}>বৃদ্ধি</Text>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0 }]}>ঘাটতি</Text>
              </View>
              <Text style={[styles.tableCell, { width: "6%" }]}>সংখ্যা</Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>সংখ্যা</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>সংখ্যা</Text>
              {/* শিক্ষার্থী অবস্থান */}
              <View style={[{ width: "24%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>বোর্ড</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>কায়দা</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>আমপারা</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>কুরআন</Text>
              </View>
              <Text style={[styles.tableCell, { width: "11%" }]}></Text>
              <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}></Text>
            </View>
            
            {/* Rows */}
            {COURSE_CATEGORIES.map((cat) => {
              const item = courses.find((x) => x.category === cat) || {};
              return (
                <View key={cat} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "16%", fontWeight: "bold" }]}>{cat}</Text>
                  {/* Group/Course sub */}
                  <View style={[{ width: "14%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                    <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0.5 }]}>{toBn(item.number)}</Text>
                    <Text style={[styles.tableCell, styles.textGreen, { width: "34%", borderRightWidth: 0.5 }]}>
                      {(item.increase || 0) > 0 ? `+${toBn(item.increase)}` : toBn(item.increase)}
                    </Text>
                    <Text style={[styles.tableCell, styles.textRed, { width: "33%", borderRightWidth: 0 }]}>
                      {(item.decrease || 0) > 0 ? `-${toBn(item.decrease)}` : toBn(item.decrease)}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, { width: "6%" }]}>{toBn(item.sessions)}</Text>
                  <Text style={[styles.tableCell, { width: "8%" }]}>{toBn(item.students)}</Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>{toBn(item.attendance)}</Text>
                  {/* Status sub */}
                  <View style={[{ width: "24%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{toBn(item.status_board)}</Text>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{toBn(item.status_qayda)}</Text>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{toBn(item.status_ampara)}</Text>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>{toBn(item.status_quran)}</Text>
                  </View>
                  <Text style={[styles.tableCell, { width: "11%" }]}>{toBn(item.completed)}</Text>
                  <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>{toBn(item.correctly_learned)}</Text>
                </View>
              );
            })}
            
            {/* Total Row */}
            <View style={[styles.tableRow, { backgroundColor: "#f8fafc", fontWeight: "bold" }]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "16%" }]}>মোট সংখ্যা</Text>
              <View style={[{ width: "14%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0.5 }]}>{toBn(totalCourses.number)}</Text>
                <Text style={[styles.tableCell, styles.textGreen, { width: "34%", borderRightWidth: 0.5 }]}>
                  {totalCourses.increase > 0 ? `+${toBn(totalCourses.increase)}` : toBn(totalCourses.increase)}
                </Text>
                <Text style={[styles.tableCell, styles.textRed, { width: "33%", borderRightWidth: 0 }]}>
                  {totalCourses.decrease > 0 ? `-${toBn(totalCourses.decrease)}` : toBn(totalCourses.decrease)}
                </Text>
              </View>
              <Text style={[styles.tableCell, { width: "6%" }]}>{toBn(totalCourses.sessions)}</Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>{toBn(totalCourses.students)}</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>{toBn(totalCourses.attendance)}</Text>
              <View style={[{ width: "24%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{toBn(totalCourses.status_board)}</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{toBn(totalCourses.status_qayda)}</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{toBn(totalCourses.status_ampara)}</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>{toBn(totalCourses.status_quran)}</Text>
              </View>
              <Text style={[styles.tableCell, { width: "11%" }]}>{toBn(totalCourses.completed)}</Text>
              <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>{toBn(totalCourses.correctly_learned)}</Text>
            </View>
          </View>
        </View>

        {/* 3. Personal Table (৩. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন - Exact 7 Rows) - Moved to Page 1 */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.headerPinkMain]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "36%" }]}>ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</Text>
              {PERSONAL_CATEGORIES.map((cat) => (
                <Text key={cat} style={[styles.tableCell, { width: "16%" }]}>
                  {cat === "সক্রিয় সহযোগী" ? "সক্রিয় সহযোগী হয়েছেন" : cat}
                </Text>
              ))}
              <Text style={[styles.tableCell, { width: "16%", borderRightWidth: 0 }]}>মোট</Text>
            </View>
            {/* Exactly 7 Rows matching Report Page (`PERSONAL_METRICS_ROWS`) */}
            {PERSONAL_METRICS_ROWS.map((metric) => {
              const totalForMetric = PERSONAL_CATEGORIES.reduce(
                (sum, cat) => sum + Number(((personal.find((p) => p.category === cat) || {}) as any)[metric.key] || 0),
                0
              );
              return (
                <View key={metric.key} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "36%", fontWeight: "bold" }]}>{metric.label}</Text>
                  {PERSONAL_CATEGORIES.map((cat) => {
                    const val = ((personal.find((p) => p.category === cat) || {}) as any)[metric.key] || 0;
                    return (
                      <Text key={cat} style={[styles.tableCell, { width: "16%" }]}>{toBn(val)}</Text>
                    );
                  })}
                  <Text style={[styles.tableCell, { width: "16%", borderRightWidth: 0, fontWeight: "bold" }]}>{toBn(totalForMetric)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Page>

      {/* ── Page 2: Organizational, Maktab/Safar, Meetings & Comments/Signature ── */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* 2. Organizational Table (২. দাওয়াত ও সংগঠন) */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.headerBlueMain]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "36%" }]}>দাওয়াত ও সংগঠন</Text>
              <Text style={[styles.tableCell, { width: "16%" }]}>সংখ্যা</Text>
              <Text style={[styles.tableCell, { width: "16%" }]}>বৃদ্ধি</Text>
              <Text style={[styles.tableCell, { width: "16%" }]}>পরিমাণ / টাকা</Text>
              <Text style={[styles.tableCell, styles.textLeft, { width: "16%", borderRightWidth: 0 }]}>মন্তব্য</Text>
            </View>
            {/* Rows */}
            {ORG_CATEGORIES.map((cat) => {
              const item = org.find((x) => x.category === cat) || {};
              return (
                <View key={cat} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "36%", fontWeight: "bold" }]}>{cat}</Text>
                  <Text style={[styles.tableCell, { width: "16%" }]}>{toBn(item.number)}</Text>
                  <Text style={[styles.tableCell, styles.textGreen, { width: "16%" }]}>
                    {(item.increase || 0) > 0 ? `+${toBn(item.increase)}` : toBn(item.increase)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "16%" }]}>{toBn(item.amount)}</Text>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "16%", borderRightWidth: 0, fontSize: 7 }]}>
                    {item.comments || "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. Meetings Table (৪. বৈঠকসমূহ - Double-Layered Header) */}
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.headerCyanMain]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "28%" }]}>বৈঠকসমূহ</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>মহানগরী</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>থানা</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>ওয়ার্ড</Text>
              <Text style={[styles.tableCell, styles.textLeft, { width: "12%", borderRightWidth: 0 }]}>মন্তব্য</Text>
            </View>
            <View style={[styles.tableRow, styles.headerCyanSub, { fontSize: 7 }]}>
              <Text style={[styles.tableCell, { width: "28%" }]}></Text>
              <View style={[{ width: "20%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0.5 }]}>কতটি</Text>
                <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0 }]}>গড় উপস্থিতি</Text>
              </View>
              <View style={[{ width: "20%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0.5 }]}>কতটি</Text>
                <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0 }]}>গড় উপস্থিতি</Text>
              </View>
              <View style={[{ width: "20%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0.5 }]}>কতটি</Text>
                <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0 }]}>গড় উপস্থিতি</Text>
              </View>
              <Text style={[styles.tableCell, { width: "12%", borderRightWidth: 0 }]}></Text>
            </View>
            {/* Rows */}
            {MEETING_CATEGORIES.map((cat) => {
              const item = meetings.find((x) => x.category === cat) || {};
              const customTitle = (item as any).meeting_name?.trim() || (item.comments?.trim() && item.comments?.trim() !== "—" ? item.comments?.trim() : "");
              const displayLabel = cat === "অন্যান্য" && customTitle ? customTitle : cat;
              return (
                <View key={cat} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "28%", fontWeight: "bold" }]}>{displayLabel}</Text>
                  <View style={[{ width: "20%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                    <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0.5 }]}>{toBn(item.city_count)}</Text>
                    <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0 }]}>{toBn(item.city_avg_attendance)}</Text>
                  </View>
                  <View style={[{ width: "20%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                    <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0.5 }]}>{toBn(item.thana_count)}</Text>
                    <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0 }]}>{toBn(item.thana_avg_attendance)}</Text>
                  </View>
                  <View style={[{ width: "20%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#cbd5e1" }]}>
                    <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0.5 }]}>{toBn(item.ward_count)}</Text>
                    <Text style={[styles.tableCell, { width: "50%", borderRightWidth: 0 }]}>{toBn(item.ward_avg_attendance)}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "12%", borderRightWidth: 0, fontSize: 7 }]}>
                    {item.comments || "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Inline Maktab Stats Block (Page 2 Below Meetings Table) */}
        <View style={styles.inlineBlock}>
          <Text style={styles.inlineBlockTitle}>মক্তব রিপোর্ট:</Text>
          <View style={styles.inlineGrid}>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>মক্তব সংখ্যা:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "মক্তব সংখ্যা")?.number || 0)} টি</Text>
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>মক্তব বৃদ্ধি:</Text>
              <Text style={[styles.inlineItemValue, styles.textGreen]}>+{toBn(extras.find(e => e.category === "মক্তব বৃদ্ধি")?.number || 0)} টি</Text>
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>মহানগরী পরিচালিত:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "মহানগরী পরিচালিত")?.number || 0)} টি</Text>
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>স্থানীয়ভাবে পরিচালিত:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "স্থানীয়ভাবে পরিচালিত")?.number || 0)} টি</Text>
            </View>
          </View>
        </View>

        {/* Inline Safar Stats Block (Page 2 Below Meetings Table) */}
        <View style={styles.inlineBlock}>
          <Text style={styles.inlineBlockTitle}>সফর রিপোর্ট:</Text>
          <View style={styles.inlineGrid}>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>মহানগরীর সফর:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "মহানগরীর সফর")?.number || 0)} টি</Text>
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>থানা কমিটির সফর:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "থানা কমিটির সফর")?.number || 0)} টি</Text>
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>থানা প্রতিনিধির সফর:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "থানা প্রতিনিধির সফর")?.number || 0)} টি</Text>
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.inlineItemLabel}>ওয়ার্ড প্রতিনিধির সফর:</Text>
              <Text style={styles.inlineItemValue}>{toBn(extras.find(e => e.category === "ওয়ার্ড প্রতিনিধির সফর")?.number || 0)} টি</Text>
            </View>
          </View>
        </View>

        {/* 6. Comments & Signature Section */}
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsLabel}>মন্তব্য :</Text>
          <Text style={styles.commentsText}>
            {comment?.comment?.trim() ? comment.comment : "কোনো মন্তব্য যোগ করা হয়নি।"}
          </Text>
        </View>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.signatureText}>{header?.responsible_name || "স্বাক্ষর"}</Text>
        </View>
      </Page>
    </Document>
  );
};



// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportIdParam = searchParams.get("report_id");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const reportTypeParam = searchParams.get("type") || searchParams.get("report_type");
    const zoneIdParam = searchParams.get("zone_id");
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

    // ── Generate PDF Buffer ──
    const pdfBuffer = await renderToBuffer(
      <ReportPDFDocument
        reportType={bundle.reportType}
        periodLabel={bundle.periodLabel}
        zoneName={bundle.zoneName}
        header={bundle.header}
        courses={bundle.courses}
        org={bundle.org}
        personal={bundle.personal}
        meetings={bundle.meetings}
        extras={bundle.extras}
        comment={bundle.comment}
        isCityAgg={bundle.isCityAgg}
      />
    );

    const filename = String(bundle.filenameBase) + ".pdf";
    const encodedFilename = encodeURIComponent(filename).replace(
      /['()!*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
    );
    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "").trim() || "report.pdf";

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Disposition": "attachment; filename=\"" + asciiFallback + "\"; filename*=UTF-8''" + encodedFilename,
        "Content-Type": "application/pdf",
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
