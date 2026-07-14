import { FileText, Download, MapPin, ShieldCheck, Zap, Smartphone, CheckCircle2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { AuthPortalClient } from "@/components/auth/auth-portal-client";
import { SessionCleaner } from "@/components/auth/session-cleaner";
import { AppearanceFooterToggle } from "@/components/layout/appearance-footer-toggle";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; message?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();

  // Fetch zones for the registration tab
  const { data: zones } = await supabase.from("zone").select("id, name").order("name");

  const initialMode = resolvedParams?.mode === "register" ? "register" : "login";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative overflow-x-hidden selection:bg-primary/20">
      <SessionCleaner />

      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-[600px] left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Main Content Area (Scrolling Layout without Topbar) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Hero Headings Area */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-6 duration-700">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight sm:leading-none font-bengali">
            তা&apos;লীমুল কুরআন বিভাগ
          </h1>
        </div>

        {/* Auth Portal Box (Right below heading) */}
        <div className="mb-16 sm:mb-24">
          <AuthPortalClient
            zones={zones}
            initialMode={initialMode}
            errorMessage={resolvedParams?.message}
          />
        </div>

        {/* Other Basic Info / Features Showcase Section Below */}
        <div className="border-t border-border/60 pt-16 space-y-16 animate-in fade-in duration-1000">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              প্ল্যাটফর্মের মূল বৈশিষ্ট্যসমূহ
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              রিপোর্ট তৈরির জটিলতা কমিয়ে দ্রুততম সময়ে সাংগঠনিক সিদ্ধান্ত গ্রহণের সর্বাধুনিক সুবিধা
            </p>
          </div>

          {/* 3-Column Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-card/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-border/80 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2.5 leading-snug">
                মাসিক, ত্রৈমাসিক, ষান্মাসিক ও বার্ষিক রিপোর্ট
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                সকল বিভাগের ডেটা স্বয়ংক্রিয়ভাবে হিসাব হয়। নির্ভুল যোগফল ও সময়োপযোগী এগ্রিগেশন নিশ্চিত করা হয়েছে।
              </p>
            </div>

            <div className="bg-card/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-border/80 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 border border-primary/20 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2.5 leading-snug">
                ২-পৃষ্ঠা পিডিএফ ও এক্সেল ডাউনলোড
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                ল্যান্ডস্কেপ ফরম্যাটে প্রিন্ট-বান্ধব ২-পৃষ্ঠার পিডিএফ এবং সম্পূর্ণ ডেটাসহ এক্সেল ফাইল একক ক্লিকে ডাউনলোড করুন।
              </p>
            </div>

            <div className="bg-card/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-border/80 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2.5 leading-snug">
                মহানগরী ও জোন ভিত্তিক রিয়েল-টাইম এগ্রিগেশন
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                জোন থেকে মহানগরী পর্যন্ত সকল স্তরের রিপোর্ট রিয়েল-টাইমে একত্রিত হয়ে ড্যাশবোর্ডে প্রদর্শিত হয়।
              </p>
            </div>
          </div>

          {/* Quick Highlight Banner */}
          <div className="bg-linear-to-r from-primary/10 via-emerald-500/10 to-primary/5 rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center justify-center sm:justify-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                সহজ ও মোবাইল-বান্ধব ইন্টারফেস
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                যেকোনো স্মার্টফোন, ট্যাবলেট বা কম্পিউটার থেকে ঝামেলাবিহীনভাবে রিপোর্ট পূরণ ও সংরক্ষণ করুন।
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-primary border border-border">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-emerald-500 border border-border">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-amber-500 border border-border">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Discrete Footer with Help Link and Inline Expanded Appearance Settings */}
      <footer className="w-full border-t border-border/40 bg-background/80 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-medium text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <p>© {new Date().getFullYear()} রিপোর্ট সাবমিশন সিস্টেম। সকল অধিকার সংরক্ষিত।</p>
            <span className="hidden sm:inline text-border">|</span>
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 font-bold text-foreground/80 hover:text-primary transition-colors underline underline-offset-2"
            >
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>সাহায্য (Help)</span>
            </Link>
          </div>
          <AppearanceFooterToggle />
        </div>
      </footer>
    </div>
  );
}
