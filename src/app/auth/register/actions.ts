'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function register(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const zoneId = formData.get('zone_id') as string
  const userId = (formData.get('user_id') as string)?.trim()

  if (!name || !email || !password || !zoneId || !userId) {
    return redirect('/register?message=সকল তথ্য পূরণ করুন')
  }

  // Enforce simple username rules (alphanumeric, underscores, hyphens, min 3 chars)
  const userIdRegex = /^[a-zA-Z0-9_-]+$/
  if (userId.length < 3 || !userIdRegex.test(userId)) {
    return redirect('/register?message=ইউজার আইডি কমপক্ষে ৩ অক্ষরের হতে হবে এবং শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, বা _ - ব্যবহার করা যাবে।')
  }

  if (password.length < 6) {
    return redirect('/register?message=পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
  }

  // Check if User ID is already taken
  const { createClient } = await import('@supabase/supabase-js')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: existingUser, error: queryError } = await adminSupabase
    .from('people')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingUser) {
    return redirect('/register?message=এই ইউজার আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য একটি নির্বাচন করুন।')
  }

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        name, 
        zone_id: parseInt(zoneId),
        user_id: userId,
      },
    },
  })

  if (authError) {
    const msg = authError.message === 'User already registered' 
      ? 'এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে।' 
      : authError.message
    return redirect(`/register?message=${encodeURIComponent(msg)}`)
  }

  // Sign out immediately — user must wait for admin approval
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/pending-approval')
}
