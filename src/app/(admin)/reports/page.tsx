"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Filter,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  BarChart3,
  Map,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────
type ReportRow = {
  id: number;
  zone_id: number;
  month: number;
  year: number;
  report_type: string;
  zone: { name: string } | null;
};

// ── Bengali helpers ────────────────────────────────────────────────
const BN_MONTHS: Record<number, string> = {
  1: "জানুয়ারি",
  2: "ফেব্রুয়ারি",
  3: "মার্চ",
  4: "এপ্রিল",
  5: "মে",
  6: "জুন",
  7: "জুলাই",
  8: "আগস্ট",
  9: "সেপ্টেম্বর",
  10: "অক্টোবর",
  11: "নভেম্বর",
  12: "ডিসেম্বর",
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  মাসিক: "মাসিক",
  ত্রৈমাসিক: "ত্রৈমাসিক",
  ষান্মাসিক: "ষান্মাসিক",
  "নয়-মাসিক": "নয়-মাসিক",
  বার্ষিক: "বার্ষিক",
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  মাসিক: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  ত্রৈমাসিক: "bg-purple-500/10 text-purple-600 ring-purple-500/20",
  ষান্মাসিক: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  "নয়-মাসিক": "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  বার্ষিক: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
};

function toBengaliNum(n: number): string {
  const digits = "০১২৩৪৫৬৭৮৯";
  return String(n)
    .split("")
    .map((d) => digits[parseInt(d)] ?? d)
    .join("");
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

// ── Component ──────────────────────────────────────────────────────
export default function ZoneReportsPage() {
  const supabase = useMemo(() => createClient(), []);

  // Filter state
  const [reportType, setReportType] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<number>(0); // 0 = all
  const [filterYear, setFilterYear] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState(0);

  // Data
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalReports, setTotalReports] = useState(0);
  const [uniqueZones, setUniqueZones] = useState(0);

  // Year options — current year and a few preceding ones
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => now - i);
  }, []);

  // ── Fetch reports ────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build the query for the current page
      let query = supabase
        .from("report")
        .select("id, zone_id, month, year, report_type, zone:zone_id(name)", {
          count: "exact",
        })
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("id", { ascending: false });

      // Server-side filters
      if (reportType !== "all") {
        query = query.eq("report_type", reportType);
      }
      if (filterMonth > 0) {
        query = query.eq("month", filterMonth);
      }
      if (filterYear > 0) {
        query = query.eq("year", filterYear);
      }

      // Pagination range
      const from = (currentPage - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setReports((data as unknown as ReportRow[]) ?? []);
      setTotalCount(count ?? 0);

      // Stats: total reports (unfiltered) and unique zones
      const { count: allCount } = await supabase
        .from("report")
        .select("*", { count: "exact", head: true });
      setTotalReports(allCount ?? 0);

      const { data: zoneData } = await supabase
        .from("report")
        .select("zone_id")
        .limit(1000);

      if (zoneData) {
        const unique = new Set(zoneData.map((r: { zone_id: number }) => r.zone_id));
        setUniqueZones(unique.size);
      }
    } catch (err) {
      console.error(err);
      setError("রিপোর্ট লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }, [supabase, reportType, filterMonth, filterYear, currentPage, perPage]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, filterMonth, filterYear, perPage]);

  // ── Client-side zone name search ────────────────────────────────
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) =>
      (r.zone?.name ?? "").toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  // ── Pagination helpers ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // ── Loading state ───────────────────────────────────────────────
  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">রিপোর্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto">
      {/* ── Header & Filters ────────────────────────────────────── */}
      <div className="bg-card border border-border/50 rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground">
                সব জোন রিপোর্ট
              </h1>
              <p className="text-muted-foreground mt-1">
                সকল জোনের জমাকৃত রিপোর্টের তালিকা
              </p>
            </div>
          </div>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="modern-btn border border-border bg-card px-4 py-2 text-sm font-bold flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 self-start"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="md:hidden">রিফ্রেশ</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Zone Search */}
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              জোন অনুসন্ধান
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="জোনের নাম লিখুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="modern-input h-12 w-full pl-10 bg-muted/30 focus:bg-background"
              />
            </div>
          </div>

          {/* Report Type */}
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              রিপোর্টের ধরন
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="modern-input h-12 w-full bg-muted/30 focus:bg-background"
            >
              <option value="all">সকল ধরন</option>
              <option value="মাসিক">মাসিক</option>
              <option value="ত্রৈমাসিক">ত্রৈমাসিক</option>
              <option value="ষান্মাসিক">ষান্মাসিক</option>
              <option value="নয়-মাসিক">নয়-মাসিক</option>
              <option value="বার্ষিক">বার্ষিক</option>
            </select>
          </div>

          {/* Month */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              মাস
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="modern-input h-12 w-full bg-muted/30 focus:bg-background"
            >
              <option value={0}>সকল মাস</option>
              {Object.entries(BN_MONTHS).map(([num, name]) => (
                <option key={num} value={num}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              বছর
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="modern-input h-12 w-full bg-muted/30 focus:bg-background"
            >
              <option value={0}>সকল বছর</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {toBengaliNum(y)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="modern-btn btn-primary h-12 w-full sm:w-auto px-6 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              <span>ফিল্টার</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              মোট রিপোর্ট
            </p>
            <p className="text-xl font-black leading-none mt-1">
              {toBengaliNum(totalReports)}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              রিপোর্টকৃত জোন
            </p>
            <p className="text-xl font-black leading-none mt-1">
              {toBengaliNum(uniqueZones)}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              ফিল্টারকৃত ফলাফল
            </p>
            <p className="text-xl font-black leading-none mt-1">
              {toBengaliNum(totalCount)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────── */}
      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Desktop Table View ──────────────────────────────────── */}
      <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6 relative">
        {/* Loading overlay for subsequent fetches */}
        {loading && reports.length > 0 && (
          <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-border">জোন</th>
                <th className="px-6 py-4 font-bold border-b border-border">ধরন</th>
                <th className="px-6 py-4 font-bold border-b border-border">মাস/বছর</th>
                <th className="px-6 py-4 font-bold border-b border-border text-right">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileSpreadsheet className="w-10 h-10 opacity-40" />
                      <p className="font-bold text-lg">কোনো রিপোর্ট পাওয়া যায়নি</p>
                      <p className="text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        {report.zone?.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${
                          REPORT_TYPE_COLORS[report.report_type] ??
                          "bg-muted text-muted-foreground ring-border"
                        }`}
                      >
                        {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {BN_MONTHS[report.month] ?? report.month} {toBengaliNum(report.year)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/report?zone_id=${report.zone_id}&report_id=${report.id}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20"
                      >
                        <Eye className="w-4 h-4" />
                        রিপোর্ট দেখুন
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Card View ────────────────────────────────────── */}
      <div className="md:hidden space-y-4 mb-6 relative">
        {loading && reports.length > 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {filteredReports.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileSpreadsheet className="w-10 h-10 opacity-40" />
              <p className="font-bold text-lg">কোনো রিপোর্ট পাওয়া যায়নি</p>
              <p className="text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  {report.zone?.name ?? "—"}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 uppercase tracking-wider ${
                    REPORT_TYPE_COLORS[report.report_type] ??
                    "bg-muted text-muted-foreground ring-border"
                  }`}
                >
                  {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">ধরন</span>
                  <span className="font-semibold">
                    {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">সময়কাল</span>
                  <span className="font-semibold">
                    {BN_MONTHS[report.month] ?? report.month} {toBengaliNum(report.year)}
                  </span>
                </div>
              </div>

              <Link
                href={`/report?zone_id=${report.zone_id}&report_id=${report.id}`}
                className="w-full modern-btn bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-2 py-3 rounded-xl font-bold"
              >
                <Eye className="w-4 h-4" />
                রিপোর্ট দেখুন
              </Link>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination Footer ───────────────────────────────────── */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
          {/* Per-page selector */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>প্রদর্শন:</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-2 py-1 text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {toBengaliNum(n)}
                </option>
              ))}
            </select>
            <span>এন্ট্রি</span>
            <span className="text-xs ml-2">
              ({toBengaliNum((currentPage - 1) * perPage + 1)}–
              {toBengaliNum(Math.min(currentPage * perPage, totalCount))}{" "}
              / {toBengaliNum(totalCount)})
            </span>
          </div>

          {/* Page numbers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-lg bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground"
                  >
                    ⋯
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {toBengaliNum(page)}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-lg bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
