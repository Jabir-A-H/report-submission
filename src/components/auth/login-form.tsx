'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check custom active status in people table - handle missing table gracefully
    const { data: profile, error: profileError } = await supabase
      .from('people')
      .select('active')
      .eq('email', email)
      .single()

    // If table exists and user is inactive, block them. 
    // If table doesn't exist (profileError.code === '42P01'), allow for now during migration.
    if (profileError) {
      if ((profileError as any).code !== '42P01') {
        console.error('Profile check error:', profileError)
        // For other errors, we might still want to block or allow depending on policy.
        // For now, let's allow if the table is simply missing.
      }
    } else if (profile && !profile.active) {
      await supabase.auth.signOut()
      setError('আপনার অ্যাকাউন্টটি বর্তমানে অ্যাডমিনের অনুমোদনের জন্য অপেক্ষমাণ।')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="w-full max-w-md p-8 pt-10 bg-transparent">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-primary mb-2 tracking-tighter uppercase whitespace-pre-line">
          লগইন করুন
        </h2>
        <p className="text-sm text-muted-foreground font-bold italic">আপনার ড্যাশবোর্ডে প্রবেশ করুন</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ইমেইল এড্রেস</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-white/50 dark:bg-black/20 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            placeholder="name@example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">পাসওয়ার্ড</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modern-input h-14"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="modern-btn btn-primary w-full py-5 font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>লগইন করুন</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

import { ArrowRight } from "lucide-react";
