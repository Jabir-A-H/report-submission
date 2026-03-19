import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { FileText, Calendar, MapPin, ChevronRight, Filter } from "lucide-react";

export default async function AdminReports() {
  const supabase = await createClient();

  // Fetch all reports with zone information
  const { data: reports } = await supabase
    .from('report')
    .select(`
      *,
      zone:zone_id (name)
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Report Archive</h2>
          <p className="text-gray-500 mt-1">Review and manage all individual zone submissions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 shadow-sm hover:shadow-md transition-all">
          <Filter size={16} />
          Filters
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b border-gray-50">
              <th className="px-8 py-5">Zone Name</th>
              <th className="px-8 py-5 text-center">Period</th>
              <th className="px-8 py-5 text-center">Type</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reports?.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50/50 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                      <MapPin size={18} />
                    </div>
                    <span className="font-bold text-gray-900">{(report.zone as any)?.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                    <Calendar size={12} />
                    {getMonthName(report.month)} {report.year}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    {report.report_type}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <Link 
                    href={`/report/edit/${report.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black hover:bg-cyan-600 hover:text-white transition-all shadow-sm"
                  >
                    View Details
                    <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!reports?.length && (
          <div className="p-20 text-center text-gray-300 font-medium italic">
            No reports found in the archive.
          </div>
        )}
      </div>
    </div>
  );
}

function getMonthName(month: number) {
  return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
}
