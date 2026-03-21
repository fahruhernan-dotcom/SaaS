import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  ArrowLeftRight, 
  Building2, 
  User, 
  MoreHorizontal,
  RefreshCw,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  Truck,
  Wallet,
  Car,
  BarChart2,
  Calculator
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../lib/hooks/useAuth'
import { getBusinessModel } from '../../lib/businessModel'
import DrawerLainnya from './DrawerLainnya'

const ICON_MAP = {
  Home, ArrowLeftRight, Building2, User, MoreHorizontal,
  RefreshCw, ClipboardList, ShoppingCart, CreditCard,
  Truck, Wallet, Car, BarChart2, Calculator
}

export default function BottomNav() {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const model = getBusinessModel(profile?.user_type)
  const allTabs = model.bottomNav
  
  // Role-based filtering for broker tabs
  const tabs = allTabs.filter(tab => {
    if (profile?.user_type !== 'broker') return true
    
    const isOwner = profile?.role === 'owner'
    const isStaff = profile?.role === 'staff'
    const isViewOnly = profile?.role === 'view_only'

    if (isOwner) return true
    if (isStaff) {
      return ['Beranda', 'Transaksi', 'RPA', 'Akun'].includes(tab.label)
    }
    if (isViewOnly) {
      return ['Beranda', 'Transaksi', 'Akun'].includes(tab.label)
    }
    if (profile?.role === 'sopir') {
      return false // Sopir has their own standalone dashboard without BottomNav
    }
    return true
  })

  const color = model.color || '#10B981'

  return (
    <>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        height: '64px',
        background: 'rgba(10,15,22,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'grid',
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        alignItems: 'center',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          const Icon = ICON_MAP[tab.icon] || Home
          const isMore = tab.path === '/lainnya'

          return (
            <motion.button
              key={tab.path}
              onClick={() => {
                if (isMore) setDrawerOpen(true)
                else navigate(tab.path)
              }}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    height: '2px',
                    background: color,
                    borderRadius: '0 0 4px 4px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={20}
                color={active ? color : '#4B6478'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 700 : 500,
                fontFamily: 'DM Sans',
                color: active ? color : '#4B6478',
              }}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </nav>

      <DrawerLainnya 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        userType={profile?.user_type}
      />
    </>
  )
}
