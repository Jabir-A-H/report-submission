"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { FileText, Download, Filter, Table2 } from "lucide-react";
import Link from "next/link";
import { PeriodSelector } from "@/components/dashboard/period-selector";

export default function ReportAtAGlancePage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Dummy logic: admin vs user visibility will be fetched from session later
  const isAdmin = false; 

  const handleDownloadPDF = () => {
    alert("PDF Download feature coming soon");
  };

  const handleDownloadExcel = () => {
    alert("Excel Download feature coming soon");
  };

  return (
    <div className="container py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 bg-card border border-border/50 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <Table2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">রিপোর্ট (এক নজরে)</h1>
            <p className="text-muted-foreground mt-1">নির্বাচিত সময়ের সম্পূর্ণ রিপোর্ট সারাংশ</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           {/* Period Selector Component - existing component from Phase 2 */}
           <PeriodSelector />

           {/* Download Buttons */}
           <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
             <button onClick={handleDownloadPDF} className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="hidden lg:inline">PDF</span>
             </button>
             <button onClick={handleDownloadExcel} className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold">
                <Download className="w-4 h-4 text-green-600" />
                <span className="hidden lg:inline">Excel</span>
             </button>
           </div>
        </div>
      </div>

      {/* Main Report Tables */}
      <div className="space-y-8">
        
        {/* Header Section Summary */}
        <section className="bg-card border-l-4 border-l-cyan-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <h2 className="text-xl font-bold text-cyan-600 mb-6 relative z-10">মূল তথ্য</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm relative z-10">
            <div><span className="text-muted-foreground block mb-1">দায়িত্বশীলের নাম:</span> <span className="font-semibold text-foreground text-base">ফাতেমা খাতুন</span></div>
            <div><span className="text-muted-foreground block mb-1">থানা:</span> <span className="font-semibold text-foreground text-base">মিরপুর</span></div>
            <div><span className="text-muted-foreground block mb-1">ওয়ার্ড:</span> <span className="font-semibold text-foreground text-base">১২</span></div>
            <div className="col-span-2 lg:col-span-1" />
            
            <div className="p-3 bg-muted/40 rounded-xl"><span className="text-muted-foreground block mb-1">মোট মুয়াল্লিমা:</span> <span className="font-bold text-lg">৪৫</span></div>
            <div className="p-3 bg-muted/40 rounded-xl"><span className="text-muted-foreground block mb-1">বৃদ্ধি:</span> <span className="font-bold text-lg text-green-600">+৫</span></div>
            <div className="p-3 bg-muted/40 rounded-xl"><span className="text-muted-foreground block mb-1">ঘাটতি:</span> <span className="font-bold text-lg text-red-500">-২</span></div>
            <div className="p-3 bg-muted/40 rounded-xl"><span className="text-muted-foreground block mb-1">মোট ইউনিট:</span> <span className="font-bold text-lg">১২</span></div>
          </div>
        </section>

        {/* Courses Section Summary */}
        <section className="bg-card border-l-4 border-l-purple-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold text-purple-600 mb-4">গ্রুপ / কোর্স রিপোর্ট</h2>
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-purple-500/5 text-purple-700">
                <tr>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 rounded-tl-lg">বিভাগ/ধরন</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">সংখ্যা</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">বৃদ্ধি</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">ঘাটতি</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">শিক্ষার্থী</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center rounded-tr-lg">উপস্থিতি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {["বিশিষ্টদের", "সাধারণদের", "কর্মীদের"].map((cat) => (
                  <tr key={cat} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{cat}</td>
                    <td className="px-4 py-3 text-center">১৫</td>
                    <td className="px-4 py-3 text-center text-green-600">+২</td>
                    <td className="px-4 py-3 text-center">০</td>
                    <td className="px-4 py-3 text-center">১২০</td>
                    <td className="px-4 py-3 text-center">১০০</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Placeholder for other sections */}
        <section className="bg-card border-l-4 border-l-pink-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden flex items-center justify-center min-h-[150px]">
           <p className="text-muted-foreground font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              অন্যান্য সেকশনের ডেটা লোড হচ্ছে...
           </p>
        </section>
        
      </div>
    </div>
  );
}
