import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  UserCheck,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/home");

  // Verify Admin Role
  const { data: person } = await supabase
    .from("people")
    .select("role")
    .eq("supabase_uid", user.id)
    .single();

  if (person?.role !== "admin" && person?.role !== "superadmin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Sidebar - Hidden on mobile, shown on desktop */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col sticky top-0 h-screen">
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

        <nav className="grow p-4 space-y-1.5 overflow-y-auto">
          <AdminNavLink
            href="/admin/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="ড্যাশবোর্ড"
          />
          <AdminNavLink
            href="/admin/reports"
            icon={<FileText size={18} />}
            label="সকল রিপোর্ট"
          />
          <AdminNavLink
            href="/admin/city-report"
            icon={<Building2 size={18} />}
            label="সিটি রিপোর্ট"
          />
          <AdminNavLink
            href="/admin/zone-reports"
            icon={<FileSpreadsheet size={18} />}
            label="জোন রিপোর্ট"
          />

          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              ব্যবস্থাপনা
            </p>
          </div>

          <AdminNavLink
            href="/admin/users"
            icon={<Users size={18} />}
            label="ব্যবহারকারী"
          />
          <AdminNavLink
            href="/admin/zones"
            icon={<MapPin size={18} />}
            label="জোন ম্যানেজমেন্ট"
          />
          <AdminNavLink
            href="/admin/approval"
            icon={<UserCheck size={18} />}
            label="অনুমোদন"
          />
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="truncate grow">
              <p className="text-xs font-bold text-foreground truncate">
                {user.email}
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
      </aside>

      {/* Main Content Area */}
      <main className="grow p-4 md:p-8 lg:p-10 overflow-auto">{children}</main>
    </div>
  );
}

function AdminNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      <ChevronRight
        size={14}
        className="opacity-0 group-hover:opacity-100 transition-all"
      />
    </Link>
  );
}
