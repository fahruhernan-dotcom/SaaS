import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Building2, CreditCard, TrendingUp, Shield, 
  Activity, Clock, DollarSign, ArrowUpRight, 
  Bird, Egg, Home, Factory, ChevronRight, AlertTriangle
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts'
import { format, subMonths, isSameMonth, startOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useGlobalStats, useAdminUpdateTenant } from '@/lib/hooks/useAdminData'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatIDR } from '@/lib/format'
import { useNavigate } from 'react-router-dom'

export default function AdminBeranda() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useGlobalStats()
  const updateTenant = useAdminUpdateTenant()

  // Process data for AreaChart (Tenant Growth - last 6 months)
  const chartData = useMemo(() => {
    if (!stats?.raw?.tenants) return []
    
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        month: format(date, 'MMM'),
        date: startOfMonth(date),
        count: 0
      }
    })

    stats.raw.tenants.forEach(t => {
      const createdDate = new Date(t.created_at)
      const monthIndex = last6Months.findIndex(m => isSameMonth(m.date, createdDate))
      if (monthIndex !== -1) {
        last6Months[monthIndex].count += 1
      }
    })

    // Cumulative growth
    let cumulative = stats.raw.tenants.filter(t => new Date(t.created_at) < last6Months[0].date).length
    return last6Months.map(m => {
      cumulative += m.count
      return { ...m, total: cumulative }
    })
  }, [stats])

  // Process data for PieChart (Plan Distribution)
  const pieData = useMemo(() => {
    if (!stats?.tenants) return []
    return [
      { name: 'Starter', value: stats.tenants.starter, color: '#4B6478' },
      { name: 'Pro', value: stats.tenants.pro, color: '#10B981' },
      { name: 'Business', value: stats.tenants.business, color: '#F59E0B' },
    ]
  }, [stats])

  const handleExtendTrial = (tenantId, currentEnd) => {
    const newEnd = new Date(new Date(currentEnd).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    updateTenant.mutate({ tenantId, updates: { trial_ends_at: newEnd } })
  }

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Shield size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-none">
                Command Center
            </h1>
            <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
                Real-time Platform Health & Growth
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Sync Active</span>
        </div>
      </div>

      {/* KPI Row (6 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Tenant Aktif" value={stats.tenants.active} icon={Building2} color="emerald" />
        <KPICard label="Total User" value={stats.users.total} icon={Users} color="blue" />
        <KPICard label="Aktif 7 Hari" value={stats.users.activeThisWeek} icon={Activity} color="purple" />
        <KPICard label="Revenue (30H)" value={formatIDR(stats.revenue.thisMonth)} icon={TrendingUp} color="emerald" isCurrency />
        <KPICard label="Total Revenue" value={formatIDR(stats.revenue.total)} icon={DollarSign} color="white" isCurrency />
        <KPICard label="Pending Invoices" value={stats.revenue.pendingCount} icon={Clock} color="amber" isUrgent={stats.revenue.pendingCount > 0} />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Growth Area Chart (3/5) */}
        <Card className="lg:col-span-3 bg-[#111C24] border-white/8 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
           <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Pertumbuhan Tenant</h3>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[9px] font-black">+ {stats.tenants.newThisMonth} Bulan Ini</Badge>
           </div>
           
           <div className="h-[280px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                   <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                   <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#4B6478', fontSize: 10, fontWeight: 700}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#4B6478', fontSize: 10, fontWeight: 700}} hide />
                   <Tooltip 
                    contentStyle={{ backgroundColor: '#111C24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10B981' }}
                   />
                   <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </Card>

        {/* Plan Distribution Pie (2/5) */}
        <Card className="lg:col-span-2 bg-[#111C24] border-white/8 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] self-start mb-4 px-2">Distribusi Plan</h3>
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111C24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-2xl font-display font-black text-white">{stats.tenants.total}</p>
                 <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mt-0.5">Total</p>
              </div>
            </div>

            <div className="flex gap-4 mt-2">
               {pieData.map(p => (
                 <div key={p.name} className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                       <span className="text-[9px] font-black text-white/60 uppercase">{p.name}</span>
                    </div>
                    <p className="text-xs font-bold text-white mt-1">{p.value}</p>
                 </div>
               ))}
            </div>
        </Card>
      </div>

      {/* Bottom Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Expiring Trial */}
         <Card className="bg-[#111C24] border-white/8 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center gap-2">
                 <AlertTriangle size={14} className="text-amber-500" /> Trial Akan Habis
               </h3>
               {stats.tenants.trialExpiringSoon > 0 && (
                 <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[9px] font-black">{stats.tenants.trialExpiringSoon} Tenant</Badge>
               )}
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
               {stats.tenants.listExpiring.length > 0 ? stats.tenants.listExpiring.map(t => (
                 <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm">
                          {getVerticalIcon(t.business_vertical)}
                       </div>
                       <div>
                          <p className="text-[12px] font-bold text-white leading-tight">{t.business_name}</p>
                          <p className="text-[10px] text-red-400 font-bold uppercase mt-0.5">Exp: {format(new Date(t.trial_ends_at), 'dd MMM')}</p>
                       </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExtendTrial(t.id, t.trial_ends_at)}
                      className="h-7 rounded-lg border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 hover:bg-emerald-500 hover:text-white"
                    >
                       Extend 7H
                    </Button>
                 </div>
               )) : (
                 <div className="text-center py-8 opacity-30 flex flex-col items-center gap-2">
                    <Check size={32} className="text-emerald-400" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">Tidak ada trial berakhir dalam 7 hari</p>
                 </div>
               )}
            </div>
         </Card>

         {/* Recent Pending Invoices */}
         <Card className="bg-[#111C24] border-white/8 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center gap-2">
                 <Clock size={14} className="text-amber-500" /> Invoice Pending Terbaru
               </h3>
               {stats.revenue.pendingCount > 0 && (
                 <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase text-[9px] font-black">{stats.revenue.pendingCount} Pending</Badge>
               )}
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
               {stats.revenue.recentPending.length > 0 ? stats.revenue.recentPending.map(inv => (
                 <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <DollarSign size={14} />
                       </div>
                       <div>
                          <p className="text-[12px] font-bold text-white leading-tight">#{inv.invoice_number}</p>
                          <p className="text-[10px] text-[#4B6478] font-bold uppercase mt-0.5 truncate max-w-[120px]">{inv.tenants?.business_name}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <p className="text-[12px] font-black text-white">{formatIDR(inv.amount)}</p>
                       <Button 
                         size="sm" 
                         variant="ghost"
                         onClick={() => navigate('/admin/subscriptions')}
                         className="h-8 w-8 p-0 rounded-lg hover:bg-white/5 text-amber-400"
                       >
                          <ChevronRight size={16} />
                       </Button>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-8 opacity-30 flex flex-col items-center gap-2">
                    <Check size={32} className="text-emerald-400" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">Semua invoice lunas ✓</p>
                 </div>
               )}
            </div>
         </Card>
      </div>

      {/* Vertical Distribution */}
      <section className="space-y-4">
         <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] px-2 text-center">Distribusi Market Vertikal</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VerticalMiniCard label="Broker Ayam" value={stats.tenants.byVertical.poultry_broker} icon={Bird} color="emerald" />
            <VerticalMiniCard label="Broker Telur" value={stats.tenants.byVertical.egg_broker} icon={Egg} color="blue" />
            <VerticalMiniCard label="Peternak" value={stats.tenants.byVertical.peternak} icon={Home} color="purple" />
            <VerticalMiniCard label="RPA / RPA Buyer" value={stats.tenants.byVertical.rpa} icon={Factory} color="amber" />
         </div>
      </section>
    </motion.div>
  )
}

