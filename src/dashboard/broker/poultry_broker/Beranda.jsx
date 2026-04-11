import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  Clock,
  Wallet,
  Scissors,
  CircleCheck,
  CheckCircle,
  Beef,
  CalendarX,
  Plus,
  Truck,
  Menu,
  MapPin,
  Check,
  ChevronsUpDown,
  TrendingDown,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  formatIDR,
  formatIDRShort,
  formatDate,
  formatDateFull,
  formatRelative,
  safeNum,
  calcNetProfit,
  calcRemainingAmount,
  formatPaymentStatus
} from '@/lib/format'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { BerandaSkeleton } from '@/components/ui/BrokerPageSkeleton'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import TransaksiWizard from '@/dashboard/_shared/components/TransaksiWizard'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, format, isToday, isWithinInterval, addDays, differenceInDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import SmartInsight from '@/dashboard/_shared/components/SmartInsight'
import { PROVINCES } from '@/lib/constants/regions'
import { useMarketTrends } from '@/lib/hooks/useMarketTrends'

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

export default function BrokerBeranda() {
  const { profile, tenant } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen } = useOutletContext() || {}
  const _navigate = useNavigate()
  const brokerBase = getBrokerBasePath(tenant)
  const navigate = (path, options) => {
    if (typeof path === 'string' && path.startsWith('/broker')) {
      return _navigate(path.replace('/broker', brokerBase), options)
    }
    return _navigate(path, options)
  }
  const queryClient = useQueryClient()

  // --- LOCAL STATES ---
  const [wizardOpen, setWizardOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState('weekly') // 'weekly' | 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [agendaFilter, setAgendaFilter] = useState('Semua') // 'Semua' | 'Piutang' | 'Panen' | 'Pengiriman' | 'Pembayaran'
  const [provinceWarningDismissed, setProvinceWarningDismissed] = useState(false)

  // Use tenant province as the single source of truth
  const activeProvince = tenant?.province || 'Seluruh Indonesia'
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today])

  // --- DATA FETCHING (Unified for Beranda Redesign) ---
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-redesign', tenant?.id, activeProvince],
    queryFn: async () => {
      if (!tenant?.id) return null

      // Fetch 60 days of sales to identify trends and KPIs
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      
      const salesQuery = supabase.from('sales').select('*, purchases(*, farms(*)), rpa_clients(*)').eq('tenant_id', tenant.id).eq('is_deleted', false).gte('transaction_date', sixtyDaysAgo)
      
      const harvestsQuery = supabase.from('chicken_batches').select('*, farms(*)').eq('tenant_id', tenant.id).eq('is_deleted', false).not('estimated_harvest_date', 'is', null)
      
      const deliveriesQuery = supabase.from('deliveries').select('*, sales(*, rpa_clients(*))').eq('tenant_id', tenant.id).eq('is_deleted', false).neq('status', 'completed')
      
      const paymentsQuery = supabase.from('payments').select('*, sales(*, rpa_clients(*))').eq('tenant_id', tenant.id)

      const unpaidSalesQuery = supabase.from('sales').select('*, rpa_clients(*)').eq('tenant_id', tenant.id).neq('payment_status', 'lunas').eq('is_deleted', false)

      const [salesRes, harvestsRes, deliveriesRes, paymentsRes, unpaidSalesRes] = await Promise.all([
        salesQuery,
        harvestsQuery,
        deliveriesQuery,
        paymentsQuery,
        unpaidSalesQuery
      ])

      const sales = salesRes.data || []
      const harvests = harvestsRes.data || []
      const deliveries = deliveriesRes.data || []
      const payments = paymentsRes.data || []
      const unpaidSales = unpaidSalesRes.data || []

      // In-memory regional filtering
      const filteredSales = activeProvince === 'Seluruh Indonesia' ? sales : sales.filter(s => 
        s.rpa_clients?.province === activeProvince || 
        s.purchases?.farms?.province === activeProvince
      )
      const filteredHarvests = activeProvince === 'Seluruh Indonesia' ? harvests : harvests.filter(h => h.farms?.province === activeProvince)
      const filteredDeliveries = activeProvince === 'Seluruh Indonesia' ? deliveries : deliveries.filter(d => d.sales?.rpa_clients?.province === activeProvince)
      const filteredPayments = activeProvince === 'Seluruh Indonesia' ? payments : payments.filter(p => p.sales?.rpa_clients?.province === activeProvince)
      const filteredUnpaidSales = activeProvince === 'Seluruh Indonesia' ? unpaidSales : unpaidSales.filter(s => s.rpa_clients?.province === activeProvince)

      // 1. SMART INSIGHT (W0 vs W1 profit)
      const w0End = new Date()
      const w0Start = addDays(w0End, -6)
      const w1End = addDays(w0Start, -1)
      const w1Start = addDays(w1End, -6)

      const getIntervalProfit = (start, end) => {
        return filteredSales
          .filter(s => {
            const d = new Date(s.transaction_date)
            return d >= start && d <= end
          })
          .reduce((sum, s) => sum + calcNetProfit(s), 0)
      }

      const w0Profit = getIntervalProfit(w0Start, w0End)
      const w1Profit = getIntervalProfit(w1Start, w1End)
      
      let insight = null
      if (w1Profit !== 0) {
        const diff = ((w0Profit - w1Profit) / Math.abs(w1Profit)) * 100
        insight = { 
          type: diff >= 0 ? 'up' : 'down', 
          value: Math.abs(diff).toFixed(0),
          text: diff >= 0 ? `↑ Profit naik +${Math.abs(diff).toFixed(0)}% dibanding minggu lalu` : `↓ Profit turun ${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`
        }
      }

      // 2. KPI TRENDS (Current Month vs Last Month)
      const m0Start = startOfMonth(today)
      const m1Start = startOfMonth(subMonths(today, 1))
      const m1End = endOfMonth(m1Start)

      const m0Sales = filteredSales.filter(s => {
        const d = new Date(s.transaction_date)
        return d >= m0Start && d <= today
      })
      const m1Sales = filteredSales.filter(s => {
        const d = new Date(s.transaction_date)
        return d >= m1Start && d <= m1End
      })

      // KPI 1: TOTAL PIUTANG (Sum remaining amount where not lunas)
      const totalPiutang = filteredUnpaidSales.reduce((sum, s) => sum + calcRemainingAmount(s), 0)
      
      const m0Piutang = m0Sales.filter(s => s.payment_status !== 'lunas').reduce((sum, s) => sum + calcRemainingAmount(s), 0)
      const m1Piutang = m1Sales.filter(s => s.payment_status !== 'lunas').reduce((sum, s) => sum + calcRemainingAmount(s), 0)
      const piutangTrend = m1Piutang !== 0 ? ((m0Piutang - m1Piutang) / m1Piutang) * 100 : 0

      // KPI 2: TRANSAKSI BULAN INI (Sales count)
      const m0SalesCount = m0Sales.length
      const m1SalesCount = m1Sales.length
      const txTrend = m1SalesCount !== 0 ? ((m0SalesCount - m1SalesCount) / m1SalesCount) * 100 : 0
      
      const m0PurchasesCount = [...new Set(m0Sales.map(s => s.purchases?.id).filter(Boolean))].length

      // 3. CHART DATA LOGIC
      const chartToday = new Date()
      chartToday.setHours(0,0,0,0)
      
      const mondayStart = startOfWeek(chartToday, { weekStartsOn: 1 })
      const sundayEnd = addDays(mondayStart, 6)
      const monthStart = startOfMonth(chartToday)

      const getChartData = (start, end) => {
        const data = []
        let curr = new Date(start)
        while (curr <= end) {
          const dStr = format(curr, 'yyyy-MM-dd')
          const daySales = filteredSales.filter(s => s.transaction_date === dStr)
          const isWeekly = differenceInDays(end, start) < 8
          const isFuture = curr > chartToday
          
          data.push({
            name: isWeekly ? format(curr, 'EEE', { locale: idLocale }) : format(curr, 'd'),
            profit: isFuture ? 0 : daySales.reduce((sum, s) => sum + calcNetProfit(s), 0),
            date: dStr,
            fullDate: format(curr, 'EEEE, d MMMM yyyy', { locale: idLocale }),
            isFuture,
            txs: isFuture ? [] : daySales.map(s => ({
              id: s.id,
              label: s.rpa_clients?.rpa_name || `Transaksi #${s.id.slice(0, 4)}`,
              value: calcNetProfit(s)
            }))
          })
          curr = addDays(curr, 1)
        }
        return data
      }

      const weeklyData = getChartData(mondayStart, sundayEnd)
      const monthlyData = getChartData(monthStart, chartToday)

      return {
        insight,
        kpis: {
          totalPiutang,
          unpaidCount: filteredUnpaidSales.length,
          piutangTrend,
          monthlySales: m0SalesCount,
          monthlyPurchases: m0PurchasesCount,
          txTrend
        },
        chart: {
          weekly: weeklyData,
          monthly: monthlyData,
          totalNetProfitWeekly: weeklyData.reduce((sum, d) => sum + d.profit, 0),
          totalNetProfitMonthly: monthlyData.reduce((sum, d) => sum + d.profit, 0)
        },
        events: {
          harvests: filteredHarvests,
          dues: filteredUnpaidSales.filter(s => s.due_date),
          deliveries: filteredDeliveries,
          payments: filteredPayments,
          todayActivites: filteredSales.filter(s => s.transaction_date === todayStr)
        },
        rpaWithDebt:Object.values(filteredUnpaidSales.reduce((acc, s) =>{
          const id = s.rpa_id || 'unknown'
          if(!acc[id]) acc[id] = { id, rpa_name: s.rpa_clients?.rpa_name || 'RPA Umum', total_outstanding: 0 }
          acc[id].total_outstanding += calcRemainingAmount(s)
          return acc
        }, {})).sort((a,b) => b.total_outstanding - a.total_outstanding).slice(0, 3)
      }
    },
    enabled: !!tenant?.id
  })

  const handleTandaiLunas = async (rpaId, rpaName) => {
    try {
      const { data: unpaidSales } = await supabase.from('sales').select('id, total_revenue').eq('rpa_id', rpaId).neq('payment_status', 'lunas').eq('is_deleted', false)
      if (!unpaidSales) return
      for (const sale of unpaidSales) {
        await supabase.from('sales').update({ payment_status: 'lunas', paid_amount: sale.total_revenue }).eq('id', sale.id)
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-redesign', tenant.id] })
      toast.success(`✅ Semua piutang ${rpaName} ditandai lunas!`)
    } catch (err) {
      toast.error('❌ Gagal memperbarui status lunas')
    }
  }

  if (isLoading || !tenant?.id) return <BerandaSkeleton />

  const data = dashboardData
  const isMissingProvince = !tenant?.province && !provinceWarningDismissed

  return (
    <>
      {/* ── PROVINCE WARNING POPUP ── */}
      <AnimatePresence>
        {isMissingProvince && (
          <motion.div
            key="province-warning"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] w-full max-w-[560px] px-4"
          >
            <div className="relative flex items-start gap-4 p-5 rounded-2xl border border-amber-500/30 bg-[#0C1319]/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
              {/* Glow accent */}
              <div className="absolute inset-0 rounded-2xl bg-amber-500/[0.04] pointer-events-none" />

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">Aksi Diperlukan</p>
                <p className="text-sm font-bold text-[#F1F5F9] leading-snug">
                  Akun Anda belum memiliki <span className="text-amber-400">Provinsi</span>. Data regional dashboard tidak akan akurat.
                </p>
                <p className="text-[11px] text-[#4B6478] mt-1">
                  Isi provinsi di halaman Akun agar laporan dan filter wilayah berfungsi dengan benar.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => navigate('/broker/akun')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-[#0C1319] text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <MapPin size={11} className="inline mr-1.5 -mt-0.5" />
                    Isi Sekarang
                  </button>
                  <button
                    onClick={() => setProvinceWarningDismissed(true)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white hover:border-white/20 active:scale-95 transition-all"
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() => setProvinceWarningDismissed(true)}
                className="shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isDesktop ? (
          <DesktopDashboard
            data={data}
            profile={profile}
            navigate={navigate}
            setWizardOpen={setWizardOpen}
            handleTandaiLunas={handleTandaiLunas}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
            activeProvince={activeProvince}
          />
        ) : (
          <MobileDashboard
            data={data}
            profile={profile}
            navigate={navigate}
            setWizardOpen={setWizardOpen}
            setSidebarOpen={setSidebarOpen}
            handleTandaiLunas={handleTandaiLunas}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
            activeProvince={activeProvince}
          />
        )}
      </AnimatePresence>

      <TransaksiWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  )
}

