import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  AlertCircle,
  ChevronRight,
  BarChart2,
  Clock,
  CheckCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  Truck,
  Package,
  ArrowRight,
  Eye,
  Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  formatIDR,
  formatIDRShort,
  formatDate,
  formatDateFull,
  formatRelative,
  safeNum,
  calcNetProfit,
  calcRemainingAmount
} from '@/lib/format'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import TransaksiWizard from '../components/TransaksiWizard'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, format, isToday, isWithinInterval, addDays, differenceInDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

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
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // --- LOCAL STATES ---
  const [wizardOpen, setWizardOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState('weekly') // 'weekly' | 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [agendaFilter, setAgendaFilter] = useState('Semua') // 'Semua' | 'Piutang' | 'Panen' | 'Pengiriman' | 'Pembayaran'

  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today])

  // --- DATA FETCHING (Unified for Beranda Redesign) ---
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-redesign', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null

      // Fetch 60 days of sales to compare periods (Insight & KPI Trends)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      
      const [salesRes, harvestsRes, deliveriesRes, paymentsRes, unpaidSalesRes] = await Promise.all([
        supabase.from('sales').select('*, purchases(*), rpa_clients(rpa_name)').eq('tenant_id', tenant.id).eq('is_deleted', false).gte('transaction_date', sixtyDaysAgo.split('T')[0]),
        supabase.from('farms').select('*').eq('tenant_id', tenant.id).eq('is_deleted', false).not('harvest_date', 'is', null),
        supabase.from('deliveries').select('*, sales(*)').eq('tenant_id', tenant.id).eq('is_deleted', false).neq('status', 'completed'),
        supabase.from('payments').select('*').eq('tenant_id', tenant.id),
        supabase.from('sales').select('*, rpa_clients(rpa_name)').eq('tenant_id', tenant.id).eq('is_deleted', false).neq('payment_status', 'lunas')
      ])

      const sales = salesRes.data || []
      const harvests = harvestsRes.data || []
      const deliveries = deliveriesRes.data || []
      const payments = paymentsRes.data || []
      const unpaidSales = unpaidSalesRes.data || []

      // 1. SMART INSIGHT (W0 vs W1 profit)
      const w0End = new Date()
      const w0Start = addDays(w0End, -6)
      const w1End = addDays(w0Start, -1)
      const w1Start = addDays(w1End, -6)

      const getIntervalProfit = (start, end) => {
        return sales
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

      const m0Sales = sales.filter(s => {
        const d = new Date(s.transaction_date)
        return d >= m0Start && d <= today
      })
      const m1Sales = sales.filter(s => {
        const d = new Date(s.transaction_date)
        return d >= m1Start && d <= m1End
      })

      // KPI 1: TOTAL PIUTANG (Sum remaining amount where not lunas)
      const totalPiutang = unpaidSales.reduce((sum, s) => sum + calcRemainingAmount(s), 0)
      
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
          const daySales = sales.filter(s => s.transaction_date === dStr)
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
          unpaidCount: unpaidSales.length,
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
          harvests,
          dues: unpaidSales.filter(s => s.due_date),
          deliveries,
          payments,
          todayActivites: sales.filter(s => s.transaction_date === todayStr)
        },
        rpaWithDebt:Object.values(unpaidSales.reduce((acc, s) =>{
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

  if (isLoading) return <LoadingState />

  const data = dashboardData

  return (
    <>
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
          />
        ) : (
          <MobileDashboard
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
          />
        )}
      </AnimatePresence>

      <TransaksiWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  )
}

