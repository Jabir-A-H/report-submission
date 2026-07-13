"use client";



import { useLanguage } from "@/components/providers/language-provider";
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { CompactViewToggle, ViewModeProvider } from "./view-mode-toggle";

export function SectionLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = params.section as string;

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const toggleableSections = ["courses", "organizational", "personal", "meeting"];
  const supportsViewToggle = toggleableSections.includes(currentSection);

  const sectionsOrder = [
    "header", "courses", "organizational", "personal", "meeting", "extra", "comment"
  ];
  
  const currentIndex = sectionsOrder.indexOf(currentSection);
  const nextSection = sectionsOrder[currentIndex + 1];
  const prevSection = sectionsOrder[currentIndex - 1];
  const prevTitle = prevSection ? (t.sections as Record<string, string>)[prevSection] : "";
  const nextTitle = nextSection ? (t.sections as Record<string, string>)[nextSection] : "";

  const layoutContent = (
    <div className="flex flex-col min-h-[calc(100vh-64px-64px)] md:min-h-screen pb-24 md:pb-12 h-full">
      {/* Secondary Top Nav for Section */}
      <div className="sticky top-0 md:top-16 z-40 w-full bg-card border-b border-border md:bg-background/80 md:backdrop-blur opacity-100">
        <div className="container py-3 flex items-center justify-between">
          <Link 
            href={`/${queryString}`} 
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors hover:translate-x-[-4px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">ড্যাশবোর্ড</span>
          </Link>
          
          <div className="flex flex-col items-center">
             <h2 className="text-lg font-black leading-tight text-center">{title}</h2>
             <AutoSaveIndicator />
          </div>

          <div className="flex justify-end min-w-[80px] md:min-w-[110px]">
            {supportsViewToggle && <CompactViewToggle />}
          </div>
        </div>
      </div>

      {/* Main Form Content - clean without extra outer border */}
      <div className="flex-1 container py-5 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>

      {/* Persistence Bar / Footer Navigation */}
      <div className="fixed bottom-16 md:bottom-8 left-0 right-0 z-40 bg-card border-t border-border md:bg-transparent md:border-t-0 p-4 md:p-0 opacity-100">
        <div className="container flex items-center justify-between gap-4 max-w-4xl">
          {prevSection ? (
            <button 
              onClick={() => router.push(`/report/${prevSection}${queryString}`)}
              className="modern-btn border border-border bg-card hover:bg-muted/50 flex items-center gap-2 px-5 py-3 text-sm font-bold active:scale-95 transition-all flex-1 md:flex-none justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{prevTitle || "পূর্বের পাতা"}</span>
            </button>
          ) : <div className="flex-1 md:w-40" />}

          {nextSection ? (
            <button 
              onClick={() => router.push(`/report/${nextSection}${queryString}`)}
              className="modern-btn btn-primary flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all flex-1 md:flex-none justify-center cursor-pointer"
            >
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{nextTitle || "পরবর্তী পাতা"}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button 
              onClick={() => router.push(`/${queryString}`)}
              className="modern-btn btn-primary bg-linear-to-r from-green-600 to-emerald-600 flex items-center gap-2 px-8 py-3 text-sm font-bold shadow-xl shadow-green-500/20 active:scale-95 transition-all flex-1 md:flex-none justify-center cursor-pointer"
            >
              <span>সম্পন্ন করুন</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return supportsViewToggle ? (
    <ViewModeProvider defaultMode="card">
      {layoutContent}
    </ViewModeProvider>
  ) : layoutContent;
}
