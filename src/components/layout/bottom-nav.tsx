"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/utils/supabase/client";
import { Home, ClipboardList, User, HelpCircle, LogOut, FileText, Building2, Settings, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{name: string, role: string, zone: string} | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("people")
        .select("name, role, zone(name)")
        .eq("supabase_uid", user.id)
        .single();
      if (profile) {
        const zoneObj = profile.zone as any;
        if (profile.role === "admin" || profile.role === "superadmin") {
          setIsAdmin(true);
        }
        setUserInfo({
          name: profile.name || user.email?.split("@")[0] || "User",
          role: profile.role,
          zone: zoneObj?.name || "—",
        });
      } else {
        setUserInfo({
          name: user.email?.split("@")[0] || "User",
          role: "user",
          zone: "—",
        });
      }
    })();
  }, [supabase]);

  const isAuthPage = ["/home", "/auth", "/pending-approval", "/forgot-password", "/update-password"].includes(pathname);
  if (isAuthPage) return null;

  // Build period param string from current URL params — carries period context across navigation
  const paramsStr = searchParams.toString();
  const periodQuery = paramsStr ? `?${paramsStr}` : "";

  // Home always carries the current period params forward
  const homeHref = `/${periodQuery}`;
  // Report tab links to /report overview page with params
  const reportHref = `/report${periodQuery}`;

  const showAdminNav = isAdmin || pathname.startsWith("/admin");

  return (
    <>
      {/* Overlay when Profile Panel is open */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden animate-in fade-in duration-200"
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      {/* Slide-up Profile Panel */}
      {isProfileOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-b border-border shadow-2xl rounded-t-3xl max-h-[80vh] overflow-y-auto md:hidden animate-in slide-in-from-bottom duration-250 opacity-100"
        >
          <div className="p-5 bg-gradient-to-br from-primary/10 to-transparent border-b">
            <p className="text-base font-black text-foreground">{userInfo?.name || "..."}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-primary font-bold">{userInfo?.zone || "..."}</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-black tracking-widest">
                {userInfo?.role || "user"}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Collapsible Settings Accordion */}
            <details className="group rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
              <summary className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors">
                <span className="flex items-center gap-2.5">
                  <span className="text-base">⚙️</span>
                  <span>{t.labels.appearance}</span>
                </span>
                <span className="text-[10px] group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="p-3 space-y-2.5 border-t border-border/40 bg-muted/30 animate-in fade-in duration-200">
                <div className="px-2 py-1.5 bg-background/60 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5">{t.theme}</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between px-2.5 py-2 bg-background/60 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.language}</span>
                  <LanguageToggle />
                </div>
              </div>
            </details>

            {/* Help Link — carries period params so navigating back to home preserves context */}
            <Link
              href={`/help${periodQuery}`}
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-muted/60 transition-all text-foreground"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>{t.help}</span>
            </Link>

            <div className="my-2 border-t border-muted/50" />

            {/* Logout Button */}
            <button
              onClick={async () => {
                setIsProfileOpen(false);
                try {
                  const res = await fetch("/auth/logout", { method: "POST" });
                  if (!res.ok) throw new Error("Logout failed");
                } catch {
                  alert(t.labels.logoutError);
                  return;
                }
                window.location.href = "/home";
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-all active:scale-95 text-left"
            >
              <LogOut className="w-4 h-4 text-destructive" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:hidden opacity-100">
        {showAdminNav ? (
          <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
            <Link
              href="/dashboard"
              onClick={() => setIsProfileOpen(false)}
              className={`inline-flex flex-col items-center justify-center px-2 hover:bg-muted/50 group ${
                pathname === "/dashboard" && !isProfileOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 mb-1 group-active:scale-90 transition-transform ${pathname === "/dashboard" && !isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[10px] leading-tight font-bold truncate w-full text-center">
                {t.dashboard}
              </span>
            </Link>

            <Link
              href="/reports"
              onClick={() => setIsProfileOpen(false)}
              className={`inline-flex flex-col items-center justify-center px-2 hover:bg-muted/50 group ${
                pathname.startsWith("/reports") && !isProfileOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <FileText className={`w-5 h-5 mb-1 group-active:scale-90 transition-transform ${pathname.startsWith("/reports") && !isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[10px] leading-tight font-bold truncate w-full text-center">
                {t.reports}
              </span>
            </Link>

            <Link
              href="/city-report"
              onClick={() => setIsProfileOpen(false)}
              className={`inline-flex flex-col items-center justify-center px-2 hover:bg-muted/50 group ${
                pathname.startsWith("/city-report") && !isProfileOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Building2 className={`w-5 h-5 mb-1 group-active:scale-90 transition-transform ${pathname.startsWith("/city-report") && !isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[10px] leading-tight font-bold truncate w-full text-center">
                {t.adminActions.cityReport}
              </span>
            </Link>

            <Link
              href="/management"
              onClick={() => setIsProfileOpen(false)}
              className={`inline-flex flex-col items-center justify-center px-2 hover:bg-muted/50 group ${
                pathname.startsWith("/management") && !isProfileOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Settings className={`w-5 h-5 mb-1 group-active:scale-90 transition-transform ${pathname.startsWith("/management") && !isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[10px] leading-tight font-bold truncate w-full text-center">
                {t.management}
              </span>
            </Link>

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`inline-flex flex-col items-center justify-center px-2 hover:bg-muted/50 group outline-none ${
                isProfileOpen ? "text-primary bg-primary/5" : "text-muted-foreground"
              }`}
            >
              <User className={`w-5 h-5 mb-1 group-active:scale-90 transition-transform ${isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[10px] leading-tight font-bold truncate w-full text-center">
                {t.profile}
              </span>
            </button>
          </div>
        ) : (
          <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
            {/* Tab 1: Home */}
            <Link
              href={homeHref}
              onClick={() => setIsProfileOpen(false)}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group ${
                pathname === "/" && !pathname.startsWith("/report") && !isProfileOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Home className={`w-6 h-6 mb-1 group-active:scale-90 transition-transform ${pathname === "/" && !pathname.startsWith("/report") && !isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[11px] leading-tight font-bold truncate w-full text-center">
                {t.home}
              </span>
            </Link>

            {/* Tab 2: Report */}
            <Link
              href={reportHref}
              onClick={() => setIsProfileOpen(false)}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group ${
                pathname.startsWith("/report") && !isProfileOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <ClipboardList className={`w-6 h-6 mb-1 group-active:scale-90 transition-transform ${pathname.startsWith("/report") && !isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[11px] leading-tight font-bold truncate w-full text-center">
                {t.report}
              </span>
            </Link>

            {/* Tab 3: Profile Toggle */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group outline-none ${
                isProfileOpen ? "text-primary bg-primary/5" : "text-muted-foreground"
              }`}
            >
              <User className={`w-6 h-6 mb-1 group-active:scale-90 transition-transform ${isProfileOpen ? "text-primary" : ""}`} />
              <span className="text-[11px] leading-tight font-bold truncate w-full text-center">
                {t.profile}
              </span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
