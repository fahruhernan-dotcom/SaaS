import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, TrendingUp, Package, Receipt,
  AlertTriangle, Plus, ChevronRight, Menu, X, Shield,
  BarChart2, User, ShoppingCart, Warehouse, Users,
} from 'lucide-react'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useSembakoDashboardStats, useSembakoSales, useSembakoEmployees } from '@/lib/hooks/useSembakoData'
import { formatIDR } from '@/lib/format'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#06090F',
  card:     '#1C1208',
  input:    '#231A0E',
  accent:   '#EA580C',
  amber:    '#F59E0B',
  text:     '#FEF3C7',
  muted:    '#92400E',
  border:   'rgba(234,88,12,0.15)',
  borderAm: 'rgba(245,158,11,0.25)',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }
  catch { return '-' }
}

const STATUS_STYLE = {
  lunas:       { bg: 'rgba(52,211,153,0.12)',  color: '#34D399', label: 'Lunas'      },
  sebagian:    { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', label: 'Sebagian'   },
  belum_lunas: { bg: 'rgba(239,68,68,0.20)',   color: '#EF4444', label: 'Belum Lunas', border: 'rgba(239,68,68,0.4)' },
}

// ── Mobile Top Bar ─────────────────────────────────────────────────────────────
function SembakoMobileBar({ onHamburger, profile, brokerBase }) {
  const navigate = useNavigate()
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
        Dashboard
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
function HamburgerDrawer({ open, onClose, tenant, profile, profiles, switchTenant }) {
  const navigate = useNavigate()
  const location = useLocation()
  const brokerBase = getBrokerBasePath(tenant)
  const bizName = tenant?.business_name || 'Sembako'
  const isSuperadmin = profile?.role === 'superadmin' || profile?.user_type === 'superadmin'
  const [showSwitcher, setShowSwitcher] = useState(false)

  const VERTICAL_BERANDA = {
    sembako_broker:  '/broker/distributor_sembako/beranda',
    poultry_broker:  '/broker/broker_ayam/beranda',
    egg_broker:      '/broker/broker_telur/beranda',
    peternak:        '/peternak/peternak_broiler/beranda',
    rpa:             '/rumah_potong/rpa/beranda',
  }
  const VERTICAL_ICON = {
    sembako_broker: '🛒', poultry_broker: '🤝', egg_broker: '🥚',
    peternak: '🏚️', rpa: '🏭',
  }

  const DRAWER_SECTIONS = [
    {
      label: 'OPERASIONAL',
      items: [
        { label: 'Dashboard',         icon: BarChart2,     path: `${brokerBase}/beranda`   },
        { label: 'Manajemen Produk',  icon: Package,       path: `${brokerBase}/produk`    },
      ],
    },
    {
      label: 'TRANSAKSI',
      items: [
        { label: 'Penjualan',         icon: ShoppingCart,  path: `${brokerBase}/penjualan` },
        { label: 'Gudang & Stok',     icon: Warehouse,     path: `${brokerBase}/gudang`    },
      ],
    },
    {
      label: 'MANAJEMEN',
      items: [
        { label: 'Pegawai',           icon: Users,         path: `${brokerBase}/karyawan`  },
        { label: 'Laporan',           icon: BarChart2,     path: `${brokerBase}/laporan`   },
        { label: 'Akun & Profil',     icon: User,          path: `${brokerBase}/akun`      },
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
              borderTop: '1px solid rgba(234,88,12,0.08)',
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── KPI Card (horizontal, compact) ────────────────────────────────────────────
// Icon beside text — reduces card height ~35% vs stacked layout
function KPICard({ icon: Icon, label, value, sub, accentColor = C.accent, urgent, badge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.card,
        borderRadius: '14px',
        padding: '12px 14px',
        border: `1px solid ${C.border}`,
        borderLeft: urgent ? `3px solid ${accentColor}` : `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icon pill */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: `${accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={accentColor} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '10px', color: C.muted, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '16px', fontWeight: 800, color: C.text,
          lineHeight: 1.1, fontFamily: 'DM Sans',
        }}>
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: '10px', color: C.muted, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sub}
          </p>
        )}
      </div>

      {/* Badge */}
      {badge && (
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(239,68,68,0.15)', color: '#EF4444',
          fontSize: '9px', fontWeight: 700, padding: '2px 6px',
          borderRadius: '5px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
          {badge}
        </span>
      )}
    </motion.div>
  )
}

// ── Invoice Row ────────────────────────────────────────────────────────────────
function InvoiceRow({ sale }) {
  const st = STATUS_STYLE[sale.payment_status] || STATUS_STYLE.belum_lunas
  const name = sale.sembako_customers?.customer_name || sale.customer_name || '-'
  return (
    <div style={{
      background: C.input, borderRadius: '10px', padding: '10px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </p>
        <p style={{ fontSize: '11px', color: C.muted, marginTop: '1px' }}>{fmtDate(sale.transaction_date)}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{formatIDR(sale.total_amount)}</p>
        <span style={{
          display: 'inline-block', marginTop: '2px',
          background: st.bg, color: st.color,
          fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px',
          border: st.border ? `1px solid ${st.border}` : 'none',
        }}>{st.label}</span>
      </div>
    </div>
  )
}

// ── QuickStat Row ──────────────────────────────────────────────────────────────
function QuickStatRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', background: C.input, borderRadius: '10px',
    }}>
      <span style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{value}</span>
    </div>
  )
}

