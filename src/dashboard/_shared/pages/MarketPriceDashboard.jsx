import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Clock, Info, 
  Zap, BarChart3, ShieldCheck, ExternalLink,
  ChevronRight, History, Save, AlertCircle,
  PieChart, Activity, Globe
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR, formatDate, safeNum } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────
const WIB_OFFSET = 7 * 60 * 60 * 1000
const TODAY_STR = new Date(Date.now() + WIB_OFFSET).toISOString().split('T')[0]

// ─── Helpers (Same as Landing Page) ───────────────────────────────────────────
function normaliseRow(row) {
  return {
    ...row,
    avg_buy_price:  safeNum(row.avg_buy_price)  || safeNum(row.farm_gate_price)  || 0,
    avg_sell_price: safeNum(row.avg_sell_price) || safeNum(row.buyer_price)       || 0,
    broker_margin:  safeNum(row.broker_margin)  || 0,
  }
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export default function MarketPriceDashboard() {
  const { profile, tenant } = useAuth()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [isManualOpen, setIsManualOpen] = useState(false)
  const canWrite = profile?.role === 'owner' || profile?.role === 'staff'

  // ── Data Fetching (Logic same as landing page) ──────────────────────────────
  const { data: rawPrices, isLoading, isFetching } = useQuery({
    queryKey: ['dashboard-market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('is_deleted', false)
        .order('price_date', { ascending: false })
        .order('region',     { ascending: false })
        .limit(60)

      if (error) throw error
      return (data || [])
        .map(normaliseRow)
        .filter(r => r.avg_buy_price > 0 && r.avg_sell_price > 0)
    },
    staleTime: 60 * 1000,
  })

  // ── Derived Data ───────────────────────────────────────────────────────────
  const dedupedPrices = useMemo(() => {
    if (!rawPrices?.length) return []
    const seen = new Map()
    for (const row of rawPrices) {
      if (!seen.has(row.price_date)) seen.set(row.price_date, row)
    }
    return [...seen.values()].sort((a, b) => b.price_date.localeCompare(a.price_date))
  }, [rawPrices])

  const latestRow = useMemo(() => dedupedPrices[0] ?? null, [dedupedPrices])
  const prevRow = useMemo(() => dedupedPrices[1] ?? null, [dedupedPrices])

  const buyDiff = latestRow && prevRow ? latestRow.avg_buy_price - prevRow.avg_buy_price : 0
  const sellDiff = latestRow && prevRow ? latestRow.avg_sell_price - prevRow.avg_sell_price : 0

  const chartData = useMemo(() => {
    if (!dedupedPrices.length) return []
    return [...dedupedPrices]
      .slice(0, 14)
      .reverse()
      .map(r => ({
        date: r.price_date,
        'Beli': r.avg_buy_price,
        'Jual': r.avg_sell_price,
      }))
  }, [dedupedPrices])

  const avgMargin7d = useMemo(() => {
    if (!dedupedPrices.length) return 0
    const recent = dedupedPrices.slice(0, 7).filter(r => r.broker_margin > 0)
    if (!recent.length) return 0
    return Math.round(recent.reduce((s, r) => s + r.broker_margin, 0) / recent.length)
  }, [dedupedPrices])

  return (
    <div className="bg-[#06090F] min-h-screen pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header Section */}
      <section className="px-6 pt-10 pb-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Market Feed</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Harga Pasar</h1>
            <p className="text-sm text-[#4B6478] font-medium max-w-lg">
              Data harga harian broiler & komoditas berdasarkan transaksi nyata platform.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <Clock size={14} className="text-[#4B6478]" />
                <span className="text-xs font-bold text-slate-300">
                  {latestRow ? formatDate(latestRow.price_date) : '-'}
                </span>
             </div>
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="px-6 grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 relative z-10">
        <StatCard 
          label="Harga Beli (Kandang)" 
          value={latestRow?.avg_buy_price} 
          diff={buyDiff}
          isLoading={isLoading} 
          icon={TrendingDown}
        />
        <StatCard 
          label="Harga Jual (Pasar)" 
          value={latestRow?.avg_sell_price} 
          diff={sellDiff}
          isLoading={isLoading} 
          icon={TrendingUp}
          highlight
        />
        <StatCard 
          label="Margin Broker" 
          value={latestRow?.broker_margin} 
          sub="Hari ini"
          isLoading={isLoading} 
          icon={PieChart}
        />
        <StatCard 
          label="Avg Margin 7 Hari" 
          value={avgMargin7d} 
          sub="7 hari terakhir"
          isLoading={isLoading} 
          icon={Activity}
        />
      </section>

      {/* Charts & Table Container */}
      <section className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0C1319]/80 backdrop-blur-sm border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Tren Harga 14 Hari</h3>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-bold text-[#4B6478] uppercase">{latestRow?.region || 'Nasional'}</span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                {isLoading ? (
                  <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBeli" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4B6478" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4B6478" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorJual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="date" axisLine={false} tickLine={false} 
                        tick={{ fontSize: 10, fill: '#4B6478', fontWeight: 700 }} 
                        tickFormatter={formatShortDate}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} tickLine={false} 
                        tick={{ fontSize: 10, fill: '#4B6478', fontWeight: 700 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area type="monotone" dataKey="Beli" stroke="#4B6478" strokeWidth={2} fill="url(#colorBeli)" />
                      <Area type="monotone" dataKey="Jual" stroke="#10B981" strokeWidth={2} fill="url(#colorJual)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Riwayat Update</h3>
                <span className="text-[10px] font-bold text-[#4B6478]">{dedupedPrices.length} records</span>
            </div>
            <Card className="bg-[#0C1319]/50 border-white/5 rounded-3xl overflow-hidden">
                <ScrollArea className="w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase">Tanggal</th>
                        <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Beli</th>
                        <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Jual</th>
                        <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Margin</th>
                        <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-center">Sumber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                         Array(5).fill(0).map((_, i) => (
                           <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-4 w-full bg-white/5" /></td></tr>
                         ))
                      ) : dedupedPrices.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-xs font-bold text-slate-300">{formatDate(p.price_date, 'dd MMM yyyy')}</td>
                          <td className="p-4 text-xs font-bold text-slate-400 text-right tabular-nums">{formatIDR(p.avg_buy_price).replace('Rp ', '')}</td>
                          <td className="p-4 text-xs font-black text-white text-right tabular-nums">{formatIDR(p.avg_sell_price).replace('Rp ', '')}</td>
                          <td className="p-4 text-xs font-bold text-emerald-400 text-right tabular-nums">{formatIDR(p.broker_margin).replace('Rp ', '')}</td>
                          <td className="p-4 text-center">
                             <SourceBadge source={p.source} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </Card>
          </div>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
          {/* Manual Update */}
          {canWrite && (
            <Card className="bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] border-none rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                <Zap size={60} strokeWidth={3} />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-white fill-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Cepat</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 leading-tight">Input Harga Pasar Terbaru</h3>
                <ManualPriceForm onSuccess={() => queryClient.invalidateQueries(['dashboard-market-prices'])} />
              </CardContent>
            </Card>
          )}

          {/* Wawasan Segment (Landing Page style) */}
          <div className="space-y-4">
             <h3 className="text-xs font-black text-[#4B6478] uppercase tracking-widest px-2">Wawasan Komoditas</h3>
             {[
               { title: 'Harga Kandang', desc: 'Harga ayam hidup di lokasi peternak sebelum distribusi.', icon: Globe },
               { title: 'Margin Sehat', desc: 'Range margin ideal broker berkisar Rp 1.500 - 3.000/kg.', icon: ShieldCheck },
               { title: 'Volatilitas Pasar', desc: 'Dipengaruhi ketersediaan DOC, pakan, dan hari besar.', icon: TrendingUp },
             ].map((item, i) => (
                <Card key={i} className="bg-[#111C24] border-white/5 rounded-2xl hover:border-white/10 transition-all cursor-default group">
                   <CardContent className="p-4 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{item.title}</h4>
                        <p className="text-[11px] text-[#4B6478] font-medium leading-relaxed">{item.desc}</p>
                      </div>
                   </CardContent>
                </Card>
             ))}
          </div>

          {/* External Links */}
          <Card className="bg-[#0C1319] border border-dashed border-white/10 rounded-2xl p-5 text-center">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <ExternalLink size={18} className="text-[#4B6478]" />
             </div>
             <p className="text-xs font-bold text-slate-300 mb-4">Lihat visualisasi publik & SEO untuk landing page.</p>
             <Button variant="outline" className="w-full bg-transparent border-white/10 text-[10px] font-black uppercase tracking-widest h-10" asChild>
                <a href="/harga-pasar" target="_blank">Kunjungi Link Publik</a>
             </Button>
          </Card>
        </div>

      </section>
    </div>
  )
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function StatCard({ label, value, diff, sub, icon: Icon, isLoading, highlight }) {
  return (
    <Card className={cn(
      "border-white/5 transition-all duration-300",
      highlight ? "bg-[#0C1319] border-emerald-500/20" : "bg-[#0C1319]/50"
    )}>
      <CardContent className="p-4 md:p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 bg-white/5" />
            <Skeleton className="h-8 w-full bg-white/5" />
          </div>
        ) : (
          <div className="space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{label}</span>
                <Icon size={14} className={cn(highlight ? "text-emerald-400" : "text-[#4B6478]")} />
             </div>
             <div className="flex flex-col">
                <span className={cn(
                  "text-2xl font-black tabular-nums tracking-tight",
                  highlight ? "text-emerald-400" : "text-white"
                )}>
                  {value > 0 ? formatIDR(value).replace('Rp ', '') : '-'}
                </span>
                {diff !== undefined && (
                   <span className={cn(
                     "text-[9px] font-black flex items-center gap-0.5 uppercase mt-0.5",
                     diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-[#4B6478]"
                   )}>
                      {diff > 0 ? '▲' : diff < 0 ? '▼' : '●'} {Math.abs(diff).toLocaleString('id-ID')}
                   </span>
                )}
                {sub && <span className="text-[10px] font-bold text-[#4B6478] mt-0.5">{sub}</span>}
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ManualPriceForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ beli: '', jual: '' })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.beli || !formData.jual) return toast.error('Isi harga beli & jual')
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('market_prices')
        .upsert({
          price_date: TODAY_STR,
          chicken_type: 'broiler',
          region: 'Jawa Tengah',
          avg_buy_price: Number(formData.beli),
          avg_sell_price: Number(formData.jual),
          farm_gate_price: Number(formData.beli),
          buyer_price: Number(formData.jual),
          source: 'manual',
          is_deleted: false
        }, { onConflict: 'price_date, chicken_type, region' })
      
      if (error) throw error
      toast.success('Harga berhasil diperbarui')
      setFormData({ beli: '', jual: '' })
      onSuccess()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input 
          type="number" placeholder="Beli/kg" 
          value={formData.beli} onChange={e => setFormData({...formData, beli: e.target.value})}
          className="bg-white/10 border-white/10 h-10 text-white font-bold placeholder:text-white/40 placeholder:font-normal"
        />
        <Input 
          type="number" placeholder="Jual/kg" 
          value={formData.jual} onChange={e => setFormData({...formData, jual: e.target.value})}
          className="bg-white/10 border-white/10 h-10 text-white font-bold placeholder:text-white/40 placeholder:font-normal"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-10 bg-white text-emerald-600 hover:bg-white/90 font-black uppercase text-[10px] tracking-widest rounded-xl border-none">
        {loading ? 'Menyimpan...' : 'Update Harga Sekarang'}
      </Button>
    </form>
  )
}

function SourceBadge({ source }) {
  const map = {
    auto_scraper: { label: 'Scraped', color: 'text-sky-400 bg-sky-500/10' },
    manual:       { label: 'Manual',  color: 'text-amber-400 bg-amber-500/10' },
    transaction:  { label: 'Verified', color: 'text-emerald-400 bg-emerald-500/10' },
  }
  const s = map[source] || { label: source, color: 'text-[#4B6478] bg-white/5' }
  return (
    <span className={cn("text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded", s.color)}>
      {s.label}
    </span>
  )
}

function CustomChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111C24] border border-white/10 rounded-xl p-3 shadow-2xl space-y-2">
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/5 pb-1 mb-1">{formatDate(payload[0].payload.date, 'dd MMM')}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-[#4B6478]">Beli</span>
            <span className="text-xs font-black text-white">{payload[0].value.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-emerald-400">Jual</span>
            <span className="text-xs font-black text-emerald-400">{payload[1].value.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}
