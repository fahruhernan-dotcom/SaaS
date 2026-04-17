import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import LoadingScreen from '@/components/LoadingScreen'
import { getBrokerBasePath } from '@/lib/hooks/useAuth'

const KEY_TO_PATH = {
  broker:              '/broker/broker_ayam/beranda',
  egg_broker:          '/broker/broker_telur/beranda',
  distributor_sembako: '/broker/distributor_sembako/beranda',
  peternak:                              '/peternak/peternak_broiler/beranda',
  peternak_layer:                        '/peternak/peternak_layer/beranda',
  peternak_kambing_domba_penggemukan:    '/peternak/peternak_kambing_domba_penggemukan/beranda',
  peternak_kambing_domba_breeding:       '/peternak/peternak_kambing_domba_breeding/beranda',
  peternak_sapi_penggemukan:             '/peternak/peternak_sapi_penggemukan/beranda',
  rumah_potong_rpa:    '/rumah_potong/rpa/beranda',
  rumah_potong_rph:    '/rumah_potong/rph/beranda',
}

export default function OnboardingFlow() {
  const { user, profile, loading, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewBusiness = searchParams.get('mode') === 'new_business'

  // Hooks MUST come before any early returns
  React.useEffect(() => {
    if (loading) return
    
    // Original redirect logic only if NOT in new business mode
    if (!isNewBusiness && profile?.onboarded) {
      if (profile.role === 'superadmin' || profile.user_type === 'superadmin') {
        navigate('/admin', { replace: true })
        return
      }
      if (profile.user_type === 'peternak') {
        navigate(`/peternak/${profile.tenants?.sub_type || 'peternak_broiler'}/beranda`, { replace: true })
        return
      }
      if (profile.user_type === 'rumah_potong') {
        navigate(`/rumah_potong/${profile.tenants?.sub_type || 'rpa_ayam'}/beranda`, { replace: true })
        return
      }
      navigate(getBrokerBasePath(profile.tenants) + '/beranda', { replace: true })
    }
  }, [profile, loading, navigate, isNewBusiness])

  // Only show LoadingScreen if we are literally loading the session from Supabase.
  // If loading is false, even if profile is null (new user), we should render the overlay.
  if (loading) return <LoadingScreen />
  
  // If already onboarded and not in add-business mode, we should have been redirected by useEffect.
  // But as a fallback, show LoadingScreen while redirecting.
  if (!isNewBusiness && profile?.onboarded) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#06090F]">
      <BusinessModelOverlay
        user={user}
        profile={profile}
        isNewBusiness={isNewBusiness}
        onComplete={async (selectedKey) => {
          if (!selectedKey) {
            // User cancelled / closed the overlay
            if (isNewBusiness) {
              // Go back to previous page or dashboard
              navigate(-1)
            }
            return
          }
          
          await refetchProfile()
          const path = KEY_TO_PATH[selectedKey]
          
          if (path) {
            navigate(path, { replace: true })
            // If it was a new business, we refresh to ensure all context (tenants etc) is updated
            if (isNewBusiness) window.location.reload()
          } else {
            // Fallback for unknown keys
            window.location.href = '/'
          }
        }}
      />
    </div>
  )
}