// --- DESKTOP RENDERER ---
function DesktopDashboard({ data, profile, navigate, setWizardOpen, handleTandaiLunas, chartPeriod, setChartPeriod, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter }) {
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
          {data?.insight && (
            <p className="text-[12px] font-display font-medium text-[#34D399] mt-2 flex items-center gap-1.5">
              {data.insight.text}
            </p>
          )}
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
              value={formatIDRShort(data?.kpis.totalPiutang)}
              sub={`${data?.kpis.unpaidCount} RPA belum lunas`}
              icon={Clock}
              trend={data?.kpis.piutangTrend}
              onClick={() => navigate('/broker/rpa')}
            />
            <KPICardNew
              compact
              label="TRANSAKSI BULAN INI"
              value={data?.kpis.monthlySales}
              sub={`${data?.kpis.monthlySales} jual · ${data?.kpis.monthlyPurchases} beli`}
              icon={BarChart2}
              trend={data?.kpis.txTrend}
              onClick={() => navigate('/broker/transaksi')}
            />
          </div>
          <Card className="p-8 bg-[#0C1319] border-white/5 rounded-[32px] relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 relative z-10 transition-all">
              <div>
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Total Net Profit</p>
                <div className="flex items-center gap-3">
                  <h3 className="text-[28px] font-display font-black text-[#34D399] tabular-nums">
                    {chartPeriod === 'weekly' ? formatIDR(data?.chart.totalNetProfitWeekly) : formatIDR(data?.chart.totalNetProfitMonthly)}
                  </h3>
                  <Badge className="bg-[#10B981]/10 text-[#10B981] border-none text-[10px] font-black uppercase tracking-tighter">
                    {chartPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
                  </Badge>
                </div>
              </div>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setChartPeriod('weekly')}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    chartPeriod === 'weekly' ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-[#94A3B8]"
                  )}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => setChartPeriod('monthly')}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ml-1",
                    chartPeriod === 'monthly' ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-[#94A3B8]"
                  )}
                >
                  Bulanan
                </button>
              </div>
            </div>
            
            <div className="h-[280px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartPeriod === 'weekly' ? data?.chart.weekly : data?.chart.monthly}
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

          {/* 5. PIUTANG RPA SECTION */}
          <Card className="p-8 bg-[#0C1319] border-white/5 rounded-[32px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Piutang RPA Terbesar</h3>
              <Button variant="ghost" size="sm" className="text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10" onClick={() => navigate('/broker/rpa')}>
                Lihat Semua <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
            {data?.rpaWithDebt.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.rpaWithDebt.map((rpa) => (
                  <div key={rpa.id} className="p-4 border border-white/5 rounded-2xl bg-black/20 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center font-display font-black text-emerald-400 text-[10px]">
                        {rpa.rpa_name.substring(0, 2).toUpperCase()}
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
function MobileDashboard({ data, profile, navigate, setWizardOpen, chartPeriod, setChartPeriod, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter }) {
  const firstName = profile?.full_name?.split(' ')[0] || 'User'
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BR'

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col min-h-full bg-[#06090F] text-foreground pb-24">
      <header className="px-5 pt-8 pb-6 flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-1">TernakOS Broker</p>
          <h1 className="font-display text-2xl font-black text-[#F1F5F9] leading-tight flex items-center gap-2">
            Halo, {firstName} <span className="text-xl">👋</span>
          </h1>
          {data?.insight && (
            <p className="text-[11px] font-display font-medium text-[#34D399] mt-2 leading-relaxed">
              {data.insight.text}
            </p>
          )}
        </div>
        <Avatar className="h-10 w-10 border-2 border-emerald-500/30" onClick={() => navigate('/broker/akun')}>
          <AvatarFallback className="bg-emerald-500/10 text-[#34D399] font-black text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* KPI Cards Mobile - 2 Column */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <KPICardNew
          label="PIUTANG"
          value={formatIDRShort(data?.kpis.totalPiutang)}
          trend={data?.kpis.piutangTrend}
          small
          onClick={() => navigate('/broker/rpa')}
        />
        <KPICardNew
          label="PENJUALAN"
          value={data?.kpis.monthlySales}
          trend={data?.kpis.txTrend}
          small
          onClick={() => navigate('/broker/transaksi')}
        />
      </div>

      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-[28px] p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden active:scale-[0.98] transition-all" onClick={() => setWizardOpen(true)}>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Profit {chartPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}</p>
              <h2 className="text-2xl font-display font-black tabular-nums">
                {chartPeriod === 'weekly' ? formatIDRShort(data?.chart.totalNetProfitWeekly) : formatIDRShort(data?.chart.totalNetProfitMonthly)}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chart Section */}
      <section className="px-5 mb-8">
        <div className="bg-[#0C1319] border border-white/5 rounded-[28px] p-5">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Grafik Profit</h3>
             <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/5 scale-90 origin-right">
                <button onClick={() => setChartPeriod('weekly')} className={cn("px-3 py-1 text-[9px] font-black uppercase rounded-md", chartPeriod === 'weekly' ? "bg-emerald-500 text-white" : "text-[#4B6478]")}>W</button>
                <button onClick={() => setChartPeriod('monthly')} className={cn("px-3 py-1 text-[9px] font-black uppercase rounded-md ml-0.5", chartPeriod === 'monthly' ? "bg-emerald-500 text-white" : "text-[#4B6478]")}>M</button>
             </div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPeriod === 'weekly' ? data?.chart.weekly : data?.chart.monthly}>
                <XAxis dataKey="name" hide />
                <RechartsTooltip content={() => null} />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2.5} fill="rgba(16,185,129,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Agenda Section - Moves Below Chart on Mobile */}
      <div className="px-5">
        <AgendaSection
          data={data}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          agendaFilter={agendaFilter}
          setAgendaFilter={setAgendaFilter}
          isDesktop={false}
        />
      </div>

      <section className="px-5 mt-8 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Piutang RPA</h3>
          <Button variant="link" size="sm" className="text-[10px] font-black uppercase text-emerald-400 p-0 h-auto" onClick={() => navigate('/broker/rpa')}>Lihat Semua</Button>
        </div>
        <div className="space-y-2.5">
          {data?.rpaWithDebt.map(rpa => (
            <div key={rpa.id} className="p-3.5 bg-[#111C24] border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center font-black text-emerald-400 text-[10px]">{rpa.rpa_name[0]}</div>
                <p className="text-sm font-bold text-[#F1F5F9]">{rpa.rpa_name}</p>
              </div>
              <p className="text-sm font-black text-red-400 tabular-nums">{formatIDRShort(rpa.total_outstanding)}</p>
            </div>
          ))}
        </div>
      </section>
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
        <div className="flex items-center gap-2 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">
          {Icon && <Icon size={small || compact ? 12 : 14} className="opacity-50" />}
          {label}
        </div>
        {trend !== undefined && (
          <div className={cn(
            "text-[10px] font-black tabular-nums py-0.5 px-2 rounded-lg",
            trend >= 0 ? "bg-[#10B981]/10 text-[#10B981]" : "bg-red-500/10 text-red-500"
          )}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <div className={cn("font-display font-black tracking-tight tabular-nums", compact ? "text-xl" : small ? "text-xl" : "text-3xl")}>
        {value}
      </div>
      {sub && !compact && <p className="text-[11px] text-[#4B6478] font-bold mt-1 uppercase tracking-wider">{sub}</p>}
    </Card>
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
  const filteredEvents = useMemo(() => {
    if (!data?.events) return []
    const all = [
      ...data.events.harvests.map(e => ({ ...e, type: 'Panen', date: e.harvest_date, icon: Truck, color: '#10B981', dot: 'bg-[#10B981]' })),
      ...data.events.dues.map(e => ({ ...e, type: 'Piutang', date: e.due_date, icon: AlertCircle, color: '#F87171', dot: 'bg-[#F87171]' })),
      ...data.events.deliveries.map(e => ({ ...e, type: 'Pengiriman', date: format(new Date(e.created_at), 'yyyy-MM-dd'), icon: Package, color: '#F59E0B', dot: 'bg-[#F59E0B]' })),
      ...data.events.payments.map(e => ({ ...e, type: 'Pembayaran', date: e.payment_date, icon: Wallet, color: '#818CF8', dot: 'bg-[#818CF8]' }))
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
        piutang: data.events.dues.filter(e => e.due_date.startsWith(mStr)).reduce((sum, e) => sum + calcRemainingAmount(e), 0),
        panen: data.events.harvests.filter(e => e.harvest_date.startsWith(mStr)).length,
        krm: data.events.deliveries.length,
        bayar: data.events.payments.filter(e => e.payment_date.startsWith(mStr)).length
     }
  }, [data, currentMonth])

  return (
    <Card className="bg-[#0C1319] border-white/5 rounded-[32px] overflow-hidden border-none lg:border flex flex-col h-full">
      <div className="p-6 md:p-8 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
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
        />

        <div className="mt-8">
           <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
              {['Semua', 'Piutang', 'Panen', 'Pengiriman', 'Pembayaran'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setAgendaFilter(tab)}
                   className={cn(
                     "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                     agendaFilter === tab ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-black/20 border-white/5 text-[#4B6478] hover:border-white/10"
                   )}
                 >
                   {tab}
                 </button>
              ))}
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 md:mt-6 overflow-x-auto no-scrollbar md:grid">
              <AgendaMiniStat label="PIUTANG" value={formatIDRShort(stats.piutang)} color="text-red-400" />
              <AgendaMiniStat label="PANEN" value={stats.panen} color="text-emerald-400" />
              <AgendaMiniStat label="PENGIRIMAN" value={stats.krm} color="text-amber-400" />
              <AgendaMiniStat label="PEMBAYARAN" value={stats.bayar} color="text-indigo-400" />
           </div>

           <div className="space-y-3 mt-8">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, idx) => <EventItem key={idx} event={event} />)
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Tidak ada agenda hari ini</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </Card>
  )
}

