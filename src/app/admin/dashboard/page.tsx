"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart3,
  TrendingUp,
  Target,
  Library,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Users as UsersIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CorrectionButton } from "@/components/admin/correction-button";

// Bengali month names
const BN_MONTHS: Record<number, string> = {
  1: "জানুয়ারি", 2: "ফেব্রুয়ারি", 3: "মার্চ", 4: "এপ্রিল",
  5: "মে", 6: "জুন", 7: "জুলাই", 8: "আগস্ট",
  9: "সেপ্টেম্বর", 10: "অক্টোবর", 11: "নভেম্বর", 12: "ডিসেম্বর",
};

interface HeaderAgg {
  total_muallima: number;
  muallima_increase: number;
  muallima_decrease: number;
  certified_muallima: number;
  certified_muallima_taking_classes: number;
  trained_muallima: number;
  trained_muallima_taking_classes: number;
  total_unit: number;
  units_with_muallima: number;
}

interface CourseAgg {
  category: string;
  number: number;
  students: number;
  increase: number;
}

interface OrgAgg {
  category: string;
  number: number;
  increase: number;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const [headerAgg, setHeaderAgg] = useState<HeaderAgg | null>(null);
  const [courseAgg, setCourseAgg] = useState<CourseAgg[]>([]);
  const [orgAgg, setOrgAgg] = useState<OrgAgg[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [headerRes, courseRes, orgRes] = await Promise.all([
      supabase
        .from("view_city_header_agg")
        .select("*")
        .eq("year", year)
        .eq("month", month)
        .single(),
      supabase
        .from("view_city_course_agg")
        .select("*")
        .eq("year", year)
        .eq("month", month),
      supabase
        .from("view_city_organizational_agg")
        .select("*")
        .eq("year", year)
        .eq("month", month),
    ]);

    setHeaderAgg(headerRes.data);
    setCourseAgg(courseRes.data || []);
    setOrgAgg(orgRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            অ্যাক্টিভ অ্যানালিটিক্স
          </h2>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 font-medium">
            <CalendarDays size={18} className="text-primary" />
            <span>
              {BN_MONTHS[month]} {year} এর ডেটা দেখাচ্ছে (মহানগরী সমষ্টিগত)
            </span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="modern-input h-10 bg-muted/50 text-sm font-bold"
          >
            {Object.entries(BN_MONTHS).map(([val, name]) => (
              <option key={val} value={val}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="modern-input h-10 bg-muted/50 text-sm font-bold"
          >
            <option value={2025}>২০২৫</option>
            <option value={2026}>২০২৬</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2.5 border border-border rounded-xl bg-card hover:bg-muted transition-all"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin text-primary" : "text-muted-foreground"}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="মোট মুয়াল্লিমা"
              value={headerAgg?.total_muallima || 0}
              trend={`+${headerAgg?.muallima_increase || 0}`}
              positive={(headerAgg?.muallima_increase || 0) >= 0}
              icon={<UsersIcon size={20} className="text-primary" />}
              correctionProps={{
                year,
                month,
                section: "header",
                field: "total_muallima",
              }}
            />
            <KPICard
              title="মোট ইউনিট"
              value={headerAgg?.total_unit || 0}
              trend={`${headerAgg?.units_with_muallima || 0} সক্রিয়`}
              positive
              icon={<Library size={20} className="text-blue-600" />}
              correctionProps={{
                year,
                month,
                section: "header",
                field: "total_unit",
              }}
            />
            <KPICard
              title="প্রশিক্ষণপ্রাপ্তা"
              value={headerAgg?.trained_muallima || 0}
              trend={`${headerAgg?.trained_muallima_taking_classes || 0} ক্লাস নিচ্ছেন`}
              positive
              icon={<TrendingUp size={20} className="text-indigo-600" />}
              correctionProps={{
                year,
                month,
                section: "header",
                field: "trained_muallima",
              }}
            />
            <KPICard
              title="সনদপ্রাপ্তা"
              value={headerAgg?.certified_muallima || 0}
              trend={`${headerAgg?.certified_muallima_taking_classes || 0} ক্লাস নিচ্ছেন`}
              positive
              icon={<Target size={20} className="text-violet-600" />}
              correctionProps={{
                year,
                month,
                section: "header",
                field: "certified_muallima",
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Aggregation */}
            <section className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="text-lg font-black text-foreground">
                  কোর্স সমষ্টি
                </h3>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  মাসিক যোগফল
                </span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] border-b border-border">
                      <th className="px-4 py-3">বিভাগ</th>
                      <th className="px-4 py-3 text-center">সংখ্যা</th>
                      <th className="px-4 py-3 text-center">শিক্ষার্থী</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courseAgg.map((c, i) => (
                      <tr
                        key={i}
                        className="hover:bg-muted/30 transition-all group"
                      >
                        <td className="px-4 py-4 font-bold text-foreground">
                          {c.category}
                        </td>
                        <td className="px-4 py-4 text-center text-muted-foreground font-bold">
                          {c.number}
                          <CorrectionButton
                            year={year}
                            month={month}
                            reportType="মাসিক"
                            section="course"
                            field="number"
                            category={c.category}
                            currentValue={c.number}
                          />
                        </td>
                        <td className="px-4 py-4 text-center text-foreground font-black">
                          {c.students}
                          <CorrectionButton
                            year={year}
                            month={month}
                            reportType="মাসিক"
                            section="course"
                            field="students"
                            category={c.category}
                            currentValue={c.students}
                          />
                        </td>
                      </tr>
                    ))}
                    {courseAgg.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-muted-foreground italic"
                        >
                          এই সময়ের জন্য কোনো ডেটা পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Organizational Aggregation */}
            <section className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="text-lg font-black text-foreground">
                  সাংগঠনিক সমষ্টি
                </h3>
                <span className="text-xs font-black text-blue-600 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  সমষ্টিগত
                </span>
              </div>
              <div className="p-6 space-y-5 grow">
                {orgAgg.map((s, i) => (
                  <div key={i} className="flex items-center gap-5 group">
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-600 transition-all shrink-0">
                      <BarChart3 size={18} />
                    </div>
                    <div className="grow min-w-0">
                      <div className="flex justify-between items-end mb-2">
                        <h4 className="font-bold text-foreground text-sm truncate pr-2">
                          {s.category}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-lg font-black text-foreground">
                            {s.number}
                          </span>
                          <CorrectionButton
                            year={year}
                            month={month}
                            reportType="মাসিক"
                            section="organizational"
                            field="number"
                            category={s.category}
                            currentValue={s.number}
                          />
                        </div>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-2/3 opacity-80" />
                      </div>
                    </div>
                  </div>
                ))}
                {orgAgg.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground italic">
                    এই সময়ের জন্য কোনো ডেটা পাওয়া যায়নি
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  trend,
  positive,
  icon,
  correctionProps,
}: {
  title: string;
  value: number;
  trend: string;
  positive: boolean;
  icon: React.ReactNode;
  correctionProps: {
    year: number;
    month: number;
    section: string;
    field: string;
  };
}) {
  return (
    <div className="bg-card p-6 rounded-[2rem] shadow-sm border border-border relative overflow-hidden group hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-muted rounded-2xl group-hover:bg-card transition-all shadow-sm group-hover:shadow">
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${
            positive ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <p className="text-3xl font-black text-foreground tracking-tighter">
            {value}
          </p>
          <CorrectionButton
            year={correctionProps.year}
            month={correctionProps.month}
            reportType="মাসিক"
            section={correctionProps.section}
            field={correctionProps.field}
            currentValue={value}
          />
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-muted rounded-full opacity-50 group-hover:scale-[2.5] group-hover:bg-primary/10 transition-all duration-700 pointer-events-none" />
    </div>
  );
}
