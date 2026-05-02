"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { 
  Users, 
  MapPin, 
  FileCheck, 
  TrendingUp,
  Download,
  Settings,
  Plus,
  ArrowRight,
  ExternalLink,
  User,
  Building2
} from "lucide-react";
import Link from "next/link";

export function AdminDashboard() {
  const { t } = useLanguage();

  const stats = [
    { label: t.adminActions.userManagement, value: "২৪", icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: t.adminActions.zoneManagement, value: "১২", icon: MapPin, color: "text-purple-600", bg: "bg-purple-500/10" },
    { label: "জমাকৃত রিপোর্ট", value: "১৮/২৪", icon: FileCheck, color: "text-green-600", bg: "bg-green-500/10" },
    { label: "প্রবৃদ্ধি", value: "+১২%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="container py-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient mb-2">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground">সিস্টেমের সামগ্রিক অবস্থা এবং রিপোর্ট তদারকি করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="modern-btn border border-border bg-card flex items-center gap-2 px-4 py-2 text-sm font-bold active:scale-95 transition-all">
            <Download className="w-4 h-4" />
            <span>এক্সপোর্ট করুন</span>
          </button>
          <button className="modern-btn btn-primary flex items-center gap-2 px-5 py-2 text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <Plus className="w-4 h-4" />
            <span>নতুন জোন</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="premium-card p-6 flex items-center gap-5 group transition-all hover:translate-y-[-4px]">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-lg font-black flex items-center gap-2 px-2">
            <Settings className="w-5 h-5 text-primary" />
            দ্রুত অ্যাকশন
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Link href="/admin/users" className="admin-action-card group p-6 bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] shadow-xl hover:shadow-blue-500/20 transition-all active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-all" />
               </div>
               <h4 className="text-xl font-bold mb-1">{t.adminActions.userManagement}</h4>
               <p className="text-blue-100 text-sm opacity-80">ব্যবহারকারীদের অনুমোদন এবং জোন পরিবর্তন করুন</p>
            </Link>

            <Link href="/admin/zones" className="admin-action-card group p-6 bg-white border border-border hover:border-primary/50 rounded-[2rem] transition-all active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all" />
               </div>
               <h4 className="text-xl font-bold mb-1 text-foreground">{t.adminActions.zoneManagement}</h4>
               <p className="text-muted-foreground text-sm">নতুন জোন তৈরি এবং তালিকা সংস্কার করুন</p>
            </Link>

            <Link href="/admin/city-report" className="admin-action-card group p-6 bg-white border border-border hover:border-emerald-500/50 rounded-[2rem] transition-all active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 transition-all" />
               </div>
               <h4 className="text-xl font-bold mb-1 text-foreground">{t.adminActions.cityReport}</h4>
               <p className="text-muted-foreground text-sm">শহর ভিত্তিক রিপোর্টের সারসংক্ষেপ দেখুন</p>
            </Link>
          </div>
        </div>

        {/* Global Reports Table/List */}
        <div className="lg:col-span-2">
           <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-lg font-black flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                সাম্প্রতিক জমা
              </h3>
              <Link href="/admin/reports" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                সব দেখুন <ExternalLink className="w-3 h-3" />
              </Link>
           </div>

           <div className="premium-card overflow-hidden">
             <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-foreground">ঢাকা উত্তর - জোন {item}</p>
                        <p className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">মার্চ ২০২০৫ • জমাদানকারী: আব্দুল্লাহ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase py-1 px-3 bg-green-500/10 text-green-600 rounded-full">
                         সফল
                       </span>
                       <Link 
                        href={`/admin/reports/${item}`} 
                        className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                       >
                         <ArrowRight className="w-5 h-5" />
                       </Link>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
