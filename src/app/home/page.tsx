import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  // Redirect if user is already logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: person } = await supabase
      .from("people")
      .select("active")
      .eq("supabase_uid", user.id)
      .single();
    if (!person || person.active === false) {
      redirect("/pending-approval");
    } else {
      redirect("/");
    }
  }

  // Fetch zones for the registration tab
  const { data: zones } = await supabase.from("zone").select("id, name").order("name");

  const initialMode = resolvedParams?.mode === "register" ? "register" : "login";

  return (
    <div className="flex-1 flex flex-col justify-between bg-background text-foreground relative selection:bg-primary/20">
      <SessionCleaner />

      {/* Subtle Ambient Background Gradients (Lightweight blur-3xl on mobile, full blur-[130px] on desktop) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 right-1/4 w-72 sm:w-[600px] h-72 sm:h-[600px] bg-primary/15 rounded-full blur-3xl sm:blur-[130px] transform-gpu" />
        <div className="hidden sm:block absolute -bottom-32 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[130px] transform-gpu" />
      </div>

      {/* Main Content Area (Compact Layout without Topbar) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 flex flex-col justify-center">
        {/* Hero Headings Area */}
        <div className="text-center max-w-3xl mx-auto mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-6 duration-700">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight sm:leading-none font-bengali">
            তা&apos;লীমুল কুরআন বিভাগ
          </h1>
        </div>

        {/* Auth Portal Box (Right below heading with centered hardware-accelerated ambient glares) */}
        <div className="my-auto relative">
          {/* Vibrant Ambient Glare (Lightweight static blur-2xl on mobile (<640px) for 0ms GPU load, dynamic pulsing blur-[90px] on desktop) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-visible">
            {/* Rich Teal Aura */}
            <div className="absolute -top-6 -left-6 sm:-top-16 sm:-left-16 w-48 sm:w-80 h-48 sm:h-80 bg-primary/20 sm:bg-primary/25 rounded-full blur-2xl sm:blur-[90px] transform-gpu animate-none motion-safe:sm:animate-pulse" style={{ animationDuration: '7s' }} />
            {/* Warm Golden/Amber Aura */}
            <div className="absolute -bottom-6 -right-6 sm:-bottom-16 sm:-right-16 w-48 sm:w-80 h-48 sm:h-80 bg-amber-500/15 sm:bg-amber-500/20 rounded-full blur-2xl sm:blur-[90px] transform-gpu animate-none motion-safe:sm:animate-pulse" style={{ animationDuration: '9s', animationDelay: '1.5s' }} />
            {/* Deep Emerald Core Back-light (Desktop/Tablet only) */}
            <div className="hidden sm:block absolute w-96 h-96 bg-emerald-500/15 rounded-full blur-[105px] transform-gpu" />
          </div>

          <AuthPortalClient
            zones={zones}
            initialMode={initialMode}
            errorMessage={resolvedParams?.message}
          />
        </div>
      </main>

      {/* Discrete Footer with Help Link and Inline Expanded Appearance Settings */}
      <footer className="w-full border-t border-border/40 bg-background/80 py-3 mt-auto shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
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