function DesktopDashboard({ 
  data, profile, navigate, setWizardOpen, handleTandaiLunas, 
  chartPeriod, setChartPeriod, selectedDate, setSelectedDate, 
  currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter, 
  activeProvince
}) {
  const firstName = profile?.full_name?.split(' ')[0] || 'User'

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8 pb-10">
      {/* 1. HEADER & INSIGHT */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-4xl font-black text-white tracking-tight uppercase">Dashboard</h2>
          <p className="text-sm font-bold text-[#4B6478] uppercase mt-1 tracking-widest">
            Selamat datang kembali, <span className="text-emerald-400">{firstName}</span>
          </p>
          <SmartInsight insight={data?.insight} className="mt-3" />
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="h-14 px-8 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus size={18} className="mr-2" /> Catat Transaksi
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: KPIs + CHART */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KPICardNew
              compact
              label="TOTAL PIUTANG"
              value={formatIDRShort(data?.kpis?.totalPiutang)}
              sub={`${data?.kpis?.unpaidCount || 0} RPA belum lunas`}
              icon={Clock}
              trend={data?.kpis?.piutangTrend}
              onClick={() => navigate('/broker/rpa')}
            />
            <KPICardNew
              compact
              label="TRANSAKSI BULAN INI"
              value={data?.kpis?.monthlySales || 0}
              sub={`${data?.kpis?.monthlySales || 0} jual · ${data?.kpis?.monthlyPurchases || 0} beli`}
              icon={BarChart2}
              trend={data?.kpis?.txTrend}
              onClick={() => navigate('/broker/transaksi')}
            />
          </div>
          <Card className="p-8 bg-[#0C1319] border-white/5 rounded-[32px] relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em]">Live Performance</p>
                </div>
                <h3 className="text-2xl font-display font-black text-white tracking-tight">ANALISIS PROFIT</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Total</p>
                    <p className="text-sm font-black text-white tabular-nums">
                      {formatIDR(chartPeriod === 'weekly' ? data?.chart?.totalNetProfitWeekly : data?.chart?.totalNetProfitMonthly)}
                    </p>
                  </div>
                  <Badge className="bg-[#10B981]/10 text-[#10B981] border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    {chartPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
                  </Badge>
                </div>
              </div>
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                <button
                  onClick={() => setChartPeriod('weekly')}
                  className={cn(
                    "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    chartPeriod === 'weekly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
                  )}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => setChartPeriod('monthly')}
                  className={cn(
                    "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ml-1",
                    chartPeriod === 'monthly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
                  )}
                >
                  Bulanan
                </button>
              </div>
            </div>
            
            <div className="h-[320px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartPeriod === 'weekly' ? data?.chart?.weekly : data?.chart?.monthly}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B6478', fontSize: 10, fontWeight: 800 }}
                    dy={10}
                    interval={0}
                    padding={{ left: 20, right: 20 }}
                  />
                  <RechartsTooltip 
                    content={<CustomChartTooltip />} 
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    activeDot={{ r: 6, stroke: '#111C24', strokeWidth: 2, fill: '#10B981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* MARKET TREND HYBRID CHART */}
          <MarketTrendCard province={activeProvince} />

          {/* 5. PIUTANG RPA SECTION */}
          <Card className="p-8 bg-[#0C1319] border-white/5 rounded-[32px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Piutang RPA Terbesar</h3>
              <Button variant="ghost" size="sm" className="text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10" onClick={() => navigate('/broker/rpa')}>
                Lihat Semua <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
            {data?.rpaWithDebt?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.rpaWithDebt.map((rpa) => (
                  <div key={rpa.id} className="p-4 border border-white/5 rounded-2xl bg-black/20 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center font-display font-black text-emerald-400 text-[10px]">
                        {rpa.rpa_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#F1F5F9] truncate">{rpa.rpa_name}</p>
                        <p className="text-[12px] font-black text-red-400 tabular-nums">
                          {formatIDRShort(rpa.total_outstanding)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <CheckCircle size={28} className="text-emerald-500/20" />
                <p className="text-xs font-bold text-[#4B6478] uppercase tracking-widest">Semua pembayaran lunas</p>
              </div>
            )}
          </Card>
        </div>

        {/* 4. AGENDA SECTION */}
        <div className="lg:col-span-1">
          <AgendaSection
            data={data}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
            isDesktop={true}
          />
        </div>
      </div>
    </motion.div>
  )
}

// --- MOBILE RENDERER ---
function MobileDashboard({ 
  data, profile, navigate, setWizardOpen, setSidebarOpen, 
  handleTandaiLunas, chartPeriod, setChartPeriod, 
  selectedDate, setSelectedDate, currentMonth, setCurrentMonth, 
  agendaFilter, setAgendaFilter, activeProvince 
}) {
  const firstName = profile?.full_name?.split(' ')[0] || 'User'
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BR'

  const recentActivity = useMemo(() => {
    if (!data) return []
    const items = []
    ;(data?.events?.todayActivites || []).forEach(s => {
      items.push({ id: `sale-${s.id}`, type: 'Transaksi', label: s.rpa_clients?.rpa_name || 'RPA', amount: calcNetProfit(s), date: s.transaction_date, color: '#10B981', Icon: ArrowLeftRight })
    })
    ;(data?.events?.payments || []).forEach(p => {
      items.push({ id: `pay-${p.id}`, type: 'Pembayaran', label: p.sales?.rpa_clients?.rpa_name || 'Pembayaran', amount: p.amount, date: p.payment_date || p.created_at, color: '#818CF8', Icon: CircleCheck })
    })
    ;(data?.events?.deliveries || []).forEach(d => {
      items.push({ id: `del-${d.id}`, type: 'Pengiriman', label: d.sales?.rpa_clients?.rpa_name || 'Pengiriman', amount: null, date: d.created_at, color: '#F59E0B', Icon: Truck })
    })
    return items.filter(i => i.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  }, [data])

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col min-h-full bg-[#06090F] text-foreground pb-20">

      {/* ── Compact fixed TopBar ── */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 h-14 flex items-center justify-between px-4 bg-[#06090F]/95 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen?.(true)}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          >
            <Menu size={17} className="text-[#94A3B8]" />
          </button>
          <h1 className="font-display font-black text-[15px] text-[#F1F5F9] leading-tight truncate min-w-0">
            Halo, {firstName} <span>👋</span>
          </h1>
        </div>
        <Avatar className="h-9 w-9 border border-emerald-500/30 shrink-0" onClick={() => navigate('/broker/akun')}>
          <AvatarFallback className="bg-emerald-500/10 text-[#34D399] font-black text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* spacer for fixed topbar */}
      <div className="h-14" />

      {/* ── 1. HERO BALANCE ── */}
      <motion.div variants={fadeUp} className="px-4 pt-5 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-1.5">Total Profit Bulan Ini</p>
        <div className="flex items-end gap-3">
          <h1 className="text-[34px] font-display font-black text-[#F1F5F9] tabular-nums leading-none">
            {formatIDRShort(data?.chart?.totalNetProfitMonthly || 0)}
          </h1>
          {data?.kpis?.txTrend !== undefined && (
            <span className={cn(
              "text-[11px] font-black px-2 py-0.5 rounded-lg mb-1.5",
              data.kpis.txTrend >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            )}>
              {data.kpis.txTrend >= 0 ? '+' : ''}{data.kpis.txTrend.toFixed(0)}%
            </span>
          )}
        </div>
        {data?.insight && (
          <p className="text-[11px] text-[#4B6478] mt-1.5 leading-snug">{data.insight.text}</p>
        )}
      </motion.div>

      {/* ── 2. BUSINESS SUMMARY CARD ── */}
      <motion.div variants={fadeUp} className="px-4 mb-4">
        <div className="rounded-[22px] p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1F2E 0%, #112233 55%, #0A1A28 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)' }} />
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">TERNAK OS · BROKER</p>
              <p className="text-sm font-bold text-white/60 mt-0.5 truncate max-w-[160px]">{profile?.full_name}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Beef size={17} className="text-emerald-400" />
            </div>
          </div>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Piutang Aktif</p>
              <p className="text-[22px] font-display font-black text-red-400 tabular-nums leading-none">{formatIDRShort(data?.kpis?.totalPiutang || 0)}</p>
              <p className="text-[10px] text-white/30 mt-1">{data?.kpis?.unpaidCount ?? 0} RPA belum lunas</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Transaksi</p>
              <p className="text-[22px] font-display font-black text-white/80 tabular-nums leading-none">{data?.kpis?.monthlySales ?? 0}</p>
              <p className="text-[10px] text-white/30 mt-1">bulan ini</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. QUICK ACTIONS 2×2 ── */}
      <motion.div variants={fadeUp} className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <QuickAction icon={Plus}      label="Catat Transaksi" color="#10B981" onClick={() => setWizardOpen(true)} />
          <QuickAction icon={Wallet}    label="Piutang RPA"     color="#F87171" onClick={() => navigate('/broker/rpa')} />
          <QuickAction icon={Truck}     label="Pengiriman"      color="#F59E0B" onClick={() => navigate('/broker/pengiriman')} />
          <QuickAction icon={BarChart2} label="Transaksi"       color="#818CF8" onClick={() => navigate('/broker/transaksi')} />
        </div>
      </motion.div>

      {/* ── MARKET TRENDS ── */}
      <div className="px-4 mb-4">
        <MarketTrendCard province={activeProvince} />
      </div>

      {/* ── 4. RECENT ACTIVITY ── */}
      <motion.div variants={fadeUp} className="px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Aktivitas Terkini</h3>
          <button onClick={() => navigate('/broker/transaksi')} className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Lihat Semua</button>
        </div>
        <div className="space-y-2">
          {recentActivity.length > 0 ? (
            recentActivity.map(item => <ActivityItem key={item.id} item={item} />)
          ) : (
            <div className="text-center py-5 bg-[#0C1319] border border-white/[0.05] rounded-[16px]">
              <p className="text-[11px] text-[#4B6478] font-bold">Belum ada aktivitas</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── 5. PROFIT CHART ── */}
      <motion.div variants={fadeUp} className="px-4 mb-4">
        <div className="bg-[#0C1319] border border-white/5 rounded-[20px] p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Pengeluaran / Profit</p>
              <p className="text-xl font-display font-black text-[#F1F5F9] tabular-nums leading-none mt-0.5">
                {chartPeriod === 'weekly' ? formatIDRShort(data?.chart.totalNetProfitWeekly) : formatIDRShort(data?.chart.totalNetProfitMonthly)}
              </p>
            </div>
            <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/5">
              <button onClick={() => setChartPeriod('weekly')} className={cn("px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all", chartPeriod === 'weekly' ? "bg-emerald-500 text-white" : "text-[#4B6478]")}>W</button>
              <button onClick={() => setChartPeriod('monthly')} className={cn("px-3 py-1 text-[10px] font-black uppercase rounded-md ml-0.5 transition-all", chartPeriod === 'monthly' ? "bg-emerald-500 text-white" : "text-[#4B6478]")}>M</button>
            </div>
          </div>
          <div className="h-[130px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPeriod === 'weekly' ? data?.chart.weekly : data?.chart.monthly} barSize={10} barCategoryGap="30%">
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4B6478', fontSize: 9, fontWeight: 800 }} dy={6} />
                <RechartsTooltip content={() => null} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- HELPER COMPONENTS ---

function KPICardNew({ label, value, sub, icon: Icon, onClick, trend, small, compact }) {
  return (
    <Card
      className={cn(
        "bg-[#0C1319] border-white/5 rounded-[28px] overflow-hidden relative cursor-pointer hover:border-emerald-500/20 active:scale-[0.98] transition-all",
        small ? "p-4" : compact ? "py-3 px-4 h-[80px] flex flex-col justify-center" : "p-6"
      )}
      onClick={onClick}
    >
      <div className={cn("flex justify-between items-start", compact ? "mb-1" : "mb-2")}>
        <div className={cn("flex items-center gap-2 font-black text-[#4B6478] uppercase tracking-[0.2em]", small ? "text-xs" : "text-[10px]")}>
          {Icon && <Icon size={small || compact ? 14 : 14} className="opacity-50" />}
          {label}
        </div>
        {trend !== undefined && (
          <div className={cn(
            "font-black tabular-nums py-0.5 px-2 rounded-lg",
            small ? "text-xs" : "text-[10px]",
            trend >= 0 ? "bg-[#10B981]/10 text-[#10B981]" : "bg-red-500/10 text-red-500"
          )}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <div className={cn("font-display font-black tracking-tight tabular-nums", compact ? "text-xl" : small ? "text-xl" : "text-3xl")}>
        {value}
      </div>
      {sub && !compact && <p className={cn("text-[#4B6478] font-bold mt-1 uppercase tracking-wider", small ? "text-xs" : "text-[11px]")}>{sub}</p>}
    </Card>
  )
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-2.5 p-3.5 bg-[#0C1319] border border-white/[0.05] rounded-[16px] text-left w-full hover:border-white/10 transition-all active:scale-[0.97]"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1A` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <span className="text-[13px] font-bold text-[#CBD5E1] leading-tight">{label}</span>
    </motion.button>
  )
}

function ActivityItem({ item }) {
  const { Icon, color, type, label, amount, date } = item
  return (
    <div className="flex items-center gap-3 p-3 bg-[#0C1319] border border-white/[0.05] rounded-[14px]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1A` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#E2E8F0] truncate">{label}</p>
        <p className="text-[10px] text-[#4B6478]">
          {type} · {date ? format(new Date(date), 'd MMM', { locale: idLocale }) : '—'}
        </p>
      </div>
      {amount != null && (
        <p className={cn("text-[13px] font-black tabular-nums shrink-0", amount >= 0 ? "text-emerald-400" : "text-red-400")}>
          {amount >= 0 ? '+' : ''}{formatIDRShort(amount)}
        </p>
      )}
    </div>
  )
}

function CustomChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  
  return (
    <div className="bg-[#0C1319] border border-white/10 p-3.5 rounded-xl shadow-2xl min-w-[200px] backdrop-blur-xl">
      <p className="text-[11px] text-[#4B6478] font-bold mb-3">{data.fullDate}</p>
      
      <div className="mb-3">
        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.15em] mb-1">Total Profit</p>
        <p className="text-base font-black text-[#34D399] tabular-nums">{formatIDR(data.profit)}</p>
      </div>

      <div className="border-t border-white/5 pt-3">
        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.15em] mb-2">Rincian Transaksi</p>
        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
          {data.txs && data.txs.length > 0 ? (
            data.txs.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center gap-4 text-[11px]">
                <span className="text-[#94A3B8] font-bold truncate max-w-[120px]">{tx.label}</span>
                <span className="text-[#F1F5F9] font-black tabular-nums whitespace-nowrap">{formatIDRShort(tx.value)}</span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-[#4B6478] italic">Tidak ada transaksi</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AgendaSection({ data, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter, isDesktop }) {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const { tenant } = useAuth()
  const brokerBase = getBrokerBasePath(tenant)
  const navigate = useNavigate()

  const filteredEvents = useMemo(() => {
    if (!data?.events) return []
    const all = [
      ...data.events.harvests.map(e => ({ ...e, type: 'Panen', date: e.estimated_harvest_date, icon: Scissors, color: '#10B981', dot: 'bg-[#10B981]' })),
      ...data.events.dues.map(e => ({ ...e, type: 'Piutang', date: e.due_date, icon: Wallet, color: '#F87171', dot: 'bg-[#F87171]' })),
      ...data.events.deliveries.map(e => ({ ...e, type: 'Pengiriman', date: format(new Date(e.created_at), 'yyyy-MM-dd'), icon: Truck, color: '#F59E0B', dot: 'bg-[#F59E0B]' })),
      ...data.events.payments.map(e => ({ ...e, type: 'Pembayaran', date: e.payment_date, icon: CircleCheck, color: '#10B981', dot: 'bg-[#10B981]' }))
    ]
    
    let result = all.filter(e => isSameDay(new Date(e.date), selectedDate))
    if (agendaFilter !== 'Semua') {
      result = result.filter(e => e.type === agendaFilter)
    }
    return result.sort((a,b) => new Date(a.date) - new Date(b.date))
  }, [data, selectedDate, agendaFilter])

  const stats = useMemo(() => {
     if(!data?.events) return { piutang: 0, panen: 0, krm: 0, bayar: 0 }
     const mStr = format(currentMonth, 'yyyy-MM')
      return {
         piutang: data.events.dues.filter(e => e.due_date?.startsWith(mStr)).reduce((sum, e) => sum + calcRemainingAmount(e), 0),
         panen: data.events.harvests.filter(e => e.estimated_harvest_date?.startsWith(mStr)).length,
         krm: data.events.deliveries.length,
         bayar: data.events.payments.filter(e => e.payment_date?.startsWith(mStr)).length
      }
  }, [data, currentMonth])

  return (
    <Card className="bg-[#0C1319] border-white/5 rounded-[32px] overflow-hidden border-none lg:border flex flex-col h-full">
      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#F1F5F9]">Agenda</h3>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#4B6478]" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={16} /></Button>
             <span className="text-[11px] font-black uppercase tracking-tighter text-[#F1F5F9] min-w-[100px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: idLocale })}</span>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#4B6478]" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={16} /></Button>
          </div>
        </div>

        <CalendarHeatmap
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          events={data?.events}
          isDesktop={isDesktop}
        />

        <div className="mt-4">
           <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
              {['Semua', 'Piutang', 'Panen', 'Pengiriman', 'Pembayaran'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setAgendaFilter(tab)}
                   className={cn(
                     "px-4 py-1.5 rounded-xl font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                     isDesktop ? "text-[10px]" : "text-xs",
                     agendaFilter === tab ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-black/20 border-white/5 text-[#4B6478] hover:border-white/10"
                   )}
                 >
                   {tab}
                 </button>
              ))}
           </div>

           <div className="grid grid-cols-2 gap-2 mt-3">
              {/* Card Piutang */}
              <div className="bg-[#111C24] rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] font-display mb-1">Piutang</p>
                <p className="text-[#F1F5F9] font-display font-bold text-sm">
                  {formatIDRShort(stats.piutang)}
                </p>
              </div>
              {/* Card Panen */}
              <div className="bg-[#111C24] rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] font-display mb-1">Panen</p>
                <p className="text-emerald-400 font-display font-bold text-sm">
                  {stats.panen}
                </p>
              </div>
              {/* Card Pengiriman */}
              <div className="bg-[#111C24] rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] font-display mb-1">Pengiriman</p>
                <p className="text-amber-400 font-display font-bold text-sm">
                  {stats.krm}
                </p>
              </div>
              {/* Card Pembayaran */}
              <div className="bg-[#111C24] rounded-xl p-2.5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] font-display mb-1">Pembayaran</p>
                <p className="text-purple-400 font-display font-bold text-sm">
                  {stats.bayar}
                </p>
              </div>
           </div>

           <div className="space-y-3 mt-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, idx) => (
                  <EventItem key={idx} event={event} isDesktop={isDesktop} onClick={() => setSelectedEvent(event)} />
                ))
              ) : (
                <div className="text-center py-5">
                  <CalendarX className="w-8 h-8 text-[#4B6478] mx-auto mb-2" />
                  <p className="text-[#4B6478] text-sm italic">
                    Tidak ada agenda di tanggal ini
                  </p>
                </div>
              )}
           </div>
        </div>
      </div>

      <EventDetailSheet 
        selectedEvent={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        brokerBase={brokerBase}
        navigate={navigate}
      />
    </Card>
  )
}

const DetailRow = ({ label, value, valueClass = 'text-[#F1F5F9]' }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5">
    <span className="text-[#4B6478] text-sm">{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
)

function EventDetailSheet({ selectedEvent, onClose, brokerBase, navigate }) {
  if (!selectedEvent) return null

  const renderContent = () => {
    switch (selectedEvent.type) {
      case 'Piutang':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display">Piutang Jatuh Tempo</p>
                <h3 className="text-[#F1F5F9] font-display font-bold text-lg">
                  {selectedEvent.rpa_clients?.rpa_name || 'RPA'}
                </h3>
              </div>
              <span className="ml-auto text-[10px] font-black px-2 py-1 rounded-lg bg-red-500/10 text-red-400 uppercase">
                Mendesak
              </span>
            </div>
            
            <div className="space-y-3">
              <DetailRow label="Sisa Tagihan" 
                value={formatIDR(calcRemainingAmount(selectedEvent))} 
                valueClass="text-red-400 font-bold" />
              <DetailRow label="Total Transaksi" 
                value={formatIDR(selectedEvent.total_revenue)} />
              <DetailRow label="Jatuh Tempo" 
                value={format(new Date(selectedEvent.date), 'dd MMM yyyy', { locale: idLocale })} />
              <DetailRow label="Status" 
                value={formatPaymentStatus(selectedEvent.payment_status)?.toUpperCase()} 
                valueClass={selectedEvent.payment_status === 'lunas' ? 'text-emerald-400' : 
                            selectedEvent.payment_status === 'sebagian' ? 'text-amber-500' : 
                            'text-red-400 font-black'} />
            </div>
            
            <button 
              onClick={() => { onClose(); navigate(`${brokerBase}/rpa`) }}
              className="w-full mt-6 h-12 bg-emerald-500 rounded-xl font-display font-black text-sm text-white shadow-[0_8px_24px_rgba(16,185,129,0.25)] active:scale-95 transition-all">
              Lihat Detail RPA →
            </button>
          </>
        )
      case 'Pengiriman':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display">Detail Pengiriman</p>
                <h3 className="text-[#F1F5F9] font-display font-bold text-lg">
                  {selectedEvent.sales?.rpa_clients?.rpa_name || 'RPA'}
                </h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <DetailRow label="Sopir" value={selectedEvent.driver_name || '-'} />
              <DetailRow label="Armada" value={selectedEvent.vehicle_reg_number || '-'} />
              <DetailRow label="Jumlah Ekor" value={`${selectedEvent.initial_count} ekor`} />
              <DetailRow label="Status" value={selectedEvent.status?.toUpperCase()} valueClass="text-amber-400" />
            </div>
            
            <button 
              onClick={() => { onClose(); navigate(`${brokerBase}/pengiriman`) }}
              className="w-full mt-6 h-12 bg-emerald-500 rounded-xl font-display font-black text-sm text-white shadow-[0_8px_24px_rgba(16,185,129,0.25)] active:scale-95 transition-all">
              Lihat Pengiriman →
            </button>
          </>
        )
      case 'Panen':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Scissors className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display">Jadwal Panen</p>
                <h3 className="text-[#F1F5F9] font-display font-bold text-lg">
                  {selectedEvent.farms?.farm_name || 'Kandang'}
                </h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <DetailRow label="Estimasi Ekor" value={`${selectedEvent.current_count} ekor`} />
              <DetailRow label="Tanggal Panen" value={format(new Date(selectedEvent.date), 'dd MMM yyyy', { locale: idLocale })} />
              <DetailRow label="Lokasi" value={selectedEvent.farms?.location || '-'} />
            </div>
            
            <button 
              onClick={() => { onClose(); navigate(`${brokerBase}/kandang`) }}
              className="w-full mt-6 h-12 bg-emerald-500 rounded-xl font-display font-black text-sm text-white shadow-[0_8px_24px_rgba(16,185,129,0.25)] active:scale-95 transition-all">
              Lihat Siklus →
            </button>
          </>
        )
      case 'Pembayaran':
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CircleCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display">Pembayaran Diterima</p>
                <h3 className="text-[#F1F5F9] font-display font-bold text-lg">
                  {selectedEvent.sales?.rpa_clients?.rpa_name || 'RPA'}
                </h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <DetailRow label="Jumlah Bayar" value={formatIDR(selectedEvent.amount)} valueClass="text-emerald-400 font-bold" />
              <DetailRow label="Tanggal" value={format(new Date(selectedEvent.date), 'dd MMM yyyy', { locale: idLocale })} />
            </div>
            
            <button 
              onClick={() => { onClose(); navigate(`${brokerBase}/transaksi`) }}
              className="w-full mt-6 h-12 bg-emerald-500 rounded-xl font-display font-black text-sm text-white shadow-[0_8px_24px_rgba(16,185,129,0.25)] active:scale-95 transition-all">
              Lihat Transaksi →
            </button>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Sheet open={!!selectedEvent} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-[#0C1319] border-l border-white/5 p-8 h-full outline-none overflow-y-auto w-full sm:max-w-md">
        <SheetTitle className="sr-only">Event Detail</SheetTitle>
        <SheetDescription className="sr-only">Details for the selected agenda event</SheetDescription>
        {renderContent()}
      </SheetContent>
    </Sheet>
  )
}

function CalendarHeatmap({ currentMonth, selectedDate, setSelectedDate, events, isDesktop }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const eventCounts = useMemo(() => {
    if (!events) return {}
    const counts = {}
    const add = (d) => {
      if (!counts[d]) counts[d] = 0
      counts[d]++
    }
    events.harvests.forEach(h => add(h.estimated_harvest_date))
    events.dues.forEach(s => add(s.due_date))
    events.deliveries.forEach(d => add(format(new Date(d.created_at), 'yyyy-MM-dd')))
    events.payments.forEach(p => add(p.payment_date))
    return counts
  }, [events])

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} className={cn("font-black text-[#4B6478] text-center pb-2", isDesktop ? "text-[10px]" : "text-xs")}>{d}</div>
        ))}
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const count = eventCounts[dayStr] || 0
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const active = isToday(day)

          // Intensity logic
          let bgColor = 'transparent'
          if (count === 1) bgColor = 'rgba(16,185,129,0.15)'
          if (count === 2) bgColor = 'rgba(16,185,129,0.4)'
          if (count >= 3) bgColor = 'rgba(16,185,129,0.8)'

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border relative",
                !isCurrentMonth ? "opacity-20 translate-y-1 pointer-events-none" : "hover:scale-105",
                isSelected ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-transparent",
                active && !isSelected && "border-emerald-500/30",
              )}
              style={{ background: isCurrentMonth ? bgColor : 'transparent' }}
            >
              <span className={cn(
                "font-black",
                isDesktop ? "text-[12px]" : "text-xs",
                count >= 3 && isCurrentMonth ? "text-white" : isCurrentMonth ? "text-[#F1F5F9]" : "text-[#4B6478]"
              )}>
                {format(day, 'd')}
              </span>
              
              <div className="absolute bottom-1.5 flex gap-0.5">
                 {events?.harvests.some(e => e.estimated_harvest_date === dayStr) && <div className="w-1 h-1 rounded-full bg-[#10B981]" />}
                 {events?.dues.some(e => e.due_date === dayStr) && <div className="w-1 h-1 rounded-full bg-[#F87171]" />}
                 {events?.deliveries.some(e => format(new Date(e.created_at), 'yyyy-MM-dd') === dayStr) && <div className="w-1 h-1 rounded-full bg-[#F59E0B]" />}
                 {events?.payments.some(e => e.payment_date === dayStr) && <div className="w-1 h-1 rounded-full bg-[#818CF8]" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Redundant AgendaMiniStat removed

function EventItem({ event, isDesktop, onClick }) {
  const Icon = event.icon
  const diff = differenceInDays(new Date(event.date), new Date())
  const isPast = diff < 0
  const isTodayDate = isSameDay(new Date(event.date), new Date())
  
  let urgency = { label: 'Terjadwal', color: 'bg-slate-500/10 text-slate-400' }
  
  if (isPast) {
    urgency = { label: 'MENDESAK', color: 'bg-red-500/10 text-red-400' }
  } else if (isTodayDate) {
    urgency = { label: 'HARI INI', color: 'bg-amber-500/10 text-amber-400' }
  } else {
    urgency = { label: `${diff} Hari Lagi`, color: 'bg-slate-500/10 text-slate-400' }
  }

  // Override specific badges
  if (event.type === 'Panen') urgency = { label: 'PANEN', color: 'bg-emerald-500/10 text-emerald-400' }
  if (event.type === 'Pengiriman') urgency = { label: 'PENGIRIMAN', color: 'bg-blue-500/10 text-blue-400' }
  if (event.type === 'Pembayaran') urgency = { label: 'LUNAS', color: 'bg-emerald-500/10 text-emerald-400' }

  let title = event.type
  let subtitle = formatDate(event.date)

  if (event.type === 'Piutang') {
    title = 'Piutang Jatuh Tempo'
    subtitle = `${event.rpa_clients?.rpa_name || 'RPA'} • ${formatIDRShort(calcRemainingAmount(event))}`
  } else if (event.type === 'Panen') {
    title = 'Jadwal Panen'
    subtitle = `${event.farms?.farm_name || 'Kandang'} • Est. ${event.current_count || 0} ekor`
  } else if (event.type === 'Pengiriman') {
    title = `Pengiriman ke ${event.sales?.rpa_clients?.rpa_name || 'RPA'}`
    subtitle = `${event.initial_count || 0} ekor • ${event.driver_name || '-'}`
  } else if (event.type === 'Pembayaran') {
    title = 'Pembayaran Diterima'
    subtitle = `${event.sales?.rpa_clients?.rpa_name || 'RPA'} • ${formatIDRShort(event.amount)}`
  }

  return (
    <div 
      onClick={onClick}
      className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
    >
       <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${event.color}15`, color: event.color }}>
          <Icon size={18} />
       </div>
       <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
             <h4 className={cn("font-bold text-[#F1F5F9] truncate", isDesktop ? "text-[13px]" : "text-sm")}>{title}</h4>
             <Badge className={cn("font-black uppercase tracking-tighter border-none px-2 h-5 shrink-0", urgency.color, isDesktop ? "text-[8px]" : "text-[10px]")}>{urgency.label}</Badge>
          </div>
          <p className={cn("text-[#4B6478] font-medium mt-0.5 truncate", isDesktop ? "text-[11px]" : "text-xs")}>
             {subtitle}
          </p>
       </div>
    </div>
  )
}


function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 19) return 'sore'
  return 'malam'
}

// ─── MARKET TREND CARD ────────────────────────────────────────────────────────

function MarketTrendCard({ province }) {
  const [period, setPeriod] = useState('weekly') // 'weekly' | 'monthly'

  const { startDate, endDate, daysLabel } = useMemo(() => {
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    let start, end
    if (period === 'weekly') {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end   = now // cap to today, don't show future days
    } else {
      start = startOfMonth(now)
      end   = now
    }
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate:   format(end,   'yyyy-MM-dd'),
      daysLabel: period === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'
    }
  }, [period])

  const { data: trendData, isLoading } = useMarketTrends(
    province === 'Seluruh Indonesia' ? 'Jawa Tengah' : province,
    startDate,
    endDate
  )

  return (
    <Card className="p-8 bg-[#0C1319] border-white/5 rounded-[32px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="flex flex-col gap-4 mb-8 relative z-10">
        {/* Row 1: Title + Toggle */}
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Tren Harga Pasar — {province}</p>
            </div>
            <h3 className="text-2xl font-display font-black text-white">Hybrid Market Insight</h3>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-md shrink-0">
            <button
              onClick={() => setPeriod('weekly')}
              className={cn(
                "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                period === 'weekly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
              )}
            >
              Mingguan
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={cn(
                "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ml-0.5",
                period === 'monthly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
              )}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Row 2: Meta + Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {trendData?.[trendData.length - 1]?.delta !== 0 && (
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                trendData?.[trendData.length - 1]?.delta > 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              )}>
                {trendData?.[trendData.length - 1]?.delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {trendData?.[trendData.length - 1]?.delta > 0 ? '+' : ''}
                {formatIDR(trendData?.[trendData.length - 1]?.delta)} vs Kemarin
              </div>
            )}
            <Badge className="bg-white/5 text-[#4B6478] border-white/10 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
              {daysLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <LegendItem color="#F59E0B" label="Chickin.id" dashed />
            <LegendItem color="#10B981" label="Harga Beli" />
            <LegendItem color="#818CF8" label="Harga Jual" />
          </div>
        </div>
      </div>

      <div className="h-[240px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#4B6478', fontSize: 10, fontWeight: 800}}
              dy={10}
              interval={period === 'monthly' ? 2 : 0}
            />
            <YAxis hide domain={['dataMin - 3000', 'dataMax + 2000']} />
            <RechartsTooltip content={<CustomTrendTooltip />} />
            
            {/* Chickin.id — dashed amber reference */}
            <Area type="monotone" dataKey="chickin" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" fill="transparent" connectNulls dot={false} />
            {/* Harga Jual ke RPA */}
            <Area type="monotone" dataKey="sellPrice" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#colorSell)" connectNulls activeDot={{ r: 5, stroke: '#0C1319', strokeWidth: 2, fill: '#818CF8' }} />
            {/* Harga Beli dari Kandang — dominant */}
            <Area type="monotone" dataKey="buyPrice" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorBuy)" activeDot={{ r: 6, stroke: '#0C1319', strokeWidth: 2, fill: '#10B981' }} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function LegendItem({ color, label, dashed = false }) {
  return (
    <div className="flex items-center gap-2">
      {dashed
        ? <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
        : <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
      <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">{label}</span>
    </div>
  )
}

function CustomTrendTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null
    const data = payload[0].payload
    const spread = (data.buyPrice && data.chickin) ? data.chickin - data.buyPrice : null
    const margin = (data.buyPrice && data.sellPrice) ? data.sellPrice - data.buyPrice : null
    
    return (
      <div className="bg-[#0C1319] border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-xl">
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-3">{data.displayDate}</p>
        
        <div className="space-y-3">
          <TrendValue label="Chickin.id (Ref)" value={data.chickin} color="text-amber-400" />
          <TrendValue label="Harga Beli (Pasar)" value={data.buyPrice} color="text-emerald-400" delta={data.delta} />
          <TrendValue label="Harga Jual (Pasar)" value={data.sellPrice} color="text-indigo-400" />
        </div>
        {spread != null && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">Efisiensi Beli vs Chickin</span>
              <span className={cn('text-xs font-black tabular-nums', spread >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {spread > 0 ? '+' : ''}{formatIDR(spread)}
              </span>
            </div>
            {margin != null && (
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">Margin/kg (Pasar)</span>
                <span className={cn('text-xs font-black tabular-nums', margin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {margin > 0 ? '+' : ''}{formatIDR(margin)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
}

function TrendValue({ label, value, color, delta }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-[11px] text-[#94A3B8] font-bold">{label}</span>
      <div className="flex flex-col items-end">
        <span className={cn("text-sm font-black tabular-nums", value ? color : 'text-[#4B6478]')}>
          {value ? formatIDR(value) : '—'}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span className={cn(
            "text-[9px] font-black tabular-nums",
            delta > 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString('id-ID')}
          </span>
        )}
      </div>
    </div>
  )
}
