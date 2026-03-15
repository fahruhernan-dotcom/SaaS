import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ArrowLeftRight, Package, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/dashboard', icon: Home, label: 'Beranda' },
  { path: '/transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
  { path: '/stok', icon: Package, label: 'Stok' },
  { path: '/rpa', icon: Building2, label: 'Buyer' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
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
      gridTemplateColumns: 'repeat(4, 1fr)',
      alignItems: 'center',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <motion.button
            key={tab.path}
            onClick={() => navigate(tab.path)}
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
            {/* Active indicator */}
            {active && (
              <motion.div
                layoutId="bottom-nav-indicator"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: '2px',
                  background: '#10B981',
                  borderRadius: '0 0 4px 4px',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <tab.icon
              size={20}
              color={active ? '#10B981' : '#4B6478'}
              strokeWidth={active ? 2.5 : 1.8}
            />
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 700 : 500,
              fontFamily: 'DM Sans',
              color: active ? '#10B981' : '#4B6478',
            }}>
              {tab.label}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}
