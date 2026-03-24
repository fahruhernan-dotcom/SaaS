import React from 'react'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '../../lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import { useAuth } from '../../lib/hooks/useAuth'
import BusinessModelOverlay from '../components/BusinessModelOverlay'

export default function BrokerLayout({ children }) {
  const { profile, loading, refetchProfile } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const isSuperadmin = profile?.role === 'superadmin'

  if (loading) return null

  // Guard: Business Model Selection (Bypassed for Superadmin)
  if (!isSuperadmin && !profile?.business_model_selected) {
    return <BusinessModelOverlay profile={profile} onComplete={refetchProfile} />
  }

  const renderContent = () => {
    if (!isDesktop) {
      return (
        <div style={{
          background: '#06090F',
          minHeight: '100vh',
          maxWidth: '480px',
          margin: '0 auto',
          paddingBottom: '80px',
          position: 'relative'
        }}>
          {children}
          <BottomNav />
        </div>
      )
    }

    return <DesktopSidebarLayout>{children}</DesktopSidebarLayout>
  }

  return (
    <>
      {renderContent()}
    </>
  )
}
