'use server'

import { revalidatePath } from 'next/cache'
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
    .select('id, role, active')
    .eq('supabase_uid', user.id)
    .maybeSingle()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active) {
    return { success: false, error: 'Unauthorized' }
  }

  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 2. Look up target profile from people using service role client
  const { data: targetProfile, error: targetError } = await adminSupabase
    .from('people')
    .select('id, role, supabase_uid, name')
    .eq('id', peopleId)
    .maybeSingle()

  if (targetError || !targetProfile) {
    return { success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' }
  }

  // 3. Self-deletion guard: Check both supabase_uid and people id
  if (
    (targetProfile.supabase_uid && targetProfile.supabase_uid === user.id) ||
    targetProfile.id === requesterProfile.id
  ) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' }
  }

  // 4. Strict 2-tier role hierarchy
  if (requesterProfile.role === 'admin') {
    if (targetProfile.role === 'admin' || targetProfile.role === 'superadmin') {
      return {
        success: false,
        error: 'অ্যাডমিনরা অন্য অ্যাডমিন বা সুপারঅ্যাডমিন অ্যাকাউন্ট ডিলিট করতে পারবেন না।',
      }
    }
  } else if (requesterProfile.role === 'superadmin') {
    if (targetProfile.role === 'superadmin') {
      const { count, error: countError } = await adminSupabase
        .from('people')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'superadmin')

      if (countError || (count !== null && count <= 1)) {
        return {
          success: false,
          error: 'সিস্টেমে অন্তত একজন সুপারঅ্যাডমিন থাকতে হবে। এটি ডিলিট করা সম্ভব নয়।',
        }
      }
    }
  }

  // 5. Execute deletion: if target has auth user, delete from auth.users (cascades); else delete people row
  if (targetProfile.supabase_uid) {
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(
      targetProfile.supabase_uid
    )
    if (deleteAuthError) {
      return { success: false, error: deleteAuthError.message }
    }
  } else {
    const { error: deletePeopleError } = await adminSupabase
      .from('people')
      .delete()
      .eq('id', targetProfile.id)
    if (deletePeopleError) {
      return { success: false, error: deletePeopleError.message }
    }
  }

  return { success: true }
}

export async function toggleUserActiveAction(peopleId: number) {
  const requesterSupabase = await createServerClient()
  const {
    data: { user },
  } = await requesterSupabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: requesterProfile, error: requesterProfileError } = await requesterSupabase
    .from('people')
    .select('id, role, active')
    .eq('supabase_uid', user.id)
    .maybeSingle()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active) {
    return { success: false, error: 'Unauthorized' }
  }

  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: targetProfile, error: targetError } = await adminSupabase
    .from('people')
    .select('id, role, active, zone_id, supabase_uid')
    .eq('id', peopleId)
    .maybeSingle()

  if (targetError || !targetProfile) {
    return { success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' }
  }

  // Self-deactivation guard
  if (
    (targetProfile.supabase_uid && targetProfile.supabase_uid === user.id) ||
    targetProfile.id === requesterProfile.id
  ) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।' }
  }

  // Role hierarchy guard
  if (requesterProfile.role === 'admin' && (targetProfile.role === 'admin' || targetProfile.role === 'superadmin')) {
    return {
      success: false,
      error: 'অ্যাডমিনরা অন্য অ্যাডমিন বা সুপারঅ্যাডমিন অ্যাকাউন্ট পরিবর্তন করতে পারবেন না।',
    }
  }

  const newActiveState = !targetProfile.active

  // Guard activation if zone_id is null
  if (newActiveState && !targetProfile.zone_id) {
    return {
      success: false,
      error: 'ইউজার সক্রিয় করার পূর্বে অনুগ্রহ করে জোন নির্ধারণ করুন।',
    }
  }

  const { error: updateError } = await adminSupabase
    .from('people')
    .update({ active: newActiveState })
    .eq('id', peopleId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, active: newActiveState }
}

