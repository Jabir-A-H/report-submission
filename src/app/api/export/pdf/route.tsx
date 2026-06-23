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

import path from "path";
import fs from "fs";

// ─── Font Registration ────────────────────────────────────────────────────────

Font.register({
  family: "Kalpurush",
  src: path.join(process.cwd(), "public/fonts/kalpurush.ttf").replace(/\\/g, "/"),
});

// ─── Constants & Styling ──────────────────────────────────────────────────────

const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

const COURSE_CATEGORIES = [
  "বিশিষ্টদের", "সাধারণদের", "কর্মীদের", "ইউনিট সভানেত্রী",
  "অগ্রসরদের", "রুকনদের অনুশীলনী ক্লাস", "শিশু- তা'লিমুল কুরআন", "নিরক্ষর- তা'লিমুস সলাত"
];

const ORG_CATEGORIES = [
  "দাওয়াত দান", "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন", "সহযোগী হয়েছে",
  "সম্মতি দিয়েছেন", "সক্রিয় সহযোগী", "কর্মী", "রুকন", "দাওয়াতী ইউনিট",
  "ইউনিট", "সূধী", "এককালীন", "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
  "বই বিলি", "বই বিক্রি"
];

const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];

const MEETING_CATEGORIES = [
  "কমিটি বৈঠক হয়েছে", "মুয়াল্লিমাদের নিয়ে বৈঠক", "Orientation / Result Publish"
];

const EXTRA_CATEGORIES = [
  "মক্তব সংখ্যা", "মক্তব বৃদ্ধি", "মহানগরী পরিচালিত", "স্থানীয়ভাবে পরিচালিত",
  "মহানগরীর সফর", "থানা কমিটির সফর", "থানা প্রতিনিধির সফর", "ওয়ার্ড প্রতিনিধির সফর"
];

