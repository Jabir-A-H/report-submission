'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLanguage } from '@/components/providers/language-provider'
import { translateAuthError } from '@/lib/i18n'
import { Loader2 } from 'lucide-react'

interface GoogleSignInButtonProps {
  label?: string
  onError?: (errorMessage: string) => void
  disabled?: boolean
  className?: string
}

export function GoogleSignInButton({
  label,
  onError,
  disabled = false,
  className = '',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const { language } = useLanguage()
  const supabase = useMemo(() => createClient(), [])

  const defaultLabel =
    label ||
    (language === 'bn'
      ? 'গুগল দিয়ে সাইন-ইন করুন'
      : 'Sign in with Google')

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        const localizedMsg = translateAuthError(error.message)
        if (onError) onError(localizedMsg)
        setLoading(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const localizedMsg = translateAuthError(msg)
      if (onError) onError(localizedMsg)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleGoogleSignIn}
      className={`w-full h-10 px-4 rounded-xl border border-border bg-background hover:bg-muted/60 text-foreground text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      ) : (
        <>
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>{defaultLabel}</span>
        </>
      )}
    </button>
  )
}
