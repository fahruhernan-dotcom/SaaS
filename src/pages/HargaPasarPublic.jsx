/**
 * HargaPasarPublic.jsx
 * Route: /harga-pasar (PUBLIC - no auth required)
 *
 * Halaman publik monitoring harga ayam & komoditas.
 * Dirancang untuk:
 *  1. SEO - konten ter-render penuh, bisa dibaca Google Bot
 *  2. Lead magnet - pengunjung tanpa akun tetap bisa akses
 *  3. Reuse komponen dari HargaPasar.jsx tapi tanpa tenant_id / useAuth
 *
 * Data source: tabel `market_prices` (global, bukan per-tenant)
 * Kolom yang dipakai: price_date, chicken_type, region,
 *   farm_gate_price, avg_buy_price, avg_sell_price,
 *   buyer_price, broker_margin, source
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Minus,
  Clock, BarChart3, Info, ExternalLink,
  ChevronRight, ShieldCheck, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatIDR, formatDate, safeNum } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// ─── Constants ───────────────────────────────────────────────────────────────

const WIB_OFFSET = 7 * 60 * 60 * 1000
const TODAY = new Date(Date.now() + WIB_OFFSET).toISOString().split('T')[0]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise satu row: fallback ke kolom lama jika kolom baru null.
 * avg_buy_price  → farm_gate_price (harga di kandang)
 * avg_sell_price → buyer_price     (harga di pembeli/pasar)
 */
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, isLoading }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'   ? 'text-emerald-400' :
    trend === 'down' ? 'text-red-400'      : 'text-text-secondary'

  return (
    <Card className="bg-bg-1 border-white/5">
      <CardContent className="p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-3 w-20 mb-3 bg-white/5" />
            <Skeleton className="h-7 w-32 mb-2 bg-white/5" />
            <Skeleton className="h-3 w-16 bg-white/5" />
          </>
        ) : (
          <>
            <p className="text-xs text-text-secondary mb-1">{label}</p>
            <p className="text-2xl font-semibold text-text-primary tracking-tight">{value}</p>
            <div className={cn('flex items-center gap-1 mt-1 text-xs', trendColor)}>
              <Icon size={12} />
              <span>{sub}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SourceBadge({ source }) {
  const map = {
    auto_scraper: { label: 'Auto Scraper', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    manual:       { label: 'Input Manual', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    transaction:  { label: 'Transaksi',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  }
  const { label, color } = map[source] ?? { label: source, color: 'bg-white/5 text-text-secondary' }
  return (
    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', color)}>
      {label}
    </span>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-1 border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-secondary mb-2">{formatShortDate(label)}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-text-primary font-medium">{formatIDR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HargaPasarPublic() {

  // ── Data fetching (GLOBAL - no tenant filter) ──────────────────────────────
  const { data: rawPrices, isLoading } = useQuery({
    queryKey: ['public-market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select(
          'id, price_date, chicken_type, region, ' +
          'farm_gate_price, avg_buy_price, avg_sell_price, ' +
          'buyer_price, broker_margin, source, source_url'
        )
        .eq('is_deleted', false)
        .order('price_date', { ascending: false })
        .order('source',     { ascending: true })   // 'transaction' sorts before 'manual'/'import'
        .order('region',     { ascending: false })
        .limit(60)

      if (error) throw error
      return (data || []).map(normaliseRow)
    },
    staleTime: 5 * 60 * 1000, // 5 menit — cukup untuk halaman publik
  })

  // ── Derived data ───────────────────────────────────────────────────────────

  // Deduplicate by date — keep one row per date, preferring source='transaction'
  const dedupedPrices = useMemo(() => {
    if (!rawPrices?.length) return []
    const seen = new Map()
    for (const row of rawPrices) {
      const existing = seen.get(row.price_date)
      if (!existing || row.source === 'transaction') {
        seen.set(row.price_date, row)
      }
    }
    // Re-sort by date desc (Map insertion order is already date-desc from query)
    return [...seen.values()].sort((a, b) => b.price_date.localeCompare(a.price_date))
  }, [rawPrices])

  // Harga terbaru — setelah dedup, baris pertama sudah terbaik per tanggal
  const latestRow = useMemo(() => dedupedPrices[0] ?? null, [dedupedPrices])

  // Harga sebelumnya untuk kalkulasi trend
  const prevRow = useMemo(() => dedupedPrices[1] ?? null, [dedupedPrices])

  // Trend beli
  const buyTrend = useMemo(() => {
    if (!latestRow || !prevRow) return { dir: 'flat', diff: 0 }
    const diff = latestRow.avg_buy_price - prevRow.avg_buy_price
    return { dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', diff }
  }, [latestRow, prevRow])

  // Trend jual
  const sellTrend = useMemo(() => {
    if (!latestRow || !prevRow) return { dir: 'flat', diff: 0 }
    const diff = latestRow.avg_sell_price - prevRow.avg_sell_price
    return { dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', diff }
  }, [latestRow, prevRow])

  // Data chart — 14 hari terakhir, urut ascending
  const chartData = useMemo(() => {
    if (!dedupedPrices.length) return []
    return [...dedupedPrices]
      .filter(r => r.avg_buy_price > 0 && r.avg_sell_price > 0)
      .slice(0, 14)
      .reverse()
      .map(r => ({
        date:         r.price_date,
        'Harga Beli': r.avg_buy_price,
        'Harga Jual': r.avg_sell_price,
        'Margin':     r.broker_margin,
      }))
  }, [dedupedPrices])

  // Tabel history — 10 baris (deduped, one per date)
  const tableRows = useMemo(() => dedupedPrices.slice(0, 10), [dedupedPrices])

  // Avg margin 7 hari
  const avgMargin7d = useMemo(() => {
    if (!dedupedPrices.length) return 0
    const recent = dedupedPrices.slice(0, 7).filter(r => r.broker_margin > 0)
    if (!recent.length) return 0
    return Math.round(recent.reduce((s, r) => s + r.broker_margin, 0) / recent.length)
  }, [dedupedPrices])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-bg-base min-h-screen text-text-primary font-body relative overflow-hidden">
      
      {/* ── BACKGROUND GLOW DECORATIONS ── */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-[20%] w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none opacity-50" />

      {/* ── NAVBAR ── */}
      <Navbar />
      
      {/* Spacer to clear fixed Navbar */}
      <div className="h-16 md:h-20" />

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-20 md:space-y-28 relative z-10">

        {/* ── HERO SECTION ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-2 w-2 rounded-full bg-emerald-400">
               <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Update Harian</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-text-primary leading-[1.1] tracking-tight uppercase max-w-3xl">
            Harga Ayam & <span className="text-emerald-500">Komoditas</span> Hari Ini
          </h1>
          <p className="text-text-secondary text-sm md:text-base font-medium max-w-2xl leading-relaxed mt-4">
            Data harga pasar terkini untuk peternak, broker, dan agen sembako.
            Diperbarui setiap hari dari sumber terpercaya untuk membantu pengambilan keputusan bisnis Anda.
          </p>
          {latestRow && (
            <div className="flex items-center gap-2 text-xs text-text-secondary pt-1">
              <Clock size={12} />
              <span>
                Terakhir diperbarui:{' '}
                {new Date(latestRow.price_date + 'T00:00:00').toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
              {latestRow.source_url && (
                <a
                  href={latestRow.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  Sumber <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </motion.section>

        {/* ── STAT CARDS ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          <StatCard
            label="Harga Beli (Kandang)"
            value={isLoading ? '—' : formatIDR(latestRow?.avg_buy_price)}
            sub={
              buyTrend.dir === 'flat'
                ? 'Stabil'
                : `${buyTrend.dir === 'up' ? '+' : ''}${formatIDR(buyTrend.diff)} dari kemarin`
            }
            trend={buyTrend.dir}
            isLoading={isLoading}
          />
          <StatCard
            label="Harga Jual (Pasar)"
            value={isLoading ? '—' : formatIDR(latestRow?.avg_sell_price)}
            sub={
              sellTrend.dir === 'flat'
                ? 'Stabil'
                : `${sellTrend.dir === 'up' ? '+' : ''}${formatIDR(sellTrend.diff)} dari kemarin`
            }
            trend={sellTrend.dir}
            isLoading={isLoading}
          />
          <StatCard
            label="Margin Broker (Hari Ini)"
            value={isLoading ? '—' : formatIDR(latestRow?.broker_margin)}
            sub="Selisih beli → jual"
            trend="flat"
            isLoading={isLoading}
          />
          <StatCard
            label="Rata-rata Margin (7 Hari)"
            value={isLoading ? '—' : formatIDR(avgMargin7d)}
            sub="Rata-rata 7 hari terakhir"
            trend="flat"
            isLoading={isLoading}
          />
        </motion.section>

        {/* ── AREA CHART ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-bg-1 border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-400" />
                  <h2 className="text-sm font-medium text-text-primary">
                    Tren Harga 14 Hari Terakhir
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs border-white/10 text-text-secondary">
                  {latestRow?.region ?? 'Nasional'}
                </Badge>
              </div>

              {isLoading ? (
                <Skeleton className="h-56 w-full bg-white/5 rounded-lg" />
              ) : chartData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-text-secondary">
                  Data belum tersedia
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
                    <defs>
                      <linearGradient id="gradBuy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gradSell" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#94A3B8', paddingTop: 8 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Harga Beli"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#gradBuy)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#10B981' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Harga Jual"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fill="url(#gradSell)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6366F1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* ── HISTORY TABLE ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-bg-1 border-white/5">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">
                    Riwayat Harga Terbaru
                  </h2>
                  <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest font-bold">Data 10 Transaksi Terakhir</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex h-8 px-3 items-center rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Live Database
                   </div>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full bg-white/5 rounded" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-text-secondary">
                        <th className="text-left pb-2 font-medium">Tanggal</th>
                        <th className="text-left pb-2 font-medium">Wilayah</th>
                        <th className="text-right pb-2 font-medium">Harga Beli</th>
                        <th className="text-right pb-2 font-medium">Harga Jual</th>
                        <th className="text-right pb-2 font-medium">Margin</th>
                        <th className="text-left pb-2 font-medium pl-3">Sumber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr
                          key={row.id}
                          className={cn(
                            'border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group',
                            i === 0 && 'bg-emerald-500/5 relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-emerald-500'
                          )}
                        >
                          <td className="py-2.5 text-text-primary">
                            {formatShortDate(row.price_date)}
                            {row.price_date === TODAY && (
                              <span className="ml-2 text-[10px] text-emerald-400 font-medium">Hari ini</span>
                            )}
                          </td>
                          <td className="py-2.5 text-text-secondary capitalize">
                            {row.region ?? 'Nasional'}
                          </td>
                          <td className="py-2.5 text-right text-text-primary tabular-nums">
                            {formatIDR(row.avg_buy_price)}
                          </td>
                          <td className="py-2.5 text-right text-text-primary tabular-nums">
                            {formatIDR(row.avg_sell_price)}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            <span className={row.broker_margin > 0 ? 'text-emerald-400' : 'text-text-secondary'}>
                              {formatIDR(row.broker_margin)}
                            </span>
                          </td>
                          <td className="py-2.5 pl-3">
                            <SourceBadge source={row.source} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="text-center mb-10 md:mb-16">
             <h2 className="text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tight">Wawasan Komoditas</h2>
             <p className="text-xs text-text-secondary mt-2 uppercase tracking-widest font-bold">Edukasi & Dasar Bisnis Peternakan</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: <Info size={20} className="text-emerald-400" />,
                title: 'Apa itu Harga Kandang?',
                body: 'Harga kandang (farm gate price) adalah harga ayam hidup saat masih di lokasi peternak, sebelum biaya transportasi dan distribusi. Ini adalah acuan utama bagi peternak mandiri untuk menghitung keuntungan per kg.',
              },
              {
                icon: <TrendingUp size={20} className="text-emerald-400" />,
                title: 'Cara Hitung Margin Broker',
                body: 'Margin broker adalah selisih antara harga beli di kandang dan harga jual ke pasar/RPA. Margin sehat biasanya berkisar Rp 1.500–3.000/kg. Pantau margin harian agar tidak rugi akibat fluktuasi harga yang tiba-tiba.',
              },
              {
                icon: <Zap size={20} className="text-emerald-400" />,
                title: 'Kenapa Harga Bisa Berubah?',
                body: 'Harga ayam broiler dipengaruhi oleh ketersediaan DOC (Day-Old Chick), biaya pakan (jagung & kedelai), hari besar nasional, dan permintaan dari RPA. Pantau tren 14 hari untuk mengambil keputusan jual yang tepat.',
              },
            ].map(({ icon, title, body }) => (
              <Card key={title} className="bg-bg-1 border-white/5 hover:border-emerald-500/20 transition-all duration-300 group">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      {icon}
                    </div>
                    <h3 className="text-base font-bold text-text-primary uppercase tracking-tight">{title}</h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed font-medium">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ── CTA LEAD MAGNET ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-bg-1 border-white/10 overflow-hidden relative group hover:border-emerald-500/30 transition-all duration-500">
            {/* Subtle gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-8 md:p-12 relative">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-black uppercase tracking-widest">Premium Management Tool</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-text-primary leading-tight uppercase tracking-tight">
                    Pantau harga sekaligus <br className="hidden md:block" />
                    kelola transaksi <span className="text-emerald-500">dalam satu aplikasi</span>
                  </h2>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
                    TernakOS menggabungkan monitoring harga pasar dengan manajemen nota,
                    piutang, dan recording kandang — semua dalam satu genggaman. Efisiensi total untuk bisnis peternakan Anda.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0">
                  <Button
                    className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    asChild
                  >
                    <Link to="/register">
                      Coba Gratis Sekarang <ChevronRight size={18} className="ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 px-8 border-white/10 bg-white/5 text-text-primary hover:bg-white/10 hover:border-white/20 text-[13px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                    asChild
                  >
                    <a
                      href="https://wa.me/628123456789?text=Halo%2C%20saya%20tertarik%20coba%20TernakOS"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Hubungi via WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

      </main>

      {/* ── FOOTER ── */}
      <Footer />

    </div>
  )
}
