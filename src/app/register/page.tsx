import { register } from '@/app/auth/register/actions'
import { Building2, UserPlus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  
  // Fetch zones for the dropdown
  const { data: zones } = await supabase.from('zone').select('id, name').order('name');

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden bg-background">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Left Panel: Branding / Messaging */}
      <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden bg-linear-to-br from-primary/10 to-primary/5 border-r border-border/50">
        <div className="max-w-md mx-auto relative z-10">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 transform -rotate-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-foreground mb-6 leading-tight font-bengali">
            নতুন অ্যাকাউন্ট<br/>তৈরি করুন
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            রিপোর্ট সিস্টেমে যুক্ত হতে আপনার সঠিক তথ্য দিয়ে নিবন্ধন করুন। আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক অনুমোদিত হওয়ার পর আপনি সিস্টেমে প্রবেশ করতে পারবেন।
          </p>
        </div>
      </div>

      {/* Right Panel: Register Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-24 overflow-y-auto">
        
        <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Mobile Branding Logo */}
          <div className="lg:hidden w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground mb-2">নিবন্ধন!</h2>
            <p className="text-muted-foreground font-medium">আপনার তথ্য প্রদান করুন</p>
          </div>

          <form action={register} className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground">
            
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="name">
                     পূর্ণ নাম
                  </label>
                  <input
                    className="modern-input w-full h-12 text-lg bg-muted/40 focus:bg-background transition-colors px-4 rounded-xl border border-border"
                    name="name"
                    placeholder="আপনার পূর্ণ নাম"
                    required
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="user_id">
                     ইউজার আইডি (ইউনিক)
                  </label>
                  <input
                    className="modern-input w-full h-12 text-lg bg-muted/40 focus:bg-background transition-colors px-4 rounded-xl border border-border"
                    name="user_id"
                    placeholder="যেমন: sumona, user002"
                    pattern="^[a-zA-Z0-9_-]{3,20}$"
                    title="ইউজার আইডি কমপক্ষে ৩ অক্ষরের হতে হবে এবং শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা বা _ - ব্যবহার করা যাবে।"
                    required
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="email">
                     ইমেইল এড্রেস
                  </label>
                  <input
                    className="modern-input w-full h-12 text-lg bg-muted/40 focus:bg-background transition-colors px-4 rounded-xl border border-border"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="password">
                     পাসওয়ার্ড
                  </label>
                  <input
                    className="modern-input w-full h-12 text-lg bg-muted/40 focus:bg-background transition-colors tracking-widest px-4 rounded-xl border border-border"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="zone_id">
                     জোন নির্বাচন করুন
                  </label>
                  <select
                    name="zone_id"
                    required
                    className="modern-input w-full h-12 text-lg bg-muted/40 focus:bg-background transition-colors px-4 rounded-xl border border-border cursor-pointer"
                  >
                    <option value="">-- জোন নির্বাচন করুন --</option>
                    {zones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            <button type="submit" className="modern-btn btn-primary h-14 text-lg font-bold w-full flex items-center justify-center gap-3 group mt-2 shadow-xl shadow-primary/20 rounded-xl bg-primary text-primary-foreground">
               নিবন্ধন করুন
               <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-sm text-muted-foreground font-medium gap-4 border-t border-border/40 mt-4">
              <Link href="/home" className="hover:text-primary transition-colors">
                &larr; হোম পেজ
              </Link>
              <Link href="/login" className="hover:text-primary transition-colors">
                অ্যাকাউন্ট আছে? <span className="text-primary font-bold underline underline-offset-2">লগ-ইন করুন</span>
              </Link>
            </div>

            {resolvedParams?.message && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300">
                {resolvedParams.message}
              </div>
            )}
            
          </form>

        </div>
      </div>
    </div>
  )
}
