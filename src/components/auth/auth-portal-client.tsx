'use client'

import { useState, useEffect } from 'react'
import { login } from '@/app/home/actions'
import { RegisterFormClient } from './register-form-client'
import { LogIn, UserPlus, Lock, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/language-provider'

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

  // Update tab when URL param changes
  useEffect(() => {
    setActiveTab(initialMode)
  }, [initialMode])

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Tab Content */}
      <div className="bg-card/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl shadow-primary/5">
        {activeTab === 'login' ? (
          <form
            action={async (formData) => {
              setLoading(true)
              await login(formData)
              setLoading(false)
            }}
            className="animate-in fade-in duration-300 flex flex-col gap-6"
          >
            <div>
              <h3 className="text-2xl font-black text-foreground mb-1">
                {language === 'bn' ? 'স্বাগতম!' : 'Welcome Back!'}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {language === 'bn'
                  ? 'ড্যাশবোর্ডে প্রবেশ করতে আপনার আইডি ও পাসওয়ার্ড দিন'
                  : 'Enter your ID and password to access the dashboard'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                  htmlFor="email"
                >
                  {language === 'bn' ? 'ইউজার আইডি / ইমেইল' : 'User ID / Email'}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    className="modern-input !pl-12 !pr-4 w-full h-13 text-base bg-muted/40 focus:bg-background transition-colors rounded-xl border border-border"
                    name="email"
                    placeholder="user123 or name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    htmlFor="password"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-primary hover:underline underline-offset-2"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    className="modern-input !pl-12 !pr-4 w-full h-13 text-base bg-muted/40 focus:bg-background transition-colors tracking-widest rounded-xl border border-border"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="modern-btn btn-primary h-14 text-base font-bold w-full flex items-center justify-center gap-3 group mt-2 shadow-xl shadow-primary/20 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{language === 'bn' ? 'লগ-ইন করুন' : 'Sign In'}</span>
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center pt-4 text-sm text-muted-foreground font-medium border-t border-border/40 mt-2">
              <span>{language === 'bn' ? 'অ্যাকাউন্ট নেই?' : 'Don’t have an account?'}</span>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-primary font-bold underline underline-offset-2 ml-1.5 hover:opacity-80 transition-opacity"
              >
                {language === 'bn' ? 'নিবন্ধন করুন' : 'Register now'}
              </button>
            </div>

            {errorMessage && activeTab === 'login' && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-xs animate-in zoom-in duration-300">
                {errorMessage === 'Could not authenticate user' || errorMessage === 'Invalid login credentials'
                  ? 'ভুল আইডি অথবা পাসওয়ার্ড প্রদান করেছেন।'
                  : errorMessage}
              </div>
            )}
          </form>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-foreground mb-1">
                {language === 'bn' ? 'নতুন নিবন্ধন!' : 'Create Account!'}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
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
