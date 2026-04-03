import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Package, ShoppingCart, Warehouse, Users, User,
  Menu, X, Shield, ChevronRight, Wallet, Truck,
  Home, Store, ArrowLeftRight, Building2,
} from 'lucide-react'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'
import { C } from './sembakoSaleUtils'

// ── Mobile Top Bar ─────────────────────────────────────────────────────────────
export function SembakoMobileBar({ onHamburger, title = 'Dashboard' }) {
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()
  const brokerBase = getBrokerBasePath(tenant)
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(6,9,15,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(234,88,12,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
    }}>
      {/* Hamburger */}
      <button
        onClick={onHamburger}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(234,88,12,0.08)',
          border: '1px solid rgba(234,88,12,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Menu size={18} color={C.accent} />
      </button>

      {/* Title */}
      <span style={{
        fontFamily: 'Sora', fontWeight: 800, fontSize: '15px',
        color: C.text, letterSpacing: '0.02em',
      }}>
        {title}
      </span>

      {/* Bell + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NotificationBell />
        <button
          onClick={() => navigate(`${brokerBase}/akun`)}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(234,88,12,0.12)',
            border: '1px solid rgba(234,88,12,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: 'Sora', fontWeight: 800, fontSize: '11px', color: C.accent,
          }}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}

// ── Hamburger Drawer ───────────────────────────────────────────────────────────
export function SembakoHamburgerDrawer({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, profiles, tenant, isSuperadmin, switchTenant } = useAuth()
  const brokerBase = getBrokerBasePath(tenant)
  const bizName = tenant?.business_name || 'Sembako'
  const [showSwitcher, setShowSwitcher] = useState(false)

  const VERTICAL_BERANDA = {
    distributor_sembako:  '/broker/distributor_sembako/beranda',
    poultry_broker:  '/broker/broker_ayam/beranda',
    egg_broker:      '/broker/broker_telur/beranda',
    peternak:        '/peternak/peternak_broiler/beranda',
    rpa:             '/rumah_potong/rpa/beranda',
  }
  const VERTICAL_ICON = {
    distributor_sembako: '🛒', poultry_broker: '🤝', egg_broker: '🥚',
    peternak: '🏚️', rpa: '🏭',
  }

  const DRAWER_SECTIONS = [
    {
      label: 'UTAMA',
      items: [
        { label: 'Beranda',           icon: Home,           path: `${brokerBase}/beranda`       },
        { label: 'Penjualan',         icon: ArrowLeftRight, path: `${brokerBase}/penjualan`     },
        { label: 'Toko & Supplier',   icon: Store,          path: `${brokerBase}/toko-supplier` },
        { label: 'Pengiriman',        icon: Truck,          path: `${brokerBase}/pengiriman`    },
        { label: 'Gudang',            icon: Warehouse,      path: `${brokerBase}/gudang`        },
        { label: 'Inventori & HPP',   icon: Package,        path: `${brokerBase}/produk`        },
        { label: 'Karyawan',          icon: Users,          path: `${brokerBase}/karyawan`      },
      ],
    },
    {
      label: 'LAPORAN & AKUN',
      items: [
        { label: 'Laporan',           icon: BarChart2,     path: `${brokerBase}/laporan`        },
        { label: 'Tim & Akses',       icon: Shield,        path: `${brokerBase}/tim`            },
        { label: 'Akun & Profil',     icon: User,          path: `${brokerBase}/akun`           },
      ],
    },
    {
      label: 'LAINNYA',
      items: [
        { label: 'TernakOS Market',   icon: Building2,     path: '/market'                      },
      ],
    },
  ]

  const go = (path) => { onClose(); setShowSwitcher(false); navigate(path) }

  const handleSwitch = (p) => {
    switchTenant(p.tenant_id)
    const vertical = p.tenants?.business_vertical || 'poultry_broker'
    if (vertical.includes('broker')) {
      const targetBase = `/broker/${vertical}`
      go(`${targetBase}/beranda`)
    } else {
      go(VERTICAL_BERANDA[vertical] || '/broker/beranda')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.65)',
            }}
          />
          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: '75%', maxWidth: 300, zIndex: 201,
              background: '#0E0905',
              borderRight: '1px solid rgba(234,88,12,0.12)',
              display: 'flex', flexDirection: 'column',
              paddingTop: 'env(safe-area-inset-top, 16px)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px 14px',
              borderBottom: '1px solid rgba(234,88,12,0.1)',
            }}>
              <span style={{
                fontFamily: 'Sora', fontWeight: 900, fontSize: '16px',
                color: C.accent, textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {bizName}
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} color="#94A3B8" />
              </button>
            </div>

            {/* Nav sections */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {DRAWER_SECTIONS.map(section => (
                <div key={section.label} style={{ marginBottom: '6px' }}>
                  <p style={{
                    fontSize: '10px', fontWeight: 800, color: '#4B3B2A',
                    letterSpacing: '0.12em', padding: '6px 20px 4px',
                    fontFamily: 'Sora',
                  }}>
                    {section.label}
                  </p>
                  {section.items.map(item => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <button
                        key={item.path}
                        onClick={() => go(item.path)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          gap: '12px', padding: '11px 20px',
                          background: isActive ? 'rgba(234,88,12,0.1)' : 'transparent',
                          border: 'none',
                          borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={17} color={isActive ? C.accent : '#6B4E37'} />
                        <span style={{
                          fontFamily: 'DM Sans', fontWeight: isActive ? 700 : 500,
                          fontSize: '14px',
                          color: isActive ? C.text : '#A07855',
                        }}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Business switcher drop-up */}
            <div style={{
              borderTop: '1px solid rgba(234,88,12,0.08)',
              background: '#0E0905',
            }}>
              <AnimatePresence>
                {showSwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      borderTop: '1px solid rgba(234,88,12,0.12)',
                      background: '#130C06',
                      padding: '8px 0',
                    }}
                  >
                    <p style={{
                      fontSize: '10px', fontWeight: 800, color: '#4B3B2A',
                      letterSpacing: '0.12em', padding: '4px 20px 6px',
                      fontFamily: 'Sora',
                    }}>
                      PILIH BISNIS
                    </p>
                    {(profiles || []).map(p => {
                      const vertical = p.tenants?.business_vertical || 'poultry_broker'
                      const isActive  = p.tenant_id === profile?.tenant_id
                      return (
                        <button
                          key={p.tenant_id}
                          onClick={() => handleSwitch(p)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            gap: '10px', padding: '10px 20px',
                            background: isActive ? 'rgba(234,88,12,0.1)' : 'transparent',
                            border: 'none',
                            borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{VERTICAL_ICON[vertical] ?? '🏢'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: 'DM Sans', fontWeight: isActive ? 700 : 500, fontSize: '13px', color: isActive ? C.text : '#A07855', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.tenants?.business_name || 'Bisnis'}
                            </p>
                            <p style={{ fontFamily: 'DM Sans', fontSize: '10px', color: '#4B3B2A', margin: 0 }}>
                              {p.tenants?.business_vertical?.replace('_', ' ') || ''}
                            </p>
                          </div>
                          {isActive && <span style={{ fontSize: 10, color: C.accent }}>✓</span>}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => go('/onboarding?mode=new_business')}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: '10px', padding: '10px 20px',
                        background: 'transparent', border: 'none',
                        borderLeft: '3px solid transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>➕</span>
                      <span style={{ fontFamily: 'DM Sans', fontWeight: 500, fontSize: '13px', color: '#6B4E37' }}>
                        Tambah Bisnis Baru
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom actions */}
              <div style={{
                padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))',
              }}>
                {isSuperadmin && (
                  <button
                    onClick={() => go('/admin')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: '12px', padding: '11px 20px',
                      background: 'transparent', border: 'none',
                      borderLeft: '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Shield size={17} color="#F59E0B" />
                    <span style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '14px', color: '#F59E0B' }}>
                      Admin Panel
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setShowSwitcher(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: '12px', padding: '11px 20px',
                    background: showSwitcher ? 'rgba(234,88,12,0.06)' : 'transparent',
                    border: 'none',
                    borderLeft: showSwitcher ? `3px solid ${C.accent}` : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Users size={17} color={showSwitcher ? C.accent : '#4B3B2A'} />
                  <span style={{ fontFamily: 'DM Sans', fontWeight: 500, fontSize: '14px', color: showSwitcher ? C.text : '#6B4E37', flex: 1 }}>
                    Ganti Model Bisnis
                  </span>
                  <ChevronRight size={13} color="#4B3B2A" style={{ transform: showSwitcher ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
