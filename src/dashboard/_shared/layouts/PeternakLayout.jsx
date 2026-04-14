import React, { useState, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/**
 * Common Layout for Peternak (Broiler/Layer)
 * Handles both Mobile (BottomNav + AppSidebar) and Desktop (DesktopSidebarLayout)
 */
export default function PeternakLayout() {
  const { profile, loading, tenant } = useAuth()
  const navigate = useNavigate()
  useNotificationGenerator()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PT'
  const getAkunPath = () => `/peternak/${tenant?.sub_type || 'peternak_broiler'}/akun`

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
          paddingBottom: '80px',
          position: 'relative',
          overflowX: 'hidden',
          overscrollBehaviorX: 'none'
        }}>
          <div className="md:hidden fixed top-0 w-full max-w-[480px] z-[60] h-14 flex items-center justify-between px-4 bg-[#06090F]/95 backdrop-blur-xl border-b border-white/[0.05]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onPointerDown={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  setSidebarOpen(true); 
                }}
                className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              >
                <Menu size={17} className="text-[#94A3B8]" />
              </button>
              <h1 className="font-display font-black text-[15px] text-[#F1F5F9] leading-tight truncate min-w-0">
                Halo, {profile?.full_name?.split(' ')[0] ?? 'Peternak'} <span>👋</span>
              </h1>
            </div>
            <Avatar className="h-9 w-9 border border-purple-500/30 shrink-0 cursor-pointer" onClick={() => navigate(getAkunPath())}>
              <AvatarFallback className="bg-purple-500/10 text-purple-400 font-black text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Spacer to push content below the fixed TopBar */}
          <div className="md:hidden h-14" />

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
