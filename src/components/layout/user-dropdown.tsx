"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { User, LogOut, Settings, ShieldCheck, Settings2 } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export function UserDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Placeholder user info
  const user = {
    name: "User Name",
    role: "admin",
    zone: "Dhaka North",
  };

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
          <span className="text-sm font-black truncate max-w-[100px]">{user.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{user.role}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-100">
          <div className="p-5 bg-linear-to-br from-primary/5 to-transparent border-b">
            <p className="text-sm font-black">{user.name}</p>
            <p className="text-xs text-muted-foreground font-bold">{user.zone}</p>
          </div>
          
          <div className="p-3">
            {/* Preferences Section */}
            <div className="flex items-center justify-between px-3 py-2 mb-2 bg-muted/40 rounded-xl">
               <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">সেটিংস</span>
               <div className="flex gap-1 scale-90 origin-right">
                  <LanguageToggle />
                  <ThemeToggle />
               </div>
            </div>

            <Link
              href="/profile"
              className="group flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              <span>প্রোফাইল</span>
            </Link>
            
            {user.role === "admin" && (
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
              onClick={() => {
                setIsOpen(false);
                // logout logic placeholder
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
