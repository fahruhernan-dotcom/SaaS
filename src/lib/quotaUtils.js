import { supabase } from './supabase'

/**
 * Centrally calculates the total limit for any feature.
 * Scalable: Just add a new key in plan_configs to support more features.
 */
export async function getFeatureLimit(tenant, configKey) {
  if (!tenant) return 1

  // 1. Get Base Limit from Plan Configs
  const { data: configRow } = await supabase
    .from('plan_configs')
    .select('config_value')
    .eq('config_key', configKey)
    .maybeSingle()

  const config = configRow?.config_value ?? {}
  const plan = tenant.plan || 'starter'
  
  // Default values if not in DB
  const DEFAULTS = {
    business_limit: { starter: 1, pro: 3, business: 999 },
    kandang_limit: { starter: 1, pro: 2, business: 99 },
    team_limit: { starter: 1, pro: 3, business: 99 }
  }

  const baseLimit = config[plan] ?? DEFAULTS[configKey]?.[plan] ?? 1
  return baseLimit
}

/**
 * Calculates additional slots purchased by the user.
 * Currently uses additional_slots column in profiles.
 */
export async function getUserAddons(userId, type = 'business_slot') {
  if (!userId) return 0
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('additional_slots')
    .eq('id', userId)
    .maybeSingle()

  // For now, only business_slot is stored in additional_slots
  if (type === 'business_slot') {
    return profile?.additional_slots ?? 0
  }

  return 0
}

/**
 * Final check: Is the user still within their total quota?
 */
export async function checkQuotaUsage(tenant, profile, type) {
  if (!profile?.auth_user_id) return { canAdd: false, usage: 0, limit: 1 }

  // 1. GLOBAL ADMIN CHECK: Fetch all profiles for this user to check global status
  const { data: userProfiles, error: profError } = await supabase
    .from('profiles')
    .select('role, user_type')
    .eq('auth_user_id', profile.auth_user_id)

  if (profError) {
    console.error('[QUOTA_ERROR] Failed to fetch user profiles:', profError)
  }

  const isAdminGlobal = (userProfiles || []).some(p => 
    p.role === 'admin' || 
    p.role === 'superadmin' || 
    p.user_type === 'superadmin' ||
    p.user_type === 'admin'
  )



  // 2. Bypass if global admin
  if (isAdminGlobal) {
    return {
      usage: 0,
      limit: Infinity,
      canAdd: true,
      remaining: Infinity,
      isAdmin: true
    }
  }

  // 3. Regular Plan Calculation
  const baseLimit = await getFeatureLimit(tenant, type + '_limit')
  const extraSlots = await getUserAddons(profile?.id, type + '_slot')
  const totalLimit = baseLimit + extraSlots

  let currentUsage = 0
  if (type === 'business') {
    // Current usage is just the number of profiles (businesses) this user has
    currentUsage = userProfiles?.length || 0
  }

  return {
    usage: currentUsage,
    limit: totalLimit,
    canAdd: currentUsage < totalLimit,
    remaining: totalLimit - currentUsage
  }
}
