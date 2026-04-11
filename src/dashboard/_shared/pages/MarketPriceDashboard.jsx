import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Clock, Zap,
  BarChart3, ShieldCheck, ExternalLink, Globe,
  PieChart, Activity, MapPin, Check, ChevronsUpDown,
  RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { format, startOfWeek, startOfMonth, addDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useMarketTrends } from '@/lib/hooks/useMarketTrends'
import { formatIDR, formatDate, safeNum } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { PROVINCES } from '@/lib/constants/regions'

// ─── Constants ───────────────────────────────────────────────────────────────
const WIB_OFFSET = 7 * 60 * 60 * 1000
const TODAY_STR = new Date(Date.now() + WIB_OFFSET).toISOString().split('T')[0]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
}
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
}

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
  const canWrite = profile?.role === 'owner' || profile?.role === 'staff' || profile?.role === 'superadmin'

  // Province is sourced from tenant account, with manual override on this page
  const [selectedProvince, setSelectedProvince] = useState(
    tenant?.province || 'Jawa Tengah'
  )

  // ── Market Prices (Historical Table + Stats) ───────────────────────────────
  const { data: rawPrices, isLoading } = useQuery({
    queryKey: ['dashboard-market-prices', selectedProvince],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('is_deleted', false)
        .ilike('region', selectedProvince === 'Seluruh Indonesia' ? '%' : selectedProvince)
        .order('price_date', { ascending: false })
        .limit(60)
      if (error) throw error
      return (data || []).map(normaliseRow).filter(r => r.avg_buy_price > 0 && r.avg_sell_price > 0)
    },
    staleTime: 60 * 1000,
  })

  // ── Hybrid Trend Chart ────────────────────────────────────────────────────
  const [trendPeriod, setTrendPeriod] = useState('weekly') // 'weekly' | 'monthly'

  const { trendStartDate, trendEndDate, trendLabel } = useMemo(() => {
    const now = new Date()
    let start, end
    if (trendPeriod === 'weekly') {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end   = now // cap to today
    } else {
      start = startOfMonth(now)
      end   = now
    }
    return {
      trendStartDate: format(start, 'yyyy-MM-dd'),
      trendEndDate:   format(end,   'yyyy-MM-dd'),
      trendLabel:     trendPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'
    }
  }, [trendPeriod])

  const { data: trendData, isLoading: trendLoading } = useMarketTrends(selectedProvince, trendStartDate, trendEndDate)

  // ── Derived Data ──────────────────────────────────────────────────────────
  const dedupedPrices = useMemo(() => {
    if (!rawPrices?.length) return []
    const seen = new Map()
    for (const row of rawPrices) {
      if (!seen.has(row.price_date)) seen.set(row.price_date, row)
    }
    return [...seen.values()].sort((a, b) => b.price_date.localeCompare(a.price_date))
  }, [rawPrices])

  const latestRow = dedupedPrices[0] ?? null
  const prevRow   = dedupedPrices[1] ?? null
  const buyDiff   = latestRow && prevRow ? latestRow.avg_buy_price  - prevRow.avg_buy_price  : 0
  const sellDiff  = latestRow && prevRow ? latestRow.avg_sell_price - prevRow.avg_sell_price : 0

  const avgMargin7d = useMemo(() => {
    const recent = dedupedPrices.slice(0, 7).filter(r => r.broker_margin > 0)
    if (!recent.length) return 0
    return Math.round(recent.reduce((s, r) => s + r.broker_margin, 0) / recent.length)
  }, [dedupedPrices])

  const latestDelta = trendData?.[trendData.length - 1]?.delta ?? 0

  // Spread: broker's latest avg buy price vs Chickin.id reference
  const latestTrend   = trendData?.[trendData.length - 1]
  const spreadVsMarket = (latestTrend?.buyPrice && latestTrend?.chickin)
    ? latestTrend.buyPrice - latestTrend.chickin
    : null

  return (
    <div className="bg-[#06090F] min-h-screen pb-28 relative overflow-hidden">
      {/* BG Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/4 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/3 rounded-full blur-[120px] pointer-events-none" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger} initial="hidden" animate="visible"
        className="px-6 pt-10 pb-6 relative z-10"
      >
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Market Intelligence</span>
            </div>
            <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase leading-none">
              Harga Pasar
            </h1>
            <p className="text-sm text-[#4B6478] font-medium mt-1.5 max-w-md">
              Data harga harian broiler berdasarkan scraper + transaksi nyata platform.
            </p>
          </div>

          {/* Province Filter + Last Updated */}
          <div className="flex items-center gap-3 flex-wrap">
            <ProvinceSelector selected={selectedProvince} onSelect={setSelectedProvince} />

            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <Clock size={13} className="text-[#4B6478]" />
              <span className="text-xs font-bold text-slate-300">
                {latestRow ? formatDate(latestRow.price_date) : 'Belum ada data'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger} initial="hidden" animate="visible"
        className="px-6 grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 relative z-10"
      >
        {[
          { label: 'Harga Beli (Kandang)', value: latestRow?.avg_buy_price, diff: buyDiff,   icon: TrendingDown },
          { label: 'Harga Jual (Pasar)',   value: latestRow?.avg_sell_price, diff: sellDiff,  icon: TrendingUp, highlight: true },
          { label: 'Margin Hari Ini',      value: latestRow?.broker_margin,  sub: 'Hari ini', icon: PieChart },
          {
            label: 'Spread vs Chickin.id',
            value: spreadVsMarket != null ? Math.abs(spreadVsMarket) : null,
            sub: spreadVsMarket != null
              ? (spreadVsMarket > 0 ? '▲ Beli lebih mahal' : spreadVsMarket < 0 ? '▼ Beli lebih murah' : '= Sama')
              : 'Belum ada data',
            icon: Activity,
            spreadPositive: spreadVsMarket != null && spreadVsMarket <= 0
          },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp}>
            <StatCard {...s} isLoading={isLoading || trendLoading} />
          </motion.div>
        ))}
      </motion.section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <section className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        {/* LEFT: Charts + Table */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Hybrid Trend Chart (from Beranda) ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-6 md:p-8 bg-[#0C1319] border-white/5 rounded-[28px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_70%)] pointer-events-none" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={13} className="text-emerald-400" />
                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">
                      Tren Harga — {selectedProvince}
                    </p>
                  </div>
                  <h3 className="text-xl font-display font-black text-white">Hybrid Market Insight</h3>
                    {latestDelta !== 0 && (
                      <div className={cn(
                        "mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                        latestDelta > 0
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      )}>
                        {latestDelta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {latestDelta > 0 ? '+' : ''}{formatIDR(latestDelta)} vs Kemarin
                      </div>
                    )}
                    <span className="mt-1 inline-block text-[10px] font-black text-[#4B6478] uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                      {trendLabel}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-3">
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <button
                      onClick={() => setTrendPeriod('weekly')}
                      className={cn(
                        "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                        trendPeriod === 'weekly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
                      )}
                    >
                      Mingguan
                    </button>
                    <button
                      onClick={() => setTrendPeriod('monthly')}
                      className={cn(
                        "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ml-0.5",
                        trendPeriod === 'monthly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
                      )}
                    >
                      Bulanan
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <LegendItem color="#F59E0B" label="Chickin.id" dashed />
                    <LegendItem color="#10B981" label="Harga Beli" />
                    <LegendItem color="#818CF8" label="Harga Jual" />
                  </div>
                </div>
              </div>

              <div className="h-[240px] w-full relative z-10">
                {trendLoading ? (
                  <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="mpColorBuy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mpColorSell" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818CF8" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#4B6478', fontSize: 10, fontWeight: 800 }}
                        dy={10}
                        interval={trendPeriod === 'monthly' ? 4 : 0}
                      />
                      <YAxis hide domain={['dataMin - 3000', 'dataMax + 2000']} />
                      <RechartsTooltip content={<HybridTooltip />} />
                      {/* Chickin.id reference — dashed amber line */}
                      <Area type="monotone" dataKey="chickin" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" fill="transparent" connectNulls dot={false} />
                      {/* Harga Jual Broker ke RPA — blue fill */}
                      <Area type="monotone" dataKey="sellPrice" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#mpColorSell)" connectNulls activeDot={{ r: 5, stroke: '#0C1319', strokeWidth: 2, fill: '#818CF8' }} />
                      {/* Harga Beli Broker dari Kandang — dominant green line */}
                      <Area type="monotone" dataKey="buyPrice" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#mpColorBuy)" connectNulls activeDot={{ r: 6, stroke: '#0C1319', strokeWidth: 2, fill: '#10B981' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>

          {/* ── Riwayat Harga Table ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Riwayat Update</h3>
              <span className="text-[10px] font-bold text-[#4B6478]">{dedupedPrices.length} records</span>
            </div>
            <Card className="bg-[#0C1319] border-white/5 rounded-[24px] overflow-hidden">
              <ScrollArea className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Tanggal</th>
                      <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Beli</th>
                      <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Jual</th>
                      <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Margin</th>
                      <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-right">Delta</th>
                      <th className="p-4 text-[10px] font-black text-[#4B6478] uppercase text-center">Sumber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array(6).fill(0).map((_, i) => (
                        <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-4 w-full bg-white/5" /></td></tr>
                      ))
                    ) : !dedupedPrices.length ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#4B6478] text-sm font-bold">
                          Belum ada data untuk {selectedProvince}
                        </td>
                      </tr>
                    ) : dedupedPrices.slice(0, 14).map((p, i) => {
                      const isToday = p.price_date === TODAY_STR
                      return (
                        <tr key={i} className={cn(
                          "border-b border-white/5 transition-colors",
                          isToday ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"
                        )}>
                          <td className="p-4 text-xs font-bold text-slate-300 flex items-center gap-2">
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                            {formatDate(p.price_date, 'dd MMM yyyy')}
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-400 text-right tabular-nums">{formatIDR(p.avg_buy_price).replace('Rp ', '')}</td>
                          <td className="p-4 text-xs font-black text-white text-right tabular-nums">{formatIDR(p.avg_sell_price).replace('Rp ', '')}</td>
                          <td className="p-4 text-xs font-bold text-emerald-400 text-right tabular-nums">{formatIDR(p.broker_margin).replace('Rp ', '')}</td>
                          <td className="p-4 text-xs font-bold text-right tabular-nums">
                            {p.price_delta != null ? (
                              <span className={p.price_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {p.price_delta >= 0 ? '▲' : '▼'} {Math.abs(p.price_delta).toLocaleString('id-ID')}
                              </span>
                            ) : <span className="text-[#4B6478]">—</span>}
                          </td>
                          <td className="p-4 text-center"><SourceBadge source={p.source} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT: Actions + Info */}
        <div className="space-y-6">

        {/* ── Data Source Info Card ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="bg-[#0C1319] border border-white/5 rounded-[28px] overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck size={15} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Sumber Data</p>
                    <h3 className="text-sm font-black text-white">Otomatis & Terverifikasi</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <SourceInfoRow
                    color="#F59E0B"
                    label="Chickin.id"
                    desc="Harga pasar realtime dari scraper otomatis"
                    badge="Auto"
                    badgeColor="text-amber-400 bg-amber-500/10"
                  />
                  <SourceInfoRow
                    color="#10B981"
                    label="Transaksi Platform"
                    desc="Rata-rata harga dari transaksi broker yang sudah selesai"
                    badge="Verified"
                    badgeColor="text-emerald-400 bg-emerald-500/10"
                  />
                  <SourceInfoRow
                    color="#818CF8"
                    label="Admin Regional"
                    desc="Data referensi wilayah dari tim admin TernakOS"
                    badge="Admin"
                    badgeColor="text-indigo-400 bg-indigo-500/10"
                  />
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-[#4B6478] font-medium leading-relaxed">
                    ⚠️ Data harga bersifat <span className="text-white font-bold">read-only</span> dan diambil secara otomatis. Input manual tidak diizinkan untuk menjaga integritas data pasar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Wawasan Komoditas ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1 mb-3">Wawasan Komoditas</h3>
            <div className="space-y-3">
              {[
                { title: 'Harga Kandang',    desc: 'Harga ayam hidup di lokasi peternak sebelum distribusi.',   icon: Globe },
                { title: 'Margin Sehat',     desc: 'Range margin ideal broker berkisar Rp 1.500–3.000/kg.',     icon: ShieldCheck },
                { title: 'Volatilitas Pasar',desc: 'Dipengaruhi ketersediaan DOC, pakan, dan hari besar.',      icon: TrendingUp },
              ].map((item, i) => (
                <Card key={i} className="bg-[#111C24] border border-white/5 rounded-2xl hover:border-white/10 transition-all cursor-default group">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors text-[#4B6478]">
                      <item.icon size={17} />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[11px] text-[#4B6478] font-medium leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* ── Public Link ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="bg-[#0C1319] border border-dashed border-white/10 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <ExternalLink size={17} className="text-[#4B6478]" />
              </div>
              <p className="text-xs font-bold text-slate-400 mb-4">
                Lihat visualisasi publik & SEO untuk landing page.
              </p>
              <Button variant="outline" className="w-full bg-transparent border-white/10 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl" asChild>
                <a href="/harga-pasar" target="_blank">Kunjungi Link Publik</a>
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

// ─── Province Selector ────────────────────────────────────────────────────────
function ProvinceSelector({ selected, onSelect }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-10 bg-[#111C24] border-white/10 font-black rounded-xl flex justify-between items-center px-4 gap-3 uppercase tracking-widest hover:bg-white/5 transition-all text-[10px] min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-emerald-400 shrink-0" />
            <span className="truncate">{selected}</span>
          </div>
          <ChevronsUpDown size={13} className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0 bg-[#111C24] border-white/10 shadow-2xl">
        <Command className="bg-transparent">
          <CommandInput placeholder="Cari provinsi..." className="h-11 font-bold" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-4 text-center text-[10px] font-black uppercase opacity-50">Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {['Seluruh Indonesia', ...PROVINCES].map(p => (
                <CommandItem
                  key={p} value={p}
                  onSelect={() => { onSelect(p); setOpen(false) }}
                  className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-emerald-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <span className={cn(selected === p ? 'text-emerald-400' : 'text-white')}>{p}</span>
                  {selected === p && <Check size={13} className="text-emerald-400" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, diff, sub, icon: Icon, isLoading, highlight }) {
  return (
    <Card className={cn(
      "border-white/5 rounded-[20px] transition-all",
      highlight ? "bg-[#0C1319] border-emerald-500/20" : "bg-[#0C1319]/60"
    )}>
      <CardContent className="p-4 md:p-5">
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-3 w-20 bg-white/5" /><Skeleton className="h-8 w-full bg-white/5" /></div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-tight">{label}</span>
              <Icon size={13} className={cn(highlight ? 'text-emerald-400' : 'text-[#4B6478]')} />
            </div>
            <div>
              <span className={cn("text-2xl font-black tabular-nums tracking-tight block", highlight ? 'text-emerald-400' : 'text-white')}>
                {value > 0 ? formatIDR(value).replace('Rp ', '') : '—'}
              </span>
              {diff !== undefined && (
                <span className={cn("text-[9px] font-black flex items-center gap-0.5 uppercase mt-0.5",
                  diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-[#4B6478]'
                )}>
                  {diff > 0 ? '▲' : diff < 0 ? '▼' : '●'} {Math.abs(diff).toLocaleString('id-ID')}
                </span>
              )}
              {sub && <span className="text-[10px] font-bold text-[#4B6478] mt-0.5 block">{sub}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── SourceInfoRow ────────────────────────────────────────────────────────────
function SourceInfoRow({ color, label, desc, badge, badgeColor }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-black text-white uppercase tracking-tight">{label}</span>
          <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded', badgeColor)}>{badge}</span>
        </div>
        <p className="text-[10px] text-[#4B6478] font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── LegendItem ──────────────────────────────────────────────────────────────
function LegendItem({ color, label, dashed = false }) {
  return (
    <div className="hidden md:flex items-center gap-2">
      {dashed
        ? <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
        : <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
      <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── HybridTooltip ────────────────────────────────────────────────────────────
function HybridTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const spread = (d.buyPrice && d.chickin) ? d.buyPrice - d.chickin : null
  return (
    <div className="bg-[#0C1319] border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-xl">
      <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-3">{d.displayDate}</p>
      <div className="space-y-2">
        {[
          { label: 'Chickin.id (Ref)',    val: d.chickin,   color: 'text-amber-400',   dashed: true },
          { label: 'Harga Beli (Pasar)',  val: d.buyPrice,  color: 'text-emerald-400' },
          { label: 'Harga Jual (Pasar)',  val: d.sellPrice, color: 'text-indigo-400' },
        ].map(({ label, val, color, dashed }) => (
          <div key={label} className="flex justify-between items-center gap-4">
            <span className={cn('text-[10px] font-bold', dashed ? 'text-amber-400/70' : 'text-[#94A3B8]')}>{label}</span>
            <span className={cn('text-sm font-black tabular-nums', val ? color : 'text-[#4B6478]')}>
              {val ? formatIDR(val) : '—'}
            </span>
          </div>
        ))}
      </div>
      {d.spread != null && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-wider">Efisiensi Beli vs Chickin</span>
            <span className={cn('text-xs font-black tabular-nums', d.spread >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {d.spread > 0 ? '+' : ''}{formatIDR(d.spread)}
            </span>
          </div>
          {d.margin != null && (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-wider">Margin/kg (Pasar)</span>
              <span className={cn('text-xs font-black tabular-nums', d.margin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {d.margin > 0 ? '+' : ''}{formatIDR(d.margin)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SourceBadge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  const map = {
    auto_scraper: { label: 'Scraped', color: 'text-sky-400 bg-sky-500/10' },
    manual:       { label: 'Manual',  color: 'text-amber-400 bg-amber-500/10' },
    transaction:  { label: 'Verified', color: 'text-emerald-400 bg-emerald-500/10' },
  }
  const s = map[source] || { label: source || '—', color: 'text-[#4B6478] bg-white/5' }
  return (
    <span className={cn('text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg', s.color)}>
      {s.label}
    </span>
  )
}
