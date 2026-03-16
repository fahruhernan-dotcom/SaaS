import React from 'react'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '../../lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import { useAuth } from '../../lib/hooks/useAuth'

export default function BrokerLayout({ children }) {
  const { profile, loading, refetchProfile } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (loading) return null

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
      <BusinessModelOverlay 
        profile={profile} 
        onComplete={() => refetchProfile()} 
      />
    </>
  )
}
