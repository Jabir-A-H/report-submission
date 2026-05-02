'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { register } from '@/app/auth/register/actions'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterForm() {
  const [zones, setZones] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchZones() {
      const { data } = await supabase.from('zone').select('id, name').order('name')
      if (data) setZones(data)
    }
    fetchZones()
  }, [])

  return (
    <div className="w-full max-w-md p-8 pt-10 bg-transparent">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-primary mb-2 tracking-tighter uppercase whitespace-pre-line">
          নিবন্ধন করুন
        </h2>
        <p className="text-sm text-muted-foreground font-bold italic">একটি নতুন অ্যাকাউন্ট তৈরি করুন</p>
      </div>

      <form
        action={async (formData) => {
          setLoading(true)
          setError(null)
          try {
            await register(formData)
          } catch (e: any) {
            setError(e?.message || 'একটি সমস্যা হয়েছে।')
            setLoading(false)
          }
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
            পূর্ণ নাম
          </label>
          <input
            type="text"
            name="name"
            className="w-full p-4 bg-white/50 dark:bg-black/20 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            placeholder="আপনার পূর্ণ নাম"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
            ইমেইল এড্রেস
          </label>
          <input
            type="email"
            name="email"
            className="w-full p-4 bg-white/50 dark:bg-black/20 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
            পাসওয়ার্ড
          </label>
          <input
            type="password"
            name="password"
            className="modern-input h-14"
            placeholder="••••••••"
            minLength={6}
            required
          />
          <p className="text-[10px] text-muted-foreground ml-1 font-bold">কমপক্ষে ৬ অক্ষর</p>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
            জোন নির্বাচন করুন
          </label>
          <select
            name="zone_id"
            required
            className="w-full p-4 bg-white/50 dark:bg-black/20 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium appearance-none cursor-pointer"
          >
            <option value="">-- জোন নির্বাচন করুন --</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
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
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>নিবন্ধন করুন</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