// ── Profit Chart Component ─────────────────────────────────────────────────────
function ProfitChart({ sales, isDesktop }) {
  const data = useMemo(() => {
    const last30Days = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      last30Days.push({ date: dateStr, label: fmtDate(dateStr), profit: 0 })
    }

    sales.forEach(s => {
      const dateStr = s.transaction_date?.slice(0, 10)
      const day = last30Days.find(d => d.date === dateStr)
      if (day) {
        const rev = Number(s.total_amount || 0)
        const cogs = Number(s.total_cogs || 0)
        const del = Number(s.delivery_cost || 0)
        const oth = Number(s.other_cost || 0)
        day.profit += (rev - cogs - del - oth)
      }
    })

    return last30Days
  }, [sales])

  return (
    <div style={{
      background: C.card, borderRadius: '16px', padding: '16px',
      border: `1px solid ${C.border}`, height: isDesktop ? '300px' : '220px',
      width: '100%', marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>TREN PROFIT (30 HARI TERAKHIR)</span>
        <TrendingUp size={14} color={C.accent} />
      </div>

      <div style={{ width: '100%', height: isDesktop ? '230px' : '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,88,12,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#4B3B2A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              stroke="#4B3B2A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `Rp ${v >= 1000000 ? (v/1000000).toFixed(1) + 'jt' : v >= 1000 ? (v/1000).toFixed(0) + 'rb' : v}`}
            />
            <Tooltip
              contentStyle={{ background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '12px' }}
              itemStyle={{ color: C.text }}
              formatter={(v) => [formatIDR(v), 'Profit']}
              labelStyle={{ color: C.muted, marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke={C.accent}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#profitGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Desktop version (unchanged layout, just cleaner) ──────────────────────────
function DesktopBeranda({ stats, sales, employees, navigate, name, salesLoading }) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const recentSales = useMemo(() => sales.slice(0, 5), [sales])
  const invoiceThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo).length
  const activeEmployees  = employees.filter(e => e.is_active !== false).length
  const lowStock  = stats?.stok?.lowStock || []
  const overdue   = stats?.penjualan?.overdueCount || 0
  const totalExp  = (stats?.pengeluaran?.totalExpenseThisMonth || 0) + (stats?.pengeluaran?.totalPayrollThisMonth || 0)

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans' }}>
            Selamat datang, {name}
          </h1>
          <p style={{ fontSize: '12px', color: C.muted, marginTop: '4px', fontWeight: 600, letterSpacing: '0.08em' }}>
            DASHBOARD DISTRIBUTOR SEMBAKO
          </p>
        </div>
        <button
          onClick={() => navigate(`${brokerBase}/penjualan`)}
          style={{
            background: '#EA580C', color: '#fff', border: 'none', borderRadius: '12px',
            padding: '0 20px', height: '40px', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 16px rgba(234,88,12,0.3)',
          }}
        >
          <Plus size={16} /> Catat Penjualan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <KPICard icon={CreditCard}  label="Piutang Toko"       value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} sub={overdue > 0 ? `${overdue} jatuh tempo` : 'Semua lancar'} urgent={(stats?.penjualan?.totalOutstanding||0)>0} />
        <KPICard icon={TrendingUp}  label="Revenue Bulan Ini"  value={formatIDR(stats?.penjualan?.revenueThisMonth || 0)}  sub={`Net profit: ${formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}`} />
        <KPICard icon={Package}     label="Nilai Stok Gudang"  value={formatIDR(stats?.stok?.nilaiStok || 0)}              sub={`${stats?.stok?.totalProduk || 0} jenis produk`} accentColor={C.amber} badge={lowStock.length > 0 ? `${lowStock.length} menipis` : null} />
        <KPICard icon={Receipt}     label="Pengeluaran Bulan Ini" value={formatIDR(totalExp)}                              sub="Termasuk gaji pegawai" accentColor="#EF4444" />
      </div>

      {/* Profit Chart */}
      <ProfitChart sales={sales} isDesktop={true} />

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(245,158,11,0.06)', border: `1px solid ${C.borderAm}`, borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={16} color={C.amber} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>STOK MENIPIS</span>
            <span style={{ background: 'rgba(245,158,11,0.15)', color: C.amber, fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '6px' }}>{lowStock.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lowStock.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card, borderRadius: '10px', padding: '10px 12px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{p.product_name}</p>
                  <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Sisa: {p.current_stock} {p.unit || ''} · Min: {p.min_stock_alert}</p>
                </div>
                <button onClick={() => navigate(`${brokerBase}/gudang?action=tambah&product=${p.id}`)}
                  style={{ background: 'rgba(234,88,12,0.15)', border: `1px solid rgba(234,88,12,0.3)`, color: C.accent, borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                  Tambah Stok
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>
        <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>INVOICE TERBARU</span>
            <button onClick={() => navigate(`${brokerBase}/penjualan`)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: C.muted, fontSize: '11px', fontWeight: 600 }}>
              Lihat semua <ChevronRight size={12} />
            </button>
          </div>
          {salesLoading ? <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Memuat...</p>
            : recentSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: '13px' }}>
                <Package size={28} color={C.muted} style={{ margin: '0 auto 8px' }} />
                <p>Belum ada invoice</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSales.map(s => <InvoiceRow key={s.id} sale={s} />)}
              </div>
            )}
        </div>
        <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '6px' }}>RINGKASAN</span>
          <QuickStatRow label="Produk Aktif"       value={stats?.stok?.totalProduk || 0} />
          <QuickStatRow label="Pegawai Aktif"       value={activeEmployees} />
          <QuickStatRow label="Invoice Bulan Ini"   value={invoiceThisMonth} />
          <QuickStatRow label="Total Piutang"       value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} />
          <QuickStatRow label="Invoice Jatuh Tempo" value={overdue > 0 ? <span style={{ color: '#EF4444' }}>{overdue}</span> : '0'} />
        </div>
      </div>
    </div>
  )
}

