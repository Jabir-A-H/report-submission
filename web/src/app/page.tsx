import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { 
  FilePlus, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LayoutDashboard
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch some summary stats
  const { count: totalReports } = await supabase.from('report').select('*', { count: 'exact', head: true });
  const { data: recentReports } = await supabase.from('report').select('*').order('id', { ascending: false }).limit(5);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-100 py-4 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white">
              <LayoutDashboard size={18} />
            </div>
            <h1 className="text-xl font-bold text-cyan-900">Report Central</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-medium">{user?.email}</span>
            <form action="/auth/logout" method="post">
              <button className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">Logout</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-6">
        {/* Welcome Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Welcome back. Here is what is happening with your reports.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Reports" value={totalReports || 0} icon={<BarChart3 className="text-cyan-600" />} />
          <StatCard title="Active Centers" value="14" icon={<Users className="text-blue-600" />} />
          <StatCard title="Submitted" value="0" icon={<CheckCircle2 className="text-green-600" />} />
          <StatCard title="Pending" value="0" icon={<Clock className="text-orange-600" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 px-1">Quick Actions</h3>
            <Link href="/report/new" className="group block p-6 bg-cyan-600 rounded-3xl shadow-lg border border-cyan-500 hover:bg-cyan-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <FilePlus className="text-white w-6 h-6" />
                </div>
                <div className="text-white/50 group-hover:text-white transition-colors">
                  New
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-1">New Submission</h4>
              <p className="text-cyan-100 text-sm">Start a fresh report for the current month.</p>
            </Link>

            <Link href="/admin/reports" className="block p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-cyan-200 transition-all">
              <div className="bg-gray-50 p-3 rounded-2xl w-fit mb-4">
                <LayoutDashboard className="text-gray-400 w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-1">View History</h4>
              <p className="text-gray-400 text-sm">Review, edit, or download past submissions.</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                <button className="text-sm font-semibold text-cyan-600">View All</button>
              </div>
              <div className="p-0">
                {recentReports && recentReports.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {recentReports.map((report) => (
                      <div key={report.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">Report #{report.id}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-tighter">Draft • {report.month}/{report.year}</p>
                          </div>
                        </div>
                        <Link href={`/report/edit/${report.id}`} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No recent reports found.</p>
                    <p className="text-sm text-gray-300 mt-1">Start by clicking 'New Submission'.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-md">
      <div className="w-14 h-14 bg-gray-50 rounded-3xl flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
