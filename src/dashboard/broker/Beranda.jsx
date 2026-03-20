import React, { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ShoppingCart,
  BarChart2,
  Warehouse,
  Clock,
  CheckCircle,
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard
} from 'lucide-react'
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
  formatDateFull,
  formatEkor,
  formatRelative,
  safeNum,
  calcNetProfit
} from '@/lib/format'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/EmptyState'
import KPICard from '../components/KPICard'
import TransaksiWizard from '../components/TransaksiWizard'

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

export default function BrokerBeranda() {
  const { profile, tenant } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [wizardOpen, setWizardOpen] = useState(false)

  const { data: homeData, isLoading } = useDashboardStats(tenant?.id)

  const handleTandaiLunas = async (rpaId, rpaName) => {
    try {
      const { data: unpaidSales } = await supabase
        .from('sales')
        .select('id, total_revenue')
        .eq('rpa_id', rpaId)
        .neq('payment_status', 'lunas')
        .eq('is_deleted', false)

      if (!unpaidSales) return

      for (const sale of unpaidSales) {
        await supabase.from('sales').update({
          payment_status: 'lunas',
          paid_amount: sale.total_revenue
        }).eq('id', sale.id)
      }

      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', tenant.id] })
      toast.success(`✅ Semua piutang ${rpaName} ditandai lunas!`)
    } catch (err) {
      toast.error('❌ Gagal memperbarui status lunas')
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <>
      <AnimatePresence mode="wait">
        {isDesktop ? (
          <DesktopDashboard
            key="desktop"
            homeData={homeData}
            armadaAlerts={homeData?.armadaAlerts}
            weeklyData={homeData?.weeklyData}
            profile={profile}
            navigate={navigate}
            setWizardOpen={setWizardOpen}
            handleTandaiLunas={handleTandaiLunas}
          />
        ) : (
          <MobileDashboard
            key="mobile"
            homeData={homeData}
            armadaAlerts={homeData?.armadaAlerts}
            profile={profile}
            navigate={navigate}
            setWizardOpen={setWizardOpen}
            handleTandaiLunas={handleTandaiLunas}
          />
        )}
      </AnimatePresence>

      <TransaksiWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  )
}

function DesktopDashboard({ homeData, armadaAlerts, weeklyData, profile, navigate, setWizardOpen, handleTandaiLunas }) {
  const firstName = profile?.full_name?.split(' ')[0] || 'User'
  const isChartEmpty = !weeklyData || weeklyData.every(d => d.profit === 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 pb-10"
    >
      <div className="flex justify-between items-end">
        <div>
          <p className="text-muted-foreground font-body text-sm font-medium uppercase tracking-widest leading-loose">Selamat {getGreeting()},</p>
          <h1 className="text-3xl font-display font-extrabold text-[#F1F5F9] tracking-tight">
            Dashboard {firstName} <span className="animate-float inline-block">👋</span>
          </h1>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          style={{ background: '#10B981', color: 'white', borderRadius: 10, gap: 8, boxShadow: '0 4px 14px rgba(16,185,129,0.25)', height: 44, paddingLeft: 20, paddingRight: 20, fontWeight: 700 }}
        >
          <Plus size={15} />
          Catat Transaksi
        </Button>
      </div>

      {armadaAlerts?.expiringSIMs?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-[24px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-0.5">Peringatan SIM Driver</p>
              <p className="text-sm font-bold text-white">
                {armadaAlerts.expiringSIMs.length} Driver memiliki SIM yang hampir atau sudah kadaluarsa.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/broker/armada')}
            className="rounded-xl border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 font-black text-[10px] uppercase tracking-widest"
          >
            Perbarui Data
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Profit Minggu Ini"
          value={formatIDRShort(homeData?.weeklyProfit)}
          sub="Earning bersih 7 hari terakhir"
          icon={TrendingUp}
        />
        <KPICard
          label="Total Piutang"
          value={formatIDRShort(homeData?.totalPiutang)}
          sub={`${homeData?.rpaCount} RPA belum lunas`}
          icon={Clock}
        />
        <KPICard
          label="Transaksi Minggu Ini"
          value={homeData?.weeklySalesCount}
          sub={`${homeData?.weeklySalesCount} jual · ${homeData?.weeklyBuyCount} beli`}
          icon={BarChart2}
        />
        <KPICard
          label="Kandang Ready"
          value={homeData?.farmsReadyCount}
          sub="Siap untuk dipanen"
          icon={Warehouse}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6 bg-[#0C1319] border-border rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-display font-bold">Ringkasan Profit</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">7 hari terakhir penjualan broker</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {isChartEmpty ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart2 size={32} className="text-emerald-500/30" />
                <p className="text-sm font-medium">Belum ada data transaksi</p>
                <p className="text-xs">Catat transaksi pertama untuk melihat grafik profit</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B6478', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#111C24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                    formatter={(value) => formatIDR(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[#0C1319] border-border rounded-3xl overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-md font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">Aktivitas Hari Ini</h3>
            <button className="text-[11px] font-bold text-emerald-400 hover:underline" onClick={() => navigate('/broker/transaksi')}>Lihat Semua</button>
          </div>
          <div className="space-y-4 flex-1">
            {homeData?.recentFeed?.length > 0 ? (
              homeData.recentFeed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/20 transition-all cursor-pointer group" onClick={() => navigate('/broker/transaksi')}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                    <ArrowUpRight size={16} className={item.profit >= 0 ? "text-emerald-400" : "text-red-400"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#F1F5F9] truncate group-hover:text-emerald-400 transition-colors">
                      {item.rpa_clients?.rpa_name || 'RPA Umum'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium tabular-nums">
                      {item.quantity.toLocaleString()} ekor · {formatRelative(item.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-black ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.profit >= 0 ? '+' : ''}{formatIDRShort(item.profit)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-10">
                <Package size={24} className="text-emerald-500/30" />
                <p className="text-xs text-muted-foreground">Belum ada transaksi hari ini</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-emerald-500 border-none text-white hover:bg-emerald-600 text-xs font-bold px-4 h-8 rounded-lg"
                  onClick={() => setWizardOpen(true)}
                >
                  + Catat Sekarang
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-[#0C1319] border-border rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-md font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">Piutang RPA Belum Lunas</h3>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-400 h-8" onClick={() => navigate('/broker/rpa')}>Lihat Semua</Button>
        </div>
        {homeData?.rpaWithDebt?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeData.rpaWithDebt.map((rpa) => (
              <div key={rpa.id} className="p-4 border border-border rounded-2xl bg-secondary/30 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-display font-black text-emerald-400 text-xs">
                    {rpa.rpa_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F1F5F9]">{rpa.rpa_name}</p>
                    <p className="text-sm font-black text-red-400 tabular-nums">
                      {formatIDRShort(rpa.total_outstanding)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15"
                  onClick={() => handleTandaiLunas(rpa.id, rpa.rpa_name)}
                >
                  <CheckCircle size={18} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center gap-2">
            <CheckCircle size={24} className="text-emerald-500/40" />
            <p className="text-sm text-muted-foreground">Semua pembayaran lunas ✅</p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function MobileDashboard({ homeData, armadaAlerts, profile, navigate, setWizardOpen, handleTandaiLunas }) {
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BR'
  const firstName = profile?.full_name?.split(' ')[0] || 'User'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col min-h-full bg-[#06090F] text-foreground pb-24"
    >
      <header className="bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/5 px-5 pt-6 pb-4 flex justify-between items-start">
        <div>
          <p className="font-body text-[13px] text-[#4B6478]">Selamat {getGreeting()},</p>
          <h1 className="font-display text-[22px] font-extrabold text-[#F1F5F9] leading-tight">
            {firstName}! 👋
          </h1>
          <p className="font-body text-[12px] text-[#4B6478] mt-1">
            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}
          </p>
        </div>
        <div className="relative cursor-pointer" onClick={() => navigate('/broker/akun')}>
          <Avatar className="h-10 w-10 border-2 border-emerald-500/30">
            <AvatarFallback className="bg-emerald-500/15 text-[#34D399] font-display font-extrabold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {armadaAlerts?.expiringSIMs?.length > 0 && (
        <div
          onClick={() => navigate('/broker/armada')}
          className="mx-5 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2.5 active:scale-95 transition-all"
        >
          <CreditCard size={16} className="text-amber-500" />
          <span className="flex-1 text-[13px] text-amber-400 font-medium">
            {armadaAlerts.expiringSIMs.length} SIM Driver hampir kadaluarsa
          </span>
          <ChevronRight size={14} className="text-amber-500" />
        </div>
      )}

      <AnimatePresence>
        {homeData?.overdueCount > 0 && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mx-5 mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2.5"
            onClick={() => navigate('/broker/rpa')}
          >
            <AlertCircle size={16} className="text-red-400" />
            <span className="flex-1 text-[13px] text-red-300 font-medium">
              {homeData.overdueCount} piutang sudah jatuh tempo
            </span>
            <ChevronRight size={14} className="text-red-400" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="px-5 mt-4 grid grid-cols-2 gap-2.5"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            label="Profit Minggu Ini"
            value={homeData?.weeklyProfit || 0}
            isCurrency
            valueColor={homeData?.weeklyProfit >= 0 ? '#34D399' : '#F87171'}
            sub={`dari ${homeData?.weeklySalesCount + homeData?.weeklyBuyCount} tx`}
            icon={TrendingUp}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Total Piutang"
            value={homeData?.totalPiutang || 0}
            isCurrency
            valueColor={homeData?.totalPiutang > 0 ? '#F87171' : '#34D399'}
            sub={`${homeData?.rpaCount} RPA outstanding`}
            icon={Clock}
            onClick={() => navigate('/broker/rpa')}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Transaksi Minggu Ini"
            value={homeData?.weeklySalesCount}
            sub={`${homeData?.weeklySalesCount} jual · ${homeData?.weeklyBuyCount} beli`}
            icon={BarChart2}
            onClick={() => navigate('/broker/transaksi')}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Kandang Ready"
            value={homeData?.farmsReadyCount}
            valueColor={homeData?.farmsReadyCount > 0 ? '#34D399' : '#F1F5F9'}
            sub="siap panen"
            icon={Warehouse}
            onClick={() => navigate('/broker/kandang')}
          />
        </motion.div>
      </motion.section>

      <section className="px-5 mt-4">
        <Button
          style={{ width: '100%', height: 52, background: '#10B981', color: 'white', borderRadius: 14, gap: 8, fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(16,185,129,0.25)', border: 'none' }}
          onClick={() => setWizardOpen(true)}
        >
          <Plus size={18} />
          Catat Transaksi
        </Button>
      </section>

      <section className="px-5 mt-6 mb-8 space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] px-1">
          Aktivitas Hari Ini
        </h3>
        {(!homeData || !homeData.recentFeed || homeData.recentFeed.length === 0) ? (
          <EmptyState
            icon={Package}
            title="Belum ada transaksi"
            description="Mulai catat pembelian atau penjualan pertamamu hari ini."
          />
        ) : (
          <div className="bg-[#111C24] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {homeData.recentFeed.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center gap-3" onClick={() => navigate('/broker/transaksi')}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                  <ArrowUpRight size={18} className={item.profit >= 0 ? "text-[#34D399]" : "text-red-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#F1F5F9] truncate">{item.rpa_clients?.rpa_name || 'RPA Umum'}</p>
                  <p className="text-[11px] text-[#4B6478] font-bold mt-0.5">{item.quantity} ekor · {formatRelative(item.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[15px] font-black ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.profit >= 0 ? '+' : ''}{formatIDRShort(item.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}

function StatCard({ label, value, sub, valueColor, icon: Icon, onClick, isCurrency }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    if (isCurrency) return formatIDRShort(Math.round(latest))
    return Math.round(latest).toString()
  })

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" })
    return controls.stop
  }, [value, count])

  return (
    <Card
      className="bg-[#111C24] border-white/5 rounded-2xl p-4 cursor-pointer hover:border-white/10 transition-all flex flex-col gap-1 active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">
        <Icon size={12} className="opacity-50" />
        {label}
      </div>
      <motion.div
        className="font-display text-[20px] font-black leading-none tracking-tight tabular-nums"
        style={{ color: valueColor || '#F1F5F9' }}
      >
        {rounded}
      </motion.div>
      {sub && <p className="text-[10px] text-[#4B6478] font-bold leading-none mt-1">{sub}</p>}
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="p-0 bg-[#06090F] min-h-screen">
      <div className="px-5 pt-10 mb-8 space-y-3">
        <Skeleton className="h-3 w-24 bg-white/5" />
        <Skeleton className="h-8 w-40 bg-white/5" />
        <Skeleton className="h-3 w-32 bg-white/5" />
      </div>
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <Skeleton className="h-[96px] rounded-2xl bg-white/5" />
        <Skeleton className="h-[96px] rounded-2xl bg-white/5" />
        <Skeleton className="h-[96px] rounded-2xl bg-white/5" />
        <Skeleton className="h-[96px] rounded-2xl bg-white/5" />
      </div>
      <div className="px-5 grid grid-cols-2 gap-3 mb-8">
        <Skeleton className="h-[52px] rounded-2xl bg-white/5" />
        <Skeleton className="h-[52px] rounded-2xl bg-white/5" />
      </div>
      <div className="px-5 space-y-3">
        <Skeleton className="h-3 w-32 bg-white/5 ml-1" />
        <div className="border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          <Skeleton className="h-[72px] bg-white/5" />
          <Skeleton className="h-[72px] bg-white/5" />
          <Skeleton className="h-[72px] bg-white/5" />
        </div>
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
