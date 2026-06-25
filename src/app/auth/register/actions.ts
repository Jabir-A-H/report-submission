'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
    return redirect(`/register?message=${encodeURIComponent('সকল তথ্য পূরণ করুন')}`)
  }

  // Enforce simple username rules (alphanumeric, underscores, hyphens, min 3 chars)
  const userIdRegex = /^[a-zA-Z0-9_-]+$/
  if (userId.length < 3 || !userIdRegex.test(userId)) {
    return redirect(`/register?message=${encodeURIComponent('ইউজার আইডি কমপক্ষে ৩ অক্ষরের হতে হবে এবং শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, বা _ - ব্যবহার করা যাবে।')}`)
  }

  if (password.length < 6) {
    return redirect(`/register?message=${encodeURIComponent('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')}`)
  }

  // Check if User ID is already taken
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: existingUser, error: queryError } = await adminSupabase
    .from('people')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingUser) {
    return redirect(`/register?message=${encodeURIComponent('এই ইউজার আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য একটি নির্বাচন করুন।')}`)
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

  // Supabase silently succeeds (no error) when the email already exists in auth
  // to prevent email enumeration. The giveaway is an empty identities array.
  if (!authData?.user || (authData.user.identities?.length ?? 0) === 0) {
    return redirect(`/register?message=${encodeURIComponent('এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে।')}`)
  }

  // Sign out immediately — user must wait for admin approval
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/pending-approval')
}

// ── Live field-validation helpers (called on blur from the form) ──────────────

/**
 * Check whether an email is already taken in the synchronized people table.
 */
export async function checkEmailAvailability(
  email: string
): Promise<{ available: boolean; message?: string }> {
  if (!email || !email.includes('@')) return { available: true }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existingPerson } = await adminSupabase
    .from('people')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingPerson) {
    return { available: false, message: 'এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে।' }
  }

  return { available: true }
}

/**
 * Check whether a user_id (username) is already taken in the people table.
 */
export async function checkUserIdAvailability(
  userId: string
): Promise<{ available: boolean; message?: string }> {
  if (!userId || userId.length < 3) return { available: true }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existingUser } = await adminSupabase
    .from('people')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingUser) {
    return { available: false, message: 'এই ইউজার আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' }
  }

  return { available: true }
}
