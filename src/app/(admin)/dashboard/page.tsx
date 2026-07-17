import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  ShieldCheck,
  FileText,
  Building2,
  Settings,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  TrendingUp,
} from "lucide-react";

const NAV_CARDS = [
  {
    title: "জমাকৃত রিপোর্ট",
    description: "সকল জোনের জমাকৃত রিপোর্টের তালিকা ও পর্যালোচনা",
    href: "/reports",
    icon: FileText,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    title: "সিটি রিপোর্ট",
    description: "সমগ্র শহরের সমষ্টিগত রিপোর্ট ও প্রয়োজনীয় সংশোধন (ওভাররাইড)",
    href: "/city-report",
    icon: Building2,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600",
  },
  {
    title: "ব্যবস্থাপনা",
    description: "ব্যবহারকারী, জোন ও এলাকার পর্যায় নিয়ন্ত্রণ",
    href: "/management",
    icon: Settings,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
] as const;

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

function toBn(num: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (w) => bnDigits[Number(w)]);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current date context
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed (e.g. 7 = July)
  const monthNameBn = BN_MONTHS[currentMonth - 1] || `${toBn(currentMonth)}ম মাস`;

  // Fetch admin profile, all zones, and current month's monthly reports in parallel
  const [{ data: person }, { data: allZones }, { data: currentReports }] =
    await Promise.all([
      user
        ? supabase
            .from("people")
            .select("role, zone_id")
            .eq("supabase_uid", user.id)
            .single()
        : Promise.resolve({ data: null }),
      supabase.from("zone").select("*").order("name"),
      supabase
        .from("report")
        .select("id, zone_id, report_type, is_submitted")
        .eq("year", currentYear)
        .eq("month", currentMonth)
        .eq("report_type", "মাসিক"),
    ]);

  // Filter out DCS / City-level entity (id=1 or zone_type='city') to get active reportable zones
  const reportableZones = (allZones || []).filter(
    (z) => z.id !== 1 && z.zone_type !== "city"
  );

  // Determine zones under this admin's purview
  const isAdminOrSuper =
    person?.role === "superadmin" || person?.zone_id === 1 || person?.role === "admin";
  const myZones = isAdminOrSuper
    ? reportableZones
    : reportableZones.filter(
        (z) => z.id === person?.zone_id || z.parent_id === person?.zone_id
      );

  const myZoneIds = new Set(myZones.map((z) => z.id));

  // Calculate submission status for current month strictly checking is_submitted
  const submittedZoneIds = new Set(
    (currentReports || [])
      .filter((r) => myZoneIds.has(r.zone_id) && Boolean(r.is_submitted))
      .map((r) => r.zone_id)
  );

  const submittedZones = myZones.filter((z) => submittedZoneIds.has(z.id));
  const pendingZones = myZones.filter((z) => !submittedZoneIds.has(z.id));

  const totalZonesCount = myZones.length;
  const submittedCount = submittedZones.length;
  const pendingCount = pendingZones.length;
  const completionPercentage =
    totalZonesCount > 0 ? Math.round((submittedCount / totalZonesCount) * 100) : 0;

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              অ্যাডমিন ড্যাশবোর্ড
            </h1>
            <p className="text-muted-foreground mt-1 font-bold">
              প্রশাসনিক কন্ট্রোল সেন্টার — রিপোর্ট পর্যালোচনা ও এলাকা ব্যবস্থাপনা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border text-sm font-bold text-muted-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span>
            {monthNameBn} {toBn(currentYear)}
          </span>
        </div>
      </div>

      {/* ── Current Month's Report Condition Panel ────────────── */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <BarChart3 className="w-4 h-4" />
              <span>চলমান মাসের হালনাগাদ চিত্র</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground">
              {monthNameBn} {toBn(currentYear)} — রিপোর্ট জমাদানের অবস্থা
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-primary/5 px-4 py-2.5 rounded-2xl border border-primary/10 self-start sm:self-auto">
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                জমাদানের হার
              </p>
              <p className="text-lg font-black text-primary leading-none">
                {toBn(completionPercentage)}% সম্পন্ন
              </p>
            </div>
          </div>
        </div>

        {/* ── KPI Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600/80 uppercase tracking-wider">
                মোট জোন / এলাকা
              </p>
              <p className="text-3xl font-black text-blue-600 mt-1">
                {toBn(totalZonesCount)}
                <span className="text-sm font-bold text-muted-foreground ml-1">টি</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-600/80 uppercase tracking-wider">
                রিপোর্ট জমা হয়েছে
              </p>
              <p className="text-3xl font-black text-green-600 mt-1">
                {toBn(submittedCount)}
                <span className="text-sm font-bold text-muted-foreground ml-1">টি</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600/80 uppercase tracking-wider">
                এখনও অপেক্ষমাণ
              </p>
              <p className="text-3xl font-black text-amber-600 mt-1">
                {toBn(pendingCount)}
                <span className="text-sm font-bold text-muted-foreground ml-1">টি</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="space-y-2 pt-2">
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>০%</span>
            <span>{toBn(submittedCount)} টি জোন জমাকৃত ({toBn(completionPercentage)}%)</span>
            <span>১০০%</span>
          </div>
        </div>

        {/* ── Detailed Breakdown Lists ── */}
        <div className="pt-4 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Submitted List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>জমাকৃত জোন সমূহ ({toBn(submittedCount)}টি)</span>
            </div>
            {submittedCount === 0 ? (
              <p className="text-xs text-muted-foreground font-bold bg-muted/30 p-3 rounded-xl border border-border/40">
                চলতি মাসের কোনো জোনের রিপোর্ট এখনও জমা হয়নি।
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {submittedZones.map((z) => (
                  <span
                    key={z.id}
                    className="px-3 py-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                  >
                    <span>✓</span>
                    <span>{z.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pending List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>অপেক্ষমাণ জোন সমূহ ({toBn(pendingCount)}টি)</span>
            </div>
            {pendingCount === 0 ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-700 dark:text-green-400 text-xs font-black flex items-center gap-2.5">
                <span className="text-base">🎉</span>
                <span>অভিনন্দন! চলতি মাসের সকল জোনের রিপোর্ট জমা সম্পন্ন হয়েছে।</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pendingZones.map((z) => (
                  <span
                    key={z.id}
                    className="px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                  >
                    <span>⏳</span>
                    <span>{z.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation Cards ────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
          <span>প্রশাসনিক কার্যক্রম</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3.5 ${card.iconBg} ${card.iconColor} rounded-2xl shadow-inner`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-lg font-black text-foreground mt-5">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed font-bold">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
