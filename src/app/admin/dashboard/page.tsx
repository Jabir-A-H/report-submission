import { createClient } from "@/utils/supabase/server";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Library,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Users as UsersIcon
} from "lucide-react";
import { CorrectionButton } from "@/components/admin/correction-button";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Current report period (Hardcoded for demo/initial view)
  const YEAR = 2026;
  const MONTH = 3;

  // Fetch aggregated data
  const { data: headerAgg } = await supabase.from('view_city_header_agg').select('*').eq('year', YEAR).eq('month', MONTH).single();
  const { data: courseAgg } = await supabase.from('view_city_course_agg').select('*').eq('year', YEAR).eq('month', MONTH);
  const { data: organizationalAgg } = await supabase.from('view_city_organizational_agg').select('*').eq('year', YEAR).eq('month', MONTH);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Active Analytics</h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2 font-medium">
            <CalendarDays size={18} className="text-cyan-600" />
            Showing data for <span className="font-bold text-gray-900">March 2026</span> (Consolidated City View)
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 shadow-sm hover:shadow-md transition-all">Filter Period</button>
          <button className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all">Generate Full PDF</button>
        </div>
      </div>

      {/* KPI Row (Derived from Headers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard 
          title="Total Muallimas" 
          value={headerAgg?.total_muallima || 0} 
          trend="+5%" 
          positive 
          icon={<UsersIcon size={20} className="text-cyan-600" />} 
          correctionProps={{ year: YEAR, month: MONTH, section: 'header', field: 'total_muallima' }}
        />
        <KPICard 
          title="Total Units" 
          value={headerAgg?.total_unit || 0} 
          trend="+2" 
          positive 
          icon={<Library size={20} className="text-blue-600" />} 
          correctionProps={{ year: YEAR, month: MONTH, section: 'header', field: 'total_unit' }}
        />
        <KPICard 
          title="Trained Muallimas" 
          value={headerAgg?.trained_muallima || 0} 
          trend="-1%" 
          positive={false} 
          icon={<TrendingUp size={20} className="text-indigo-600" />} 
          correctionProps={{ year: YEAR, month: MONTH, section: 'header', field: 'trained_muallima' }}
        />
        <KPICard 
          title="Units w/ Classes" 
          value={headerAgg?.units_with_muallima || 0} 
          trend="0%" 
          positive 
          icon={<Target size={20} className="text-violet-600" />} 
          correctionProps={{ year: YEAR, month: MONTH, section: 'header', field: 'units_with_muallima' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Course Aggregation */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">Course Aggregation</h3>
            <span className="text-xs font-black text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full uppercase tracking-widest">Monthly Sum</span>
          </div>
          <div className="p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] border-b border-gray-50">
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4 text-center">Centers</th>
                  <th className="px-4 py-4 text-center">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courseAgg?.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-4 py-5 font-bold text-gray-800">{c.category}</td>
                    <td className="px-4 py-5 text-center text-gray-500 font-bold group-relative">
                      {c.number}
                      <CorrectionButton 
                        year={YEAR} month={MONTH} section="course" field="number" category={c.category} 
                        currentValue={c.number} 
                      />
                    </td>
                    <td className="px-4 py-5 text-center text-gray-900 font-black">
                      {c.students}
                      <CorrectionButton 
                        year={YEAR} month={MONTH} section="course" field="students" category={c.category} 
                        currentValue={c.students} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Organizational Aggregation */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">Organizational Sums</h3>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Aggregate</span>
          </div>
          <div className="p-8 space-y-6 flex-grow">
            {organizationalAgg?.map((s, i) => (
              <div key={i} className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <BarChart3 size={20} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-end mb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{s.category}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-gray-900">{s.number}</span>
                      <CorrectionButton 
                        year={YEAR} month={MONTH} section="organizational" field="number" category={s.category} 
                        currentValue={s.number} 
                      />
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full w-2/3 opacity-80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, positive, icon, correctionProps }: { 
  title: string, 
  value: number, 
  trend: string, 
  positive: boolean, 
  icon: React.ReactNode,
  correctionProps: { year: number, month: number, section: string, field: string }
}) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-cyan-100/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white transition-all shadow-sm group-hover:shadow text-gray-500 group-hover:text-cyan-600">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${positive ? "text-emerald-500" : "text-rose-500"}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</h4>
        <div className="flex items-center gap-2">
          <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
          <CorrectionButton 
            year={correctionProps.year} 
            month={correctionProps.month} 
            section={correctionProps.section} 
            field={correctionProps.field} 
            currentValue={value} 
          />
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-[2.5] group-hover:bg-cyan-50 transition-all duration-700 pointer-events-none"></div>
    </div>
  )
}

