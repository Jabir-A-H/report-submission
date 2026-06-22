"use client";

import { useState, useEffect } from "react";
import { useReport } from "./report-context";
import { useLanguage } from "@/components/providers/language-provider";
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AutoSaveIndicator } from "./auto-save-indicator";

export function SectionLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = params.section as string;

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const sectionsOrder = [
    "header", "courses", "organizational", "personal", "meeting", "extra", "comment"
  ];
  
  const currentIndex = sectionsOrder.indexOf(currentSection);
  const nextSection = sectionsOrder[currentIndex + 1];
  const prevSection = sectionsOrder[currentIndex - 1];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px-64px)] md:min-h-screen pb-24 md:pb-12 h-full">
      {/* Secondary Top Nav for Section */}
      <div className="sticky top-16 md:top-0 z-40 w-full bg-background/80 backdrop-blur border-b">
        <div className="container py-3 flex items-center justify-between">
          <Link 
            href={`/${queryString}`} 
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors hover:translate-x-[-4px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">ড্যাশবোর্ড</span>
          </Link>
          
          <div className="flex flex-col items-center">
             <h2 className="text-lg font-black leading-tight">{title}</h2>
             <AutoSaveIndicator />
          </div>

          <div className="w-[80px] flex justify-end">
             <Link href={`/${queryString}`} className="p-2 rounded-lg bg-muted text-muted-foreground active:scale-95 transition-all">
                <LayoutGrid className="w-5 h-5" />
             </Link>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 container py-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="premium-card p-6 md:p-10 shadow-2xl shadow-primary/5 bg-linear-to-b from-card to-muted/10 border-primary/10">
          {children}
        </div>
      </div>

      {/* Persistence Bar / Footer Navigation */}
      <div className="fixed bottom-0 md:bottom-8 left-0 right-0 z-40 bg-background/95 backdrop-blur md:bg-transparent border-t md:border-t-0 p-4 md:p-0">
        <div className="container flex items-center justify-between gap-4">
          {prevSection ? (
            <button 
              onClick={() => router.push(`/report/${prevSection}${queryString}`)}
              className="modern-btn border border-border bg-card flex items-center gap-2 px-6 py-3 text-sm font-bold active:scale-95 transition-all flex-1 md:flex-none justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্বের পাতা</span>
            </button>
          ) : <div className="flex-1 md:w-40" />}

          {nextSection ? (
            <button 
              onClick={() => router.push(`/report/${nextSection}${queryString}`)}
              className="modern-btn btn-primary flex items-center gap-2 px-8 py-3 text-sm font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all flex-1 md:flex-none justify-center"
            >
              <span>পরবর্তী পাতা</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => router.push(`/${queryString}`)}
              className="modern-btn btn-primary bg-linear-to-r from-green-600 to-emerald-600 flex items-center gap-2 px-8 py-3 text-sm font-bold shadow-xl shadow-green-500/20 active:scale-95 transition-all flex-1 md:flex-none justify-center"
            >
              <span>সম্পন্ন করুন</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