// --- Internal UI Components ---

function KPICard({ label, value, icon: Icon, color, isCurrency, isUrgent }) {
  const themes = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    white: "text-white bg-white/5 border-white/10 shadow-white/5"
  }

  return (
    <Card className={`bg-[#111C24] border-white/8 rounded-2xl p-4 relative overflow-hidden group hover:border-white/20 transition-all ${isUrgent ? 'border-amber-500/40 shadow-amber-500/5 pulse-subtle' : ''}`}>
       <div className="relative z-10 flex flex-col gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${themes[color]}`}>
             <Icon size={14} />
          </div>
          <div>
             <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">{label}</p>
             <p className={`font-display font-black text-white leading-none ${isCurrency ? 'text-lg' : 'text-2xl'}`}>
                {value}
             </p>
          </div>
       </div>
       <div className="absolute -right-2 -bottom-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
          <Icon size={60} />
       </div>
    </Card>
  )
}

function VerticalMiniCard({ label, value, icon: Icon, color }) {
    const themes = {
      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }

    return (
      <div className="bg-[#111C24] border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/15 transition-all">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${themes[color]}`}>
            <Icon size={18} />
         </div>
         <div>
            <p className="text-[13px] font-black text-white leading-none">{value}</p>
            <p className="text-[9px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest leading-none">{label}</p>
         </div>
      </div>
    )
}

function getVerticalIcon(v) {
  switch (v) {
    case 'poultry_broker': return '🐔'
    case 'egg_broker': return '🥚'
    case 'peternak': return '🏠'
    case 'rpa': return '🏭'
    default: return '🏢'
  }
}