function CalendarHeatmap({ currentMonth, selectedDate, setSelectedDate, events }) {
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
    events.harvests.forEach(h => add(h.harvest_date))
    events.dues.forEach(s => add(s.due_date))
    events.deliveries.forEach(d => add(format(new Date(d.created_at), 'yyyy-MM-dd')))
    events.payments.forEach(p => add(p.payment_date))
    return counts
  }, [events])

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} className="text-[10px] font-black text-[#4B6478] text-center pb-2">{d}</div>
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
                "text-[12px] font-black",
                count >= 3 && isCurrentMonth ? "text-white" : isCurrentMonth ? "text-[#F1F5F9]" : "text-[#4B6478]"
              )}>
                {format(day, 'd')}
              </span>
              
              <div className="absolute bottom-1.5 flex gap-0.5">
                 {events?.harvests.some(e => e.harvest_date === dayStr) && <div className="w-1 h-1 rounded-full bg-[#10B981]" />}
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

function AgendaMiniStat({ label, value, color }) {
  return (
    <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex flex-col gap-1 min-w-[100px]">
       <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-widest">{label}</p>
       <p className={cn("text-[13px] font-black tabular-nums", color)}>{value}</p>
    </div>
  )
}

function EventItem({ event }) {
  const Icon = event.icon
  const diff = differenceInDays(new Date(event.date), new Date())
  
  let urgency = { label: 'Terjadwal', color: 'bg-indigo-500/10 text-indigo-400' }
  if (diff <= 2) urgency = { label: 'Mendesak', color: 'bg-red-500/10 text-red-400' }
  else if (diff <= 7) urgency = { label: 'Segera', color: 'bg-amber-500/10 text-amber-400' }

  return (
    <div className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/20 transition-all">
       <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${event.color}15`, color: event.color }}>
          <Icon size={18} />
       </div>
       <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
             <h4 className="text-[13px] font-bold text-[#F1F5F9] truncate">{event.type === 'Piutang' ? event.rpa_clients?.rpa_name : event.farm_name || 'Event Sesuai Jadwal'}</h4>
             <Badge className={cn("text-[8px] font-black uppercase tracking-tighter border-none px-2 h-5", urgency.color)}>{urgency.label}</Badge>
          </div>
          <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">
             {formatDate(event.date)} {event.total_revenue ? `· ${formatIDRShort(event.total_revenue)}` : ''}
          </p>
       </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-10 bg-[#06090F] min-h-screen space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <Skeleton className="h-4 w-48 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-32 rounded-[28px] bg-white/5" />
        <Skeleton className="h-32 rounded-[28px] bg-white/5" />
      </div>
      <div className="grid grid-cols-3 gap-8">
        <Skeleton className="col-span-2 h-96 rounded-[32px] bg-white/5" />
        <Skeleton className="col-span-1 h-96 rounded-[32px] bg-white/5" />
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
