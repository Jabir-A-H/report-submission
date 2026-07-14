'use client'

import { useState, useRef } from 'react'
import { register, checkEmailAvailability, checkUserIdAvailability } from '@/app/home/actions'
import { UserPlus, Loader2, CheckCircle2, XCircle, User, Tag, Mail, Lock, MapPin } from 'lucide-react'
import Link from 'next/link'

type FieldStatus = 'idle' | 'checking' | 'available' | 'taken'

function FieldBadge({ status, message }: { status: FieldStatus; message?: string }) {
  if (status === 'idle') return null

  if (status === 'checking') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mt-1 animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        যাচাই করা হচ্ছে…
      </span>
    )
  }

  if (status === 'available') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 mt-1 animate-in fade-in duration-200">
        <CheckCircle2 className="w-3 h-3" />
        পাওয়া যাচ্ছে
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 mt-1 animate-in fade-in duration-200">
      <XCircle className="w-3 h-3" />
      {message || 'ইতিমধ্যে ব্যবহার করা হয়েছে'}
    </span>
  )
}

export function RegisterFormClient({ 
  zones, 
  errorMessage,
  onSwitchToLogin,
}: { 
  zones: { id: number; name: string }[] | null,
  errorMessage?: string,
  onSwitchToLogin?: () => void
}) {
  const [loading, setLoading] = useState(false)

  // On-blur validation state
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle')
  const [emailMessage, setEmailMessage] = useState<string>()
  const [userIdStatus, setUserIdStatus] = useState<FieldStatus>('idle')
  const [userIdMessage, setUserIdMessage] = useState<string>()

  // Track current values so we can debounce / cancel stale checks
  const emailRef = useRef('')
  const userIdRef = useRef('')

  async function handleEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim()
    emailRef.current = value
    if (!value || !value.includes('@')) {
      setEmailStatus('idle')
      return
    }
    setEmailStatus('checking')
    const result = await checkEmailAvailability(value)
    if (emailRef.current !== value) return
    setEmailStatus(result.available ? 'available' : 'taken')
    setEmailMessage(result.message)
  }

  async function handleUserIdBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim()
    userIdRef.current = value
    if (!value || value.length < 3) {
      setUserIdStatus('idle')
      return
    }
    setUserIdStatus('checking')
    const result = await checkUserIdAvailability(value)
    if (userIdRef.current !== value) return
    setUserIdStatus(result.available ? 'available' : 'taken')
    setUserIdMessage(result.message)
  }

  const hasBlockingError = emailStatus === 'taken' || userIdStatus === 'taken'

  return (
    <form 
      action={async (formData) => {
        if (hasBlockingError) return
        setLoading(true)
        await register(formData)
        // If register returns, it means there was an error redirect.
        // We set loading back to false so the user can try again.
        setLoading(false)
      }} 
      className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground"
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="name">
              পূর্ণ নাম
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="modern-input !pl-12 !pr-4 w-full h-12 text-base bg-muted/40 focus:bg-background transition-colors rounded-xl border border-border"
              name="name"
              placeholder="আপনার পূর্ণ নাম"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="user_id">
              ইউজার আইডি (ইউনিক)
          </label>
          <div className="relative">
            <Tag className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className={`modern-input !pl-12 !pr-4 w-full h-12 text-base bg-muted/40 focus:bg-background transition-colors rounded-xl border ${
                userIdStatus === 'taken' ? 'border-red-500' : userIdStatus === 'available' ? 'border-green-500' : 'border-border'
              }`}
              name="user_id"
              placeholder="যেমন: user123"
              pattern="^[a-zA-Z0-9_-]{3,20}$"
              title="ইউজার আইডি কমপক্ষে ৩ অক্ষরের হতে হবে এবং শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা বা _ - ব্যবহার করা যাবে।"
              onBlur={handleUserIdBlur}
              onChange={() => setUserIdStatus('idle')}
              required
            />
          </div>
          <FieldBadge status={userIdStatus} message={userIdMessage} />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="email">
              ইমেইল এড্রেস
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className={`modern-input !pl-12 !pr-4 w-full h-12 text-base bg-muted/40 focus:bg-background transition-colors rounded-xl border ${
                emailStatus === 'taken' ? 'border-red-500' : emailStatus === 'available' ? 'border-green-500' : 'border-border'
              }`}
              name="email"
              type="email"
              placeholder="name@example.com"
              onBlur={handleEmailBlur}
              onChange={() => setEmailStatus('idle')}
              required
            />
          </div>
          <FieldBadge status={emailStatus} message={emailMessage} />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="password">
              পাসওয়ার্ড
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="modern-input !pl-12 !pr-4 w-full h-12 text-base bg-muted/40 focus:bg-background transition-colors tracking-widest rounded-xl border border-border"
              type="password"
              name="password"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block" htmlFor="zone_id">
              জোন নির্বাচন করুন
          </label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-muted-foreground/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              name="zone_id"
              required
              className="modern-input !pl-12 !pr-8 w-full h-12 text-base bg-muted/40 focus:bg-background transition-colors rounded-xl border border-border cursor-pointer"
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
      </div>

      <button 
        type="submit" 
        disabled={loading || hasBlockingError || emailStatus === 'checking' || userIdStatus === 'checking'}
        className="modern-btn btn-primary h-14 text-lg font-bold w-full flex items-center justify-center gap-3 group mt-2 shadow-xl shadow-primary/20 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            নিবন্ধন করুন
            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </>
        )}
      </button>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-sm text-muted-foreground font-medium gap-4 border-t border-border/40 mt-4">
        {!onSwitchToLogin && (
          <Link href="/home" className="hover:text-primary transition-colors">
            &larr; হোম পেজ
          </Link>
        )}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="hover:text-primary transition-colors gap-1 mx-auto sm:ml-auto flex items-center"
          >
            অ্যাকাউন্ট আছে?
            <span className="text-primary font-bold underline underline-offset-2 ml-1">লগ-ইন করুন</span>
          </button>
        ) : (
          <Link href="/login" className="hover:text-primary transition-colors gap-1">
            অ্যাকাউন্ট আছে?
            <span className="text-primary font-bold underline underline-offset-2 ml-1">লগ-ইন করুন</span>
          </Link>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300">
          {errorMessage}
        </div>
      )}
    </form>
  )
}
