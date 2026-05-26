import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { getXBasePath } from '../businessModel'
import { toast } from 'sonner'
import { setLoggerContext, logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

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
    // Set partial logger context early so any Supabase select failures below
    // get user_id stamped (required for system_error_logs RLS — INSERT policy
    // requires user_id = auth.uid()). Active tenant/role get filled in at end
    // once the active profile is resolved.
    setLoggerContext({ userId, tenantId: null, vertical: null, role: null })

    // 1. Fetch all profiles (legacy source of truth for multi-tenant)
    const { data: legacyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      logSupabaseError(profilesError, {
        table: 'profiles',
        operation: 'select',
        component: 'AuthProvider',
        actionName: 'auth.fetch_profiles',
      })
    }

    // 2. Fetch all memberships (new source of truth for M:N)
    const { data: memberData, error: memberError } = await supabase
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (memberError) {
      console.error('Error fetching memberships:', memberError)
      logSupabaseError(memberError, {
        table: 'tenant_memberships',
        operation: 'select',
        component: 'AuthProvider',
        actionName: 'auth.fetch_memberships',
      })
    }

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
        // CRITICAL: carry app_role and role from profiles table (used for isSuperadmin check)
        app_role: legacyMatch?.app_role ?? m.app_role ?? masterProfile.app_role,
        role: legacyMatch?.role ?? m.role ?? masterProfile.role,
        // Inject metadata from master profile into membership-only rows
        full_name: m.full_name || masterProfile.full_name,
        avatar_url: m.avatar_url || masterProfile.avatar_url,
        onboarded: m.onboarded ?? masterProfile.onboarded,
        business_model_selected: m.business_model_selected ?? masterProfile.business_model_selected,
        is_onboarded: m.is_onboarded ?? masterProfile.is_onboarded, // handle both naming conventions
        last_seen_at: m.last_seen_at || masterProfile.last_seen_at
      }
    })

    lpSafe.forEach(lp => {
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

    // Priority 2: Use the first one available if no match or none saved.
    // Prefer onboarded owner profiles so fresh logins route to the right dashboard.
    if (!active && combined.length > 0) {
      active = combined.find(c => c.onboarded && c.role === 'owner')
        || combined.find(c => c.onboarded)
        || combined[0]
      if (active.tenant_id) setPersistedTenantId(active.tenant_id)
    }

    // ── SECURITY FIX: ownerTenant gating (for subscription/quota) ──
    const ownedMembership = combined.find(m => m.role === 'owner')
    setOwnerTenant(ownedMembership?.tenants || null)

    setProfile(active)
    setLoading(false)

    // Inject context so logger can tag logs with user/tenant/role.
    // Fallback userId to the param so we never lose user context even when
    // the profile fetch returned empty (e.g. fresh signup mid-onboarding).
    setLoggerContext({
      userId: active?.auth_user_id || userId,
      tenantId: active?.tenant_id || null,
      role: active?.app_role || active?.role || active?.user_type || null,
      vertical: null, // resolved per-component via resolveBusinessVertical
    })
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
      // 1. Update database active session (only safe fields like last_seen_at)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id)
        .eq('tenant_id', target.tenant_id)

      if (error) {
        logError({
          level: 'error',
          source: 'supabase',
          component: 'AuthProvider',
          actionName: 'switchTenant',
          error,
          metadata: {
            table: 'profiles',
            operation: 'update',
            target_tenant_id: target?.tenant_id,
          },
        })
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

  // Dual-mode check: JWT app_metadata (Supabase Auth) OR profile.app_role/role column (DB)
  // app_metadata.is_superadmin requires a Supabase custom claim to be set.
  // profile.app_role / profile.role are set directly in the DB and available immediately.
  // Safety net: scan ALL profiles in case active profile is from tenant_memberships without app_role
  const isSuperadmin =
    user?.app_metadata?.is_superadmin === true ||
    profile?.app_role === 'superadmin' ||
    profile?.role === 'superadmin' ||
    profiles.some(p => p.app_role === 'superadmin' || p.role === 'superadmin')

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
