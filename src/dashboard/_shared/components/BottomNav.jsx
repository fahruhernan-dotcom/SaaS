import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  Building2,
  User,
  Users,
  MoreHorizontal,
  RefreshCw,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Wallet,
  Car,
  BarChart2,
  Calculator,
  Shield,
  Plus,
  LayoutGrid,
  Store,
  Syringe,
  Tag,
  Heart,
  Menu,
  Wheat,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { getBusinessModel, BUSINESS_MODELS, resolveBusinessVertical } from '@/lib/businessModel'
import { useTheme } from '@/lib/hooks/useTheme'
import { peternakPermissions } from '@/lib/hooks/usePeternakPermissions'
import DrawerLainnya from './DrawerLainnya'

const ICON_MAP = {
  Home, ArrowLeftRight, Building2, User, Users, MoreHorizontal,
  RefreshCw, ClipboardList, ShoppingCart, CreditCard, Package,
  Truck, Wallet, Car, BarChart2, Calculator, Shield, LayoutGrid, Store,
  Syringe, Tag, Heart, Menu, Wheat
}

// ── Single tab button ──────────────────────────────────────────────────────────
function NavItem({ tab, active, color, onClick }) {
  const Icon = ICON_MAP[tab.icon] || Home

  const measureRef = useRef(null)
  const [contentWidth, setContentWidth] = useState(20)

  useEffect(() => {
    if (measureRef.current) {
      setContentWidth(20 + 5 + measureRef.current.scrollWidth)
    }
  }, [tab.label])

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '10px 2px 8px',
        minWidth: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Hidden span to measure text width */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'DM Sans',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        {tab.label}
      </span>

      {/* Icon + animated label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
        <Icon
          size={20}
          color={active ? color : '#4B6478'}
          strokeWidth={active ? 2.5 : 1.8}
          style={{ flexShrink: 0, transition: 'color 0.2s ease' }}
        />
        <motion.span
          animate={{ maxWidth: active ? '90px' : '0px', opacity: active ? 1 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'DM Sans',
            color: color,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            display: 'block',
            lineHeight: 1,
          }}
        >
          {tab.label}
        </motion.span>
      </div>

      {/* Sliding underline */}
      <div style={{ height: '2px', width: `${contentWidth}px`, overflow: 'hidden' }}>
        <AnimatePresence>
          {active && (
            <motion.div
              layoutId="bottom-nav-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              style={{ height: '2px', width: '100%', background: color, borderRadius: '2px', transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
}

// ── Center FAB ─────────────────────────────────────────────────────────────────
function CenterFAB({ color, onClick }) {
  return (
    // Outer spacer — same flex:1 so FAB slot takes same width as a tab
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        style={{
          position: 'absolute',
          bottom: 12,
          width: 54,
          height: 54,
          borderRadius: 20,
          background: color,
          border: '1px solid rgba(255,255,255,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 12px 24px ${color}40, 0 4px 10px rgba(0,0,0,0.3)`,
          WebkitTapHighlightColor: 'transparent',
          zIndex: 50,
        }}
      >
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: 30,
          background: 'transparent',
        }} />
        <Plus size={28} color="white" strokeWidth={3} />
      </motion.button>
    </div>
  )
}

// ── Peternak Dock Tab ─────────────────────────────────────────────────────────
function PeternakNavItem({ tab, active, color, onClick }) {
  const Icon = ICON_MAP[tab.icon] || Home
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
      }}
    >
      <motion.div
        animate={active ? { backgroundColor: `${color}22`, paddingLeft: 14, paddingRight: 14 } : { backgroundColor: 'transparent', paddingLeft: 10, paddingRight: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          borderRadius: 12,
          paddingTop: 8, paddingBottom: 8,
          overflow: 'hidden',
        }}
      >
        <Icon size={20} color={active ? color : 'rgba(255,255,255,0.4)'} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
        <motion.span
          animate={{ maxWidth: active ? 80 : 0, opacity: active ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'DM Sans', color, whiteSpace: 'nowrap', overflow: 'hidden', display: 'block', lineHeight: 1 }}
        >
          {tab.label}
        </motion.span>
      </motion.div>
    </motion.button>
  )
}

