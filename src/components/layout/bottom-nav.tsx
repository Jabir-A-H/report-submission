"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/utils/supabase/client";
import { Home, ClipboardList, Users, Map, HelpCircle } from "lucide-react";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("people")
        .select("role")
        .eq("supabase_uid", user.id)
        .single();
      if (data && (data.role === "admin" || data.role === "superadmin")) {
        setIsAdmin(true);
      }
    })();
  }, []);

  const isAuthPage = ["/login", "/register", "/auth", "/home", "/pending-approval"].includes(pathname);
  if (isAuthPage) return null;
  const navItems = [
    { label: "হোম", href: "/", icon: Home },
    { label: t.report, href: "/report", icon: ClipboardList },
    { label: t.help, href: "/help", icon: HelpCircle },
  ];

  if (isAdmin) {
    navItems.splice(2, 0, 
      { label: "ইউজার", href: "/admin/users", icon: Users },
      { label: "জোন", href: "/admin/zones", icon: Map }
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 group-active:scale-90 transition-transform ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] leading-tight truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
