import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Building2,
  Settings,
  ChevronRight,
} from "lucide-react";

const NAV_CARDS = [
  {
    title: "জমাকৃত রিপোর্ট",
    description: "সকল জোনের জমাকৃত রিপোর্টের তালিকা",
    href: "/admin/reports",
    icon: FileText,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    title: "সিটি রিপোর্ট",
    description: "সমগ্র শহরের সমষ্টিগত রিপোর্ট ও সংশোধন",
    href: "/admin/city-report",
    icon: Building2,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600",
  },
  {
    title: "ব্যবস্থাপনা",
    description: "ব্যবহারকারী ও জোন নিয়ন্ত্রণ",
    href: "/admin/management",
    icon: Settings,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="py-8 max-w-5xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-primary/10 text-primary rounded-2xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            অ্যাডমিন ড্যাশবোর্ড
          </h1>
          <p className="text-muted-foreground mt-1">
            প্রশাসনিক প্যানেল — রিপোর্ট, সিটি ডেটা ও ব্যবস্থাপনা
          </p>
        </div>
      </div>

      {/* ── Navigation Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-3 ${card.iconBg} ${card.iconColor} rounded-xl`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>

              <h2 className="text-lg font-black text-foreground mt-4">
                {card.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
