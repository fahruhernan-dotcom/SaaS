import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  formatIDRShort, 
  formatDateFull, 
  formatEkor 
} from '@/lib/format'
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
  const today = new Date().toISOString().split('T')[0]
  
  const [modalType, setModalType] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  const { data: homeData, isLoading } = useQuery({
    queryKey: ['broker-stats', tenant?.id],
    queryFn: async () => {
      const [
        { data: sales },
        { data: purchases },
        { data: rpaWithDebt },
        { data: farmsReady },
        { data: overdueSales }
      ] = await Promise.all([
        supabase.from('sales').select('net_revenue, total_revenue, quantity, total_weight_kg, payment_status, rpa_clients(rpa_name)').eq('tenant_id', tenant.id).eq('transaction_date', today).eq('is_deleted', false),
        supabase.from('purchases').select('total_modal, quantity, total_weight_kg, farms(farm_name)').eq('tenant_id', tenant.id).eq('transaction_date', today).eq('is_deleted', false),
        supabase.from('rpa_clients').select('id, rpa_name, total_outstanding').eq('tenant_id', tenant.id).eq('is_deleted', false).gt('total_outstanding', 0).order('total_outstanding', { ascending: false }),
        supabase.from('farms').select('id').eq('tenant_id', tenant.id).eq('status', 'ready').eq('is_deleted', false),
        supabase.from('sales').select('id').eq('tenant_id', tenant.id).lte('due_date', today).neq('payment_status', 'lunas').eq('is_deleted', false)
      ])

      const todaySalesRev = sales?.reduce((acc, s) => acc + Number(s.net_revenue || 0), 0) || 0
      const todayPurchaseCost = purchases?.reduce((acc, p) => acc + Number(p.total_modal || 0), 0) || 0
      const totalPiutang = rpaWithDebt?.reduce((acc, r) => acc + Number(r.total_outstanding || 0), 0) || 0
      
      return {
        todayProfit: todaySalesRev - todayPurchaseCost,
        todaySalesCount: sales?.length || 0,
        todayBuyCount: purchases?.length || 0,
        totalPiutang,
        rpaCount: rpaWithDebt?.length || 0,
        rpaWithDebt: rpaWithDebt?.slice(0, 5) || [],
        farmsReadyCount: farmsReady?.length || 0,
        overdueCount: overdueSales?.length || 0,
        recentFeed: [
          ...(sales?.map(s => ({ ...s, type: 'JUAL' })) || []),
          ...(purchases?.map(p => ({ ...p, type: 'BELI' })) || [])
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
        expiringSIMs: [] // Placeholder, will fetch below
      }
    },
    enabled: !!tenant?.id
  })

  // Separate query for Armada alerts to keep it clean
  const { data: armadaAlerts } = useQuery({
    queryKey: ['armada-alerts', tenant?.id],
    queryFn: async () => {
      const today = new Date()
      const nextMonth = new Date()
      nextMonth.setDate(today.getDate() + 30)

      const { data: expiringDrivers } = await supabase
        .from('drivers')
        .select('id, full_name, sim_expires_at')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .lte('sim_expires_at', nextMonth.toISOString().split('T')[0])
        .order('sim_expires_at', { ascending: true })

      return {
        expiringSIMs: expiringDrivers || []
      }
    },
    enabled: !!tenant?.id
  })

  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['weekly-profit', tenant?.id],
    queryFn: async () => {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
        days.push({ date: dateStr, label: dayNames[date.getDay()] })
      }

      const { data: salesData } = await supabase
        .from('sales')
        .select('net_revenue, transaction_date')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', days[0].date)
        .lte('transaction_date', days[6].date)

      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('total_modal, transaction_date')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', days[0].date)
        .lte('transaction_date', days[6].date)

      return days.map(day => {
        const daySales = (salesData || []).filter(s => s.transaction_date === day.date)
        const dayPurchases = (purchasesData || []).filter(p => p.transaction_date === day.date)
        const revenue = daySales.reduce((sum, s) => sum + (Number(s.net_revenue) || 0), 0)
        const modal = dayPurchases.reduce((sum, p) => sum + (Number(p.total_modal) || 0), 0)
        return { name: day.label, profit: revenue - modal }
      })
    },
    enabled: !!tenant?.id
  })

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

      queryClient.invalidateQueries({ queryKey: ['broker-stats', tenant.id] })
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
            armadaAlerts={armadaAlerts}
            weeklyData={weeklyData}
            profile={profile} 
            navigate={navigate} 
            setWizardOpen={setWizardOpen}
            handleTandaiLunas={handleTandaiLunas}
          />
        ) : (
          <MobileDashboard 
            key="mobile"
            homeData={homeData} 
            armadaAlerts={armadaAlerts}
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
          label="Profit Hari Ini"
          value={formatIDRShort(homeData?.todayProfit)} 
          sub="Earning bersih hari ini"
          icon={TrendingUp}
        />
        <KPICard 
          label="Total Piutang"
          value={formatIDRShort(homeData?.totalPiutang)}
          sub={`${homeData?.rpaCount} RPA belum lunas`}
          icon={Clock}
        />
        <KPICard 
          label="Transaksi Hari Ini"
          value={homeData?.todaySalesCount + homeData?.todayBuyCount}
          sub={`${homeData?.todaySalesCount} jual · ${homeData?.todayBuyCount} beli`}
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
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
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
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'JUAL' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                  }`}>
                    {item.type === 'JUAL' ? <ArrowUpRight size={16} className="text-emerald-400" /> : <ArrowDownLeft size={16} className="text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#F1F5F9] truncate group-hover:text-emerald-400 transition-colors">
                      {item.type === 'JUAL' ? item.rpa_clients?.rpa_name : item.farms?.farm_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium tabular-nums">
                      {item.quantity.toLocaleString()} ekor · Hari ini
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-black ${item.type === 'JUAL' ? 'text-emerald-400' : 'text-foreground'}`}>
                      {item.type === 'JUAL' ? '+' : '-'}{formatIDRShort(item.total_revenue || item.total_modal)}
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
            label="Profit Hari Ini"
            value={homeData?.todayProfit || 0}
            isCurrency
            valueColor={homeData?.todayProfit >= 0 ? '#34D399' : '#F87171'}
            sub={`dari ${homeData?.todaySalesCount + homeData?.todayBuyCount} tx`}
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
            label="Transaksi Hari Ini"
            value={homeData?.todaySalesCount + homeData?.todayBuyCount}
            sub={`${homeData?.todaySalesCount} jual · ${homeData?.todayBuyCount} beli`}
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.type === 'JUAL' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                }`}>
                  {item.type === 'JUAL' ? <ArrowUpRight size={18} className="text-[#34D399]" /> : <ArrowDownLeft size={18} className="text-[#93C5FD]" />}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[14px] font-bold text-[#F1F5F9] truncate">{item.type === 'JUAL' ? item.rpa_clients?.rpa_name : item.farms?.farm_name}</p>
                   <p className="text-[11px] text-[#4B6478] font-bold mt-0.5">{item.quantity} ekor · {item.type}</p>
                </div>
                <div className="text-right">
                    <p className={`text-[15px] font-black ${item.type === 'JUAL' ? 'text-emerald-400' : 'text-foreground'}`}>
                        {item.type === 'JUAL' ? '+' : '-'}{formatIDRShort(item.total_revenue || item.total_modal)}
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
