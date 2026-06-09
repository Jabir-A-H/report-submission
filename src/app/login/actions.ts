'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Support legacy user IDs by transforming them into emails (e.g., 001 -> 001@report.local)
  const rawIdOrEmail = formData.get('email') as string
  const email = rawIdOrEmail.includes('@') ? rawIdOrEmail : `${rawIdOrEmail}@report.local`
  const password = formData.get('password') as string

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Return the exact error message so we know if it's "Email not confirmed", "Invalid login credentials", etc.
    return redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  // Check if user is active using the user object returned from signInWithPassword
  // We must create a new client using the explicit session token because the SSR client
  // still reads from stale request cookies, causing RLS to block the query.
  if (authData?.user && authData?.session) {
    const { createClient } = await import('@supabase/supabase-js');
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`
          }
        }
      }
    );

    const { data: profile, error: profileError } = await userClient
      .from('people')
      .select('active')
      .eq('supabase_uid', authData.user.id)
      .single()

    if (profileError) {
      await supabase.auth.signOut()
      return redirect(`/login?message=${encodeURIComponent('প্রোফাইল চেক করতে সমস্যা হয়েছে: ' + profileError.message)}`)
    }

    if (!profile.active) {
      await supabase.auth.signOut()
      return redirect('/pending-approval')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
