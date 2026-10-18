'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { translateAuthError } from '@/lib/i18n'

export async function login(formData: FormData) {
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
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )

  // Support user IDs by resolving them to their registered email dynamically
  const rawIdOrEmail = (formData.get('email') as string)?.trim() || ""

  if (!rawIdOrEmail) {
    return redirect(`/home?mode=login&message=${encodeURIComponent('ইউজার আইডি বা ইমেইল এবং পাসওয়ার্ড দিন')}`)
  }

  let email = rawIdOrEmail

  if (!rawIdOrEmail.includes('@')) {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Try exact match first
    let { data: profile } = await adminSupabase
      .from('people')
      .select('email')
      .eq('user_id', rawIdOrEmail)
      .maybeSingle()

    // Fallback to safe case-insensitive lookup (escaping wildcards and capping at 1)
    if (!profile) {
      const escaped = rawIdOrEmail.replace(/[%_]/g, '\\$&')
      const { data: profiles } = await adminSupabase
        .from('people')
        .select('email')
        .ilike('user_id', escaped)
        .limit(1)
      if (profiles && profiles.length > 0) profile = profiles[0]
    }

    if (profile?.email) {
      email = profile.email
    } else {
      // Fallback for custom or legacy local fallback accounts
      email = `${rawIdOrEmail.toLowerCase()}@report.local`
    }
  }

  const password = formData.get('password') as string

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Return localized Bengali error message with tab mode preserved
    return redirect(`/home?mode=login&message=${encodeURIComponent(translateAuthError(error.message))}`)
  }

  // Middleware enforces the active check on the next request to /
  revalidatePath('/', 'layout')
  redirect('/')
}

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

  const name = (formData.get('name') as string)?.trim() || ""
  const email = (formData.get('email') as string)?.trim().toLowerCase() || ""
  const password = (formData.get('password') as string) || ""
  const confirmPassword = (formData.get('confirmPassword') as string) || ""
  const zoneId = (formData.get('zone_id') as string)?.trim() || ""
  const userId = (formData.get('user_id') as string)?.trim().toLowerCase() || ""

  if (!name || !email || !password || !confirmPassword || !zoneId || !userId) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('সকল তথ্য পূরণ করুন')}`)
  }

  const parsedZoneId = parseInt(zoneId, 10)
  if (isNaN(parsedZoneId) || parsedZoneId === 1) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('অননুমোদিত জোন নির্বাচন করা হয়েছে।')}`)
  }

  // Enforce simple username rules (alphanumeric, underscores, hyphens, min 3 chars)
  const userIdRegex = /^[a-zA-Z0-9_-]+$/
  if (userId.length < 3 || !userIdRegex.test(userId)) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('ইউজার আইডি কমপক্ষে ৩ অক্ষরের হতে হবে এবং শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, বা _ - ব্যবহার করা যাবে।')}`)
  }

  if (password.length < 6) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')}`)
  }

  if (password !== confirmPassword) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('পাসওয়ার্ড মিলছে না।')}`)
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify that the requested zone is an active reportable entity (not administrative city entity)
  const { data: targetZone } = await adminSupabase
    .from('zone')
    .select('id, zone_type')
    .eq('id', parsedZoneId)
    .maybeSingle()

  if (!targetZone || targetZone.id === 1 || targetZone.zone_type === 'city') {
    return redirect(`/home?mode=register&message=${encodeURIComponent('অননুমোদিত জোন নির্বাচন করা হয়েছে।')}`)
  }
  
  // Check if User ID is already taken (case-insensitively with wildcard escaping)
  const escapedUserId = userId.replace(/[%_]/g, '\\$&')
  const { data: existingUsers } = await adminSupabase
    .from('people')
    .select('id')
    .ilike('user_id', escapedUserId)
    .limit(1)

  if (existingUsers && existingUsers.length > 0) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('এই ইউজার আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য একটি নির্বাচন করুন।')}`)
  }

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        name, 
        zone_id: parsedZoneId,
        user_id: userId,
      },
    },
  })

  if (authError) {
    const msg = translateAuthError(authError.message)
    return redirect(`/home?mode=register&message=${encodeURIComponent(msg)}`)
  }

  // Supabase silently succeeds (no error) when the email already exists in auth
  // to prevent email enumeration. The giveaway is an empty identities array.
  if (!authData?.user || (authData.user.identities?.length ?? 0) === 0) {
    return redirect(`/home?mode=register&message=${encodeURIComponent('এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে।')}`)
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
  rawEmail: string
): Promise<{ available: boolean; message?: string }> {
  const email = rawEmail?.trim().toLowerCase()
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
  rawUserId: string
): Promise<{ available: boolean; message?: string }> {
  const userId = rawUserId?.trim().toLowerCase()
  if (!userId || userId.length < 3) return { available: true }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const escaped = userId.replace(/[%_]/g, '\\$&')
  const { data: existingUsers } = await adminSupabase
    .from('people')
    .select('id')
    .ilike('user_id', escaped)
    .limit(1)

  if (existingUsers && existingUsers.length > 0) {
    return { available: false, message: 'এই ইউজার আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' }
  }

  return { available: true }
}

