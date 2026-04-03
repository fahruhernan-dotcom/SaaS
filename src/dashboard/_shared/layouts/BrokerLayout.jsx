import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { SembakoHamburgerDrawer } from '@/dashboard/broker/sembako_broker/components/SembakoNavigation'
import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical } from '@/lib/businessModel'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import {
  useSembakoDashboardStats, useSembakoSales, useSembakoProducts,
  useSembakoAllBatches, useSembakoSuppliers, useSembakoCustomers,
  useSembakoEmployees, useSembakoDeliveries, useSembakoSalesPendingDelivery,
  useSembakoStockOut,
} from '@/lib/hooks/useSembakoData'

// Prefetch semua query sembako sekaligus saat layout mount.
// Karena refetchOnMount:false + staleTime:5m di queryClient global,
// data yang sudah di-cache tidak akan di-fetch ulang saat user ganti menu.
// Refetch hanya terjadi setelah mutasi (invalidateQueries) atau setelah 5 menit.
function SembakoPrefetcher() {
  useSembakoDashboardStats()
  useSembakoSales()
  useSembakoProducts()
  useSembakoAllBatches()
  useSembakoSuppliers()
  useSembakoCustomers()
  useSembakoEmployees()
  useSembakoDeliveries()
  useSembakoSalesPendingDelivery()
  useSembakoStockOut()
  return null
}

export default function BrokerLayout() {
  const { profile, tenant, loading, isSuperadmin, refetchProfile } = useAuth()
  useNotificationGenerator()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return null

  // Guard: Business Model Selection (Bypassed for Superadmin)
  if (!isSuperadmin && !profile?.business_model_selected) {
    return <BusinessModelOverlay profile={profile} onComplete={refetchProfile} />
  }

  const vertical = resolveBusinessVertical(profile, tenant)
  const isSembako = vertical === 'distributor_sembako' || vertical === 'sembako_broker'

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
          {!isSembako && (
            <button
              className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0C1319] border border-white/10 rounded-xl flex items-center justify-center shadow-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-[#94A3B8]" />
            </button>
          )}

          {isSembako 
            ? <SembakoHamburgerDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            : <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          }
          
          <Outlet context={{ setSidebarOpen }} />
          <BottomNav />
        </div>
      )
    }

    return <DesktopSidebarLayout><Outlet context={{ setSidebarOpen }} /></DesktopSidebarLayout>
  }

  return (
    <>
      {isSembako && <SembakoPrefetcher />}
      {renderContent()}
    </>
  )
}
