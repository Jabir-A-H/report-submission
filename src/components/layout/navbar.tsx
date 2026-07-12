"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { UserDropdown } from "./user-dropdown";

export function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide Navbar on Login, Register, Home or when simplified view is needed
  const isAuthPage = ["/login", "/register", "/auth", "/home", "/pending-approval", "/forgot-password", "/update-password"].includes(pathname);
  
  if (isAuthPage) return null;

  const paramsStr = searchParams.toString();
  const homeHref = paramsStr ? `/?${paramsStr}` : "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card opacity-100 hidden md:block">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={homeHref} className="flex items-center space-x-2">
            <span className="text-xl font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-tighter">
               {t.siteTitle}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-bold">
            <Link
              href={homeHref}
              className={`transition-all hover:text-primary ${
                pathname === "/" ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
              }`}
            >
              {t.home || "হোম"}
            </Link>
            <Link
              href="/report"
              className={`transition-all hover:text-primary ${
                pathname.startsWith("/report") ? "text-primary px-2 py-1 bg-primary/5 rounded-lg" : "text-muted-foreground"
              }`}
            >
              {t.report}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}

