"use client";

import { AutoSaveField } from "../auto-save-field";

export function ReportHeaderForm() {
  return (
    <div className="space-y-10">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">প্রাথমিক তথ্য</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AutoSaveField 
            label="দায়িত্বশীল বোনের নাম" 
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

      <hr className="border-border/50" />

      {/* Muallima Stats */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">মুয়াল্লিমা সংক্রান্ত তথ্য</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <AutoSaveField 
            label="মোট মুয়াল্লিমা" 
            name="total_muallima" 
            type="number"
            section="header" 
            table="report_header"
          />
          <AutoSaveField 
            label="বৃদ্ধি" 
            name="muallima_increase" 
            type="number"
            section="header" 
            table="report_header"
          />
          <AutoSaveField 
            label="ঘাটতি" 
            name="muallima_decrease" 
            type="number"
            section="header" 
            table="report_header"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-4 rounded-2xl bg-muted/30 space-y-4 border border-border">
             <h4 className="font-bold text-foreground">সনদপ্রাপ্ত মুয়াল্লিমা</h4>
             <AutoSaveField 
               label="মোট সংখ্যা" 
               name="certified_muallima" 
               type="number"
               section="header" 
               table="report_header"
             />
             <AutoSaveField 
               label="যাঁরা ক্লাস নিচ্ছেন" 
               name="certified_muallima_taking_classes" 
               type="number"
               section="header" 
               table="report_header"
             />
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 space-y-4 border border-border">
             <h4 className="font-bold text-foreground">প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা</h4>
             <AutoSaveField 
               label="মোট সংখ্যা" 
               name="trained_muallima" 
               type="number"
               section="header" 
               table="report_header"
             />
             <AutoSaveField 
               label="যাঁরা ক্লাস নিচ্ছেন" 
               name="trained_muallima_taking_classes" 
               type="number"
               section="header" 
               table="report_header"
             />
          </div>
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Unit Stats */}
      <div>
        <h3 className="text-lg font-bold text-primary mb-4">ইউনিট সংক্রান্ত তথ্য</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AutoSaveField 
            label="মোট ইউনিট সংখ্যা" 
            name="total_unit" 
            type="number"
            section="header" 
            table="report_header"
          />
          <AutoSaveField 
            label="মুয়াল্লিমাসম্পন্ন ইউনিট" 
            name="units_with_muallima" 
            type="number"
            section="header" 
            table="report_header"
          />
        </div>
      </div>
    </div>
  );
}
