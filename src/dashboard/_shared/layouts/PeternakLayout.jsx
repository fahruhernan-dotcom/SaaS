import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'

/**
 * Common Layout for Peternak (Broiler/Layer)
 * Handles both Mobile (BottomNav + AppSidebar) and Desktop (DesktopSidebarLayout)
 */
export default function PeternakLayout() {
  const { profile, loading } = useAuth()
  useNotificationGenerator()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          position: 'relative',
          overflowX: 'hidden',
          overscrollBehaviorX: 'none'
        }}>
          <button
            className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0C1319] border border-white/10 rounded-xl flex items-center justify-center shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-[#94A3B8]" />
          </button>
          
          <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <Outlet />

          <BottomNav />
        </div>
      )
    }

    return (
      <DesktopSidebarLayout>
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
