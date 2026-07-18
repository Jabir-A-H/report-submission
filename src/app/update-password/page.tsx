import { updatePassword } from './actions'
import { Building2, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getServerLanguage } from "@/lib/i18n";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  
  const { t } = await getServerLanguage();

  // Guard: Only allow users with a valid session to update their password.
  // The /auth/callback route exchanges the email code for a session before
  // redirecting the user here.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/home?mode=login&message=${encodeURIComponent(t.linkExpired)}`);
  }

  return (
    <div className="flex-1 grid lg:grid-cols-2 relative bg-background">
      
      {/* Decorative Background Elements (contained inside absolute inset-0 overflow-hidden, optimized for low-end mobile GPUs) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -right-32 sm:-top-64 sm:-right-64 w-80 sm:w-[800px] h-80 sm:h-[800px] bg-primary/5 rounded-full blur-2xl sm:blur-3xl transform-gpu" />
        <div className="hidden sm:block absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl transform-gpu" />
      </div>

      {/* Left Panel: Branding / Messaging */}
      <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden bg-linear-to-br from-primary/10 to-primary/5 border-r border-border/50">
        <div className="max-w-md mx-auto relative z-10">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 transform -rotate-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-foreground mb-6 leading-tight font-bengali whitespace-pre-wrap">
            {t.setNewPassword}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.newPasswordDesc}
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
            <h2 className="text-3xl font-black text-foreground mb-2">{t.newPasswordLabel}</h2>
            <p className="text-muted-foreground font-medium">{t.enterNewPassword}</p>
          </div>

          <form action={updatePassword} className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground">
            
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="password">
                     {t.newPasswordLabel}
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
                     {t.confirmPassword}
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
               {t.savePassword}
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
