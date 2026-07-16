"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { href: "/admin/reports", icon: FileText, label: "জমাকৃত রিপোর্ট" },
  { href: "/admin/city-report", icon: Building2, label: "সিটি রিপোর্ট" },
  { href: "/admin/management", icon: Settings, label: "ব্যবস্থাপনা" },
] as const;

function AdminNavLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ size: number }>;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      <ChevronRight
        size={14}
        className={`transition-all ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
    </Link>
  );
}

function SidebarContent({
  userEmail,
  onNavClick,
}: {
  userEmail: string;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              অ্যাডমিন প্যানেল
            </h1>
            <p className="text-[10px] uppercase font-bold text-primary tracking-widest">
              কন্ট্রোল সেন্টার
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="grow p-4 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => (
          <AdminNavLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            label={link.label}
            active={pathname.startsWith(link.href)}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {userEmail?.[0]?.toUpperCase()}
          </div>
          <div className="truncate grow">
            <p className="text-xs font-bold text-foreground truncate">
              {userEmail}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              অ্যাডমিন
            </p>
          </div>
        </div>
        <form action="/auth/logout" method="post">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all group">
            <LogOut
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
            সাইন আউট
          </button>
        </form>
      </div>
    </>
  );
}

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col sticky top-0 h-screen">
        <SidebarContent userEmail={userEmail} />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          aria-label="মেনু খুলুন"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <ShieldCheck size={18} />
          </div>
          <h1 className="text-sm font-bold text-foreground">
            অ্যাডমিন প্যানেল
          </h1>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[80vw] bg-card flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Close Button */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              aria-label="মেনু বন্ধ করুন"
            >
              <X size={18} />
            </button>

            <SidebarContent
              userEmail={userEmail}
              onNavClick={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
