import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  ChevronDown, ChevronUp, Calendar,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import { useSembakoLaporan } from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/_shared/components/TopBar'
import { DatePicker } from '@/components/ui/DatePicker'

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#06090F', card: '#1C1208', input: '#231A0E',
  accent: '#EA580C', amber: '#F59E0B', green: '#34D399', red: '#EF4444',
  text: '#FEF3C7', muted: '#92400E',
  border: 'rgba(234,88,12,0.15)',
}
const sInput = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '10px 12px', color: C.text, fontSize: '16px', fontWeight: 600,
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
  minHeight: '44px',
}

function CustomSelect({ value, onChange, options, placeholder, id, style }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value) || options[0]

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...sInput,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s',
          paddingRight: '12px'
        }}
      >
        <span style={{ color: value ? C.text : C.muted, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={C.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'transparent' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '12px',
                zIndex: 999, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 14px', fontSize: '13px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(234,88,12,0.1)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: `1px solid rgba(255,255,255,0.03)`
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <span style={{ fontSize: '10px' }}>✓</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
const sLabel = { fontSize: '11px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }

const PIE_COLORS = ['#EA580C', '#F59E0B', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#FB923C']
const CATEGORY_LABEL = {
  sewa_gudang: 'Sewa Gudang', listrik_air: 'Listrik & Air', bbm: 'BBM',
  perawatan: 'Perawatan', packaging: 'Packaging', administrasi: 'Administrasi', lainnya: 'Lainnya',
}
const STATUS_STYLE = {
  lunas:       { bg: 'rgba(52,211,153,0.12)', color: C.green, label: 'Lunas' },
  sebagian:    { bg: 'rgba(245,158,11,0.12)', color: C.amber, label: 'Sebagian' },
  belum_lunas: { bg: 'rgba(239,68,68,0.12)',  color: C.red,   label: 'Belum Lunas' },
}

function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '-' }
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoLaporan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(lastOfMonth)
  const [preset, setPreset] = useState('bulan_ini')

  const handlePresetChange = (val) => {
    setPreset(val)
    const t = new Date()
    if (val === 'hari_ini') {
      const d = t.toISOString().slice(0, 10)
      setStartDate(d)
      setEndDate(d)
    } else if (val === 'minggu_ini') {
      const d = new Date(t)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
      const start = new Date(d.setDate(diff))
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'bulan_ini') {
      const start = new Date(t.getFullYear(), t.getMonth(), 1)
      const end = new Date(t.getFullYear(), t.getMonth() + 1, 0) // Last day
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'keseluruhan') {
      setStartDate('')
      setEndDate('')
    }
  }

  const { data, isLoading, isFetching } = useSembakoLaporan(startDate, endDate)

  const s = data?.summary || {}

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <TopBar title="Laporan" />}
      <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header + Date picker */}
        <div style={{
          display: 'flex', flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'center' : 'flex-start',
          justifyContent: 'space-between', gap: '16px', marginBottom: '28px',
        }}>
          <h1 style={{ fontSize: isDesktop ? '28px' : '22px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans' }}>
            Laporan Bisnis
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', width: isDesktop ? 'auto' : '100%' }}>
            <div style={{ width: '130px' }}>
              <CustomSelect
                value={preset}
                onChange={handlePresetChange}
                options={[
                  { value: 'hari_ini', label: 'Hari Ini' },
                  { value: 'minggu_ini', label: 'Minggu Ini' },
                  { value: 'bulan_ini', label: 'Bulan Ini' },
                  { value: 'keseluruhan', label: 'Keseluruhan' },
                  { value: 'custom', label: 'Kustom' }
                ]}
                placeholder="Pilih Rentang"
              />
            </div>
            {preset === 'custom' && (
              <>
                <Calendar size={14} color={C.muted} style={{ flexShrink: 0, marginLeft: '8px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DatePicker id="start-date" value={startDate} onChange={val => setStartDate(val)} placeholder="Start" />
                </div>
                <span style={{ color: C.muted, fontSize: '12px', fontWeight: 700 }}>—</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DatePicker id="end-date" value={endDate} onChange={val => setEndDate(val)} placeholder="End" />
                </div>
              </>
            )}
          </div>
        </div>

        {isLoading ? <LoadingSkeleton /> : !data ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: '60px 0' }}>Pilih rentang tanggal untuk melihat laporan</p>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Overlay saat ganti periode / refetch */}
            {isFetching && !isLoading && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(6,9,15,0.55)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1C1208', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 12, padding: '10px 20px' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(234,88,12,0.3)', borderTopColor: '#EA580C', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#FEF3C7', fontWeight: 600 }}>Memuat data...</span>
                </div>
              </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <>
            {/* SECTION A — KPI Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' }}>
              <KPICard icon={DollarSign} label="Revenue" value={formatIDR(s.totalRevenue)} color={C.accent} />
              <KPICard icon={TrendingUp} label="Gross Profit"
                value={formatIDR(s.grossProfit)}
                badge={`${s.grossMarginPct}%`}
                color={s.grossProfit >= 0 ? C.green : C.red} />
              <KPICard icon={s.netProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit"
                value={formatIDR(s.netProfit)}
                badge={`${s.netMarginPct}%`}
                color={s.netProfit >= 0 ? C.green : C.red} />
              <KPICard icon={Receipt} label="Total Pengeluaran"
                value={formatIDR(s.totalExpenses + s.totalPayroll)}
                color={C.red} />
            </div>

            {/* SECTION B — P&L Waterfall */}
            <WaterfallPL summary={s} />

            {/* SECTION C — 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '3fr 2fr' : '1fr', gap: '16px', marginTop: '24px' }}>
              <ProductMarginTable byProduct={data.byProduct} />
              <TopCustomers byCustomer={data.byCustomer} />
            </div>

            {/* SECTION D — Expense Pie */}
            <ExpensePie expenseByCategory={data.expenseByCategory} summary={s} isDesktop={isDesktop} />

            {/* SECTION E — Invoice Table (Collapsible) */}
            <InvoiceCollapsible sales={data.sales} />
          </>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI Card
// ═══════════════════════════════════════════════════════════════════════════
function KPICard({ icon: Icon, label, value, badge, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
      background: C.card, borderRadius: '14px', padding: '14px',
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        {badge && (
          <span style={{
            fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
            background: `${color}18`, color,
          }}>{badge}</span>
        )}
      </div>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color: C.text, fontFamily: 'DM Sans', lineHeight: 1.2 }}>{value}</p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Waterfall P&L
// ═══════════════════════════════════════════════════════════════════════════
function WaterfallPL({ summary: s }) {
  const maxVal = Math.max(s.totalRevenue, 1)
  const rows = [
    { label: 'Revenue',          value: s.totalRevenue,      type: 'positive' },
    { label: 'HPP (COGS)',       value: -s.totalCOGS,        type: 'negative' },
    { label: 'Gross Profit',     value: s.grossProfit,       type: 'subtotal' },
    { label: 'Biaya Kirim',      value: -s.totalDeliveryCost,type: 'negative' },
    { label: 'Biaya Lain',       value: -s.totalOtherCost,   type: 'negative' },
    { label: 'Operasional',      value: -s.totalExpenses,    type: 'negative' },
    { label: 'Gaji Pegawai',     value: -s.totalPayroll,     type: 'negative' },
    { label: 'NET PROFIT',       value: s.netProfit,         type: 'total' },
  ]

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '16px' }}>LABA RUGI</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row, i) => {
          const absVal = Math.abs(row.value)
          const barPct = maxVal > 0 ? Math.min((absVal / maxVal) * 100, 100) : 0
          const isNeg = row.type === 'negative'
          const isTot = row.type === 'total' || row.type === 'subtotal'
          const barColor = isNeg ? C.red : row.value >= 0 ? C.green : C.red
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 110px', alignItems: 'center', gap: '10px',
              padding: isTot ? '8px 0' : '4px 0',
              borderTop: isTot ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: '11px', color: isTot ? C.text : C.muted, fontWeight: isTot ? 800 : 600 }}>
                {isNeg ? '−' : row.type === 'positive' ? '+' : '='} {row.label}
              </span>
              <div style={{ height: '10px', background: C.input, borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${barPct}%`, height: '100%', borderRadius: '5px',
                  background: barColor, opacity: isTot ? 1 : 0.7,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{
                fontSize: isTot ? '14px' : '12px', fontWeight: isTot ? 900 : 600,
                color: isNeg ? C.red : row.value >= 0 ? (isTot ? C.text : C.green) : C.red,
                textAlign: 'right', fontFamily: isTot ? 'DM Sans' : 'inherit',
              }}>
                {isNeg ? `- ${formatIDR(absVal)}` : formatIDR(absVal)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Margin Table
// ═══════════════════════════════════════════════════════════════════════════
function ProductMarginTable({ byProduct }) {
  const products = useMemo(() => {
    return Object.entries(byProduct).map(([name, d]) => {
      const profit = d.revenue - d.cogs
      const margin = d.revenue > 0 ? (profit / d.revenue * 100) : 0
      return { name, ...d, profit, margin }
    }).sort((a, b) => b.margin - a.margin)
  }, [byProduct])

  const totals = useMemo(() => products.reduce((t, p) => ({
    revenue: t.revenue + p.revenue, cogs: t.cogs + p.cogs, profit: t.profit + p.profit, qty: t.qty + p.qty,
  }), { revenue: 0, cogs: 0, profit: 0, qty: 0 }), [products])
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue * 100) : 0

  function marginColor(m) { return m >= 20 ? C.green : m >= 10 ? C.amber : C.red }

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '14px' }}>MARGIN PER PRODUK</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Produk', 'Qty', 'Revenue', 'HPP', 'Profit', 'Margin'].map(h => (
                <th key={h} style={{ textAlign: h === 'Produk' ? 'left' : 'right', padding: '6px 4px', color: C.muted, fontWeight: 700, fontSize: '9px', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid rgba(234,88,12,0.06)` }}>
                <td style={{ padding: '7px 4px', color: C.text, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{p.qty} {p.unit}</td>
                <td style={{ padding: '7px 4px', color: C.text, textAlign: 'right' }}>{formatIDR(p.revenue)}</td>
                <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{formatIDR(p.cogs)}</td>
                <td style={{ padding: '7px 4px', color: p.profit >= 0 ? C.green : C.red, textAlign: 'right', fontWeight: 600 }}>{formatIDR(p.profit)}</td>
                <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px',
                    background: `${marginColor(p.margin)}18`, color: marginColor(p.margin),
                  }}>{p.margin.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
            {/* Footer total */}
            <tr style={{ borderTop: `2px solid ${C.border}` }}>
              <td style={{ padding: '8px 4px', color: C.text, fontWeight: 800 }}>TOTAL</td>
              <td style={{ padding: '8px 4px', color: C.muted, textAlign: 'right', fontWeight: 700 }}>{totals.qty}</td>
              <td style={{ padding: '8px 4px', color: C.text, textAlign: 'right', fontWeight: 800 }}>{formatIDR(totals.revenue)}</td>
              <td style={{ padding: '8px 4px', color: C.muted, textAlign: 'right', fontWeight: 700 }}>{formatIDR(totals.cogs)}</td>
              <td style={{ padding: '8px 4px', color: totals.profit >= 0 ? C.green : C.red, textAlign: 'right', fontWeight: 800 }}>{formatIDR(totals.profit)}</td>
              <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '5px',
                  background: `${marginColor(totalMargin)}18`, color: marginColor(totalMargin),
                }}>{totalMargin.toFixed(1)}%</span>
              </td>
            </tr>
          </tbody>
        </table>
        {products.length === 0 && <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Tidak ada data produk</p>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Top Customers
// ═══════════════════════════════════════════════════════════════════════════
function TopCustomers({ byCustomer }) {
  const customers = useMemo(() =>
    Object.entries(byCustomer).map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  , [byCustomer])

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '14px' }}>TOP TOKO</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {customers.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px', background: C.input, borderRadius: '10px',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '6px',
                  background: i < 3 ? 'rgba(234,88,12,0.2)' : 'transparent',
                  color: i < 3 ? C.accent : C.muted,
                  fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(c.revenue)}</p>
              <p style={{ fontSize: '9px', color: C.muted }}>{c.count} invoice</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Tidak ada data</p>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Expense Pie Chart
