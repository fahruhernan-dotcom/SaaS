import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import LoadingScreen from '@/components/LoadingScreen'
import { getBrokerBasePath } from '@/lib/hooks/useAuth'

const KEY_TO_PATH = {
  broker:              '/broker/broker_ayam/beranda',
  egg_broker:          '/broker/broker_telur/beranda',
  distributor_sembako: '/broker/distributor_sembako/beranda',
  peternak:            '/peternak/peternak_broiler/beranda',
  peternak_layer:      '/peternak/peternak_layer/beranda',
  rumah_potong_rpa:    '/rumah_potong/rpa/beranda',
  rumah_potong_rph:    '/rumah_potong/rph/beranda',
}

export default function OnboardingFlow() {
  const { profile, loading, refetchProfile } = useAuth()
  const navigate = useNavigate()

  if (loading) return <LoadingScreen />

  // Sudah onboarded — redirect ke dashboard yang sesuai
  if (profile?.onboarded) {
    if (profile.role === 'superadmin' || profile.user_type === 'superadmin') {
      navigate('/admin', { replace: true })
      return null
    }
    if (profile.user_type === 'peternak') {
      navigate(`/peternak/${profile.tenants?.sub_type || 'peternak_broiler'}/beranda`, { replace: true })
      return null
    }
    if (profile.user_type === 'rumah_potong') {
      const rpType = profile.tenants?.sub_type?.startsWith('rpa') ? 'rpa' : 'rph'
      navigate(`/rumah_potong/${rpType}/beranda`, { replace: true })
      return null
    }
    navigate(getBrokerBasePath({ sub_type: profile.tenants?.sub_type }) + '/beranda', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-[#06090F]">
      <BusinessModelOverlay
        profile={profile}
        onComplete={async (selectedKey) => {
          await refetchProfile()
          const path = KEY_TO_PATH[selectedKey]
          if (path) navigate(path, { replace: true })
        }}
      />
    </div>
  )
}
