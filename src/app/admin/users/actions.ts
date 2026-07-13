'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function deleteUserAction(supabaseUid: string | null, peopleId: number) {
  const requesterSupabase = await createServerClient()
  const {
    data: { user },
  } = await requesterSupabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: requesterProfile, error: requesterProfileError } = await requesterSupabase
    .from('people')
    .select('role')
    .eq('supabase_uid', user.id)
    .maybeSingle()

  if (requesterProfileError || !requesterProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  if (supabaseUid && supabaseUid === user.id) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (supabaseUid) {
    // Delete from auth.users — the FK cascade automatically deletes the people row
    const { error } = await adminSupabase.auth.admin.deleteUser(supabaseUid)
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // No auth account linked, delete the people row directly
    const { error } = await adminSupabase.from('people').delete().eq('id', peopleId)
    if (error) {
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}
