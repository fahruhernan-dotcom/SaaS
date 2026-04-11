import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation, useParams, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import {
  CreditCard, TrendingUp, Package, Receipt,
  BarChart2, User, ShoppingCart, Warehouse, Users, Clock,
  Plus, Menu, X, Shield, AlertTriangle, ChevronRight, ChevronLeft,
  Truck, Wallet, CalendarX,
} from 'lucide-react'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useSembakoDashboardStats, useSembakoSales, useSembakoEmployees, useSembakoDeliveries } from '@/lib/hooks/useSembakoData'
import { formatIDR } from '@/lib/format'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'
import { SembakoMobileBar, SembakoHamburgerDrawer } from './components/SembakoNavigation'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  startOfWeek, startOfMonth, endOfMonth, subMonths, addMonths, addDays,
  format, isSameDay, eachDayOfInterval, isSameMonth,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { C } from './components/sembakoSaleUtils'
import SmartInsight from '@/dashboard/_shared/components/SmartInsight'

// ── Skeleton ────────────────────────────────────────────────────────────────────
function Skel({ h = '60px', w = '100%', r = '14px' }) {
  return (
    <div className="animate-pulse" style={{ background: '#231A0E', borderRadius: r, height: h, width: w }} />
  )
}

function BerandaSkeleton({ isDesktop }) {
  if (isDesktop) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skel h="22px" w="160px" r="8px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h="88px" r="18px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <Skel h="260px" r="20px" />
          <Skel h="260px" r="20px" />
        </div>
        <Skel h="200px" r="20px" />
      </div>
    )
  }

  return (
    <div>
      {/* Mobile top bar */}
      <div style={{ background: '#0E0905', height: '60px', borderBottom: '1px solid rgba(234,88,12,0.1)' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Greeting */}
        <Skel h="20px" w="55%" r="8px" />
        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h="72px" r="14px" />)}
        </div>
        {/* Chart */}
        <Skel h="180px" r="20px" />
        {/* List rows */}
        {[...Array(3)].map((_, i) => <Skel key={i} h="78px" r="16px" />)}
      </div>
    </div>
  )
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

// Navigation local components removed (extracted to SembakoNavigation.jsx)