// ── Peternak Dock FAB ─────────────────────────────────────────────────────────
function PeternakCenterFAB({ color, onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 6px' }}>
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.90 }}
        whileHover={{ scale: 1.05 }}
        style={{
          width: 44, height: 44, borderRadius: 14,
          background: color,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${color}60`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Plus size={22} color="white" strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function BottomNav() {
  const { user, profile, profiles, tenant, switchTenant } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { accentColor } = useTheme()

  // Centralized Business Vertical Resolution (SCALABLE ARCHITECTURE)
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical] || getBusinessModel(profile?.user_type, profile?.sub_type)
  
  // BRANDING: Theme implementation
  const isSembako = vertical === 'distributor_sembako' || vertical === 'sembako_broker'
  const color = (isSembako ? '#EA580C' : (accentColor || model?.color || '#10B981'))

  // Detect peternak per-farm context (Level 2)
  // URL structure: /peternak/:peternakType/kandang/:farmId/...
  const farmMatch    = location.pathname.match(/^\/peternak\/[^/]+\/kandang\/([^/]+)/)
  const currentFarmId = farmMatch?.[1] ?? null
  const isPeternakFarm = !!currentFarmId

  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`
  
  // Override tabs & fabPath when inside a per-farm route
  let allTabs = []
  if (isPeternakFarm) {
    allTabs = [
        { path: `${peternakBase}/kandang/${currentFarmId}/beranda`,  icon: 'Home',           label: 'Kandang'  },
        { path: `${peternakBase}/kandang/${currentFarmId}/siklus`,   icon: 'RefreshCw',      label: 'Siklus'   },
        { path: `${peternakBase}/vaksinasi`,                         icon: 'Syringe',        label: 'Vaksin'   },
        { path: `${peternakBase}/beranda`,                           icon: 'MoreHorizontal', label: 'Overview' },
    ]
  } else {
    // Dynamically adjust paths for Broker (poultry_broker, egg_broker, etc that use base broker layout)
    const isBrokerUser = profile?.user_type === 'broker';
    const brokerBase = getBrokerBasePath(tenant);
    
    allTabs = (model.bottomNav || []).map(tab => {
        // If the path already has a vertical segment (e.g. /broker/distributor_sembako/...), use it as is
        if (tab.path.startsWith('/broker/') && tab.path.split('/').length > 3) {
          return tab;
        }
        
        if (isBrokerUser && tab.path.startsWith('/broker/') && !tab.path.startsWith(brokerBase)) {
           return { ...tab, path: tab.path.replace('/broker/', brokerBase + '/') }
        }
        return tab;
    })
  }

  let fabPath = null
  if (isPeternakFarm) {
    fabPath = `${peternakBase}/kandang/${currentFarmId}/input`
  } else if (model.fabPath) {
    fabPath = model.fabPath
    
    const brokerBase = getBrokerBasePath(tenant);
    if (profile?.user_type === 'broker' && fabPath.startsWith('/broker/') && !fabPath.startsWith(brokerBase)) {
      fabPath = fabPath.replace('/broker/', brokerBase + '/')
    }
  }

  // Role-based filtering — use model.category (already resolved) rather than profile.user_type
  // which may be 'superadmin' when an admin browses a peternak dashboard
  const isPeternakUser = profile?.user_type === 'peternak' || model?.category === 'peternak'
  const pp = isPeternakUser ? peternakPermissions(profile?.role) : null

  // Hide FAB for peternak roles that can't input
  if (isPeternakUser && pp && !pp.showFab) {
    if (isPeternakFarm) fabPath = null
    else if (model.fabPath?.includes('/peternak/')) fabPath = null
  }

  const tabs = allTabs.filter(tab => {
    if (profile?.role === 'superadmin') return true

    // ── Peternak vertical ─────────────────────────────────────────────────
    if (isPeternakUser && pp) {
      // Farm-level tabs
      if (isPeternakFarm) {
        if (tab.label === 'Siklus'   && !pp.canViewSiklus)   return false
        if (tab.label === 'Overview' && !pp.canViewBeranda)  return false
        return true
      }
      // Global peternak tabs
      if (tab.label === 'Siklus'  && !pp.canViewSiklus)   return false
      if (tab.label === 'Profil'  && !pp.canViewAkun)     return false
      return true
    }

    if (profile?.user_type !== 'broker') return true

    // ── Broker vertical ───────────────────────────────────────────────────
    const isOwner    = profile?.role === 'owner' || profile?.role === 'superadmin'
    const isStaff    = profile?.role === 'staff'
    const isViewOnly = profile?.role === 'view_only'

    if (isOwner) return true
    if (isStaff) {
      if (isSembako) {
        return ['Beranda', 'Jual', 'Toko', 'Kirim'].includes(tab.label)
      }
      return ['Beranda', 'Transaksi', 'RPA', 'Akun'].includes(tab.label)
    }
    if (isViewOnly) {
      if (isSembako) {
        return ['Beranda', 'Laporan'].includes(tab.label)
      }
      return ['Beranda', 'Transaksi', 'Akun'].includes(tab.label)
    }
    if (profile?.role === 'sopir' || profile?.role === 'supir') {
      return false
    }
    return true
  })


  const finalTabs = tabs

  // Split into left half + right half for FAB layout
  const hasFab = !!fabPath
  const mid    = Math.ceil(finalTabs.length / 2)
  const leftTabs  = hasFab ? finalTabs.slice(0, mid)  : finalTabs
  const rightTabs = hasFab ? finalTabs.slice(mid)      : []

  const handleTabClick = (tab) => {
    if (tab.slug === 'menu' || tab.label === 'Menu') {
      window.dispatchEvent(new Event('toggleMobileSidebar'))
    } else if (tab.path === '/lainnya') {
      setDrawerOpen(true)
    } else if (tab.label === 'Admin') {
      const adminProfile = profiles?.find(
        p => p.role === 'superadmin' || p.user_type === 'superadmin'
      )
      if (adminProfile) {
        switchTenant(adminProfile.tenant_id)
        navigate('/admin')
      }
    } else {
      navigate(tab.path)
    }
  }

  const renderTab = (tab) => {
    const active   = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    const tabColor = tab.label === 'Admin' ? '#F59E0B' : color
    
    if (isPeternakUser) {
      return (
        <PeternakNavItem
          key={tab.path}
          tab={tab}
          active={active}
          color={tabColor}
          onClick={() => handleTabClick(tab)}
        />
      )
    }

    return (
      <NavItem
        key={tab.path}
        tab={tab}
        active={active}
        color={tabColor}
        onClick={() => handleTabClick(tab)}
      />
    )
  }

  return (
    <>
      <nav
        style={isPeternakUser ? {
          // Floating dock pill
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'fit-content',
          maxWidth: 'calc(100vw - 32px)',
          height: 'auto',
          background: 'rgba(10,15,22,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.60), 0 2px 8px rgba(0,0,0,0.30)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '2px',
          zIndex: 3500,
          padding: '6px 8px',
          overflow: 'visible',
        } : {
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          height: '64px',
          background: 'rgba(10,15,22,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 3500,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          overflow: 'visible',
        }}
      >
        {isPeternakUser ? (
          hasFab ? (
            <>
              {leftTabs.map(renderTab)}
              <PeternakCenterFAB color={color} onClick={() => navigate(fabPath)} />
              {rightTabs.map(renderTab)}
            </>
          ) : (
            finalTabs.map(renderTab)
          )
        ) : (
          hasFab ? (
            <>
              {leftTabs.map(renderTab)}
              <CenterFAB color={color} onClick={() => navigate(fabPath)} />
              {rightTabs.map(renderTab)}
            </>
          ) : (
            finalTabs.map(renderTab)
          )
        )}
      </nav>

      <DrawerLainnya
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userType={profile?.user_type}
      />
    </>
  )
}
