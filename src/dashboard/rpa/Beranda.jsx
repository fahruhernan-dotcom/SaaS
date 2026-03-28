import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, TrendingUp, ShoppingCart, DollarSign,
  ChevronRight, Plus, AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/hooks/useAuth'
import { formatIDR, formatDate } from '../../lib/format'
import TopBar from '../components/TopBar'
import {
  useRPADashboardStats, useRPAInvoices,
  useRPAPurchaseOrders, useRPACustomers,
} from '../../lib/hooks/useRPAData'

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS = {
  open:      { label: 'Menunggu',        className: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
  responded: { label: 'Ada Respon',      className: 'text-blue-400 bg-blue-400/10 border-blue-400/25' },
  confirmed: { label: 'Dikonfirmasi',    className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
  delivered: { label: 'Dalam Pengiriman',className: 'text-purple-400 bg-purple-400/10 border-purple-400/25' },
}

const PAYMENT_STATUS = {
  lunas:       { label: 'Lunas',    className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
  belum_lunas: { label: 'Belum',    className: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
  sebagian:    { label: 'Sebagian', className: 'text-blue-400 bg-blue-400/10 border-blue-400/25' },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RPABeranda() {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useRPADashboardStats()
  const { data: invoices = [], isLoading: invoicesLoading } = useRPAInvoices()
  const { data: orders = [], isLoading: ordersLoading } = useRPAPurchaseOrders()
  const { data: customers = [] } = useRPACustomers()

  const isLoading = statsLoading || invoicesLoading || ordersLoading

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices])
  const activeOrders = useMemo(
    () => orders.filter(o => o.status === 'open' || o.status === 'responded'),
    [orders]
  )

  const avgOrderValue = useMemo(() => {
    if (!invoices.length) return 0
    return Math.round((stats?.sales?.totalRevenue ?? 0) / invoices.length)
  }, [invoices.length, stats?.sales?.totalRevenue])

  const now = new Date()

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="text-slate-100">
        <div className="md:hidden">
          <div className="h-[60px] bg-[#0C1319] border-b border-white/[0.06] animate-pulse" />
        </div>
        <div className="p-4 md:p-6 space-y-4">
          <div className="hidden md:flex justify-between items-center">
            <div className="h-8 w-48 bg-[#111C24] rounded-xl animate-pulse" />
            <div className="h-10 w-36 bg-[#111C24] rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-[#111C24] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3 h-64 bg-[#0C1319] rounded-2xl animate-pulse" />
            <div className="md:col-span-2 h-64 bg-[#0C1319] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-slate-100 pb-10">

      {/* ── Mobile TopBar ── */}
      <div className="md:hidden">
        <TopBar
          title="Beranda"
          subtitle={tenant?.business_name}
          rightAction={
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate('/rpa-buyer/distribusi?action=new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 rounded-xl text-white text-xs font-extrabold font-['Sora'] border-none cursor-pointer shadow-[0_3px_10px_rgba(245,158,11,0.35)]"
            >
              <Plus size={13} strokeWidth={2.5} />
              Invoice
            </motion.button>
          }
        />
      </div>

      {/* ── Desktop Header ── */}
      <header className="hidden md:flex justify-between items-center px-6 pt-7 pb-5">
        <div>
          <p className="text-[11px] text-[#4B6478] font-semibold mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-['Sora'] text-2xl font-extrabold text-slate-100">
            Selamat datang, {profile?.full_name?.split(' ')[0] ?? 'RPA'} 👋
          </h1>
          <p className="text-[13px] text-[#4B6478] mt-1">{tenant?.business_name}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/rpa-buyer/distribusi?action=new')}
          className="flex items-center gap-2 px-5 h-10 bg-amber-500 hover:bg-amber-400 rounded-xl text-white text-sm font-extrabold font-['Sora'] border-none cursor-pointer shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Buat Invoice
        </motion.button>
      </header>

      <div className="px-4 md:px-6">

        {/* ── SECTION B — KPI Cards ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:mt-0">
          {/* Card 1: Piutang Toko */}
          <KPICard
            icon={<CreditCard size={16} className="text-amber-400" />}
            label="Piutang Toko"
            value={formatIDR(stats?.sales?.totalOutstanding ?? 0)}
            sub={
              (stats?.sales?.overdueCount ?? 0) > 0
                ? `${stats.sales.overdueCount} invoice jatuh tempo`
                : 'Semua lancar'
            }
            accentLeft={
              (stats?.sales?.overdueCount ?? 0) > 0
                ? 'border-l-2 border-l-red-400'
                : ''
            }
            valueColor="text-amber-400"
            subColor={
              (stats?.sales?.overdueCount ?? 0) > 0
                ? 'text-red-400'
                : 'text-[#4B6478]'
            }
          />

          {/* Card 2: Revenue Bulan Ini */}
          <KPICard
            icon={<TrendingUp size={16} className="text-amber-400" />}
            label="Revenue Bulan Ini"
            value={formatIDR(stats?.sales?.revenueThisMonth ?? 0)}
            sub={`Total: ${formatIDR(stats?.sales?.totalRevenue ?? 0)}`}
            valueColor="text-amber-400"
          />

          {/* Card 3: Order ke Broker */}
          <KPICard
            icon={
              <div className="flex items-center gap-1.5">
                <ShoppingCart size={16} className="text-blue-400" />
                {(stats?.orders?.open ?? 0) > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                )}
              </div>
            }
            label="Order ke Broker"
            value={String(stats?.orders?.open ?? 0)}
            sub="order menunggu konfirmasi"
            accentLeft={
              (stats?.orders?.open ?? 0) > 0
                ? 'border-l-2 border-l-blue-400'
                : ''
            }
            valueColor={
              (stats?.orders?.open ?? 0) > 0
                ? 'text-blue-400'
                : 'text-slate-400'
            }
          />

          {/* Card 4: Profit Bersih */}
          <KPICard
            icon={<DollarSign size={16} className="text-emerald-400" />}
            label="Profit Bersih"
            value={formatIDR(stats?.sales?.totalProfit ?? 0)}
            sub="dari semua penjualan"
            valueColor={
              (stats?.sales?.totalProfit ?? 0) >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }
          />
        </section>

        {/* ── SECTION C — 2-Column ── */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">

          {/* KIRI — Invoice Terbaru */}
          <div className="md:col-span-3 bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora']">
                Invoice Terbaru
              </p>
              <button
                className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-transparent border-none cursor-pointer"
                onClick={() => navigate('/rpa-buyer/distribusi')}
              >
                Lihat Semua <ChevronRight size={12} />
              </button>
            </div>

            {recentInvoices.length === 0 ? (
              <EmptyState icon="📋" message="Belum ada invoice" />
            ) : (
              <div className="flex flex-col gap-2">
                {recentInvoices.map(inv => {
                  const ps = PAYMENT_STATUS[inv.payment_status] ?? PAYMENT_STATUS.belum_lunas
                  const isOverdue = inv.payment_status !== 'lunas'
                    && inv.due_date
                    && new Date(inv.due_date) < now
                  const customerName = inv.rpa_customers?.customer_name ?? inv.customer_name ?? '—'

                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-[#111C24] border border-white/[0.06] rounded-[14px]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-[13px] text-slate-100 truncate">{customerName}</span>
                          {isOverdue && (
                            <span className="text-[9px] font-extrabold text-red-400 bg-red-400/10 border border-red-400/25 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Jatuh Tempo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#4B6478]">
                          {formatDate(inv.transaction_date)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[13px] font-bold text-slate-100">
                          {formatIDR(inv.total_amount ?? 0)}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${ps.className}`}>
                          {ps.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* KANAN — Order Aktif ke Broker */}
          <div className="md:col-span-2 bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora']">
                Order Aktif
              </p>
              <button
                className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-transparent border-none cursor-pointer"
                onClick={() => navigate('/rpa-buyer/order?action=new')}
              >
                <Plus size={11} strokeWidth={2.5} />
                Order
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#4B6478] text-sm mb-3">Tidak ada order aktif</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/rpa-buyer/order?action=new')}
                  className="px-4 py-2 bg-amber-500 text-white text-xs font-bold font-['Sora'] rounded-xl border-none cursor-pointer"
                >
                  + Buat Order
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeOrders.map(order => {
                  const os = ORDER_STATUS[order.status] ?? ORDER_STATUS.open
                  return (
                    <div
                      key={order.id}
                      className="px-3 py-2.5 bg-[#111C24] border border-white/[0.06] rounded-[14px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-100 capitalize">
                          {order.chicken_type?.replace('_', ' ') ?? '—'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${os.className}`}>
                          {os.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#94A3B8] font-semibold">
                          {(order.requested_count ?? 0).toLocaleString('id-ID')} ekor
                        </span>
                        {order.requested_date && (
                          <span className="text-[11px] text-[#4B6478]">
                            {formatDate(order.requested_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION D — Quick Stats Bar (desktop only) ── */}
        <section className="hidden md:grid grid-cols-3 gap-3 mt-4">
          <QuickStat
            label="Total Toko Aktif"
            value={customers.length}
            unit="toko"
          />
          <QuickStat
            label="Invoice Bulan Ini"
            value={stats?.sales?.invoicesThisMonth ?? 0}
            unit="invoice"
          />
          <QuickStat
            label="Avg. Order Value"
            value={formatIDR(avgOrderValue)}
            unit=""
          />
        </section>

      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ icon, label, value, sub, valueColor, subColor = 'text-[#4B6478]', accentLeft = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#111C24] border border-white/[0.08] rounded-2xl p-4 ${accentLeft}`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora'] mb-1">
        {label}
      </p>
      <p className={`font-['Sora'] text-xl font-extrabold mb-0.5 truncate ${valueColor}`}>
        {value}
      </p>
      <p className={`text-[10px] font-medium ${subColor}`}>{sub}</p>
    </motion.div>
  )
}

// ─── Quick Stat ───────────────────────────────────────────────────────────────

function QuickStat({ label, value, unit }) {
  return (
    <div className="bg-[#111C24] border border-white/[0.08] rounded-xl p-3 text-center">
      <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora'] mb-1">
        {label}
      </p>
      <p className="font-['Sora'] text-lg font-extrabold text-slate-100">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        {unit && <span className="text-[11px] font-semibold text-[#4B6478] ml-1">{unit}</span>}
      </p>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message }) {
  return (
    <div className="py-10 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="text-[#4B6478] text-sm mt-2">{message}</p>
    </div>
  )
}
