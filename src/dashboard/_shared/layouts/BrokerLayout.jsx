import React, { useState, useRef, Component } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import DesktopSidebarLayout from './DesktopSidebarLayout'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical } from '@/lib/businessModel'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import AIChatBubble from '@/dashboard/broker/ai/AIChatBubble'
import { useNotificationGenerator } from '@/lib/hooks/useNotifications.jsx'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BusinessNameWarningBanner } from '../components/BusinessNameWarningBanner'
import {
  useSembakoDashboardStats, useSembakoSales, useSembakoProducts,
  useSembakoAllBatches, useSembakoSuppliers, useSembakoCustomers,
  useSembakoEmployees, useSembakoDeliveries, useSembakoSalesPendingDelivery,
  useSembakoStockOut,
} from '@/lib/hooks/useSembakoData'

// ── AI Error Boundary ─────────────────────────────────────────
// Isolates crash di AIChatBubble agar tidak merusak halaman utama
class AIErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  componentDidCatch(error) {
    console.error('[AIErrorBoundary] AI widget crashed:', error)
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[60] w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center" title="AI sementara tidak tersedia">
          <span className="text-red-400 text-lg">!</span>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Cache Warmers ─────────────────────────────────────────────
// Komponen ini mount bersama layout dan mengisi TanStack Query cache
// untuk semua halaman navigasi utama. Saat user buka halaman untuk
// pertama kali, data sudah ada di cache → langsung tampil tanpa skeleton.
// staleTime:5m di queryClient memastikan tidak ada re-fetch duplikat.

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

function PoultryBrokerPrefetcher() {
  const { tenant } = useAuth()
  const tid = tenant?.id

  // Transaksi page
  useQuery({
    queryKey: ['sales', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, rpa_clients(rpa_name,phone), purchases(*,farms(farm_name,location)), deliveries(*,vehicles(brand,vehicle_plate),drivers(full_name)), payments(*)`)
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })

  // Pengiriman page
  useQuery({
    queryKey: ['deliveries', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`*, drivers(full_name), vehicles(brand,vehicle_plate), sales!inner(id,is_deleted,total_revenue,quantity,total_weight_kg,price_per_kg,delivery_cost,rpa_clients(rpa_name,phone),purchases(total_cost,transport_cost,other_cost,price_per_kg,farms(farm_name)))`)
        .eq('tenant_id', tid).eq('is_deleted', false).eq('sales.is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })
  useQuery({
    queryKey: ['loss-reports', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loss_reports')
        .select(`*, delivery:deliveries(*,sales(price_per_kg,rpa_clients(rpa_name)))`)
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('report_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })

  // Armada page
  useQuery({
    queryKey: ['vehicles', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, deliveries(id,created_at,is_deleted)')
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })
  useQuery({
    queryKey: ['drivers', tid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*, deliveries(id,created_at,is_deleted)')
        .eq('tenant_id', tid).eq('is_deleted', false)
        .order('full_name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!tid,
  })

  return null
}

export default function BrokerLayout() {
  const { profile, tenant, loading, isSuperadmin, refetchProfile } = useAuth()
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
    // Only trigger if swipe started within 40px of left edge and moved 60px+ right
    if (!sidebarOpen && swipeStartX.current < 40 && dx > 60) {
      setSidebarOpen(true)
    } else if (sidebarOpen && dx < -50) {
      setSidebarOpen(false)
    }
    swipeStartX.current = null
  }

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
          }}
        >
          <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <BusinessNameWarningBanner />
          <Outlet context={{ setSidebarOpen }} />
          <BottomNav />
        </div>
      )
    }

    return <DesktopSidebarLayout><BusinessNameWarningBanner /><Outlet context={{ setSidebarOpen }} /></DesktopSidebarLayout>
  }

  return (
    <>
      {isSembako && <SembakoPrefetcher />}
      {vertical === 'poultry_broker' && <PoultryBrokerPrefetcher />}
      {renderContent()}
      <AIErrorBoundary><AIChatBubble /></AIErrorBoundary>
    </>
  )
}
