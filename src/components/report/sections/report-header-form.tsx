"use client";

import { AutoSaveField } from "../auto-save-field";
import { UserCheck, GraduationCap, Building2 } from "lucide-react";

export function ReportHeaderForm() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Basic Info */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <UserCheck className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">প্রাথমিক তথ্য</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AutoSaveField 
            label="দায়িত্বশীলার নাম" 
            name="responsible_name" 
            section="header" 
            table="report_header"
            placeholder="নাম লিখুন"
          />
          <AutoSaveField 
            label="থানা / উপশাখা" 
            name="thana" 
            section="header" 
            table="report_header"
            placeholder="থানার নাম"
          />
          <AutoSaveField 
            label="ওয়ার্ড নং" 
            name="ward" 
            type="number"
            section="header" 
            table="report_header"
            placeholder="ওয়ার্ড নং"
          />
        </div>
      </div>

      {/* Muallima Stats */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">মুয়াল্লিমা সংক্রান্ত তথ্য</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <AutoSaveField 
            label="মোট মুয়াল্লিমা" 
            name="total_muallima" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
          <AutoSaveField 
            label="বৃদ্ধি" 
            name="muallima_increase" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
          <AutoSaveField 
            label="ঘাটতি" 
            name="muallima_decrease" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/40">
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wide border-b border-border/30 pb-2">সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা</h4>
             <AutoSaveField 
               label="সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা" 
               name="certified_muallima" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
             <AutoSaveField 
               label="সার্টিফিকেটপ্রাপ্ত ক্লাস নিচ্ছেন" 
               name="certified_muallima_taking_classes" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
          </div>

          <div className="space-y-3">
             <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wide border-b border-border/30 pb-2">প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা</h4>
             <AutoSaveField 
               label="প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা" 
               name="trained_muallima" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
             <AutoSaveField 
               label="প্রশিক্ষণপ্রাপ্ত ক্লাস নিচ্ছেন" 
               name="trained_muallima_taking_classes" 
               type="number"
               section="header" 
               table="report_header"
               inline
             />
          </div>
        </div>
      </div>

      {/* Unit Stats */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">ইউনিট সংক্রান্ত তথ্য</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AutoSaveField 
            label="ইউনিট সংখ্যা" 
            name="total_unit" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
          <AutoSaveField 
            label="মুয়াল্লিমা সহ ইউনিট" 
            name="units_with_muallima" 
            type="number"
            section="header" 
            table="report_header"
            inline
          />
        </div>
      </div>
    </div>
  );
}
