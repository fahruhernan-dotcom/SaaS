import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { getXBasePath } from '../businessModel'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  // Get persisted tenant ID from localStorage
  const getPersistedTenantId = () => localStorage.getItem('ternakos_active_tenant_id')
  const setPersistedTenantId = (id) => localStorage.setItem('ternakos_active_tenant_id', id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchAllProfiles(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchAllProfiles(session.user.id)
        else { 
          setProfile(null)
          setProfiles([])
          setLoading(false) 
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchAllProfiles(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)
    
    if (error) {
      console.error('Error fetching profiles:', error)
      setLoading(false)
      return
    }

    setProfiles(data || [])
    
    // Determine active profile
    const savedTenantId = getPersistedTenantId()
    let active = null
    
    if (savedTenantId && data) {
      active = data.find(p => p.tenant_id === savedTenantId)
    }
    
    // Fallback to first profile if no saved or not found
    if (!active && data && data.length > 0) {
      active = data[0]
      setPersistedTenantId(active.tenant_id)
    }

    setProfile(active)
    setLoading(false)
  }

  const switchTenant = (tenantId) => {
    const target = profiles.find(p => p.tenant_id === tenantId)
    if (target) {
      setProfile(target)
      setPersistedTenantId(tenantId)
      return true
    }
    return false
  }

  const isSuperadmin = profiles.some(p => p.role === 'superadmin' || p.user_type === 'superadmin')
  
  return { 
    user, 
    profile, 
    profiles,
    tenant: profile?.tenants, 
    isSuperadmin,
    loading,
    switchTenant,
    refetchProfile: () => user && fetchAllProfiles(user.id)
  }
}

export const getBrokerBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}
