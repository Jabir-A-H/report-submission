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
    return redirect('/login?message=সকল তথ্য পূরণ করুন')
  }

  if (password.length < 6) {
    return redirect('/login?message=পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
  }

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // Store name in auth metadata for convenience
    },
  })

  if (authError) {
    const msg = authError.message === 'User already registered' 
      ? 'এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে।' 
      : authError.message
    return redirect(`/login?message=${encodeURIComponent(msg)}`)
  }

  // 2. Generate a 3-digit user_id (matching legacy convention)
  const { data: maxUser } = await supabase
    .from('people')
    .select('user_id')
    .order('user_id', { ascending: false })
    .limit(1)
    .single()

  const nextUserId = maxUser?.user_id 
    ? String(Number(maxUser.user_id) + 1).padStart(3, '0')
    : '001'

  // 3. Insert into people table (inactive by default — needs admin approval)
  const { error: profileError } = await supabase
    .from('people')
    .insert({
      user_id: nextUserId,
      name,
      email,
      role: 'user',
      active: false,
      zone_id: parseInt(zoneId),
      supabase_uid: authData.user?.id,
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return redirect(`/login?message=${encodeURIComponent('প্রোফাইল তৈরিতে সমস্যা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।')}`)
  }

  // Sign out immediately — user must wait for admin approval
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/pending-approval')
}