// ── KPI Card (horizontal, compact) ────────────────────────────────────────────
// Icon beside text — reduces card height ~35% vs stacked layout
function KPICard({ icon: Icon, label, value, sub, accentColor = C.accent, urgent, badge, trend }) {
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
      {badge && !trend && (
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(239,68,68,0.15)', color: '#EF4444',
          fontSize: '9px', fontWeight: 700, padding: '2px 6px',
          borderRadius: '5px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
          {badge}
        </span>
      )}
      {/* Trend badge */}
      {trend != null && (
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          background: trend >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
          color: trend >= 0 ? '#34D399' : '#EF4444',
          fontSize: '9px', fontWeight: 800, padding: '2px 6px',
          borderRadius: '5px', whiteSpace: 'nowrap',
        }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
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

// ── Chart Tooltip ──────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '12px',
      padding: '12px 14px', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, marginBottom: '6px' }}>{d.fullDate}</p>
      <p style={{ fontSize: '13px', fontWeight: 800, color: C.accent, marginBottom: '6px' }}>{formatIDR(d.profit)}</p>
      {d.txs?.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {d.txs.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px' }}>
              <span style={{ color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{tx.label}</span>
              <span style={{ color: C.text, fontWeight: 700, whiteSpace: 'nowrap' }}>{formatIDR(tx.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profit Chart Component ─────────────────────────────────────────────────────
function ProfitChart({ weeklyData, monthlyData, chartPeriod, setChartPeriod, isDesktop }) {
  const data = chartPeriod === 'weekly' ? weeklyData : monthlyData
  const totalProfit = data.reduce((s, d) => s + d.profit, 0)

  return (
    <div style={{
      background: C.card, borderRadius: '16px', padding: '16px',
      border: `1px solid ${C.border}`, width: '100%', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.1em' }}>
            NET PROFIT
          </span>
          <p style={{ fontSize: '20px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', lineHeight: 1.1 }}>
            {formatIDR(totalProfit)}
          </p>
        </div>
        {/* Period toggle */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
          padding: '3px', border: `1px solid ${C.border}`,
        }}>
          {[['weekly', 'Minggu'], ['monthly', 'Bulan']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setChartPeriod(key)}
              style={{
                padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: 800,
                background: chartPeriod === key ? C.accent : 'transparent',
                color: chartPeriod === key ? '#fff' : C.muted,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: isDesktop ? '200px' : '150px', marginTop: '12px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,88,12,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#4B3B2A" fontSize={10} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis
              stroke="#4B3B2A" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(234,88,12,0.2)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="profit" stroke={C.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" activeDot={{ r: 5, fill: C.accent, stroke: C.card, strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Calendar Heatmap ───────────────────────────────────────────────────────────
function CalendarHeatmap({ currentMonth, selectedDate, setSelectedDate, piutangDates, deliveryDates }) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: addDays(monthEnd, (7 - ((monthEnd.getDay() || 7) - 1)) % 7) })

  const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 800, color: C.muted, padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {days.map((day, i) => {
          const dStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())
          const hasPiutang = piutangDates.has(dStr)
          const hasDelivery = deliveryDates.has(dStr)

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              style={{
                aspectRatio: '1', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: isSelected ? C.accent : isToday ? 'rgba(234,88,12,0.15)' : 'transparent',
                color: isSelected ? '#fff' : inMonth ? C.text : C.muted,
                fontSize: '11px', fontWeight: isSelected || isToday ? 800 : 400,
                opacity: inMonth ? 1 : 0.3,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '2px', padding: '2px',
              }}
            >
              <span>{format(day, 'd')}</span>
              {inMonth && (hasPiutang || hasDelivery) && !isSelected && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  {hasPiutang && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#EF4444' }} />}
                  {hasDelivery && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.amber }} />}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Agenda Section ─────────────────────────────────────────────────────────────
function AgendaSection({ sales, deliveries, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter }) {
  const piutangEvents = useMemo(() =>
    sales.filter(s => s.payment_status !== 'lunas' && s.due_date)
      .map(s => ({ ...s, type: 'Piutang', date: s.due_date, icon: Wallet, color: '#EF4444' })),
    [sales]
  )

  const deliveryEvents = useMemo(() =>
    deliveries.filter(d => d.status !== 'delivered')
      .map(d => ({ ...d, type: 'Pengiriman', date: d.created_at?.slice(0, 10), icon: Truck, color: C.amber })),
    [deliveries]
  )

  const piutangDates = useMemo(() => new Set(piutangEvents.map(e => e.date)), [piutangEvents])
  const deliveryDates = useMemo(() => new Set(deliveryEvents.map(e => e.date)), [deliveryEvents])

  const allEvents = [...piutangEvents, ...deliveryEvents]

  const filteredEvents = useMemo(() => {
    let list = allEvents.filter(e => e.date && isSameDay(new Date(e.date), selectedDate))
    if (agendaFilter !== 'Semua') list = list.filter(e => e.type === agendaFilter)
    return list
  }, [allEvents, selectedDate, agendaFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const mStr = format(currentMonth, 'yyyy-MM')
  const monthPiutang = piutangEvents.filter(e => e.date?.startsWith(mStr)).reduce((s, e) => s + (e.remaining_amount || 0), 0)
  const monthDeliveries = deliveryEvents.filter(e => e.date?.startsWith(mStr)).length

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
      {/* Header with month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>AGENDA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: '4px' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, minWidth: '80px', textAlign: 'center' }}>
            {format(currentMonth, 'MMM yyyy', { locale: idLocale })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: '4px' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <CalendarHeatmap
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        piutangDates={piutangDates}
        deliveryDates={deliveryDates}
      />

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '12px 0' }}>
        <div style={{ background: C.input, borderRadius: '10px', padding: '8px 10px' }}>
          <p style={{ fontSize: '9px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginBottom: '2px' }}>PIUTANG BULAN INI</p>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>{formatIDR(monthPiutang)}</p>
        </div>
        <div style={{ background: C.input, borderRadius: '10px', padding: '8px 10px' }}>
          <p style={{ fontSize: '9px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginBottom: '2px' }}>PENGIRIMAN AKTIF</p>
          <p style={{ fontSize: '13px', fontWeight: 800, color: C.amber }}>{monthDeliveries}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {['Semua', 'Piutang', 'Pengiriman'].map(tab => (
          <button
            key={tab}
            onClick={() => setAgendaFilter(tab)}
            style={{
              padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '10px', fontWeight: 800,
              background: agendaFilter === tab ? C.accent : 'rgba(255,255,255,0.04)',
              color: agendaFilter === tab ? '#fff' : C.muted,
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CalendarX size={24} color={C.muted} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
            <p style={{ fontSize: '12px', color: C.muted }}>Tidak ada agenda</p>
          </div>
        ) : (
          filteredEvents.map((e, i) => {
            const EventIcon = e.icon
            const name = e.type === 'Piutang'
              ? (e.sembako_customers?.customer_name || e.customer_name || '-')
              : (e.sembako_sales?.sembako_customers?.customer_name || e.sembako_sales?.customer_name || '-')
            const subText = e.type === 'Piutang'
              ? formatIDR(e.remaining_amount || 0)
              : `${e.status || 'pending'}`
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: C.input, borderRadius: '10px', padding: '8px 10px',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: `${e.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EventIcon size={13} color={e.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <p style={{ fontSize: '10px', color: e.color, fontWeight: 600 }}>{e.type} · {subText}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Desktop version (unchanged layout, just cleaner) ──────────────────────────
function DesktopBeranda({ stats, sales, employees, navigate, name, salesLoading, insight, kpiTrends, chartPeriod, setChartPeriod, weeklyChartData, monthlyChartData, deliveries, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter }) {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const recentSales = useMemo(() => sales.slice(0, 5), [sales])
  const invoiceThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo).length
  const activeEmployees  = employees.filter(e => e.status === 'aktif').length
  const lowStock  = stats?.stok?.lowStock || []
  const overdue   = stats?.penjualan?.overdueCount || 0
  const totalExp  = (stats?.pengeluaran?.totalExpenseThisMonth || 0) + (stats?.pengeluaran?.totalPayrollThisMonth || 0)

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans' }}>
            Selamat datang, {name}
          </h1>
          <p style={{ fontSize: '12px', color: C.muted, marginTop: '4px', fontWeight: 600, letterSpacing: '0.08em' }}>
            DASHBOARD DISTRIBUTOR SEMBAKO
          </p>
          <SmartInsight insight={insight} className="mt-2" />
        </div>
        <button
          onClick={() => navigate(`${brokerBase}/penjualan?action=new`)}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px', marginTop: '20px' }}>
        <KPICard icon={CreditCard}  label="Piutang Toko"       value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} sub={overdue > 0 ? `${overdue} jatuh tempo` : 'Semua lancar'} urgent={(stats?.penjualan?.totalOutstanding||0)>0} trend={kpiTrends?.piutangTrend} />
        <KPICard icon={TrendingUp}  label="Revenue Bulan Ini"  value={formatIDR(stats?.penjualan?.revenueThisMonth || 0)}  sub={`Net profit: ${formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}`} trend={kpiTrends?.txTrend} />
        <KPICard icon={Package}     label="Nilai Stok Gudang"  value={formatIDR(stats?.stok?.nilaiStok || 0)}              sub={`${stats?.stok?.totalProduk || 0} jenis produk`} accentColor={C.amber} badge={lowStock.length > 0 ? `${lowStock.length} menipis` : null} />
        <KPICard icon={Receipt}     label="Pengeluaran Bulan Ini" value={formatIDR(totalExp)}                              sub="Termasuk gaji pegawai" accentColor="#EF4444" />
      </div>

      {/* Main grid: left content + right agenda */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div>
          <ProfitChart weeklyData={weeklyChartData} monthlyData={monthlyChartData} chartPeriod={chartPeriod} setChartPeriod={setChartPeriod} isDesktop={true} />

          {lowStock.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(245,158,11,0.06)', border: `1px solid ${C.borderAm}`, borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
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

          <CollectionReminders sales={sales} navigate={navigate} brokerBase={brokerBase} />

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>
            <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>INVOICE TERBARU</span>
                <button onClick={() => navigate(`${brokerBase}/penjualan`)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: C.muted, fontSize: '11px', fontWeight: 600 }}>
                  Lihat semua <ChevronRight size={12} />
                </button>
              </div>
              {salesLoading
                ? <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Memuat...</p>
                : recentSales.length === 0
                  ? <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: '13px' }}>
                      <Package size={28} color={C.muted} style={{ margin: '0 auto 8px' }} />
                      <p>Belum ada invoice</p>
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recentSales.map(s => <InvoiceRow key={s.id} sale={s} />)}
                    </div>
              }
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

        {/* RIGHT COLUMN — Agenda */}
        <AgendaSection
          sales={sales}
          deliveries={deliveries}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          agendaFilter={agendaFilter}
          setAgendaFilter={setAgendaFilter}
        />

      </div>
    </div>
  )
}

function CollectionReminders({ sales, navigate, brokerBase }) {
  const now = new Date()
  const reminders = useMemo(() => {
    return sales
      .filter(s => s.payment_status !== 'lunas' && s.due_date && !s.is_deleted)
      .map(s => {
        const due = new Date(s.due_date)
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
        return { ...s, daysDiff: diff }
      })
      .filter(s => s.daysDiff <= 3) // Today, overdue, or next 3 days
      .sort((a, b) => a.daysDiff - b.daysDiff)
      .slice(0, 5)
  }, [sales])

  if (reminders.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(239,68,68,0.04)', border: `1px solid rgba(239,68,68,0.15)`, borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Clock size={16} color="#EF4444" />
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.1em' }}>PENAGIHAN JATUH TEMPO</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {reminders.map(s => (
          <div key={s.id} style={{ background: C.card, borderRadius: '12px', padding: '12px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <p style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{s.sembako_customers?.customer_name || s.customer_name}</p>
               <p style={{ fontSize: '11px', color: s.daysDiff < 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                 {s.daysDiff < 0 ? `Telat ${Math.abs(s.daysDiff)} hari` : s.daysDiff === 0 ? 'Jatuh tempo HARI INI' : `H-${s.daysDiff} Jatuh tempo`}
               </p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <p style={{ fontSize: '14px', fontWeight: 900, color: C.text }}>{formatIDR(s.remaining_amount)}</p>
               <button 
                onClick={() => navigate(`${brokerBase}/penjualan`)}
                style={{ fontSize: '10px', color: C.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Detail <ChevronRight size={10} inline="true" />
               </button>
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Mobile version ────────────────────────────────────────────────────────────
function MobileBeranda({ stats, sales, employees, navigate, name, salesLoading, profile, tenant, profiles, switchTenant, insight, chartPeriod, setChartPeriod, weeklyChartData, monthlyChartData, deliveries, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter }) {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`
  const { setSidebarOpen } = useOutletContext()
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const recentSales      = useMemo(() => sales.slice(0, 5), [sales])
  const invoiceThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo).length
  const activeEmployees  = employees.filter(e => e.status === 'aktif').length
  const lowStock  = stats?.stok?.lowStock || []
  const overdue   = stats?.penjualan?.overdueCount || 0
  const totalExp  = (stats?.pengeluaran?.totalExpenseThisMonth || 0) + (stats?.pengeluaran?.totalPayrollThisMonth || 0)

  return (
    <>
      <SembakoMobileBar onHamburger={() => setSidebarOpen(true)} title="Dashboard" />

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
          <SmartInsight insight={insight} className="mt-2" />
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
        <ProfitChart weeklyData={weeklyChartData} monthlyData={monthlyChartData} chartPeriod={chartPeriod} setChartPeriod={setChartPeriod} isDesktop={false} />

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
            onClick={() => navigate(`${brokerBase}/penjualan?action=new`)}
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

        {/* Agenda */}
        <div style={{ marginBottom: '14px' }}>
          <AgendaSection
            sales={sales}
            deliveries={deliveries}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
          />
        </div>

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
  const navigate    = useNavigate()
  const { profile, tenant, profiles, switchTenant } = useAuth()
  const isDesktop  = useMediaQuery('(min-width: 1024px)')

  const { data: stats,       isLoading: statsLoading }  = useSembakoDashboardStats()
  const { data: sales = [],  isLoading: salesLoading }  = useSembakoSales()
  const { data: employees = [] }                        = useSembakoEmployees()
  const { data: deliveries = [] }                       = useSembakoDeliveries()

  // Chart + insight state
  const [chartPeriod,   setChartPeriod]   = useState('weekly')
  const [selectedDate,  setSelectedDate]  = useState(new Date())
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [agendaFilter,  setAgendaFilter]  = useState('Semua')

  const name = profile?.full_name?.split(' ')[0] || 'Pengguna'

  // Build chart data
  const { weeklyChartData, monthlyChartData, insight, kpiTrends } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const mondayStart = startOfWeek(today, { weekStartsOn: 1 })
    const monthStart  = startOfMonth(today)
    const m1Start     = startOfMonth(subMonths(today, 1))

    const buildData = (start, end) => {
      const days = []
      let curr = new Date(start)
      while (curr <= end) {
        const dStr = format(curr, 'yyyy-MM-dd')
        const isFuture = curr > today
        const daySales = isFuture ? [] : sales.filter(s => s.transaction_date?.slice(0, 10) === dStr)
        const isWeekly = (end - start) / 86400000 < 8
        days.push({
          name: isWeekly
            ? format(curr, 'EEE', { locale: idLocale })
            : format(curr, 'd'),
          fullDate: format(curr, 'EEEE, d MMMM yyyy', { locale: idLocale }),
          profit: isFuture ? 0 : daySales.reduce((s, sale) => {
            const rev  = Number(sale.total_amount || 0)
            const cogs = Number(sale.total_cogs   || 0)
            const del  = Number(sale.delivery_cost || 0)
            const oth  = Number(sale.other_cost    || 0)
            return s + (rev - cogs - del - oth)
          }, 0),
          txs: daySales.map(s => ({
            id: s.id,
            label: s.sembako_customers?.customer_name || s.customer_name || `Invoice #${s.id?.slice(0, 4)}`,
            value: Number(s.net_profit || 0),
          })),
        })
        curr = addDays(curr, 1)
      }
      return days
    }

    const weeklyChartData  = buildData(mondayStart, addDays(mondayStart, 6))
    const monthlyChartData = buildData(monthStart, today)

    // Smart insight: W0 vs W1
    const w0Start = addDays(today, -6)
    const w1End   = addDays(w0Start, -1)
    const w1Start = addDays(w1End, -6)
    const getProfit = (from, to) => sales
      .filter(s => { const d = new Date(s.transaction_date); return d >= from && d <= to })
      .reduce((sum, s) => sum + Number(s.net_profit || 0), 0)
    const w0 = getProfit(w0Start, today)
    const w1 = getProfit(w1Start, w1End)
    let insight = null
    if (w1 !== 0) {
      const diff = ((w0 - w1) / Math.abs(w1)) * 100
      insight = {
        type: diff >= 0 ? 'up' : 'down',
        text: diff >= 0
          ? `↑ Profit naik +${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`
          : `↓ Profit turun ${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`,
      }
    }

    // KPI trends: this month vs last month
    const m0Sales = sales.filter(s => new Date(s.transaction_date) >= monthStart && new Date(s.transaction_date) <= today)
    const m1Sales = sales.filter(s => { const d = new Date(s.transaction_date); return d >= m1Start && d < monthStart })
    const m0Outstanding = m0Sales.filter(s => s.payment_status !== 'lunas').reduce((s, i) => s + (i.remaining_amount || 0), 0)
    const m1Outstanding = m1Sales.filter(s => s.payment_status !== 'lunas').reduce((s, i) => s + (i.remaining_amount || 0), 0)
    const piutangTrend = m1Outstanding !== 0 ? ((m0Outstanding - m1Outstanding) / m1Outstanding) * 100 : null
    const txTrend = m1Sales.length !== 0 ? ((m0Sales.length - m1Sales.length) / m1Sales.length) * 100 : null

    return { weeklyChartData, monthlyChartData, insight, kpiTrends: { piutangTrend, txTrend } }
  }, [sales])

  if (statsLoading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <BerandaSkeleton isDesktop={isDesktop} />
      </div>
    )
  }

  const sharedProps = {
    stats, sales, employees, deliveries, navigate, name, salesLoading,
    insight, kpiTrends, chartPeriod, setChartPeriod,
    weeklyChartData, monthlyChartData,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,
    agendaFilter, setAgendaFilter,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {isDesktop ? (
        <DesktopBeranda {...sharedProps} />
      ) : (
        <MobileBeranda {...sharedProps} profile={profile} tenant={tenant} profiles={profiles} switchTenant={switchTenant} />
      )}
    </div>
  )
}
