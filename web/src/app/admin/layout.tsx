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
  LayoutDashboard
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify Admin Role
  const { data: person } = await supabase
    .from('people')
    .select('role')
    .eq('supabase_uid', user.id)
    .single();

  if (person?.role !== 'admin' && person?.role !== 'superadmin') {
     // For now, if not admin, redirect to home. 
     // In production, this should be a 403 page.
     redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Admin Portal</h1>
              <p className="text-[10px] uppercase font-bold text-cyan-500 tracking-widest">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow p-6 space-y-2">
          <AdminNavLink href="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <AdminNavLink href="/admin/reports" icon={<FileText size={18} />} label="All Reports" />
          <AdminNavLink href="/admin/approval" icon={<Users size={18} />} label="User Management" />
          <AdminNavLink href="/admin/settings" icon={<Settings size={18} />} label="System Settings" />
        </nav>

        <div className="p-6 border-t border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="truncate flex-grow">
              <p className="text-xs font-bold text-gray-900 truncate">{user.email}</p>
              <p className="text-[10px] text-gray-400 font-medium">Administrator</p>
            </div>
          </div>
          <form action="/auth/logout" method="post">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all group">
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${
        active 
          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-100" 
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      <ChevronRight size={14} className={`${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-all`} />
    </Link>
  );
}
