'use server'

import { createClient } from '@supabase/supabase-js'

export async function deleteUserAction(supabaseUid: string | null, peopleId: number) {
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
