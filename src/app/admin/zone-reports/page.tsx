"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { Search, Filter, MapPin, Eye, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { PeriodSelector } from "@/components/dashboard/period-selector";

// Dummy Data
const DUMMY_REPORTS = [
  { id: 1, zoneName: "মিরপুর", type: "monthly", month: 3, year: 2026, status: "complete", submittedAt: "2026-03-05" },
  { id: 2, zoneName: "উত্তরা", type: "monthly", month: 3, year: 2026, status: "pending", submittedAt: "2026-03-04" },
  { id: 3, zoneName: "মোহাম্মদপুর", type: "monthly", month: 3, year: 2026, status: "complete", submittedAt: "2026-03-02" },
  { id: 4, zoneName: "ধানমন্ডি", type: "monthly", month: 3, year: 2026, status: "complete", submittedAt: "2026-03-01" },
  { id: 5, zoneName: "গুলশান", type: "monthly", month: 3, year: 2026, status: "pending", submittedAt: "-" },
];

export default function ZoneReportsPage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(10);

  return (
    <div className="container py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Filters */}
      <div className="bg-card border border-border/50 rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground">सब জোন রিপোর্ট</h1>
              <p className="text-muted-foreground mt-1">সকল জোনের জমাকৃত রিপোর্টের তালিকা</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
           <div className="md:col-span-4">
             <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">জোন অনুসন্ধান</label>
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
           
           <div className="md:col-span-6">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">রিপোর্টের সময়কাল</label>
              <PeriodSelector />
           </div>

           <div className="md:col-span-2 flex justify-end">
             <button className="modern-btn btn-primary h-12 w-full sm:w-auto px-6 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20">
                <Filter className="w-4 h-4" />
                <span>ফিল্টার</span>
             </button>
           </div>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-border">জোন</th>
                <th className="px-6 py-4 font-bold border-b border-border">ধরন</th>
                <th className="px-6 py-4 font-bold border-b border-border">মাস/বছর</th>
                <th className="px-6 py-4 font-bold border-b border-border">জমা দেওয়ার তারিখ</th>
                <th className="px-6 py-4 font-bold border-b border-border">স্ট্যাটাস</th>
                <th className="px-6 py-4 font-bold border-b border-border text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {DUMMY_REPORTS.map((report) => (
                 <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                   <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-primary" />
                     {report.zoneName}
                   </td>
                   <td className="px-6 py-4 capitalize">{report.type === 'monthly' ? 'মাসিক' : report.type}</td>
                   <td className="px-6 py-4">{report.month}/{report.year}</td>
                   <td className="px-6 py-4">{report.submittedAt}</td>
                   <td className="px-6 py-4">
                     {report.status === "complete" ? (
                        <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold ring-1 ring-green-500/20">সম্পন্ন</span>
                     ) : (
                        <span className="px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-xs font-bold ring-1 ring-orange-500/20">অপেক্ষমাণ</span>
                     )}
                   </td>
                   <td className="px-6 py-4 text-right">
                     <Link href={`/report?zone_id=${report.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20">
                        <Eye className="w-4 h-4" />
                        দেখুন
                     </Link>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Hidden on desktop) */}
      <div className="md:hidden space-y-4 mb-6">
         {DUMMY_REPORTS.map((report) => (
            <div key={report.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    {report.zoneName}
                  </div>
                  {report.status === "complete" ? (
                     <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded-md text-[10px] font-bold ring-1 ring-green-500/20 uppercase tracking-wider">সম্পন্ন</span>
                  ) : (
                     <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-md text-[10px] font-bold ring-1 ring-orange-500/20 uppercase tracking-wider">অপেক্ষমাণ</span>
                  )}
               </div>
               
               <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs block">ধরন</span> <span className="font-semibold">{report.type === 'monthly' ? 'মাসিক' : report.type}</span></div>
                  <div><span className="text-muted-foreground text-xs block">সময়কাল</span> <span className="font-semibold">{report.month}/{report.year}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground text-xs block">জমা দেওয়ার তারিখ</span> <span className="font-semibold">{report.submittedAt}</span></div>
               </div>

               <Link href={`/report?zone_id=${report.id}`} className="w-full modern-btn bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-2 py-3 rounded-xl font-bold">
                  <Eye className="w-4 h-4" />
                  রিপোর্ট দেখুন
               </Link>
            </div>
         ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
         <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>প্রদর্শন:</span>
            <select 
              value={perPage} 
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-2 py-1 text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
               <option value={10}>১০</option>
               <option value={25}>২৫</option>
               <option value={50}>৫০</option>
               <option value={100}>১০০</option>
            </select>
            <span>এন্ট্রি</span>
         </div>

         <div className="flex items-center gap-2">
            <button className="p-2 border border-border rounded-lg bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-all">
               <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
               <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center">১</button>
               <button className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted font-bold flex items-center justify-center transition-all">২</button>
               <button className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted font-bold flex items-center justify-center transition-all">৩</button>
            </div>
            <button className="p-2 border border-border rounded-lg bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-all">
               <ChevronRight className="w-5 h-5" />
            </button>
         </div>
      </div>

    </div>
  );
}
