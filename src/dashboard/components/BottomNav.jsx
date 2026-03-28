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
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../lib/hooks/useAuth'
import { getBusinessModel, BUSINESS_MODELS } from '../../lib/businessModel'
import { useTheme } from '../../lib/hooks/useTheme'
import DrawerLainnya from './DrawerLainnya'

const ICON_MAP = {
  Home, ArrowLeftRight, Building2, User, Users, MoreHorizontal,
  RefreshCw, ClipboardList, ShoppingCart, CreditCard, Package,
  Truck, Wallet, Car, BarChart2, Calculator, Shield, LayoutGrid, Store,
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
      {/* The actual floating button — lifted above the nav bar */}
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        style={{
          position: 'absolute',
          bottom: 8,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: color,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px ${color}55, 0 2px 8px rgba(0,0,0,0.4)`,
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10,
        }}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
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

  // Detect peternak per-farm context (Level 2)
  const farmMatch    = location.pathname.match(/^\/peternak\/kandang\/([^/]+)/)
  const currentFarmId = farmMatch?.[1] ?? null
  const isPeternakFarm = !!currentFarmId

  // Prefer tenant.business_vertical (set on tenant row) over profile sub_type
  const model = (tenant?.business_vertical && BUSINESS_MODELS[tenant.business_vertical])
    || getBusinessModel(profile?.user_type, profile?.sub_type)
  const color = accentColor || model?.color || '#10B981'

  // Override tabs & fabPath when inside a per-farm route
  const allTabs = isPeternakFarm
    ? [
        { path: `/peternak/kandang/${currentFarmId}/beranda`, icon: 'Home',         label: 'Kandang'  },
        { path: `/peternak/kandang/${currentFarmId}/siklus`,  icon: 'RefreshCw',    label: 'Siklus'   },
        { path: `/peternak/kandang/${currentFarmId}/pakan`,   icon: 'Package',      label: 'Pakan'    },
        { path: '/peternak/beranda',                          icon: 'MoreHorizontal', label: 'Overview' },
      ]
    : model.bottomNav

  const fabPath = isPeternakFarm
    ? `/peternak/kandang/${currentFarmId}/input`
    : (model.fabPath || null)

  // Role-based filtering
  const tabs = allTabs.filter(tab => {
    if (profile?.role === 'superadmin') return true
    if (profile?.user_type !== 'broker') return true

    const isOwner    = profile?.role === 'owner'
    const isStaff    = profile?.role === 'staff'
    const isViewOnly = profile?.role === 'view_only'

    if (isOwner) return true
    if (isStaff)    return ['Beranda', 'Transaksi', 'RPA', 'Akun'].includes(tab.label)
    if (isViewOnly) return ['Beranda', 'Transaksi', 'Akun'].includes(tab.label)
    if (profile?.role === 'sopir') return false
    return true
  })

  const isSuperadmin =
    (profile?.role === 'superadmin' || profile?.user_type === 'superadmin') &&
    user?.email === 'fahruhernansakti@gmail.com'

  const finalTabs = isSuperadmin
    ? [...tabs, { label: 'Admin', icon: 'Shield', path: '/admin' }]
    : tabs

  // Split into left half + right half for FAB layout
  const hasFab = !!fabPath
  const mid    = Math.ceil(finalTabs.length / 2)
  const leftTabs  = hasFab ? finalTabs.slice(0, mid)  : finalTabs
  const rightTabs = hasFab ? finalTabs.slice(mid)      : []

  const handleTabClick = (tab) => {
    const isMore = tab.path === '/lainnya'
    if (isMore) {
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
        style={{
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
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          overflow: 'visible',
        }}
      >
        {hasFab ? (
          <>
            {leftTabs.map(renderTab)}
            <CenterFAB color={color} onClick={() => navigate(fabPath)} />
            {rightTabs.map(renderTab)}
          </>
        ) : (
          finalTabs.map(renderTab)
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
