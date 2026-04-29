import React, { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'
import { SidebarProvider } from '@/components/ui/sidebar'
import TopBar from '../components/TopBar'

export default function PeternakLayout() {
  const { profile, loading, tenant } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useNotificationGenerator()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightAction, setRightAction] = useState(null)

  // Reset rightAction on every navigation
  useEffect(() => {
    setRightAction(null)
  }, [location.pathname])

  // Listen to sidebar open events from BottomNav (Menu tab) and MobileHeader
  useEffect(() => {
    const openHandler = () => setSidebarOpen(true)
    const toggleHandler = () => setSidebarOpen(prev => !prev)
    window.addEventListener('open-mobile-sidebar', openHandler)
    window.addEventListener('toggleMobileSidebar', toggleHandler)
    return () => {
      window.removeEventListener('open-mobile-sidebar', openHandler)
      window.removeEventListener('toggleMobileSidebar', toggleHandler)
    }
  }, [])

  // Swipe-right-from-left-edge to open sidebar
  const swipeStartX = useRef(null)
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    
    if (!sidebarOpen && swipeStartX.current < 40 && dx > 60) {
      setSidebarOpen(true)
    } else if (sidebarOpen && dx < -50) {
      setSidebarOpen(false)
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
          paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
          position: 'relative',
          overflowX: 'hidden',
          overscrollBehaviorX: 'none'
        }}>
          {/* TopBar removed from mobile branch because pages use MobileHeader for better control/overlap */}
          
          <SidebarProvider style={{ minHeight: 0 }}>
            <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </SidebarProvider>
          <BusinessNameWarningBanner />
          <Outlet context={{ setSidebarOpen, setRightAction }} />

          <BottomNav />
        </div>
      )
    }

    return (
      <DesktopSidebarLayout>
        <BusinessNameWarningBanner />
        <Outlet context={{ setSidebarOpen, setRightAction }} />
      </DesktopSidebarLayout>
    )
  }

  return (
    <>
      {renderContent()}
    </>
  )
}
