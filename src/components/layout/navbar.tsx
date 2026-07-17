"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/utils/supabase/client";
import { UserDropdown } from "./user-dropdown";

export function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("people")
        .select("role")
        .eq("supabase_uid", user.id)
        .single();
      if (profile && (profile.role === "admin" || profile.role === "superadmin")) {
        setIsAdmin(true);
      }
    })();
  }, [supabase]);

  // Hide Navbar only on auth pages
  const isAuthPage = ["/home", "/auth", "/pending-approval", "/forgot-password", "/update-password"].includes(pathname);
  if (isAuthPage) return null;

  // Build period query string — carries period context across all navigation links
  const paramsStr = searchParams.toString();
  const periodQuery = paramsStr ? `?${paramsStr}` : "";

  // Home link carries period params so the dashboard shows the correct period on return
  const homeHref = `/${periodQuery}`;
  // Report link: goes to the /report overview page with period params
  const reportHref = `/report${periodQuery}`;

  const showAdminNav = isAdmin || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card opacity-100 hidden md:block shadow-xs">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={showAdminNav ? "/admin" : homeHref} className="flex items-center space-x-2">
            <span className="text-xl font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-tighter">
               {t.siteTitle}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-bold">
            {showAdminNav ? (
              <>
                <Link
                  href="/admin"
                  className={`transition-all hover:text-primary ${
                    pathname === "/admin" ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
                  }`}
                >
                  ড্যাশবোর্ড
                </Link>
                <Link
                  href="/admin/reports"
                  className={`transition-all hover:text-primary ${
                    pathname.startsWith("/admin/reports") ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
                  }`}
                >
                  জমাকৃত রিপোর্ট
                </Link>
                <Link
                  href="/admin/city-report"
                  className={`transition-all hover:text-primary ${
                    pathname.startsWith("/admin/city-report") ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
                  }`}
                >
                  সিটি রিপোর্ট
                </Link>
                <Link
                  href="/admin/management"
                  className={`transition-all hover:text-primary ${
                    pathname.startsWith("/admin/management") ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
                  }`}
                >
                  ব্যবস্থাপনা
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={homeHref}
                  className={`transition-all hover:text-primary ${
                    pathname === "/" ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
                  }`}
                >
                  {t.home || "হোম"}
                </Link>
                <Link
                  href={reportHref}
                  className={`transition-all hover:text-primary ${
                    pathname.startsWith("/report") ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
                  }`}
                >
                  {t.report}
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
