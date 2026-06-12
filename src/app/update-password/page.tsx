import { updatePassword } from './actions'
import { Building2, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  
  // Guard: Only allow users with a valid session to update their password.
  // The /auth/callback route exchanges the email code for a session before
  // redirecting the user here.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?message=লিঙ্কটি মেয়াদোত্তীর্ণ বা অবৈধ। আবার চেষ্টা করুন।');
  }

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
            নতুন পাসওয়ার্ড<br/>সেট করুন
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            আপনার অ্যাকাউন্টের জন্য একটি নতুন এবং সুরক্ষিত পাসওয়ার্ড তৈরি করুন। পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-24">
        
        <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Mobile Branding Logo */}
          <div className="lg:hidden w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground mb-2">নতুন পাসওয়ার্ড</h2>
            <p className="text-muted-foreground font-medium">আপনার নতুন পাসওয়ার্ডটি লিখুন</p>
          </div>

          <form action={updatePassword} className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground">
            
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="password">
                     নতুন পাসওয়ার্ড
                  </label>
                  <input
                    className="modern-input w-full h-14 text-lg bg-muted/40 focus:bg-background transition-colors tracking-widest px-4 rounded-xl border border-border"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
               </div>
               
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="confirmPassword">
                     পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <input
                    className="modern-input w-full h-14 text-lg bg-muted/40 focus:bg-background transition-colors tracking-widest px-4 rounded-xl border border-border"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
               </div>
            </div>

            <button type="submit" className="modern-btn btn-primary h-14 text-lg font-bold w-full flex items-center justify-center gap-3 group mt-2 shadow-xl shadow-primary/20 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
               পাসওয়ার্ড সেভ করুন
               <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {resolvedParams?.message && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300 mt-4">
                {resolvedParams.message}
              </div>
            )}
            
          </form>

        </div>
      </div>
    </div>
  )
}
