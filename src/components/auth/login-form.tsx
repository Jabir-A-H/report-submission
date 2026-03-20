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

    // Check custom active status in people table
    const { data: profile, error: profileError } = await supabase
      .from('people')
      .select('active')
      .eq('email', email) // Using email as a backup if user_id mapping isn't 1:1 yet
      .single()

    if (profileError || !profile?.active) {
      await supabase.auth.signOut()
      setError('Your account is pending admin approval.')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-2xl border border-white/20 light-catch mt-20">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-primary mb-3 tracking-tight">Login</h2>
        <p className="text-sm text-foreground/50">Access your report dashboard</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Email Address</label>
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
          <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-white/50 dark:bg-black/20 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Login to Dashboard
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
