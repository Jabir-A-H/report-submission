'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string
  
  if (!email || !email.includes('@')) {
    return redirect('/forgot-password?message=সঠিক ইমেইল প্রদান করুন।')
  }

  const supabase = await createClient()

  // Send the password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Redirect to the callback route which handles the PKCE code exchange
    // and then forwards the user to the update-password page.
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/update-password`,
  })

  if (error) {
    return redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`)
  }

  return redirect('/forgot-password?success=true')
}
