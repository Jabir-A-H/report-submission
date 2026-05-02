"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { FileText, Download, Filter, Building2, Save } from "lucide-react";
import { PeriodSelector } from "@/components/dashboard/period-selector";

export default function CityReportPage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState(false);

  const handleDownloadPDF = () => {
    alert("City PDF Download feature coming soon");
  };

  const handleDownloadExcel = () => {
    alert("City Excel Download feature coming soon");
  };

  return (
    <div className="container py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 bg-card border border-border/50 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">সিটি রিপোর্ট</h1>
            <p className="text-muted-foreground mt-1">মহানগরীর সকল জোনের সমষ্টিগত রিপোর্ট</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           <PeriodSelector />

           <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
             <button 
               onClick={() => setIsEditing(!isEditing)} 
               className={`modern-btn border flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold transition-all ${isEditing ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card'}`}
             >
                <Save className="w-4 h-4" />
                <span className="hidden lg:inline">{isEditing ? "ওভাররাইড বন্ধ করুন" : "ওভাররাইড করুন"}</span>
             </button>
             <button onClick={handleDownloadPDF} className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold">
                <FileText className="w-4 h-4 text-purple-600" />
             </button>
             <button onClick={handleDownloadExcel} className="modern-btn border border-border bg-card flex-1 sm:flex-none justify-center gap-2 px-4 py-2 hover:bg-muted text-sm font-bold">
                <Download className="w-4 h-4 text-green-600" />
             </button>
           </div>
        </div>
      </div>

      {/* Main Aggregated Tables */}
      <div className="space-y-8">
        
        {/* Header Section Summary */}
        <section className={`bg-card border-l-4 border-l-emerald-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden relative transition-all ${isEditing ? 'ring-2 ring-primary/20' : ''}`}>
          <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <h2 className="text-xl font-bold text-emerald-600 mb-6 relative z-10 flex items-center justify-between">
            মূল তথ্য (সমষ্টিগত)
            {isEditing && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">এডিটিং চালু আছে</span>}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm relative z-10">
            <div className="col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="p-4 bg-muted/40 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block mb-2">মোট মুয়াল্লিমা:</span> 
                  {isEditing ? (
                    <input type="number" defaultValue="৪৫০" className="modern-input h-10 w-full text-lg font-bold bg-background" />
                  ) : (
                    <span className="font-bold text-2xl">৪৫০</span>
                  )}
               </div>
               <div className="p-4 bg-muted/40 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block mb-2">বৃদ্ধি:</span> 
                  {isEditing ? (
                    <input type="number" defaultValue="৫০" className="modern-input h-10 w-full text-lg font-bold text-green-600 bg-background" />
                  ) : (
                    <span className="font-bold text-2xl text-green-600">+৫০</span>
                  )}
               </div>
               <div className="p-4 bg-muted/40 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block mb-2">ঘাটতি:</span> 
                  {isEditing ? (
                    <input type="number" defaultValue="১২" className="modern-input h-10 w-full text-lg font-bold text-red-500 bg-background" />
                  ) : (
                    <span className="font-bold text-2xl text-red-500">-১২</span>
                  )}
               </div>
               <div className="p-4 bg-muted/40 rounded-xl border border-border/50">
                  <span className="text-muted-foreground block mb-2">মোট ইউনিট:</span> 
                  {isEditing ? (
                    <input type="number" defaultValue="১২০" className="modern-input h-10 w-full text-lg font-bold bg-background" />
                  ) : (
                    <span className="font-bold text-2xl">১২০</span>
                  )}
               </div>
            </div>
          </div>
        </section>

        {/* Courses Section Summary */}
        <section className={`bg-card border-l-4 border-l-purple-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden transition-all ${isEditing ? 'ring-2 ring-primary/20' : ''}`}>
          <h2 className="text-xl font-bold text-purple-600 mb-4">গ্রুপ / কোর্স রিপোর্ট (সমষ্টিগত)</h2>
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-purple-500/5 text-purple-700">
                <tr>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 rounded-tl-lg">বিভাগ/ধরন</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">সংখ্যা</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">বৃদ্ধি</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center">শিক্ষার্থী</th>
                  <th className="px-4 py-3 font-bold border-b border-purple-500/20 text-center rounded-tr-lg">উপস্থিতি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {["বিশিষ্টদের", "সাধারণদের", "কর্মীদের"].map((cat) => (
                  <tr key={cat} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{cat}</td>
                    <td className="px-4 py-3 text-center">
                       {isEditing ? <input type="number" defaultValue="১৫০" className="modern-input h-8 w-20 text-center mx-auto" /> : <span>১৫০</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600">
                       {isEditing ? <input type="number" defaultValue="২০" className="modern-input h-8 w-20 text-center mx-auto text-green-600" /> : <span>+২০</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                       {isEditing ? <input type="number" defaultValue="১২০০" className="modern-input h-8 w-20 text-center mx-auto" /> : <span>১২০০</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                       {isEditing ? <input type="number" defaultValue="১০০০" className="modern-input h-8 w-20 text-center mx-auto" /> : <span>১০০০</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Loading/Other sections placeholder */}
        <section className="bg-card border-l-4 border-l-cyan-500 border-y border-r border-border rounded-xl p-6 shadow-sm overflow-hidden flex items-center justify-center min-h-[150px]">
           <p className="text-muted-foreground font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              অন্যান্য সেকশনের ডেটা লোড হচ্ছে...
           </p>
        </section>
      </div>
    </div>
  );
}
