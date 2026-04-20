import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { getXBasePath } from '../businessModel'
import { toast } from 'sonner'

// ── Auth Context ───────────────────────────────────────────────────────────────
// Single source of truth untuk auth state.
// getSession() hanya dipanggil SEKALI di AuthProvider, bukan per-komponen.
// Semua pemanggil useAuth() membaca dari context yang sama → tidak ada race condition.

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [ownerTenant, setOwnerTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const getPersistedTenantId = () => localStorage.getItem('ternakos_active_tenant_id')
  const setPersistedTenantId = (id) => localStorage.setItem('ternakos_active_tenant_id', id)

  async function fetchAuthData(userId) {
    // 1. Fetch all profiles (legacy source of truth for multi-tenant)
    const { data: legacyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (profilesError) console.error('Error fetching profiles:', profilesError)

    // 2. Fetch all memberships (new source of truth for M:N)
    const { data: memberData, error: memberError } = await supabase
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)
    
    if (memberError) console.error('Error fetching memberships:', memberError)

    // 3. Uniquely merge both sources by tenant_id
    // Identify a "Master Profile" (any entry with name/metadata) to sync across all associations
    const lpSafe = legacyProfiles || []
    const mdSafe = memberData || []
    const masterProfile = lpSafe.find(p => p.full_name) || lpSafe[0] || mdSafe[0] || {}
    
    let combined = mdSafe.map(m => {
      const legacyMatch = lpSafe.find(lp => lp.tenant_id === m.tenant_id)
      return {
        ...m,
        // profiles.id from legacyProfiles — needed for FKs that reference profiles.id (e.g. team_invitations.invited_by)
        profile_id: legacyMatch?.id ?? null,
        // Inject metadata from master profile into membership-only rows
        full_name: m.full_name || masterProfile.full_name,
        avatar_url: m.avatar_url || masterProfile.avatar_url,
        onboarded: m.onboarded ?? masterProfile.onboarded,
        business_model_selected: m.business_model_selected ?? masterProfile.business_model_selected,
        is_onboarded: m.is_onboarded ?? masterProfile.is_onboarded, // handle both naming conventions
        last_seen_at: m.last_seen_at || masterProfile.last_seen_at
      }
    })

    legacyProfiles.forEach(lp => {
      if (!combined.some(c => c.tenant_id === lp.tenant_id)) {
        combined.push(lp)
      }
    })

    setProfiles(combined)

    // 4. Determine Active Profile (Active Session)
    const savedTenantId = getPersistedTenantId()
    let active = null

    // Priority 1: Use saved tenant from localStorage
    if (savedTenantId) {
      active = combined.find(p => p.tenant_id === savedTenantId)
    }

    // Priority 2: Use the first one available if no match or none saved
    if (!active && combined.length > 0) {
      active = combined[0]
      if (active.tenant_id) setPersistedTenantId(active.tenant_id)
    }

    // ── SECURITY FIX: ownerTenant gating (for subscription/quota) ──
    const ownedMembership = combined.find(m => m.role === 'owner')
    setOwnerTenant(ownedMembership?.tenants || null)

    setProfile(active)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchAuthData(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchAuthData(session.user.id)
        else {
          setProfile(null)
          setProfiles([])
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const switchTenant = async (tenantId) => {
    const target = profiles.find(p => p.tenant_id === tenantId)
    if (target && user) {
      // 1. Update database active session
      const { error } = await supabase
        .from('profiles')
        .update({ 
          tenant_id: target.tenant_id, 
          role: target.role,
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id)
        .eq('tenant_id', target.tenant_id)

      if (error) {
        toast.error('Gagal sinkronisasi sesi: ' + error.message)
        return false
      }

      // 2. Update local state
      setProfile(target)
      setPersistedTenantId(target.tenant_id)
      return true
    }
    return false
  }

  const isSuperadmin = user?.app_metadata?.is_superadmin === true

  const value = {
    user,
    profile,
    profiles,
    tenant: profile?.tenants,         // Active working tenant (for data fetching & routing)
    ownerTenant,                        // User's OWN tenant (for subscription & plan gating)
    isSuperadmin,
    loading,
    switchTenant,
    refetchProfile: () => user && fetchAuthData(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Graceful fallback during HMR or if called outside AuthProvider
    // NotificationsProvider and other consumers guard against null tenant/profile
    if (import.meta.env.DEV) {
      console.warn('[useAuth] Called outside <AuthProvider> — returning empty context.')
    }
    return {
      user: null, profile: null, tenant: null, tenants: [],
      loading: true, switchTenant: async () => { }, refetchProfile: () => { },
    }
  }
  return ctx
}

export const getBrokerBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}

export const getPeternakBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}