export async function changeUserZoneAction(peopleId: number, newZoneId: number | null) {
  const requesterSupabase = await createServerClient()
  const {
    data: { user },
  } = await requesterSupabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: requesterProfile, error: requesterProfileError } = await requesterSupabase
    .from('people')
    .select('id, role, active')
    .eq('supabase_uid', user.id)
    .maybeSingle()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active) {
    return { success: false, error: 'Unauthorized' }
  }

  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: targetProfile, error: targetError } = await adminSupabase
    .from('people')
    .select('id, role, active, zone_id, supabase_uid')
    .eq('id', peopleId)
    .maybeSingle()

  if (targetError || !targetProfile) {
    return { success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' }
  }

  if (requesterProfile.role === 'admin' && (targetProfile.role === 'admin' || targetProfile.role === 'superadmin')) {
    return {
      success: false,
      error: 'অ্যাডমিনরা অন্য অ্যাডমিন বা সুপারঅ্যাডমিন অ্যাকাউন্ট পরিবর্তন করতে পারবেন না।',
    }
  }

  // Active users must have a zone
  if (targetProfile.active && !newZoneId) {
    return {
      success: false,
      error: 'সক্রিয় ইউজারের জোন খালি রাখা যাবে না।',
    }
  }

  const { error: updateError } = await adminSupabase
    .from('people')
    .update({ zone_id: newZoneId })
    .eq('id', peopleId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

export async function createZoneAction(data: {
  name: string
  zone_type?: string
  parent_id?: number | null
}) {
  const requesterSupabase = await createServerClient()
  const {
    data: { user },
  } = await requesterSupabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: requesterProfile, error: requesterProfileError } = await requesterSupabase
    .from('people')
    .select('id, role, active')
    .eq('supabase_uid', user.id)
    .maybeSingle()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active) {
    return { success: false, error: 'Unauthorized' }
  }

  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  const trimmedName = data.name?.trim() || ''
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return { success: false, error: 'জোনের নাম ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে।' }
  }

  const zoneType = data.zone_type || 'zone'
  if (zoneType === 'city' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'শুধুমাত্র সুপারঅ্যাডমিন সিটি টাইপ জোন তৈরি করতে পারেন।' }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check duplicate zone name
  const { data: existingZone } = await adminSupabase
    .from('zone')
    .select('id')
    .ilike('name', trimmedName.replace(/[%_]/g, '\\$&'))
    .maybeSingle()

  if (existingZone) {
    return { success: false, error: 'এই নামের একটি জোন ইতিমধ্যে রয়েছে।' }
  }

  const parentId =
    data.parent_id !== undefined && data.parent_id !== null && (data.parent_id as any) !== ''
      ? Number(data.parent_id)
      : null

  // Clean insert via service role client (no 42703 shims)
  const { data: newZone, error: insertError } = await adminSupabase
    .from('zone')
    .insert({
      name: trimmedName,
      zone_type: zoneType,
      parent_id: parentId,
    })
    .select()
    .single()

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidatePath('/(admin)/management')
  revalidatePath('/management')
  revalidatePath('/home')

  return { success: true, data: newZone }
}

export async function deleteZoneAction(zoneId: number) {
  const requesterSupabase = await createServerClient()
  const {
    data: { user },
  } = await requesterSupabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: requesterProfile, error: requesterProfileError } = await requesterSupabase
    .from('people')
    .select('id, role, active')
    .eq('supabase_uid', user.id)
    .maybeSingle()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active) {
    return { success: false, error: 'Unauthorized' }
  }

  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  // DCS Protection Guard
  if (zoneId === 1) {
    return { success: false, error: 'কেন্দ্রীয় সিটি জোন (DCS) ডিলিট করা সম্ভব নয়।' }
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Live parallel dependency counts against PostgreSQL
  const [usersRes, reportsRes, childZonesRes] = await Promise.all([
    adminSupabase.from('people').select('*', { count: 'exact', head: true }).eq('zone_id', zoneId),
    adminSupabase.from('report').select('*', { count: 'exact', head: true }).eq('zone_id', zoneId),
    adminSupabase.from('zone').select('*', { count: 'exact', head: true }).eq('parent_id', zoneId),
  ])

  const childZonesCount = childZonesRes.count ?? 0
  const usersCount = usersRes.count ?? 0
  const reportsCount = reportsRes.count ?? 0

  if (childZonesCount > 0) {
    return { success: false, error: 'এই জোনের অধীনে অধীনস্থ জোন রয়েছে। আগে সেগুলো পরিবর্তন বা মুছে নিন।' }
  }

  if (usersCount > 0 || reportsCount > 0) {
    return { success: false, error: 'এই জোনে ইউজার বা রিপোর্ট যুক্ত আছে। আগে সেগুলো সরিয়ে নিন।' }
  }

  const { error: deleteError } = await adminSupabase
    .from('zone')
    .delete()
    .eq('id', zoneId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath('/(admin)/management')
  revalidatePath('/management')
  revalidatePath('/home')

  return { success: true }
}
