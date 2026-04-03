/**
 * Single source of truth untuk status subscription tenant.
 * Gunakan fungsi ini di semua komponen — jangan hitung ulang sendiri.
 */

/**
 * @param {object} tenant — object tenant dari Supabase
 * @returns {{ status, label, daysLeft, expiresAt, isExpiringSoon, plan }}
 *
 * status:
 *   'trial'    — Starter, trial masih aktif
 *   'active'   — Pro/Business, plan berbayar masih aktif
 *   'expired'  — Plan/trial sudah berakhir
 *   'unknown'  — Data tidak tersedia
 */
export function getSubscriptionStatus(tenant) {
  if (!tenant) return { status: 'unknown', label: 'Unknown', daysLeft: 0, plan: null }

  const now = new Date()
  const plan = tenant.plan || 'starter'

  if (plan === 'starter') {
    const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
    if (!trialEnd || trialEnd <= now) {
      return { status: 'expired', label: 'Trial Berakhir', daysLeft: 0, plan, expiresAt: trialEnd }
    }
    const daysLeft = Math.ceil((trialEnd - now) / 86400000)
    return {
      status: 'trial',
      label: 'Trial',
      daysLeft,
      expiresAt: trialEnd,
      isExpiringSoon: daysLeft <= 7,
      plan,
    }
  }

  // pro / business
  const planExp = tenant.plan_expires_at ? new Date(tenant.plan_expires_at) : null
  if (!planExp || planExp <= now) {
    return { status: 'expired', label: 'Expired', daysLeft: 0, plan, expiresAt: planExp }
  }
  const daysLeft = Math.ceil((planExp - now) / 86400000)
  return {
    status: 'active',
    label: plan === 'pro' ? 'Pro' : 'Business',
    daysLeft,
    expiresAt: planExp,
    isExpiringSoon: daysLeft <= 14,
    plan,
  }
}

/**
 * Warna badge berdasarkan status
 */
export function getStatusColor(status) {
  switch (status) {
    case 'active':   return { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' }
    case 'trial':    return { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' }
    case 'expired':  return { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' }
    default:         return { color: '#4B6478', bg: 'rgba(75,100,120,0.1)', border: 'rgba(75,100,120,0.25)' }
  }
}

/**
 * Label expiry yang kontekstual
 * Contoh: "Trial berakhir 15 Apr 2026" / "Pro aktif hingga 1 Jul 2026"
 */
export function getExpiryLabel(tenant) {
  const sub = getSubscriptionStatus(tenant)
  if (!sub.expiresAt) return null

  const dateStr = sub.expiresAt.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  switch (sub.status) {
    case 'trial':   return `Trial berakhir ${dateStr}`
    case 'active':  return `${sub.label} aktif hingga ${dateStr}`
    case 'expired': return `Expired sejak ${dateStr}`
    default:        return null
  }
}