// ═══════════════════════════════════════════════════════════════════════════
function ExpensePie({ expenseByCategory, summary: s, isDesktop }) {
  const pieData = useMemo(() => {
    const entries = [
      { name: 'HPP (COGS)', value: s.totalCOGS },
      { name: 'Biaya Kirim', value: s.totalDeliveryCost },
      { name: 'Gaji Pegawai', value: s.totalPayroll },
      ...Object.entries(expenseByCategory).map(([cat, val]) => ({
        name: CATEGORY_LABEL[cat] || cat, value: val,
      })),
    ].filter(d => d.value > 0)
    return entries
  }, [expenseByCategory, s])

  if (pieData.length === 0) return null

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}`, marginTop: '24px' }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '14px' }}>BREAKDOWN PENGELUARAN</p>
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'center' }}>
        <div style={{ height: '240px', width: '100%', overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '12px', color: C.text }}
                itemStyle={{ color: C.text }}
                formatter={(val) => [formatIDR(val), 'Jumlah']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {pieData.map((d, i) => {
            const total = pieData.reduce((s, x) => s + x.value, 0)
            const pct = total > 0 ? (d.value / total * 100).toFixed(1) : 0
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: C.muted, flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>{formatIDR(d.value)}</span>
                <span style={{ fontSize: '10px', color: C.muted, fontWeight: 600, width: '36px', textAlign: 'right' }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Collapsible Invoice Table
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceCollapsible({ sales }) {
  const [open, setOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const filtered = filterStatus ? sales.filter(s => s.payment_status === filterStatus) : sales

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}`, marginTop: '24px' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>
          SEMUA INVOICE PERIODE INI ({sales.length})
        </span>
        {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </button>

      {open && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ marginBottom: '10px' }}>
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'lunas', label: 'Lunas' },
                { value: 'sebagian', label: 'Sebagian' },
                { value: 'belum_lunas', label: 'Belum Lunas' },
              ]}
              placeholder="Semua Status"
              style={{ width: 'auto', minWidth: '150px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['No Invoice', 'Toko', 'Tanggal', 'Total', 'HPP', 'Profit', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: h === 'No Invoice' || h === 'Toko' ? 'left' : 'right', padding: '6px 4px', color: C.muted, fontWeight: 700, fontSize: '9px', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const st = STATUS_STYLE[s.payment_status] || STATUS_STYLE.belum_lunas
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid rgba(234,88,12,0.06)` }}>
                      <td style={{ padding: '7px 4px', color: C.text, fontWeight: 600 }}>{s.invoice_number}</td>
                      <td style={{ padding: '7px 4px', color: C.muted }}>{s.customer_name || '-'}</td>
                      <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{fmtDate(s.transaction_date)}</td>
                      <td style={{ padding: '7px 4px', color: C.text, textAlign: 'right', fontWeight: 600 }}>{formatIDR(s.total_amount)}</td>
                      <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{formatIDR(s.total_cogs)}</td>
                      <td style={{ padding: '7px 4px', color: s.net_profit >= 0 ? C.green : C.red, textAlign: 'right', fontWeight: 600 }}>{formatIDR(s.net_profit)}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Tidak ada invoice</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[1,2,3,4].map(i => <div key={i} style={{ background: C.card, borderRadius: '14px', height: '100px', border: `1px solid ${C.border}`, opacity: 0.5 }} />)}
      </div>
      <div style={{ background: C.card, borderRadius: '16px', height: '250px', border: `1px solid ${C.border}`, opacity: 0.4 }} />
    </div>
  )
}
