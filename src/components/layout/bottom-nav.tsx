"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/utils/supabase/client";
import { Home, ClipboardList, User, HelpCircle, ShieldCheck, Map, LogOut } from "lucide-react";
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

  const isAuthPage = ["/login", "/register", "/auth", "/home", "/pending-approval", "/forgot-password", "/update-password"].includes(pathname);
  if (isAuthPage) return null;

  const paramsStr = searchParams.toString();
  const homeHref = paramsStr ? `/?${paramsStr}` : "/";

  const isHomeActive = pathname === "/";
  const isReportActive = pathname.startsWith("/report");

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
            {/* Theme Section */}
            <div className="px-3 py-2.5 bg-muted/40 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">থিম</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Language Section */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40 rounded-xl">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ভাষা</span>
              <LanguageToggle />
            </div>

            {/* Help Link */}
            <Link
              href="/help"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-muted/60 transition-all text-foreground"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>{t.help || "সাহায্য"}</span>
            </Link>

            {/* Admin Links */}
            {isAdmin && (
              <>
                <Link
                  href="/admin/users"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/5 transition-all text-foreground"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>ইউজার ম্যানেজমেন্ট</span>
                </Link>
                <Link
                  href="/admin/zones"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/5 transition-all text-foreground"
                >
                  <Map className="w-4 h-4 text-primary" />
                  <span>জোন ম্যানেজমেন্ট</span>
                </Link>
              </>
            )}

            <div className="my-2 border-t border-muted/50" />

            {/* Logout Button */}
            <button
              onClick={async () => {
                setIsProfileOpen(false);
                try {
                  const res = await fetch("/auth/logout", { method: "POST" });
                  if (!res.ok) throw new Error("Logout failed");
                } catch {
                  alert("লগআউট করতে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।");
                  return;
                }
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-all active:scale-95 text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout || "লগআউট"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar (Opaque 3 Tabs) */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:hidden opacity-100">
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
          {/* Tab 1: Home */}
          <Link
            href={homeHref}
            onClick={() => setIsProfileOpen(false)}
            className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group ${
              isHomeActive && !isProfileOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className={`w-6 h-6 mb-1 group-active:scale-90 transition-transform ${isHomeActive && !isProfileOpen ? "text-primary" : ""}`} />
            <span className="text-[11px] leading-tight font-bold truncate w-full text-center">
              {t.home || "হোম"}
            </span>
          </Link>

          {/* Tab 2: Report */}
          <Link
            href="/report"
            onClick={() => setIsProfileOpen(false)}
            className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group ${
              isReportActive && !isProfileOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ClipboardList className={`w-6 h-6 mb-1 group-active:scale-90 transition-transform ${isReportActive && !isProfileOpen ? "text-primary" : ""}`} />
            <span className="text-[11px] leading-tight font-bold truncate w-full text-center">
              {t.report || "রিপোর্ট"}
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
              প্রোফাইল
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

