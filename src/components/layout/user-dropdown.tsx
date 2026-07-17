"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { User, LogOut, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export function UserDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<{name: string, role: string, zone: string} | null>(null);

  // Build period query string — carries period context to Help page so back-navigation preserves it
  const paramsStr = searchParams.toString();
  const periodQuery = paramsStr ? `?${paramsStr}` : "";

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("people")
          .select("name, role, zone(name)")
          .eq("supabase_uid", authUser.id)
          .single();
        
        if (profile) {
          const zoneObj = profile.zone as any;
          setUser({
            name: profile.name || authUser.email?.split("@")[0] || "User",
            role: profile.role,
            zone: zoneObj?.name || "—",
          });
        } else {
          setUser({
            name: authUser.email?.split("@")[0] || "User",
            role: "user",
            zone: "—",
          });
        }
      }
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tap-target px-2 py-1 rounded-full hover:bg-muted flex items-center gap-2 border border-transparent active:border-primary/20 transition-all outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <User className="w-5 h-5" />
        </div>
        <div className="hidden lg:flex flex-col items-start leading-tight">
          <span className="text-sm font-black truncate max-w-[100px]">{user?.name || "..."}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{user?.role || "..."}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-100">
          <div className="p-5 bg-linear-to-br from-primary/5 to-transparent border-b">
            <p className="text-sm font-black">{user?.name || "..."}</p>
            <p className="text-xs text-muted-foreground font-bold">{user?.zone || "..."}</p>
          </div>
          
          <div className="p-3 space-y-2">
            {/* Collapsible Settings Accordion */}
            <details className="group rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
              <summary className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors">
                <span className="flex items-center gap-2.5">
                  <span className="text-base">⚙️</span>
                  <span>থিম ও ভাষা (Appearance)</span>
                </span>
                <span className="text-[10px] group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="p-3 space-y-2.5 border-t border-border/40 bg-muted/30 animate-in fade-in duration-200">
                <div className="px-2 py-1.5 bg-background/60 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5">থিম</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between px-2.5 py-2 bg-background/60 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ভাষা</span>
                  <LanguageToggle />
                </div>
              </div>
            </details>

            {/* Help Link — carries period params so Navbar on Help page can link back with context */}
            <Link
              href={`/help${periodQuery}`}
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-muted/60 transition-all text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4" />
              <span>সাহায্য</span>
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="group flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>অ্যাডমিন ড্যাশবোর্ড</span>
              </Link>
            )}
            
            <div className="my-2 border-t border-muted/50" />
            
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-red-50 text-red-600 transition-all active:scale-95 text-left"
              onClick={async () => {
                  setIsOpen(false);
                  try {
                    const res = await fetch("/auth/logout", { method: "POST" });
                    if (!res.ok) throw new Error("Logout failed");
                  } catch {
                    alert("সাইন আউট করতে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।");
                    return;
                  }
                  window.location.href = "/home";
                }}
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