// ── Mobile version ────────────────────────────────────────────────────────────
function MobileBeranda({ stats, sales, employees, navigate, name, salesLoading, profile, tenant, profiles, switchTenant }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const recentSales      = useMemo(() => sales.slice(0, 5), [sales])
  const invoiceThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo).length
  const activeEmployees  = employees.filter(e => e.is_active !== false).length
  const lowStock  = stats?.stok?.lowStock || []
  const overdue   = stats?.penjualan?.overdueCount || 0
  const totalExp  = (stats?.pengeluaran?.totalExpenseThisMonth || 0) + (stats?.pengeluaran?.totalPayrollThisMonth || 0)

  return (
    <>
      <SembakoMobileBar onHamburger={() => setDrawerOpen(true)} profile={profile} brokerBase={getBrokerBasePath(tenant)} />
      <HamburgerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} tenant={tenant} profile={profile} profiles={profiles} switchTenant={switchTenant} />

      <div style={{ padding: '16px 16px 100px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{
            fontSize: '18px', fontWeight: 800, color: C.text,
            fontFamily: 'DM Sans', lineHeight: 1.2,
          }}>
            Selamat datang, {name} 👋
          </h1>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px', fontWeight: 600, letterSpacing: '0.08em' }}>
            DASHBOARD DISTRIBUTOR SEMBAKO
          </p>
        </div>
        {/* Revenue hero card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #2D1A08 0%, #1C1208 100%)',
            borderRadius: '18px',
            padding: '16px 18px',
            border: '1px solid rgba(234,88,12,0.25)',
            marginBottom: '12px',
          }}
        >
          <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>
            REVENUE BULAN INI
          </p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', lineHeight: 1 }}>
            {formatIDR(stats?.penjualan?.revenueThisMonth || 0)}
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: C.muted }}>
              Net Profit:{' '}
              <span style={{ color: '#34D399', fontWeight: 700 }}>
                {formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}
              </span>
            </span>
            <span style={{ fontSize: '11px', color: C.muted }}>
              Invoice:{' '}
              <span style={{ color: C.text, fontWeight: 700 }}>{invoiceThisMonth}</span>
            </span>
          </div>
        </motion.div>

        {/* Profit Chart */}
        <ProfitChart sales={sales} isDesktop={false} />

        {/* 2×2 KPI grid — compact horizontal cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <KPICard
            icon={CreditCard}
            label="Piutang Toko"
            value={formatIDR(stats?.penjualan?.totalOutstanding || 0)}
            sub={overdue > 0 ? `${overdue} jatuh tempo` : 'Lancar'}
            urgent={(stats?.penjualan?.totalOutstanding || 0) > 0}
          />
          <KPICard
            icon={Package}
            label="Nilai Stok"
            value={formatIDR(stats?.stok?.nilaiStok || 0)}
            sub={`${stats?.stok?.totalProduk || 0} produk`}
            accentColor={C.amber}
            badge={lowStock.length > 0 ? `${lowStock.length} tipis` : null}
          />
          <KPICard
            icon={Receipt}
            label="Pengeluaran"
            value={formatIDR(totalExp)}
            sub="Incl. gaji"
            accentColor="#EF4444"
          />
          <KPICard
            icon={TrendingUp}
            label="Pegawai Aktif"
            value={activeEmployees}
            sub={`${stats?.stok?.totalProduk || 0} produk aktif`}
            accentColor="#A78BFA"
          />
        </div>

        {/* Quick actions row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => navigate(`${brokerBase}/penjualan`)}
            style={{
              flex: 1, height: '42px', borderRadius: '12px',
              background: C.accent, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              color: '#fff', fontWeight: 700, fontSize: '13px',
              boxShadow: '0 4px 14px rgba(234,88,12,0.35)',
            }}
          >
            <Plus size={15} /> Catat Penjualan
          </button>
          <button
            onClick={() => navigate(`${brokerBase}/gudang`)}
            style={{
              height: '42px', width: '42px', borderRadius: '12px',
              background: 'rgba(234,88,12,0.1)',
              border: '1px solid rgba(234,88,12,0.25)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Warehouse size={17} color={C.accent} />
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(245,158,11,0.06)', border: `1px solid ${C.borderAm}`,
              borderRadius: '14px', padding: '14px', marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle size={14} color={C.amber} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>STOK MENIPIS</span>
              <span style={{ background: 'rgba(245,158,11,0.15)', color: C.amber, fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px' }}>{lowStock.length}</span>
            </div>
            {lowStock.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.card, borderRadius: '9px', padding: '9px 11px', marginBottom: '6px',
              }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{p.product_name}</p>
                  <p style={{ fontSize: '10px', color: C.muted, marginTop: '1px' }}>
                    Sisa {p.current_stock} {p.unit || ''} · Min {p.min_stock_alert}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`${brokerBase}/gudang?action=tambah&product=${p.id}`)}
                  style={{
                    background: 'rgba(234,88,12,0.15)', border: `1px solid rgba(234,88,12,0.3)`,
                    color: C.accent, borderRadius: '7px', padding: '4px 9px',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Tambah
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Invoice terbaru */}
        <div style={{
          background: C.card, borderRadius: '16px',
          padding: '14px', border: `1px solid ${C.border}`,
          marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>
              INVOICE TERBARU
            </span>
            <button
              onClick={() => navigate(`${brokerBase}/penjualan`)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: C.muted, fontSize: '11px', fontWeight: 600 }}
            >
              Lihat semua <ChevronRight size={11} />
            </button>
          </div>
          {salesLoading ? (
            <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Memuat...</p>
          ) : recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted }}>
              <ShoppingCart size={24} color={C.muted} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px' }}>Belum ada invoice</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {recentSales.map(s => <InvoiceRow key={s.id} sale={s} />)}
            </div>
          )}
        </div>

        {/* Ringkasan quick stats */}
        <div style={{
          background: C.card, borderRadius: '16px',
          padding: '14px', border: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', display: 'block', marginBottom: '10px' }}>
            RINGKASAN
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <QuickStatRow label="Produk Aktif"       value={stats?.stok?.totalProduk || 0} />
            <QuickStatRow label="Pegawai Aktif"       value={activeEmployees} />
            <QuickStatRow label="Invoice Bulan Ini"   value={invoiceThisMonth} />
            <QuickStatRow label="Invoice Jatuh Tempo" value={overdue > 0 ? <span style={{ color: '#EF4444' }}>{overdue}</span> : '0'} />
          </div>
        </div>

      </div>
    </>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function SembakoBeranda() {
  const _navigate   = useNavigate()
  const { profile, tenant, profiles, switchTenant } = useAuth()
  const isDesktop  = useMediaQuery('(min-width: 1024px)')
  
  const brokerBase = getBrokerBasePath(tenant)
  const navigate = (path, options) => {
    if (typeof path === 'string' && path.startsWith('/broker')) {
      return _navigate(path.replace('/broker', brokerBase), options)
    }
    return _navigate(path, options)
  }

  const { data: stats,    isLoading: statsLoading }  = useSembakoDashboardStats()
  const { data: sales = [], isLoading: salesLoading } = useSembakoSales()
  const { data: employees = [] }                      = useSembakoEmployees()

  const name = profile?.full_name?.split(' ')[0] || 'Pengguna'

  if (statsLoading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '60px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              background: C.card, borderRadius: '14px', height: '72px',
              border: `1px solid ${C.border}`, opacity: 0.5,
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {isDesktop ? (
        <DesktopBeranda
          stats={stats} sales={sales} employees={employees}
          navigate={navigate} name={name} salesLoading={salesLoading}
        />
      ) : (
        <MobileBeranda
          stats={stats} sales={sales} employees={employees}
          navigate={navigate} name={name} salesLoading={salesLoading}
          profile={profile} tenant={tenant}
          profiles={profiles} switchTenant={switchTenant}
        />
      )}
    </div>
  )
}
