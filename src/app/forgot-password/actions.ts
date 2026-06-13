'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string
  
  if (!email || !email.includes('@')) {
    return redirect('/forgot-password?message=সঠিক ইমেইল প্রদান করুন।')
  }

  const supabase = await createClient()

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel if mapped.
      process?.env?.VERCEL_URL ?? // Automatically set by Vercel on server-side.
      'http://localhost:3000/'
    
    url = url.startsWith('http') ? url : `https://${url}`
    url = url.endsWith('/') ? url : `${url}/`
    return url
  }

  // Send the password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Redirect to the callback route which handles the PKCE code exchange
    // and then forwards the user to the update-password page.
    redirectTo: `${getURL()}auth/callback?next=/update-password`,
  })

  if (error) {
    return redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`)
  }

  return redirect('/forgot-password?success=true')
}
