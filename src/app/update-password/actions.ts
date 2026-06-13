'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (!password || password.length < 6) {
    return redirect(`/update-password?message=${encodeURIComponent('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।')}`)
  }

  if (password !== confirmPassword) {
    return redirect(`/update-password?message=${encodeURIComponent('পাসওয়ার্ড মিলছে না।')}`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return redirect(`/update-password?message=${encodeURIComponent(error.message)}`)
  }

  // Once updated successfully, redirect them to login with a success message
  // First sign them out so they have to log back in with the new password
  await supabase.auth.signOut()
  
  return redirect(`/login?message=${encodeURIComponent('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগ-ইন করুন।')}`)
}
