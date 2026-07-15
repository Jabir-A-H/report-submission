import { forgotPassword } from './actions'
import { Building2, KeyRound, MailCheck } from 'lucide-react'
import Link from 'next/link'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>
}) {
  const resolvedParams = await searchParams;

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
          <h1 className="text-5xl font-black text-foreground mb-6 leading-tight font-bengali">
            পাসওয়ার্ড<br/>পুনরুদ্ধার
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            আপনার অ্যাকাউন্টের সাথে যুক্ত ইমেইল ঠিকানা প্রদান করুন। আমরা আপনাকে পাসওয়ার্ড পরিবর্তন করার জন্য একটি লিঙ্ক পাঠাব।
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

          {resolvedParams?.success === 'true' ? (
             <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailCheck className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-foreground mb-2">ইমেইল পাঠানো হয়েছে!</h2>
                  <p className="text-muted-foreground font-medium">আপনার ইমেইলের ইনবক্স চেক করুন এবং পাসওয়ার্ড রিসেট লিঙ্কে ক্লিক করুন।</p>
                </div>
                <Link href="/home" className="modern-btn btn-primary h-14 text-lg font-bold w-full flex items-center justify-center bg-primary text-primary-foreground rounded-xl shadow-xl shadow-primary/20 mt-8 hover:opacity-90">
                  লগ-ইন পেজে ফিরে যান
                </Link>
             </div>
          ) : (
             <>
                <div>
                  <h2 className="text-3xl font-black text-foreground mb-2">পাসওয়ার্ড ভুলে গেছেন?</h2>
                  <p className="text-muted-foreground font-medium">আপনার ইমেইল এড্রেস লিখুন</p>
                </div>

                <form action={forgotPassword} className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground">
                  
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="email">
                           ইমেইল এড্রেস
                        </label>
                        <input
                          className="modern-input w-full h-14 text-lg bg-muted/40 focus:bg-background transition-colors px-4 rounded-xl border border-border"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          required
                        />
                     </div>
                  </div>

                  <button type="submit" className="modern-btn btn-primary h-14 text-lg font-bold w-full flex items-center justify-center gap-3 group mt-2 shadow-xl shadow-primary/20 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
                     রিসেট লিঙ্ক পাঠান
                     <KeyRound className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-center pt-4 text-sm text-muted-foreground font-medium border-t border-border/40 mt-4">
                    <Link href="/home" className="hover:text-primary transition-colors flex items-center gap-2">
                      &larr; লগ-ইন পেজে ফিরে যান
                    </Link>
                  </div>

                  {resolvedParams?.message && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300">
                      {resolvedParams.message}
                    </div>
                  )}
                  
                </form>
             </>
          )}

        </div>
      </div>
    </div>
  )
}
