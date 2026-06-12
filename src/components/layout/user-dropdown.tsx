"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { User, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export function UserDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{name: string, role: string, zone: string} | null>(null);

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
            {/* Theme Section */}
            <div className="px-3 py-2.5 bg-muted/40 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">থিম</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Language Section */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-xl">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ভাষা</span>
              <LanguageToggle />
            </div>

            {user?.role === "admin" && (
              <Link
                href="/admin/users"
                className="group flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>অ্যাডমিন প্যানেল</span>
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
                  router.push("/login");
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
