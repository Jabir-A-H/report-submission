"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  FileText,
  Calendar,
  MapPin,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";

// Bengali month names
const BN_MONTHS: Record<number, string> = {
  1: "জানুয়ারি", 2: "ফেব্রুয়ারি", 3: "মার্চ", 4: "এপ্রিল",
  5: "মে", 6: "জুন", 7: "জুলাই", 8: "আগস্ট",
  9: "সেপ্টেম্বর", 10: "অক্টোবর", 11: "নভেম্বর", 12: "ডিসেম্বর",
};

interface ReportRow {
  id: number;
  zone_id: number;
  month: number;
  year: number;
  report_type: string;
  zone: { name: string } | null;
}

export default function AdminReports() {
  const supabase = createClient();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("report")
      .select(`*, zone:zone_id (name)`)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    setReports((data as unknown as ReportRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            রিপোর্ট আর্কাইভ
          </h2>
          <p className="text-muted-foreground mt-1">
            সকল জোনের জমাকৃত রিপোর্ট পর্যালোচনা ও ব্যবস্থাপনা করুন
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold text-muted-foreground shadow-sm hover:shadow-md transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          রিফ্রেশ
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-border">
                <th className="px-6 py-4">জোনের নাম</th>
                <th className="px-6 py-4 text-center">সময়কাল</th>
                <th className="px-6 py-4 text-center">ধরন</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-muted/30 transition-all group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <MapPin size={18} />
                      </div>
                      <span className="font-bold text-foreground">
                        {(report.zone as any)?.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground">
                      <Calendar size={12} />
                      {BN_MONTHS[report.month] || report.month} {report.year}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      {report.report_type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link
                      href={`/report?zone_id=${report.zone_id}&report_id=${report.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-black hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                    >
                      <Eye size={14} />
                      বিস্তারিত
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reports.length === 0 && (
            <div className="p-20 text-center text-muted-foreground font-medium italic">
              আর্কাইভে কোনো রিপোর্ট পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
}
