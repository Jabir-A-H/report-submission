'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/home/actions'
import { RegisterFormClient } from './register-form-client'
import { LogIn, UserPlus, Lock, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/language-provider'
import { createClient } from '@/utils/supabase/client'

export function AuthPortalClient({
  zones,
  initialMode = 'login',
  errorMessage,
}: {
  zones: { id: number; name: string }[] | null
  initialMode?: 'login' | 'register'
  errorMessage?: string
}) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode)
  const [loading, setLoading] = useState(false)
  const { t, language } = useLanguage()
  const router = useRouter()

  // Ensure logged-in users navigating via client router or cached history are redirected
  const supabase = useMemo(() => createClient(), [])
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/')
      }
    })
  }, [router, supabase])

  // Update tab when URL param changes
  useEffect(() => {
    setActiveTab(initialMode)
  }, [initialMode])

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Tab Content */}
      <div className="bg-card/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-border/80 shadow-2xl shadow-primary/5">
        {activeTab === 'login' ? (
          <form
            action={async (formData) => {
              setLoading(true)
              await login(formData)
              setLoading(false)
            }}
            className="animate-in fade-in duration-300 flex flex-col gap-4"
          >
            <div>
              <h3 className="text-xl font-black text-foreground mb-0.5">
                {language === 'bn' ? 'স্বাগতম!' : 'Welcome Back!'}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                {language === 'bn'
                  ? 'ড্যাশবোর্ডে প্রবেশ করতে আপনার আইডি ও পাসওয়ার্ড দিন'
                  : 'Enter your ID and password to access the dashboard'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block"
                  htmlFor="email"
                >
                  {language === 'bn' ? 'ইউজার আইডি / ইমেইল' : 'User ID / Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    className="modern-input !pl-10 !pr-3.5 w-full h-10 text-sm bg-muted/40 focus:bg-background transition-colors rounded-xl border border-border"
                    name="email"
                    tabIndex={1}
                    placeholder="user123 or name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block"
                  htmlFor="password"
                >
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    className="modern-input !pl-10 !pr-3.5 w-full h-10 text-sm bg-muted/40 focus:bg-background transition-colors tracking-widest rounded-xl border border-border"
                    type="password"
                    name="password"
                    tabIndex={2}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    tabIndex={4}
                    className="text-[11px] font-bold text-primary hover:underline underline-offset-2 transition-colors"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="submit"
              tabIndex={3}
              disabled={loading}
              className="modern-btn btn-primary h-10 text-sm font-bold w-full flex items-center justify-center gap-2 group mt-1 shadow-lg shadow-primary/15 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{language === 'bn' ? 'লগ-ইন করুন' : 'Sign In'}</span>
                  <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center pt-3 text-xs text-muted-foreground font-medium border-t border-border/40 mt-1">
              <span>{language === 'bn' ? 'অ্যাকাউন্ট নেই?' : 'Don’t have an account?'}</span>
              <button
                type="button"
                tabIndex={5}
                onClick={() => setActiveTab('register')}
                className="text-primary font-bold underline underline-offset-2 ml-1.5 hover:opacity-80 transition-opacity"
              >
                {language === 'bn' ? 'নিবন্ধন করুন' : 'Register now'}
              </button>
            </div>

            {errorMessage && activeTab === 'login' && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-center font-bold text-xs animate-in zoom-in duration-300">
                {errorMessage === 'Could not authenticate user' || errorMessage === 'Invalid login credentials'
                  ? 'ভুল আইডি অথবা পাসওয়ার্ড প্রদান করেছেন।'
                  : errorMessage}
              </div>
            )}
          </form>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4">
              <h3 className="text-xl font-black text-foreground mb-0.5">
                {language === 'bn' ? 'নতুন নিবন্ধন!' : 'Create Account!'}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                {language === 'bn'
                  ? 'রিপোর্ট সিস্টেমে যুক্ত হতে আপনার সঠিক তথ্য প্রদান করুন'
                  : 'Enter your credentials to join the reporting platform'}
              </p>
            </div>

            <RegisterFormClient
              zones={zones}
              errorMessage={activeTab === 'register' ? errorMessage : undefined}
              onSwitchToLogin={() => setActiveTab('login')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