const styles = StyleSheet.create({
  page: {
    padding: 25,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    color: "#475569",
    marginTop: 2,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#dbeafe",
    padding: 4,
    marginBottom: 4,
    borderRadius: 2,
    color: "#1e3a8a",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: "row",
    width: "25%",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    padding: 3,
  },
  infoLabel: {
    width: "60%",
    fontSize: 8,
    color: "#475569",
  },
  infoValue: {
    width: "40%",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "right",
    color: "#0f172a",
  },
  statBlockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statBlock: {
    width: "32%",
    backgroundColor: "#ffedd5",
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#fdba74",
    borderRadius: 2,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
  },
  statValue: {
    fontSize: 8,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#94a3b8",
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#94a3b8",
  },
  tableHeaderPrimary: {
    backgroundColor: "#dbeafe",
    fontWeight: "bold",
  },
  tableHeaderSecondary: {
    backgroundColor: "#fef08a",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 3,
    textAlign: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#94a3b8",
  },
  textLeft: {
    textAlign: "left",
  },
  signatureContainer: {
    marginTop: 20,
    alignItems: "flex-end",
    paddingRight: 20,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 9,
    textAlign: "center",
    width: 120,
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
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>বিসমিল্লাহির রহমানীর রহীম</Text>
          <Text style={styles.title}>তা'লীমুল কুরআন বিভাগ</Text>
          <Text style={styles.subtitle}>
            {isCityAgg ? "ডি সি এস" : `জোন: ${zoneName}`}
          </Text>
        </View>

        {/* 1. Header Info & Stats Grid */}
        {header && (
          <View style={styles.section}>
            <View style={styles.infoGrid}>
              <View style={[styles.infoItem, { width: "25%" }]}><Text style={styles.infoLabel}>মাস / সময়কাল :</Text><Text style={styles.infoValue}>{periodLabel}</Text></View>
              <View style={[styles.infoItem, { width: "25%" }]}><Text style={styles.infoLabel}>ধরণ :</Text><Text style={styles.infoValue}>{reportType}</Text></View>
              {!isCityAgg ? (
                <>
                  <View style={[styles.infoItem, { width: "25%" }]}><Text style={styles.infoLabel}>থানা :</Text><Text style={styles.infoValue}>{header.thana || "—"}</Text></View>
                  <View style={[styles.infoItem, { width: "25%" }]}><Text style={styles.infoLabel}>ওয়ার্ড :</Text><Text style={styles.infoValue}>{header.ward || "—"}</Text></View>
                  <View style={[styles.infoItem, { width: "50%" }]}><Text style={styles.infoLabel}>দায়িত্বশীলের নাম :</Text><Text style={styles.infoValue}>{header.responsible_name || "—"}</Text></View>
                </>
              ) : (
                <View style={[styles.infoItem, { width: "50%" }]}><Text style={styles.infoLabel}></Text><Text style={styles.infoValue}></Text></View>
              )}
              <View style={[styles.infoItem, { width: "25%" }]}><Text style={styles.infoLabel}>মোট মুয়াল্লিমা :</Text><Text style={styles.infoValue}>{header.total_muallima ?? 0}</Text></View>
              <View style={[styles.infoItem, { width: "25%" }]}><Text style={styles.infoLabel}>বৃদ্ধি :</Text><Text style={styles.infoValue}>{header.muallima_increase ?? 0}</Text></View>
            </View>

            {/* Peach Blocks */}
            <View style={styles.statBlockContainer}>
              <View style={styles.statBlock}>
                <View style={styles.statRow}><Text style={styles.statLabel}>সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা :</Text><Text style={styles.statValue}>{header.certified_muallima ?? 0} জন</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>ক্লাস নিচ্ছেন :</Text><Text style={styles.statValue}>{header.certified_muallima_taking_classes ?? 0} জন</Text></View>
              </View>
              <View style={styles.statBlock}>
                <View style={styles.statRow}><Text style={styles.statLabel}>প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা :</Text><Text style={styles.statValue}>{header.trained_muallima ?? 0} জন</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>ক্লাস নিচ্ছেন :</Text><Text style={styles.statValue}>{header.trained_muallima_taking_classes ?? 0} জন</Text></View>
              </View>
              <View style={styles.statBlock}>
                <View style={styles.statRow}><Text style={styles.statLabel}>ইউনিট সংখ্যা :</Text><Text style={styles.statValue}>{header.total_unit ?? 0} টি</Text></View>
                <View style={styles.statRow}><Text style={styles.statLabel}>মুয়াল্লিমা আছে :</Text><Text style={styles.statValue}>{header.units_with_muallima ?? 0} টিতে</Text></View>
              </View>
            </View>
          </View>
        )}

        {/* 2. Courses Table */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header Level 1 */}
            <View style={[styles.tableRow, styles.tableHeaderPrimary]}>
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
            <View style={[styles.tableRow, styles.tableHeaderPrimary]}>
              <Text style={[styles.tableCell, { width: "16%" }]}></Text>
              {/* গ্রুপ / কোর্স */}
              <View style={[{ width: "14%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#94a3b8" }]}>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0.5 }]}>সংখ্যা</Text>
                <Text style={[styles.tableCell, { width: "34%", borderRightWidth: 0.5 }]}>বৃদ্ধি</Text>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0 }]}>ঘাটতি</Text>
              </View>
              <Text style={[styles.tableCell, { width: "6%" }]}>সংখ্যা</Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>সংখ্যা</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>সংখ্যা</Text>
              {/* শিক্ষার্থী অবস্থান */}
              <View style={[{ width: "24%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#94a3b8" }]}>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>বোর্ডে</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>কায়দায়</Text>
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
                  <View style={[{ width: "14%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#94a3b8" }]}>
                    <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0.5 }]}>{item.number ?? ""}</Text>
                    <Text style={[styles.tableCell, { width: "34%", borderRightWidth: 0.5 }]}>{item.increase ?? ""}</Text>
                    <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0 }]}>{item.decrease ?? ""}</Text>
                  </View>
                  <Text style={[styles.tableCell, { width: "6%" }]}>{item.sessions ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "8%" }]}>{item.students ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>{item.attendance ?? ""}</Text>
                  {/* Status sub */}
                  <View style={[{ width: "24%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#94a3b8" }]}>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{item.status_board ?? ""}</Text>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{item.status_qayda ?? ""}</Text>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{item.status_ampara ?? ""}</Text>
                    <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>{item.status_quran ?? ""}</Text>
                  </View>
                  <Text style={[styles.tableCell, { width: "11%" }]}>{item.completed ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>{item.correctly_learned ?? ""}</Text>
                </View>
              );
            })}
            
            {/* Total Row */}
            <View style={[styles.tableRow, { backgroundColor: "#f8fafc", fontWeight: "bold" }]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "16%" }]}>মোট সংখ্যা</Text>
              <View style={[{ width: "14%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#94a3b8" }]}>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0.5 }]}>{totalCourses.number || ""}</Text>
                <Text style={[styles.tableCell, { width: "34%", borderRightWidth: 0.5 }]}>{totalCourses.increase || ""}</Text>
                <Text style={[styles.tableCell, { width: "33%", borderRightWidth: 0 }]}>{totalCourses.decrease || ""}</Text>
              </View>
              <Text style={[styles.tableCell, { width: "6%" }]}>{totalCourses.sessions || ""}</Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>{totalCourses.students || ""}</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>{totalCourses.attendance || ""}</Text>
              <View style={[{ width: "24%", flexDirection: "row", padding: 0, borderRightWidth: 0.5, borderRightColor: "#94a3b8" }]}>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{totalCourses.status_board || ""}</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{totalCourses.status_qayda || ""}</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0.5 }]}>{totalCourses.status_ampara || ""}</Text>
                <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>{totalCourses.status_quran || ""}</Text>
              </View>
              <Text style={[styles.tableCell, { width: "11%" }]}>{totalCourses.completed || ""}</Text>
              <Text style={[styles.tableCell, { width: "11%", borderRightWidth: 0 }]}>{totalCourses.correctly_learned || ""}</Text>
            </View>
          </View>
          
          {/* Extras just below course table like in the image */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, fontWeight: "bold" }}>
            <View style={{ width: "48%", flexDirection: "row" }}>
              <View style={{ width: "50%" }}><Text>মক্তব সংখ্যা : {extras.find(e => e.category === "মক্তব সংখ্যা")?.number ?? 0} টি</Text></View>
              <View style={{ width: "50%" }}><Text>বৃদ্ধি : {extras.find(e => e.category === "মক্তব বৃদ্ধি")?.number ?? 0} টি</Text></View>
            </View>
            <View style={{ width: "48%", flexDirection: "row" }}>
              <View style={{ width: "50%" }}><Text>স্থানীয়ভাবে পরিচালিত : {extras.find(e => e.category === "স্থানীয়ভাবে পরিচালিত")?.number ?? 0} টি</Text></View>
              <View style={{ width: "50%" }}><Text>মহানগরী পরিচালিত : {extras.find(e => e.category === "মহানগরী পরিচালিত")?.number ?? 0} টি</Text></View>
            </View>
          </View>
        </View>

        {/* 3. Organizational Table */}
        <View style={styles.section} break>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeaderPrimary]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "40%" }]}>দাওয়াত ও সংগঠন</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>সংখ্যা</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>বৃদ্ধি</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>পরিমাণ</Text>
              <Text style={[styles.tableCell, styles.textLeft, { width: "15%", borderRightWidth: 0 }]}>মন্তব্য</Text>
            </View>
            {/* Rows */}
            {ORG_CATEGORIES.map((cat) => {
              const item = org.find((x) => x.category === cat) || {};
              return (
                <View key={cat} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "40%", fontWeight: "bold" }]}>{cat}</Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{item.number ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{item.increase ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{item.amount ?? ""}</Text>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "15%", borderRightWidth: 0, fontSize: 7 }]}>
                    {item.comments || ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4. Personal Table - Inverted Rows/Cols to match Excel */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeaderPrimary]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "30%" }]}>ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>রুকন</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>কর্মী</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>সক্রিয় সহযোগী</Text>
              <Text style={[styles.tableCell, { width: "20%", borderRightWidth: 0 }]}>মোট</Text>
            </View>
            {/* Rows mapped from fields */}
            {[
              { label: "কতজন শিখাচ্ছেন", key: "teaching" },
              { label: "কতজনকে শিখাচ্ছেন", key: "learning" },
              { label: "কতজন ওলামাকে দাওয়াত দিয়েছেন/সহযোগী/সক্রিয় সহযোগী", key: "mixed" },
              { label: "কর্মী/রুকন হয়েছেন কতজন", key: "mixed2" },
            ].map(rowMeta => {
              const rItem = personal.find(p => p.category === "রুকন") || {};
              const kItem = personal.find(p => p.category === "কর্মী") || {};
              const sItem = personal.find(p => p.category === "সক্রিয় সহযোগী") || {};
              
              let rVal = ""; let kVal = ""; let sVal = ""; let sumVal: any = "";
              
              if (rowMeta.key === "mixed") {
                rVal = `${rItem.olama_invited || ""}/${rItem.became_shohojogi || ""}/${rItem.became_sokrio_shohojogi || ""}`;
                kVal = `${kItem.olama_invited || ""}/${kItem.became_shohojogi || ""}/${kItem.became_sokrio_shohojogi || ""}`;
                sVal = `${sItem.olama_invited || ""}/${sItem.became_shohojogi || ""}/${sItem.became_sokrio_shohojogi || ""}`;
                const tOlama = (rItem.olama_invited || 0) + (kItem.olama_invited || 0) + (sItem.olama_invited || 0);
                const tShoh = (rItem.became_shohojogi || 0) + (kItem.became_shohojogi || 0) + (sItem.became_shohojogi || 0);
                const tSokrio = (rItem.became_sokrio_shohojogi || 0) + (kItem.became_sokrio_shohojogi || 0) + (sItem.became_sokrio_shohojogi || 0);
                sumVal = `${tOlama || ""}/${tShoh || ""}/${tSokrio || ""}`;
              } else if (rowMeta.key === "mixed2") {
                rVal = `${rItem.became_kormi || ""}/${rItem.became_rukon || ""}`;
                kVal = `${kItem.became_kormi || ""}/${kItem.became_rukon || ""}`;
                sVal = `${sItem.became_kormi || ""}/${sItem.became_rukon || ""}`;
                const tKormi = (rItem.became_kormi || 0) + (kItem.became_kormi || 0) + (sItem.became_kormi || 0);
                const tRukon = (rItem.became_rukon || 0) + (kItem.became_rukon || 0) + (sItem.became_rukon || 0);
                sumVal = `${tKormi || ""}/${tRukon || ""}`;
              } else {
                rVal = rItem[rowMeta.key] || "";
                kVal = kItem[rowMeta.key] || "";
                sVal = sItem[rowMeta.key] || "";
                sumVal = (Number(rItem[rowMeta.key]) || 0) + (Number(kItem[rowMeta.key]) || 0) + (Number(sItem[rowMeta.key]) || 0);
                sumVal = sumVal || "";
              }
              
              return (
                <View key={rowMeta.key} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "30%", fontWeight: "bold" }]}>{rowMeta.label}</Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{rVal === "//" || rVal === "/" ? "" : rVal}</Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{kVal === "//" || kVal === "/" ? "" : kVal}</Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>{sVal === "//" || sVal === "/" ? "" : sVal}</Text>
                  <Text style={[styles.tableCell, { width: "20%", borderRightWidth: 0, fontWeight: "bold" }]}>{sumVal === "//" || sumVal === "/" ? "" : sumVal}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* 5. Meetings Table */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeaderSecondary]}>
              <Text style={[styles.tableCell, styles.textLeft, { width: "20%" }]}>বৈঠকসমূহ</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>মহানগরীর কতটি</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>গড় উপস্থিতি</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>থানার কতটি</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>গড় উপস্থিতি</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>ওয়ার্ডের কতটি</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>গড় উপস্থিতি</Text>
              <Text style={[styles.tableCell, styles.textLeft, { width: "8%", borderRightWidth: 0 }]}>মন্তব্য</Text>
            </View>
            {/* Rows */}
            {MEETING_CATEGORIES.map((cat) => {
              const item = meetings.find((x) => x.category === cat) || {};
              return (
                <View key={cat} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "20%", fontWeight: "bold" }]}>{cat}</Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>{item.city_count ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>{item.city_avg_attendance ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>{item.thana_count ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>{item.thana_avg_attendance ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>{item.ward_count ?? ""}</Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>{item.ward_avg_attendance ?? ""}</Text>
                  <Text style={[styles.tableCell, styles.textLeft, { width: "8%", borderRightWidth: 0, fontSize: 7 }]}>
                    {item.comments || ""}
                  </Text>
                </View>
              );
            })}
          </View>
          
          {/* Extras Below Meeting */}
          <View style={{ flexDirection: "row", marginTop: 4, paddingHorizontal: 10, fontWeight: "bold" }}>
            <View style={{ width: "10%" }}><Text>সফর :</Text></View>
            <View style={{ width: "45%" }}>
              <Text>মহানগরীর : {extras.find(e => e.category === "মহানগরীর সফর")?.number ?? 0} টি</Text>
              <Text style={{ marginTop: 2 }}>থানা কমিটির : {extras.find(e => e.category === "থানা কমিটির সফর")?.number ?? 0} টি</Text>
            </View>
            <View style={{ width: "45%" }}>
              <Text>থানা প্রতিনিধির : {extras.find(e => e.category === "থানা প্রতিনিধির সফর")?.number ?? 0} টি</Text>
              <Text style={{ marginTop: 2 }}>ওয়ার্ড প্রতিনিধির : {extras.find(e => e.category === "ওয়ার্ড প্রতিনিধির সফর")?.number ?? 0} টি</Text>
            </View>
          </View>
        </View>

        {/* 7. Comments & Signature Section */}
        <View style={styles.section}>
          {comment && comment.comment && (
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <Text style={{ width: "10%", fontWeight: "bold" }}>মন্তব্য :</Text>
              <Text style={{ width: "90%" }}>{comment.comment}</Text>
            </View>
          )}

          <View style={styles.signatureContainer}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureText}>{header?.responsible_name || "স্বাক্ষর"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

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

    const zoneIdParam = searchParams.get("zone_id");

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
    // CASE A: Export Single Zone Report PDF (Or Zone Aggregated Report)
    // ─────────────────────────────────────────────────────────────────────────
    if (reportIdParam || zoneIdParam) {
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
      } else {
        const targetZoneId = Number(zoneIdParam);
        const targetYear = Number(yearParam);
        const targetMonth = Number(monthParam || 1);
        const targetReportType = reportTypeParam || "মাসিক";

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
        filename = `${zoneName}_Report_${targetMonth}_${targetYear}.pdf`;

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
