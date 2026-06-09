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

  if (!name || !email || !password || !zoneId) {
    return redirect('/register?message=সকল তথ্য পূরণ করুন')
  }

  if (password.length < 6) {
    return redirect('/register?message=পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
  }

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, zone_id: parseInt(zoneId) }, // Store name and zone_id so the database trigger can insert into people
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
