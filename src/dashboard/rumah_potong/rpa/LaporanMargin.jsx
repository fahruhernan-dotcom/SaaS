import { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, FileText, Lock, BarChart3 } from 'lucide-react'
import { format, startOfMonth, parseISO, differenceInDays, addDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { DatePicker } from '@/components/ui/DatePicker'
import TopBar from '../../_shared/components/TopBar'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useRPAMarginReport } from '@/lib/hooks/useRPAData'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const fmtShort = (n) => {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}rb`
  return String(n)
}

const fmtDate = (d) => {
  if (!d) return '-'
  try { return format(new Date(d), 'd MMM yy', { locale: localeId }) } catch { return d }
}

const marginColor = (pct) => {
  const n = Number(pct)
  if (n >= 15) return '#34D399'
  if (n >= 10) return '#F59E0B'
  return '#EF4444'
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px', padding: '10px 14px', minWidth: '160px',
    }}>
      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: '12px', color: p.color, fontWeight: 600, marginBottom: '3px' }}>
          {p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

// ─── Build Chart Data ─────────────────────────────────────────────────────────

function buildChartData(invoices, startDate, endDate) {
  if (!invoices?.length || !startDate || !endDate) return []
  const startD = parseISO(startDate)
  const endD = parseISO(endDate)
  const daysDiff = differenceInDays(endD, startD)
  const useWeekly = daysDiff > 30

  const map = {}

  if (!useWeekly) {
    for (let i = 0; i <= daysDiff; i++) {
      const d = addDays(startD, i)
      const key = format(d, 'dd/MM')
      map[key] = { label: key, revenue: 0, cost: 0, profit: 0 }
    }
  }

  invoices.forEach(inv => {
    const d = new Date(inv.transaction_date)
    const key = useWeekly
      ? `Mg${format(d, 'w')}`
      : format(d, 'dd/MM')
    if (!map[key]) map[key] = { label: key, revenue: 0, cost: 0, profit: 0 }
    map[key].revenue += inv.total_amount || 0
    map[key].cost += inv.total_cost || 0
    map[key].profit += inv.net_profit || 0
  })

  return Object.values(map)
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function Skeleton({ h = 60, rounded = 12 }) {
  return (
    <div style={{ height: h, borderRadius: rounded, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function RPALaporanMargin() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { tenant } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.plan === 'starter' && sub.status !== 'trial'

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showAllInvoices, setShowAllInvoices] = useState(false)
  const [invFilter, setInvFilter] = useState('all')

  // NOTE: ALL hooks must be called before any conditional return (Rules of Hooks).
  // useRPAMarginReport runs for all users; result is unused when isStarter = true.
  const { data, isLoading } = useRPAMarginReport(startDate, endDate)

  const chartData = useMemo(
    () => buildChartData(data?.invoices, startDate, endDate),
    [data, startDate, endDate]
  )

  // byProduct sorted by revenue desc
  const productRows = useMemo(() => {
    if (!data?.byProduct) return []
    return Object.entries(data.byProduct)
      .map(([name, v]) => ({
        name,
        ...v,
        profit: v.revenue - v.cost,
        margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [data])

  // byCustomer sorted by revenue desc, top 10
  const customerRows = useMemo(() => {
    if (!data?.byCustomer) return []
    return Object.entries(data.byCustomer)
      .map(([name, v]) => ({
        name, ...v,
        margin: v.revenue > 0 ? (v.profit / v.revenue * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [data])

  // Filtered invoices for detail table
  const filteredInvoices = useMemo(() => {
    if (!data?.invoices) return []
    if (invFilter === 'all') return data.invoices
    return data.invoices.filter(i => i.payment_status === invFilter)
  }, [data, invFilter])

  // ── Upgrade wall — must come after all hooks ──────────────────────────────
  if (isStarter) {
    return (
      <div style={{ minHeight: '100vh', background: '#06090F' }}>
        {!isDesktop && <TopBar title="Laporan Margin" subtitle="Analisis profitabilitas" />}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '80vh', padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px', marginBottom: '20px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart3 size={28} color="#F59E0B" />
          </div>
          <span style={{
            display: 'inline-block', marginBottom: '14px',
            padding: '4px 12px', borderRadius: '20px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            fontSize: '11px', fontWeight: 700, color: '#F59E0B',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Fitur Pro
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '10px', fontFamily: 'Sora' }}>
            Laporan Margin & HPP
          </h2>
          <p style={{ fontSize: '14px', color: '#4B6478', maxWidth: '320px', lineHeight: 1.6, marginBottom: '28px' }}>
            Analitik HPP, margin per produk, breakdown per customer, dan chart revenue vs cost tersedia di plan Pro ke atas.
          </p>
          <Link
            to="/upgrade"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '14px',
              background: '#F59E0B', color: '#0D1117',
              fontWeight: 800, fontSize: '14px', textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
            }}
          >
            <Lock size={15} />
            Upgrade ke Pro
          </Link>
        </div>
      </div>
    )
  }

  const mc = marginColor(data?.marginPct ?? 0)
  const profitPositive = (data?.totalProfit ?? 0) >= 0

  const tableHeaderStyle = {
    padding: '9px 12px', textAlign: 'left',
    fontSize: '10px', fontWeight: 700, color: '#4B6478',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    background: 'rgba(255,255,255,0.02)',
  }
  const tdStyle = (align = 'left') => ({
    padding: '10px 12px', fontSize: '13px', color: '#CBD5E1', textAlign: align,
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#06090F' }}>
      {/* Header */}
      {!isDesktop ? (
        <TopBar title="Laporan Margin" subtitle={`${fmtDate(startDate)} – ${fmtDate(endDate)}`} />
      ) : (
        <div style={{ padding: '28px 32px 0' }}>
          <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>Laporan Margin</h1>
          <p style={{ fontSize: '14px', color: '#4B6478', marginTop: '4px' }}>Analisis profitabilitas distribusi RPA</p>
        </div>
      )}

      <div style={{ padding: isDesktop ? '20px 32px' : '16px 16px' }}>

        {/* Date Range Picker */}
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          marginBottom: '20px', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ fontSize: '11px', color: '#4B6478', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dari
            </label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Tanggal mulai" />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ fontSize: '11px', color: '#4B6478', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sampai
            </label>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Tanggal akhir" />
          </div>
        </div>

        {/* ── SECTION A: KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: '10px', marginBottom: '20px' }}>
          {/* Total Revenue */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <DollarSign size={12} />TOTAL REVENUE
            </div>
            {isLoading ? <Skeleton h={28} rounded={6} /> : (
              <div style={{ fontSize: isDesktop ? '18px' : '15px', fontWeight: 700, color: '#F59E0B' }}>
                {fmt(data?.totalRevenue)}
              </div>
            )}
          </div>

          {/* Total HPP */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '6px' }}>TOTAL HPP</div>
            {isLoading ? <Skeleton h={28} rounded={6} /> : (
              <div style={{ fontSize: isDesktop ? '18px' : '15px', fontWeight: 700, color: '#94A3B8' }}>
                {fmt(data?.totalCost)}
              </div>
            )}
          </div>

          {/* Gross Profit */}
          <div style={{
            background: profitPositive ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${profitPositive ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)'}`,
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {profitPositive ? <TrendingUp size={12} color="#34D399" /> : <TrendingDown size={12} color="#EF4444" />}
              GROSS PROFIT
            </div>
            {isLoading ? <Skeleton h={28} rounded={6} /> : (
              <div style={{ fontSize: isDesktop ? '18px' : '15px', fontWeight: 700, color: profitPositive ? '#34D399' : '#EF4444' }}>
                {fmt(data?.totalProfit)}
              </div>
            )}
          </div>

          {/* Margin % */}
          <div style={{
            background: `rgba(${mc === '#34D399' ? '52,211,153' : mc === '#F59E0B' ? '245,158,11' : '239,68,68'},0.05)`,
            border: `1px solid rgba(${mc === '#34D399' ? '52,211,153' : mc === '#F59E0B' ? '245,158,11' : '239,68,68'},0.2)`,
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '6px' }}>MARGIN %</div>
            {isLoading ? <Skeleton h={28} rounded={6} /> : (
              <div style={{ fontSize: isDesktop ? '22px' : '18px', fontWeight: 700, color: mc, fontFamily: 'Sora' }}>
                {data?.marginPct ?? 0}%
              </div>
            )}
            {!isLoading && (
              <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '3px' }}>
                {Number(data?.marginPct) >= 15 ? '✓ Sehat' : Number(data?.marginPct) >= 10 ? '⚠ Perlu perhatian' : '✗ Di bawah target'}
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION B: Chart ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px', padding: '16px', marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '14px' }}>
            Revenue vs HPP vs Profit
          </h3>
          {isLoading ? <Skeleton h={240} rounded={10} /> : chartData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#4B6478', fontSize: '13px' }}>Tidak ada data dalam periode ini.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4B6478' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#4B6478' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#F59E0B" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                <Bar dataKey="cost" name="HPP" fill="rgba(255,255,255,0.15)" radius={[3, 3, 0, 0]} />
                <Line dataKey="profit" name="Profit" stroke="#34D399" strokeWidth={2} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── SECTION C: 2-Column Breakdown ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: '16px', marginBottom: '20px',
        }}>

          {/* Breakdown per Produk */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }}>Breakdown per Produk</h3>
            </div>
            {isLoading ? (
              <div style={{ padding: '12px' }}><Skeleton h={120} rounded={8} /></div>
            ) : productRows.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#4B6478' }}>Belum ada data</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Produk', 'Qty', 'Revenue', 'Profit', 'Margin'].map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productRows.map(row => (
                    <tr key={row.name}>
                      <td style={tdStyle()}><span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>{row.name}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px' }}>{row.qty.toFixed(1)}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px', color: '#F59E0B' }}>{fmtShort(row.revenue)}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px', color: row.profit >= 0 ? '#34D399' : '#EF4444' }}>{fmtShort(row.profit)}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px', color: marginColor(row.margin), fontWeight: 700 }}>{row.margin}%</span></td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                    <td style={{ ...tdStyle(), fontWeight: 700, color: '#F1F5F9', borderBottom: 'none' }}>TOTAL</td>
                    <td style={{ ...tdStyle('right'), fontWeight: 700, color: '#F1F5F9', borderBottom: 'none' }}>
                      {productRows.reduce((s, r) => s + r.qty, 0).toFixed(1)}
                    </td>
                    <td style={{ ...tdStyle('right'), fontWeight: 700, color: '#F59E0B', borderBottom: 'none' }}>
                      {fmtShort(productRows.reduce((s, r) => s + r.revenue, 0))}
                    </td>
                    <td style={{ ...tdStyle('right'), fontWeight: 700, color: '#34D399', borderBottom: 'none' }}>
                      {fmtShort(productRows.reduce((s, r) => s + r.profit, 0))}
                    </td>
                    <td style={{ ...tdStyle('right'), borderBottom: 'none' }}>
                      <span style={{ color: mc, fontWeight: 700 }}>{data?.marginPct ?? 0}%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Top Toko */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }}>Top Toko (maks. 10)</h3>
            </div>
            {isLoading ? (
              <div style={{ padding: '12px' }}><Skeleton h={120} rounded={8} /></div>
            ) : customerRows.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#4B6478' }}>Belum ada data</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Toko', 'Inv', 'Revenue', 'Profit', 'Margin'].map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customerRows.map((row, idx) => (
                    <tr key={row.name} style={{ background: idx === 0 ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                      <td style={tdStyle()}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>
                          {idx === 0 && <span style={{ color: '#F59E0B', marginRight: '4px' }}>★</span>}
                          {row.name}
                        </span>
                      </td>
                      <td style={{ ...tdStyle('center') }}><span style={{ fontSize: '12px' }}>{row.invoiceCount}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px', color: '#F59E0B' }}>{fmtShort(row.revenue)}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px', color: row.profit >= 0 ? '#34D399' : '#EF4444' }}>{fmtShort(row.profit)}</span></td>
                      <td style={tdStyle('right')}><span style={{ fontSize: '12px', color: marginColor(row.margin), fontWeight: 700 }}>{row.margin}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── SECTION D: Semua Invoice (Collapsible) ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setShowAllInvoices(v => !v)}
            style={{
              width: '100%', padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} />
              Semua Invoice ({data?.invoices?.length ?? 0})
            </span>
            {showAllInvoices ? <ChevronUp size={16} color="#4B6478" /> : <ChevronDown size={16} color="#4B6478" />}
          </button>

          <AnimatePresence>
            {showAllInvoices && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {/* Filter */}
                <div style={{ padding: '8px 16px 10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'belum_lunas', label: 'Belum Lunas' },
                    { key: 'sebagian', label: 'Sebagian' },
                    { key: 'lunas', label: 'Lunas' },
                  ].map(t => (
                    <button key={t.key} onClick={() => setInvFilter(t.key)} style={{
                      flexShrink: 0, padding: '5px 12px', borderRadius: '16px',
                      border: invFilter === t.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      background: invFilter === t.key ? '#F59E0B' : 'transparent',
                      color: invFilter === t.key ? '#0D1117' : '#64748B',
                      cursor: 'pointer', fontSize: '12px', fontWeight: invFilter === t.key ? 700 : 400,
                    }}>{t.label}</button>
                  ))}
                </div>

                {isLoading ? (
                  <div style={{ padding: '12px' }}><Skeleton h={80} rounded={8} /></div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Invoice #', 'Toko', 'Tanggal', 'Total', 'HPP', 'Profit', 'Status'].map(h => (
                          <th key={h} style={tableHeaderStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#4B6478' }}>
                            Tidak ada invoice
                          </td>
                        </tr>
                      ) : filteredInvoices.map((inv, idx) => {
                        const profit = inv.net_profit || (inv.total_amount - inv.total_cost) || 0
                        const STATUS_COLOR = { lunas: '#34D399', sebagian: '#60A5FA', belum_lunas: '#F59E0B' }
                        return (
                          <tr key={inv.id}>
                            <td style={{ ...tdStyle(), fontFamily: 'monospace', fontSize: '11px', color: '#F59E0B' }}>{inv.invoice_number}</td>
                            <td style={{ ...tdStyle(), fontSize: '12px', fontWeight: 600 }}>
                              {inv.customer_name ?? inv.rpa_customers?.customer_name}
                            </td>
                            <td style={{ ...tdStyle(), fontSize: '12px' }}>{fmtDate(inv.transaction_date)}</td>
                            <td style={{ ...tdStyle('right'), fontSize: '12px', color: '#F59E0B' }}>{fmt(inv.total_amount)}</td>
                            <td style={{ ...tdStyle('right'), fontSize: '12px', color: '#94A3B8' }}>{fmt(inv.total_cost)}</td>
                            <td style={{ ...tdStyle('right'), fontSize: '12px', color: profit >= 0 ? '#34D399' : '#EF4444', fontWeight: 600 }}>
                              {fmt(profit)}
                            </td>
                            <td style={tdStyle()}>
                              <span style={{
                                background: `rgba(${STATUS_COLOR[inv.payment_status] === '#34D399' ? '52,211,153' : STATUS_COLOR[inv.payment_status] === '#60A5FA' ? '96,165,250' : '245,158,11'},0.12)`,
                                color: STATUS_COLOR[inv.payment_status] ?? '#94A3B8',
                                padding: '2px 8px', borderRadius: '16px', fontSize: '11px', fontWeight: 700,
                              }}>
                                {inv.payment_status === 'lunas' ? 'Lunas' : inv.payment_status === 'sebagian' ? 'Sebagian' : 'Belum'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
