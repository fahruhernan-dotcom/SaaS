import React, { useState, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'

/**
 * Common Layout for Peternak (Broiler/Layer)
 * Handles both Mobile (BottomNav + AppSidebar) and Desktop (DesktopSidebarLayout)
 */
export default function PeternakLayout() {
  const { profile, loading } = useAuth()
  useNotificationGenerator()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Swipe-right-from-left-edge to open sidebar
  const swipeStartX = useRef(null)
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    if (swipeStartX.current < 40 && dx > 60) {
      setSidebarOpen(true)
    }
    swipeStartX.current = null
  }

  if (loading) return null

  const renderContent = () => {
    if (!isDesktop) {
      return (
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
          background: '#06090F',
          minHeight: '100vh',
          maxWidth: '480px',
          margin: '0 auto',
          paddingBottom: '80px',
          position: 'relative',
          overflowX: 'hidden',
          overscrollBehaviorX: 'none'
        }}>
          <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <BusinessNameWarningBanner />
          <Outlet context={{ setSidebarOpen }} />

          <BottomNav />
        </div>
      )
    }

    return (
      <DesktopSidebarLayout>
        <BusinessNameWarningBanner />
        <Outlet />
      </DesktopSidebarLayout>
    )
  }

  return (
    <>
      {renderContent()}
    </>
  )
}
